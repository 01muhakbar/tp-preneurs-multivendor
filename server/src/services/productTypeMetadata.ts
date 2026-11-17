const PRODUCT_TYPE_VALUES = new Set(["physical", "digital", "service"]);
const SERVICE_DELIVERY_TYPE_VALUES = new Set(["online", "onsite"]);

const parseJsonObject = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  try {
    const parsed = JSON.parse(normalized);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

export const normalizeProductType = (value: unknown, fallback = "physical") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return PRODUCT_TYPE_VALUES.has(normalized) ? normalized : fallback;
};

export const normalizeServiceDeliveryType = (value: unknown, fallback = "online") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return SERVICE_DELIVERY_TYPE_VALUES.has(normalized) ? normalized : fallback;
};

export const normalizeDigitalAssetUrl = (value: unknown) => {
  if (value === null || typeof value === "undefined") return null;
  const normalized = String(value).trim();
  return normalized ? normalized.slice(0, 5000) : null;
};

export const normalizeOptionalText = (value: unknown, maxLength = 2000) => {
  if (value === null || typeof value === "undefined") return null;
  const normalized = String(value).trim();
  return normalized ? normalized.slice(0, maxLength) : null;
};

export const getProductTypeMetadata = (source: unknown) => {
  const record = parseJsonObject(source) || {};
  const seo = parseJsonObject((record as any).seo) || record;
  const productType = normalizeProductType(
    (record as any).productType ??
      (record as any).product_type ??
      (seo as any).productType ??
      (seo as any).product_type
  );
  const digitalAssetUrl = normalizeDigitalAssetUrl(
    (record as any).digitalAssetUrl ??
      (record as any).digital_asset_url ??
      (seo as any).digitalAssetUrl ??
      (seo as any).digital_asset_url
  );
  const digitalInstructions = normalizeOptionalText(
    (record as any).digitalInstructions ??
      (record as any).digital_instructions ??
      (seo as any).digitalInstructions ??
      (seo as any).digital_instructions,
    2000
  );
  const serviceDeliveryType = normalizeServiceDeliveryType(
    (record as any).serviceDeliveryType ??
      (record as any).service_delivery_type ??
      (seo as any).serviceDeliveryType ??
      (seo as any).service_delivery_type
  );
  const serviceDuration = normalizeOptionalText(
    (record as any).serviceDuration ??
      (record as any).service_duration ??
      (seo as any).serviceDuration ??
      (seo as any).service_duration,
    100
  );
  const serviceInstructions = normalizeOptionalText(
    (record as any).serviceInstructions ??
      (record as any).service_instructions ??
      (seo as any).serviceInstructions ??
      (seo as any).service_instructions,
    3000
  );
  const serviceContactWhatsapp = normalizeOptionalText(
    (record as any).serviceContactWhatsapp ??
      (record as any).service_contact_whatsapp ??
      (seo as any).serviceContactWhatsapp ??
      (seo as any).service_contact_whatsapp,
    50
  );

  const isPhysical = productType === "physical";
  const isDigital = productType === "digital";
  const isService = productType === "service";

  return {
    productType,
    isPhysical,
    isDigital,
    isService,
    isWeightless: isDigital || isService,
    digitalAssetUrl: isDigital ? digitalAssetUrl : null,
    digitalInstructions: isDigital ? digitalInstructions : null,
    serviceDeliveryType: isService ? serviceDeliveryType : null,
    serviceDuration: isService ? serviceDuration : null,
    serviceInstructions: isService ? serviceInstructions : null,
    serviceContactWhatsapp: isService ? serviceContactWhatsapp : null,
  };
};

export const mergeProductTypeMetadataIntoSeo = (
  existingSeo: unknown,
  input: {
    productType?: unknown;
    digitalAssetUrl?: unknown;
    digitalInstructions?: unknown;
    serviceDeliveryType?: unknown;
    serviceDuration?: unknown;
    serviceInstructions?: unknown;
    serviceContactWhatsapp?: unknown;
  }
) => {
  const base = parseJsonObject(existingSeo) || {};
  const productType = normalizeProductType(input.productType ?? (base as any).productType);

  const next: Record<string, unknown> = {
    ...base,
    productType,
  };

  if (productType === "digital") {
    const digitalAssetUrl = normalizeDigitalAssetUrl(
      input.digitalAssetUrl ?? (base as any).digitalAssetUrl
    );
    const digitalInstructions = normalizeOptionalText(
      input.digitalInstructions ?? (base as any).digitalInstructions,
      2000
    );
    if (digitalAssetUrl) next.digitalAssetUrl = digitalAssetUrl;
    else delete next.digitalAssetUrl;

    if (digitalInstructions) next.digitalInstructions = digitalInstructions;
    else delete next.digitalInstructions;

    delete next.serviceDeliveryType;
    delete next.serviceDuration;
    delete next.serviceInstructions;
    delete next.serviceContactWhatsapp;
  } else if (productType === "service") {
    const serviceDeliveryType = normalizeServiceDeliveryType(
      input.serviceDeliveryType ?? (base as any).serviceDeliveryType
    );
    const serviceDuration = normalizeOptionalText(
      input.serviceDuration ?? (base as any).serviceDuration,
      100
    );
    const serviceInstructions = normalizeOptionalText(
      input.serviceInstructions ?? (base as any).serviceInstructions,
      3000
    );
    const serviceContactWhatsapp = normalizeOptionalText(
      input.serviceContactWhatsapp ?? (base as any).serviceContactWhatsapp,
      50
    );

    next.serviceDeliveryType = serviceDeliveryType;
    if (serviceDuration) next.serviceDuration = serviceDuration;
    else delete next.serviceDuration;

    if (serviceInstructions) next.serviceInstructions = serviceInstructions;
    else delete next.serviceInstructions;

    if (serviceContactWhatsapp) next.serviceContactWhatsapp = serviceContactWhatsapp;
    else delete next.serviceContactWhatsapp;

    delete next.digitalAssetUrl;
    delete next.digitalInstructions;
  } else {
    // physical
    delete next.digitalAssetUrl;
    delete next.digitalInstructions;
    delete next.serviceDeliveryType;
    delete next.serviceDuration;
    delete next.serviceInstructions;
    delete next.serviceContactWhatsapp;
  }

  return next;
};
