import { updateSellerSuborderFulfillment, updateSellerSuborderInternalNote } from "../sellerOrders.ts";
import { runSeller2026Mutation } from "./mutations.ts";

export type Seller2026FulfillmentAction =
  | "MARK_PROCESSING"
  | "MARK_SHIPPED"
  | "MARK_DELIVERED"
  | "MARK_FAILED_DELIVERY"
  | "MARK_RETURNED"
  | "CANCEL_SHIPMENT";

export type Seller2026FulfillmentPayload = {
  action?: unknown;
  courierCode?: unknown;
  courierService?: unknown;
  trackingNumber?: unknown;
  shippingFee?: unknown;
};

const ACTIONS = new Set<Seller2026FulfillmentAction>([
  "MARK_PROCESSING",
  "MARK_SHIPPED",
  "MARK_DELIVERED",
  "MARK_FAILED_DELIVERY",
  "MARK_RETURNED",
  "CANCEL_SHIPMENT",
]);

const text = (value: unknown) => String(value ?? "").trim();

const amountOrUndefined = (value: unknown) => {
  if (value === "" || value === null || typeof value === "undefined") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

export function buildSeller2026FulfillmentPayload(
  payload: Seller2026FulfillmentPayload
) {
  const action = text(payload.action).toUpperCase() as Seller2026FulfillmentAction;
  if (!ACTIONS.has(action)) {
    throw new Error("Invalid fulfillment action.");
  }

  const courierCode = text(payload.courierCode);
  const courierService = text(payload.courierService);
  const trackingNumber = text(payload.trackingNumber);
  const shippingFee = amountOrUndefined(payload.shippingFee);

  return {
    action,
    ...(courierCode ? { courierCode } : {}),
    ...(courierService ? { courierService } : {}),
    ...(trackingNumber ? { trackingNumber } : {}),
    ...(typeof shippingFee !== "undefined" ? { shippingFee } : {}),
  };
}

export async function updateSeller2026OrderFulfillment({
  storeId,
  suborderId,
  payload,
}: {
  storeId: number | string;
  suborderId: number | string;
  payload: Seller2026FulfillmentPayload;
}) {
  return runSeller2026Mutation(() =>
    updateSellerSuborderFulfillment(
      storeId,
      suborderId,
      buildSeller2026FulfillmentPayload(payload)
    )
  );
}

export async function updateSeller2026OrderInternalNote({
  storeId,
  suborderId,
  note,
}: {
  storeId: number | string;
  suborderId: number | string;
  note: string;
}) {
  return runSeller2026Mutation(() =>
    updateSellerSuborderInternalNote(storeId, suborderId, { note })
  );
}
