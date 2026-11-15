const normalizeBoolean = (value: unknown, fallback: boolean) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

// Multistore shipment MVP is standard for our multivendor architecture in both dev and production
export const isMultistoreShipmentMvpEnabled = () =>
  normalizeBoolean(process.env.ENABLE_MULTISTORE_SHIPMENT_MVP, true);

export const isMultistoreShipmentMutationEnabled = () =>
  normalizeBoolean(process.env.ENABLE_MULTISTORE_SHIPMENT_MUTATION, true);
