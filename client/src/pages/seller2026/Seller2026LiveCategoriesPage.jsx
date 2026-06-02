import { useSearchParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026Categories } from "../../hooks/seller2026/useSeller2026Categories.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";

export default function Seller2026LiveCategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const permissionKeys = sellerContext?.access?.permissionKeys || [];
  const canView =
    permissionKeys.includes("CATALOG_CATEGORY_READ") ||
    permissionKeys.includes("CATEGORY_VIEW") ||
    permissionKeys.includes("PRODUCT_VIEW");
  const query = { search: searchParams.get("q") || "" };
  const categoriesQuery = useSeller2026Categories(storeId, query, { enabled: canView });

  const handleQueryChange = (nextQuery) => {
    const next = new URLSearchParams(searchParams);
    if (nextQuery.search) next.set("q", String(nextQuery.search));
    else next.delete("q");
    setSearchParams(next);
  };

  return (
    <Seller2026Workspace
      section="taxonomy"
      mode="embedded"
      storeContext={sellerContext}
      catalogView="categories"
      catalogData={categoriesQuery.data}
      catalogState={{
        isLoading: categoriesQuery.isLoading,
        isError: categoriesQuery.isError,
        error: categoriesQuery.error,
        refetch: categoriesQuery.refetch,
      }}
      catalogQuery={query}
      onCatalogQueryChange={handleQueryChange}
    />
  );
}
