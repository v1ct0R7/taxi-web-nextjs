import express from "express";
import { activePromos, claimPromo, listPromos } from "../controllers/promoController.js";
import { adminMiddleware } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const promoRouter = express.Router();
const claimLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 10, message: "Shumë kërkesa. Provo përsëri pas pak minutash" });

promoRouter.get("/active", activePromos);
promoRouter.post("/claim", claimLimit, claimPromo);
promoRouter.get("/list", adminMiddleware, listPromos);

export default promoRouter;
