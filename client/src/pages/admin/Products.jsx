import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  approveAdminProductReview,
  bulkAdminProducts,
  deleteAdminProduct,
  duplicateAdminProduct,
  exportAdminProducts,
  fetchAdminCategories,
  fetchAdminProducts,
  importAdminProducts,
  requestAdminProductRevision,
  updateAdminProductPublished,
} from "../../lib/adminApi.js";
import { useAuth } from "../../auth/useAuth.js";
import { can } from "../../constants/permissions.js";
import AdminProducts2026View from "./products2026/AdminProducts2026View.jsx";
import {
  DEFAULT_PRODUCTS_2026_FILTERS,
  PRODUCT_LIST_LIMIT,
  buildAdminProducts2026Params,
  computeAdminProducts2026Stats,
  downloadAdminProducts2026Export,
  normalizeAdminCategories2026,
  normalizeAdminProducts2026,
} from "./products2026/adminProducts2026Adapter.js";

const normalizeErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const readFiltersFromSearch = (searchParams) => ({
  q: searchParams.get("q") || DEFAULT_PRODUCTS_2026_FILTERS.q,
  categoryId: searchParams.get("categoryId") || DEFAULT_PRODUCTS_2026_FILTERS.categoryId,
  published: searchParams.get("published") || DEFAULT_PRODUCTS_2026_FILTERS.published,
  stock: searchParams.get("stock") || DEFAULT_PRODUCTS_2026_FILTERS.stock,
  sort: searchParams.get("sort") || DEFAULT_PRODUCTS_2026_FILTERS.sort,
});

const readPageFromSearch = (searchParams) => {
  const page = Number(searchParams.get("page") || 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(() => readPageFromSearch(searchParams));
  const [filters, setFilters] = useState(() => readFiltersFromSearch(searchParams));
  const [selectedIds, setSelectedIds] = useState([]);
  const [updatingIds, setUpdatingIds] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const permissions = useMemo(
    () => ({
      canCreate: can(user, "PRODUCTS_CREATE"),
      canUpdate: can(user, "PRODUCTS_UPDATE"),
      canDelete: can(user, "PRODUCTS_DELETE"),
    }),
    [user]
  );

  useEffect(() => {
    const next = new URLSearchParams();
    if (page > 1) next.set("page", String(page));
    Object.entries(filters).forEach(([key, value]) => {
      const fallback = DEFAULT_PRODUCTS_2026_FILTERS[key];
      if (value && value !== fallback) next.set(key, String(value));
    });
    setSearchParams(next, { replace: true });
  }, [filters, page, setSearchParams]);

  const params = useMemo(
    () => buildAdminProducts2026Params({ filters, page, limit: PRODUCT_LIST_LIMIT }),
    [filters, page]
  );

  const productsQuery = useQuery({
    queryKey: ["admin-products", "2026", params],
    queryFn: () => fetchAdminProducts(params),
    keepPreviousData: true,
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories-filter", "2026"],
    queryFn: () => fetchAdminCategories({ page: 1, limit: 250 }),
  });

  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: ["admin-products"] });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: () => {
      toast.success("Product deleted.");
      setSelectedIds([]);
      invalidateProducts();
    },
    onError: (error) => toast.error(normalizeErrorMessage(error, "Failed to delete product.")),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }) => updateAdminProductPublished(id, published),
    onMutate: ({ id }) => setUpdatingIds((prev) => Array.from(new Set([...prev, Number(id)]))),
    onSuccess: (_data, variables) => {
      toast.success(variables.published ? "Product published." : "Product unpublished.");
      invalidateProducts();
    },
    onError: (error) => toast.error(normalizeErrorMessage(error, "Failed to update publish state.")),
    onSettled: (_data, _error, variables) =>
      setUpdatingIds((prev) => prev.filter((id) => id !== Number(variables?.id))),
  });

  const approveReviewMutation = useMutation({
    mutationFn: approveAdminProductReview,
    onMutate: (id) => setUpdatingIds((prev) => Array.from(new Set([...prev, Number(id)]))),
    onSuccess: () => {
      toast.success("Product review approved. Product is active and ready for publish.");
      invalidateProducts();
    },
    onError: (error) => toast.error(normalizeErrorMessage(error, "Failed to approve product review.")),
    onSettled: (_data, _error, id) =>
      setUpdatingIds((prev) => prev.filter((entry) => entry !== Number(id))),
  });

  const requestRevisionMutation = useMutation({
    mutationFn: ({ id, note }) => requestAdminProductRevision(id, note),
    onMutate: ({ id }) => setUpdatingIds((prev) => Array.from(new Set([...prev, Number(id)]))),
    onSuccess: () => {
      toast.success("Revision requested from seller.");
      invalidateProducts();
    },
    onError: (error) => toast.error(normalizeErrorMessage(error, "Failed to request revision.")),
    onSettled: (_data, _error, variables) =>
      setUpdatingIds((prev) => prev.filter((entry) => entry !== Number(variables?.id))),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ action, ids }) => bulkAdminProducts(action, ids),
    onSuccess: (payload, variables) => {
      const affected = Number(payload?.affected || 0);
      const label =
        variables.action === "delete"
          ? "deleted"
          : variables.action === "publish"
            ? "published"
            : "unpublished";
      toast.success(affected > 0 ? `${affected} product(s) ${label}.` : `Selected products ${label}.`);
      setSelectedIds([]);
      invalidateProducts();
    },
    onError: (error) => toast.error(normalizeErrorMessage(error, "Bulk action failed.")),
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateAdminProduct,
    onSuccess: () => {
      toast.success("Product duplicated.");
      invalidateProducts();
    },
    onError: (error) => toast.error(normalizeErrorMessage(error, "Failed to duplicate product.")),
  });

  const products = useMemo(
    () => normalizeAdminProducts2026(productsQuery.data?.data || []),
    [productsQuery.data?.data]
  );
  const categories = useMemo(
    () => normalizeAdminCategories2026(categoriesQuery.data),
    [categoriesQuery.data]
  );
  const meta = productsQuery.data?.meta || {
    page,
    limit: PRODUCT_LIST_LIMIT,
    total: products.length,
    totalPages: 1,
  };
  const stats = useMemo(() => computeAdminProducts2026Stats({ products, meta }), [meta, products]);

  const operationState = {
    busy:
      deleteMutation.isPending ||
      publishMutation.isPending ||
      approveReviewMutation.isPending ||
      requestRevisionMutation.isPending ||
      bulkMutation.isPending ||
      duplicateMutation.isPending ||
      isExporting ||
      isImporting,
    exporting: isExporting,
    importing: isImporting,
  };

  const updateFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
    setSelectedIds([]);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_PRODUCTS_2026_FILTERS);
    setPage(1);
    setSelectedIds([]);
  };

  const selectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev.map(Number));
      if (next.has(Number(id))) next.delete(Number(id));
      else next.add(Number(id));
      return Array.from(next);
    });
  };

  const selectAll = (ids, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev.map(Number));
      ids.map(Number).forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return Array.from(next);
    });
  };

  const openProduct = (product) => {
    navigate(`/admin/catalog/products/${encodeURIComponent(String(product.id))}`);
  };

  const editProduct = (product) => {
    if (!permissions.canUpdate) return;
    navigate(`/admin/catalog/products/${encodeURIComponent(String(product.id))}/edit`);
  };

  const manageProductInventory = (product) => {
    if (!permissions.canUpdate) return;
    navigate(`/admin/catalog/products/${encodeURIComponent(String(product.id))}/edit#pricing-stock`);
  };

  const manageProductVariants = (product) => {
    if (!permissions.canUpdate) return;
    navigate(`/admin/catalog/products/${encodeURIComponent(String(product.id))}/edit#variants`);
  };

  const deleteProduct = (product) => {
    if (!permissions.canDelete) return toast.error("You do not have permission to delete products.");
    const confirmed = window.confirm(`Delete "${product.name}"? This action cannot be undone.`);
    if (!confirmed) return;
    deleteMutation.mutate(product.id);
  };

  const duplicateProduct = (product) => {
    if (!permissions.canCreate) return toast.error("You do not have permission to duplicate products.");
    duplicateMutation.mutate(product.id);
  };

  const approveProduct = (product) => {
    if (!permissions.canUpdate) return toast.error("You do not have permission to approve products.");
    if (product.sellerSubmissionStatus !== "submitted") {
      return toast.error("Only submitted seller products can be approved.");
    }
    approveReviewMutation.mutate(product.id);
  };

  const requestRevision = (product) => {
    if (!permissions.canUpdate) return toast.error("You do not have permission to request revisions.");
    if (product.sellerSubmissionStatus !== "submitted") {
      return toast.error("Only submitted seller products can be moved to revision.");
    }
    const note = window.prompt("Revision note for seller (optional):", "");
    if (note === null) return;
    requestRevisionMutation.mutate({ id: product.id, note });
  };

  const togglePublished = (product) => {
    if (!permissions.canUpdate) return toast.error("You do not have permission to update products.");
    if (!product.canUseListToggle) {
      return toast.error("Submitted seller products must be approved from the review action first.");
    }
    publishMutation.mutate({ id: product.id, published: !product.published });
  };

  const exportProducts = async (format = "json") => {
    try {
      setIsExporting(true);
      const response = await exportAdminProducts({ ...params, format });
      const filename = await downloadAdminProducts2026Export(
        response,
        `admin-products-${new Date().toISOString().slice(0, 10)}.${format}`
      );
      toast.success(`Products exported as ${filename}.`);
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Failed to export products."));
    } finally {
      setIsExporting(false);
    }
  };

  const importProducts = async (file) => {
    if (!permissions.canCreate) return toast.error("You do not have permission to import products.");
    try {
      setIsImporting(true);
      await importAdminProducts(file);
      toast.success("Products imported.");
      invalidateProducts();
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Failed to import products."));
    } finally {
      setIsImporting(false);
    }
  };

  const runBulkAction = (action) => {
    const ids = selectedIds.map(Number).filter(Boolean);
    if (ids.length === 0) return toast.error("Select at least one product first.");
    if ((action === "publish" || action === "unpublish") && !permissions.canUpdate) {
      return toast.error("You do not have permission to update products.");
    }
    if (action === "delete" && !permissions.canDelete) {
      return toast.error("You do not have permission to delete products.");
    }

    if (action === "delete") {
      const confirmed = window.confirm(`Delete ${ids.length} selected product(s)? This action cannot be undone.`);
      if (!confirmed) return;
    }

    bulkMutation.mutate({ action, ids });
  };

  return (
    <AdminProducts2026View
      products={products}
      categories={categories}
      filters={filters}
      stats={stats}
      meta={meta}
      permissions={permissions}
      selectedIds={selectedIds}
      updatingIds={updatingIds}
      operationState={operationState}
      isLoading={productsQuery.isLoading}
      isFetching={productsQuery.isFetching && !productsQuery.isLoading}
      isError={productsQuery.isError}
      errorMessage={normalizeErrorMessage(productsQuery.error, "The product list is unavailable.")}
      onRetry={() => productsQuery.refetch()}
      onFilterChange={updateFilters}
      onResetFilters={resetFilters}
      onSelectOne={selectOne}
      onSelectAll={selectAll}
      onAddProduct={() => navigate("/admin/catalog/products/new")}
      onViewProduct={openProduct}
      onEditProduct={editProduct}
      onManageInventory={manageProductInventory}
      onManageVariants={manageProductVariants}
      onDuplicateProduct={duplicateProduct}
      onApproveProduct={approveProduct}
      onRequestRevision={requestRevision}
      onDeleteProduct={deleteProduct}
      onTogglePublished={togglePublished}
      onExport={exportProducts}
      onImportFile={importProducts}
      onBulkAction={runBulkAction}
      onPageChange={setPage}
    />
  );
}
