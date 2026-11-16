import express from "express";
import { getAdminSettings, publicSettings, updateSettings } from "../controllers/settingsController.js";
import { adminMiddleware } from "../middleware/auth.js";

const settingsRouter = express.Router();

settingsRouter.get("/public", publicSettings);
settingsRouter.get("/", adminMiddleware, getAdminSettings);
settingsRouter.patch("/", adminMiddleware, updateSettings);

export default settingsRouter;
