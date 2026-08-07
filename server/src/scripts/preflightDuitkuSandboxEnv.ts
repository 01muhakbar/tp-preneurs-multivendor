import "dotenv/config";
import { resolveDuitkuConfig } from "../services/duitku/duitkuConfig.service.js";

type Check = {
  name: string;
  ok: boolean;
  detail: string;
};

const requiredKeys = [
  "DUITKU_ENABLED",
  "DUITKU_ENV",
  "DUITKU_BASE_URL",
  "DUITKU_MERCHANT_CODE",
  "DUITKU_API_KEY",
  "DUITKU_CALLBACK_URL",
  "DUITKU_RETURN_URL",
  "DUITKU_CREATE_INVOICE_PATH",
] as const;

const trim = (value: unknown) => String(value ?? "").trim();
const isEnabled = (value: unknown) => ["1", "true", "yes", "on"].includes(trim(value).toLowerCase());

const parseUrl = (value: string) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isLocalHost = (hostname: string) => {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".local")
  );
};

const publicHttpsUrlCheck = (label: string, value: string): Check => {
  const parsed = parseUrl(value);
  if (!parsed) {
    return { name: label, ok: false, detail: "missing or invalid absolute URL" };
  }
  if (parsed.protocol !== "https:") {
    return { name: label, ok: false, detail: "must use HTTPS for Duitku sandbox reachability" };
  }
  if (isLocalHost(parsed.hostname)) {
    return { name: label, ok: false, detail: "must not point to localhost for provider callback tests" };
  }
  if (parsed.search) {
    return { name: label, ok: false, detail: "must not include query-string secrets" };
  }
  return { name: label, ok: true, detail: `${parsed.origin}${parsed.pathname}` };
};

const checks: Check[] = [];

for (const key of requiredKeys) {
  const present = trim(process.env[key]).length > 0;
  checks.push({
    name: key,
    ok: present,
    detail: present ? "present" : "missing",
  });
}

checks.push({
  name: "NODE_ENV",
  ok: trim(process.env.NODE_ENV || "development") !== "production",
  detail: trim(process.env.NODE_ENV || "development") || "development",
});

checks.push({
  name: "DUITKU_ENABLED_TRUE",
  ok: isEnabled(process.env.DUITKU_ENABLED),
  detail: isEnabled(process.env.DUITKU_ENABLED) ? "enabled" : "disabled",
});

checks.push({
  name: "DUITKU_ENV_SANDBOX",
  ok: trim(process.env.DUITKU_ENV || "sandbox").toLowerCase() === "sandbox",
  detail: trim(process.env.DUITKU_ENV || "sandbox") || "sandbox",
});

const callbackUrl = trim(process.env.DUITKU_CALLBACK_URL);
const returnUrl = trim(process.env.DUITKU_RETURN_URL);
checks.push(publicHttpsUrlCheck("DUITKU_CALLBACK_URL_PUBLIC_HTTPS", callbackUrl));
checks.push(publicHttpsUrlCheck("DUITKU_RETURN_URL_PUBLIC_HTTPS", returnUrl));

try {
  const config = resolveDuitkuConfig(process.env);
  checks.push({
    name: "DUITKU_CONFIG_RESOLUTION",
    ok: true,
    detail: `${config.environment} ${config.baseUrl}${config.createInvoicePath}`,
  });
} catch (error: any) {
  checks.push({
    name: "DUITKU_CONFIG_RESOLUTION",
    ok: false,
    detail: String(error?.message || error),
  });
}

console.log("[duitku-step9-env] Sandbox environment preflight");
for (const check of checks) {
  console.log(`[duitku-step9-env] ${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`);
}

const failed = checks.filter((check) => !check.ok);
if (failed.length > 0) {
  console.error(`[duitku-step9-env] FAIL ${failed.length} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log("[duitku-step9-env] DONE");
}
