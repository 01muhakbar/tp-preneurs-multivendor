import { createHmac, timingSafeEqual } from "node:crypto";

export const createDuitkuCallbackSignature = (input: {
  merchantCode: string;
  amount: string;
  merchantOrderId: string;
  apiKey: string;
}) => {
  const merchantCode = String(input.merchantCode ?? "");
  const amount = String(input.amount ?? "");
  const merchantOrderId = String(input.merchantOrderId ?? "");
  const apiKey = String(input.apiKey ?? "");
  if (!merchantCode) throw new Error("Duitku callback merchantCode is required for signing.");
  if (!amount) throw new Error("Duitku callback amount is required for signing.");
  if (!merchantOrderId) throw new Error("Duitku callback merchantOrderId is required for signing.");
  if (!apiKey) throw new Error("Duitku apiKey is required for callback signing.");
  return createHmac("sha256", apiKey)
    .update(`${merchantCode}${amount}${merchantOrderId}`)
    .digest("hex");
};

export const verifyDuitkuCallbackSignature = (input: {
  merchantCode: string;
  amount: string;
  merchantOrderId: string;
  apiKey: string;
  signature: string;
}) => {
  const expected = createDuitkuCallbackSignature(input);
  const actual = String(input.signature ?? "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(actual)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
};
