import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { PROMO_STATUSES } from "../config/constants.js";
import { decimal } from "./decimal.js";

// Oferta kthimi: taksia shkon Tiranë → qytet, kushdo mund ta marrë kthimin me çmim të ulët
const returnPromoModel = sequelize.define("returnPromo", {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    fromCity: { type: DataTypes.STRING(80), allowNull: false },
    toCity: { type: DataTypes.STRING(80), allowNull: false },
    price: decimal("price", { allowNull: false }),
    regularPrice: decimal("regularPrice", { allowNull: false }),
    availableFrom: { type: DataTypes.DATE, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM(...PROMO_STATUSES), allowNull: false, defaultValue: "active" },
}, {
    tableName: "return_promos",
    indexes: [{ fields: ["status", "expires_at"] }],
});

export default returnPromoModel;
