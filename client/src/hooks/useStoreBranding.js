import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStoreSettings } from "../api/storeCustomizationPublic.ts";
import {
  CANONICAL_CLIENT_LOGO_URL,
  getCachedClientLogoUrl,
  getCachedStoreBranding,
  setCachedStoreBranding,
  getCachedStoreSettings,
} from "../lib/branding.js";

const getEmptyBranding = () => ({
  clientLogoUrl: getCachedClientLogoUrl(),
  adminLogoUrl: "",
  sellerLogoUrl: "",
  adminLoginHeroUrl: "",
  adminForgotPasswordHeroUrl: "",
  adminCreateAccountHeroUrl: "",
  workspaceBrandName: "TP PRENEURS",
});

export default function useStoreBranding(options = {}) {
  const query = useQuery({
    queryKey: ["store-settings", "public", "branding"],
    queryFn: getStoreSettings,
    staleTime: 60_000,
    retry: 1,
    initialData: () => getCachedStoreSettings(),
    ...options,
  });

  const liveBranding = query.data?.data?.storeSettings?.branding;

  useEffect(() => {
    if (liveBranding) {
      setCachedStoreBranding(liveBranding);
    }
  }, [liveBranding]);

  return {
    ...query,
    branding: liveBranding || getCachedStoreBranding() || getEmptyBranding(),
  };
}
