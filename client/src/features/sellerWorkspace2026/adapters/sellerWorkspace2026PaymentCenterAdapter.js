import { getSellerStoreProfile } from "../../../api/sellerStoreProfile.ts";
import { getSellerPaymentReviewSuborders } from "../../../api/sellerPayments.ts";
import { getSellerPaymentProfile } from "../../../api/sellerPaymentProfile.ts";
import { getSellerWorkspaceContextBySlug, getSellerFinanceSummary } from "../../../api/sellerWorkspace.ts";
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
const hasValidStoreSlug = (storeSlug) => Boolean(String(storeSlug || "").trim());
const maskAccountNumber = (value) => {
  const normalized = String(value || "").replace(/\s+/g, "");
  if (!normalized) return null;
  if (normalized.length <= 4) return normalized;
  return `${"*".repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}`;
};

const getUnavailablePaymentCenterFallback = () => {
  const fallback = getPaymentCenterFallback();
  fallback.paymentReviews = [];
  fallback.summary = {
    ...fallback.summary,
    pendingReviews: 0,
    verifiedPayments: 0,
    awaitingDeliveredPayments: 0,
    withdrawalEligiblePayments: 0,
    rejectedPayments: 0,
    payoutReadiness: "Unavailable",
    estimatedPayoutAmount: 0,
  };
  fallback.meta.usingLiveData = false;
  fallback.meta.message = "Payment data is not available for this store yet.";
  return fallback;
};

export const fetchSellerWorkspace2026PaymentCenter = async (storeSlug) => {
  if (!hasValidStoreSlug(storeSlug)) {
    return getUnavailablePaymentCenterFallback();
  }

  try {
    const storeContext = await getSellerWorkspaceContextBySlug(storeSlug).catch(() => null);
    const storeId = Number(storeContext?.store?.id || 0);
    if (!storeId) {
      return getUnavailablePaymentCenterFallback();
    }

    const storeProfile = await getSellerStoreProfile(storeId).catch(() => null);
    if (!storeProfile) {
      return getUnavailablePaymentCenterFallback();
    }

    const [reviewsData, profileData, financeSummary] = await Promise.all([
      getSellerPaymentReviewSuborders(storeProfile.id, "PENDING_CONFIRMATION"),
      getSellerPaymentProfile(storeProfile.id).catch(() => null),
      getSellerFinanceSummary(storeProfile.id).catch(() => null)
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

    const activeSnapshot = profileData?.activeSnapshot || null;
    const payoutDestination = activeSnapshot
      ? {
          bankName: activeSnapshot.bankName || null,
          accountNumber: activeSnapshot.accountNumber || null,
          accountNumberMasked: maskAccountNumber(activeSnapshot.accountNumber),
          accountHolderName: activeSnapshot.accountHolderName || activeSnapshot.accountName || null,
          label:
            activeSnapshot.bankName && activeSnapshot.accountNumber
              ? `${activeSnapshot.bankName} - ${maskAccountNumber(activeSnapshot.accountNumber)}`
              : null,
        }
      : null;

    const payoutProfile = profileData ? {
      status: mapProfileStatus(profileData.requestStatus?.code || profileData.activeSnapshot?.snapshotStatus),
      readiness: profileData.readModel?.completeness?.allRequiredPresent ? "Ready" : "Missing Information",
      bankAccounts: payoutDestination?.bankName ? [{
        name: payoutDestination.accountHolderName,
        bank: payoutDestination.bankName,
        accountNumber: payoutDestination.accountNumberMasked || "Hidden"
      }] : [],
      primaryBank: payoutDestination?.label || null,
      destination: payoutDestination,
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
      destination: null,
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
        verifiedPayments: financeSummary?.suborderPaymentSummary?.paidCount || 0,
        awaitingDeliveredPayments:
          financeSummary?.eligiblePaidSubordersSummary?.waitingDeliveryCount ||
          (financeSummary?.eligiblePaidSubordersSummary?.awaitingFulfillmentCount || 0) +
            (financeSummary?.eligiblePaidSubordersSummary?.inProgressCount || 0),
        withdrawalEligiblePayments: financeSummary?.eligiblePaidSubordersSummary?.deliveredCount || 0,
        rejectedPayments: financeSummary?.paymentReviewCounts?.rejected || 0,
        payoutReadiness: payoutProfile.readiness,
        nextPayoutDate: financeSummary?.eligiblePaidSubordersSummary?.nextPayoutDate || new Date().toISOString(),
        estimatedPayoutAmount: financeSummary?.eligiblePaidSubordersSummary?.estimatedPayoutAmount || 0
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
    return getUnavailablePaymentCenterFallback();
  }
};
