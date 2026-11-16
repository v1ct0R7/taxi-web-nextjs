import express from "express";
import { addFare, listFares, updateFare } from "../controllers/fareController.js";
import { adminMiddleware } from "../middleware/auth.js";

const fareRouter = express.Router();

fareRouter.get("/list", listFares);
fareRouter.get("/all", adminMiddleware, listFares);
fareRouter.post("/add", adminMiddleware, addFare);
fareRouter.post("/update", adminMiddleware, updateFare);

export default fareRouter;
