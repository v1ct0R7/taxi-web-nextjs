import { logActivity } from "../utils/activity.js";
import { getSettings } from "../utils/rideLifecycle.js";
import { TIRANA_CENTER, TIRANA_RADIUS_KM } from "../config/constants.js";

const publicSettings = async (req, res) => {
    try {
        const settings = await getSettings();
        res.json({
            success: true,
            data: {
                baseFare: settings.baseFare, perKm: settings.perKm, minimumFare: settings.minimumFare,
                supportPhone: settings.supportPhone, tiranaCenter: TIRANA_CENTER, tiranaRadiusKm: TIRANA_RADIUS_KM,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohen cilësimet" });
    }
};

const getAdminSettings = async (req, res) => {
    try {
        res.json({ success: true, data: await getSettings() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohen cilësimet" });
    }
};

const updateSettings = async (req, res) => {
    const baseFare = Number(req.body.baseFare);
    const perKm = Number(req.body.perKm);
    const minimumFare = Number(req.body.minimumFare);
    const promoWindowHours = Number(req.body.promoWindowHours);
    const supportPhone = typeof req.body.supportPhone === "string" ? req.body.supportPhone.trim() : "";
    if (![baseFare, perKm, minimumFare].every((value) => Number.isFinite(value) && value >= 0 && value <= 1000) ||
        !Number.isInteger(promoWindowHours) || promoWindowHours < 1 || promoWindowHours > 48 ||
        !/^\+?[\d\s]{8,20}$/.test(supportPhone)) {
        return res.status(400).json({ success: false, message: "Vlerat e tarifave ose telefoni nuk janë të vlefshme (oferta 1–48 orë)" });
    }
    try {
        const settings = await getSettings();
        await settings.update({ baseFare, perKm, minimumFare, promoWindowHours, supportPhone });
        await logActivity({ actorType: "admin", actorId: req.admin.id, action: "settings_updated", details: `Nisja €${baseFare}, €${perKm}/km, minimumi €${minimumFare}, oferta ${promoWindowHours}h` });
        res.json({ success: true, message: "Cilësimet u ruajtën", data: settings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ruhen cilësimet" });
    }
};

export { publicSettings, getAdminSettings, updateSettings };
