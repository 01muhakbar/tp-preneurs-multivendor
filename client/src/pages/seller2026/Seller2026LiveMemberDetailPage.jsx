import { useParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026MemberDetail } from "../../hooks/seller2026/useSeller2026MemberDetail.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";

export default function Seller2026LiveMemberDetailPage() {
  const { memberId } = useParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const permissionKeys = sellerContext?.access?.permissionKeys || [];
  const canView = permissionKeys.includes("TEAM_READ") || permissionKeys.includes("TEAM_ROLE_UPDATE");
  const memberQuery = useSeller2026MemberDetail(storeId, memberId, { enabled: canView });

  return (
    <Seller2026Workspace
      section="team"
      mode="embedded"
      storeContext={sellerContext}
      teamView="member-detail"
      teamData={memberQuery.data}
      teamState={{
        isLoading: memberQuery.isLoading,
        isError: memberQuery.isError,
        error: memberQuery.error,
        refetch: memberQuery.refetch,
      }}
    />
  );
}
