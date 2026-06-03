import { useNavigate, useParams } from "react-router-dom";
import { SELLER_2026_MUTATIONS } from "../../api/seller2026/mutation-flags.ts";
import { hasSeller2026Permission } from "../../api/seller2026/permissions.ts";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026ProductDetail } from "../../hooks/seller2026/useSeller2026ProductDetail.ts";
import { useSeller2026SaveProductDraft } from "../../hooks/seller2026/useSeller2026SaveProductDraft.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

export default function Seller2026LiveProductEditorPage({ mode = "create" }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { sellerContext, workspaceStoreId: storeId, workspaceStoreSlug } = useSellerWorkspaceRoute();
  const { can, permissions, sourceAvailable } = getSeller2026PagePermissions(sellerContext);
  const canViewProducts = can("CATALOG_PRODUCT_READ");
  const requiredMutationPermission =
    mode === "edit" ? "CATALOG_PRODUCT_UPDATE" : "CATALOG_PRODUCT_CREATE";
  const canSaveDraft =
    sourceAvailable &&
    hasSeller2026Permission(permissions, requiredMutationPermission) &&
    SELLER_2026_MUTATIONS.productDraftSave;
  const productQuery = useSeller2026ProductDetail(storeId, productId, {
    enabled: mode === "edit" && canViewProducts,
  });
  const saveDraftMutation = useSeller2026SaveProductDraft({
    storeId,
    productId,
    mode,
    enabled: canSaveDraft,
    onSuccess: (product) => {
      const savedProductId = product?.id || product?.productId;
      if (mode === "create" && savedProductId && workspaceStoreSlug) {
        navigate(
          `/seller/stores/${encodeURIComponent(workspaceStoreSlug)}/catalog/products/${encodeURIComponent(String(savedProductId))}/edit`,
          { replace: true }
        );
      } else {
        productQuery.refetch?.();
      }
    },
  });

  return (
    <Seller2026Workspace
      section="products"
      mode="embedded"
      storeContext={sellerContext}
      productEditorMode={mode}
      productDetailData={productQuery.data}
      productDetailState={{
        view: "editor",
        isLoading: productQuery.isLoading,
        isError: productQuery.isError,
        error: productQuery.error,
        refetch: productQuery.refetch,
      }}
      productDraftMutation={{
        canSave: canSaveDraft,
        mode,
        isSubmitting: saveDraftMutation.isPending,
        error: saveDraftMutation.error,
        submit: saveDraftMutation.mutateAsync,
      }}
    />
  );
}
