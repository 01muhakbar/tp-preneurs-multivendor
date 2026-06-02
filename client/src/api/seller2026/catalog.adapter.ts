const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export function adaptSellerCategory(value: unknown) {
  const category = object(value);
  return {
    id: category?.id ?? null,
    name: text(category?.name, "Category"),
    parentId: category?.parentId ?? category?.parent_id ?? null,
    productCount: number(category?.productCount ?? category?.productsCount, 0),
    assignmentRate: text(category?.assignmentRate, "0%"),
    active: category?.active !== false,
  };
}

export function adaptSellerAttribute(value: unknown) {
  const attribute = object(value);
  return {
    id: attribute?.id ?? null,
    name: text(attribute?.name, "Attribute"),
    type: text(attribute?.type || attribute?.scope, "General"),
    usageCount: number(attribute?.usageCount, 0),
    valuesCount: number(attribute?.valuesCount ?? attribute?.valueCount, 0),
    active: attribute?.active !== false,
  };
}

export function adaptSellerCoupon(value: unknown) {
  const coupon = object(value);
  return {
    id: coupon?.id ?? null,
    code: text(coupon?.code, "COUPON"),
    type: text(coupon?.type || coupon?.discountType),
    value: coupon?.value ?? coupon?.discountValue ?? null,
    minimumSpend: coupon?.minimumSpend ?? coupon?.minOrderAmount ?? 0,
    usage: text(coupon?.usage || coupon?.usageLabel),
    status: text(coupon?.status, "Draft"),
  };
}
