import {
  createSellerCoupon,
  deleteSellerCoupon,
  updateSellerCoupon,
} from "../sellerCoupons.ts";
import { runSeller2026Mutation } from "./mutations.ts";

export type Seller2026CouponPayload = {
  code?: unknown;
  name?: unknown;
  campaignName?: unknown;
  discountType?: unknown;
  discountValue?: unknown;
  amount?: unknown;
  minimumOrderValue?: unknown;
  minSpend?: unknown;
  active?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  expiresAt?: unknown;
};

const text = (value: unknown) => String(value ?? "").trim();

const numberOrUndefined = (value: unknown) => {
  if (value === "" || value === null || typeof value === "undefined") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const booleanOrUndefined = (value: unknown) =>
  typeof value === "boolean" ? value : undefined;

const isoOrNull = (value: unknown) => {
  const normalized = text(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export function buildSeller2026CouponPayload(payload: Seller2026CouponPayload) {
  const code = text(payload.code).toUpperCase();
  const campaignName = text(payload.campaignName ?? payload.name);
  const discountType = text(payload.discountType).toLowerCase() === "fixed" ? "fixed" : "percent";
  const amount = numberOrUndefined(payload.amount ?? payload.discountValue);
  const minSpend = numberOrUndefined(payload.minSpend ?? payload.minimumOrderValue);
  const active = booleanOrUndefined(payload.active);
  const startsAt = isoOrNull(payload.startsAt);
  const expiresAt = isoOrNull(payload.expiresAt ?? payload.endsAt);

  return {
    ...(code ? { code } : {}),
    ...(campaignName ? { campaignName } : {}),
    discountType,
    ...(typeof amount !== "undefined" ? { amount } : {}),
    ...(typeof minSpend !== "undefined" ? { minSpend } : {}),
    ...(typeof active !== "undefined" ? { active } : {}),
    startsAt,
    expiresAt,
  };
}

export async function createSeller2026Coupon({
  storeId,
  payload,
}: {
  storeId: number | string;
  payload: Seller2026CouponPayload;
}) {
  return runSeller2026Mutation(() =>
    createSellerCoupon(storeId, buildSeller2026CouponPayload(payload))
  );
}

export async function updateSeller2026Coupon({
  storeId,
  couponId,
  payload,
}: {
  storeId: number | string;
  couponId: number | string;
  payload: Seller2026CouponPayload;
}) {
  return runSeller2026Mutation(() =>
    updateSellerCoupon(storeId, couponId, buildSeller2026CouponPayload(payload))
  );
}

export async function setSeller2026CouponStatus({
  storeId,
  couponId,
  active,
}: {
  storeId: number | string;
  couponId: number | string;
  active: boolean;
}) {
  return runSeller2026Mutation(() =>
    updateSellerCoupon(storeId, couponId, { active })
  );
}

export async function archiveSeller2026Coupon({
  storeId,
  couponId,
}: {
  storeId: number | string;
  couponId: number | string;
}) {
  return runSeller2026Mutation(() => deleteSellerCoupon(storeId, couponId));
}
