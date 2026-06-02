import { useParams } from "react-router-dom";
import { SELLER_2026_MUTATIONS } from "../../api/seller2026/mutation-flags.ts";
import { hasSeller2026Permission } from "../../api/seller2026/permissions.ts";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026Storefront } from "../../hooks/seller2026/useSeller2026Storefront.ts";
import { useSeller2026UpdateStoreProfile } from "../../hooks/seller2026/useSeller2026UpdateStoreProfile.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

export default function Seller2026LiveStorefrontPage() {
  const { storeSlug } = useParams();
  const {
    sellerContext,
    workspaceStoreId: storeId,
    workspaceStoreSlug,
  } = useSellerWorkspaceRoute();
  const { can, permissions, sourceAvailable } = getSeller2026PagePermissions(sellerContext);
  const canViewStore = can("STORE_PROFILE_READ");
  const canUpdateStore =
    sourceAvailable &&
    hasSeller2026Permission(permissions, "STORE_PROFILE_UPDATE") &&
    SELLER_2026_MUTATIONS.storeProfileUpdate;
  const storefrontQuery = useSeller2026Storefront(storeSlug || workspaceStoreSlug, storeId, {
    enabled: canViewStore,
    sellerContext,
  });
  const updateStoreProfile = useSeller2026UpdateStoreProfile({
    storeId,
    enabled: canUpdateStore,
    onSuccess: storefrontQuery.refetch,
  });

  return (
    <Seller2026Workspace
      section="storefront"
      mode="embedded"
      storeContext={sellerContext}
      storefrontData={storefrontQuery.data}
      storefrontState={{
        isLoading: storefrontQuery.isLoading,
        isError: storefrontQuery.isError,
        error: storefrontQuery.error,
        publicPreviewUnavailable: storefrontQuery.publicPreviewUnavailable,
        refetch: storefrontQuery.refetch,
      }}
      storefrontMutation={{
        canUpdate: canUpdateStore,
        isSubmitting: updateStoreProfile.isPending,
        error: updateStoreProfile.error,
        submit: updateStoreProfile.mutateAsync,
      }}
    />
  );
}
