import { useSearchParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026Products } from "../../hooks/seller2026/useSeller2026Products.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default function Seller2026LiveProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const permissionKeys = sellerContext?.access?.permissionKeys || [];
  const hasPermission = (permission) => permissionKeys.includes(permission);
  const canViewProducts = hasPermission("PRODUCT_VIEW") || hasPermission("CATALOG_PRODUCT_READ");
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
      canCreate: hasPermission("PRODUCT_CREATE") || hasPermission("CATALOG_PRODUCT_CREATE"),
      canUpdate: hasPermission("PRODUCT_UPDATE") || hasPermission("CATALOG_PRODUCT_UPDATE"),
      canDelete: hasPermission("PRODUCT_DELETE") || hasPermission("CATALOG_PRODUCT_DELETE"),
      canSubmit: hasPermission("PRODUCT_SUBMIT") || hasPermission("CATALOG_PRODUCT_SUBMIT"),
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
