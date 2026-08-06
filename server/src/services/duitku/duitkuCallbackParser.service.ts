import { createHash } from "node:crypto";
import { verifyDuitkuCallbackSignature } from "./duitkuCallbackSigner.service.js";

export const DUITKU_CALLBACK_BODY_LIMIT_BYTES = 64 * 1024;
const MAX_FIELD_COUNT = 32;
const MAX_FIELD_VALUE_LENGTH = 2048;

export type DuitkuCallbackFields = {
  merchantCode: string;
  amount: string;
  merchantOrderId: string;
  signature: string;
  resultCode: string;
  reference?: string;
  paymentCode?: string;
  merchantUserId?: string;
  productDetail?: string;
  additionalParam?: string;
  [key: string]: string | undefined;
};

export type ParsedDuitkuCallback = {
  fields: DuitkuCallbackFields;
  rawBody: Buffer;
  rawBodyDigest: string;
  fieldValuesDigest: string;
  occurrenceKey: string;
  eventHash: string;
  signatureValid: boolean;
  merchantCodeMatchesConfig: boolean;
};

export class DuitkuCallbackParseError extends Error {
  statusCode: number;
  reason: string;
  fields?: Partial<DuitkuCallbackFields>;
  rawBodyDigest?: string;
  fieldValuesDigest?: string;

  constructor(
    reason: string,
    options: {
      statusCode?: number;
      fields?: Partial<DuitkuCallbackFields>;
      rawBodyDigest?: string;
      fieldValuesDigest?: string;
    } = {}
  ) {
    super(reason);
    this.name = "DuitkuCallbackParseError";
    this.reason = reason;
    this.statusCode = options.statusCode ?? 400;
    this.fields = options.fields;
    this.rawBodyDigest = options.rawBodyDigest;
    this.fieldValuesDigest = options.fieldValuesDigest;
  }
}

export const sha256Hex = (input: string | Buffer) =>
  createHash("sha256").update(input).digest("hex");

const normalizeContentType = (contentType: string | undefined) =>
  String(contentType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

const decodeFormComponent = (value: string) => {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    throw new DuitkuCallbackParseError("callback contains invalid percent encoding");
  }
};

const isNestedOrPrototypeKey = (key: string) =>
  key.includes("[") ||
  key.includes("]") ||
  key.includes(".") ||
  key === "__proto__" ||
  key === "constructor" ||
  key === "prototype";

const digestFields = (fields: Record<string, string>) =>
  sha256Hex(
    Object.keys(fields)
      .sort()
      .map((key) => `${key}=${fields[key]}`)
      .join("\n")
  );

const parseUrlEncodedForm = (rawBody: Buffer) => {
  const decodedBody = rawBody.toString("utf8");
  const fields: Record<string, string> = {};
  const segments = decodedBody.length > 0 ? decodedBody.split("&") : [];
  if (segments.length > MAX_FIELD_COUNT) {
    throw new DuitkuCallbackParseError("callback contains too many fields");
  }

  for (const segment of segments) {
    if (!segment) continue;
    const separatorIndex = segment.indexOf("=");
    const encodedKey = separatorIndex >= 0 ? segment.slice(0, separatorIndex) : segment;
    const encodedValue = separatorIndex >= 0 ? segment.slice(separatorIndex + 1) : "";
    const key = decodeFormComponent(encodedKey);
    const value = decodeFormComponent(encodedValue);

    if (!key) throw new DuitkuCallbackParseError("callback contains empty field key");
    if (isNestedOrPrototypeKey(key)) {
      throw new DuitkuCallbackParseError("callback contains unsupported nested field key");
    }
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      throw new DuitkuCallbackParseError("callback contains duplicate field key");
    }
    if (value.length > MAX_FIELD_VALUE_LENGTH) {
      throw new DuitkuCallbackParseError("callback contains oversized field value");
    }
    fields[key] = value;
  }
  return fields;
};

const requiredFields = ["merchantCode", "amount", "merchantOrderId", "signature", "resultCode"];

const normalizeCallbackFields = (fields: Record<string, string>): DuitkuCallbackFields => {
  const missing = requiredFields.filter((field) => !fields[field]);
  if (missing.length > 0) {
    throw new DuitkuCallbackParseError(`callback missing required fields: ${missing.join(", ")}`, {
      fields,
      fieldValuesDigest: digestFields(fields),
    });
  }
  return fields as DuitkuCallbackFields;
};

export const parseAndVerifyDuitkuCallback = (input: {
  rawBody: Buffer | string | undefined;
  contentType?: string;
  merchantCode: string;
  apiKey: string;
}): ParsedDuitkuCallback => {
  if (normalizeContentType(input.contentType) !== "application/x-www-form-urlencoded") {
    throw new DuitkuCallbackParseError("callback content-type must be application/x-www-form-urlencoded", {
      statusCode: 415,
    });
  }

  const rawBody =
    Buffer.isBuffer(input.rawBody) ? input.rawBody : Buffer.from(String(input.rawBody ?? ""), "utf8");
  if (rawBody.byteLength > DUITKU_CALLBACK_BODY_LIMIT_BYTES) {
    throw new DuitkuCallbackParseError("callback body exceeds 64 KiB", { statusCode: 413 });
  }

  const rawBodyDigest = sha256Hex(rawBody);
  let fields: Record<string, string>;
  try {
    fields = parseUrlEncodedForm(rawBody);
  } catch (error) {
    if (error instanceof DuitkuCallbackParseError) {
      error.rawBodyDigest = rawBodyDigest;
    }
    throw error;
  }

  const fieldValuesDigest = digestFields(fields);
  let normalized: DuitkuCallbackFields;
  try {
    normalized = normalizeCallbackFields(fields);
  } catch (error) {
    if (error instanceof DuitkuCallbackParseError) {
      error.rawBodyDigest = rawBodyDigest;
      error.fieldValuesDigest = fieldValuesDigest;
    }
    throw error;
  }

  const merchantCodeMatchesConfig = normalized.merchantCode === input.merchantCode;
  const signatureValid =
    merchantCodeMatchesConfig &&
    verifyDuitkuCallbackSignature({
      merchantCode: normalized.merchantCode,
      amount: normalized.amount,
      merchantOrderId: normalized.merchantOrderId,
      apiKey: input.apiKey,
      signature: normalized.signature,
    });

  const occurrenceKey = sha256Hex(`duitku-callback-occurrence-v1\n${fieldValuesDigest}`);
  const eventHash = sha256Hex(`duitku-callback-event-v1\n${rawBodyDigest}\n${fieldValuesDigest}`);

  return {
    fields: normalized,
    rawBody,
    rawBodyDigest,
    fieldValuesDigest,
    occurrenceKey,
    eventHash,
    signatureValid,
    merchantCodeMatchesConfig,
  };
};
