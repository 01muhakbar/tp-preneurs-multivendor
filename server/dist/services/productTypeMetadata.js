const PRODUCT_TYPE_VALUES = new Set(["physical", "digital", "service"]);
const SERVICE_DELIVERY_TYPE_VALUES = new Set(["online", "onsite"]);
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
export const normalizeServiceDeliveryType = (value, fallback = "online") => {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();
    return SERVICE_DELIVERY_TYPE_VALUES.has(normalized) ? normalized : fallback;
};
export const normalizeDigitalAssetUrl = (value) => {
    if (value === null || typeof value === "undefined")
        return null;
    const normalized = String(value).trim();
    return normalized ? normalized.slice(0, 5000) : null;
};
export const normalizeOptionalText = (value, maxLength = 2000) => {
    if (value === null || typeof value === "undefined")
        return null;
    const normalized = String(value).trim();
    return normalized ? normalized.slice(0, maxLength) : null;
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
    const digitalInstructions = normalizeOptionalText(record.digitalInstructions ??
        record.digital_instructions ??
        seo.digitalInstructions ??
        seo.digital_instructions, 2000);
    const serviceDeliveryType = normalizeServiceDeliveryType(record.serviceDeliveryType ??
        record.service_delivery_type ??
        seo.serviceDeliveryType ??
        seo.service_delivery_type);
    const serviceDuration = normalizeOptionalText(record.serviceDuration ??
        record.service_duration ??
        seo.serviceDuration ??
        seo.service_duration, 100);
    const serviceInstructions = normalizeOptionalText(record.serviceInstructions ??
        record.service_instructions ??
        seo.serviceInstructions ??
        seo.service_instructions, 3000);
    const serviceContactWhatsapp = normalizeOptionalText(record.serviceContactWhatsapp ??
        record.service_contact_whatsapp ??
        seo.serviceContactWhatsapp ??
        seo.service_contact_whatsapp, 50);
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
export const mergeProductTypeMetadataIntoSeo = (existingSeo, input) => {
    const base = parseJsonObject(existingSeo) || {};
    const productType = normalizeProductType(input.productType ?? base.productType);
    const next = {
        ...base,
        productType,
    };
    if (productType === "digital") {
        const digitalAssetUrl = normalizeDigitalAssetUrl(input.digitalAssetUrl ?? base.digitalAssetUrl);
        const digitalInstructions = normalizeOptionalText(input.digitalInstructions ?? base.digitalInstructions, 2000);
        if (digitalAssetUrl)
            next.digitalAssetUrl = digitalAssetUrl;
        else
            delete next.digitalAssetUrl;
        if (digitalInstructions)
            next.digitalInstructions = digitalInstructions;
        else
            delete next.digitalInstructions;
        delete next.serviceDeliveryType;
        delete next.serviceDuration;
        delete next.serviceInstructions;
        delete next.serviceContactWhatsapp;
    }
    else if (productType === "service") {
        const serviceDeliveryType = normalizeServiceDeliveryType(input.serviceDeliveryType ?? base.serviceDeliveryType);
        const serviceDuration = normalizeOptionalText(input.serviceDuration ?? base.serviceDuration, 100);
        const serviceInstructions = normalizeOptionalText(input.serviceInstructions ?? base.serviceInstructions, 3000);
        const serviceContactWhatsapp = normalizeOptionalText(input.serviceContactWhatsapp ?? base.serviceContactWhatsapp, 50);
        next.serviceDeliveryType = serviceDeliveryType;
        if (serviceDuration)
            next.serviceDuration = serviceDuration;
        else
            delete next.serviceDuration;
        if (serviceInstructions)
            next.serviceInstructions = serviceInstructions;
        else
            delete next.serviceInstructions;
        if (serviceContactWhatsapp)
            next.serviceContactWhatsapp = serviceContactWhatsapp;
        else
            delete next.serviceContactWhatsapp;
        delete next.digitalAssetUrl;
        delete next.digitalInstructions;
    }
    else {
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
