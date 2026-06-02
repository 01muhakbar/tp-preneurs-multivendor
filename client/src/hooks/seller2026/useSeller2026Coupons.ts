import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listSellerCoupons } from "../../api/sellerCoupons.ts";
import {
  adaptSeller2026Coupons,
  emptySeller2026Coupons,
} from "../../api/seller2026/catalog.adapter.ts";

export type Seller2026CouponsQuery = {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026CouponsOptions = {
  enabled?: boolean;
  permissions?: {
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  };
};

export function useSeller2026Coupons(
  storeId: number | string | null | undefined,
  query: Seller2026CouponsQuery = {},
  options: UseSeller2026CouponsOptions = {}
) {
  const enabled = Boolean(storeId) && options.enabled !== false;
  const couponsQuery = useQuery({
    queryKey: ["seller2026", "coupons", storeId],
    queryFn: () => listSellerCoupons(storeId as number | string),
    enabled,
    retry: false,
  });

  const data = useMemo(() => {
    const adapted =
      enabled || couponsQuery.data
        ? adaptSeller2026Coupons(couponsQuery.data, options.permissions)
        : {
            ...emptySeller2026Coupons,
            permissions: {
              canCreate: Boolean(options.permissions?.canCreate),
              canUpdate: Boolean(options.permissions?.canUpdate),
              canDelete: Boolean(options.permissions?.canDelete),
            },
          };
    const search = String(query.search || "").trim().toLowerCase();
    const status = String(query.status || "all");
    const type = String(query.type || "all");
    const coupons = adapted.coupons.filter((item) => {
      const matchesSearch = search ? item.code.toLowerCase().includes(search) : true;
      const matchesStatus = status === "all" ? true : item.status === status;
      const matchesType = type === "all" ? true : item.type === type;
      return matchesSearch && matchesStatus && matchesType;
    });

    return {
      ...adapted,
      coupons,
      summary: {
        ...adapted.summary,
        total: coupons.length,
        active: coupons.filter((item) => item.status === "active").length,
      },
    };
  }, [couponsQuery.data, enabled, options.permissions, query.search, query.status, query.type]);

  return {
    data,
    isLoading: couponsQuery.isLoading,
    isError: couponsQuery.isError,
    error: couponsQuery.error,
    refetch: couponsQuery.refetch,
  };
}
