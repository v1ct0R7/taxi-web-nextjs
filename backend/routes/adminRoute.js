import express from "express";
import { activityFeed, adminCancelRide, dashboardStats, listRides, loginAdmin, rideDetails } from "../controllers/adminController.js";
import { adminMiddleware } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const adminRouter = express.Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: "Shumë tentativa. Provo pas 15 minutash" });

adminRouter.post("/login", loginLimit, loginAdmin);
adminRouter.get("/stats", adminMiddleware, dashboardStats);
adminRouter.get("/rides", adminMiddleware, listRides);
adminRouter.get("/rides/:id", adminMiddleware, rideDetails);
adminRouter.post("/rides/cancel", adminMiddleware, adminCancelRide);
adminRouter.get("/activity", adminMiddleware, activityFeed);

export default adminRouter;
