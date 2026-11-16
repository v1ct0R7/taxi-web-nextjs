import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const adminModel = sequelize.define("admin", {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(100), allowNull: false },
}, { tableName: "admins" });

export default adminModel;
