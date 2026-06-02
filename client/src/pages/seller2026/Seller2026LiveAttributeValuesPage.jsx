import { useParams, useSearchParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026AttributeValues } from "../../hooks/seller2026/useSeller2026AttributeValues.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default function Seller2026LiveAttributeValuesPage() {
  const { attributeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("CATALOG_ATTRIBUTE_READ");
  const query = {
    search: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 20),
  };
  const valuesQuery = useSeller2026AttributeValues(storeId, attributeId, query, {
    enabled: canView,
  });

  const handleQueryChange = (nextQuery) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(nextQuery).forEach(([key, value]) => {
      const paramKey = key === "search" ? "q" : key;
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "all" ||
        (paramKey === "page" && Number(value) <= 1) ||
        (paramKey === "limit" && Number(value) === 20)
      ) {
        next.delete(paramKey);
      } else {
        next.set(paramKey, String(value));
      }
    });
    setSearchParams(next);
  };

  return (
    <Seller2026Workspace
      section="taxonomy"
      mode="embedded"
      storeContext={sellerContext}
      catalogView="attribute-values"
      catalogData={valuesQuery.data}
      catalogState={{
        isLoading: valuesQuery.isLoading,
        isError: valuesQuery.isError,
        error: valuesQuery.error,
        refetch: valuesQuery.refetch,
      }}
      catalogQuery={query}
      onCatalogQueryChange={handleQueryChange}
    />
  );
}
