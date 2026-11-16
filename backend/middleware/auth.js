import jwt from "jsonwebtoken";
import { adminModel, driverModel } from "../models/index.js";

const readToken = (req) => req.headers.token || req.headers.authorization?.replace(/^Bearer\s+/i, "");

const verify = (req, res, role) => {
    const token = readToken(req);
    if (!token) {
        res.status(401).json({ success: false, message: "Duhet të identifikohesh" });
        return null;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== role) {
            res.status(403).json({ success: false, message: "Nuk ke qasje në këtë veprim" });
            return null;
        }
        return decoded;
    } catch {
        res.status(401).json({ success: false, message: "Sesioni ka skaduar, hyr përsëri" });
        return null;
    }
};

export const adminMiddleware = async (req, res, next) => {
    const decoded = verify(req, res, "admin");
    if (!decoded) return;
    try {
        const admin = await adminModel.findByPk(decoded.id, { attributes: ["id", "name"] });
        if (!admin) return res.status(401).json({ success: false, message: "Llogaria e administratorit nuk u gjet" });
        req.admin = { id: admin.id, name: admin.name };
        next();
    } catch (error) {
        next(error);
    }
};

export const driverMiddleware = async (req, res, next) => {
    const decoded = verify(req, res, "driver");
    if (!decoded) return;
    try {
        const driver = await driverModel.findByPk(decoded.id);
        if (!driver) return res.status(401).json({ success: false, message: "Llogaria e shoferit nuk u gjet" });
        if (!driver.active) return res.status(403).json({ success: false, message: "Llogaria e shoferit është çaktivizuar" });
        req.driver = driver;
        driverModel.update({ lastSeenAt: new Date() }, { where: { id: driver.id } }).catch(() => {});
        next();
    } catch (error) {
        next(error);
    }
};

export const createToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
