const PRODUCT_TYPE_VALUES = new Set(["physical", "digital", "service"]);
const parseJsonObject = (value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    if (typeof value !== "string")
        return null;
    const normalized = value.trim();
    if (!normalized)
        return null;
    try {
        const parsed = JSON.parse(normalized);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed
            : null;
    }
    catch {
        return null;
    }
};
export const normalizeProductType = (value, fallback = "physical") => {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();
    return PRODUCT_TYPE_VALUES.has(normalized) ? normalized : fallback;
};
export const normalizeDigitalAssetUrl = (value) => {
    if (value === null || typeof value === "undefined")
        return null;
    const normalized = String(value).trim();
    return normalized ? normalized.slice(0, 5000) : null;
};
export const getProductTypeMetadata = (source) => {
    const record = parseJsonObject(source) || {};
    const seo = parseJsonObject(record.seo) || record;
    const productType = normalizeProductType(record.productType ??
        record.product_type ??
        seo.productType ??
        seo.product_type);
    const digitalAssetUrl = normalizeDigitalAssetUrl(record.digitalAssetUrl ??
        record.digital_asset_url ??
        seo.digitalAssetUrl ??
        seo.digital_asset_url);
    return {
        productType,
        isDigital: productType === "digital",
        digitalAssetUrl: productType === "digital" ? digitalAssetUrl : null,
    };
};
export const mergeProductTypeMetadataIntoSeo = (existingSeo, input) => {
    const base = parseJsonObject(existingSeo) || {};
    const productType = normalizeProductType(input.productType ?? base.productType);
    const digitalAssetUrl = productType === "digital" ? normalizeDigitalAssetUrl(input.digitalAssetUrl) : null;
    const next = {
        ...base,
        productType,
    };
    if (digitalAssetUrl)
        next.digitalAssetUrl = digitalAssetUrl;
    else
        delete next.digitalAssetUrl;
    return next;
};
