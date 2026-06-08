import { getSellerStoreProfile } from "../../../api/sellerStoreProfile.ts";
import { getSellerProductDetail, getProductActivity } from "../../../api/sellerProducts.ts";
import { getProductReviewDetailFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

const STATUS_MAP = {
  draft: "Draft",
  pending_review: "In Review",
  in_review: "In Review",
  submitted: "In Review",
  needs_revision: "Revision Required",
  revision_required: "Revision Required",
  approved: "Approved",
  published: "Published",
  active: "Published",
  rejected: "Rejected",
  archived: "Archived",
  hidden: "Hidden",
  inactive: "Hidden",
};

export const fetchSellerWorkspace2026ProductReviewDetail = async (storeSlug, productId) => {
  try {
    // 1. Resolve store context
    // Assuming we have a way to resolve slug to id or we pass slug to the API
    const storeProfile = await getSellerStoreProfile(storeSlug);
    if (!storeProfile) {
      return getProductReviewDetailFallback(productId);
    }
    
    // 2. Fetch Product Detail
    const productData = await getSellerProductDetail(storeProfile.id, productId);
    if (!productData) {
      return getProductReviewDetailFallback(productId);
    }

    // 3. Fetch Product Activity
    let activity = [];
    try {
      activity = await getProductActivity(productId);
    } catch (err) {
      console.warn("Failed to fetch product activity timeline:", err);
    }

    const rawStatus = productData.status?.toLowerCase() || "unknown";
    const rawReviewStatus = productData.reviewState?.toLowerCase() || "none";
    
    const mappedStatus = STATUS_MAP[rawStatus] || "Draft";
    let mappedReviewStatus = STATUS_MAP[rawReviewStatus] || "Not Submitted";

    const isPublic = mappedStatus === "Published" && productData.visibility === "visible";

    // 4. Map View Model
    const viewModel = {
      store: {
        id: storeProfile.id,
        slug: storeProfile.slug,
        name: storeProfile.name,
        status: storeProfile.status,
      },
      product: {
        id: productData.id,
        title: productData.name || productData.title,
        sku: productData.sku,
        description: productData.description,
        thumbnailUrl: productData.images?.[0]?.url || productData.thumbnailUrl || null,
        gallery: productData.images || [],
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
        stock: productData.stock,
        weight: productData.weight,
        category: productData.category?.name || productData.categoryId,
        brand: productData.brand?.name || productData.brandId,
        status: mappedStatus,
        reviewStatus: mappedReviewStatus,
        visibility: productData.visibility || "hidden",
        storefrontUrl: productData.publicUrl || productData.storefrontUrl || null,
        updatedAt: productData.updatedAt,
        createdAt: productData.createdAt,
      },
      review: {
        currentStep: mappedReviewStatus,
        statusLabel: mappedReviewStatus,
        submittedAt: productData.submittedAt || null,
        reviewedAt: productData.reviewedAt || null,
        approvedAt: productData.approvedAt || null,
        publishedAt: productData.publishedAt || null,
        reviewerName: productData.reviewerName || null,
        notes: productData.reviewNotes || productData.adminNotes || null,
        revisionNotes: productData.revisionNotes || null,
        timeline: activity.map(item => ({
          key: item.id || Math.random().toString(),
          label: item.action || "Updated",
          status: "active",
          timestamp: item.createdAt,
          description: item.description || item.notes || ""
        }))
      },
      readiness: {
        score: productData.readinessScore || 0,
        items: productData.readinessItems || [],
        canSubmitReview: productData.canSubmitReview || false,
        canResubmit: mappedReviewStatus === "Revision Required",
        canViewStorefront: isPublic,
        canDuplicate: true // Duplicate is generally available in the API
      },
      comparison: {
        currentVersion: productData.version || 1,
        lastApprovedVersion: productData.lastApprovedVersion || null,
        changes: []
      },
      meta: {
        usingLiveData: true,
        unknownStatuses: []
      }
    };

    return viewModel;
  } catch (error) {
    console.error("SellerWorkspace2026 ProductReviewDetail Adapter Error:", error);
    const fallback = getProductReviewDetailFallback(productId);
    fallback.meta.usingLiveData = false;
    return fallback;
  }
};
