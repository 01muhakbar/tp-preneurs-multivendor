import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSellerProductAuthoringMeta,
  getSellerProducts,
  setSellerProductPublished,
} from "../../api/sellerProducts.ts";
import {
  adaptSeller2026Products,
  emptySeller2026Products,
} from "../../api/seller2026/products.adapter.ts";

export type Seller2026ProductsQuery = {
  search?: string;
  status?: string;
  category?: string;
  stock?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026ProductsOptions = {
  enabled?: boolean;
  permissions?: {
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
    canSubmit?: boolean;
    canPublish?: boolean;
  };
};

type SellerProductsApiQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  categoryIds?: number[];
  status?: string;
  submissionStatus?: "" | "none" | "submitted" | "needs_revision" | "review_queue" | "ready_to_submit";
};

const toApiQuery = (query: Seller2026ProductsQuery): SellerProductsApiQuery => {
  const status = String(query.status || "all");
  const category = String(query.category || "all");
  const apiQuery: SellerProductsApiQuery = {
    page: Number(query.page || 1),
    limit: Number(query.limit || 10),
    keyword: query.search || undefined,
  };

  if (category !== "all") {
    const categoryId = Number(category);
    if (Number.isInteger(categoryId) && categoryId > 0) {
      apiQuery.categoryIds = [categoryId];
    }
  }

  if (status === "active") {
    apiQuery.status = "active";
  } else if (status === "inactive") {
    apiQuery.status = "inactive";
  } else if (status === "review_queue") {
    apiQuery.submissionStatus = "review_queue";
  } else if (status === "submitted") {
    apiQuery.submissionStatus = "submitted";
  } else if (status === "needs_revision") {
    apiQuery.submissionStatus = "needs_revision";
  } else if (status === "draft") {
    apiQuery.submissionStatus = "none";
  }

  return apiQuery;
};

export function useSeller2026Products(
  storeId: number | string | null | undefined,
  query: Seller2026ProductsQuery,
  options: UseSeller2026ProductsOptions = {}
) {
  const queryClient = useQueryClient();
  const enabled = Boolean(storeId) && options.enabled !== false;

  const productsQuery = useQuery({
    queryKey: ["seller2026", "products", storeId, query],
    queryFn: () => getSellerProducts(storeId as number | string, toApiQuery(query)),
    enabled,
    retry: false,
  });

  const authoringMetaQuery = useQuery({
    queryKey: ["seller2026", "products", "authoring-meta", storeId],
    queryFn: () => getSellerProductAuthoringMeta(storeId as number | string),
    enabled,
    retry: false,
  });

  const publishMutation = useMutation({
    mutationFn: ({ productId, published }: { productId: string | number; published: boolean }) =>
      setSellerProductPublished(storeId as number | string, productId, published),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["seller2026", "products", storeId] }),
        queryClient.invalidateQueries({ queryKey: ["seller2026", "product", storeId, variables.productId] }),
        queryClient.invalidateQueries({ queryKey: ["storefront", "products"] }),
        queryClient.invalidateQueries({ queryKey: ["storefront", "product"] }),
      ]);
    },
  });

  const data = useMemo(() => {
    if (!enabled && !productsQuery.data) {
      return {
        ...emptySeller2026Products,
        permissions: {
          canCreate: Boolean(options.permissions?.canCreate),
          canUpdate: Boolean(options.permissions?.canUpdate),
          canDelete: Boolean(options.permissions?.canDelete),
          canSubmit: Boolean(options.permissions?.canSubmit),
          canPublish: Boolean(options.permissions?.canPublish),
        },
      };
    }

    return adaptSeller2026Products(
      productsQuery.data,
      authoringMetaQuery.data,
      query,
      options.permissions
    );
  }, [authoringMetaQuery.data, enabled, options.permissions, productsQuery.data, query]);

  return {
    data,
    isLoading: productsQuery.isLoading || authoringMetaQuery.isLoading,
    isError: productsQuery.isError,
    error: productsQuery.error,
    refetch: () => {
      void productsQuery.refetch();
      void authoringMetaQuery.refetch();
    },
    setProductPublished: publishMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    publishingProductId: publishMutation.variables?.productId ?? null,
  };
}
