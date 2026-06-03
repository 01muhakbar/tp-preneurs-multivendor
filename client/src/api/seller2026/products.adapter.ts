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
    needsRevision: number;
    inactive: number;
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
    thumbnailUrl: string | null;
    category: string;
    stock: number;
    price: number;
    sales: number;
    views: number;
    status: Seller2026ProductStatus;
    updatedAt: string | null;
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
  };
};

export type Seller2026ProductDetailViewModel = {
  product: {
    id: string | number | null;
    name: string;
    slug?: string;
    sku: string;
    status: Seller2026ProductStatus;
    price: number;
    stock: number;
    sold: number;
    views: number;
    description: string;
    category: string;
    brand?: string;
    tags: string[];
    gallery: string[];
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
    needsRevision: 0,
    inactive: 0,
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
  const categories = array(value.categories).map(object);
  return (
    text(value.categoryName) ||
    text(category.name) ||
    text(categories[0]?.name) ||
    "Uncategorized"
  );
};

const thumbnailUrl = (value: Record<string, unknown>) => {
  const imageUrls = array(value.imageUrls).map((item) => text(item)).filter(Boolean);
  const images = array(value.images).map((item) => object(item));
  return (
    text(value.thumbnailUrl) ||
    text(value.thumbnail) ||
    text(value.image) ||
    imageUrls[0] ||
    text(images[0]?.url) ||
    null
  );
};

export function adaptSellerProduct(value: unknown) {
  const product = object(value);
  const inventory = object(product.inventory);
  const id = idValue(product.id ?? product.productId ?? product.uuid, "") as string | number;

  return {
    id,
    name: text(product.name || product.title, "Untitled product"),
    slug: text(product.slug) || undefined,
    sku: text(product.sku || product.code, "-"),
    thumbnailUrl: thumbnailUrl(product),
    category: categoryLabel(product),
    stock: number(product.stock ?? product.quantity ?? inventory.stock, 0),
    price: number(product.price ?? product.salePrice ?? product.regularPrice, 0),
    sales: number(product.salesCount ?? product.soldCount ?? product.sold ?? product.sales, 0),
    views: number(product.viewCount ?? product.views, 0),
    status: normalizeProductStatus(product.status ?? product.submissionStatus),
    updatedAt: text(product.updatedAt || product.updated_at || product.lastUpdated) || null,
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
      needsRevision: number(rawSummary.needsRevision ?? rawSummary.needs_revision, 0),
      inactive: number(rawSummary.inactive, 0),
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
  return assigned
    .map((entry) => idValue(entry.id ?? entry.value))
    .filter((entry): entry is string | number => entry !== null);
};

const gallery = (product: Record<string, unknown>) => {
  const imageUrls = array(product.imageUrls).map((item) => text(item)).filter(Boolean);
  const galleryItems = array(product.gallery).map((item) => text(item)).filter(Boolean);
  const images = array(product.images)
    .map((item) => text(item) || text(object(item).url))
    .filter(Boolean);
  const thumbnail = thumbnailUrl(product);
  return Array.from(new Set([thumbnail, ...imageUrls, ...galleryItems, ...images].filter(Boolean))) as string[];
};

export function adaptSeller2026ProductDetail(value: unknown): Seller2026ProductDetailViewModel {
  const product = object(value);
  const performance = object(product.performance);
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
  const price = number(product.price ?? product.salePrice, 0);
  const seo = object(product.seo);
  const sales = number(product.salesCount ?? product.soldCount ?? product.sold ?? performance.sales, 0);
  const productTags = tags(product.tags);

  return {
    product: {
      id: idValue(product.id ?? product.productId, null),
      name: text(product.name || product.title, "Untitled product"),
      slug: text(product.slug) || undefined,
      sku: text(product.sku || product.code, "-"),
      status: normalizeProductStatus(product.status ?? product.submissionStatus),
      price,
      stock: number(product.stock ?? product.quantity, 0),
      sold: sales,
      views: number(product.viewCount ?? product.views ?? performance.views, 0),
      description: text(product.description, "Product description is not available yet."),
      category: categoryLabel(product),
      brand: text(product.brand ?? object(product.brand).name) || undefined,
      tags: productTags,
      gallery: gallery(product),
    },
    editableDraft: {
      name: text(product.name || product.title),
      sku: text(product.sku || product.code),
      description: text(product.description),
      categoryIds: categoryIds(product),
      tags: productTags,
      price,
      compareAtPrice: number(product.salePrice ?? product.compareAtPrice, 0),
      stock: number(product.stock ?? product.quantity, 0),
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
    revisionNotes: notes,
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
