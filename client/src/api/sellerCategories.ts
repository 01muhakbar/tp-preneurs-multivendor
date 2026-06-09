import { api } from "./axios.ts";

export type SellerCategory = {
  id: number;
  code?: string | null;
  name: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  parentId?: number | null;
  parent?: {
    id: number;
    name: string;
    code?: string | null;
  } | null;
  isPublished: boolean;
  published?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type SellerCategoryListParams = {
  q?: string;
  published?: "" | "true" | "false";
  page?: number;
  limit?: number;
};

type SellerCategoryWritePayload = {
  name: string;
  description?: string;
  parentId?: number | null;
  image?: string | null;
  isPublished?: boolean;
  published?: boolean;
};

const toPayloadText = (value: unknown) => String(value ?? "").trim();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const normalizeCategoryWritePayload = (
  payload: Partial<SellerCategoryWritePayload>,
  options: { includePublish?: boolean; includeImage?: boolean; requireName?: boolean } = {},
): Partial<SellerCategoryWritePayload> => {
  const name = toPayloadText(payload.name);
  const description = toPayloadText(payload.description);
  const parentId = Number(payload.parentId || 0) || null;
  const nextPayload: Partial<SellerCategoryWritePayload> = { parentId };

  if (name || options.requireName) nextPayload.name = name;
  if (description) nextPayload.description = description;
  if (options.includeImage) {
    const image = toPayloadText(payload.image);
    if (image) nextPayload.image = image;
  }
  if (options.includePublish) {
    nextPayload.isPublished = Boolean(payload.isPublished ?? payload.published);
  }

  return nextPayload;
};

const normalizeCategory = (item: unknown): SellerCategory | null => {
  if (!isRecord(item)) return null;
  const id = Number(item.id || 0);
  if (!Number.isInteger(id) || id <= 0) return null;
  const parent = isRecord(item.parent) ? item.parent : null;
  return {
    id,
    code: String(item.code || "").trim() || null,
    name: String(item.name || "").trim() || `Category #${id}`,
    description: String(item.description || "").trim() || null,
    image: String(item.image || item.icon || "").trim() || null,
    icon: String(item.icon || item.image || "").trim() || null,
    parentId: Number(item.parentId ?? item.parent_id ?? 0) || null,
    parent:
      parent
        ? {
            id: Number(parent.id || 0) || 0,
            name: String(parent.name || "").trim() || "-",
            code: String(parent.code || "").trim() || null,
          }
        : null,
    isPublished: Boolean(item.isPublished ?? item.published),
    published: Boolean(item.isPublished ?? item.published),
    createdAt: String(item.createdAt || "").trim() || null,
    updatedAt: String(item.updatedAt || "").trim() || null,
  };
};

const normalizeCategoryListResponse = (payload: unknown) => {
  const payloadRoot = isRecord(payload) ? payload : {};
  const dataRoot = isRecord(payloadRoot.data) ? payloadRoot.data : payloadRoot;
  const items = Array.isArray(dataRoot.items)
    ? dataRoot.items
    : Array.isArray(payloadRoot.items)
      ? payloadRoot.items
      : Array.isArray(payloadRoot.data)
        ? payloadRoot.data
        : Array.isArray(payload)
          ? payload
          : [];

  const metaRoot = isRecord(dataRoot.meta)
    ? dataRoot.meta
    : isRecord(payloadRoot.meta)
      ? payloadRoot.meta
      : {};
  return {
    data: items.map(normalizeCategory).filter(Boolean) as SellerCategory[],
    meta: {
      page: Number(metaRoot.page || 1) || 1,
      limit: Number(metaRoot.limit || 10) || 10,
      total: Number(metaRoot.total || items.length) || 0,
      totalPages: Number(metaRoot.totalPages || 1) || 1,
    },
  };
};

const normalizeCategoryDetailResponse = (payload: unknown) => {
  const payloadRoot = isRecord(payload) ? payload : {};
  const item = isRecord(payloadRoot.data) && !Array.isArray(payloadRoot.data) ? payloadRoot.data : payload;
  return {
    data: normalizeCategory(item),
  };
};

export const getSellerCategories = async (
  storeId: number | string,
  params: SellerCategoryListParams = {},
) => {
  const { data } = await api.get(`/seller/stores/${storeId}/categories`, { params });
  return normalizeCategoryListResponse(data);
};

export const createSellerCategory = async (
  storeId: number | string,
  payload: SellerCategoryWritePayload,
) => {
  const { data } = await api.post(
    `/seller/stores/${storeId}/categories`,
    normalizeCategoryWritePayload(payload, { includePublish: true, includeImage: true, requireName: true }),
  );
  return normalizeCategoryDetailResponse(data);
};

export const updateSellerCategory = async (
  storeId: number | string,
  categoryId: number | string,
  payload: Partial<SellerCategoryWritePayload>,
) => {
  const { data } = await api.put(
    `/seller/stores/${storeId}/categories/${categoryId}`,
    normalizeCategoryWritePayload(payload, { includeImage: true }),
  );
  return normalizeCategoryDetailResponse(data);
};

export const setSellerCategoryPublished = async (
  storeId: number | string,
  categoryId: number | string,
  isPublished: boolean,
) => {
  const { data } = await api.patch(
    `/seller/stores/${storeId}/categories/${categoryId}/publish`,
    { isPublished },
  );
  return normalizeCategoryDetailResponse(data);
};

export const uploadSellerCategoryImage = async (file: File) => {
  const form = new FormData();
  form.append("image", file);
  const { data } = await api.post<{ data?: { url?: string } }>("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
