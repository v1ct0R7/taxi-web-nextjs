import { cityRouteModel } from "../models/index.js";
import { HOME_CITY } from "../config/constants.js";
import { logActivity } from "../utils/activity.js";
import { roundMoney } from "../utils/pricing.js";

const readRoute = (body) => {
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 80) : "";
    const price = Number(body.price);
    const returnPrice = Number(body.returnPrice);
    const durationMinutes = Number(body.durationMinutes);
    const distanceKm = Number(body.distanceKm);
    if (!city || !Number.isFinite(price) || price <= 0 || !Number.isFinite(returnPrice) || returnPrice <= 0 ||
        returnPrice > price || !Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 1440 ||
        !Number.isInteger(distanceKm) || distanceKm < 0 || distanceKm > 2000) {
        return null;
    }
    return { city, price: roundMoney(price), returnPrice: roundMoney(returnPrice), durationMinutes, distanceKm };
};

const INVALID_ROUTE = "Plotëso qytetin, çmimin, çmimin e kthimit (jo më të lartë se çmimi), kohëzgjatjen në minuta dhe km";

// Publike: qytetet ku shkojmë nga Tirana
const listFares = async (req, res) => {
    try {
        const where = req.admin ? {} : { active: true };
        const routes = await cityRouteModel.findAll({ where, order: [["city", "ASC"]] });
        res.json({ success: true, origin: HOME_CITY, data: routes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të ngarkohen tarifat" });
    }
};

const addFare = async (req, res) => {
    const route = readRoute(req.body);
    if (!route) return res.status(400).json({ success: false, message: INVALID_ROUTE });
    try {
        const created = await cityRouteModel.create(route);
        await logActivity({ actorType: "admin", actorId: req.admin.id, action: "fare_created", details: `${HOME_CITY} → ${route.city}: €${route.price}` });
        res.status(201).json({ success: true, message: "Tarifa u shtua", data: created });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ success: false, message: "Ky qytet ekziston tashmë" });
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të shtohet tarifa" });
    }
};

const updateFare = async (req, res) => {
    const id = Number(req.body.id);
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "Tarifa nuk është e vlefshme" });
    try {
        const existing = await cityRouteModel.findByPk(id);
        if (!existing) return res.status(404).json({ success: false, message: "Tarifa nuk u gjet" });
        if (typeof req.body.active === "boolean" && Object.keys(req.body).length === 2) {
            await existing.update({ active: req.body.active });
        } else {
            const route = readRoute(req.body);
            if (!route) return res.status(400).json({ success: false, message: INVALID_ROUTE });
            await existing.update({ ...route, ...(typeof req.body.active === "boolean" ? { active: req.body.active } : {}) });
        }
        await logActivity({ actorType: "admin", actorId: req.admin.id, action: "fare_updated", details: `${HOME_CITY} → ${existing.city}: €${existing.price} / kthim €${existing.returnPrice}${existing.active ? "" : " (joaktive)"}` });
        res.json({ success: true, message: "Tarifa u përditësua", data: existing });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ success: false, message: "Ky qytet ekziston tashmë" });
        console.error(error);
        res.status(500).json({ success: false, message: "Nuk mund të përditësohet tarifa" });
    }
};

export { listFares, addFare, updateFare };
