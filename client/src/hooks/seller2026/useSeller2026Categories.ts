import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerCategories } from "../../api/sellerCategories.ts";
import {
  adaptSeller2026Categories,
  emptySeller2026Categories,
} from "../../api/seller2026/catalog.adapter.ts";

export type Seller2026CategoriesQuery = {
  search?: string;
};

type UseSeller2026CategoriesOptions = {
  enabled?: boolean;
};

export function useSeller2026Categories(
  storeId: number | string | null | undefined,
  query: Seller2026CategoriesQuery = {},
  options: UseSeller2026CategoriesOptions = {}
) {
  const enabled = Boolean(storeId) && options.enabled !== false;
  const listQuery = useQuery({
    queryKey: ["seller2026", "categories", storeId, query],
    queryFn: () =>
      getSellerCategories(storeId as number | string, {
        q: query.search || undefined,
        page: 1,
        limit: 100,
      }),
    enabled,
    retry: false,
  });

  const data = useMemo(
    () => (enabled || listQuery.data ? adaptSeller2026Categories(listQuery.data) : emptySeller2026Categories),
    [enabled, listQuery.data]
  );

  return {
    data,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
  };
}
