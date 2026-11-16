import "dotenv/config";
import bcrypt from "bcrypt";
import { sequelize, connectDB } from "../config/database.js";
import { adminModel, cityRouteModel, driverModel, settingModel } from "../models/index.js";

// Tarifat fikse nga Tirana — vlera fillestare, ndryshoji nga paneli admin
const routes = [
    { city: "Rinas (Aeroporti)", price: 20, returnPrice: 12, durationMinutes: 25, distanceKm: 17 },
    { city: "Durrës", price: 30, returnPrice: 18, durationMinutes: 40, distanceKm: 38 },
    { city: "Krujë", price: 28, returnPrice: 16, durationMinutes: 45, distanceKm: 33 },
    { city: "Elbasan", price: 40, returnPrice: 24, durationMinutes: 50, distanceKm: 55 },
    { city: "Kavajë", price: 35, returnPrice: 20, durationMinutes: 45, distanceKm: 45 },
    { city: "Lezhë", price: 55, returnPrice: 32, durationMinutes: 60, distanceKm: 70 },
    { city: "Fier", price: 75, returnPrice: 45, durationMinutes: 85, distanceKm: 115 },
    { city: "Shkodër", price: 80, returnPrice: 48, durationMinutes: 100, distanceKm: 100 },
    { city: "Berat", price: 85, returnPrice: 50, durationMinutes: 110, distanceKm: 120 },
    { city: "Vlorë", price: 95, returnPrice: 55, durationMinutes: 115, distanceKm: 150 },
    { city: "Pogradec", price: 100, returnPrice: 60, durationMinutes: 120, distanceKm: 140 },
    { city: "Korçë", price: 130, returnPrice: 75, durationMinutes: 165, distanceKm: 180 },
    { city: "Gjirokastër", price: 160, returnPrice: 95, durationMinutes: 200, distanceKm: 230 },
    { city: "Sarandë", price: 180, returnPrice: 105, durationMinutes: 240, distanceKm: 280 },
    { city: "Ksamil", price: 190, returnPrice: 110, durationMinutes: 255, distanceKm: 295 },
];

const demoDrivers = [
    { name: "Arben Hoxha", phone: "+355691111111", carModel: "Mercedes E-Class", plateNumber: "AA 101 TR" },
    { name: "Ermal Kola", phone: "+355692222222", carModel: "Skoda Superb", plateNumber: "AB 202 TR" },
    { name: "Dritan Leka", phone: "+355693333333", carModel: "Toyota Prius", plateNumber: "AC 303 TR" },
];

async function seed() {
    await connectDB();

    await settingModel.findOrCreate({ where: { id: 1 }, defaults: { id: 1 } });

    for (const route of routes) {
        await cityRouteModel.findOrCreate({ where: { city: route.city }, defaults: route });
    }

    const email = (process.env.ADMIN_EMAIL || "admin@tiranaride.al").toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!password || password.length < 8) {
        console.warn("ADMIN_PASSWORD mungon ose është më i shkurtër se 8 karaktere — administratori nuk u krijua.");
    } else {
        const [, created] = await adminModel.findOrCreate({
            where: { email },
            defaults: { name: process.env.ADMIN_NAME || "Administrator", email, password: await bcrypt.hash(password, 10) },
        });
        console.log(created ? `Administratori u krijua: ${email}` : `Administratori ekziston: ${email}`);
    }

    if (process.argv.includes("--demo")) {
        const demoPassword = await bcrypt.hash("shofer123", 10);
        for (const driver of demoDrivers) {
            await driverModel.findOrCreate({ where: { phone: driver.phone }, defaults: { ...driver, password: demoPassword } });
        }
        console.log("Shoferët demo u krijuan (fjalëkalimi: shofer123)");
    }

    console.log("Seed përfundoi");
    await sequelize.close();
}

seed().catch(async (error) => {
    console.error("Seed failed:", error);
    await sequelize.close();
    process.exit(1);
});
