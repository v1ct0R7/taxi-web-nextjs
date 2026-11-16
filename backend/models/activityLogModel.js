import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Çdo veprim në sistem (klient, shofer, admin) — për panelin e adminit
const activityLogModel = sequelize.define("activityLog", {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    actorType: { type: DataTypes.ENUM("client", "driver", "admin", "system"), allowNull: false },
    actorId: { type: DataTypes.STRING(40), allowNull: true },
    action: { type: DataTypes.STRING(40), allowNull: false },
    details: { type: DataTypes.STRING(500), allowNull: true },
}, {
    tableName: "activity_logs",
    updatedAt: false,
    indexes: [{ fields: ["created_at"] }, { fields: ["action"] }, { fields: ["ride_id"] }],
});

export default activityLogModel;
