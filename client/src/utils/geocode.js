// OpenStreetMap Nominatim — falas, max ~1 kërkesë në sekondë
const NOMINATIM = "https://nominatim.openstreetmap.org";
// Kufijtë e përafërt të Tiranës (lng min, lat max, lng max, lat min)
const TIRANA_VIEWBOX = "19.70,41.42,19.95,41.25";

const shortAddress = (result) => {
    const a = result.address || {};
    const street = [a.road || a.pedestrian || a.neighbourhood, a.house_number].filter(Boolean).join(" ");
    const area = a.suburb || a.city_district || a.quarter || a.city || a.town || a.village;
    return [street, area].filter(Boolean).join(", ") || result.display_name?.split(",").slice(0, 2).join(",") || "";
};

export async function reverseGeocode({ lat, lng }) {
    try {
        const response = await fetch(`${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=sq`);
        if (!response.ok) return "";
        return shortAddress(await response.json());
    } catch {
        return "";
    }
}

export async function searchAddress(query, { insideTirana = true } = {}) {
    try {
        const params = new URLSearchParams({ format: "jsonv2", q: query, addressdetails: "1", limit: "5", countrycodes: "al", "accept-language": "sq" });
        if (insideTirana) {
            params.set("viewbox", TIRANA_VIEWBOX);
            params.set("bounded", "1");
        }
        const response = await fetch(`${NOMINATIM}/search?${params}`);
        if (!response.ok) return [];
        const results = await response.json();
        return results.map((result) => ({
            lat: Number(result.lat),
            lng: Number(result.lon),
            address: shortAddress(result),
            label: result.display_name,
        }));
    } catch {
        return [];
    }
}
