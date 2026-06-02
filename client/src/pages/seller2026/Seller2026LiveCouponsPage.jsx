import { useSearchParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026Coupons } from "../../hooks/seller2026/useSeller2026Coupons.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default function Seller2026LiveCouponsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("COUPON_READ");
  const query = {
    search: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    type: searchParams.get("type") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 20),
  };
  const couponsQuery = useSeller2026Coupons(storeId, query, {
    enabled: canView,
    permissions: {
      canCreate: can("COUPON_CREATE"),
      canUpdate: can("COUPON_UPDATE"),
      canDelete: can("COUPON_DELETE"),
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
      catalogView="coupons"
      catalogData={couponsQuery.data}
      catalogState={{
        isLoading: couponsQuery.isLoading,
        isError: couponsQuery.isError,
        error: couponsQuery.error,
        refetch: couponsQuery.refetch,
      }}
      catalogQuery={query}
      onCatalogQueryChange={handleQueryChange}
    />
  );
}
