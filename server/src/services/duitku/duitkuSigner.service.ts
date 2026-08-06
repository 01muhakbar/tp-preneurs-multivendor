import { createHmac } from "node:crypto";

export const createDuitkuCreateInvoiceSignature = (input: {
  merchantCode: string;
  timestamp: string | number;
  apiKey: string;
}) => {
  const merchantCode = String(input.merchantCode || "").trim();
  const timestamp = String(input.timestamp || "").trim();
  const apiKey = String(input.apiKey || "");
  if (!merchantCode) throw new Error("Duitku merchantCode is required for signing.");
  if (!/^\d+$/.test(timestamp)) throw new Error("Duitku timestamp must be numeric milliseconds.");
  if (!apiKey) throw new Error("Duitku apiKey is required for signing.");
  return createHmac("sha256", apiKey).update(`${merchantCode}${timestamp}`).digest("hex");
};

export const buildDuitkuCreateInvoiceHeaders = (input: {
  merchantCode: string;
  timestamp: string | number;
  apiKey: string;
}) => ({
  "content-type": "application/json",
  "x-duitku-timestamp": String(input.timestamp),
  "x-duitku-signature": createDuitkuCreateInvoiceSignature(input),
  "x-duitku-merchantcode": String(input.merchantCode).trim(),
});
