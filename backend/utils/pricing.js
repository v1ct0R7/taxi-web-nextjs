import { TIRANA_CENTER, TIRANA_RADIUS_KM } from "../config/constants.js";

const toRadians = (degrees) => (degrees * Math.PI) / 180;

// Distanca në vijë ajrore (km)
export function haversineKm(from, to) {
    const earthRadiusKm = 6371;
    const dLat = toRadians(to.lat - from.lat);
    const dLng = toRadians(to.lng - from.lng);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Rrugët nuk janë drejt — faktor 1.3 për distancën reale
export const ROAD_FACTOR = 1.3;

export const roundMoney = (value) => Math.round(value * 100) / 100;

export function isValidCoordinate(point) {
    return Boolean(point) &&
        Number.isFinite(point.lat) && Number.isFinite(point.lng) &&
        point.lat >= -90 && point.lat <= 90 && point.lng >= -180 && point.lng <= 180;
}

export function isInsideTirana(point) {
    return isValidCoordinate(point) && haversineKm(TIRANA_CENTER, point) <= TIRANA_RADIUS_KM;
}

export function calculateCityFare(pickup, dropoff, settings) {
    const distanceKm = roundMoney(haversineKm(pickup, dropoff) * ROAD_FACTOR);
    const fare = Number(settings.baseFare) + distanceKm * Number(settings.perKm);
    return {
        distanceKm,
        price: roundMoney(Math.max(Number(settings.minimumFare), fare)),
    };
}

export function parsePoint(lat, lng) {
    if (lat === undefined || lat === null || lat === "" || lng === undefined || lng === null || lng === "") return null;
    const point = { lat: Number(lat), lng: Number(lng) };
    return isValidCoordinate(point) ? point : null;
}
