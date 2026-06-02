import { useSearchParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026Orders } from "../../hooks/seller2026/useSeller2026Orders.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default function Seller2026LiveOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("ORDER_READ");
  const query = {
    search: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    channel: searchParams.get("channel") || "all",
    shippingMethod: searchParams.get("shippingMethod") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 10),
  };
  const ordersQuery = useSeller2026Orders(storeId, query, { enabled: canView });

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
      section="operations"
      mode="embedded"
      storeContext={sellerContext}
      operationsView="orders"
      operationsData={ordersQuery.data}
      operationsState={{
        isLoading: ordersQuery.isLoading,
        isError: ordersQuery.isError,
        error: ordersQuery.error,
        refetch: ordersQuery.refetch,
      }}
      operationsQuery={query}
      onOperationsQueryChange={handleQueryChange}
    />
  );
}
