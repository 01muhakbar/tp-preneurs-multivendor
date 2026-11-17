import { QueryTypes } from "sequelize";
import { sequelize } from "../models/index.js";
export const DEFAULT_SYSTEM_SETTINGS = {
    imagesPerProduct: "12",
    allowAutoTranslation: "false",
    defaultLanguage: "English",
    defaultCurrency: "IDR",
    defaultTimeZone: "Asia/Makassar",
    defaultDateFormat: "D MMM, YYYY",
    receiptWidth: "57 mm",
    invoiceEmailEnabled: "true",
    invoiceFromEmail: "sales@kachabazar.com",
    companyFromName: "KachaBazar",
    companyName: "HtmlLover ltd",
    vatNumber: "47589",
    companyAddress: "59 Station Rd, Purls Bridge, United Kingdom",
    postCode: "2030",
    contactPhone: "019579034",
    contactEmail: "kachabazar@gmail.com",
    website: "kachabazar-admin.vercel.app",
    smtpProvider: "google",
    smtpHost: "smtp.gmail.com",
    smtpPort: "465",
    smtpSecure: "true",
    smtpUser: "",
    smtpPassword: "",
    smtpFromEmail: "",
    smtpFromName: "TP PRENEURS",
    // Master Shipping Governance (Fase 3)
    shippingMasterCouriers: JSON.stringify([
        "JNE", "JNT", "SICEPAT", "POS", "GRAB", "ANTERAJA", "LION", "WAHANA", "NINJA"
    ]),
    shippingMandatoryCouriers: JSON.stringify(["JNE", "JNT"]),
    shippingMasterCategories: JSON.stringify([
        "instant", "regular", "express", "economy", "cargo"
    ]),
    shippingZone1Multiplier: "1.0",
    shippingZone2Multiplier: "1.0",
    shippingZone3Multiplier: "1.0",
    shippingGrabBaseFare: "15000",
    shippingGrabPerKmRate: "3000",
    shippingMaxInstantDistanceKm: "40",
    shippingPlatformHandlingFee: "0",
    shippingMaintenanceNotices: JSON.stringify({}),
};
const SENSITIVE_SYSTEM_SETTING_KEYS = new Set(["smtpPassword"]);
const toStringValue = (value) => {
    if (typeof value === "string")
        return value;
    if (typeof value === "boolean" || typeof value === "number")
        return String(value);
    if (value == null)
        return "";
    return JSON.stringify(value);
};
export const ensureSettingsTable = async (transaction) => {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(191) NOT NULL,
        \`value\` TEXT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, { transaction });
};
export const upsertSystemSetting = async (key, value, transaction) => {
    await sequelize.query(`
      INSERT INTO settings (\`key\`, \`value\`, createdAt, updatedAt)
      VALUES (:key, :value, NOW(), NOW())
      ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updatedAt = VALUES(updatedAt)
    `, {
        replacements: { key, value },
        transaction,
    });
};
export const fetchRawSystemSettingsMap = async (transaction) => {
    const settings = await sequelize.query("SELECT `key`, `value` FROM settings", { type: QueryTypes.SELECT, transaction });
    const grouped = {};
    for (const setting of settings) {
        grouped[String(setting.key)] = toStringValue(setting.value);
    }
    return grouped;
};
export const ensureDefaultSystemSettings = async (transaction) => {
    await ensureSettingsTable(transaction);
    const grouped = await fetchRawSystemSettingsMap(transaction);
    const missingDefaults = Object.entries(DEFAULT_SYSTEM_SETTINGS).filter(([key]) => grouped[key] === undefined);
    for (const [key, value] of missingDefaults) {
        await upsertSystemSetting(key, value, transaction);
        grouped[key] = value;
    }
    return grouped;
};
export const sanitizeSystemSettingsForAdmin = (settings) => ({
    ...settings,
    smtpPassword: "",
    smtpPasswordConfigured: settings.smtpPassword ? "true" : "false",
});
export const normalizeSystemSettingsUpdate = (payload, existing) => {
    const normalized = {};
    for (const [key, rawValue] of Object.entries(payload || {})) {
        if (key === "smtpPasswordConfigured")
            continue;
        if (rawValue === undefined)
            continue;
        if (SENSITIVE_SYSTEM_SETTING_KEYS.has(key)) {
            const nextValue = toStringValue(rawValue).trim();
            if (!nextValue)
                continue;
            normalized[key] = nextValue;
            continue;
        }
        normalized[key] = toStringValue(rawValue);
    }
    if (!("smtpPassword" in normalized) && existing.smtpPassword) {
        normalized.smtpPassword = existing.smtpPassword;
    }
    return normalized;
};
const parseBoolean = (value, fallback = false) => {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized))
        return true;
    if (["false", "0", "no", "off"].includes(normalized))
        return false;
    return fallback;
};
const firstNonEmpty = (...values) => {
    for (const value of values) {
        const normalized = String(value ?? "").trim();
        if (normalized)
            return normalized;
    }
    return "";
};
export const resolveEmailRuntimeSettings = async () => {
    const settings = await ensureDefaultSystemSettings();
    const host = firstNonEmpty(process.env.EMAIL_HOST, settings.smtpHost);
    const port = Number(firstNonEmpty(process.env.EMAIL_PORT, settings.smtpPort, "587"));
    const secure = parseBoolean(firstNonEmpty(process.env.EMAIL_SECURE, settings.smtpSecure, port === 465 ? "true" : "false"), port === 465);
    const user = firstNonEmpty(process.env.EMAIL_USER, settings.smtpUser);
    const pass = firstNonEmpty(process.env.EMAIL_PASS, settings.smtpPassword);
    const fromEmail = firstNonEmpty(process.env.EMAIL_FROM, settings.smtpFromEmail);
    const fromName = firstNonEmpty(process.env.EMAIL_FROM_NAME, settings.smtpFromName, DEFAULT_SYSTEM_SETTINGS.smtpFromName);
    return {
        host,
        port: Number.isFinite(port) ? port : 587,
        secure,
        user,
        pass,
        fromEmail,
        fromName,
    };
};
export const resolvePlatformShippingGovernance = async (transaction) => {
    const settings = await ensureDefaultSystemSettings(transaction);
    let enabledCouriers = [
        "JNE", "JNT", "SICEPAT", "POS", "GRAB", "ANTERAJA", "LION", "WAHANA", "NINJA"
    ];
    try {
        const parsed = JSON.parse(settings.shippingMasterCouriers || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) {
            enabledCouriers = parsed.map((c) => String(c).trim().toUpperCase());
        }
    }
    catch {
        // fallback default
    }
    let mandatoryCouriers = ["JNE", "JNT"];
    try {
        const parsed = JSON.parse(settings.shippingMandatoryCouriers || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) {
            mandatoryCouriers = parsed.map((c) => String(c).trim().toUpperCase());
        }
    }
    catch {
        // fallback default
    }
    let enabledCategories = ["instant", "regular", "express", "economy", "cargo"];
    try {
        const parsed = JSON.parse(settings.shippingMasterCategories || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) {
            enabledCategories = parsed.map((c) => String(c).trim().toLowerCase());
        }
    }
    catch {
        // fallback default
    }
    const zone1Multiplier = Math.max(0.1, Number(settings.shippingZone1Multiplier || "1.0") || 1.0);
    const zone2Multiplier = Math.max(0.1, Number(settings.shippingZone2Multiplier || "1.0") || 1.0);
    const zone3Multiplier = Math.max(0.1, Number(settings.shippingZone3Multiplier || "1.0") || 1.0);
    const grabBaseFare = Math.max(0, Number(settings.shippingGrabBaseFare || "15000") || 15000);
    const grabPerKmRate = Math.max(0, Number(settings.shippingGrabPerKmRate || "3000") || 3000);
    const maxInstantDistanceKm = Math.max(1, Number(settings.shippingMaxInstantDistanceKm || "40") || 40);
    const platformHandlingFee = Math.max(0, Number(settings.shippingPlatformHandlingFee || "0") || 0);
    let maintenanceNotices = {};
    try {
        const parsed = JSON.parse(settings.shippingMaintenanceNotices || "{}");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            maintenanceNotices = parsed;
        }
    }
    catch {
        // fallback empty
    }
    return {
        enabledCouriers,
        mandatoryCouriers,
        enabledCategories,
        zoneMultipliers: {
            zone1: zone1Multiplier,
            zone2: zone2Multiplier,
            zone3: zone3Multiplier,
        },
        grabPricing: {
            baseFare: grabBaseFare,
            perKmRate: grabPerKmRate,
            maxDistanceKm: maxInstantDistanceKm,
        },
        platformHandlingFee,
        maintenanceNotices,
    };
};
