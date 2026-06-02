import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerStoreProfile } from "../../api/sellerStoreProfile.ts";
import { getSellerWorkspaceReadiness } from "../../api/sellerWorkspace.ts";
import { getStorePublicIdentityBySlug } from "../../api/storePublicIdentity.ts";
import { getStoreMicrositeRichAboutBySlug } from "../../api/storeCustomizationPublic.ts";
import { adaptSeller2026Storefront } from "../../api/seller2026/storefront.adapter.ts";

type UseSeller2026StorefrontOptions = {
  enabled?: boolean;
  sellerContext?: unknown;
};

export function useSeller2026Storefront(
  storeSlug: string | null | undefined,
  storeId: number | string | null | undefined,
  options: UseSeller2026StorefrontOptions = {}
) {
  const normalizedSlug = String(storeSlug || "").trim();
  const enabled = Boolean(storeId) && options.enabled !== false;
  const publicEnabled = Boolean(normalizedSlug) && options.enabled !== false;

  const profileQuery = useQuery({
    queryKey: ["seller2026", "storefront", "profile", storeId],
    queryFn: () => getSellerStoreProfile(storeId as number | string),
    enabled,
    retry: false,
  });

  const readinessQuery = useQuery({
    queryKey: ["seller2026", "storefront", "readiness", storeId],
    queryFn: () => getSellerWorkspaceReadiness(storeId as number | string),
    enabled,
    retry: false,
  });

  const publicIdentityQuery = useQuery({
    queryKey: ["seller2026", "storefront", "public-identity", normalizedSlug],
    queryFn: () => getStorePublicIdentityBySlug(normalizedSlug),
    enabled: publicEnabled,
    retry: false,
  });

  const richAboutQuery = useQuery({
    queryKey: ["seller2026", "storefront", "rich-about", normalizedSlug],
    queryFn: () => getStoreMicrositeRichAboutBySlug(normalizedSlug),
    enabled: publicEnabled,
    retry: false,
  });

  const data = useMemo(
    () =>
      adaptSeller2026Storefront({
        sellerContext: options.sellerContext,
        profile: profileQuery.data,
        readiness: readinessQuery.data,
        publicIdentity: publicIdentityQuery.data,
        richAbout: richAboutQuery.data,
      }),
    [
      options.sellerContext,
      profileQuery.data,
      publicIdentityQuery.data,
      readinessQuery.data,
      richAboutQuery.data,
    ]
  );

  const isLoading = profileQuery.isLoading || readinessQuery.isLoading;
  const isError = profileQuery.isError || readinessQuery.isError;

  return {
    data,
    isLoading,
    isError,
    error: profileQuery.error || readinessQuery.error,
    publicPreviewUnavailable: publicIdentityQuery.isError || richAboutQuery.isError,
    refetch: () => {
      void profileQuery.refetch();
      void readinessQuery.refetch();
      if (publicEnabled) {
        void publicIdentityQuery.refetch();
        void richAboutQuery.refetch();
      }
    },
  };
}
