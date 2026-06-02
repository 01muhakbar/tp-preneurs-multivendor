import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerAttributeValues } from "../../api/sellerAttributes.ts";
import {
  adaptSeller2026AttributeValues,
  emptySeller2026AttributeValues,
} from "../../api/seller2026/catalog.adapter.ts";

export type Seller2026AttributeValuesQuery = {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026AttributeValuesOptions = {
  enabled?: boolean;
};

export function useSeller2026AttributeValues(
  storeId: number | string | null | undefined,
  attributeId: number | string | null | undefined,
  query: Seller2026AttributeValuesQuery = {},
  options: UseSeller2026AttributeValuesOptions = {}
) {
  const enabled = Boolean(storeId) && Boolean(attributeId) && options.enabled !== false;
  const valuesQuery = useQuery({
    queryKey: ["seller2026", "attribute-values", storeId, attributeId],
    queryFn: () =>
      getSellerAttributeValues(
        storeId as number | string,
        attributeId as number | string
      ),
    enabled,
    retry: false,
  });

  const data = useMemo(() => {
    const adapted =
      enabled || valuesQuery.data
        ? adaptSeller2026AttributeValues(valuesQuery.data)
        : emptySeller2026AttributeValues;
    const search = String(query.search || "").trim().toLowerCase();
    const status = String(query.status || "all");
    const values = adapted.values.filter((item) => {
      const matchesSearch = search ? item.label.toLowerCase().includes(search) : true;
      const matchesStatus = status === "all" ? true : item.status === status;
      return matchesSearch && matchesStatus;
    });

    return { ...adapted, values };
  }, [enabled, query.search, query.status, valuesQuery.data]);

  return {
    data,
    isLoading: valuesQuery.isLoading,
    isError: valuesQuery.isError,
    error: valuesQuery.error,
    refetch: valuesQuery.refetch,
  };
}
