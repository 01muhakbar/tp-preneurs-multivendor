import { useParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026ProductDetail } from "../../hooks/seller2026/useSeller2026ProductDetail.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

export default function Seller2026LiveProductDetailPage() {
  const { productId } = useParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canViewProducts = can("CATALOG_PRODUCT_READ");
  const productQuery = useSeller2026ProductDetail(storeId, productId, {
    enabled: canViewProducts,
  });

  return (
    <Seller2026Workspace
      section="products"
      mode="embedded"
      storeContext={sellerContext}
      productDetailData={productQuery.data}
      productDetailState={{
        view: "detail",
        isLoading: productQuery.isLoading,
        isError: productQuery.isError,
        error: productQuery.error,
        refetch: productQuery.refetch,
      }}
    />
  );
}
