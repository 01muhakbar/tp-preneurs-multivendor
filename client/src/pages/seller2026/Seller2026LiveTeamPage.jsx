import { useSearchParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026Team } from "../../hooks/seller2026/useSeller2026Team.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const applySearchParams = (currentParams, setSearchParams) => (nextQuery) => {
  const next = new URLSearchParams(currentParams);
  Object.entries(nextQuery).forEach(([key, value]) => {
    const paramKey = key === "search" ? "q" : key;
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all" ||
      (paramKey === "page" && Number(value) <= 1) ||
      (paramKey === "limit" && Number(value) === 10)
    ) {
      next.delete(paramKey);
    } else {
      next.set(paramKey, String(value));
    }
  });
  setSearchParams(next);
};

export default function Seller2026LiveTeamPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("TEAM_READ");
  const query = {
    search: searchParams.get("q") || "",
    role: searchParams.get("role") || "all",
    status: searchParams.get("status") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 10),
  };
  const teamQuery = useSeller2026Team(storeId, query, { enabled: canView });

  return (
    <Seller2026Workspace
      section="team"
      mode="embedded"
      storeContext={sellerContext}
      teamView="members"
      teamData={teamQuery.data}
      teamState={{
        isLoading: teamQuery.isLoading,
        isError: teamQuery.isError,
        error: teamQuery.error,
        refetch: teamQuery.refetch,
      }}
      teamQuery={query}
      onTeamQueryChange={applySearchParams(searchParams, setSearchParams)}
    />
  );
}
