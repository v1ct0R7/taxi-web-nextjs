import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/database.js";
import "./models/index.js";
import rideRouter from "./routes/rideRoute.js";
import driverRouter from "./routes/driverRoute.js";
import adminRouter from "./routes/adminRoute.js";
import fareRouter from "./routes/fareRoute.js";
import promoRouter from "./routes/promoRoute.js";
import settingsRouter from "./routes/settingsRoute.js";
import { expireStaleData } from "./utils/rideLifecycle.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
}
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:5175")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.set("trust proxy", 1);
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin is not allowed by CORS"));
    },
    allowedHeaders: ["Content-Type", "token", "Authorization"],
}));
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) req.body = {};
    next();
});

app.use("/api/ride", rideRouter);
app.use("/api/driver", driverRouter);
app.use("/api/admin", adminRouter);
app.use("/api/fare", fareRouter);
app.use("/api/promo", promoRouter);
app.use("/api/settings", settingsRouter);

app.get("/", (req, res) => {
    res.json({ success: true, message: "Tirana Ride API is running" });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Rruga nuk ekziston" });
});

app.use((error, req, res, next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ success: false, message: "JSON i pavlefshëm" });
    }
    console.error(error);
    res.status(500).json({ success: false, message: "Gabim i brendshëm i serverit" });
});

connectDB()
    .then(() => {
        app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
        // Ofertat e skaduara dhe porositë që askush s'i pranoi
        setInterval(() => expireStaleData().catch((error) => console.error("Cleanup failed:", error.message)), 60 * 1000);
    })
    .catch((error) => {
        console.error("Unable to start API:", error.message);
        process.exit(1);
    });
