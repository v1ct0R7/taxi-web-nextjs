import express from "express";
import { cancelClientRide, quoteRide, requestRide, rideStatus } from "../controllers/rideController.js";
import { rateLimit } from "../middleware/rateLimit.js";

const rideRouter = express.Router();
const requestLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 10, message: "Shumë kërkesa. Provo përsëri pas pak minutash" });

rideRouter.post("/quote", quoteRide);
rideRouter.post("/request", requestLimit, requestRide);
rideRouter.post("/status", rideStatus);
rideRouter.post("/cancel", cancelClientRide);

export default rideRouter;
