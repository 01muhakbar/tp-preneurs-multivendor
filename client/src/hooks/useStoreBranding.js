import { useQuery } from "@tanstack/react-query";
import { getStoreSettings } from "../api/storeCustomizationPublic.ts";
import { CANONICAL_CLIENT_LOGO_URL } from "../lib/branding.js";

const EMPTY_BRANDING = {
  clientLogoUrl: CANONICAL_CLIENT_LOGO_URL,
  adminLogoUrl: "",
  sellerLogoUrl: "",
  adminLoginHeroUrl: "",
  adminForgotPasswordHeroUrl: "",
  adminCreateAccountHeroUrl: "",
  workspaceBrandName: "TP PRENEURS",
};

export default function useStoreBranding(options = {}) {
  const query = useQuery({
    queryKey: ["store-settings", "public", "branding"],
    queryFn: getStoreSettings,
    staleTime: 60_000,
    retry: 1,
    ...options,
  });

  return {
    ...query,
    branding: query.data?.data?.storeSettings?.branding || EMPTY_BRANDING,
  };
}
