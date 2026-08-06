import assert from "node:assert/strict";
import { buildDuitkuCreateInvoiceRequest, DuitkuClient } from "../services/duitku/duitkuClient.service.js";
import { resolveDuitkuConfig } from "../services/duitku/duitkuConfig.service.js";
import {
  buildDuitkuCreateInvoiceHeaders,
  createDuitkuCreateInvoiceSignature,
} from "../services/duitku/duitkuSigner.service.js";
import { redactDuitkuPayload } from "../services/duitku/duitkuRedaction.service.js";
import {
  buildDuitkuAttemptHashes,
  mapDuitkuCreateInvoiceAttemptStatus,
  sha256Hex,
} from "../services/duitku/duitkuAttemptPersistence.service.js";

const logPass = (label: string) => {
  console.log(`[duitku-step4] PASS ${label}`);
};

const baseEnv = {
  NODE_ENV: "development",
  DUITKU_ENABLED: "true",
  DUITKU_ENV: "sandbox",
  DUITKU_BASE_URL: "https://api-sandbox.duitku.com",
  DUITKU_MERCHANT_CODE: "D123",
  DUITKU_API_KEY: "secret",
  DUITKU_CALLBACK_URL: "https://example.test/api/payments/duitku/callback",
  DUITKU_RETURN_URL: "https://example.test/payments/return",
  DUITKU_TIMEOUT_MS: "5000",
  DUITKU_CREATE_INVOICE_PATH: "/api/merchant/createInvoice",
};

function sampleInvoiceInput() {
  return {
    paymentAmount: 40000,
    merchantOrderId: "INV-STEP4-001",
    productDetails: "Step 4 Test Invoice",
    email: "buyer@example.test",
    customerVaName: "Buyer",
    itemDetails: [
      {
        name: "Item A",
        price: 10000,
        quantity: 1,
      },
      {
        name: "Item B",
        price: 30000,
        quantity: 1,
      },
    ],
    expiryPeriod: 60,
  };
}

async function main() {
  const signature = createDuitkuCreateInvoiceSignature({
    merchantCode: "D123",
    timestamp: "1773728479616",
    apiKey: "secret",
  });
  assert.equal(signature, "d5de9e9508f761cf7b15ef5b2b6ec85a4002c9ecc9549a41d7ff2ed38c537bfc");
  logPass("Create Invoice HMAC SHA256 signer");

  const headers = buildDuitkuCreateInvoiceHeaders({
    merchantCode: "D123",
    timestamp: "1773728479616",
    apiKey: "secret",
  });
  assert.equal(headers["x-duitku-merchantcode"], "D123");
  assert.equal(headers["x-duitku-signature"], signature);
  logPass("Create Invoice headers");

  const config = resolveDuitkuConfig(baseEnv);
  assert.equal(config.enabled, true);
  assert.equal(config.environment, "sandbox");
  assert.equal(config.baseUrl, "https://api-sandbox.duitku.com");
  logPass("config resolver for sandbox");

  assert.throws(
    () => resolveDuitkuConfig({ ...baseEnv, NODE_ENV: "production" }),
    /not approved for production/
  );
  logPass("production guard");

  const request = buildDuitkuCreateInvoiceRequest(sampleInvoiceInput(), config);
  assert.equal(request.callbackUrl, baseEnv.DUITKU_CALLBACK_URL);
  assert.equal(request.returnUrl, baseEnv.DUITKU_RETURN_URL);
  assert.equal(request.paymentAmount, 40000);
  logPass("request DTO builder");

  let fetchCalled = 0;
  const client = new DuitkuClient({
    config,
    now: () => 1773728479616,
    fetchImpl: async (url, init) => {
      fetchCalled += 1;
      assert.equal(String(url), "https://api-sandbox.duitku.com/api/merchant/createInvoice");
      assert.equal(init?.method, "POST");
      const sentHeaders = init?.headers as Record<string, string>;
      assert.equal(sentHeaders["x-duitku-signature"], signature);
      assert.equal(sentHeaders["x-duitku-merchantcode"], "D123");
      assert.equal(JSON.parse(String(init?.body)).merchantOrderId, "INV-STEP4-001");
      return new Response(
        JSON.stringify({
          merchantCode: "D123",
          reference: "D123REF001",
          paymentUrl: "https://app-sandbox.duitku.com/redirect_checkout?reference=D123REF001",
          statusCode: "00",
          statusMessage: "SUCCESS",
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    },
  });
  const response = await client.createInvoice(sampleInvoiceInput());
  assert.equal(fetchCalled, 1);
  assert.equal(response.ok, true);
  assert.equal(response.reference, "D123REF001");
  assert.equal(mapDuitkuCreateInvoiceAttemptStatus(response), "PENDING");
  logPass("client createInvoice success mapping with mocked fetch");

  const failedClient = new DuitkuClient({
    config,
    now: () => 1773728479616,
    fetchImpl: async () =>
      new Response(JSON.stringify({ statusCode: "01", statusMessage: "FAILED" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  });
  const failedResponse = await failedClient.createInvoice(sampleInvoiceInput());
  assert.equal(failedResponse.ok, false);
  assert.equal(mapDuitkuCreateInvoiceAttemptStatus(failedResponse), "FAILED");
  logPass("client createInvoice failed provider mapping");

  const redacted = redactDuitkuPayload({
    apiKey: "secret",
    paymentUrl: "https://example.test/pay",
    nested: { signature: "abc" },
  });
  assert.deepEqual(redacted, {
    apiKey: "<redacted>",
    paymentUrl: "<redacted-url>",
    nested: { signature: "<redacted>" },
  });
  logPass("redaction helper");

  const firstHashes = buildDuitkuAttemptHashes({
    idempotencyKey: "idem-1",
    request,
  });
  const secondHashes = buildDuitkuAttemptHashes({
    idempotencyKey: "idem-1",
    request: { ...request },
  });
  assert.deepEqual(firstHashes, secondHashes);
  assert.equal(firstHashes.idempotencyKeyHash, sha256Hex("idem-1"));
  logPass("idempotency and request fingerprint hashes");

  assert.throws(
    () =>
      buildDuitkuCreateInvoiceRequest(
        {
          ...sampleInvoiceInput(),
          merchantOrderId: "x".repeat(51),
        },
        config
      ),
    /exceeds 50/
  );
  logPass("request validation rejects provider limit violation");

  console.log("[duitku-step4] DONE");
}

main().catch((error) => {
  console.error("[duitku-step4] FAIL", error);
  process.exitCode = 1;
});
