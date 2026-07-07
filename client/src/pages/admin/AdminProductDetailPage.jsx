import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  deleteAdminProduct,
  duplicateAdminProduct,
  fetchAdminProduct,
  requestAdminProductRevision,
  toggleAdminProductPublish,
} from "../../lib/adminApi.js";
import { useAuth } from "../../auth/useAuth.js";
import { can } from "../../constants/permissions.js";
import AdminProductDetail2026View from "./productDetail2026/AdminProductDetail2026View.jsx";
import {
  getDuplicatedProductId,
  normalizeAdminProductDetail2026,
} from "./productDetail2026/adminProductDetail2026Adapter.js";

const productListPath = "/admin/catalog/products";

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function AdminProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth() || {};
  const detailKey = useMemo(() => ["admin", "products", "detail", String(id || "")], [id]);

  const permissions = useMemo(
    () => ({
      canUpdate: can(user, "PRODUCTS_UPDATE"),
      canDelete: can(user, "PRODUCTS_DELETE"),
    }),
    [user]
  );

  const detailQuery = useQuery({
    queryKey: detailKey,
    queryFn: () => fetchAdminProduct(id),
    enabled: Boolean(id),
    retry: 1,
  });

  const product = useMemo(
    () => normalizeAdminProductDetail2026(detailQuery.data),
    [detailQuery.data]
  );

  const invalidateProductQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
      queryClient.invalidateQueries({ queryKey: detailKey }),
    ]);
  };

  const publishMutation = useMutation({
    mutationFn: ({ productId, published }) =>
      toggleAdminProductPublish(productId, published),
    onSuccess: async (_payload, variables) => {
      toast.success(variables.published ? "Product published." : "Product unpublished.");
      await invalidateProductQueries();
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Failed to update the publication status.")),
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateAdminProduct,
    onSuccess: async (payload) => {
      const duplicatedId = getDuplicatedProductId(payload);
      toast.success("Product duplicated as a new draft.");
      await invalidateProductQueries();
      if (duplicatedId) {
        navigate(`${productListPath}/${encodeURIComponent(String(duplicatedId))}`);
      }
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to duplicate product.")),
  });

  const revisionMutation = useMutation({
    mutationFn: ({ productId, note }) => requestAdminProductRevision(productId, note),
    onSuccess: async () => {
      toast.success("Revision request sent to the seller.");
      await invalidateProductQueries();
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Failed to request a product revision.")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: async () => {
      toast.success("Product deleted.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      navigate(productListPath, { replace: true });
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to delete product.")),
  });

  const requireUpdate = (callback) => {
    if (!permissions.canUpdate) {
      toast.error("You do not have permission to update products.");
      return;
    }
    callback();
  };

  const requireDelete = (callback) => {
    if (!permissions.canDelete) {
      toast.error("You do not have permission to delete products.");
      return;
    }
    callback();
  };

  const encodedId = encodeURIComponent(String(product?.id ?? id ?? ""));
  const editPath = `${productListPath}/${encodedId}/edit`;
  const operation = {
    busy:
      publishMutation.isPending ||
      duplicateMutation.isPending ||
      revisionMutation.isPending ||
      deleteMutation.isPending,
    label: publishMutation.isPending
      ? "Updating publication status…"
      : duplicateMutation.isPending
        ? "Duplicating product…"
        : revisionMutation.isPending
          ? "Sending revision request…"
          : deleteMutation.isPending
            ? "Deleting product…"
            : "",
  };

  const actions = {
    onRetry: () => detailQuery.refetch(),
    onBack: () => navigate(productListPath),
    onEdit: () => requireUpdate(() => navigate(editPath)),
    onManageVariants: () => requireUpdate(() => navigate(`${editPath}#variants`)),
    onManageInventory: () => requireUpdate(() => navigate(`${editPath}#pricing-stock`)),
    onViewStore: () => {
      if (!product?.slug) {
        toast.error("This product does not have a storefront slug yet.");
        return;
      }
      window.open(`/product/${encodeURIComponent(product.slug)}`, "_blank", "noopener,noreferrer");
    },
    onTogglePublish: () =>
      requireUpdate(() =>
        publishMutation.mutate({ productId: product.id, published: !product.published })
      ),
    onDuplicate: () => requireUpdate(() => duplicateMutation.mutate(product.id)),
    onRequestRevision: () =>
      requireUpdate(() => {
        if (product.submissionStatus !== "submitted") {
          toast.error("Only submitted seller products can be moved into revision.");
          return;
        }
        const note = window.prompt(
          "Describe the changes the seller needs to make:",
          product.revisionNote || ""
        );
        if (note === null) return;
        const normalizedNote = note.trim();
        if (!normalizedNote) {
          toast.error("A revision note is required.");
          return;
        }
        revisionMutation.mutate({ productId: product.id, note: normalizedNote });
      }),
    onDelete: () =>
      requireDelete(() => {
        const confirmed = window.confirm(
          `Delete “${product.name}”? This action cannot be undone.`
        );
        if (confirmed) deleteMutation.mutate(product.id);
      }),
  };

  return (
    <AdminProductDetail2026View
      product={product}
      loading={detailQuery.isLoading}
      error={
        detailQuery.isError
          ? errorMessage(detailQuery.error, "Failed to load product details.")
          : ""
      }
      permissions={permissions}
      operation={operation}
      actions={actions}
    />
  );
}
