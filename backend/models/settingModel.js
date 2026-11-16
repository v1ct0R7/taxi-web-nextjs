import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { decimal } from "./decimal.js";

// Një rresht i vetëm (id = 1) me tarifat brenda Tiranës
const settingModel = sequelize.define("setting", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, defaultValue: 1 },
    baseFare: decimal("baseFare", { allowNull: false, defaultValue: 2.5 }),
    perKm: decimal("perKm", { allowNull: false, defaultValue: 0.9 }),
    minimumFare: decimal("minimumFare", { allowNull: false, defaultValue: 4 }),
    promoWindowHours: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 3 },
    supportPhone: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "+355681234567" },
}, { tableName: "settings" });

export default settingModel;
