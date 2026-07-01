import type { SellerCategory } from "../sellerCategories.ts";

export type Seller2026CategoryLifecycleStatus = "published" | "draft";
export type Seller2026CategoryVisibilityStatus = "visible" | "hidden";

export type Seller2026CategoryListItem = {
  id: string;
  numericId: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  iconKey: string;
  parentId: string | null;
  parentName: string | null;
  productsCount: number;
  isRoot: boolean;
  isPublished: boolean;
  visibilityStatus: Seller2026CategoryVisibilityStatus;
  lifecycleStatus: Seller2026CategoryLifecycleStatus;
  updatedAt: string;
  updatedBy: string;
  rawUpdatedAt: string | null;
  permissions: {
    canEdit: boolean;
    canPublish: boolean;
    canUnpublish: boolean;
    canArchive: boolean;
  };
};

export type Seller2026CategoriesSummary = {
  total: number;
  published: number;
  hidden: number;
  rootCategories: number;
};

export type Seller2026CategoryParentOption = {
  value: string;
  label: string;
};

export type Seller2026CategoryForm = {
  id?: string | null;
  name: string;
  description: string;
  parentId: string;
  imageUrl: string;
  slug: string;
  isPublished: boolean;
};

const text = (value: unknown, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const number = (value: unknown, fallback = 0) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const readItems = (value: unknown): unknown[] => {
  const response = object(value);
  const data = object(response.data);
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(value)) return value;
  return [];
};

export const slugifySeller2026Category = (value: unknown) =>
  text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const formatSeller2026CategoryDate = (value: unknown) => {
  const raw = text(value);
  if (!raw) return "Not available";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function adaptSeller2026CategoryList(
  value: unknown,
  permissions: {
    canEdit?: boolean;
    canPublish?: boolean;
    canUnpublish?: boolean;
    canArchive?: boolean;
  } = {}
): Seller2026CategoryListItem[] {
  return readItems(value)
    .map((entry, index) => {
      const category = object(entry) as Partial<SellerCategory> & Record<string, unknown>;
      const id = text(category.id ?? index + 1);
      const numericId = number(category.id, index + 1);
      const name = text(category.name, `Category ${index + 1}`);
      const slug = slugifySeller2026Category(category.code ?? category.slug ?? name);
      const parent = object(category.parent);
      const parentId = text(category.parentId ?? parent.id) || null;
      const parentName = text(parent.name) || null;
      const isPublished = Boolean(category.isPublished ?? category.published);
      const visibilityStatus: Seller2026CategoryVisibilityStatus = isPublished ? "visible" : "hidden";
      const lifecycleStatus: Seller2026CategoryLifecycleStatus = isPublished ? "published" : "draft";
      const productsCount = number(
        category.productsCount ?? category.productCount ?? category.product_count,
        0
      );
      const rawUpdatedAt = text(category.updatedAt) || text(category.createdAt) || null;
      return {
        id,
        numericId,
        name,
        slug,
        description: text(category.description, "No description"),
        imageUrl: text(category.image ?? category.icon),
        iconKey: slug || `category-${id}`,
        parentId,
        parentName,
        productsCount,
        isRoot: !parentId,
        isPublished,
        visibilityStatus,
        lifecycleStatus,
        updatedAt: formatSeller2026CategoryDate(rawUpdatedAt),
        updatedBy: "by Seller",
        rawUpdatedAt,
        permissions: {
          canEdit: Boolean(permissions.canEdit),
          canPublish: Boolean(permissions.canPublish),
          canUnpublish: Boolean(permissions.canUnpublish),
          canArchive: Boolean(permissions.canArchive),
        },
      };
    })
    .filter((item) => item.id && item.name);
}

export function summarizeSeller2026Categories(
  categories: Seller2026CategoryListItem[]
): Seller2026CategoriesSummary {
  return {
    total: categories.length,
    published: categories.filter((item) => item.isPublished).length,
    hidden: categories.filter((item) => !item.isPublished).length,
    rootCategories: categories.filter((item) => item.isRoot).length,
  };
}

export function buildSeller2026CategoryParentOptions(
  categories: Seller2026CategoryListItem[],
  editingId?: string | null
): Seller2026CategoryParentOption[] {
  const blocked = new Set<string>();
  const byParent = new Map<string, Seller2026CategoryListItem[]>();
  categories.forEach((category) => {
    if (!category.parentId) return;
    byParent.set(category.parentId, [...(byParent.get(category.parentId) || []), category]);
  });

  const visit = (id: string) => {
    blocked.add(id);
    (byParent.get(id) || []).forEach((child) => visit(child.id));
  };
  if (editingId) visit(String(editingId));

  return [
    { value: "", label: "No Parent (Root)" },
    ...categories
      .filter((category) => !blocked.has(category.id))
      .map((category) => ({ value: category.id, label: category.name })),
  ];
}

export function createSeller2026CategoryForm(
  category?: Seller2026CategoryListItem | null
): Seller2026CategoryForm {
  return {
    id: category?.id ?? null,
    name: text(category?.name),
    description: category?.description === "No description" ? "" : text(category?.description),
    parentId: category?.parentId ?? "",
    imageUrl: text(category?.imageUrl),
    slug: text(category?.slug),
    isPublished: category?.isPublished ?? true,
  };
}

export function validateSeller2026CategoryForm(form: Seller2026CategoryForm) {
  const errors: Record<string, string> = {};
  if (!text(form.name)) errors.name = "Category name is required.";
  if (text(form.description).length > 160) {
    errors.description = "Description must be 160 characters or less.";
  }
  return errors;
}

export function buildSeller2026CategoryPayload(form: Seller2026CategoryForm) {
  return {
    name: text(form.name),
    code: text(form.slug) || undefined,
    description: text(form.description) || undefined,
    parentId: Number(form.parentId || 0) || null,
    image: text(form.imageUrl) || null,
    isPublished: Boolean(form.isPublished),
  };
}

export const seller2026CategoryLabels = {
  visibility(value: Seller2026CategoryVisibilityStatus) {
    return value === "visible" ? "Visible" : "Hidden";
  },
  lifecycle(value: Seller2026CategoryLifecycleStatus) {
    return value === "published" ? "Published" : "Draft";
  },
  parent(category: Seller2026CategoryListItem) {
    return category.isRoot ? "Root category" : category.parentName || "Root category";
  },
};
