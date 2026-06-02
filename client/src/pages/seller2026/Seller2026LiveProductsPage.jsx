import { useSearchParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026Products } from "../../hooks/seller2026/useSeller2026Products.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default function Seller2026LiveProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canViewProducts = can("CATALOG_PRODUCT_READ");
  const query = {
    search: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    category: searchParams.get("category") || "all",
    stock: searchParams.get("stock") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 10),
  };
  const productsQuery = useSeller2026Products(storeId, query, {
    enabled: canViewProducts,
    permissions: {
      canCreate: can("CATALOG_PRODUCT_CREATE"),
      canUpdate: can("CATALOG_PRODUCT_UPDATE"),
      canDelete: can("CATALOG_PRODUCT_DELETE"),
      canSubmit: can("CATALOG_PRODUCT_SUBMIT"),
    },
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
        (paramKey === "limit" && Number(value) === 10)
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
      section="products"
      mode="embedded"
      storeContext={sellerContext}
      productsData={productsQuery.data}
      productsState={{
        isLoading: productsQuery.isLoading,
        isError: productsQuery.isError,
        error: productsQuery.error,
        refetch: productsQuery.refetch,
      }}
      productsQuery={query}
      onProductsQueryChange={handleQueryChange}
    />
  );
}
