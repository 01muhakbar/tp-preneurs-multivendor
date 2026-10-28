export const COUPON_SCOPE_TYPES = ["PLATFORM", "STORE"];
const getPlain = (value) => (typeof value?.get === "function" ? value.get({ plain: true }) : value);
const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};
const toFiniteInteger = (value, fallback = 0) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        return fallback;
    return Math.max(0, Math.round(parsed));
};
const toIso = (value) => {
    if (!value)
        return null;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};
export const normalizeCouponAssetUrl = (value) => {
    const text = String(value || "").trim();
    if (!text)
        return null;
    if (/^https?:\/\//i.test(text) || text.startsWith("/uploads/"))
        return text;
    if (text.startsWith("uploads/"))
        return `/${text}`;
    return null;
};
export const normalizeCouponScopeType = (value) => {
    const normalized = String(value || "").trim().toUpperCase();
    return normalized === "STORE" ? "STORE" : "PLATFORM";
};
export const resolveCouponGovernanceScope = (coupon) => {
    const plain = getPlain(coupon);
    const storeId = toFiniteNumber(plain?.storeId ?? plain?.store_id ?? plain?.store?.id ?? null);
    const scopeType = normalizeCouponScopeType(plain?.scopeType ?? plain?.scope_type ?? (storeId ? "STORE" : "PLATFORM"));
    return {
        scopeType,
        storeId: scopeType === "STORE" ? storeId : null,
        ownership: scopeType === "STORE" ? "SELLER_STORE_ADMIN_GOVERNED" : "ADMIN_PLATFORM",
    };
};
export const getCouponTimeWindow = (coupon) => {
    const plain = getPlain(coupon);
    const startsAt = toIso(plain?.startsAt ?? plain?.starts_at ?? null);
    const expiresAt = toIso(plain?.expiresAt ?? plain?.expires_at ?? null);
    const now = Date.now();
    const started = !startsAt || Date.parse(startsAt) <= now;
    const expired = Boolean(expiresAt && Date.parse(expiresAt) < now);
    return {
        startsAt,
        expiresAt,
        started,
        expired,
    };
};
export const serializeCouponStoreSummary = (coupon) => {
    const plain = getPlain(coupon);
    const store = plain?.store;
    const storeId = toFiniteNumber(store?.id ?? plain?.storeId ?? plain?.store_id ?? null);
    if (!storeId)
        return null;
    return {
        id: storeId,
        name: String(store?.name || "").trim() || `Store #${storeId}`,
        slug: String(store?.slug || "").trim() || null,
        status: String(store?.status || "").trim().toUpperCase() || null,
    };
};
export const serializeAdminCouponGovernance = (coupon) => {
    const scope = resolveCouponGovernanceScope(coupon);
    const store = serializeCouponStoreSummary(coupon);
    return {
        scopeType: scope.scopeType,
        storeId: scope.storeId,
        ownership: scope.ownership,
        sellerEditable: scope.scopeType === "STORE",
        adminManaged: true,
        clientVisibleWhenValid: true,
        store,
        notes: scope.scopeType === "STORE"
            ? [
                "Store-scoped coupon only applies to the linked store.",
                "Admin can review, disable, or override seller coupons.",
            ]
            : [
                "Platform coupon is owned by admin.",
                "Platform coupon can apply across storefront according to validation rules.",
            ],
    };
};
export const serializePublicCouponScope = (coupon) => {
    const scope = resolveCouponGovernanceScope(coupon);
    return {
        scopeType: scope.scopeType,
        storeId: scope.storeId,
    };
};
export const serializePublicCouponSnapshot = (coupon) => {
    const plain = getPlain(coupon);
    const scope = serializePublicCouponScope(plain);
    const timeWindow = getCouponTimeWindow(plain);
    const store = serializeCouponStoreSummary(plain);
    const applicabilityNote = scope.scopeType === "STORE"
        ? store?.name
            ? `Valid only for ${store.name}.`
            : "Valid only for its linked store."
        : "Valid for eligible storefront orders.";
    return {
        id: toFiniteNumber(plain?.id ?? null),
        code: String(plain?.code || "").trim().toUpperCase(),
        campaignName: String(plain?.campaignName ?? plain?.campaign_name ?? plain?.code ?? "").trim() || null,
        discountType: plain?.discountType === "fixed" ? "fixed" : "percent",
        amount: toFiniteInteger(plain?.amount, 0),
        minSpend: toFiniteInteger(plain?.minSpend, 0),
        scopeType: scope.scopeType,
        storeId: scope.storeId,
        store,
        bannerImageUrl: normalizeCouponAssetUrl(plain?.bannerImageUrl ?? plain?.banner_image_url ?? null),
        published: Boolean(plain?.active),
        scopeLabel: scope.scopeType === "STORE" ? "Store coupon" : "Platform coupon",
        applicabilityNote,
        status: {
            code: "ACTIVE",
            label: "Active",
            tone: "emerald",
        },
        isPubliclyRedeemable: true,
        startsAt: timeWindow.startsAt,
        expiresAt: timeWindow.expiresAt,
        createdAt: toIso(plain?.createdAt ?? null),
        updatedAt: toIso(plain?.updatedAt ?? null),
    };
};
