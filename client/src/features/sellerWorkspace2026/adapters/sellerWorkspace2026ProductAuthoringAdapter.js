// Adapter to handle Product Authoring for Seller Workspace 2026 live mode
import { getSellerWorkspaceContextBySlug } from "../../../api/sellerWorkspace.ts";
import { createSellerProductDraft, updateSellerProductDraft, submitSellerProductDraftForReview } from "../../../api/sellerProducts.ts";
import { getProductAuthoringFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

// 1. Resolve storeSlug to storeId
// 2. Return the initial View Model state
export const fetchSellerWorkspace2026ProductAuthoringContext = async (storeSlug) => {
  try {
    const context = await getSellerWorkspaceContextBySlug(storeSlug);
    if (!context || !context.store) {
      return getProductAuthoringFallback();
    }

    return {
      store: {
        id: context.store.id,
        slug: context.store.slug,
        name: context.store.name,
        status: context.store.status,
      },
      form: {
        title: "",
        description: "",
        categoryId: "",
        categoryLabel: "",
        brand: "",
        sku: "",
        barcode: "",
        productType: "",
        condition: "baru",
        warranty: "",
        origin: "lokal",
        price: "",
        compareAtPrice: "",
        stock: "",
        weight: "",
        media: [],
        variants: [],
        seoTitle: "",
        seoDescription: "",
        shipping: ""
      },
      validation: {
        completeness: 0,
        requiredMissing: [],
        warnings: [],
        canSaveDraft: true,
        canSubmitReview: false,
      },
      meta: {
        mode: "create",
        productId: null,
        status: "draft",
        reviewStatus: "none",
        usingLiveData: true
      }
    };
  } catch (error) {
    return getProductAuthoringFallback();
  }
};

// 3. Mapper form UI 2026 -> payload API existing
export const mapAuthoringFormToDraftPayload = (form, storeContext) => {
  return {
    name: form.title,
    description: form.description || null,
    sku: form.sku || null,
    barcode: form.barcode || null,
    categoryIds: form.categoryId ? [Number(form.categoryId)] : [],
    defaultCategoryId: form.categoryId ? Number(form.categoryId) : null,
    price: Number(form.price) || 0,
    stock: Number(form.stock) || 0,
    imageUrls: form.media || [],
    tags: []
  };
};

export const mapDraftResponseToViewModel = (response) => {
  return {
    productId: response?.id,
    title: response?.name,
    sku: response?.sku,
    status: response?.status,
    reviewStatus: response?.submissionStatus,
  };
};

// 5. Save Draft
export const saveProductDraft = async ({ storeId, form, productId }) => {
  const payload = mapAuthoringFormToDraftPayload(form, null);
  if (productId) {
    const result = await updateSellerProductDraft(storeId, productId, payload);
    return mapDraftResponseToViewModel(result);
  } else {
    const result = await createSellerProductDraft(storeId, payload);
    return mapDraftResponseToViewModel(result);
  }
};

// 6. Submit for Review
export const submitProductForReview = async ({ storeId, productId }) => {
  const result = await submitSellerProductDraftForReview(storeId, productId);
  return mapDraftResponseToViewModel(result);
};
