export type Seller2026CatalogStatus = "active" | "inactive";
export type Seller2026CategoryStatusLabel = "Published" | "Draft" | "Needs review";
export type Seller2026AttributeType = "dropdown" | "radio" | "checkbox" | "text";
export type Seller2026CouponStatus = "active" | "expired" | "paused" | "scheduled" | "inactive";

export type Seller2026CategoriesViewModel = {
  summary: {
    total: number;
    published: number;
    draft: number;
    empty: number;
    needsAttention: number;
    totalCategories: number;
    totalProducts: number;
    assignedRate: number;
  };
  categories: Array<{
    id: string | number;
    name: string;
    slug: string;
    description: string;
    image: string | null;
    parentId?: string | number | null;
    level?: number;
    productCount: number;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    canonicalHref: string;
    isPublished: boolean;
    assignedRate?: number;
    status?: Seller2026CatalogStatus;
    statusLabel: Seller2026CategoryStatusLabel;
  }>;
  recommendedCategories: Array<{
    id: string | number;
    name: string;
    path?: string;
    productCount?: number;
  }>;
};

export type Seller2026AttributesViewModel = {
  summary: {
    total: number;
    published: number;
    draft: number;
    required: number;
    filterable: number;
    withoutValues: number;
    needsAttention: number;
  };
  attributes: Array<{
    id: string | number;
    name: string;
    slug: string;
    description: string;
    type: Seller2026AttributeType;
    isPublished: boolean;
    published: boolean;
    usageCount: number;
    valuesCount: number;
    isRequired: boolean;
    isFilterable: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    canonicalHref: string;
    canonicalValuesHref: string;
    status: Seller2026CatalogStatus;
    statusLabel: Seller2026CategoryStatusLabel;
    editable?: boolean;
    managedByAdmin?: boolean;
  }>;
};

export type Seller2026AttributeValuesViewModel = {
  attribute: {
    id: string | number;
    name: string;
    slug: string;
    type: Seller2026AttributeType;
    status: Seller2026CatalogStatus;
    isPublished: boolean;
    usageCount: number;
    canonicalAttributesHref: string;
  } | null;
  summary: {
    total: number;
    published: number;
    draft: number;
    empty: number;
    needsAttention: number;
  };
  values: Array<{
    id: string | number;
    attributeId: string | number;
    label: string;
    value: string;
    slug: string;
    description: string;
    color?: string | null;
    image?: string | null;
    swatch?: string | null;
    sortOrder: number;
    productUsage: number;
    productsCount: number;
    mappedSkus: number;
    status: Seller2026CatalogStatus;
    isPublished: boolean;
    statusLabel: Seller2026CategoryStatusLabel;
    createdAt: string;
    updatedAt: string;
    canonicalHref: string;
  }>;
};

export type Seller2026CouponsViewModel = {
  summary: {
    total: number;
    active: number;
    inactive: number;
    expired: number;
    scheduled: number;
    archived: number;
    needsAttention: number;
    redemptions: number;
    discountGiven: number;
  };
  coupons: Array<{
    id: string | number;
    code: string;
    title: string;
    description: string;
    type: "percentage" | "fixed" | "free_shipping";
    discountLabel: string;
    discountValue: number;
    currency: string;
    minimumSpend: number;
    minimumOrderAmount: number;
    maximumDiscountAmount: number;
    usageLimit: number | null;
    usageCount: number;
    perCustomerLimit: number | null;
    validityLabel: string;
    usageLabel: string;
    status: Seller2026CouponStatus;
    name: string;
    discountType: "percent" | "fixed";
    amount: number;
    minSpend: number;
    active: boolean;
    isActive: boolean;
    isExpired: boolean;
    isArchived: boolean;
    scope: string;
    scopeLabel: string;
    storeId: string | number | null;
    isStoreScoped: boolean;
    isPlatformCoupon: boolean;
    canEdit: boolean;
    canManageStatus: boolean;
    canArchive: boolean;
    bannerImageUrl: string | null;
    createdAt: string;
    updatedAt: string;
    canonicalHref: string;
    startsAt: string | null;
    expiresAt: string | null;
  }>;
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canManageStatus: boolean;
  };
};

const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const idValue = (value: unknown, fallback: string | number = ""): string | number =>
  typeof value === "string" || typeof value === "number" ? value : fallback;

const EMPTY_CATEGORIES: Seller2026CategoriesViewModel = {
  summary: {
    total: 0,
    published: 0,
    draft: 0,
    empty: 0,
    needsAttention: 0,
    totalCategories: 0,
    totalProducts: 0,
    assignedRate: 0,
  },
  categories: [],
  recommendedCategories: [],
};

const EMPTY_ATTRIBUTES: Seller2026AttributesViewModel = {
  summary: { total: 0, published: 0, draft: 0, required: 0, filterable: 0, withoutValues: 0, needsAttention: 0 },
  attributes: [],
};

const EMPTY_ATTRIBUTE_VALUES: Seller2026AttributeValuesViewModel = {
  attribute: null,
  summary: { total: 0, published: 0, draft: 0, empty: 0, needsAttention: 0 },
  values: [],
};

const EMPTY_COUPONS: Seller2026CouponsViewModel = {
  summary: { total: 0, active: 0, inactive: 0, expired: 0, scheduled: 0, archived: 0, needsAttention: 0, redemptions: 0, discountGiven: 0 },
  coupons: [],
  permissions: { canCreate: false, canUpdate: false, canDelete: false, canManageStatus: false },
};

export function normalizeCatalogStatus(value: unknown): Seller2026CatalogStatus {
  const normalized = text(value).toLowerCase();
  if (normalized === "archived" || normalized === "inactive" || normalized === "disabled") {
    return "inactive";
  }
  return "active";
}

const slugify = (value: unknown, fallback = "category") => {
  const normalized = text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return normalized || fallback;
};

const formatDateLabel = (value: unknown) => {
  const normalized = text(value);
  if (!normalized) return "Recently";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-SG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export function normalizeAttributeType(value: unknown): Seller2026AttributeType {
  const normalized = text(value).toLowerCase();
  if (normalized === "radio" || normalized === "checkbox" || normalized === "text") return normalized;
  return "dropdown";
}

export function normalizeCouponStatus(status: unknown): Seller2026CouponStatus {
  const value = text(status).toLowerCase();

  if (value.includes("expired")) return "expired";
  if (value.includes("pause")) return "paused";
  if (value.includes("schedule")) return "scheduled";
  if (value === "active" || value === "published") return "active";

  return "inactive";
}

const formatDateTimeInput = (value: unknown) => {
  const normalized = text(value);
  if (!normalized) return null;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const readItems = (value: unknown) => {
  const response = object(value);
  const data = object(response.data);
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

const readMetaTotal = (value: unknown, fallback: number) => {
  const response = object(value);
  const meta = object(response.meta ?? object(response.data).meta);
  return number(meta.total, fallback);
};

export function adaptSeller2026Categories(
  value: unknown,
  recommendedValue: unknown = null
): Seller2026CategoriesViewModel {
  const items = readItems(value);
  const categories = items.map((item, index) => {
    const category = object(item);
    const id = idValue(category.id ?? category.code, index);
    const name = text(category.name, "Untitled category");
    const slug = slugify(category.slug ?? category.code ?? name, `category-${String(id || index + 1)}`);
    const productCount = number(category.productCount ?? category.productsCount ?? category.product_count, 0);
    const isPublished = Boolean(category.isPublished ?? category.published);
    const status = normalizeCatalogStatus(category.status ?? (isPublished ? "active" : "inactive"));
    const statusLabel: Seller2026CategoryStatusLabel = isPublished
      ? "Published"
      : text(category.status).toLowerCase().includes("review")
        ? "Needs review"
        : "Draft";
    return {
      id,
      name,
      slug,
      description: text(category.description, "No description available."),
      image: text(category.image ?? category.icon) || null,
      parentId:
        category.parentId === null || typeof category.parentId === "undefined"
          ? null
          : idValue(category.parentId),
      level: number(category.level, category.parentId ? 1 : 0),
      productCount,
      sortOrder: number(category.sortOrder ?? category.sort_order, index + 1),
      createdAt: formatDateLabel(category.createdAt),
      updatedAt: formatDateLabel(category.updatedAt),
      canonicalHref: `/catalog/products?category=${encodeURIComponent(String(id))}`,
      isPublished,
      assignedRate: number(category.assignedRate ?? category.assignmentRate, 0),
      status,
      statusLabel,
    };
  });
  const totalProducts = categories.reduce((sum, item) => sum + item.productCount, 0);
  const published = categories.filter((item) => item.isPublished).length;
  const draft = categories.filter((item) => !item.isPublished).length;
  const empty = categories.filter((item) => item.productCount <= 0).length;
  const needsAttention = categories.filter((item) => item.statusLabel === "Needs review" || item.productCount <= 0).length;
  const recommendedCategories = readItems(recommendedValue).map((item, index) => {
    const category = object(item);
    return {
      id: idValue(category.id ?? category.code, index),
      name: text(category.name, `Recommended ${index + 1}`),
      path: text(category.path ?? category.fullPath) || undefined,
      productCount: number(category.productCount ?? category.productsCount, 0),
    };
  });

  return {
    summary: {
      total: readMetaTotal(value, categories.length),
      published,
      draft,
      empty,
      needsAttention,
      totalCategories: readMetaTotal(value, categories.length),
      totalProducts,
      assignedRate: categories.length ? Math.round((categories.filter((item) => item.productCount > 0).length / categories.length) * 100) : 0,
    },
    categories,
    recommendedCategories,
  };
}

export function adaptSeller2026Attributes(value: unknown): Seller2026AttributesViewModel {
  const items = readItems(value);
  const attributes = items.map((item, index) => {
    const attribute = object(item);
    const id = idValue(attribute.id, index);
    const displayName = text(attribute.displayName);
    const name = displayName || text(attribute.name, "Untitled attribute");
    const slug = slugify(attribute.slug ?? attribute.name ?? name, `attribute-${String(id || index + 1)}`);
    const isPublished = Boolean(attribute.isPublished ?? attribute.published);
    const valuesCount = number(attribute.valuesCount ?? attribute.valueCount, 0);
    const status = normalizeCatalogStatus(attribute.status ?? (isPublished ? "active" : "inactive"));
    const statusLabel: Seller2026CategoryStatusLabel = isPublished
      ? "Published"
      : text(attribute.status).toLowerCase().includes("review")
        ? "Needs review"
        : "Draft";
    return {
      id,
      name,
      slug,
      description: text(attribute.description ?? attribute.displayName, "No description available."),
      type: normalizeAttributeType(attribute.kind ?? attribute.attributeType ?? attribute.type),
      isPublished,
      published: isPublished,
      usageCount: number(attribute.usageCount, 0),
      valuesCount,
      isRequired: Boolean(attribute.isRequired ?? attribute.required),
      isFilterable: Boolean(attribute.isFilterable ?? attribute.filterable ?? attribute.scope === "store"),
      sortOrder: number(attribute.sortOrder ?? attribute.sort_order, index + 1),
      createdAt: formatDateLabel(attribute.createdAt),
      updatedAt: formatDateLabel(attribute.updatedAt),
      canonicalHref: `/catalog/attributes/${encodeURIComponent(String(id))}/values`,
      canonicalValuesHref: `/catalog/attributes/${encodeURIComponent(String(id))}/values`,
      status,
      statusLabel,
      editable: Boolean(attribute.editable ?? attribute.scope === "store"),
      managedByAdmin: Boolean(attribute.managedByAdmin ?? attribute.scope === "global"),
    };
  });
  const published = attributes.filter((item) => item.isPublished).length;
  const withoutValues = attributes.filter((item) => item.valuesCount <= 0).length;

  return {
    summary: {
      total: readMetaTotal(value, attributes.length),
      published,
      draft: attributes.filter((item) => !item.isPublished).length,
      required: attributes.filter((item) => item.isRequired).length,
      filterable: attributes.filter((item) => item.isFilterable).length,
      withoutValues,
      needsAttention: withoutValues + attributes.filter((item) => item.statusLabel === "Needs review").length,
    },
    attributes,
  };
}

export function adaptSeller2026AttributeValues(value: unknown): Seller2026AttributeValuesViewModel {
  const response = object(value);
  const rawAttribute = object(response.attribute ?? object(response.data).attribute);
  const attributeId = idValue(rawAttribute.id, "");
  const items = readItems(value);
  const attributeName = text(rawAttribute.displayName || rawAttribute.name, "Attribute");
  const attributePublished = Boolean(rawAttribute.isPublished ?? rawAttribute.published ?? rawAttribute.status !== "archived");
  const attribute = attributeId
    ? {
        id: attributeId,
        name: attributeName,
        slug: slugify(rawAttribute.slug ?? rawAttribute.name ?? attributeName, `attribute-${String(attributeId)}`),
        type: normalizeAttributeType(rawAttribute.kind ?? rawAttribute.attributeType ?? rawAttribute.type),
        status: normalizeCatalogStatus(rawAttribute.status ?? (attributePublished ? "active" : "inactive")),
        isPublished: attributePublished,
        usageCount: number(rawAttribute.usageCount, 0),
        canonicalAttributesHref: "/catalog/attributes",
      }
    : null;
  const values = items.map((item, index) => {
    const valueItem = object(item);
    const label = text(valueItem.label ?? valueItem.value, `Untitled value`);
    const status = normalizeCatalogStatus(valueItem.status);
    const isPublished = status === "active";
    const statusLabel: Seller2026CategoryStatusLabel = isPublished ? "Published" : "Draft";
    const productUsage = number(valueItem.productUsage ?? valueItem.productsCount ?? valueItem.usageCount, 0);
    return {
      id: idValue(valueItem.id, index),
      attributeId: idValue(valueItem.attributeId ?? attributeId, attributeId),
      label,
      value: text(valueItem.value, label),
      slug: slugify(valueItem.slug ?? valueItem.value ?? label, `value-${index + 1}`),
      description: text(valueItem.description, "No description available."),
      color: text(valueItem.color ?? valueItem.swatch ?? (label.startsWith("#") ? label : "")) || null,
      image: text(valueItem.image) || null,
      swatch: text(valueItem.swatch ?? valueItem.color ?? (label.startsWith("#") ? label : "")) || null,
      sortOrder: number(valueItem.sortOrder ?? valueItem.sort_order, index + 1),
      productUsage,
      productsCount: productUsage,
      mappedSkus: number(valueItem.mappedSkus ?? valueItem.skuCount ?? valueItem.usageCount, 0),
      status,
      isPublished,
      statusLabel,
      createdAt: formatDateLabel(valueItem.createdAt),
      updatedAt: formatDateLabel(valueItem.updatedAt),
      canonicalHref: attributeId ? `/catalog/attributes/${encodeURIComponent(String(attributeId))}/values` : "/catalog/attributes",
    };
  });

  return {
    attribute,
    summary: {
      total: values.length,
      published: values.filter((item) => item.isPublished).length,
      draft: values.filter((item) => !item.isPublished).length,
      empty: values.filter((item) => !item.value).length,
      needsAttention: values.filter((item) => !item.value).length,
    },
    values,
  };
}

const formatDate = (value: unknown) => {
  const normalized = text(value);
  if (!normalized) return "Not set";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-SG", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const couponType = (value: unknown): Seller2026CouponsViewModel["coupons"][number]["type"] => {
  const normalized = text(value).toLowerCase();
  if (normalized.includes("shipping")) return "free_shipping";
  if (normalized === "fixed") return "fixed";
  return "percentage";
};

export function adaptSeller2026Coupons(
  value: unknown,
  permissions: Partial<Seller2026CouponsViewModel["permissions"]> = {}
): Seller2026CouponsViewModel {
  const response = object(value);
  const items = Array.isArray(response.items) ? response.items : readItems(value);
  const coupons = items.map((item, index) => {
    const coupon = object(item);
    const type = couponType(coupon.type ?? coupon.discountType);
    const amount = number(coupon.value ?? coupon.amount ?? coupon.discountValue, 0);
    const startsAt = formatDate(coupon.startsAt);
    const expiresAt = formatDate(coupon.expiresAt);
    const statusValue = object(coupon.status).code || object(coupon.status).label || coupon.status || (coupon.active ? "active" : "inactive");
    const status = normalizeCouponStatus(statusValue);
    const active = Boolean(coupon.active ?? status === "active");
    const discountType: "percent" | "fixed" = coupon.discountType === "fixed" ? "fixed" : "percent";
    const code = text(coupon.code, "NO-CODE").toUpperCase();
    const title = text(coupon.title ?? coupon.campaignName ?? coupon.name, code || "Untitled coupon");
    const description = text(coupon.description, "No description available.");
    const scope = text(coupon.scopeType ?? coupon.scope, "STORE").toUpperCase();
    const isStoreScoped = scope === "STORE";
    const isPlatformCoupon = scope === "PLATFORM" || !isStoreScoped;
    const governance = object(coupon.governance);
    const couponCanEdit = Boolean(governance.canEdit ?? permissions.canUpdate) && isStoreScoped;
    const couponCanManageStatus = Boolean(governance.canManageStatus ?? permissions.canManageStatus) && isStoreScoped;
    const usageCount = number(coupon.usageCount ?? coupon.redemptions ?? coupon.usedCount, 0);
    const usageLimitRaw = coupon.usageLimit ?? coupon.limit;
    const usageLimit =
      usageLimitRaw === undefined || usageLimitRaw === null || usageLimitRaw === ""
        ? null
        : number(usageLimitRaw, 0);
    const minSpend = number(coupon.minimumSpend ?? coupon.minSpend ?? coupon.minOrderAmount, 0);

    return {
      id: idValue(coupon.id, index),
      code,
      title,
      description,
      type,
      name: title,
      discountType,
      amount,
      discountValue: amount,
      currency: text(coupon.currency, "IDR"),
      minSpend,
      active,
      isActive: active,
      isExpired: status === "expired",
      isArchived: status === "inactive" && !active,
      startsAt: formatDateTimeInput(coupon.startsAt),
      expiresAt: formatDateTimeInput(coupon.expiresAt),
      discountLabel:
        type === "free_shipping"
          ? "Free Shipping"
          : type === "fixed"
            ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount)
            : `${amount}%`,
      minimumSpend: minSpend,
      minimumOrderAmount: minSpend,
      maximumDiscountAmount: number(coupon.maximumDiscountAmount ?? coupon.maxDiscountAmount, 0),
      usageLimit,
      usageCount,
      perCustomerLimit:
        coupon.perCustomerLimit === undefined || coupon.perCustomerLimit === null
          ? null
          : number(coupon.perCustomerLimit, 0),
      validityLabel: startsAt !== "Not set" || expiresAt !== "Not set" ? `${startsAt} - ${expiresAt}` : "Not set",
      usageLabel: usageLimit ? `${usageCount}/${usageLimit}` : `${usageCount} used`,
      status,
      scope,
      scopeLabel: isStoreScoped ? "Store coupon" : "Platform coupon",
      storeId:
        typeof coupon.storeId === "string" || typeof coupon.storeId === "number"
          ? coupon.storeId
          : null,
      isStoreScoped,
      isPlatformCoupon,
      canEdit: couponCanEdit,
      canManageStatus: couponCanManageStatus,
      canArchive: couponCanManageStatus,
      bannerImageUrl: text(coupon.bannerImageUrl) || null,
      createdAt: formatDateLabel(coupon.createdAt),
      updatedAt: formatDateLabel(coupon.updatedAt),
      canonicalHref: "/catalog/coupons",
    };
  });
  const expired = coupons.filter((item) => item.status === "expired").length;
  const inactive = coupons.filter((item) => item.status === "inactive").length;
  const scheduled = coupons.filter((item) => item.status === "scheduled").length;
  const archived = coupons.filter((item) => item.isArchived).length;

  return {
    summary: {
      total: coupons.length,
      active: coupons.filter((item) => item.status === "active").length,
      inactive,
      expired,
      scheduled,
      archived,
      needsAttention: expired + coupons.filter((item) => item.code === "NO-CODE" || item.isPlatformCoupon).length,
      redemptions: coupons.reduce((sum, item) => sum + number(String(item.usageLabel).match(/\d+/)?.[0], 0), 0),
      discountGiven: number(object(response.summary).discountGiven, 0),
    },
    coupons,
    permissions: {
      canCreate: Boolean(permissions.canCreate ?? object(response.governance).sellerCanCreate),
      canUpdate: Boolean(permissions.canUpdate ?? object(response.governance).sellerCanEdit),
      canDelete: Boolean(permissions.canDelete),
      canManageStatus: Boolean(permissions.canManageStatus ?? object(response.governance).sellerCanManageStatus),
    },
  };
}

export const emptySeller2026Categories = EMPTY_CATEGORIES;
export const emptySeller2026Attributes = EMPTY_ATTRIBUTES;
export const emptySeller2026AttributeValues = EMPTY_ATTRIBUTE_VALUES;
export const emptySeller2026Coupons = EMPTY_COUPONS;
