import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSellerCategory,
  getSellerCategories,
  setSellerCategoryPublished,
  updateSellerCategory,
} from "../../api/sellerCategories.ts";
import {
  adaptSeller2026CategoryList,
  buildSeller2026CategoryParentOptions,
  buildSeller2026CategoryPayload,
  summarizeSeller2026Categories,
  type Seller2026CategoryForm,
  type Seller2026CategoryListItem,
} from "../../api/seller2026/categories.adapter.ts";

export type Seller2026CategoryStatusFilter = "all" | "published" | "draft";
export type Seller2026CategoryVisibilityFilter = "all" | "visible" | "hidden";

export type Seller2026CategoriesFilters = {
  search: string;
  status: Seller2026CategoryStatusFilter;
  visibility: Seller2026CategoryVisibilityFilter;
};

type UseSeller2026CategoriesOptions = {
  enabled?: boolean;
  permissions?: {
    canEdit?: boolean;
    canPublish?: boolean;
    canUnpublish?: boolean;
    canArchive?: boolean;
  };
};

const DEFAULT_FILTERS: Seller2026CategoriesFilters = {
  search: "",
  status: "all",
  visibility: "all",
};

const text = (value: unknown) => String(value ?? "").trim();

const matchesSearch = (category: Seller2026CategoryListItem, search: string) => {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return [category.name, category.slug, category.description, category.parentName]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
};

export function useSeller2026Categories(
  storeId: number | string | null | undefined,
  options: UseSeller2026CategoriesOptions = {}
) {
  const queryClient = useQueryClient();
  const enabled = Boolean(storeId) && options.enabled !== false;
  const [filters, setFilters] = useState<Seller2026CategoriesFilters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const listQuery = useQuery({
    queryKey: ["seller2026", "categories", storeId],
    queryFn: () =>
      getSellerCategories(storeId as number | string, {
        page: 1,
        limit: 100,
      }),
    enabled,
    retry: false,
  });

  const categories = useMemo(
    () => adaptSeller2026CategoryList(listQuery.data, options.permissions),
    [listQuery.data, options.permissions]
  );

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (!matchesSearch(category, filters.search)) return false;
      if (filters.status !== "all" && category.lifecycleStatus !== filters.status) return false;
      if (filters.visibility !== "all" && category.visibilityStatus !== filters.visibility) return false;
      return true;
    });
  }, [categories, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedCategories = filteredCategories.slice((safePage - 1) * perPage, safePage * perPage);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["seller2026", "categories", storeId] });
  };

  const createMutation = useMutation({
    mutationFn: (form: Seller2026CategoryForm) =>
      createSellerCategory(storeId as number | string, buildSeller2026CategoryPayload(form)),
    onSuccess: async () => {
      await invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string | number; form: Seller2026CategoryForm }) =>
      updateSellerCategory(storeId as number | string, id, buildSeller2026CategoryPayload(form)),
    onSuccess: async () => {
      await invalidate();
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string | number; isPublished: boolean }) =>
      setSellerCategoryPublished(storeId as number | string, id, isPublished),
    onSuccess: async () => {
      await invalidate();
    },
  });

  const updateFilters = (next: Partial<Seller2026CategoriesFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  return {
    categories: pagedCategories,
    allCategories: categories,
    filteredCategories,
    summary: summarizeSeller2026Categories(categories),
    parentOptions: buildSeller2026CategoryParentOptions(categories),
    getParentOptions: (editingId?: string | null, isId = false) =>
      buildSeller2026CategoryParentOptions(categories, editingId, isId),
    filters,
    setFilters: updateFilters,
    resetFilters,
    selectedIds,
    setSelectedIds,
    clearSelection: () => setSelectedIds([]),
    toggleSelected: (id: string, checked?: boolean) => {
      const normalized = text(id);
      if (!normalized) return;
      setSelectedIds((current) => {
        const exists = current.includes(normalized);
        if (checked === true || (!exists && checked !== false)) return [...current, normalized];
        return current.filter((item) => item !== normalized);
      });
    },
    togglePageSelection: (checked: boolean) => {
      const pageIds = pagedCategories.map((item) => item.id);
      setSelectedIds((current) =>
        checked
          ? Array.from(new Set([...current, ...pageIds]))
          : current.filter((item) => !pageIds.includes(item))
      );
    },
    pagination: {
      page: safePage,
      perPage,
      total: filteredCategories.length,
      totalPages,
      from: filteredCategories.length ? (safePage - 1) * perPage + 1 : 0,
      to: Math.min(safePage * perPage, filteredCategories.length),
      setPage,
      setPerPage: (value: number) => {
        setPerPage(value);
        setPage(1);
      },
    },
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    updateCategoryVisibility: visibilityMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updatingCategoryId: updateMutation.isPending ? String(updateMutation.variables?.id || "") : "",
    visibilityCategoryId: visibilityMutation.isPending
      ? String(visibilityMutation.variables?.id || "")
      : "",
  };
}
