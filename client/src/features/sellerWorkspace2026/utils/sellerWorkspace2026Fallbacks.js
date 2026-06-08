// utils to provide fallback preview data for Seller Workspace 2026 live adapters
import { sellerStore, readiness, kpis, topProducts, suborders, products } from "../../seller2026/seller2026Data.js";

const traffic = [];

export const getOverviewFallback = () => ({
  kpis,
  readiness,
  readinessPercent: 78,
  topProducts,
  suborders,
  traffic,
});

export const getStoreProfileFallback = () => ({
  identity: {
    name: sellerStore.name,
    slug: sellerStore.slug,
    status: sellerStore.status,
    description: sellerStore.description,
    logoUrl: sellerStore.logoUrl,
    bannerUrl: sellerStore.bannerUrl,
  },
  contact: {
    email: sellerStore.email,
    phone: sellerStore.phone,
    whatsapp: sellerStore.whatsapp,
    address: sellerStore.addressLine1,
  },
  storefront: {
    publicUrl: sellerStore.publicUrl || null,
    syncStatus: "preview",
    lastSyncedAt: null,
  },
  shipping: {
    readiness: sellerStore.shippingSetupStatus?.label || "preview",
    enabledCouriers: [],
    originAddress: sellerStore.shippingSetup || {},
  },
});

// ---------------------------------------------------------------------------
// Product Catalog fallback shown when live API is unavailable.
// Uses static preview data from seller2026Data.js.
// Status values use English labels matching the 2026 status mapping.
// ---------------------------------------------------------------------------
const STATUS_LABEL_MAP = {
  Active: "Published",
  Inactive: "Hidden",
  Draft: "Draft",
  Submitted: "In Review",
  "Needs Revision": "Revision Required",
  Rejected: "Rejected",
};

const mapFallbackStatus = (raw) => STATUS_LABEL_MAP[raw] || raw || "Unknown";

const fallbackProducts = products.map((p, i) => ({
  id: `preview-${i + 1}`,
  title: p.name,
  sku: p.sku,
  thumbnailUrl: null,
  price: p.price ? parseFloat(String(p.price).replace(/\./g, "").replace(",", ".")) || null : null,
  compareAtPrice: null,
  stock: typeof p.stock === "number" ? p.stock : 0,
  category: p.category || null,
  visibility: null,
  status: mapFallbackStatus(p.status),
  reviewStatus: p.status === "Submitted" ? "In Review"
    : p.status === "Needs Revision" ? "Revision Required"
    : "Not Submitted",
  syncStatus: null,
  updatedAt: p.updated || null,
  storefrontUrl: null,
}));

export const getProductCatalogFallback = () => ({
  store: {
    id: null,
    slug: sellerStore?.slug || "preview",
    name: sellerStore?.name || "Preview Store",
    status: sellerStore?.status || "preview",
  },
  summary: {
    totalProducts: fallbackProducts.length,
    draft: fallbackProducts.filter((p) => p.status === "Draft").length,
    inReview: fallbackProducts.filter((p) => p.reviewStatus === "In Review").length,
    published: fallbackProducts.filter((p) => p.status === "Published").length,
    revisionRequired: fallbackProducts.filter((p) => p.reviewStatus === "Revision Required").length,
    rejected: 0,
    hidden: fallbackProducts.filter((p) => p.status === "Hidden").length,
    outOfStock: fallbackProducts.filter((p) => p.stock === 0).length,
  },
  filters: {
    categories: [],
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
  products: fallbackProducts,
  meta: {
    page: 1,
    pageSize: fallbackProducts.length,
    total: fallbackProducts.length,
    usingLiveData: false,
  },
});

export const getProductAuthoringFallback = () => ({
  store: {
    id: null,
    slug: sellerStore?.slug || "preview",
    name: sellerStore?.name || "Preview Store",
    status: sellerStore?.status || "preview",
  },
  form: {
    title: "",
    description: "",
    categoryId: "",
    categoryLabel: "",
    brand: "",
    sku: "",
    barcode: "",
    productType: "",
    condition: "baru",
    warranty: "",
    origin: "lokal",
    price: "",
    compareAtPrice: "",
    stock: "",
    weight: "",
    media: [],
    variants: [],
    seoTitle: "",
    seoDescription: "",
    shipping: ""
  },
  validation: {
    completeness: 0,
    requiredMissing: [],
    warnings: [],
    canSaveDraft: false,
    canSubmitReview: false,
  },
  meta: {
    mode: "create",
    productId: null,
    status: "draft",
    reviewStatus: "none",
    usingLiveData: false
  }
});

export const getProductReviewDetailFallback = (productId, store = {}) => ({
  store: {
    id: store.id ?? null,
    slug: store.slug ?? 'preview',
    name: store.name ?? 'Preview Store',
    status: store.status ?? 'preview',
  },
  product: {
    id: productId || 'preview-id',
    title: 'Preview Product',
    sku: 'PRV-001',
    description: 'This is a fallback preview product.',
    thumbnailUrl: null,
    gallery: [],
    price: 150000,
    compareAtPrice: null,
    stock: 50,
    weight: 1000,
    category: 'Preview Category',
    brand: 'Preview Brand',
    status: 'Draft',
    reviewStatus: 'Not Submitted',
    visibility: 'Hidden',
    storefrontUrl: null,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  review: {
    currentStep: 'Draft',
    statusLabel: 'Draft',
    submittedAt: null,
    reviewedAt: null,
    approvedAt: null,
    publishedAt: null,
    reviewerName: null,
    notes: null,
    revisionNotes: null,
    timeline: [
      {
        key: 'draft',
        label: 'Draft Created',
        status: 'active',
        timestamp: new Date().toISOString(),
        description: 'Product draft was created.',
      },
    ],
  },
  readiness: {
    score: 80,
    items: [
      { label: 'Basic Information', status: 'Completed', score: 20, message: '' },
      { label: 'Media', status: 'Pending', score: 0, message: 'Missing product images.' },
      { label: 'Pricing & Inventory', status: 'Completed', score: 40, message: '' },
      { label: 'Shipping', status: 'Completed', score: 20, message: '' },
    ],
    canSubmitReview: false,
    canResubmit: false,
    canViewStorefront: false,
    canDuplicate: false,
  },
  comparison: {
    currentVersion: 1,
    lastApprovedVersion: null,
    changes: [],
  },
  meta: {
    usingLiveData: false,
    unknownStatuses: [],
  },
});

export const getOrdersFallback = () => ({
  store: {
    id: null,
    slug: 'preview',
    name: 'Preview Store',
    status: 'preview',
  },
  summary: {
    newOrders: 5,
    processing: 2,
    readyToShip: 0,
    shipped: 10,
    completed: 45,
    returns: 1,
    codOrPendingPayment: 3,
    overdueSla: 0
  },
  filters: {
    statuses: [],
    paymentStatuses: [],
    couriers: [],
    channels: []
  },
  orders: [
    {
      id: 'preview-order-1',
      orderId: 'preview-parent-1',
      suborderId: 'preview-sub-1',
      customerName: 'John Doe',
      customerPhone: '08123456789',
      productSummary: '1x Wireless Mouse',
      products: [],
      channel: 'Web',
      paymentStatus: 'Paid',
      paymentMethod: 'Bank Transfer',
      fulfillmentStatus: 'New',
      courier: 'JNE',
      service: 'REG',
      trackingNumber: null,
      total: 150000,
      slaLabel: 'Ship by Tomorrow',
      slaStatus: 'warning',
      orderedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    usingLiveData: false
  }
});

export const getOrderDetailFallback = (suborderId) => ({
  id: suborderId || 'preview-sub-1',
  orderId: 'preview-parent-1',
  suborderId: suborderId || 'preview-sub-1',
  customer: {
    name: 'John Doe',
    phone: '08123456789',
    email: 'john@example.com'
  },
  shippingAddress: '123 Preview St, Mock City',
  products: [
    { id: 1, name: 'Wireless Mouse', qty: 1, price: 150000, totalPrice: 150000 }
  ],
  payment: {
    status: 'Paid',
    method: 'Bank Transfer',
    total: 150000
  },
  fulfillment: {
    status: 'New',
    courier: 'JNE',
    service: 'REG',
    trackingNumber: null,
    slaLabel: 'Ship by Tomorrow',
    slaStatus: 'warning'
  },
  timeline: [
    { key: '1', label: 'Order Placed', timestamp: new Date().toISOString() },
    { key: '2', label: 'Payment Verified', timestamp: new Date().toISOString() }
  ],
  notes: 'Please pack safely',
  allowedActions: ['MARK_PROCESSING'],
  meta: {
    usingLiveData: false
  }
});


export const getPaymentCenterFallback = () => ({
  store: {
    id: null,
    slug: 'preview',
    name: 'Preview Store',
    status: 'preview',
  },
  summary: {
    pendingReviews: 2,
    verifiedPayments: 15,
    rejectedPayments: 1,
    payoutReadiness: 'Incomplete',
    nextPayoutDate: '2026-06-10T00:00:00Z',
    estimatedPayoutAmount: 4500000
  },
  paymentReviews: [
    {
      id: 'preview-pay-1',
      paymentId: 'preview-pay-1',
      orderId: 'preview-sub-1',
      invoiceNumber: 'INV/2026/001',
      buyerName: 'John Doe',
      buyerEmail: 'john@example.com',
      buyerPhone: '08123456789',
      amount: 150000,
      method: 'Manual Bank Transfer',
      status: 'Pending Review',
      submittedAt: new Date().toISOString(),
      proofThumbnails: [],
      allowedActions: ['APPROVE', 'REJECT']
    }
  ],
  payoutProfile: {
    status: 'Draft',
    readiness: 'Missing Information',
    bankAccounts: [],
    primaryBank: null,
    taxInfo: null,
    documents: [],
    payoutSchedule: 'Weekly',
    minimumPayout: 50000,
    lastUpdatedAt: new Date().toISOString(),
    activationStatus: 'Inactive'
  },
  governance: {
    adminAuditFinal: true,
    sellerCanApprovePayment: true,
    sellerCanRejectPayment: true,
    sellerCanRequestRecheck: false,
    sellerCanSubmitProfile: true,
    sellerCanActivateProfile: false
  },
  meta: {
    usingLiveData: false,
    unknownStatuses: []
  }
});


export const getCouponsFallback = () => ({
  store: {
    id: null,
    slug: 'preview',
    name: 'Preview Store',
    status: 'preview',
  },
  summary: {
    activeCoupons: 1,
    scheduledCampaigns: 0,
    totalRedemptions: 125,
    attributedRevenue: 2500000,
    expiredCoupons: 5,
    conflictWarnings: 0
  },
  coupons: [
    {
      id: 'preview-coupon-1',
      code: 'SUMMER2026',
      name: 'Summer Sale 2026',
      scope: 'Store Coupon',
      ownerType: 'seller',
      attribution: 'Store',
      discountType: 'Percentage',
      discountValue: 15,
      maxDiscount: 50000,
      minPurchase: 100000,
      usageLimit: 1000,
      usageCount: 125,
      usagePercent: 12.5,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
      storefrontEligibility: 'All Products',
      status: 'Active',
      productScope: 'All',
      categoryScope: 'All',
      allowedActions: []
    }
  ],
  conflicts: [],
  performance: {
    redemptions: 125,
    revenue: 2500000,
    topCoupons: ['SUMMER2026']
  },
  governance: {
    sellerCanCreateCoupon: false,
    sellerCanEditCoupon: false,
    sellerCanDeleteCoupon: false,
    sellerCanPublishCoupon: false,
    checkoutValidationUnchanged: true
  },
  meta: {
    page: 1,
    pageSize: 10,
    total: 1,
    usingLiveData: false,
    unknownStatuses: []
  }
});


export const getTeamFallback = () => ({
  store: {
    id: null,
    slug: 'preview',
    name: 'Preview Store',
    status: 'preview',
  },
  summary: {
    totalMembers: 1,
    pendingInvites: 0,
    activeRoles: 1,
    recentAccessChanges: 0
  },
  members: [
    {
      id: 'preview-member-1',
      name: 'Owner User',
      email: 'owner@example.com',
      avatarUrl: null,
      role: 'owner',
      roleLabel: 'Owner',
      status: 'Active',
      storeScope: 'Global',
      lastActiveAt: new Date().toISOString(),
      invitedAt: null,
      joinedAt: new Date().toISOString(),
      allowedActions: []
    }
  ],
  roles: [
    {
      id: 'role-owner',
      name: 'owner',
      label: 'Owner',
      description: 'Full store access',
      permissions: ['*']
    }
  ],
  permissionMatrix: [
    { module: 'Catalog', owner: 'Allowed', admin: 'Allowed', staff: 'Limited', support: 'Denied' },
    { module: 'Orders', owner: 'Allowed', admin: 'Allowed', staff: 'Allowed', support: 'Limited' },
    { module: 'Payment', owner: 'Allowed', admin: 'Limited', staff: 'Denied', support: 'Denied' },
    { module: 'Coupons', owner: 'Allowed', admin: 'Allowed', staff: 'Denied', support: 'Denied' },
    { module: 'Storefront', owner: 'Allowed', admin: 'Allowed', staff: 'Limited', support: 'Denied' },
    { module: 'Analytics', owner: 'Allowed', admin: 'Allowed', staff: 'Limited', support: 'Limited' },
    { module: 'Team', owner: 'Allowed', admin: 'Limited', staff: 'Denied', support: 'Denied' }
  ],
  auditLogs: [],
  governance: {
    backendEnforced: true,
    uiMatrixIsInformational: true,
    sellerCanInvite: false,
    sellerCanUpdateRole: false,
    sellerCanDeactivateMember: false,
    sellerCanViewAudit: true
  },
  meta: {
    usingLiveData: false,
    inferredPermissions: true,
    unknownStatuses: []
  }
});


export const getAnalyticsSyncFallback = () => ({
  store: {
    id: null,
    slug: 'preview',
    name: 'Preview Store',
    status: 'preview',
    publicUrl: '/store/preview'
  },
  analytics: {
    revenue: 0,
    orders: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    visitors: 0,
    productViews: 0,
    revenueSeries: [100, 200, 150, 300, 250, 400, 350],
    orderSeries: [1, 3, 2, 5, 4, 7, 6],
    conversionSeries: [1.2, 1.5, 1.4, 2.0, 1.8, 2.5, 2.2],
    channelPerformance: [
      { name: 'Organic Search', value: 45 },
      { name: 'Direct', value: 30 },
      { name: 'Social', value: 15 },
      { name: 'Referral', value: 10 }
    ]
  },
  productPerformance: [
    {
      id: 'prod-preview-1',
      title: 'Preview Product',
      sku: 'PRV-001',
      views: 150,
      conversionRate: 2.5,
      revenue: 500000,
      unitsSold: 5,
      status: 'Active',
      visibility: 'Visible'
    }
  ],
  storefrontSync: {
    syncHealth: 'Needs Attention',
    lastSyncedAt: new Date().toISOString(),
    micrositeStatus: 'Needs Attention',
    productIndexStatus: 'Healthy',
    searchIndexStatus: 'Unknown',
    couponBannerStatus: 'Missing',
    logoStatus: 'Healthy',
    bannerStatus: 'Healthy',
    slugStatus: 'Healthy',
    publishedProductsCount: 1,
    issues: [
      {
        severity: 'warning',
        title: 'Coupon banner not synced',
        message: 'Active coupons are not visible on the storefront.',
        recommendedAction: 'Wait for sync workflow validation'
      }
    ]
  },
  publicPreview: {
    storeName: 'Preview Store',
    tagline: 'Welcome to our store',
    logoUrl: null,
    bannerUrl: null,
    slug: 'preview',
    publicUrl: '/store/preview',
    featuredProducts: 1,
    activeCouponBanners: 0
  },
  governance: {
    publicVisibilityUnchanged: true,
    syncMutationEnabled: false,
    storefrontPreviewReadOnly: true
  },
  meta: {
    usingLiveData: false,
    unknownStatuses: []
  }
});

