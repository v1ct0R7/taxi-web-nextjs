import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { DRIVER_STATUSES } from "../config/constants.js";

const driverModel = sequelize.define("driver", {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(100), allowNull: false },
    carModel: { type: DataTypes.STRING(80), allowNull: false },
    plateNumber: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM(...DRIVER_STATUSES), allowNull: false, defaultValue: "offline" },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastSeenAt: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: "drivers",
    defaultScope: { attributes: { exclude: ["password"] } },
    scopes: { withPassword: { attributes: { include: ["password"] } } },
});

export default driverModel;
