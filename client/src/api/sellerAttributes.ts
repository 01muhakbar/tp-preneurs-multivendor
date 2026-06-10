import { api } from "./axios.ts";

type SellerAttributeScope = "global" | "store";

export type SellerAttributesQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  optionType?: string;
  published?: "" | "true" | "false";
  scope?: "" | SellerAttributeScope;
  status?: "" | "active" | "archived";
};

export type SellerAttributePayload = {
  name: string;
  displayName: string;
  type: "dropdown" | "radio" | "checkbox";
  values: string[];
  published?: boolean;
};

export type SellerAttributeValuePayload = {
  value: string;
};

const toText = (value: unknown) => String(value ?? "").trim();
const asNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const normalizeAttributeType = (value: unknown): SellerAttributePayload["type"] => {
  const normalized = toText(value).toLowerCase();
  return ["dropdown", "radio", "checkbox"].includes(normalized)
    ? (normalized as SellerAttributePayload["type"])
    : "dropdown";
};

const normalizeAttributeValues = (value: unknown) =>
  Array.isArray(value) ? value.map((entry) => toText(entry)).filter(Boolean) : [];

const normalizeValueWritePayload = (payload: Partial<SellerAttributeValuePayload>) => ({
  value: toText(payload.value),
});

const normalizeWritePayload = (
  payload: Partial<SellerAttributePayload>,
  options: { requireName?: boolean; includeValues?: boolean; includePublished?: boolean } = {}
) => {
  const name = toText(payload.name);
  const displayName = toText(payload.displayName || payload.name);
  const nextPayload: Partial<SellerAttributePayload> = {};

  if (name || options.requireName) nextPayload.name = name;
  if (displayName || options.requireName) nextPayload.displayName = displayName || name;
  if (payload.type) nextPayload.type = normalizeAttributeType(payload.type);
  const hasValues = Object.prototype.hasOwnProperty.call(payload, "values");
  if (options.includeValues || hasValues) {
    const values = normalizeAttributeValues(payload.values);
    nextPayload.values = values.length ? values : options.requireName ? ["Default"] : [];
  }
  const hasPublished = Object.prototype.hasOwnProperty.call(payload, "published");
  if (options.includePublished || hasPublished) {
    nextPayload.published = Boolean(payload.published);
  }

  return nextPayload;
};

const normalizeSellerAttribute = (item: unknown) => {
  const record = isRecord(item) ? item : {};
  const scope = toText(record.scope).toLowerCase() === "store" ? "store" : "global";
  return {
    id: asNumber(record.id, 0),
    name: toText(record.name) || "-",
    displayName: toText(record.displayName) || "",
    type: normalizeAttributeType(record.type),
    published: Boolean(record.published),
    scope,
    status: toText(record.status).toLowerCase() === "archived" ? "archived" : "active",
    storeId: asNumber(record.storeId, 0) || null,
    storeName: toText(record.storeName) || "",
    storeSlug: toText(record.storeSlug) || "",
    createdByRole: toText(record.createdByRole).toLowerCase() === "seller" ? "seller" : "admin",
    createdByUserId: asNumber(record.createdByUserId, 0) || null,
    managedByAdmin: Boolean(record.managedByAdmin ?? scope !== "store"),
    editable: Boolean(record.editable ?? scope === "store"),
    isUsed: Boolean(record.isUsed),
    usageCount: asNumber(record.usageCount, 0),
    valueCount: asNumber(record.valueCount, 0),
    values: normalizeAttributeValues(record.values),
    createdAt: toText(record.createdAt) || null,
    updatedAt: toText(record.updatedAt) || null,
  };
};

const normalizeSellerAttributeValue = (item: unknown) => {
  const record = isRecord(item) ? item : {};
  return {
    id: asNumber(record.id, 0),
    attributeId: asNumber(record.attributeId, 0),
    value: toText(record.value) || "-",
    status: toText(record.status).toLowerCase() === "archived" ? "archived" : "active",
    isUsed: Boolean(record.isUsed),
    usageCount: asNumber(record.usageCount, 0),
  };
};

export const getSellerAttributes = async (
  storeId: number | string,
  query: SellerAttributesQuery = {}
) => {
  const { data } = await api.get(`/seller/stores/${storeId}/attributes`, {
    params: {
      page: query.page,
      limit: query.limit,
      keyword: query.keyword || undefined,
      optionType: query.optionType || undefined,
      published: query.published || undefined,
      scope: query.scope || undefined,
      status: query.status || undefined,
    },
  });

  return {
    ...data,
    data: Array.isArray(data?.data) ? data.data.map(normalizeSellerAttribute) : [],
    meta: {
      page: asNumber(data?.meta?.page, asNumber(query.page, 1)),
      limit: asNumber(data?.meta?.limit, asNumber(query.limit, 20)),
      total: asNumber(data?.meta?.total, 0),
      totalPages: asNumber(data?.meta?.totalPages, 1),
    },
  };
};

export const createSellerAttribute = async (
  storeId: number | string,
  payload: SellerAttributePayload
) => {
  const { data } = await api.post(
    `/seller/stores/${storeId}/attributes`,
    normalizeWritePayload(payload, { requireName: true, includeValues: true, includePublished: true })
  );
  return {
    ...data,
    data: data?.data ? normalizeSellerAttribute(data.data) : null,
  };
};

export const updateSellerAttribute = async (
  storeId: number | string,
  attributeId: number | string,
  payload: Partial<SellerAttributePayload>
) => {
  const { data } = await api.patch(
    `/seller/stores/${storeId}/attributes/${attributeId}`,
    normalizeWritePayload(payload)
  );
  return {
    ...data,
    data: data?.data ? normalizeSellerAttribute(data.data) : null,
  };
};

export const setSellerAttributePublished = async (
  storeId: number | string,
  attributeId: number | string,
  published: boolean
) => {
  const { data } = await api.patch(
    `/seller/stores/${storeId}/attributes/${attributeId}/published`,
    { published: Boolean(published) }
  );
  return {
    ...data,
    data: data?.data ? normalizeSellerAttribute(data.data) : null,
  };
};

export const deleteSellerAttribute = async (
  storeId: number | string,
  attributeId: number | string
) => {
  const { data } = await api.delete(`/seller/stores/${storeId}/attributes/${attributeId}`);
  return data;
};

export const bulkSellerAttributes = async (
  storeId: number | string,
  action: "delete" | "publish" | "unpublish",
  ids: number[]
) => {
  const { data } = await api.post(`/seller/stores/${storeId}/attributes/bulk`, {
    action,
    ids,
  });
  return data;
};

export const exportSellerAttributes = async (
  storeId: number | string,
  options: {
    format?: "csv" | "json";
    filters?: SellerAttributesQuery;
  } = {}
) => {
  const format =
    String(options.format || "csv").trim().toLowerCase() === "json" ? "json" : "csv";
  const params = new URLSearchParams();
  params.set("format", format);
  [
    ["keyword", toText(options.filters?.keyword)],
    ["optionType", toText(options.filters?.optionType)],
    ["published", toText(options.filters?.published)],
    ["scope", toText(options.filters?.scope)],
    ["status", toText(options.filters?.status)],
  ].forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const response = await fetch(
    `/api/seller/stores/${encodeURIComponent(String(storeId))}/attributes/export?${params.toString()}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    const fallback = `Failed to export seller attributes (${response.status}).`;
    try {
      const payload = await response.json();
      throw new Error(payload?.message || fallback);
    } catch {
      throw new Error(fallback);
    }
  }

  return response;
};

export const importSellerAttributes = async (
  storeId: number | string,
  file: File
) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/seller/stores/${storeId}/attributes/import`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const getSellerAttributeValues = async (
  storeId: number | string,
  attributeId: number | string
) => {
  const { data } = await api.get(`/seller/stores/${storeId}/attributes/${attributeId}/values`);
  return {
    ...data,
    attribute: data?.attribute ? normalizeSellerAttribute(data.attribute) : null,
    data: Array.isArray(data?.data) ? data.data.map(normalizeSellerAttributeValue) : [],
  };
};

export const createSellerAttributeValue = async (
  storeId: number | string,
  attributeId: number | string,
  payload: SellerAttributeValuePayload
) => {
  const { data } = await api.post(
    `/seller/stores/${storeId}/attributes/${attributeId}/values`,
    normalizeValueWritePayload(payload)
  );
  return {
    ...data,
    data: data?.data ? normalizeSellerAttributeValue(data.data) : null,
  };
};

export const updateSellerAttributeValue = async (
  storeId: number | string,
  valueId: number | string,
  payload: SellerAttributeValuePayload
) => {
  const { data } = await api.patch(
    `/seller/stores/${storeId}/attributes/values/${valueId}`,
    normalizeValueWritePayload(payload)
  );
  return {
    ...data,
    data: data?.data ? normalizeSellerAttributeValue(data.data) : null,
  };
};

export const deleteSellerAttributeValue = async (
  storeId: number | string,
  valueId: number | string
) => {
  const { data } = await api.delete(`/seller/stores/${storeId}/attributes/values/${valueId}`);
  return data;
};
