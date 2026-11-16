import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { HOME_CITY } from "../config/constants.js";
import { driverModel, returnPromoModel, rideModel } from "../models/index.js";
import { normalizePhone } from "../utils/phone.js";
import { parsePoint, isInsideTirana } from "../utils/pricing.js";
import { logActivity } from "../utils/activity.js";
import { createAccessCode, hasActiveRide } from "./rideController.js";

const cleanText = (value, max = 255) => (typeof value === "string" ? value.trim().slice(0, max) : "");

// Ofertat publike — i sheh kushdo që hap aplikacionin
const activePromos = async (req, res) => {
    try {
        const promos = await returnPromoModel.findAll({
            where: { status: "active", expiresAt: { [Op.gt]: new Date() } },
            include: [{ model: driverModel, as: "driver", attributes: ["name", "carModel"] }],
            order: [["availableFrom", "ASC"]],
        });
        res.json({
            success: true,
            data: promos.map((promo) => ({
                id: promo.id,
                fromCity: promo.fromCity,
                toCity: promo.toCity,
                price: promo.price,
                regularPrice: promo.regularPrice,
                availableFrom: promo.availableFrom,
                expiresAt: promo.expiresAt,
                driverName: promo.driver?.name?.split(" ")[0] || null,
                carModel: promo.driver?.carModel || null,
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohen ofertat" });
    }
};

const claimPromo = async (req, res) => {
    const phone = normalizePhone(req.body.phone);
    const promoId = Number(req.body.promoId);
    const pickupAddress = cleanText(req.body.pickupAddress);
    const pickup = parsePoint(req.body.pickupLat, req.body.pickupLng);
    const dropoff = parsePoint(req.body.dropoffLat, req.body.dropoffLng);
    if (!phone) return res.status(400).json({ success: false, message: "Shkruaj një numër telefoni të vlefshëm" });
    if (!Number.isInteger(promoId)) return res.status(400).json({ success: false, message: "Oferta nuk është e vlefshme" });
    if (pickupAddress.length < 3) return res.status(400).json({ success: false, message: "Shkruaj adresën ku të të marrë shoferi" });
    if (dropoff && !isInsideTirana(dropoff)) return res.status(400).json({ success: false, message: "Destinacioni i kthimit duhet të jetë në Tiranë" });

    try {
        if (await hasActiveRide(phone)) {
            return res.status(409).json({ success: false, message: "Ke tashmë një porosi aktive me këtë numër telefoni" });
        }
        const accessCode = createAccessCode();
        const result = await sequelize.transaction(async (transaction) => {
            const promo = await returnPromoModel.findByPk(promoId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!promo || promo.status !== "active" || promo.expiresAt <= new Date()) {
                return { status: 409, message: "Kjo ofertë nuk është më e disponueshme" };
            }
            const ride = await rideModel.create({
                phone, accessCode,
                type: "return_promo",
                originCity: promo.fromCity,
                destinationCity: promo.toCity,
                pickupAddress,
                pickupLat: pickup?.lat ?? null,
                pickupLng: pickup?.lng ?? null,
                dropoffAddress: cleanText(req.body.dropoffAddress) || HOME_CITY,
                dropoffLat: dropoff?.lat ?? null,
                dropoffLng: dropoff?.lng ?? null,
                price: promo.price,
                note: cleanText(req.body.note, 300) || null,
                driverId: promo.driverId,
                cityRouteId: promo.cityRouteId,
                promoId: promo.id,
            }, { transaction });
            await promo.update({ status: "claimed", claimedRideId: ride.id }, { transaction });
            await logActivity({ actorType: "client", actorId: phone, action: "promo_claimed", rideId: ride.id, details: `${promo.fromCity} → ${promo.toCity}, €${promo.price}` }, transaction);
            return { status: 201, ride };
        });
        if (result.status !== 201) return res.status(result.status).json({ success: false, message: result.message });
        res.status(201).json({ success: true, message: "Kërkesa për kthim u dërgua te shoferi", data: { rideId: result.ride.id, accessCode } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të rezervohet oferta" });
    }
};

// Admin: të gjitha ofertat
const listPromos = async (req, res) => {
    try {
        const promos = await returnPromoModel.findAll({
            include: [{ model: driverModel, as: "driver", attributes: ["id", "name", "plateNumber"] }],
            order: [["createdAt", "DESC"]],
            limit: 200,
        });
        res.json({ success: true, data: promos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohen ofertat" });
    }
};

export { activePromos, claimPromo, listPromos };
