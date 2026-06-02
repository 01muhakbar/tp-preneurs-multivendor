import { useSearchParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026TeamAudit } from "../../hooks/seller2026/useSeller2026TeamAudit.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const applySearchParams = (currentParams, setSearchParams) => (nextQuery) => {
  const next = new URLSearchParams(currentParams);
  Object.entries(nextQuery).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all" ||
      (key === "page" && Number(value) <= 1) ||
      (key === "limit" && Number(value) === 10)
    ) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  });
  setSearchParams(next);
};

export default function Seller2026LiveTeamAuditPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const permissionKeys = sellerContext?.access?.permissionKeys || [];
  const canView = permissionKeys.includes("TEAM_AUDIT_READ");
  const query = {
    action: searchParams.get("action") || "all",
    member: searchParams.get("member") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 10),
  };
  const auditQuery = useSeller2026TeamAudit(storeId, query, { enabled: canView });

  return (
    <Seller2026Workspace
      section="team"
      mode="embedded"
      storeContext={sellerContext}
      teamView="audit"
      teamData={auditQuery.data}
      teamState={{
        isLoading: auditQuery.isLoading,
        isError: auditQuery.isError,
        error: auditQuery.error,
        refetch: auditQuery.refetch,
      }}
      teamQuery={query}
      onTeamQueryChange={applySearchParams(searchParams, setSearchParams)}
    />
  );
}
