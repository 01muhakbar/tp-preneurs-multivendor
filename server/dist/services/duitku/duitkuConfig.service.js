const DEFAULT_SANDBOX_BASE_URL = "https://api-sandbox.duitku.com";
const DEFAULT_PRODUCTION_BASE_URL = "https://api-prod.duitku.com";
const DEFAULT_CREATE_INVOICE_PATH = "/api/merchant/createInvoice";
const DEFAULT_TIMEOUT_MS = 10000;
const trim = (value) => String(value ?? "").trim();
const isEnabled = (value) => ["1", "true", "yes", "on"].includes(trim(value).toLowerCase());
const parseEnabledFlag = (value) => {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value !== 0;
    const normalized = trim(value).toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized))
        return true;
    if (["0", "false", "no", "off"].includes(normalized))
        return false;
    return null;
};
const normalizeOrigin = (value) => {
    const candidate = trim(value).replace(/\/+$/, "");
    if (!candidate)
        return "";
    try {
        const url = new URL(candidate);
        return `${url.protocol}//${url.host}`;
    }
    catch {
        return "";
    }
};
const resolvePublicOrigin = (env = process.env) => normalizeOrigin(env.PUBLIC_BASE_URL ||
    env.CLIENT_PUBLIC_BASE_URL ||
    env.STORE_PUBLIC_BASE_URL ||
    env.CLIENT_URL ||
    env.CORS_ORIGIN ||
    env.RENDER_EXTERNAL_URL) ||
    (trim(env.RENDER_EXTERNAL_HOSTNAME)
        ? normalizeOrigin(`https://${trim(env.RENDER_EXTERNAL_HOSTNAME).replace(/^https?:\/\//i, "")}`)
        : "") ||
    (trim(env.KOYEB_PUBLIC_DOMAIN)
        ? normalizeOrigin(`https://${trim(env.KOYEB_PUBLIC_DOMAIN).replace(/^https?:\/\//i, "")}`)
        : "");
const buildPublicUrl = (env, pathname) => {
    const origin = resolvePublicOrigin(env);
    if (!origin)
        return "";
    return new URL(pathname, origin).toString();
};
const normalizePath = (value) => {
    const normalized = trim(value) || DEFAULT_CREATE_INVOICE_PATH;
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
};
const normalizeBaseUrl = (value, environment) => {
    const fallback = environment === "production" ? DEFAULT_PRODUCTION_BASE_URL : DEFAULT_SANDBOX_BASE_URL;
    return (trim(value) || fallback).replace(/\/+$/, "");
};
const parseEnvironment = (value) => {
    const normalized = trim(value).toLowerCase();
    if (!normalized || normalized === "sandbox")
        return "sandbox";
    if (normalized === "production")
        return "production";
    throw new Error("DUITKU_ENV must be sandbox or production.");
};
const parseTimeoutMs = (value) => {
    const parsed = Number(trim(value) || DEFAULT_TIMEOUT_MS);
    if (!Number.isInteger(parsed) || parsed < 1000 || parsed > 60000) {
        throw new Error("DUITKU_TIMEOUT_MS must be an integer between 1000 and 60000.");
    }
    return parsed;
};
export const resolveDuitkuConfig = (env = process.env, dbSettings) => {
    const dbEnabled = dbSettings?.payments
        ? parseEnabledFlag(dbSettings.payments.duitkuEnabled)
        : null;
    const enabled = dbEnabled ?? isEnabled(env.DUITKU_ENABLED);
    const envEnvironment = trim(env.DUITKU_ENV);
    let environment = parseEnvironment(envEnvironment);
    let merchantCode = trim(env.DUITKU_MERCHANT_CODE);
    let apiKey = trim(env.DUITKU_API_KEY);
    if (dbSettings && dbSettings.payments) {
        if (dbSettings.payments.duitkuEnvironment === "sandbox" || dbSettings.payments.duitkuEnvironment === "production") {
            environment = dbSettings.payments.duitkuEnvironment;
        }
        if (environment === "sandbox") {
            if (dbSettings.payments.duitkuSandboxMerchantCode) {
                merchantCode = trim(dbSettings.payments.duitkuSandboxMerchantCode);
            }
            if (dbSettings.payments.duitkuSandboxApiKey) {
                apiKey = trim(dbSettings.payments.duitkuSandboxApiKey);
            }
        }
        else {
            if (dbSettings.payments.duitkuProductionMerchantCode) {
                merchantCode = trim(dbSettings.payments.duitkuProductionMerchantCode);
            }
            if (dbSettings.payments.duitkuProductionApiKey) {
                apiKey = trim(dbSettings.payments.duitkuProductionApiKey);
            }
        }
    }
    const config = {
        enabled,
        environment,
        baseUrl: normalizeBaseUrl(env.DUITKU_BASE_URL, environment),
        createInvoicePath: normalizePath(env.DUITKU_CREATE_INVOICE_PATH),
        merchantCode,
        apiKey,
        callbackUrl: trim(env.DUITKU_CALLBACK_URL) ||
            buildPublicUrl(env, "/api/payments/duitku/callback"),
        returnUrl: trim(env.DUITKU_RETURN_URL) || buildPublicUrl(env, "/payments/return"),
        timeoutMs: parseTimeoutMs(env.DUITKU_TIMEOUT_MS),
    };
    const throwWith400 = (msg) => {
        const err = new Error(msg);
        err.statusCode = 400;
        throw err;
    };
    if (!enabled)
        return config;
    if (!/^https:\/\//i.test(config.baseUrl)) {
        throwWith400("DUITKU_BASE_URL must be an https URL when enabled.");
    }
    if (!config.merchantCode)
        throwWith400("DUITKU_MERCHANT_CODE is required when enabled.");
    if (!config.apiKey)
        throwWith400("DUITKU_API_KEY is required when enabled.");
    if (!/^https?:\/\//i.test(config.callbackUrl)) {
        throwWith400("DUITKU_CALLBACK_URL must be an absolute URL when enabled.");
    }
    if (!/^https?:\/\//i.test(config.returnUrl)) {
        throwWith400("DUITKU_RETURN_URL must be an absolute URL when enabled.");
    }
    return config;
};
export const buildDuitkuCreateInvoiceUrl = (config) => `${config.baseUrl}${config.createInvoicePath}`;
