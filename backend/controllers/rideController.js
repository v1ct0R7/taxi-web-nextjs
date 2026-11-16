import { randomBytes } from "node:crypto";
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { ACTIVE_RIDE_STATUSES, HOME_CITY } from "../config/constants.js";
import { cityRouteModel, driverModel, rideModel } from "../models/index.js";
import { normalizePhone } from "../utils/phone.js";
import { calculateCityFare, isInsideTirana, parsePoint } from "../utils/pricing.js";
import { logActivity } from "../utils/activity.js";
import { cancelRide, DRIVER_PUBLIC_ATTRIBUTES, getSettings, serializeRideForClient } from "../utils/rideLifecycle.js";

const cleanText = (value, max = 255) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export const createAccessCode = () => randomBytes(24).toString("hex");

export const hasActiveRide = (phone, transaction) =>
    rideModel.count({ where: { phone, status: { [Op.in]: ACTIVE_RIDE_STATUSES } }, transaction });

// Llogarit çmimin pa krijuar porosi
const buildRide = async (body) => {
    const type = body.type === "intercity" ? "intercity" : "city";
    const pickup = parsePoint(body.pickupLat, body.pickupLng);
    const pickupAddress = cleanText(body.pickupAddress);

    if (!pickup || !isInsideTirana(pickup)) {
        return { error: "Vendos vendndodhjen e nisjes brenda Tiranës në hartë" };
    }

    if (type === "city") {
        const dropoff = parsePoint(body.dropoffLat, body.dropoffLng);
        if (!dropoff || !isInsideTirana(dropoff)) {
            return { error: "Vendos destinacionin brenda Tiranës në hartë. Për qytete të tjera zgjidh 'Jashtë Tiranës'" };
        }
        const settings = await getSettings();
        const { distanceKm, price } = calculateCityFare(pickup, dropoff, settings);
        return {
            ride: {
                type, originCity: HOME_CITY, destinationCity: HOME_CITY,
                pickupAddress: pickupAddress || `${pickup.lat.toFixed(5)}, ${pickup.lng.toFixed(5)}`,
                pickupLat: pickup.lat, pickupLng: pickup.lng,
                dropoffAddress: cleanText(body.dropoffAddress) || `${dropoff.lat.toFixed(5)}, ${dropoff.lng.toFixed(5)}`,
                dropoffLat: dropoff.lat, dropoffLng: dropoff.lng,
                distanceKm, price,
            },
        };
    }

    const routeId = Number(body.cityRouteId);
    const route = Number.isInteger(routeId) ? await cityRouteModel.findOne({ where: { id: routeId, active: true } }) : null;
    if (!route) return { error: "Zgjidh një qytet destinacioni" };
    return {
        ride: {
            type, originCity: HOME_CITY, destinationCity: route.city, cityRouteId: route.id,
            pickupAddress: pickupAddress || `${pickup.lat.toFixed(5)}, ${pickup.lng.toFixed(5)}`,
            pickupLat: pickup.lat, pickupLng: pickup.lng,
            dropoffAddress: cleanText(body.dropoffAddress) || route.city,
            distanceKm: route.distanceKm, price: route.price,
        },
    };
};

const quoteRide = async (req, res) => {
    try {
        const { ride, error } = await buildRide(req.body);
        if (error) return res.status(400).json({ success: false, message: error });
        res.json({ success: true, data: { price: ride.price, distanceKm: ride.distanceKm, destinationCity: ride.destinationCity } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të llogaritet çmimi" });
    }
};

const requestRide = async (req, res) => {
    const phone = normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ success: false, message: "Shkruaj një numër telefoni të vlefshëm (p.sh. 069 123 4567)" });
    try {
        const { ride, error } = await buildRide(req.body);
        if (error) return res.status(400).json({ success: false, message: error });
        if (await hasActiveRide(phone)) {
            return res.status(409).json({ success: false, message: "Ke tashmë një porosi aktive me këtë numër telefoni" });
        }
        const accessCode = createAccessCode();
        const created = await sequelize.transaction(async (transaction) => {
            const newRide = await rideModel.create({ ...ride, phone, accessCode, note: cleanText(req.body.note, 300) || null }, { transaction });
            await logActivity({ actorType: "client", actorId: phone, action: "ride_requested", rideId: newRide.id, details: `${newRide.originCity} → ${newRide.destinationCity}, €${newRide.price}` }, transaction);
            return newRide;
        });
        res.status(201).json({ success: true, message: "Porosia u dërgua te shoferët", data: { rideId: created.id, accessCode } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të dërgohet porosia" });
    }
};

const findClientRide = (body, transaction) => {
    const rideId = Number(body.rideId);
    if (!Number.isInteger(rideId) || typeof body.accessCode !== "string" || body.accessCode.length < 20) return null;
    return rideModel.scope("withAccessCode").findOne({
        where: { id: rideId, accessCode: body.accessCode },
        include: [{ model: driverModel, as: "driver", attributes: DRIVER_PUBLIC_ATTRIBUTES }],
        transaction,
        ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    });
};

const rideStatus = async (req, res) => {
    try {
        const ride = await findClientRide(req.body);
        if (!ride) return res.status(404).json({ success: false, message: "Porosia nuk u gjet" });
        res.json({ success: true, data: serializeRideForClient(ride) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohet porosia" });
    }
};

const cancelClientRide = async (req, res) => {
    try {
        const result = await sequelize.transaction(async (transaction) => {
            const ride = await findClientRide(req.body, transaction);
            if (!ride) return { status: 404, message: "Porosia nuk u gjet" };
            if (!["pending", "accepted"].includes(ride.status)) {
                return { status: 409, message: ride.status === "picked_up" ? "Udhëtimi ka nisur dhe nuk mund të anulohet" : "Kjo porosi nuk është më aktive" };
            }
            await cancelRide(ride, { by: "client", actorId: ride.phone, reason: cleanText(req.body.reason, 300) || "Anuluar nga klienti" }, transaction);
            return { status: 200 };
        });
        if (result.status !== 200) return res.status(result.status).json({ success: false, message: result.message });
        res.json({ success: true, message: "Porosia u anulua" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të anulohet porosia" });
    }
};

export { quoteRide, requestRide, rideStatus, cancelClientRide };
