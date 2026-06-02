import { useParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026SuborderDetail } from "../../hooks/seller2026/useSeller2026SuborderDetail.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";

export default function Seller2026LiveSuborderDetailPage() {
  const { suborderId } = useParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const permissionKeys = sellerContext?.access?.permissionKeys || [];
  const canView = permissionKeys.includes("ORDER_READ");
  const detailQuery = useSeller2026SuborderDetail(storeId, suborderId, { enabled: canView });

  return (
    <Seller2026Workspace
      section="operations"
      mode="embedded"
      storeContext={sellerContext}
      operationsView="suborder-detail"
      operationsData={detailQuery.data}
      operationsState={{
        isLoading: detailQuery.isLoading,
        isError: detailQuery.isError,
        error: detailQuery.error,
        refetch: detailQuery.refetch,
      }}
    />
  );
}
