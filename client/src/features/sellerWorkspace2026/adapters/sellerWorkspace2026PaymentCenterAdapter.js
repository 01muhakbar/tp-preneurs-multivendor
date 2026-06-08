import { getSellerStoreProfile } from "../../../api/sellerStoreProfile.ts";
import { getSellerPaymentReviewSuborders } from "../../../api/sellerPayments.ts";
import { getSellerPaymentProfile } from "../../../api/sellerPaymentProfile.ts";
import { getPaymentCenterFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

const MAP_REVIEW_STATUS = {
  pending: "Pending Review",
  submitted: "Pending Review",
  verified: "Verified",
  approved: "Verified",
  paid: "Verified",
  rejected: "Rejected",
  needs_check: "Needs Recheck",
  recheck: "Needs Recheck",
  cancelled: "Cancelled",
};

const MAP_PROFILE_STATUS = {
  draft: "Draft",
  submitted: "In Review",
  in_review: "In Review",
  needs_revision: "Needs Revision",
  approved: "Approved",
  active: "Active",
  rejected: "Rejected",
  inactive: "Inactive",
};

const mapReviewStatus = (raw) => MAP_REVIEW_STATUS[raw?.toLowerCase()] || "Unknown";
const mapProfileStatus = (raw) => MAP_PROFILE_STATUS[raw?.toLowerCase()] || "Unknown";

export const fetchSellerWorkspace2026PaymentCenter = async (storeSlug) => {
  try {
    const storeProfile = await getSellerStoreProfile(storeSlug);
    if (!storeProfile) {
      return getPaymentCenterFallback();
    }

    const [reviewsData, profileData] = await Promise.all([
      getSellerPaymentReviewSuborders(storeProfile.id, "pending"),
      getSellerPaymentProfile(storeProfile.id).catch(() => null)
    ]);

    const paymentReviews = (reviewsData?.items || []).map(item => ({
      id: item.payment?.id || item.suborderId,
      paymentId: item.payment?.id,
      orderId: item.suborderId,
      invoiceNumber: item.payment?.internalReference || item.suborderNumber,
      buyerName: item.buyer?.name || "Customer",
      buyerEmail: item.buyer?.email || "",
      buyerPhone: item.buyer?.phone || "",
      amount: item.payment?.amount || item.totalAmount || 0,
      method: item.payment?.paymentType || "Unknown",
      status: mapReviewStatus(item.payment?.status || item.paymentStatus),
      submittedAt: item.payment?.proof?.transferTime || item.payment?.proof?.createdAt || item.createdAt,
      proofThumbnails: item.payment?.proof?.proofImageUrl ? [item.payment.proof.proofImageUrl] : [],
      allowedActions: item.payment?.reviewActionability?.canReview ? ["APPROVE", "REJECT"] : []
    }));

    const payoutProfile = profileData ? {
      status: mapProfileStatus(profileData.requestStatus?.code || profileData.activeSnapshot?.snapshotStatus),
      readiness: profileData.readModel?.completeness?.allRequiredPresent ? "Ready" : "Missing Information",
      bankAccounts: profileData.activeSnapshot?.accountName ? [{
        name: profileData.activeSnapshot.accountName,
        bank: "Bank",
        accountNumber: "Hidden"
      }] : [],
      primaryBank: profileData.activeSnapshot?.accountName || null,
      taxInfo: null,
      documents: [],
      payoutSchedule: "Weekly",
      minimumPayout: 50000,
      lastUpdatedAt: profileData.updatedAt || new Date().toISOString(),
      activationStatus: profileData.activeSnapshot?.isActive ? "Active" : "Inactive"
    } : {
      status: "Unknown",
      readiness: "Unknown",
      bankAccounts: [],
      primaryBank: null,
      taxInfo: null,
      documents: [],
      payoutSchedule: "Weekly",
      minimumPayout: 50000,
      lastUpdatedAt: new Date().toISOString(),
      activationStatus: "Unknown"
    };

    return {
      store: {
        id: storeProfile.id,
        slug: storeProfile.slug,
        name: storeProfile.name,
        status: storeProfile.status
      },
      summary: {
        pendingReviews: paymentReviews.filter(r => r.status === "Pending Review").length,
        verifiedPayments: 0, // Since we only fetched 'pending', this would require another call or aggregated data. Set to 0 for preview.
        rejectedPayments: 0,
        payoutReadiness: payoutProfile.readiness,
        nextPayoutDate: "2026-06-10T00:00:00Z", // Mocked for preview
        estimatedPayoutAmount: 0 // Mocked for preview
      },
      paymentReviews,
      payoutProfile,
      governance: {
        adminAuditFinal: true,
        sellerCanApprovePayment: true, // Controlled per-item by allowedActions
        sellerCanRejectPayment: true,
        sellerCanRequestRecheck: false,
        sellerCanSubmitProfile: profileData?.governance?.canEdit || false,
        sellerCanActivateProfile: false // Guardrail: Seller cannot self-activate
      },
      meta: {
        usingLiveData: true,
        unknownStatuses: []
      }
    };
  } catch (error) {
    console.error("Payment Center Adapter Error:", error);
    const fallback = getPaymentCenterFallback();
    fallback.meta.usingLiveData = false;
    return fallback;
  }
};
