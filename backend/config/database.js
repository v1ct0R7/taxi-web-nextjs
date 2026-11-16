import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(
    process.env.DB_NAME || "",
    process.env.DB_USER || "viktori",
    process.env.DB_PASSWORD || "Merimanga123",
    {
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT) || 3306,
        dialect: "mysql",
        logging: false,
        timezone: "+00:00",
        define: { underscored: true },
    }
);

export async function connectDB() {
    await sequelize.authenticate();
    await sequelize.sync({ alter: process.env.DB_SYNC_ALTER === "true" });
    console.log("Connected to MySQL");
}
