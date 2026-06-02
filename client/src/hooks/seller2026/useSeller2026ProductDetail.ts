import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerProductDetail } from "../../api/sellerProducts.ts";
import { adaptSeller2026ProductDetail } from "../../api/seller2026/products.adapter.ts";

type UseSeller2026ProductDetailOptions = {
  enabled?: boolean;
};

export function useSeller2026ProductDetail(
  storeId: number | string | null | undefined,
  productId: number | string | null | undefined,
  options: UseSeller2026ProductDetailOptions = {}
) {
  const enabled = Boolean(storeId) && Boolean(productId) && options.enabled !== false;

  const productQuery = useQuery({
    queryKey: ["seller2026", "product-detail", storeId, productId],
    queryFn: () =>
      getSellerProductDetail(storeId as number | string, productId as number | string),
    enabled,
    retry: false,
  });

  const data = useMemo(
    () => (productQuery.data ? adaptSeller2026ProductDetail(productQuery.data) : null),
    [productQuery.data]
  );

  return {
    data,
    isLoading: productQuery.isLoading,
    isError: productQuery.isError,
    error: productQuery.error,
    refetch: productQuery.refetch,
  };
}
