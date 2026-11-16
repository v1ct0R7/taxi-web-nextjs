import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { driverModel, rideModel } from "../models/index.js";
import { createToken } from "../middleware/auth.js";
import { normalizePhone } from "../utils/phone.js";
import { logActivity } from "../utils/activity.js";
import { cancelRide, createReturnPromo } from "../utils/rideLifecycle.js";

const cleanText = (value, max = 255) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const publicDriver = (driver) => ({
    id: driver.id, name: driver.name, phone: driver.phone, carModel: driver.carModel,
    plateNumber: driver.plateNumber, status: driver.status, active: driver.active,
});

// ---------- Shoferi ----------

const loginDriver = async (req, res) => {
    const phone = normalizePhone(req.body.phone);
    const { password } = req.body;
    if (!phone || typeof password !== "string" || !password || password.length > 128) {
        return res.status(400).json({ success: false, message: "Shkruaj numrin e telefonit dhe fjalëkalimin" });
    }
    try {
        const driver = await driverModel.scope("withPassword").findOne({ where: { phone } });
        if (!driver || !(await bcrypt.compare(password, driver.password))) {
            return res.status(401).json({ success: false, message: "Numri ose fjalëkalimi është i gabuar" });
        }
        if (!driver.active) return res.status(403).json({ success: false, message: "Llogaria jote është çaktivizuar. Kontakto administratorin" });
        await logActivity({ actorType: "driver", actorId: driver.id, action: "driver_login", details: driver.name });
        res.json({ success: true, token: createToken(driver.id, "driver"), data: publicDriver(driver) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të hysh tani" });
    }
};

const driverProfile = async (req, res) => {
    res.json({ success: true, data: publicDriver(req.driver) });
};

const activeRideOf = (driverId, transaction) => rideModel.findOne({
    where: { driverId, status: { [Op.in]: ["accepted", "picked_up"] } },
    transaction,
});

const updateDriverStatus = async (req, res) => {
    const { status } = req.body;
    if (!["available", "offline"].includes(status)) {
        return res.status(400).json({ success: false, message: "Statusi duhet të jetë 'available' ose 'offline'" });
    }
    try {
        if (await activeRideOf(req.driver.id)) {
            return res.status(409).json({ success: false, message: "Përfundo udhëtimin aktual para se të ndryshosh statusin" });
        }
        await req.driver.update({ status });
        await logActivity({ actorType: "driver", actorId: req.driver.id, action: status === "available" ? "driver_online" : "driver_offline", details: req.driver.name });
        res.json({ success: true, message: status === "available" ? "Je në dispozicion" : "Je jashtë linje", data: publicDriver(req.driver) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ndryshohet statusi" });
    }
};

// Kërkesat që sheh shoferi: të hapurat (kur është në dispozicion) + kthimet e rezervuara për të
const driverRequests = async (req, res) => {
    try {
        const where = req.driver.status === "available"
            ? { status: "pending", [Op.or]: [{ driverId: null }, { driverId: req.driver.id }] }
            : { status: "pending", driverId: req.driver.id };
        const rides = await rideModel.findAll({ where, order: [["createdAt", "ASC"]], limit: 50 });
        res.json({ success: true, data: rides });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohen kërkesat" });
    }
};

const currentRide = async (req, res) => {
    try {
        const ride = await activeRideOf(req.driver.id);
        res.json({ success: true, data: ride, driver: publicDriver(req.driver) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohet udhëtimi" });
    }
};

const runRideAction = async (req, res, handler) => {
    const rideId = Number(req.body.rideId);
    if (!Number.isInteger(rideId)) return res.status(400).json({ success: false, message: "Porosia nuk është e vlefshme" });
    try {
        const result = await sequelize.transaction(async (transaction) => {
            const driver = await driverModel.findByPk(req.driver.id, { transaction, lock: transaction.LOCK.UPDATE });
            const ride = await rideModel.findByPk(rideId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!ride) return { status: 404, message: "Porosia nuk u gjet" };
            return handler({ driver, ride, transaction });
        });
        if (result.status >= 400) return res.status(result.status).json({ success: false, message: result.message });
        res.json({ success: true, message: result.message, data: result.ride });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Veprimi nuk u krye" });
    }
};

const acceptRide = (req, res) => runRideAction(req, res, async ({ driver, ride, transaction }) => {
    if (ride.status !== "pending" || (ride.driverId && ride.driverId !== driver.id)) {
        return { status: 409, message: "Kjo porosi është marrë nga një shofer tjetër ose është anuluar" };
    }
    if (driver.status !== "available" || await activeRideOf(driver.id, transaction)) {
        return { status: 409, message: "Duhet të jesh në dispozicion dhe pa udhëtim aktiv për të pranuar" };
    }
    await ride.update({ status: "accepted", driverId: driver.id, acceptedAt: new Date() }, { transaction });
    await driver.update({ status: "busy" }, { transaction });
    await logActivity({ actorType: "driver", actorId: driver.id, action: "ride_accepted", rideId: ride.id, details: `${driver.name} (${driver.plateNumber})` }, transaction);
    await createReturnPromo(ride, transaction);
    return { status: 200, message: "Porosia u pranua", ride };
});

const pickupRide = (req, res) => runRideAction(req, res, async ({ driver, ride, transaction }) => {
    if (ride.driverId !== driver.id || ride.status !== "accepted") {
        return { status: 409, message: "Ky udhëtim nuk mund të niset" };
    }
    await ride.update({ status: "picked_up", pickedUpAt: new Date() }, { transaction });
    await logActivity({ actorType: "driver", actorId: driver.id, action: "ride_picked_up", rideId: ride.id, details: driver.name }, transaction);
    return { status: 200, message: "Klienti u mor — udhëtim i mbarë", ride };
});

const dropoffRide = (req, res) => runRideAction(req, res, async ({ driver, ride, transaction }) => {
    if (ride.driverId !== driver.id || ride.status !== "picked_up") {
        return { status: 409, message: "Ky udhëtim nuk mund të përfundohet" };
    }
    await ride.update({ status: "completed", completedAt: new Date() }, { transaction });
    await driver.update({ status: "available" }, { transaction });
    await logActivity({ actorType: "driver", actorId: driver.id, action: "ride_completed", rideId: ride.id, details: `${driver.name}, €${ride.price}` }, transaction);
    return { status: 200, message: "Udhëtimi përfundoi. Je sërish në dispozicion", ride };
});

// Shoferi anulon një udhëtim të pranuar (p.sh. klienti nuk u paraqit)
const cancelDriverRide = (req, res) => runRideAction(req, res, async ({ driver, ride, transaction }) => {
    if (ride.driverId !== driver.id || ride.status !== "accepted") {
        return { status: 409, message: "Mund të anulosh vetëm një udhëtim të pranuar që nuk ka nisur" };
    }
    await cancelRide(ride, { by: "driver", actorId: driver.id, reason: cleanText(req.body.reason, 300) || "Anuluar nga shoferi", closePromo: true }, transaction);
    return { status: 200, message: "Udhëtimi u anulua", ride };
});

// Shoferi refuzon një kërkesë kthimi që ishte rezervuar për të
const declineRide = (req, res) => runRideAction(req, res, async ({ driver, ride, transaction }) => {
    if (ride.driverId !== driver.id || ride.status !== "pending") {
        return { status: 409, message: "Kjo kërkesë nuk mund të refuzohet" };
    }
    await cancelRide(ride, { by: "driver", actorId: driver.id, reason: "Shoferi nuk mund ta kryejë kthimin", closePromo: true }, transaction);
    return { status: 200, message: "Kërkesa u refuzua", ride };
});

const driverHistory = async (req, res) => {
    try {
        const rides = await rideModel.findAll({
            where: { driverId: req.driver.id, status: { [Op.in]: ["completed", "cancelled"] } },
            order: [["updatedAt", "DESC"]],
            limit: 50,
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedToday = rides.filter((ride) => ride.status === "completed" && ride.completedAt >= today);
        res.json({
            success: true,
            data: rides,
            summary: {
                todayRides: completedToday.length,
                todayEarnings: Math.round(completedToday.reduce((total, ride) => total + ride.price, 0) * 100) / 100,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohet historiku" });
    }
};

// ---------- Admin: menaxhimi i shoferëve ----------

const listDrivers = async (req, res) => {
    try {
        const drivers = await driverModel.findAll({ order: [["createdAt", "DESC"]] });
        const counts = await rideModel.findAll({
            attributes: ["driverId", [sequelize.fn("COUNT", sequelize.col("id")), "completed"]],
            where: { status: "completed", driverId: { [Op.ne]: null } },
            group: ["driverId"],
            raw: true,
        });
        const completedByDriver = Object.fromEntries(counts.map((row) => [row.driverId, Number(row.completed)]));
        res.json({ success: true, data: drivers.map((driver) => ({ ...publicDriver(driver), lastSeenAt: driver.lastSeenAt, createdAt: driver.createdAt, completedRides: completedByDriver[driver.id] || 0 })) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohen shoferët" });
    }
};

const addDriver = async (req, res) => {
    const name = cleanText(req.body.name, 100);
    const phone = normalizePhone(req.body.phone);
    const carModel = cleanText(req.body.carModel, 80);
    const plateNumber = cleanText(req.body.plateNumber, 20).toUpperCase();
    const { password } = req.body;
    if (!name || !phone || !carModel || !plateNumber || typeof password !== "string" || password.length < 6 || password.length > 128) {
        return res.status(400).json({ success: false, message: "Plotëso emrin, telefonin, makinën, targën dhe një fjalëkalim me të paktën 6 karaktere" });
    }
    try {
        const driver = await driverModel.create({ name, phone, carModel, plateNumber, password: await bcrypt.hash(password, 10) });
        await logActivity({ actorType: "admin", actorId: req.admin.id, action: "driver_created", details: `${name} (${plateNumber})` });
        res.status(201).json({ success: true, message: "Shoferi u shtua", data: publicDriver(driver) });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({ success: false, message: "Ekziston një shofer me këtë telefon ose targë" });
        }
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të shtohet shoferi" });
    }
};

const updateDriver = async (req, res) => {
    const id = Number(req.body.id);
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "Shoferi nuk është i vlefshëm" });
    try {
        const driver = await driverModel.findByPk(id);
        if (!driver) return res.status(404).json({ success: false, message: "Shoferi nuk u gjet" });
        const changes = {};
        if (typeof req.body.active === "boolean") {
            if (!req.body.active && await activeRideOf(driver.id)) {
                return res.status(409).json({ success: false, message: "Shoferi ka një udhëtim aktiv" });
            }
            changes.active = req.body.active;
            if (!req.body.active) changes.status = "offline";
        }
        if (req.body.password !== undefined) {
            if (typeof req.body.password !== "string" || req.body.password.length < 6 || req.body.password.length > 128) {
                return res.status(400).json({ success: false, message: "Fjalëkalimi duhet të ketë të paktën 6 karaktere" });
            }
            changes.password = await bcrypt.hash(req.body.password, 10);
        }
        for (const field of ["name", "carModel"]) {
            if (typeof req.body[field] === "string" && req.body[field].trim()) changes[field] = cleanText(req.body[field], field === "name" ? 100 : 80);
        }
        if (!Object.keys(changes).length) return res.status(400).json({ success: false, message: "Asgjë për të ndryshuar" });
        await driver.update(changes);
        await logActivity({ actorType: "admin", actorId: req.admin.id, action: "driver_updated", details: `${driver.name}: ${Object.keys(changes).filter((key) => key !== "password").concat(changes.password ? ["fjalëkalimi"] : []).join(", ")}` });
        res.json({ success: true, message: "Shoferi u përditësua", data: publicDriver(driver) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të përditësohet shoferi" });
    }
};

export {
    loginDriver, driverProfile, updateDriverStatus, driverRequests, currentRide,
    acceptRide, pickupRide, dropoffRide, cancelDriverRide, declineRide, driverHistory,
    listDrivers, addDriver, updateDriver,
};
