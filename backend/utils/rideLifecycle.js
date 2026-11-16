import { Op } from "sequelize";
import { HOME_CITY } from "../config/constants.js";
import { driverModel, returnPromoModel, rideModel, settingModel } from "../models/index.js";
import { logActivity } from "./activity.js";

const MINUTE = 60 * 1000;
export const PENDING_TIMEOUT_MINUTES = 30;

export async function getSettings(transaction) {
    const [settings] = await settingModel.findOrCreate({ where: { id: 1 }, defaults: { id: 1 }, transaction });
    return settings;
}

// Kur shoferi pranon Tiranë → qytet, krijohet oferta e kthimit qytet → Tiranë
export async function createReturnPromo(ride, transaction) {
    if (ride.type !== "intercity" || !ride.cityRouteId) return null;
    const route = await ride.getCityRoute({ transaction });
    if (!route) return null;
    const settings = await getSettings(transaction);
    const availableFrom = new Date(Date.now() + route.durationMinutes * MINUTE);
    const expiresAt = new Date(availableFrom.getTime() + settings.promoWindowHours * 60 * MINUTE);
    const promo = await returnPromoModel.create({
        sourceRideId: ride.id,
        driverId: ride.driverId,
        cityRouteId: route.id,
        fromCity: route.city,
        toCity: HOME_CITY,
        price: route.returnPrice,
        regularPrice: route.price,
        availableFrom,
        expiresAt,
    }, { transaction });
    await logActivity({ actorType: "system", action: "promo_created", rideId: ride.id, details: `Ofertë kthimi ${route.city} → ${HOME_CITY} për €${route.returnPrice}` }, transaction);
    return promo;
}

// Udhëtimi i kthimit u anulua → oferta rihapet (nëse nuk ka skaduar)
async function releaseClaimedPromo(ride, transaction, { closePromo = false } = {}) {
    if (!ride.promoId) return;
    const promo = await returnPromoModel.findByPk(ride.promoId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!promo || promo.status !== "claimed" || promo.claimedRideId !== ride.id) return;
    const reopen = !closePromo && promo.expiresAt > new Date();
    await promo.update({ status: reopen ? "active" : (closePromo ? "cancelled" : "expired"), claimedRideId: null }, { transaction });
    await logActivity({ actorType: "system", action: reopen ? "promo_reopened" : "promo_closed", rideId: promo.sourceRideId, details: `Oferta ${promo.fromCity} → ${promo.toCity}` }, transaction);
}

// Udhëtimi Tiranë → qytet u anulua → oferta anulohet, dhe kthimi i rezervuar gjithashtu
async function cancelSourcePromo(ride, transaction) {
    const promo = await returnPromoModel.findOne({ where: { sourceRideId: ride.id, status: { [Op.in]: ["active", "claimed"] } }, transaction, lock: transaction.LOCK.UPDATE });
    if (!promo) return;
    const claimedRideId = promo.claimedRideId;
    await promo.update({ status: "cancelled" }, { transaction });
    if (!claimedRideId) return;
    const claimedRide = await rideModel.findByPk(claimedRideId, { transaction, lock: transaction.LOCK.UPDATE });
    if (claimedRide && ["pending", "accepted"].includes(claimedRide.status)) {
        await claimedRide.update({ status: "cancelled", cancelledBy: "system", cancelReason: "Udhëtimi i shoferit drejt qytetit u anulua", cancelledAt: new Date() }, { transaction });
        await logActivity({ actorType: "system", action: "ride_cancelled", rideId: claimedRide.id, details: "Oferta e kthimit nuk është më e vlefshme" }, transaction);
    }
}

export async function cancelRide(ride, { by, actorId = null, reason = null, closePromo = false }, transaction) {
    const driverId = ride.driverId;
    const wasAssigned = ["accepted", "picked_up"].includes(ride.status);
    await ride.update({ status: "cancelled", cancelledBy: by, cancelReason: reason, cancelledAt: new Date() }, { transaction });
    if (wasAssigned && driverId) {
        const hasOtherActive = await rideModel.count({ where: { driverId, id: { [Op.ne]: ride.id }, status: { [Op.in]: ["accepted", "picked_up"] } }, transaction });
        if (!hasOtherActive) await driverModel.update({ status: "available" }, { where: { id: driverId, status: "busy" }, transaction });
    }
    await cancelSourcePromo(ride, transaction);
    await releaseClaimedPromo(ride, transaction, { closePromo });
    await logActivity({ actorType: by, actorId, action: "ride_cancelled", rideId: ride.id, details: reason }, transaction);
}

export async function expireStaleData() {
    const now = new Date();
    await returnPromoModel.update({ status: "expired" }, { where: { status: "active", expiresAt: { [Op.lte]: now } } });

    // Porositë e zakonshme që askush s'i pranoi brenda kohës
    const staleRides = await rideModel.findAll({
        attributes: ["id"],
        where: {
            status: "pending",
            type: { [Op.ne]: "return_promo" },
            createdAt: { [Op.lte]: new Date(now.getTime() - PENDING_TIMEOUT_MINUTES * MINUTE) },
        },
    });
    // Kthimet e rezervuara që shoferi s'i pranoi deri në skadimin e ofertës
    const expiredClaims = await returnPromoModel.findAll({
        attributes: ["claimedRideId"],
        where: { status: "claimed", expiresAt: { [Op.lte]: now }, claimedRideId: { [Op.ne]: null } },
    });
    const candidates = [
        ...staleRides.map((ride) => ({ id: ride.id, reason: `Askush nuk e pranoi brenda ${PENDING_TIMEOUT_MINUTES} minutave` })),
        ...expiredClaims.map((promo) => ({ id: promo.claimedRideId, reason: "Oferta e kthimit skadoi" })),
    ];
    for (const candidate of candidates) {
        await rideModel.sequelize.transaction(async (transaction) => {
            const locked = await rideModel.findByPk(candidate.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (locked?.status === "pending") {
                await cancelRide(locked, { by: "system", reason: candidate.reason }, transaction);
            }
        });
    }
}

export const DRIVER_PUBLIC_ATTRIBUTES = ["id", "name", "phone", "carModel", "plateNumber"];

// Të dhënat që sheh klienti për udhëtimin e vet
export function serializeRideForClient(ride) {
    const showDriver = ride.driver && ["accepted", "picked_up", "completed"].includes(ride.status);
    return {
        id: ride.id,
        type: ride.type,
        status: ride.status,
        originCity: ride.originCity,
        destinationCity: ride.destinationCity,
        pickupAddress: ride.pickupAddress,
        dropoffAddress: ride.dropoffAddress,
        pickupLat: ride.pickupLat,
        pickupLng: ride.pickupLng,
        dropoffLat: ride.dropoffLat,
        dropoffLng: ride.dropoffLng,
        distanceKm: ride.distanceKm,
        price: ride.price,
        cancelledBy: ride.cancelledBy,
        cancelReason: ride.cancelReason,
        createdAt: ride.createdAt,
        acceptedAt: ride.acceptedAt,
        pickedUpAt: ride.pickedUpAt,
        completedAt: ride.completedAt,
        cancelledAt: ride.cancelledAt,
        driver: showDriver ? {
            name: ride.driver.name,
            phone: ride.driver.phone,
            carModel: ride.driver.carModel,
            plateNumber: ride.driver.plateNumber,
        } : null,
    };
}
