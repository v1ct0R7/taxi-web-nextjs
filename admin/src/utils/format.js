export const money = (value) => `€${Number(value || 0).toFixed(2)}`;

export const time = (value) => value
    ? new Date(value).toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit" })
    : "";

export const dateTime = (value) => value
    ? new Date(value).toLocaleString("sq-AL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

export const statusLabels = {
    pending: "Në pritje të shoferit",
    accepted: "Shoferi po vjen",
    picked_up: "Në udhëtim",
    completed: "Përfunduar",
    cancelled: "Anuluar",
};

export const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest} min`;
    return rest ? `${hours}h ${rest} min` : `${hours}h`;
};

export const googleMapsLink = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export const adminStatusLabels = {
    pending: "Në pritje",
    accepted: "Pranuar",
    picked_up: "Në udhëtim",
    completed: "Përfunduar",
    cancelled: "Anuluar",
};

export const statusBadge = {
    pending: "badge-accent",
    accepted: "badge-info",
    picked_up: "badge-info",
    completed: "badge-success",
    cancelled: "badge-danger",
};

export const typeLabels = { city: "Brenda Tiranës", intercity: "Ndërqytetëse", return_promo: "Kthim (ofertë)" };

export const driverStatusLabels = { available: "Në dispozicion", busy: "Në udhëtim", offline: "Jashtë linje" };

export const actorLabels = { client: "Klient", driver: "Shofer", admin: "Admin", system: "Sistemi" };

export const actionLabels = {
    ride_requested: "Porosi e re",
    ride_accepted: "Shoferi pranoi",
    ride_picked_up: "Udhëtimi nisi",
    ride_completed: "Udhëtimi përfundoi",
    ride_cancelled: "Porosia u anulua",
    promo_created: "Ofertë kthimi u krijua",
    promo_claimed: "Oferta u rezervua",
    promo_reopened: "Oferta u rihap",
    promo_closed: "Oferta u mbyll",
    driver_login: "Shoferi hyri",
    driver_online: "Shoferi në dispozicion",
    driver_offline: "Shoferi jashtë linje",
    driver_created: "Shofer i ri",
    driver_updated: "Shoferi u ndryshua",
    admin_login: "Admini hyri",
    fare_created: "Tarifë e re",
    fare_updated: "Tarifa u ndryshua",
    settings_updated: "Cilësimet u ndryshuan",
};

export const promoStatusLabels = { active: "Aktive", claimed: "Rezervuar", expired: "Skaduar", cancelled: "Anuluar" };
