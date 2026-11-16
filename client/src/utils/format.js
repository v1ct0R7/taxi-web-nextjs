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
