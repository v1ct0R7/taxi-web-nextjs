import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { decimal } from "./decimal.js";

// Tarifa fikse Tiranë → qytet tjetër
const cityRouteModel = sequelize.define("cityRoute", {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    city: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    price: decimal("price", { allowNull: false }),
    returnPrice: decimal("returnPrice", { allowNull: false }),
    durationMinutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 60 },
    distanceKm: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: "city_routes" });

export default cityRouteModel;
