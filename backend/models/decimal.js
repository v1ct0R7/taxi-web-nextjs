import { DataTypes } from "sequelize";

// DECIMAL kthehet si string nga mysql2 — e kthejmë në numër
export const decimal = (field, options = {}) => ({
    type: DataTypes.DECIMAL(10, 2),
    ...options,
    get() {
        const value = this.getDataValue(field);
        return value === null || value === undefined ? null : Number(value);
    },
});

export const coordinate = (field) => ({
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    get() {
        const value = this.getDataValue(field);
        return value === null || value === undefined ? null : Number(value);
    },
});
