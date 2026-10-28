// server/src/config/database.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Sequelize } from "sequelize";
const { DATABASE_URL, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, DB_SSL, DB_SSL_REJECT_UNAUTHORIZED, DB_SSL_CA, DB_SSL_CA_FILE, } = process.env;
let sequelize;
const isEnvTrue = (value, defaultValue = false) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized)
        return defaultValue;
    return ["1", "true", "yes", "on"].includes(normalized);
};
const buildDialectOptions = () => {
    const dialectOptions = {};
    if (isEnvTrue(DB_SSL)) {
        const ssl = {
            rejectUnauthorized: isEnvTrue(DB_SSL_REJECT_UNAUTHORIZED, true),
        };
        if (DB_SSL_CA_FILE) {
            ssl.ca = fs.readFileSync(path.resolve(DB_SSL_CA_FILE), "utf8");
        }
        else if (DB_SSL_CA) {
            ssl.ca = DB_SSL_CA;
        }
        dialectOptions.ssl = ssl;
    }
    return dialectOptions;
};
const dialectOptions = buildDialectOptions();
// Single source of truth for Sequelize instance across the server.
const sequelizeArgs = DATABASE_URL
    ? [
        DATABASE_URL,
        {
            logging: false,
            dialect: "mysql",
            dialectOptions,
        },
    ]
    : [
        (DB_NAME || "ecommerce_dev"),
        (DB_USER || "root"),
        (DB_PASS || ""),
        {
            host: DB_HOST || "localhost",
            port: DB_PORT ? Number(DB_PORT) : 3306,
            dialect: "mysql",
            logging: false,
            dialectOptions,
        },
    ];
sequelize = new Sequelize(...sequelizeArgs);
export default sequelize;
