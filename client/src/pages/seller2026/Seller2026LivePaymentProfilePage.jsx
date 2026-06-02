import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026PaymentProfile } from "../../hooks/seller2026/useSeller2026PaymentProfile.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";

export default function Seller2026LivePaymentProfilePage() {
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const permissionKeys = sellerContext?.access?.permissionKeys || [];
  const canView =
    permissionKeys.includes("STORE_PAYMENT_PROFILE_READ") ||
    permissionKeys.includes("STORE_PAYMENT_PROFILE_SUBMIT");
  const profileQuery = useSeller2026PaymentProfile(storeId, { enabled: canView });

  return (
    <Seller2026Workspace
      section="operations"
      mode="embedded"
      storeContext={sellerContext}
      operationsView="payment-profile"
      operationsData={profileQuery.data}
      operationsState={{
        isLoading: profileQuery.isLoading,
        isError: profileQuery.isError,
        error: profileQuery.error,
        refetch: profileQuery.refetch,
      }}
    />
  );
}
