import { Coupon } from "../models/index.js";
import { getCouponTimeWindow, normalizeCouponScopeType, serializePublicCouponSnapshot, } from "./sharedContracts/couponGovernance.js";
const isPlainObject = (value) => !!value && typeof value === "object" && !Array.isArray(value);
const toText = (value, fallback = "") => {
    const normalized = String(value ?? "").trim();
    return normalized || fallback;
};
const resolvePublicOffersCouponSelection = async (activeCouponCode) => {
    const normalizedCode = toText(activeCouponCode, "").toUpperCase();
    if (!normalizedCode) {
        return {
            selectionStatus: "empty",
            couponSnapshot: null,
        };
    }
    if (normalizedCode === "ALL") {
        return {
            selectionStatus: "all",
            couponSnapshot: null,
        };
    }
    const coupon = await Coupon.findOne({
        where: { code: normalizedCode },
        attributes: [
            "id",
            "code",
            "discountType",
            "amount",
            "minSpend",
            "active",
            "scopeType",
            "storeId",
            "startsAt",
            "expiresAt",
        ],
    });
    if (!coupon) {
        return {
            selectionStatus: "not_found",
            couponSnapshot: null,
        };
    }
    const scopeType = normalizeCouponScopeType(coupon.get?.("scopeType"));
    if (scopeType !== "PLATFORM") {
        return {
            selectionStatus: "unsupported_scope",
            couponSnapshot: null,
        };
    }
    if (!Boolean(coupon.get?.("active"))) {
        return {
            selectionStatus: "inactive",
            couponSnapshot: null,
        };
    }
    const timeWindow = getCouponTimeWindow(coupon);
    if (!timeWindow.started) {
        return {
            selectionStatus: "not_started",
            couponSnapshot: null,
        };
    }
    if (timeWindow.expired) {
        return {
            selectionStatus: "expired",
            couponSnapshot: null,
        };
    }
    return {
        selectionStatus: "valid",
        couponSnapshot: serializePublicCouponSnapshot(coupon),
    };
};
export const buildPublicOffersCustomization = async (rawOffers) => {
    const offers = isPlainObject(rawOffers) ? rawOffers : {};
    const superDiscount = isPlainObject(offers.superDiscount) ? offers.superDiscount : {};
    const activeCouponCode = toText(superDiscount.activeCouponCode ?? superDiscount.couponCode, "").toUpperCase();
    const couponSelection = await resolvePublicOffersCouponSelection(activeCouponCode);
    return {
        ...offers,
        superDiscount: {
            ...superDiscount,
            activeCouponCode,
            selectionStatus: couponSelection.selectionStatus,
            couponSnapshot: couponSelection.couponSnapshot,
        },
    };
};
