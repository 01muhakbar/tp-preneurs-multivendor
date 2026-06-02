export type Seller2026CatalogStatus = "active" | "inactive";
export type Seller2026AttributeType = "variant" | "general";
export type Seller2026CouponStatus = "active" | "expired" | "paused" | "scheduled" | "inactive";

export type Seller2026CategoriesViewModel = {
  summary: {
    totalCategories: number;
    totalProducts: number;
    assignedRate: number;
  };
  categories: Array<{
    id: string | number;
    name: string;
    parentId?: string | number | null;
    level?: number;
    productCount: number;
    assignedRate?: number;
    status?: Seller2026CatalogStatus;
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
    active: number;
    usedInProducts: number;
    variantAttributes: number;
  };
  attributes: Array<{
    id: string | number;
    name: string;
    type: Seller2026AttributeType;
    usageCount: number;
    valuesCount: number;
    status: Seller2026CatalogStatus;
  }>;
};

export type Seller2026AttributeValuesViewModel = {
  attribute: {
    id: string | number;
    name: string;
    type: Seller2026AttributeType;
    status: Seller2026CatalogStatus;
    usageCount: number;
  } | null;
  values: Array<{
    id: string | number;
    label: string;
    swatch?: string | null;
    sortOrder: number;
    productUsage: number;
    mappedSkus: number;
    status: Seller2026CatalogStatus;
  }>;
};

export type Seller2026CouponsViewModel = {
  summary: {
    total: number;
    active: number;
    redemptions: number;
    discountGiven: number;
  };
  coupons: Array<{
    id: string | number;
    code: string;
    type: "percentage" | "fixed" | "free_shipping";
    discountLabel: string;
    minimumSpend: number;
    validityLabel: string;
    usageLabel: string;
    status: Seller2026CouponStatus;
  }>;
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
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
  summary: { totalCategories: 0, totalProducts: 0, assignedRate: 0 },
  categories: [],
  recommendedCategories: [],
};

const EMPTY_ATTRIBUTES: Seller2026AttributesViewModel = {
  summary: { total: 0, active: 0, usedInProducts: 0, variantAttributes: 0 },
  attributes: [],
};

const EMPTY_ATTRIBUTE_VALUES: Seller2026AttributeValuesViewModel = {
  attribute: null,
  values: [],
};

const EMPTY_COUPONS: Seller2026CouponsViewModel = {
  summary: { total: 0, active: 0, redemptions: 0, discountGiven: 0 },
  coupons: [],
  permissions: { canCreate: false, canUpdate: false, canDelete: false },
};

export function normalizeCatalogStatus(value: unknown): Seller2026CatalogStatus {
  const normalized = text(value).toLowerCase();
  if (normalized === "archived" || normalized === "inactive" || normalized === "disabled") {
    return "inactive";
  }
  return "active";
}

export function normalizeAttributeType(value: unknown): Seller2026AttributeType {
  const normalized = text(value).toLowerCase();
  if (normalized.includes("variant") || normalized === "store") return "variant";
  return "general";
}

export function normalizeCouponStatus(status: unknown): Seller2026CouponStatus {
  const value = text(status).toLowerCase();

  if (value.includes("expired")) return "expired";
  if (value.includes("pause")) return "paused";
  if (value.includes("schedule")) return "scheduled";
  if (value === "active" || value === "published") return "active";

  return "inactive";
}

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
    return {
      id: idValue(category.id ?? category.code, index),
      name: text(category.name, `Category ${index + 1}`),
      parentId:
        category.parentId === null || typeof category.parentId === "undefined"
          ? null
          : idValue(category.parentId),
      level: number(category.level, category.parentId ? 1 : 0),
      productCount: number(category.productCount ?? category.productsCount ?? category.product_count, 0),
      assignedRate: number(category.assignedRate ?? category.assignmentRate, 0),
      status: normalizeCatalogStatus(category.status ?? (category.isPublished === false ? "inactive" : "active")),
    };
  });
  const totalProducts = categories.reduce((sum, item) => sum + item.productCount, 0);
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
    return {
      id: idValue(attribute.id, index),
      name: text(attribute.displayName || attribute.name, `Attribute ${index + 1}`),
      type: normalizeAttributeType(attribute.kind ?? attribute.attributeType ?? attribute.scope),
      usageCount: number(attribute.usageCount, 0),
      valuesCount: number(attribute.valuesCount ?? attribute.valueCount, 0),
      status: normalizeCatalogStatus(attribute.status ?? (attribute.published === false ? "inactive" : "active")),
    };
  });

  return {
    summary: {
      total: readMetaTotal(value, attributes.length),
      active: attributes.filter((item) => item.status === "active").length,
      usedInProducts: attributes.reduce((sum, item) => sum + item.usageCount, 0),
      variantAttributes: attributes.filter((item) => item.type === "variant").length,
    },
    attributes,
  };
}

export function adaptSeller2026AttributeValues(value: unknown): Seller2026AttributeValuesViewModel {
  const response = object(value);
  const rawAttribute = object(response.attribute ?? object(response.data).attribute);
  const attributeId = idValue(rawAttribute.id, "");
  const items = readItems(value);
  const attribute = attributeId
    ? {
        id: attributeId,
        name: text(rawAttribute.displayName || rawAttribute.name, "Attribute"),
        type: normalizeAttributeType(rawAttribute.kind ?? rawAttribute.attributeType ?? rawAttribute.scope),
        status: normalizeCatalogStatus(rawAttribute.status ?? (rawAttribute.published === false ? "inactive" : "active")),
        usageCount: number(rawAttribute.usageCount, 0),
      }
    : null;

  return {
    attribute,
    values: items.map((item, index) => {
      const valueItem = object(item);
      const label = text(valueItem.label ?? valueItem.value, `Value ${index + 1}`);
      return {
        id: idValue(valueItem.id, index),
        label,
        swatch: text(valueItem.swatch ?? valueItem.color ?? (label.startsWith("#") ? label : "")) || null,
        sortOrder: number(valueItem.sortOrder ?? valueItem.sort_order, index + 1),
        productUsage: number(valueItem.productUsage ?? valueItem.usageCount, 0),
        mappedSkus: number(valueItem.mappedSkus ?? valueItem.skuCount ?? valueItem.usageCount, 0),
        status: normalizeCatalogStatus(valueItem.status),
      };
    }),
  };
}

const formatDate = (value: unknown) => {
  const normalized = text(value);
  if (!normalized) return "";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return normalized;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
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

    return {
      id: idValue(coupon.id, index),
      code: text(coupon.code, "COUPON").toUpperCase(),
      type,
      discountLabel:
        type === "free_shipping"
          ? "Free Shipping"
          : type === "fixed"
            ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount)
            : `${amount}%`,
      minimumSpend: number(coupon.minimumSpend ?? coupon.minSpend ?? coupon.minOrderAmount, 0),
      validityLabel: startsAt || expiresAt ? `${startsAt || "Now"} - ${expiresAt || "No expiry"}` : "No schedule",
      usageLabel: text(coupon.usage ?? coupon.usageLabel) || `${number(coupon.redemptions ?? coupon.usedCount, 0)} used`,
      status: normalizeCouponStatus(statusValue),
    };
  });

  return {
    summary: {
      total: coupons.length,
      active: coupons.filter((item) => item.status === "active").length,
      redemptions: coupons.reduce((sum, item) => sum + number(String(item.usageLabel).match(/\d+/)?.[0], 0), 0),
      discountGiven: number(object(response.summary).discountGiven, 0),
    },
    coupons,
    permissions: {
      canCreate: Boolean(permissions.canCreate ?? object(response.governance).sellerCanCreate),
      canUpdate: Boolean(permissions.canUpdate ?? object(response.governance).sellerCanEdit),
      canDelete: Boolean(permissions.canDelete),
    },
  };
}

export const emptySeller2026Categories = EMPTY_CATEGORIES;
export const emptySeller2026Attributes = EMPTY_ATTRIBUTES;
export const emptySeller2026AttributeValues = EMPTY_ATTRIBUTE_VALUES;
export const emptySeller2026Coupons = EMPTY_COUPONS;
