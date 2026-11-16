import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { RIDE_STATUSES, RIDE_TYPES } from "../config/constants.js";
import { coordinate, decimal } from "./decimal.js";

const rideModel = sequelize.define("ride", {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    accessCode: { type: DataTypes.STRING(64), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    type: { type: DataTypes.ENUM(...RIDE_TYPES), allowNull: false, defaultValue: "city" },
    status: { type: DataTypes.ENUM(...RIDE_STATUSES), allowNull: false, defaultValue: "pending" },
    originCity: { type: DataTypes.STRING(80), allowNull: false },
    destinationCity: { type: DataTypes.STRING(80), allowNull: false },
    pickupAddress: { type: DataTypes.STRING(255), allowNull: false },
    pickupLat: coordinate("pickupLat"),
    pickupLng: coordinate("pickupLng"),
    dropoffAddress: { type: DataTypes.STRING(255), allowNull: false },
    dropoffLat: coordinate("dropoffLat"),
    dropoffLng: coordinate("dropoffLng"),
    distanceKm: decimal("distanceKm", { allowNull: true }),
    price: decimal("price", { allowNull: false }),
    note: { type: DataTypes.STRING(300), allowNull: true },
    cancelledBy: { type: DataTypes.ENUM("client", "driver", "admin", "system"), allowNull: true },
    cancelReason: { type: DataTypes.STRING(300), allowNull: true },
    acceptedAt: { type: DataTypes.DATE, allowNull: true },
    pickedUpAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: "rides",
    indexes: [{ fields: ["status"] }, { fields: ["phone"] }, { fields: ["created_at"] }, { fields: ["promo_id"] }],
    defaultScope: { attributes: { exclude: ["accessCode"] } },
    scopes: { withAccessCode: { attributes: { include: ["accessCode"] } } },
});

export default rideModel;
