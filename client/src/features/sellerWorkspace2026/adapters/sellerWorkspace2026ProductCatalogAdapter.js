// Adapter: Product Catalog for Seller Workspace 2026 preview layer
// Reads from existing sellerProducts.ts API — does NOT create new endpoints.
// Falls back to safe empty-state when API is unavailable.

import { getSellerWorkspaceContextBySlug } from "../../../api/sellerWorkspace.ts";
import { getSellerProducts } from "../../../api/sellerProducts.ts";
import { getProductCatalogFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

// ---------------------------------------------------------------------------
// Status mapping (conservative — only known API values are mapped)
// Unknown values are labeled "Unknown" and should be logged.
// ---------------------------------------------------------------------------
const REVIEW_STATUS_MAP = {
  none: "Not Submitted",
  submitted: "In Review",
  review_queue: "In Review",
  ready_to_submit: "Ready to Submit",
  needs_revision: "Revision Required",
  approved: "Approved",
  rejected: "Rejected",
};

const PRODUCT_STATUS_MAP = {
  active: "Published",
  inactive: "Hidden",
  draft: "Draft",
};

const VISIBILITY_MAP = {
  storefront_visible: "Storefront Visible",
  internal_only: "Internal Only",
  published_blocked: "Blocked",
};

const unknownStatuses = new Set();

const mapReviewStatus = (raw) => {
  const key = String(raw || "").toLowerCase();
  if (!key) return "Not Submitted";
  const mapped = REVIEW_STATUS_MAP[key];
  if (!mapped) {
    if (!unknownStatuses.has(key)) {
      unknownStatuses.add(key);
      if (typeof console !== "undefined") {
        console.warn(
          `[sellerWorkspace2026ProductCatalogAdapter] Unknown reviewStatus: "${key}" — displaying as "Unknown".`
        );
      }
    }
    return "Unknown";
  }
  return mapped;
};

const mapProductStatus = (raw) => {
  const key = String(raw || "").toLowerCase();
  return PRODUCT_STATUS_MAP[key] || "Unknown";
};

const mapVisibility = (raw) => {
  const key = String(raw || "").toLowerCase();
  return VISIBILITY_MAP[key] || null;
};

// ---------------------------------------------------------------------------
// Map a single API product list item to the Product Catalog 2026 view model
// ---------------------------------------------------------------------------
const mapProduct = (item) => {
  if (!item || typeof item !== "object") return null;

  const submissionStatus = String(
    item.submissionStatus ?? item.submission_status ?? ""
  ).toLowerCase();

  return {
    id: item.id ?? null,
    title: item.name ?? item.title ?? "Untitled",
    sku: item.sku ?? item.primarySku ?? null,
    thumbnailUrl: item.thumbnailUrl ?? item.imageUrl ?? item.imageUrls?.[0] ?? null,
    price: item.price ?? item.basePrice ?? null,
    compareAtPrice: item.compareAtPrice ?? item.salePrice ?? null,
    stock: item.stock ?? item.totalStock ?? 0,
    category: item.category?.name ?? item.categoryName ?? null,
    visibility: mapVisibility(item.visibilityState ?? item.visibility_state),
    status: mapProductStatus(item.status),
    reviewStatus: mapReviewStatus(submissionStatus),
    syncStatus: item.syncStatus ?? null,
    updatedAt: item.updatedAt ?? item.updated_at ?? null,
    storefrontUrl: item.storefrontUrl ?? item.publicUrl ?? null,
  };
};

// ---------------------------------------------------------------------------
// Compute summary counts from product list (conservative — count by status)
// ---------------------------------------------------------------------------
const computeSummary = (apiSummary, items) => {
  // Prefer the API-provided summary if present
  if (apiSummary && typeof apiSummary === "object" && apiSummary.totalProducts !== undefined) {
    return {
      totalProducts: apiSummary.totalProducts ?? 0,
      draft: apiSummary.drafts ?? 0,
      inReview: (apiSummary.submitted ?? 0) + (apiSummary.reviewQueue ?? 0),
      published: apiSummary.active ?? 0,
      revisionRequired: apiSummary.needsRevision ?? 0,
      rejected: 0, // API summary does not expose this field directly
      hidden: apiSummary.inactive ?? 0,
      outOfStock: 0, // not in summary — would require product-level scan
    };
  }

  // Fallback: count from items array when summary is absent
  let draft = 0,
    inReview = 0,
    published = 0,
    revisionRequired = 0,
    hidden = 0;

  for (const item of items) {
    const s = item.status;
    const rs = item.reviewStatus;
    if (s === "Draft") draft++;
    else if (s === "Published") published++;
    else if (s === "Hidden") hidden++;
    if (rs === "In Review") inReview++;
    else if (rs === "Revision Required") revisionRequired++;
  }

  return {
    totalProducts: items.length,
    draft,
    inReview,
    published,
    revisionRequired,
    rejected: 0,
    hidden,
    outOfStock: items.filter((p) => (p.stock ?? 0) === 0).length,
  };
};

// ---------------------------------------------------------------------------
// Main adapter function
// ---------------------------------------------------------------------------
export const fetchSellerWorkspace2026ProductCatalog = async (
  storeSlug,
  filters = {}
) => {
  if (!storeSlug) {
    return { ...getProductCatalogFallback(), meta: { ...getProductCatalogFallback().meta, usingLiveData: false } };
  }

  // Step 1: Resolve storeSlug → storeId via workspace context
  let storeId = null;
  let store = null;
  try {
    const context = await getSellerWorkspaceContextBySlug(storeSlug);
    storeId = context?.store?.id ?? null;
    store = context?.store
      ? {
          id: context.store.id,
          slug: context.store.slug ?? storeSlug,
          name: context.store.name ?? storeSlug,
          status: context.store.status ?? null,
        }
      : null;
  } catch (contextError) {
    // Cannot resolve storeId — fall back
    if (typeof console !== "undefined") {
      console.warn(
        "[sellerWorkspace2026ProductCatalogAdapter] Failed to resolve store context:",
        contextError?.message ?? contextError
      );
    }
    return { ...getProductCatalogFallback(), meta: { ...getProductCatalogFallback().meta, usingLiveData: false } };
  }

  if (!storeId) {
    return { ...getProductCatalogFallback(), meta: { ...getProductCatalogFallback().meta, usingLiveData: false } };
  }

  // Step 2: Fetch product list from existing API
  const query = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    keyword: filters.keyword || undefined,
    status: filters.status || undefined,
    submissionStatus: filters.submissionStatus || undefined,
    visibilityState: filters.visibilityState || undefined,
    sort: filters.sort || undefined,
  };

  let raw = null;
  try {
    raw = await getSellerProducts(storeId, query);
  } catch (productsError) {
    if (typeof console !== "undefined") {
      console.warn(
        "[sellerWorkspace2026ProductCatalogAdapter] Failed to fetch products:",
        productsError?.message ?? productsError
      );
    }
    return {
      ...getProductCatalogFallback(),
      store,
      meta: { ...getProductCatalogFallback().meta, usingLiveData: false },
    };
  }

  if (!raw) {
    return {
      ...getProductCatalogFallback(),
      store,
      meta: { ...getProductCatalogFallback().meta, usingLiveData: false },
    };
  }

  // Step 3: Map products
  const mappedProducts = Array.isArray(raw.items)
    ? raw.items.map(mapProduct).filter(Boolean)
    : [];

  // Step 4: Build summary
  const summary = computeSummary(raw.summary, mappedProducts);

  // Step 5: Build filter options (categories extracted from items when not in API)
  const categorySet = new Set();
  for (const p of mappedProducts) {
    if (p.category) categorySet.add(p.category);
  }

  return {
    store,
    summary,
    filters: {
      categories: Array.from(categorySet).map((c) => ({ label: c, value: c })),
      statuses: [
        { label: "All", value: "" },
        { label: "Draft", value: "draft" },
        { label: "Published", value: "active" },
        { label: "Hidden", value: "inactive" },
      ],
      submissionStatuses: [
        { label: "All", value: "" },
        { label: "Not Submitted", value: "none" },
        { label: "In Review", value: "submitted" },
        { label: "Revision Required", value: "needs_revision" },
      ],
      visibilityOptions: [
        { label: "All", value: "" },
        { label: "Storefront Visible", value: "storefront_visible" },
        { label: "Internal Only", value: "internal_only" },
        { label: "Blocked", value: "published_blocked" },
      ],
    },
    products: mappedProducts,
    meta: {
      page: raw.pagination?.page ?? 1,
      pageSize: raw.pagination?.limit ?? 20,
      total: raw.pagination?.total ?? mappedProducts.length,
      usingLiveData: true,
    },
  };
};
