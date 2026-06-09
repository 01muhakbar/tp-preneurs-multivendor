import { useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import {
  createSellerAttribute,
  setSellerAttributePublished,
  updateSellerAttribute,
} from "../../api/sellerAttributes.ts";
import { useSeller2026Attributes } from "../../hooks/seller2026/useSeller2026Attributes.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default function Seller2026LiveAttributesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("CATALOG_ATTRIBUTE_READ");
  const permissionKeys = sellerContext?.access?.permissionKeys || [];
  const canManageAttributes = permissionKeys.includes("ATTRIBUTE_MANAGE");
  const query = {
    search: searchParams.get("q") || "",
    type: searchParams.get("type") || "all",
    status: searchParams.get("status") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 20),
  };
  const attributesQuery = useSeller2026Attributes(storeId, query, { enabled: canView });
  const createAttributeMutation = useMutation({
    mutationFn: (payload) => createSellerAttribute(storeId, payload),
    onSuccess: () => attributesQuery.refetch(),
  });
  const updateAttributeMutation = useMutation({
    mutationFn: ({ attributeId, payload }) => updateSellerAttribute(storeId, attributeId, payload),
    onSuccess: () => attributesQuery.refetch(),
  });
  const publishAttributeMutation = useMutation({
    mutationFn: ({ attributeId, published }) => setSellerAttributePublished(storeId, attributeId, published),
    onSuccess: () => attributesQuery.refetch(),
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
      catalogMutation={{
        canCreateAttribute: canManageAttributes,
        canUpdateAttribute: canManageAttributes,
        canManageAttributeStatus: canManageAttributes,
        createAttribute: createAttributeMutation.mutateAsync,
        updateAttribute: updateAttributeMutation.mutateAsync,
        setAttributePublished: publishAttributeMutation.mutateAsync,
        creatingAttribute: createAttributeMutation.isPending,
        updatingAttributeId: updateAttributeMutation.isPending ? updateAttributeMutation.variables?.attributeId || null : null,
        statusChangingAttributeId: publishAttributeMutation.isPending ? publishAttributeMutation.variables?.attributeId || null : null,
      }}
    />
  );
}
