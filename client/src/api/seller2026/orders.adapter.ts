const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export function adaptSellerSuborder(value: unknown) {
  const suborder = object(value);
  const customer = object(suborder.customer);
  const shipping = object(suborder.shipping);
  return {
    id: suborder?.id ?? suborder?.suborderId ?? null,
    invoice: text(suborder?.invoiceNo || suborder?.invoice),
    customer: text(suborder?.customerName || customer.name, "Customer"),
    channel: text(suborder?.channel || suborder?.checkoutMode),
    shipment: text(suborder?.shipmentMethod || shipping.method),
    total: number(suborder?.total ?? suborder?.grandTotal, 0),
    paymentStatus: text(suborder?.paymentStatus, "UNPAID").toUpperCase(),
    fulfillmentStatus: text(suborder?.fulfillmentStatus, "UNFULFILLED").toUpperCase(),
    createdAt: suborder?.createdAt || null,
  };
}

export function adaptSellerSuborderList(value: unknown) {
  const response = object(value);
  const data = object(response.data);
  const items = Array.isArray(response?.items)
    ? response.items
    : Array.isArray(data.items)
      ? data.items
      : [];
  return {
    items: items.map(adaptSellerSuborder),
    pagination: response.pagination || data.pagination || null,
  };
}
