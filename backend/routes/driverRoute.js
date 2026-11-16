import express from "express";
import {
    acceptRide, addDriver, cancelDriverRide, currentRide, declineRide, driverHistory, driverProfile,
    driverRequests, dropoffRide, listDrivers, loginDriver, pickupRide, updateDriver, updateDriverStatus,
} from "../controllers/driverController.js";
import { adminMiddleware, driverMiddleware } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const driverRouter = express.Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: "Shumë tentativa. Provo pas 15 minutash" });

// Aplikacioni i shoferit
driverRouter.post("/login", loginLimit, loginDriver);
driverRouter.get("/me", driverMiddleware, driverProfile);
driverRouter.post("/status", driverMiddleware, updateDriverStatus);
driverRouter.get("/requests", driverMiddleware, driverRequests);
driverRouter.get("/current", driverMiddleware, currentRide);
driverRouter.get("/history", driverMiddleware, driverHistory);
driverRouter.post("/accept", driverMiddleware, acceptRide);
driverRouter.post("/pickup", driverMiddleware, pickupRide);
driverRouter.post("/dropoff", driverMiddleware, dropoffRide);
driverRouter.post("/cancel", driverMiddleware, cancelDriverRide);
driverRouter.post("/decline", driverMiddleware, declineRide);

// Admin
driverRouter.get("/list", adminMiddleware, listDrivers);
driverRouter.post("/add", adminMiddleware, addDriver);
driverRouter.post("/update", adminMiddleware, updateDriver);

export default driverRouter;
