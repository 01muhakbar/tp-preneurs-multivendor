import { useSearchParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026Attributes } from "../../hooks/seller2026/useSeller2026Attributes.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default function Seller2026LiveAttributesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const permissionKeys = sellerContext?.access?.permissionKeys || [];
  const canView =
    permissionKeys.includes("CATALOG_ATTRIBUTE_READ") ||
    permissionKeys.includes("ATTRIBUTE_VIEW") ||
    permissionKeys.includes("PRODUCT_VIEW");
  const query = {
    search: searchParams.get("q") || "",
    type: searchParams.get("type") || "all",
    status: searchParams.get("status") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 20),
  };
  const attributesQuery = useSeller2026Attributes(storeId, query, { enabled: canView });

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
      catalogView="attributes"
      catalogData={attributesQuery.data}
      catalogState={{
        isLoading: attributesQuery.isLoading,
        isError: attributesQuery.isError,
        error: attributesQuery.error,
        refetch: attributesQuery.refetch,
      }}
      catalogQuery={query}
      onCatalogQueryChange={handleQueryChange}
    />
  );
}
