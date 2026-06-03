import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSellerCoupons } from "../../api/sellerCoupons.ts";
import {
  archiveSeller2026Coupon,
  createSeller2026Coupon,
  setSeller2026CouponStatus,
  updateSeller2026Coupon,
  type Seller2026CouponPayload,
} from "../../api/seller2026/coupons.mutations.ts";
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
    canManageStatus?: boolean;
  };
};

export function useSeller2026Coupons(
  storeId: number | string | null | undefined,
  query: Seller2026CouponsQuery = {},
  options: UseSeller2026CouponsOptions = {}
) {
  const enabled = Boolean(storeId) && options.enabled !== false;
  const queryClient = useQueryClient();
  const canCreate = Boolean(options.permissions?.canCreate);
  const canUpdate = Boolean(options.permissions?.canUpdate);
  const canDelete = Boolean(options.permissions?.canDelete);
  const canManageStatus = Boolean(options.permissions?.canManageStatus);
  const invalidateCoupons = () => {
    void queryClient.invalidateQueries({ queryKey: ["seller2026", "coupons"] });
  };
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
              canManageStatus: Boolean(options.permissions?.canManageStatus),
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

  const createMutation = useMutation({
    mutationFn: async (payload: Seller2026CouponPayload) => {
      if (!enabled || !storeId || !canCreate) throw new Error("Coupon create is not available.");
      const result = await createSeller2026Coupon({ storeId, payload });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: invalidateCoupons,
  });
  const updateMutation = useMutation({
    mutationFn: async ({ couponId, payload }: { couponId: number | string; payload: Seller2026CouponPayload }) => {
      if (!enabled || !storeId || !canUpdate) throw new Error("Coupon update is not available.");
      const result = await updateSeller2026Coupon({ storeId, couponId, payload });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: invalidateCoupons,
  });
  const statusMutation = useMutation({
    mutationFn: async ({ couponId, active }: { couponId: number | string; active: boolean }) => {
      if (!enabled || !storeId || !canManageStatus) throw new Error("Coupon status change is not available.");
      const result = await setSeller2026CouponStatus({ storeId, couponId, active });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: invalidateCoupons,
  });
  const archiveMutation = useMutation({
    mutationFn: async (couponId: number | string) => {
      if (!enabled || !storeId || !canDelete) throw new Error("Coupon archive is not available.");
      const result = await archiveSeller2026Coupon({ storeId, couponId });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: invalidateCoupons,
  });

  return {
    data,
    isLoading: couponsQuery.isLoading,
    isError: couponsQuery.isError,
    error: couponsQuery.error,
    refetch: couponsQuery.refetch,
    creating: createMutation.isPending,
    updatingId: updateMutation.isPending ? "active" : null,
    statusChangingId: statusMutation.isPending ? "active" : null,
    deletingId: archiveMutation.isPending ? "active" : null,
    mutationError:
      createMutation.error || updateMutation.error || statusMutation.error || archiveMutation.error,
    createCoupon: createMutation.mutateAsync,
    updateCoupon: updateMutation.mutateAsync,
    changeCouponStatus: statusMutation.mutateAsync,
    deleteOrArchiveCoupon: archiveMutation.mutateAsync,
    canCreate,
    canUpdate,
    canDelete,
    canManageStatus,
  };
}
