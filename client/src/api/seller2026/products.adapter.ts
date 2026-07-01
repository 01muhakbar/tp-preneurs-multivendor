export type Seller2026ProductStatus =
  | "draft"
  | "submitted"
  | "active"
  | "needs_revision"
  | "inactive";

export type Seller2026ProductsViewModel = {
  summary: {
    total: number;
    draft: number;
    submitted: number;
    active: number;
    storefrontVisible: number;
    publishedBlocked: number;
    internalOnly: number;
    needsRevision: number;
    inactive: number;
    pendingReview: number;
    archived: number;
    outOfStock: number;
  };
  filters: {
    categories: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
  };
  products: Array<{
    id: string | number;
    name: string;
    slug?: string;
    sku: string;
    barcode?: string;
    thumbnailUrl: string | null;
    category: string;
    stock: number;
    price: number;
    salePrice?: number;
    sales: number;
    views: number;
    status: Seller2026ProductStatus;
    visibility?: string;
    submissionStatus?: string;
    approvalStatus?: string;
    isPublished?: boolean;
    updatedAt: string | null;
    canSubmitReview: boolean;
    submitReviewAction: "submit_review" | "resubmit_review";
    submitReviewReason: string | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canSubmit: boolean;
    canPublish: boolean;
  };
};

export type Seller2026ProductDetailViewModel = {
  product: {
    id: string | number | null;
    name: string;
    slug?: string;
    sku: string;
    barcode?: string;
    shortDescription?: string;
    description: string;
    thumbnail?: string;
    gallery: string[];
    category: string;
    brand?: string;
    tags: string[];

    price: number;
    salePrice?: number;
    currency?: string;
    discountLabel?: string;

    stock: number;
    stockStatus?: string;
    lowStockThreshold?: number;
    inventoryPolicy?: string;

    status: Seller2026ProductStatus;
    visibility?: string;
    submissionStatus?: string;
    approvalStatus?: string;
    isPublished?: boolean;
    isDraft?: boolean;
    isArchived?: boolean;
    needsAttention?: boolean;
    lastSubmittedAt?: string;
    approvedAt?: string;
    rejectedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;

    canonicalListHref?: string;
    canonicalEditHref?: string;
    canonicalStorefrontHref?: string;
    canonicalCategoryHref?: string;

    sold: number;
    views: number;
    canSubmitReview: boolean;
    submitReviewAction: "submit_review" | "resubmit_review";
    submitReviewReason: string | null;
  };
  editableDraft: {
    name: string;
    sku: string;
    description: string;
    categoryIds: Array<string | number>;
    tags: string[];
    price: number;
    compareAtPrice: number;
    stock: number;
    seoTitle: string;
    seoDescription: string;
  };
  performance: {
    sales: number;
    revenue: number;
    views: number;
    conversionRate: number;
  };
  variants: Array<{
    id: string | number;
    name: string;
    sku: string;
    price: number;
    stock: number;
    sales: number;
    status: string;
  }>;
  revisionNotes: Array<{
    id: string | number;
    author: string;
    message: string;
    createdAt: string;
    status?: string;
  }>;
  publishHistory: Array<{
    id: string | number;
    label: string;
    actor: string;
    createdAt: string;
  }>;
};

type ProductPermissions = Partial<Seller2026ProductsViewModel["permissions"]>;

const EMPTY_PRODUCTS: Seller2026ProductsViewModel = {
  summary: {
    total: 0,
    draft: 0,
    submitted: 0,
    active: 0,
    storefrontVisible: 0,
    publishedBlocked: 0,
    internalOnly: 0,
    needsRevision: 0,
    inactive: 0,
    pendingReview: 0,
    archived: 0,
    outOfStock: 0,
  },
  filters: {
    categories: [{ value: "all", label: "All Categories" }],
    statuses: [
      { value: "all", label: "All Status" },
      { value: "draft", label: "Draft" },
      { value: "submitted", label: "Submitted" },
      { value: "active", label: "Active" },
      { value: "needs_revision", label: "Needs Revision" },
      { value: "inactive", label: "Inactive" },
    ],
  },
  products: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
  permissions: {
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canSubmit: false,
    canPublish: false,
  },
};

const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const idValue = (value: unknown, fallback: string | number | null = null) => {
  if (typeof value === "string" || typeof value === "number") return value;
  return fallback;
};

export function normalizeProductStatus(value: unknown): Seller2026ProductStatus {
  const status = text(value).toLowerCase();

  if (status.includes("revision")) return "needs_revision";
  if (status === "published" || status === "active") return "active";
  if (status === "submitted" || status === "pending" || status === "review_queue") return "submitted";
  if (status === "inactive" || status === "archived" || status === "disabled") return "inactive";
  return "draft";
}

const categoryLabel = (value: Record<string, unknown>) => {
  const category = object(value.category);
  const primary = object(category.primary);
  const defaultCategory = object(category.default);
  const categories = array(value.categories).map(object);
  return (
    text(value.categoryName) ||
    text(category.name) ||
    text(primary.name) ||
    text(defaultCategory.name) ||
    text(categories[0]?.name) ||
    "Uncategorized"
  );
};

const thumbnailUrl = (value: Record<string, unknown>) => {
  const media = object(value.media);
  const imageUrls = array(value.imageUrls).map((item) => text(item)).filter(Boolean);
  const mediaImageUrls = array(media.imageUrls).map((item) => text(item)).filter(Boolean);
  const images = array(value.images).map((item) => object(item));
  return (
    text(value.thumbnailUrl) ||
    text(value.thumbnail) ||
    text(value.image) ||
    text(value.mediaPreviewUrl) ||
    text(media.promoImageUrl) ||
    imageUrls[0] ||
    mediaImageUrls[0] ||
    text(images[0]?.url) ||
    null
  );
};

const productPrice = (product: Record<string, unknown>) => {
  const pricing = object(product.pricing);
  return number(
    pricing.effectivePrice ?? pricing.salePrice ?? pricing.price ?? product.price ?? product.salePrice,
    0
  );
};

const productStock = (product: Record<string, unknown>) => {
  const inventory = object(product.inventory);
  const availability = object(product.availability);
  return number(product.stock ?? product.quantity ?? inventory.stock ?? availability.stock, 0);
};

const productSubmissionStatus = (product: Record<string, unknown>) => {
  const submission = object(product.submission);
  const status = text(submission.status ?? product.submissionStatus ?? product.sellerSubmissionStatus);
  return status && status !== "none" ? status : undefined;
};

const productSubmissionState = (product: Record<string, unknown>) => {
  const submission = object(product.submission);
  const status = text(submission.status ?? product.submissionStatus ?? product.sellerSubmissionStatus).toLowerCase();
  return status || "none";
};

const productOperationalStatus = (product: Record<string, unknown>) => {
  const statusMeta = object(product.statusMeta);
  return product.status ?? statusMeta.code ?? statusMeta.label;
};

const productSubmitEligibility = (product: Record<string, unknown>) => {
  const submission = object(product.submission);
  const governance = object(product.governance);
  const submissionGovernance = object(governance.submissionGovernance);
  const status = normalizeProductStatus(productOperationalStatus(product));
  const submissionStatus = productSubmissionState(product);
  const canSubmitFromContract = Boolean(
    submission.canSubmit || submissionGovernance.canSubmitWhenEnabled
  );
  const canResubmitFromContract = Boolean(
    submission.canResubmit || submissionGovernance.canResubmitWhenEnabled
  );
  const action =
    submissionStatus === "needs_revision" ? "resubmit_review" : "submit_review";
  const canSubmitReview =
    (canSubmitFromContract || (status === "draft" && submissionStatus === "none")) &&
    submissionStatus !== "submitted" &&
    submissionStatus !== "review_queue";
  const canResubmitReview =
    canResubmitFromContract || (status === "draft" && submissionStatus === "needs_revision");
  const reason =
    text(submission.nextActionDescription) ||
    text(submissionGovernance.note) ||
    (submissionStatus === "submitted"
      ? "This product is already waiting for review."
      : status !== "draft"
        ? "Only draft products can be submitted for review."
        : null);

  return {
    canSubmitReview: action === "resubmit_review" ? canResubmitReview : canSubmitReview,
    submitReviewAction: action as "submit_review" | "resubmit_review",
    submitReviewReason: reason,
  };
};

export function adaptSellerProduct(value: unknown) {
  const product = object(value);
  const visibility = object(product.visibility);
  const id = idValue(product.id ?? product.productId ?? product.uuid, "") as string | number;
  const submit = productSubmitEligibility(product);
  const status = normalizeProductStatus(productSubmissionStatus(product) ?? productOperationalStatus(product));

  return {
    id,
    name: text(product.name || product.title, "Untitled product"),
    slug: text(product.slug) || undefined,
    sku: text(product.sku || product.code, "No SKU"),
    thumbnailUrl: thumbnailUrl(product),
    thumbnail: thumbnailUrl(product),
    category: categoryLabel(product),
    stock: productStock(product),
    price: productPrice(product),
    salePrice: number(product.salePrice, 0),
    currency: text(product.currency, "IDR"),
    sales: number(product.salesCount ?? product.soldCount ?? product.sold ?? product.sales, 0),
    views: number(product.viewCount ?? product.views, 0),
    status,
    visibility: text(
      product.storefrontVisibilityState ?? visibility.stateCode,
      "INTERNAL_ONLY"
    ).toLowerCase(),
    submissionStatus: productSubmissionState(product),
    approvalStatus: text(object(product.submission).status, "pending"),
    isPublished: Boolean(product.published ?? visibility.isPublished),
    isDraft: status === "draft",
    isArchived: status === "inactive",
    createdAt: text(product.createdAt, "Recently"),
    updatedAt: text(product.updatedAt || product.updated_at || product.lastUpdated) || "Recently",
    needsAttention: status === "needs_revision",
    revisionNotes: array(product.revisionNotes),
    canonicalDetailHref: `/seller/stores/:storeSlug/catalog/products/${id}`,
    canonicalEditHref: `/seller/stores/:storeSlug/catalog/products/${id}/edit`,
    ...submit,
  };
}

const adaptCategories = (authoringMeta: unknown) => {
  const references = object(object(authoringMeta).references);
  const categories = array(references.categories)
    .map((item) => {
      const category = object(item);
      const value = text(category.id ?? category.value ?? category.slug);
      const label = text(category.name ?? category.label);
      return value && label ? { value, label } : null;
    })
    .filter((item): item is { value: string; label: string } => Boolean(item));

  return [{ value: "all", label: "All Categories" }, ...categories];
};

export function adaptSeller2026Products(
  value: unknown,
  authoringMeta: unknown = null,
  query: Record<string, unknown> = {},
  permissions: ProductPermissions = {}
): Seller2026ProductsViewModel {
  const response = object(value);
  const data = object(response.data);
  const rawItems = Array.isArray(response.items)
    ? response.items
    : Array.isArray(data.items)
      ? data.items
      : [];
  const rawSummary = object(response.summary ?? data.summary);
  const governance = object(response.governance ?? data.governance);
  const rawPagination = object(response.pagination ?? data.pagination);
  const limit = number(rawPagination.limit ?? query.limit, EMPTY_PRODUCTS.pagination.limit);
  const total = number(rawPagination.total, rawItems.length);
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));

  return {
    summary: {
      total: number(rawSummary.total ?? rawSummary.totalProducts, total),
      draft: number(rawSummary.draft ?? rawSummary.drafts, 0),
      submitted: number(rawSummary.submitted ?? rawSummary.reviewQueue, 0),
      active: number(rawSummary.active, 0),
      storefrontVisible: number(rawSummary.storefrontVisible, 0),
      publishedBlocked: number(rawSummary.publishedBlocked, 0),
      internalOnly: number(rawSummary.internalOnly, 0),
      needsRevision: number(rawSummary.needsRevision ?? rawSummary.needs_revision, 0),
      inactive: number(rawSummary.inactive, 0),
      pendingReview: number(rawSummary.submitted ?? rawSummary.reviewQueue, 0),
      archived: number(rawSummary.inactive, 0),
      outOfStock: number(rawSummary.outOfStock ?? rawSummary.out_of_stock, 0),
    },
    filters: {
      categories: adaptCategories(authoringMeta),
      statuses: EMPTY_PRODUCTS.filters.statuses,
    },
    products: rawItems.map(adaptSellerProduct),
    pagination: {
      page: number(rawPagination.page ?? query.page, EMPTY_PRODUCTS.pagination.page),
      limit,
      total,
      totalPages,
    },
    permissions: {
      canCreate: Boolean(permissions.canCreate),
      canUpdate: Boolean(permissions.canUpdate),
      canDelete: Boolean(permissions.canDelete),
      canSubmit: Boolean(permissions.canSubmit),
      canPublish: Boolean(governance.canPublish ?? permissions.canPublish),
    },
  };
}

const tags = (value: unknown) => array(value).map((item) => text(item)).filter(Boolean);

const categoryIds = (product: Record<string, unknown>) => {
  const directIds = array(product.categoryIds)
    .map((entry) => idValue(entry))
    .filter((entry): entry is string | number => entry !== null);
  if (directIds.length) return directIds;

  const category = object(product.category);
  const assigned = array(category.assigned ?? product.categories).map(object);
  const fallbackCategories = [object(category.default), object(category.primary), ...assigned];
  return assigned
    .map((entry) => idValue(entry.id ?? entry.value))
    .concat(
      fallbackCategories
        .map((entry) => idValue(entry.id ?? entry.value))
        .filter((entry): entry is string | number => entry !== null)
    )
    .filter((entry, index, source) => source.indexOf(entry) === index)
    .filter((entry): entry is string | number => entry !== null);
};

const gallery = (product: Record<string, unknown>) => {
  const media = object(product.media);
  const imageUrls = array(product.imageUrls).map((item) => text(item)).filter(Boolean);
  const mediaImageUrls = array(media.imageUrls).map((item) => text(item)).filter(Boolean);
  const galleryItems = array(product.gallery).map((item) => text(item)).filter(Boolean);
  const images = array(product.images)
    .map((item) => text(item) || text(object(item).url))
    .filter(Boolean);
  const thumbnail = thumbnailUrl(product);
  return Array.from(new Set([thumbnail, ...imageUrls, ...mediaImageUrls, ...galleryItems, ...images].filter(Boolean))) as string[];
};

export function adaptSeller2026ProductDetail(value: unknown): Seller2026ProductDetailViewModel {
  const product = object(value);
  const submit = productSubmitEligibility(product);
  const performance = object(product.performance);
  const pricing = object(product.pricing);
  const descriptions = object(product.descriptions);
  const inventory = object(product.inventory);
  const attributes = object(product.attributes);
  const variants = array(product.variants).map((item, index) => {
    const variant = object(item);
    return {
      id: idValue(variant.id ?? index, index) as string | number,
      name: text(variant.name || variant.label, `Variant ${index + 1}`),
      sku: text(variant.sku, "-"),
      price: number(variant.price ?? variant.salePrice, 0),
      stock: number(variant.stock ?? variant.quantity, 0),
      sales: number(variant.sales ?? variant.soldCount, 0),
      status: text(variant.status, "active"),
    };
  });
  const submission = object(product.submission);
  const submissionNote = text(
    submission.reviewNote ?? submission.revisionNote ?? submission.revisionReason
  );
  const notes = array(product.revisionNotes ?? product.revisions ?? product.reviewNotes).map((item, index) => {
    const note = object(item);
    return {
      id: idValue(note.id ?? index, index) as string | number,
      author: text(note.author ?? note.actorName, "Reviewer"),
      message: text(note.message ?? note.note, "Revision note is not available."),
      createdAt: text(note.createdAt ?? note.updatedAt, ""),
      status: text(note.status) || undefined,
    };
  });
  const history = array(product.publishHistory ?? product.activity ?? product.timeline).map((item, index) => {
    const entry = object(item);
    return {
      id: idValue(entry.id ?? index, index) as string | number,
      label: text(entry.label ?? entry.action, "Product updated"),
      actor: text(entry.actor ?? entry.actorName, "System"),
      createdAt: text(entry.createdAt ?? entry.updatedAt, ""),
    };
  });
  const mappedNotes =
    notes.length || !submissionNote
      ? notes
      : [
          {
            id: "submission-note",
            author: "Reviewer",
            message: submissionNote,
            createdAt: text(submission.revisionRequestedAt ?? submission.submittedAt, ""),
            status: text(submission.status) || undefined,
          },
        ];
  const price = productPrice(product);
  const seo = object(product.seo);
  const sales = number(product.salesCount ?? product.soldCount ?? product.sold ?? performance.sales, 0);
  const productTags = tags(product.tags).length ? tags(product.tags) : tags(attributes.tags);
  const description = text(
    product.description ?? descriptions.description,
    "Product description is not available yet."
  );

  return {
    product: {
      id: idValue(product.id ?? product.productId, null),
      name: text(product.name || product.title, "Untitled product"),
      slug: text(product.slug) || undefined,
      sku: text(product.sku || product.code, "No SKU"),
      barcode: text(object(product.attributes).barcode ?? product.barcode),
      shortDescription: text(descriptions.short ?? product.shortDescription, ""),
      description,
      thumbnail: thumbnailUrl(product) || undefined,
      gallery: gallery(product),
      category: categoryLabel(product),
      brand: text(product.brand ?? object(product.brand).name) || undefined,
      tags: productTags,

      price,
      salePrice: number(pricing.salePrice ?? product.salePrice, 0),
      currency: text(pricing.currency ?? product.currency, "IDR"),
      discountLabel: text(pricing.discountLabel ?? product.discountLabel, ""),

      stock: productStock(product),
      stockStatus: text(inventory.status ?? product.stockStatus, "in_stock"),
      lowStockThreshold: number(inventory.lowStockThreshold ?? product.lowStockThreshold, 0),
      inventoryPolicy: text(inventory.policy ?? product.inventoryPolicy, "track"),

      status: normalizeProductStatus(productSubmissionStatus(product) ?? productOperationalStatus(product)),
      visibility: text(product.visibility, "public"),
      submissionStatus: productSubmissionState(product),
      approvalStatus: text(submission.approvalStatus ?? product.approvalStatus, "pending"),
      isPublished: Boolean(
        product.published ?? product.isPublished ?? object(product.visibility).isPublished
      ),
      isDraft: Boolean(product.isDraft ?? (normalizeProductStatus(productOperationalStatus(product)) === 'draft')),
      isArchived: Boolean(product.isArchived ?? (normalizeProductStatus(productOperationalStatus(product)) === 'inactive')),
      needsAttention: Boolean(product.needsAttention ?? false),
      lastSubmittedAt: text(submission.submittedAt ?? product.lastSubmittedAt, "Recently"),
      approvedAt: text(submission.approvedAt ?? product.approvedAt, ""),
      rejectedAt: text(submission.rejectedAt ?? product.rejectedAt, ""),
      createdAt: text(product.createdAt ?? "Recently"),
      updatedAt: text(product.updatedAt ?? "Recently"),
      createdBy: text(product.createdBy ?? "System"),
      updatedBy: text(product.updatedBy ?? "System"),

      canonicalListHref: `/seller/stores/${text(product.storeSlug, "storeSlug")}/catalog/products`,
      canonicalEditHref: `/seller/stores/${text(product.storeSlug, "storeSlug")}/catalog/products/${idValue(product.id ?? product.productId, "new")}/edit`,
      canonicalStorefrontHref: `/store/${text(product.storeSlug, "storeSlug")}/${text(product.slug, "")}`,
      canonicalCategoryHref: `/seller/stores/${text(product.storeSlug, "storeSlug")}/catalog/categories`,

      sold: sales,
      views: number(product.viewCount ?? product.views ?? performance.views, 0),
      ...submit,
    },
    editableDraft: {
      name: text(product.name || product.title),
      sku: text(product.sku || product.code),
      description: text(product.description ?? descriptions.description),
      categoryIds: categoryIds(product),
      tags: productTags,
      price,
      compareAtPrice: number(pricing.salePrice ?? product.salePrice ?? product.compareAtPrice, 0),
      stock: number(product.stock ?? product.quantity ?? inventory.stock, 0),
      seoTitle: text(seo.title ?? seo.seoTitle),
      seoDescription: text(seo.description ?? seo.seoDescription),
    },
    performance: {
      sales,
      revenue: number(performance.revenue ?? product.revenue, price * sales),
      views: number(performance.views ?? product.viewCount ?? product.views, 0),
      conversionRate: number(performance.conversionRate, 0),
    },
    variants,
    revisionNotes: mappedNotes,
    publishHistory: history,
  };
}

export function adaptSellerProductList(value: unknown) {
  const adapted = adaptSeller2026Products(value);
  return {
    items: adapted.products,
    pagination: adapted.pagination,
  };
}

export const emptySeller2026Products = EMPTY_PRODUCTS;
