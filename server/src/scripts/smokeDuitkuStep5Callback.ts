import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import { Op } from "sequelize";
import { createDuitkuCallbackSignature } from "../services/duitku/duitkuCallbackSigner.service.js";
import { sha256Hex } from "../services/duitku/duitkuCallbackParser.service.js";
import { sequelize, DuitkuCallbackInbox, OrderPaymentSecurityEvent } from "../models/index.js";

const logPass = (label: string) => {
  console.log(`[duitku-step5] PASS ${label}`);
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
};

Object.assign(process.env, baseEnv);

const buildForm = (fields: Record<string, string>) => new URLSearchParams(fields).toString();
let smokeUserAgent = "duitku-step5-smoke";

const signedCallbackForm = (merchantOrderId: string, overrides: Record<string, string> = {}) => {
  const fields = {
    merchantCode: "D123",
    amount: "150000",
    merchantOrderId,
    resultCode: "00",
    reference: `REF-${merchantOrderId}`,
    ...overrides,
  };
  const signature = createDuitkuCallbackSignature({
    merchantCode: fields.merchantCode,
    amount: fields.amount,
    merchantOrderId: fields.merchantOrderId,
    apiKey: "secret",
  });
  return buildForm({ ...fields, signature: overrides.signature || signature });
};

async function postForm(baseUrl: string, body: string, contentType = "application/x-www-form-urlencoded") {
  const response = await fetch(`${baseUrl}/api/payments/duitku/callback`, {
    method: "POST",
    headers: {
      "content-type": contentType,
      "user-agent": smokeUserAgent,
    },
    body,
  });
  return {
    status: response.status,
    json: (await response.json()) as any,
  };
}

async function withServer<T>(callback: (baseUrl: string) => Promise<T>) {
  const { default: duitkuCallbackRouter } = await import("../routes/duitku.callback.js");
  const app = express();
  app.use("/api/payments/duitku", duitkuCallbackRouter);
  app.use(express.json());
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.equal(typeof address, "object");
  const port = address && typeof address === "object" ? address.port : 0;
  try {
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function cleanup(prefix: string) {
  await DuitkuCallbackInbox.destroy({
    where: {
      merchantOrderIdRaw: {
        [Op.like]: `${prefix}%`,
      },
    },
  });
  await OrderPaymentSecurityEvent.destroy({
    where: {
      [Op.or]: [
        {
          merchantOrderIdPrefix: {
            [Op.like]: `${prefix}%`,
          },
        },
        {
          userAgentHash: sha256Hex(smokeUserAgent),
        },
      ],
    },
  });
}

async function main() {
  await sequelize.authenticate();
  const prefix = `STEP5-${Date.now()}`;
  smokeUserAgent = `duitku-step5-smoke/${prefix}`;
  await cleanup(prefix);

  try {
    await withServer(async (baseUrl) => {
      const validMerchantOrderId = `${prefix}-VALID`;
      const valid = await postForm(baseUrl, signedCallbackForm(validMerchantOrderId));
      assert.equal(valid.status, 200);
      assert.equal(valid.json.accepted, true);
      assert.equal(valid.json.financialMutationApplied, false);
      assert.equal(valid.json.processingResult, "QUARANTINED");
      logPass("valid signed callback is stored without financial mutation");

      const duplicate = await postForm(baseUrl, signedCallbackForm(validMerchantOrderId));
      assert.equal(duplicate.status, 200);
      assert.equal(duplicate.json.duplicate, true);
      logPass("duplicate valid callback is idempotent");

      const invalidMerchantOrderId = `${prefix}-BAD-SIGNATURE`;
      const invalid = await postForm(
        baseUrl,
        signedCallbackForm(invalidMerchantOrderId, { signature: "0".repeat(64) })
      );
      assert.equal(invalid.status, 200);
      assert.equal(invalid.json.storedAsSecurityEvent, true);
      logPass("invalid signature stored only as security event");

      const malformed = await postForm(baseUrl, `merchantCode=D123&merchantOrderId=${prefix}-MALFORMED`);
      assert.equal(malformed.status, 400);
      logPass("missing required field rejected as malformed");

      const duplicateKey = await postForm(
        baseUrl,
        `merchantCode=D123&merchantCode=D123&amount=1&merchantOrderId=${prefix}-DUP&signature=x&resultCode=00`
      );
      assert.equal(duplicateKey.status, 400);
      logPass("duplicate form key rejected");

      const nestedKey = await postForm(
        baseUrl,
        `merchantCode=D123&amount=1&merchantOrderId=${prefix}-NESTED&signature=x&resultCode=00&extra[name]=x`
      );
      assert.equal(nestedKey.status, 400);
      logPass("nested form key rejected");

      const unsupported = await postForm(baseUrl, "{}", "application/json");
      assert.equal(unsupported.status, 415);
      logPass("unsupported content-type rejected before global json parser");
    });
  } finally {
    await cleanup(prefix);
    await sequelize.close().catch(() => null);
  }

  console.log("[duitku-step5] DONE");
}

main().catch((error) => {
  console.error("[duitku-step5] FAIL", error);
  process.exitCode = 1;
});
