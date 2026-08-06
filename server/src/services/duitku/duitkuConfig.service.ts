export type DuitkuEnvironment = "sandbox" | "production";

export type DuitkuConfig = {
  enabled: boolean;
  environment: DuitkuEnvironment;
  baseUrl: string;
  createInvoicePath: string;
  merchantCode: string;
  apiKey: string;
  callbackUrl: string;
  returnUrl: string;
  timeoutMs: number;
};

const DEFAULT_SANDBOX_BASE_URL = "https://api-sandbox.duitku.com";
const DEFAULT_PRODUCTION_BASE_URL = "https://api-prod.duitku.com";
const DEFAULT_CREATE_INVOICE_PATH = "/api/merchant/createInvoice";
const DEFAULT_TIMEOUT_MS = 10000;

const trim = (value: unknown) => String(value ?? "").trim();

const isEnabled = (value: unknown) =>
  ["1", "true", "yes", "on"].includes(trim(value).toLowerCase());

const normalizePath = (value: unknown) => {
  const normalized = trim(value) || DEFAULT_CREATE_INVOICE_PATH;
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const normalizeBaseUrl = (value: unknown, environment: DuitkuEnvironment) => {
  const fallback =
    environment === "production" ? DEFAULT_PRODUCTION_BASE_URL : DEFAULT_SANDBOX_BASE_URL;
  return (trim(value) || fallback).replace(/\/+$/, "");
};

const parseEnvironment = (value: unknown): DuitkuEnvironment => {
  const normalized = trim(value).toLowerCase();
  if (!normalized || normalized === "sandbox") return "sandbox";
  if (normalized === "production") return "production";
  throw new Error("DUITKU_ENV must be sandbox or production.");
};

const parseTimeoutMs = (value: unknown) => {
  const parsed = Number(trim(value) || DEFAULT_TIMEOUT_MS);
  if (!Number.isInteger(parsed) || parsed < 1000 || parsed > 60000) {
    throw new Error("DUITKU_TIMEOUT_MS must be an integer between 1000 and 60000.");
  }
  return parsed;
};

export const resolveDuitkuConfig = (
  env: NodeJS.ProcessEnv = process.env
): DuitkuConfig => {
  const enabled = isEnabled(env.DUITKU_ENABLED);
  const environment = parseEnvironment(env.DUITKU_ENV);
  const config: DuitkuConfig = {
    enabled,
    environment,
    baseUrl: normalizeBaseUrl(env.DUITKU_BASE_URL, environment),
    createInvoicePath: normalizePath(env.DUITKU_CREATE_INVOICE_PATH),
    merchantCode: trim(env.DUITKU_MERCHANT_CODE),
    apiKey: trim(env.DUITKU_API_KEY),
    callbackUrl: trim(env.DUITKU_CALLBACK_URL),
    returnUrl: trim(env.DUITKU_RETURN_URL),
    timeoutMs: parseTimeoutMs(env.DUITKU_TIMEOUT_MS),
  };

  if (!enabled) return config;
  if (env.NODE_ENV === "production") {
    throw new Error("Duitku Step 4 client is not approved for production runtime.");
  }
  if (!/^https:\/\//i.test(config.baseUrl)) {
    throw new Error("DUITKU_BASE_URL must be an https URL when enabled.");
  }
  if (!config.merchantCode) throw new Error("DUITKU_MERCHANT_CODE is required when enabled.");
  if (!config.apiKey) throw new Error("DUITKU_API_KEY is required when enabled.");
  if (!/^https?:\/\//i.test(config.callbackUrl)) {
    throw new Error("DUITKU_CALLBACK_URL must be an absolute URL when enabled.");
  }
  if (!/^https?:\/\//i.test(config.returnUrl)) {
    throw new Error("DUITKU_RETURN_URL must be an absolute URL when enabled.");
  }
  return config;
};

export const buildDuitkuCreateInvoiceUrl = (config: DuitkuConfig) =>
  `${config.baseUrl}${config.createInvoicePath}`;
