import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSellerAttribute,
  getSellerAttributes,
  setSellerAttributePublished,
  updateSellerAttribute,
} from "../../api/sellerAttributes.ts";
import {
  adaptSeller2026Attributes,
  buildSeller2026AttributePayload,
  emptySeller2026Attributes,
  summarizeSeller2026Attributes,
  type Seller2026AttributeForm,
} from "../../api/seller2026/attributes.adapter.ts";

export type Seller2026AttributesQuery = {
  search?: string;
  type?: string;
  status?: string;
  usage?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026AttributesOptions = {
  enabled?: boolean;
  permissions?: {
    canEdit?: boolean;
    canManageValues?: boolean;
    canPublish?: boolean;
    canUnpublish?: boolean;
    canArchive?: boolean;
  };
};

const normalizeFilter = (value: unknown, fallback = "all") =>
  String(value || fallback).trim().toLowerCase() || fallback;

const clampPage = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

export function useSeller2026Attributes(
  storeId: number | string | null | undefined,
  query: Seller2026AttributesQuery = {},
  options: UseSeller2026AttributesOptions = {}
) {
  const enabled = Boolean(storeId) && options.enabled !== false;
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filters = useMemo(
    () => ({
      search: String(query.search || "").trim(),
      type: normalizeFilter(query.type),
      status: normalizeFilter(query.status),
      usage: normalizeFilter(query.usage),
      page: clampPage(query.page),
      limit: Math.max(1, Math.min(50, Number(query.limit || 10) || 10)),
    }),
    [query.limit, query.page, query.search, query.status, query.type, query.usage]
  );

  const queryKey = ["seller2026", "attributes", storeId];
  const attributesQuery = useQuery({
    queryKey,
    queryFn: () => getSellerAttributes(storeId as number | string, { page: 1, limit: 100 }),
    enabled,
    retry: false,
  });

  const adapted = useMemo(() => {
    if (!enabled || !attributesQuery.data) return emptySeller2026Attributes;
    return adaptSeller2026Attributes(attributesQuery.data, options.permissions);
  }, [attributesQuery.data, enabled, options.permissions]);

  const filteredAttributes = useMemo(() => {
    let result = adapted.attributes;
    const search = filters.search.toLowerCase();

    if (search) {
      result = result.filter((attribute) =>
        [attribute.name, attribute.displayName, attribute.optionType]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }
    if (filters.type !== "all") {
      result = result.filter((attribute) => attribute.optionType === filters.type);
    }
    if (filters.status !== "all") {
      if (filters.status === "published") result = result.filter((attribute) => attribute.isPublished);
      if (filters.status === "draft") result = result.filter((attribute) => !attribute.isPublished);
      if (filters.status === "active") result = result.filter((attribute) => attribute.status !== "inactive");
      if (filters.status === "inactive") result = result.filter((attribute) => attribute.status === "inactive");
    }
    if (filters.usage !== "all") {
      if (filters.usage === "in_use") result = result.filter((attribute) => attribute.usageStatus === "in_use");
      if (filters.usage === "unused") result = result.filter((attribute) => attribute.usageStatus === "unused");
      if (filters.usage === "with_values") result = result.filter((attribute) => attribute.valuesCount > 0);
      if (filters.usage === "no_values") result = result.filter((attribute) => attribute.valuesCount === 0);
    }

    return result;
  }, [adapted.attributes, filters.search, filters.status, filters.type, filters.usage]);

  const filteredSummary = useMemo(
    () => summarizeSeller2026Attributes(filteredAttributes),
    [filteredAttributes]
  );
  const totalPages = Math.max(1, Math.ceil(filteredAttributes.length / filters.limit));
  const page = Math.min(filters.page, totalPages);
  const pageStart = (page - 1) * filters.limit;
  const attributes = filteredAttributes.slice(pageStart, pageStart + filters.limit);

  const invalidateAttributes = () =>
    queryClient.invalidateQueries({ queryKey: ["seller2026", "attributes", storeId] });

  const createMutation = useMutation({
    mutationFn: (form: Seller2026AttributeForm) =>
      createSellerAttribute(storeId as number | string, buildSeller2026AttributePayload(form)),
    meta: { suppressGlobalToast: true },
    onSuccess: invalidateAttributes,
  });

  const updateMutation = useMutation({
    mutationFn: ({ attributeId, payload }: { attributeId: string; payload: Seller2026AttributeForm }) =>
      updateSellerAttribute(storeId as number | string, attributeId, buildSeller2026AttributePayload(payload)),
    meta: { suppressGlobalToast: true },
    onSuccess: invalidateAttributes,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ attributeId, published }: { attributeId: string; published: boolean }) =>
      setSellerAttributePublished(storeId as number | string, attributeId, published),
    meta: { suppressGlobalToast: true },
    onSuccess: invalidateAttributes,
  });

  return {
    attributes,
    allAttributes: adapted.attributes,
    filteredAttributes,
    summary: adapted.summary,
    filteredSummary,
    filters,
    selectedIds,
    setSelectedIds,
    pagination: {
      page,
      limit: filters.limit,
      total: filteredAttributes.length,
      totalPages,
      start: filteredAttributes.length ? pageStart + 1 : 0,
      end: Math.min(pageStart + filters.limit, filteredAttributes.length),
    },
    isLoading: attributesQuery.isLoading,
    isError: attributesQuery.isError,
    error: attributesQuery.error,
    refetch: attributesQuery.refetch,
    createAttribute: createMutation.mutateAsync,
    updateAttribute: updateMutation.mutateAsync,
    updateAttributeStatus: updateStatusMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending || updateStatusMutation.isPending,
  };
}
