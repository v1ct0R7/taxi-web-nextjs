import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { RIDE_STATUSES, RIDE_TYPES } from "../config/constants.js";
import { activityLogModel, adminModel, driverModel, returnPromoModel, rideModel } from "../models/index.js";
import { createToken } from "../middleware/auth.js";
import { logActivity } from "../utils/activity.js";
import { cancelRide } from "../utils/rideLifecycle.js";

const loginAdmin = async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const { password } = req.body;
    if (!email || typeof password !== "string" || !password || password.length > 128) {
        return res.status(400).json({ success: false, message: "Shkruaj email-in dhe fjalëkalimin" });
    }
    try {
        const admin = await adminModel.findOne({ where: { email } });
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ success: false, message: "Email ose fjalëkalim i gabuar" });
        }
        await logActivity({ actorType: "admin", actorId: admin.id, action: "admin_login", details: admin.name });
        res.json({ success: true, token: createToken(admin.id, "admin"), name: admin.name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të hysh tani" });
    }
};

const dashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [pending, inProgress, completedToday, cancelledToday, revenueToday, revenueTotal, driversByStatus, activePromos, recentRides] = await Promise.all([
            rideModel.count({ where: { status: "pending" } }),
            rideModel.count({ where: { status: { [Op.in]: ["accepted", "picked_up"] } } }),
            rideModel.count({ where: { status: "completed", completedAt: { [Op.gte]: today } } }),
            rideModel.count({ where: { status: "cancelled", cancelledAt: { [Op.gte]: today } } }),
            rideModel.sum("price", { where: { status: "completed", completedAt: { [Op.gte]: today } } }),
            rideModel.sum("price", { where: { status: "completed" } }),
            driverModel.findAll({ attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]], where: { active: true }, group: ["status"], raw: true }),
            returnPromoModel.count({ where: { status: "active", expiresAt: { [Op.gt]: new Date() } } }),
            rideModel.findAll({ include: [{ model: driverModel, as: "driver", attributes: ["id", "name", "plateNumber"] }], order: [["createdAt", "DESC"]], limit: 8 }),
        ]);
        const drivers = { available: 0, busy: 0, offline: 0 };
        driversByStatus.forEach((row) => { drivers[row.status] = Number(row.count); });
        res.json({
            success: true,
            data: {
                pending, inProgress, completedToday, cancelledToday,
                revenueToday: Number(revenueToday) || 0,
                revenueTotal: Number(revenueTotal) || 0,
                drivers, activePromos, recentRides,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohen statistikat" });
    }
};

const listRides = async (req, res) => {
    const where = {};
    const { status, type, q } = req.query;
    if (RIDE_STATUSES.includes(status)) where.status = status;
    if (status === "active") where.status = { [Op.in]: ["pending", "accepted", "picked_up"] };
    if (RIDE_TYPES.includes(type)) where.type = type;
    if (typeof q === "string" && q.trim()) {
        const term = `%${q.trim().slice(0, 50)}%`;
        where[Op.or] = [
            { phone: { [Op.like]: term } },
            { pickupAddress: { [Op.like]: term } },
            { dropoffAddress: { [Op.like]: term } },
            { destinationCity: { [Op.like]: term } },
            ...(Number.isInteger(Number(q)) ? [{ id: Number(q) }] : []),
        ];
    }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 25;
    try {
        const { rows, count } = await rideModel.findAndCountAll({
            where,
            include: [{ model: driverModel, as: "driver", attributes: ["id", "name", "phone", "plateNumber"] }],
            order: [["createdAt", "DESC"]],
            limit,
            offset: (page - 1) * limit,
        });
        res.json({ success: true, data: rows, total: count, page, pages: Math.max(1, Math.ceil(count / limit)) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohen porositë" });
    }
};

const rideDetails = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "Porosia nuk është e vlefshme" });
    try {
        const ride = await rideModel.findByPk(id, {
            include: [
                { model: driverModel, as: "driver", attributes: ["id", "name", "phone", "carModel", "plateNumber"] },
                { model: activityLogModel, as: "activity" },
            ],
            order: [[{ model: activityLogModel, as: "activity" }, "createdAt", "ASC"]],
        });
        if (!ride) return res.status(404).json({ success: false, message: "Porosia nuk u gjet" });
        res.json({ success: true, data: ride });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohet porosia" });
    }
};

const adminCancelRide = async (req, res) => {
    const rideId = Number(req.body.rideId);
    if (!Number.isInteger(rideId)) return res.status(400).json({ success: false, message: "Porosia nuk është e vlefshme" });
    try {
        const result = await sequelize.transaction(async (transaction) => {
            const ride = await rideModel.findByPk(rideId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!ride) return { status: 404, message: "Porosia nuk u gjet" };
            if (!["pending", "accepted", "picked_up"].includes(ride.status)) return { status: 409, message: "Porosia nuk është aktive" };
            const reason = typeof req.body.reason === "string" && req.body.reason.trim() ? req.body.reason.trim().slice(0, 300) : "Anuluar nga administratori";
            await cancelRide(ride, { by: "admin", actorId: req.admin.id, reason }, transaction);
            return { status: 200 };
        });
        if (result.status !== 200) return res.status(result.status).json({ success: false, message: result.message });
        res.json({ success: true, message: "Porosia u anulua" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të anulohet porosia" });
    }
};

const activityFeed = async (req, res) => {
    const where = {};
    if (["client", "driver", "admin", "system"].includes(req.query.actorType)) where.actorType = req.query.actorType;
    const afterId = Number(req.query.afterId);
    if (Number.isInteger(afterId) && afterId > 0) where.id = { [Op.gt]: afterId };
    try {
        const logs = await activityLogModel.findAll({ where, order: [["id", "DESC"]], limit: 150 });
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohet aktiviteti" });
    }
};

export { loginAdmin, dashboardStats, listRides, rideDetails, adminCancelRide, activityFeed };
