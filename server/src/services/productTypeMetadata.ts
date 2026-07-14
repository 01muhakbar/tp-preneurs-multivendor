const PRODUCT_TYPE_VALUES = new Set(["physical", "digital", "service"]);

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

export const normalizeDigitalAssetUrl = (value: unknown) => {
  if (value === null || typeof value === "undefined") return null;
  const normalized = String(value).trim();
  return normalized ? normalized.slice(0, 5000) : null;
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

  return {
    productType,
    isDigital: productType === "digital",
    digitalAssetUrl: productType === "digital" ? digitalAssetUrl : null,
  };
};

export const mergeProductTypeMetadataIntoSeo = (
  existingSeo: unknown,
  input: { productType?: unknown; digitalAssetUrl?: unknown }
) => {
  const base = parseJsonObject(existingSeo) || {};
  const productType = normalizeProductType(input.productType ?? (base as any).productType);
  const digitalAssetUrl =
    productType === "digital" ? normalizeDigitalAssetUrl(input.digitalAssetUrl) : null;
  const next: Record<string, unknown> = {
    ...base,
    productType,
  };

  if (digitalAssetUrl) next.digitalAssetUrl = digitalAssetUrl;
  else delete next.digitalAssetUrl;

  return next;
};
