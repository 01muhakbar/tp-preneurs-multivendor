import { getSellerStoreProfile } from "../../../api/sellerStoreProfile.ts";
import { listSellerCoupons } from "../../../api/sellerCoupons.ts";
import { getSellerAnalyticsSummary } from "../../../api/sellerWorkspace.ts";
import { getCouponsFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

const MAP_DISCOUNT_TYPE = {
  percent: "Percentage",
  percentage: "Percentage",
  fixed: "Fixed Amount",
  amount: "Fixed Amount",
  nominal: "Fixed Amount",
  free_shipping: "Free Shipping"
};

const mapDiscountType = (raw) => MAP_DISCOUNT_TYPE[raw?.toLowerCase()] || "Unknown";

const mapStatus = (item) => {
  if (item.active === true && !item.status?.code) return "Active";
  if (item.active === false && !item.status?.code) return "Inactive";
  
  const raw = item.status?.code?.toLowerCase() || "";
  if (raw === "active") return "Active";
  if (raw === "scheduled") return "Scheduled";
  if (raw === "expired") return "Expired";
  if (raw === "draft") return "Draft";
  if (raw === "archived") return "Archived";
  if (raw === "disabled" || raw === "inactive") return "Inactive";
  return "Unknown";
};

const mapOwnerScope = (item) => {
  const scope = item.scopeType?.toLowerCase() || "";
  const isSellerOwned = item.governance?.sellerOwned;
  if (scope === "seller" || scope === "store" || isSellerOwned) return "Store Coupon";
  if (scope === "platform" || scope === "admin") return "Platform Coupon";
  if (scope === "bank" || scope === "partner") return "Partner Coupon";
  return "Unknown";
};

const mapAttribution = (item) => {
  const scope = mapOwnerScope(item);
  if (scope === "Store Coupon") return "Store";
  if (scope === "Platform Coupon") return "Platform";
  if (scope === "Partner Coupon") return "Partner";
  return "Unknown";
};

export const fetchSellerWorkspace2026Coupons = async (storeSlug) => {
  try {
    const storeProfile = await getSellerStoreProfile(storeSlug);
    if (!storeProfile) {
      return getCouponsFallback();
    }

    const [couponResponse, analyticsData] = await Promise.all([
      listSellerCoupons(storeProfile.id),
      getSellerAnalyticsSummary(storeProfile.id).catch(() => null)
    ]);
    const { items, governance } = couponResponse;

    const coupons = (items || []).map(item => {
      const scopeLabel = mapOwnerScope(item);
      const isSellerOwned = scopeLabel === "Store Coupon";

      return {
        id: item.id,
        code: item.code,
        name: item.campaignName,
        scope: scopeLabel,
        ownerType: isSellerOwned ? "seller" : "platform",
        attribution: mapAttribution(item),
        discountType: mapDiscountType(item.discountType),
        discountValue: item.amount || 0,
        maxDiscount: 0,
        minPurchase: item.minSpend || 0,
        usageLimit: 0,
        usageCount: 0,
        usagePercent: 0,
        validFrom: item.startsAt,
        validUntil: item.expiresAt,
        storefrontEligibility: item.governance?.storefrontBoundary || "All Products",
        status: mapStatus(item),
        productScope: "All",
        categoryScope: "All",
        allowedActions: (item.governance?.canEdit && isSellerOwned) ? ["EDIT", "DELETE"] : []
      };
    });

    return {
      store: {
        id: storeProfile.id,
        slug: storeProfile.slug,
        name: storeProfile.name,
        status: storeProfile.status
      },
      summary: {
        activeCoupons: coupons.filter(c => c.status === "Active").length,
        scheduledCampaigns: coupons.filter(c => c.status === "Scheduled").length,
        totalRedemptions: analyticsData?.couponSnapshot?.totalRedemptions || 0,
        attributedRevenue: analyticsData?.couponAttributionSnapshot?.paidDiscountAmount || 0,
        expiredCoupons: coupons.filter(c => c.status === "Expired").length,
        conflictWarnings: 0
      },
      coupons,
      conflicts: [], // Optional advanced check
      performance: {
        redemptions: analyticsData?.couponSnapshot?.totalRedemptions || 0,
        revenue: analyticsData?.couponAttributionSnapshot?.paidDiscountAmount || 0,
        topCoupons: analyticsData?.couponAttributionSnapshot?.topCouponCodes?.map(c => ({
          code: c.code,
          redemptions: c.attributedPaidSuborders,
          amount: c.paidDiscountAmount
        })) || []
      },
      governance: {
        sellerCanCreateCoupon: governance?.sellerCanCreate || false,
        sellerCanEditCoupon: governance?.sellerCanEdit || false,
        sellerCanDeleteCoupon: governance?.sellerCanEdit || false, // Assuming edit gives delete rights for now, but UI will guard
        sellerCanPublishCoupon: governance?.sellerCanManageStatus || false,
        checkoutValidationUnchanged: true
      },
      meta: {
        page: 1,
        pageSize: coupons.length || 10,
        total: coupons.length,
        usingLiveData: true,
        unknownStatuses: []
      }
    };
  } catch (error) {
    console.error("Coupons Adapter Error:", error);
    const fallback = getCouponsFallback();
    fallback.meta.usingLiveData = false;
    return fallback;
  }
};
