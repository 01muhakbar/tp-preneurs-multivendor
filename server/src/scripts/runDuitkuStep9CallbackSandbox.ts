import "dotenv/config";
import { createDuitkuCallbackSignature } from "../services/duitku/duitkuCallbackSigner.service.js";
import { resolveDuitkuConfig } from "../services/duitku/duitkuConfig.service.js";

const trim = (value: unknown) => String(value ?? "").trim();

const assertSandboxRuntime = () => {
  const config = resolveDuitkuConfig();
  if (!config.enabled) {
    throw new Error("Duitku callback sandbox runner requires DUITKU_ENABLED=true.");
  }
  if (config.environment !== "sandbox") {
    throw new Error("Duitku callback sandbox runner refuses non-sandbox DUITKU_ENV.");
  }
  if (trim(process.env.NODE_ENV || "development") === "production") {
    throw new Error("Duitku callback sandbox runner refuses NODE_ENV=production.");
  }
  return config;
};

const postForm = async (url: string, fields: Record<string, string>) => {
  const body = new URLSearchParams(fields);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "ngrok-skip-browser-warning": "true",
    },
    body,
  });
  const text = await response.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text.slice(0, 160) };
  }
  return { status: response.status, parsed };
};

const expect = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const config = assertSandboxRuntime();
const merchantOrderId = `TPSTEP9CB${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;
const amount = "10000";
const reference = `SANDBOX-${merchantOrderId}`;
const validSignature = createDuitkuCallbackSignature({
  merchantCode: config.merchantCode,
  amount,
  merchantOrderId,
  apiKey: config.apiKey,
});

console.log("[duitku-step9-callback] RUN callback public URL scenarios");
console.log(`[duitku-step9-callback] callbackUrl=${config.callbackUrl}`);
console.log(`[duitku-step9-callback] merchantOrderId=${merchantOrderId}`);

const invalidSignature = await postForm(config.callbackUrl, {
  merchantCode: config.merchantCode,
  amount,
  merchantOrderId,
  reference,
  resultCode: "00",
  signature: "0".repeat(64),
});
console.log(
  `[duitku-step9-callback] invalidSignature status=${invalidSignature.status} accepted=${invalidSignature.parsed?.accepted} storedAsSecurityEvent=${invalidSignature.parsed?.storedAsSecurityEvent}`
);
expect(invalidSignature.status === 200, "invalid signature callback should return 200");
expect(invalidSignature.parsed?.accepted === false, "invalid signature callback must not be accepted");
expect(
  invalidSignature.parsed?.storedAsSecurityEvent === true,
  "invalid signature callback must store security event"
);

const malformed = await postForm(config.callbackUrl, {
  merchantCode: config.merchantCode,
  amount,
  merchantOrderId,
});
console.log(`[duitku-step9-callback] malformed status=${malformed.status} message=${malformed.parsed?.message || "-"}`);
expect(malformed.status === 400, "malformed callback should return 400");

const validUnknown = await postForm(config.callbackUrl, {
  merchantCode: config.merchantCode,
  amount,
  merchantOrderId,
  reference,
  resultCode: "00",
  signature: validSignature,
});
console.log(
  `[duitku-step9-callback] validUnknown status=${validUnknown.status} accepted=${validUnknown.parsed?.accepted} bindingState=${validUnknown.parsed?.bindingState} processingResult=${validUnknown.parsed?.processingResult}`
);
expect(validUnknown.status === 200, "valid unknown callback should return 200");
expect(validUnknown.parsed?.accepted === true, "valid unknown callback should be accepted as evidence");
expect(validUnknown.parsed?.bindingState === "UNBOUND", "valid unknown callback should remain UNBOUND");
expect(
  validUnknown.parsed?.financialMutationApplied === false,
  "valid unknown callback must not apply financial mutation"
);

const duplicate = await postForm(config.callbackUrl, {
  merchantCode: config.merchantCode,
  amount,
  merchantOrderId,
  reference,
  resultCode: "00",
  signature: validSignature,
});
console.log(
  `[duitku-step9-callback] duplicate status=${duplicate.status} accepted=${duplicate.parsed?.accepted} duplicate=${duplicate.parsed?.duplicate}`
);
expect(duplicate.status === 200, "duplicate callback should return 200");
expect(duplicate.parsed?.duplicate === true, "duplicate callback should be detected");

console.log("[duitku-step9-callback] PASS callback safety scenarios");
