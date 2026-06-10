import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSellerStoreProfile } from "../../api/sellerStoreProfile.ts";
import { getSellerWorkspaceReadiness } from "../../api/sellerWorkspace.ts";
import { getStorePublicIdentityBySlug } from "../../api/storePublicIdentity.ts";
import {
  adaptSeller2026StoreProfile,
} from "../../api/seller2026/storeProfile.adapter.ts";
import {
  type Seller2026StoreProfileUpdatePayload,
  updateSeller2026StoreProfile,
} from "../../api/seller2026/storefront.mutations.ts";

type Options = {
  enabled?: boolean;
  canEdit?: boolean;
  sellerContext?: unknown;
};

export function useSeller2026StoreProfile(
  storeSlug: string | null | undefined,
  storeId: string | number | null | undefined,
  options: Options = {}
) {
  const queryClient = useQueryClient();
  const normalizedSlug = String(storeSlug || "").trim();
  const enabled = Boolean(storeId) && options.enabled !== false;

  const profileQuery = useQuery({
    queryKey: ["seller2026", "store-profile", storeId],
    queryFn: () => getSellerStoreProfile(storeId as string | number),
    enabled,
    retry: false,
  });
  const readinessQuery = useQuery({
    queryKey: ["seller2026", "store-profile", "readiness", storeId],
    queryFn: () => getSellerWorkspaceReadiness(storeId as string | number),
    enabled,
    retry: false,
  });
  const publicIdentityQuery = useQuery({
    queryKey: ["seller2026", "store-profile", "public", normalizedSlug],
    queryFn: () => getStorePublicIdentityBySlug(normalizedSlug),
    enabled: enabled && Boolean(normalizedSlug),
    retry: false,
  });
  const data = useMemo(
    () =>
      adaptSeller2026StoreProfile({
        sellerContext: options.sellerContext,
        profile: profileQuery.data,
        readiness: readinessQuery.data,
        publicIdentity: publicIdentityQuery.data,
      }),
    [options.sellerContext, profileQuery.data, publicIdentityQuery.data, readinessQuery.data]
  );

  const mutation = useMutation({
    mutationFn: (payload: Seller2026StoreProfileUpdatePayload) => {
      if (!storeId || options.canEdit === false) {
        throw new Error("Store profile editing is not available.");
      }
      return updateSeller2026StoreProfile({ storeId, payload });
    },
    onSuccess: async (profile) => {
      queryClient.setQueryData(["seller2026", "store-profile", storeId], profile);
      queryClient.setQueryData(["seller", "store-profile", storeId], profile);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["seller2026", "store-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["seller2026", "dashboard"] }),
      ]);
    },
  });

  return {
    data,
    isLoading: profileQuery.isLoading || readinessQuery.isLoading,
    isError: profileQuery.isError || readinessQuery.isError,
    error: profileQuery.error || readinessQuery.error,
    publicPreviewUnavailable: publicIdentityQuery.isError,
    isSaving: mutation.isPending,
    saveError: mutation.error,
    saveProfile: mutation.mutateAsync,
    refetch: async () => {
      await Promise.all([profileQuery.refetch(), readinessQuery.refetch()]);
      if (normalizedSlug) await publicIdentityQuery.refetch();
    },
  };
}
