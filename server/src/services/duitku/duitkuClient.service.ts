import {
  buildDuitkuCreateInvoiceUrl,
  type DuitkuConfig,
} from "./duitkuConfig.service.js";
import { buildDuitkuCreateInvoiceHeaders } from "./duitkuSigner.service.js";
import type {
  DuitkuCreateInvoiceInput,
  DuitkuCreateInvoiceRequest,
  DuitkuCreateInvoiceResponse,
  NormalizedDuitkuCreateInvoiceResponse,
} from "./duitkuTypes.js";

export type DuitkuFetch = typeof fetch;

const trim = (value: unknown) => String(value ?? "").trim();

const assertPositiveInteger = (label: string, value: unknown) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return parsed;
};

const optionalText = (value: unknown, maxLength: number) => {
  const normalized = trim(value);
  if (!normalized) return undefined;
  if (normalized.length > maxLength) {
    throw new Error(`Duitku text field exceeds ${maxLength} characters.`);
  }
  return normalized;
};

export const buildDuitkuCreateInvoiceRequest = (
  input: DuitkuCreateInvoiceInput,
  config: Pick<DuitkuConfig, "callbackUrl" | "returnUrl">
): DuitkuCreateInvoiceRequest => {
  const paymentAmount = assertPositiveInteger("paymentAmount", input.paymentAmount);
  const merchantOrderId = optionalText(input.merchantOrderId, 50);
  const productDetails = optionalText(input.productDetails, 255);
  const email = optionalText(input.email, 255);
  const callbackUrl = optionalText(input.callbackUrl || config.callbackUrl, 255);
  const returnUrl = optionalText(input.returnUrl || config.returnUrl, 255);
  if (!merchantOrderId) throw new Error("merchantOrderId is required.");
  if (!productDetails) throw new Error("productDetails is required.");
  if (!email) throw new Error("email is required.");
  if (!callbackUrl || !/^https?:\/\//i.test(callbackUrl)) {
    throw new Error("callbackUrl must be an absolute URL.");
  }
  if (!returnUrl || !/^https?:\/\//i.test(returnUrl)) {
    throw new Error("returnUrl must be an absolute URL.");
  }

  const request: DuitkuCreateInvoiceRequest = {
    paymentAmount,
    merchantOrderId,
    productDetails,
    email,
    callbackUrl,
    returnUrl,
  };

  const additionalParam = optionalText(input.additionalParam, 255);
  const merchantUserInfo = optionalText(input.merchantUserInfo, 255);
  const paymentMethod = optionalText(input.paymentMethod, 20);
  const customerVaName = optionalText(input.customerVaName, 20);
  const phoneNumber = optionalText(input.phoneNumber, 50);
  if (additionalParam !== undefined) request.additionalParam = additionalParam;
  if (merchantUserInfo !== undefined) request.merchantUserInfo = merchantUserInfo;
  if (paymentMethod !== undefined) request.paymentMethod = paymentMethod;
  if (customerVaName !== undefined) request.customerVaName = customerVaName;
  if (phoneNumber !== undefined) request.phoneNumber = phoneNumber;
  if (input.itemDetails?.length) {
    request.itemDetails = input.itemDetails.map((item) => ({
      name: optionalText(item.name, 255) || "Item",
      price: assertPositiveInteger("itemDetails.price", item.price),
      quantity: assertPositiveInteger("itemDetails.quantity", item.quantity),
    }));
  }
  if (input.customerDetail) request.customerDetail = input.customerDetail;
  if (input.expiryPeriod !== undefined) {
    request.expiryPeriod = assertPositiveInteger("expiryPeriod", input.expiryPeriod);
  }
  return request;
};

export const normalizeDuitkuCreateInvoiceResponse = (
  raw: DuitkuCreateInvoiceResponse
): NormalizedDuitkuCreateInvoiceResponse => {
  const statusCode = trim(raw.statusCode);
  const amountValue =
    raw.amount === undefined || raw.amount === null || raw.amount === ""
      ? null
      : Number(raw.amount);
  return {
    ok: statusCode === "00",
    statusCode,
    statusMessage: trim(raw.statusMessage),
    merchantCode: trim(raw.merchantCode) || null,
    reference: trim(raw.reference) || null,
    paymentUrl: trim(raw.paymentUrl) || null,
    vaNumber: trim(raw.vaNumber) || null,
    amount: Number.isFinite(amountValue) ? amountValue : null,
    raw,
  };
};

export class DuitkuClient {
  private readonly config: DuitkuConfig;
  private readonly fetchImpl: DuitkuFetch;
  private readonly now: () => number;

  constructor(input: {
    config: DuitkuConfig;
    fetchImpl?: DuitkuFetch;
    now?: () => number;
  }) {
    this.config = input.config;
    this.fetchImpl = input.fetchImpl || fetch;
    this.now = input.now || Date.now;
  }

  async createInvoice(
    input: DuitkuCreateInvoiceInput
  ): Promise<NormalizedDuitkuCreateInvoiceResponse> {
    if (!this.config.enabled) {
      throw new Error("Duitku client is disabled.");
    }

    const timestamp = String(this.now());
    const request = buildDuitkuCreateInvoiceRequest(input, this.config);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetchImpl(buildDuitkuCreateInvoiceUrl(this.config), {
        method: "POST",
        headers: buildDuitkuCreateInvoiceHeaders({
          merchantCode: this.config.merchantCode,
          timestamp,
          apiKey: this.config.apiKey,
        }),
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      const bodyText = await response.text();
      let parsed: DuitkuCreateInvoiceResponse;
      try {
        parsed = bodyText ? JSON.parse(bodyText) : {};
      } catch {
        throw new Error("Duitku Create Invoice response was not valid JSON.");
      }

      if (!response.ok) {
        const statusCode = trim(parsed.statusCode) || String(response.status);
        const message = trim(parsed.statusMessage) || response.statusText || "HTTP error";
        throw new Error(`Duitku Create Invoice failed: ${statusCode} ${message}`);
      }

      return normalizeDuitkuCreateInvoiceResponse(parsed);
    } catch (error: any) {
      if (error?.name === "AbortError") {
        throw new Error("Duitku Create Invoice timed out.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
