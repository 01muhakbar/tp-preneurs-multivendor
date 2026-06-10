import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSellerAttributeValue,
  getSellerAttributeValues,
  updateSellerAttributeValue,
} from "../../api/sellerAttributes.ts";
import {
  adaptSeller2026AttributeValues,
  buildSeller2026AttributeValuePayload,
  emptySeller2026AttributeValues,
  type Seller2026AttributeValueForm,
} from "../../api/seller2026/attributeValues.adapter.ts";

export type Seller2026AttributeValuesQuery = {
  search?: string;
  status?: string;
  usage?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026AttributeValuesOptions = {
  enabled?: boolean;
  permissions?: {
    canEdit?: boolean;
    canActivate?: boolean;
    canDeactivate?: boolean;
    canArchive?: boolean;
  };
};

const normalizeFilter = (value: unknown, fallback = "all") =>
  String(value || fallback).trim().toLowerCase() || fallback;

const clampPage = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

export function useSeller2026AttributeValues(
  storeId: number | string | null | undefined,
  attributeId: number | string | null | undefined,
  query: Seller2026AttributeValuesQuery = {},
  options: UseSeller2026AttributeValuesOptions = {}
) {
  const enabled = Boolean(storeId) && Boolean(attributeId) && options.enabled !== false;
  const queryClient = useQueryClient();
  const filters = useMemo(
    () => ({
      search: String(query.search || "").trim(),
      status: normalizeFilter(query.status),
      usage: normalizeFilter(query.usage),
      page: clampPage(query.page),
      limit: Math.max(1, Math.min(50, Number(query.limit || 10) || 10)),
    }),
    [query.limit, query.page, query.search, query.status, query.usage]
  );

  const valuesQuery = useQuery({
    queryKey: ["seller2026", "attribute-values", storeId, attributeId],
    queryFn: () => getSellerAttributeValues(storeId as number | string, attributeId as number | string),
    enabled,
    retry: false,
  });

  const adapted = useMemo(() => {
    if (!enabled || !valuesQuery.data) return emptySeller2026AttributeValues;
    return adaptSeller2026AttributeValues(valuesQuery.data, options.permissions);
  }, [enabled, options.permissions, valuesQuery.data]);

  const filteredValues = useMemo(() => {
    let result = adapted.values;
    const search = filters.search.toLowerCase();
    if (search) {
      result = result.filter((item) =>
        [item.value, item.label, item.optionType].join(" ").toLowerCase().includes(search)
      );
    }
    if (filters.status !== "all") {
      if (filters.status === "active" || filters.status === "visible") {
        result = result.filter((item) => item.isActive);
      }
      if (filters.status === "inactive" || filters.status === "hidden") {
        result = result.filter((item) => !item.isActive);
      }
    }
    if (filters.usage !== "all") {
      if (filters.usage === "in_use") result = result.filter((item) => item.usageCount > 0);
      if (filters.usage === "unused") result = result.filter((item) => item.usageCount === 0);
    }
    return result;
  }, [adapted.values, filters.search, filters.status, filters.usage]);

  const totalPages = Math.max(1, Math.ceil(filteredValues.length / filters.limit));
  const page = Math.min(filters.page, totalPages);
  const pageStart = (page - 1) * filters.limit;
  const values = filteredValues.slice(pageStart, pageStart + filters.limit);
  const invalidateValues = () =>
    queryClient.invalidateQueries({ queryKey: ["seller2026", "attribute-values", storeId, attributeId] });

  const createMutation = useMutation({
    mutationFn: (form: Seller2026AttributeValueForm) =>
      createSellerAttributeValue(
        storeId as number | string,
        attributeId as number | string,
        buildSeller2026AttributeValuePayload(form)
      ),
    meta: { suppressGlobalToast: true },
    onSuccess: invalidateValues,
  });

  const updateMutation = useMutation({
    mutationFn: ({ valueId, payload }: { valueId: string; payload: Seller2026AttributeValueForm }) =>
      updateSellerAttributeValue(
        storeId as number | string,
        valueId,
        buildSeller2026AttributeValuePayload(payload)
      ),
    meta: { suppressGlobalToast: true },
    onSuccess: invalidateValues,
  });

  return {
    attribute: adapted.attribute,
    values,
    allValues: adapted.values,
    filteredValues,
    summary: adapted.summary,
    filters,
    pagination: {
      page,
      limit: filters.limit,
      total: filteredValues.length,
      totalPages,
      start: filteredValues.length ? pageStart + 1 : 0,
      end: Math.min(pageStart + filters.limit, filteredValues.length),
    },
    isLoading: valuesQuery.isLoading,
    isError: valuesQuery.isError,
    error: valuesQuery.error,
    refetch: valuesQuery.refetch,
    createValue: createMutation.mutateAsync,
    updateValue: updateMutation.mutateAsync,
    updateValueStatus: async () => {
      throw new Error("Value status changes are not available yet.");
    },
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
