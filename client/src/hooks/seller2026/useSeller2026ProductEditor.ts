import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSellerProductAuthoringMeta,
  getSellerProductDetail,
} from "../../api/sellerProducts.ts";
import {
  createSeller2026ProductDraft,
  submitSeller2026ProductReview,
  updateSeller2026ProductDraft,
} from "../../api/seller2026/products.mutations.ts";
import { adaptSeller2026ProductDetail } from "../../api/seller2026/products.adapter.ts";
import {
  adaptSeller2026ProductCategories,
  buildSeller2026ProductDraftPayload,
  createSeller2026ProductEditorForm,
  type Seller2026ProductEditorForm,
  validateSeller2026ProductForm,
} from "../../api/seller2026/productEditor.adapter.ts";

export function useSeller2026ProductEditor({
  storeId,
  productId,
  mode,
  enabled = true,
  canSave = false,
  canSubmit = false,
}: {
  storeId: string | number | null | undefined;
  productId?: string | number | null;
  mode: "create" | "edit";
  enabled?: boolean;
  canSave?: boolean;
  canSubmit?: boolean;
}) {
  const queryClient = useQueryClient();
  const queryEnabled = Boolean(storeId) && enabled;
  const metaQuery = useQuery({
    queryKey: ["seller2026", "product-editor", "meta", storeId],
    queryFn: () => getSellerProductAuthoringMeta(storeId as string | number),
    enabled: queryEnabled,
    retry: false,
  });
  const detailQuery = useQuery({
    queryKey: ["seller2026", "product-detail", storeId, productId],
    queryFn: () => getSellerProductDetail(storeId as string | number, productId as string | number),
    enabled: queryEnabled && mode === "edit" && Boolean(productId),
    retry: false,
  });
  const detail = useMemo(
    () => (detailQuery.data ? adaptSeller2026ProductDetail(detailQuery.data) : null),
    [detailQuery.data]
  );
  const initialForm = useMemo(() => createSeller2026ProductEditorForm(detail), [detail]);
  const [form, setForm] = useState<Seller2026ProductEditorForm>(initialForm);
  const [validation, setValidation] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === "create" || detail) setForm(initialForm);
  }, [detail, initialForm, mode]);

  const saveMutation = useMutation({
    mutationFn: async (current: Seller2026ProductEditorForm) => {
      if (!canSave || !storeId) throw new Error("Draft saving is not available.");
      const errors = validateSeller2026ProductForm(current);
      setValidation(errors);
      if (Object.keys(errors).length) throw new Error("Complete the required product fields.");
      const payload = buildSeller2026ProductDraftPayload(current);
      return mode === "edit" && productId
        ? updateSeller2026ProductDraft({ storeId, productId, payload })
        : createSeller2026ProductDraft({ storeId, payload });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller2026", "products"] });
      void queryClient.invalidateQueries({ queryKey: ["seller2026", "product-detail"] });
    },
  });
  const submitMutation = useMutation({
    mutationFn: async (id: string | number) => {
      if (!canSubmit || !storeId || !id) throw new Error("Review submission is not available.");
      const result = await submitSeller2026ProductReview({ storeId, productId: id });
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller2026", "products"] });
      void queryClient.invalidateQueries({ queryKey: ["seller2026", "product-detail"] });
    },
  });

  return {
    form,
    setForm,
    detail,
    categories: adaptSeller2026ProductCategories(metaQuery.data),
    validation,
    isLoading: metaQuery.isLoading || (mode === "edit" && detailQuery.isLoading),
    isError: metaQuery.isError || detailQuery.isError,
    error: metaQuery.error || detailQuery.error,
    isSaving: saveMutation.isPending,
    isSubmitting: submitMutation.isPending,
    saveError: saveMutation.error,
    submitError: submitMutation.error,
    saveDraft: () => saveMutation.mutateAsync(form),
    submitForReview: (id: string | number) => submitMutation.mutateAsync(id),
    resetForm: () => {
      setValidation({});
      setForm(initialForm);
    },
  };
}

