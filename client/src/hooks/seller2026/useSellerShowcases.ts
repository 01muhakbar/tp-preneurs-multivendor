import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSellerShowcases,
  createSellerShowcase,
  updateSellerShowcase,
  deleteSellerShowcase,
  toggleSellerShowcaseActive,
  type SellerShowcase,
  type SellerShowcaseWritePayload,
} from "../../api/sellerShowcases.ts";
import { getSellerProducts } from "../../api/sellerProducts.ts";

export type ShowcaseFilter = {
  search: string;
  status: "all" | "active" | "inactive";
};

export function useSellerShowcases(storeId: number | string | null | undefined) {
  const queryClient = useQueryClient();
  const enabled = Boolean(storeId);
  const [filters, setFilters] = useState<ShowcaseFilter>({ search: "", status: "all" });

  const showcasesQuery = useQuery({
    queryKey: ["seller2026", "showcases", storeId],
    queryFn: async () => {
      const res = await getSellerShowcases(storeId as number | string, { limit: 100 });
      return Array.isArray(res?.data?.items) ? (res.data.items as SellerShowcase[]) : [];
    },
    enabled,
    staleTime: 30_000,
  });

  const storeProductsQuery = useQuery({
    queryKey: ["seller2026", "store-products-for-showcases", storeId],
    queryFn: async () => {
      const res = await getSellerProducts(storeId as number | string, { limit: 100 });
      const items = res?.data?.items || res?.items || [];
      return Array.isArray(items) ? items : [];
    },
    enabled,
    staleTime: 60_000,
  });

  const allShowcases = showcasesQuery.data || [];

  const filteredShowcases = useMemo(() => {
    return allShowcases.filter((sc) => {
      if (filters.search) {
        const needle = filters.search.toLowerCase().trim();
        const matchesName = sc.name.toLowerCase().includes(needle);
        const matchesDesc = (sc.description || "").toLowerCase().includes(needle);
        if (!matchesName && !matchesDesc) return false;
      }
      if (filters.status === "active" && !sc.isActive) return false;
      if (filters.status === "inactive" && sc.isActive) return false;
      return true;
    });
  }, [allShowcases, filters]);

  const stats = useMemo(() => {
    const total = allShowcases.length;
    const active = allShowcases.filter((s) => s.isActive).length;
    const inactive = total - active;
    const assignedProductIds = new Set<number>();
    allShowcases.forEach((s) => (s.productIds || []).forEach((id) => assignedProductIds.add(id)));
    const totalAssigned = assignedProductIds.size;
    const totalStoreProducts = (storeProductsQuery.data || []).length;
    const unassigned = Math.max(0, totalStoreProducts - totalAssigned);

    return {
      total,
      active,
      inactive,
      totalAssigned,
      totalStoreProducts,
      unassigned,
    };
  }, [allShowcases, storeProductsQuery.data]);

  const invalidate = async () => {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ["seller2026", "showcases"] }),
      queryClient.invalidateQueries({ queryKey: ["storefront", "showcases"] }),
      queryClient.invalidateQueries({ queryKey: ["storefront", "products"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (payload: SellerShowcaseWritePayload) =>
      createSellerShowcase(storeId as number | string, payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Partial<SellerShowcaseWritePayload> }) =>
      updateSellerShowcase(storeId as number | string, id, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => deleteSellerShowcase(storeId as number | string, id),
    onSuccess: invalidate,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number | string; isActive: boolean }) =>
      toggleSellerShowcaseActive(storeId as number | string, id, isActive),
    onSuccess: invalidate,
  });

  return {
    showcases: filteredShowcases,
    allShowcases,
    storeProducts: storeProductsQuery.data || [],
    stats,
    filters,
    setFilters,
    isLoading: showcasesQuery.isLoading || storeProductsQuery.isLoading,
    isError: showcasesQuery.isError,
    createShowcase: createMutation.mutateAsync,
    updateShowcase: updateMutation.mutateAsync,
    deleteShowcase: deleteMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      toggleActiveMutation.isPending,
  };
}
