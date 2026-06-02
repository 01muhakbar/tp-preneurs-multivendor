import { useParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026Storefront } from "../../hooks/seller2026/useSeller2026Storefront.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

export default function Seller2026LiveStorefrontPage() {
  const { storeSlug } = useParams();
  const {
    sellerContext,
    workspaceStoreId: storeId,
    workspaceStoreSlug,
  } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canViewStore = can("STORE_PROFILE_READ");
  const storefrontQuery = useSeller2026Storefront(storeSlug || workspaceStoreSlug, storeId, {
    enabled: canViewStore,
    sellerContext,
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
    />
  );
}
