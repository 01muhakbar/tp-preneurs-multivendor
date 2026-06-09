import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerAttributes } from "../../api/sellerAttributes.ts";
import {
  adaptSeller2026Attributes,
  emptySeller2026Attributes,
} from "../../api/seller2026/catalog.adapter.ts";

export type Seller2026AttributesQuery = {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026AttributesOptions = {
  enabled?: boolean;
};

export function useSeller2026Attributes(
  storeId: number | string | null | undefined,
  query: Seller2026AttributesQuery = {},
  options: UseSeller2026AttributesOptions = {}
) {
  const enabled = Boolean(storeId) && options.enabled !== false;
  const attributesQuery = useQuery({
    queryKey: ["seller2026", "attributes", storeId, query],
    queryFn: () =>
      getSellerAttributes(storeId as number | string, {
        page: Number(query.page || 1),
        limit: Number(query.limit || 20),
        keyword: query.search || undefined,
        optionType: ["dropdown", "radio", "checkbox"].includes(String(query.type || ""))
          ? String(query.type)
          : "",
        status: query.status === "inactive" ? "archived" : query.status === "active" ? "active" : "",
      }),
    enabled,
    retry: false,
  });

  const data = useMemo(
    () =>
      enabled || attributesQuery.data
        ? adaptSeller2026Attributes(attributesQuery.data)
        : emptySeller2026Attributes,
    [attributesQuery.data, enabled]
  );

  return {
    data,
    isLoading: attributesQuery.isLoading,
    isError: attributesQuery.isError,
    error: attributesQuery.error,
    refetch: attributesQuery.refetch,
  };
}
