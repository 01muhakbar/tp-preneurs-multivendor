import "dotenv/config";
import { resolveDuitkuConfig } from "../services/duitku/duitkuConfig.service.js";

const config = resolveDuitkuConfig();
if (!config.enabled) {
  throw new Error("Duitku return URL sandbox runner requires DUITKU_ENABLED=true.");
}
if (config.environment !== "sandbox") {
  throw new Error("Duitku return URL sandbox runner refuses non-sandbox DUITKU_ENV.");
}

const url = new URL(config.returnUrl);
url.searchParams.set("merchantOrderId", "TPSTEP9RETURN");
url.searchParams.set("reference", "RETURN-READONLY");
url.searchParams.set("resultCode", "00");

console.log("[duitku-step9-return-url] RUN return URL read-only scenario");
console.log(`[duitku-step9-return-url] returnUrl=${url.origin}${url.pathname}`);

const response = await fetch(url, {
  method: "GET",
  redirect: "manual",
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

const location = response.headers.get("location") || "";
console.log(`[duitku-step9-return-url] status=${response.status}`);
console.log(`[duitku-step9-return-url] location=${location || "-"}`);

if (![200, 302, 303].includes(response.status)) {
  throw new Error(`Return URL should be reachable, got HTTP ${response.status}.`);
}
if (response.status >= 300 && !location.includes("/user/my-orders")) {
  throw new Error("Return URL redirect should point to the read-only order page.");
}

console.log("[duitku-step9-return-url] PASS return URL is reachable and read-only");
