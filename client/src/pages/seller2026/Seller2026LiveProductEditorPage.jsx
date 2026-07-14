import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Check, Package } from "lucide-react";
import { SELLER_2026_MUTATIONS } from "../../api/seller2026/mutation-flags.ts";
import { hasSeller2026Permission } from "../../api/seller2026/permissions.ts";
import {
  createSeller2026ProductDraft,
  submitSeller2026ProductReview,
  updateSeller2026ProductDraft,
} from "../../api/seller2026/products.mutations.ts";
import { getSellerAttributes, getSellerAttributeValues } from "../../api/sellerAttributes.ts";
import {
  getSellerProductAuthoringMeta,
  getSellerProductDetail,
  uploadSellerProductImage,
} from "../../api/sellerProducts.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import AdminProductForm2026View from "../admin/productForm2026/AdminProductForm2026View.jsx";
import {
  createInitialProductForm2026Meta,
  getCreatedAdminProductId,
  toOptionalNumber,
} from "../admin/productForm2026/adminProductForm2026Adapter.js";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PRODUCT_IMAGES = 5;
const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
const PRODUCT_TYPE_VALUES = new Set(["physical", "digital", "service"]);

const defaultSeoState = {
  metaTitle: "",
  metaDescription: "",
  keywords: [],
  ogImageUrl: "",
};

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const readImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const width = Number(image.naturalWidth || image.width || 0);
      const height = Number(image.naturalHeight || image.height || 0);
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to read image dimensions."));
    };
    image.src = objectUrl;
  });

const normalizeSelectedCategoryIds = (value) =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((entry) => Number(entry))
        .filter((entry) => Number.isInteger(entry) && entry > 0)
    )
  );

const resolveDefaultCategoryId = (categoryIds, currentDefaultCategoryId) => {
  const normalizedIds = normalizeSelectedCategoryIds(categoryIds);
  const normalizedDefault = Number(currentDefaultCategoryId);
  if (!normalizedIds.length) return null;
  if (Number.isInteger(normalizedDefault) && normalizedIds.includes(normalizedDefault)) {
    return normalizedDefault;
  }
  return normalizedIds[0];
};

const normalizeVariantNumber = (value) => {
  if (value === null || typeof value === "undefined" || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeVariantQuantity = (value) => {
  if (value === null || typeof value === "undefined" || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
};

const resolveSalePriceValue = (value) =>
  String(value ?? "").trim() === "" ? null : Number(value);

const normalizeProductTypeMeta = (value, fallback = "physical") => {
  const normalized = String(value || "").trim().toLowerCase();
  return PRODUCT_TYPE_VALUES.has(normalized) ? normalized : fallback;
};

const normalizeSeoState = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultSeoState;
  const keywords = Array.isArray(value.keywords)
    ? value.keywords
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
        .filter(
          (entry, index, list) =>
            list.findIndex((item) => item.toLowerCase() === entry.toLowerCase()) === index
        )
    : [];

  return {
    metaTitle: String(value.metaTitle || value.title || value.seoTitle || "").trim(),
    metaDescription: String(
      value.metaDescription || value.description || value.seoDescription || ""
    ).trim(),
    keywords,
    ogImageUrl: String(value.ogImageUrl || "").trim(),
  };
};

const buildVariantCombination = (selections) =>
  selections.map((entry) => entry.value).filter(Boolean).join(" / ");

const buildVariantCombinationKey = (selections) =>
  selections
    .map((entry) => `${entry.attributeId}:${String(entry.valueId ?? entry.value).trim().toLowerCase()}`)
    .join("|");

const buildCartesianProduct = (attributesWithValues) => {
  if (!Array.isArray(attributesWithValues) || attributesWithValues.length === 0) return [];
  return attributesWithValues.reduce(
    (acc, attributeGroup) => {
      const next = [];
      acc.forEach((prefix) => {
        attributeGroup.values.forEach((value) => {
          next.push([
            ...prefix,
            {
              attributeId: attributeGroup.attribute.id,
              attributeName: attributeGroup.attribute.name,
              valueId: value.id ?? null,
              value: value.value,
              label: value.label ?? value.value,
            },
          ]);
        });
      });
      return next;
    },
    [[]]
  );
};

const normalizeVariationState = (value) => {
  if (!value) {
    return {
      hasVariants: false,
      selectedAttributes: [],
      selectedAttributeValues: [],
      variants: [],
    };
  }
  if (typeof value === "string") {
    try {
      return normalizeVariationState(JSON.parse(value));
    } catch {
      return normalizeVariationState(null);
    }
  }

  const raw = Array.isArray(value) ? { hasVariants: value.length > 0, variants: value } : value;
  const selectedAttributesMap = new Map();
  (Array.isArray(raw?.selectedAttributes) ? raw.selectedAttributes : []).forEach((entry) => {
    const id = Number(entry?.id);
    const name = String(entry?.name || "").trim();
    if (Number.isInteger(id) && id > 0 && name) selectedAttributesMap.set(id, { id, name });
  });

  const selectedAttributeValuesMap = new Map();
  (Array.isArray(raw?.selectedAttributeValues) ? raw.selectedAttributeValues : []).forEach((entry) => {
    const attributeId = Number(entry?.attributeId);
    if (!Number.isInteger(attributeId) || attributeId <= 0) return;
    const values = Array.isArray(entry?.values)
      ? entry.values
          .map((item) => {
            const valueText = String(item?.value ?? item?.label ?? "").trim();
            if (!valueText) return null;
            return {
              id: item?.id ?? null,
              label: String(item?.label ?? valueText).trim(),
              value: valueText,
            };
          })
          .filter(Boolean)
      : [];
    selectedAttributeValuesMap.set(attributeId, { attributeId, values });
  });

  const variants = (Array.isArray(raw?.variants) ? raw.variants : [])
    .map((entry, index) => {
      const selections = Array.isArray(entry?.selections)
        ? entry.selections
            .map((selection) => {
              const attributeId = Number(selection?.attributeId);
              const attributeName = String(selection?.attributeName || "").trim();
              const value = String(selection?.value || "").trim();
              if (!Number.isInteger(attributeId) || attributeId <= 0 || !attributeName || !value) return null;
              const valueId = selection?.valueId ?? null;
              selectedAttributesMap.set(attributeId, { id: attributeId, name: attributeName });
              const existing = selectedAttributeValuesMap.get(attributeId) || { attributeId, values: [] };
              const dedupeKey = String(valueId ?? value).toLowerCase();
              if (!existing.values.some((item) => String(item.id ?? item.value).toLowerCase() === dedupeKey)) {
                existing.values.push({ id: valueId, label: value, value });
              }
              selectedAttributeValuesMap.set(attributeId, existing);
              return { attributeId, attributeName, valueId, value };
            })
            .filter(Boolean)
        : [];

      const combination = String(entry?.combination || buildVariantCombination(selections)).trim();
      const combinationKey = String(entry?.combinationKey || buildVariantCombinationKey(selections)).trim();
      if (!combination || !combinationKey) return null;
      return {
        id: String(entry?.id || `variant-${index + 1}`),
        combination,
        combinationKey,
        selections,
        sku: String(entry?.sku || ""),
        barcode: String(entry?.barcode || ""),
        price: normalizeVariantNumber(entry?.price),
        salePrice: normalizeVariantNumber(entry?.salePrice),
        quantity: normalizeVariantQuantity(entry?.quantity),
        image: entry?.image ? String(entry.image) : null,
      };
    })
    .filter(Boolean);

  return {
    hasVariants: Boolean(raw?.hasVariants) || variants.length > 0,
    selectedAttributes: Array.from(selectedAttributesMap.values()),
    selectedAttributeValues: Array.from(selectedAttributeValuesMap.values()),
    variants,
  };
};

function ProductEditorState({ type, message, onRetry }) {
  return (
    <main className={`apf26-form-state is-${type}`} role={type === "error" ? "alert" : "status"}>
      <span className="apf26-form-state__icon">
        {type === "loading" ? <span className="apf26-loader" /> : <Package size={28} />}
      </span>
      <h2>{type === "loading" ? "Loading product data" : "Unable to load product editor"}</h2>
      <p>{message}</p>
      {type === "error" ? (
        <button type="button" className="apf26-button apf26-button--primary" onClick={onRetry}>
          Try Again
        </button>
      ) : null}
    </main>
  );
}

export default function Seller2026LiveProductEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { productId } = useParams();
  const fileInputRef = useRef(null);
  const localImagesRef = useRef([]);
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes } = useSellerWorkspaceRoute();
  const { permissions, sourceAvailable, can } = getSeller2026PagePermissions(sellerContext);
  const savePermission = mode === "edit" ? "CATALOG_PRODUCT_UPDATE" : "CATALOG_PRODUCT_CREATE";
  const canSave =
    sourceAvailable &&
    hasSeller2026Permission(permissions, savePermission) &&
    SELLER_2026_MUTATIONS.productDraftSave;
  const canSubmit =
    sourceAvailable &&
    hasSeller2026Permission(permissions, "CATALOG_PRODUCT_SUBMIT") &&
    SELLER_2026_MUTATIONS.productSubmitReview;
  const isEdit = mode === "edit" && Boolean(productId);
  const queryEnabled = Boolean(storeId);

  const metaQuery = useQuery({
    queryKey: ["seller2026", "product-editor", "meta", storeId],
    queryFn: () => getSellerProductAuthoringMeta(storeId),
    enabled: queryEnabled,
    retry: false,
  });
  const detailQuery = useQuery({
    queryKey: ["seller2026", "product-detail", storeId, productId],
    queryFn: () => getSellerProductDetail(storeId, productId),
    enabled: queryEnabled && isEdit && can("CATALOG_PRODUCT_READ"),
    retry: false,
  });
  const attributesQuery = useQuery({
    queryKey: ["seller2026", "product-editor", "attributes", storeId],
    queryFn: () => getSellerAttributes(storeId, { page: 1, limit: 250, published: "true", status: "active" }),
    enabled: queryEnabled,
    retry: false,
  });

  const sellerStore = useMemo(
    () => ({
      id: Number(storeId) || storeId || "",
      name: sellerContext?.store?.name || "Current Store",
      slug: sellerContext?.store?.slug || "",
    }),
    [sellerContext?.store?.name, sellerContext?.store?.slug, storeId]
  );
  const categories = useMemo(
    () =>
      (metaQuery.data?.references?.categories || []).map((category) => ({
        id: Number(category.id),
        name: category.name,
        code: category.code || "",
        parentId: category.parentId || null,
        published: Boolean(category.published ?? true),
      })),
    [metaQuery.data]
  );
  const attributes = Array.isArray(attributesQuery.data?.data) ? attributesQuery.data.data : [];

  const [notice, setNotice] = useState(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [maxVisitedWizardStep, setMaxVisitedWizardStep] = useState(1);
  const [createdProduct, setCreatedProduct] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [seoKeywordInput, setSeoKeywordInput] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [localImages, setLocalImages] = useState([]);
  const [seo, setSeo] = useState(defaultSeoState);
  const [form, setForm] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    storeId: String(storeId || ""),
    categoryIds: [],
    defaultCategoryId: null,
    price: "",
    salePrice: "",
    stock: "",
    slug: "",
    tags: [],
    status: "draft",
    imageUrl: "",
  });
  const [form2026Meta, setForm2026Meta] = useState(createInitialProductForm2026Meta);
  const [hasVariants, setHasVariants] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState([]);
  const [variants, setVariants] = useState([]);
  const [pendingAttributeId, setPendingAttributeId] = useState("");
  const [attributeSearch, setAttributeSearch] = useState("");
  const [attributeValueSearch, setAttributeValueSearch] = useState({});
  const [attributeValuesMap, setAttributeValuesMap] = useState({});
  const [attributeValuesLoading, setAttributeValuesLoading] = useState(false);
  const [variantImageUploadingId, setVariantImageUploadingId] = useState(null);

  useEffect(() => {
    if (storeId) setForm((prev) => ({ ...prev, storeId: String(storeId) }));
  }, [storeId]);

  useEffect(() => {
    if (!isEdit || !detailQuery.data) return;
    const product = detailQuery.data;
    const assignedCategories = Array.isArray(product.category?.assigned)
      ? product.category.assigned
      : [];
    const initialCategoryIds = normalizeSelectedCategoryIds(
      assignedCategories.length
        ? assignedCategories.map((category) => category.id)
        : product.category?.default?.id
          ? [product.category.default.id]
          : product.category?.primary?.id
            ? [product.category.primary.id]
            : []
    );
    const initialDefaultCategoryId = resolveDefaultCategoryId(
      initialCategoryIds,
      product.category?.default?.id ?? product.category?.primary?.id ?? null
    );
    const initialImages = Array.isArray(product.media?.imageUrls)
      ? product.media.imageUrls.filter(Boolean)
      : [];
    const variationState = normalizeVariationState(product.variations?.raw ?? product.variations);
    const initialSeo = normalizeSeoState(product.seo);
    const initialProductType = normalizeProductTypeMeta(
      product.productType ?? product.seo?.productType
    );
    const dimensions = product.attributes?.dimensions || {};

    setForm({
      name: product.name || "",
      description: product.descriptions?.description || product.description || "",
      sku: product.sku || "",
      barcode: product.attributes?.barcode || product.barcode || "",
      storeId: String(storeId || product.storeId || ""),
      categoryIds: initialCategoryIds,
      defaultCategoryId: initialDefaultCategoryId,
      price: String(product.pricing?.price ?? product.price ?? ""),
      salePrice: String(product.pricing?.salePrice ?? product.salePrice ?? ""),
      stock: String(product.inventory?.stock ?? product.stock ?? ""),
      slug: product.slug || "",
      tags: Array.isArray(product.attributes?.tags) ? product.attributes.tags : product.tags || [],
      status: product.status || "draft",
      imageUrl: initialImages[0] || "",
    });
    setSeo(initialSeo);
    setHasVariants(variationState.hasVariants);
    setSelectedAttributes(variationState.selectedAttributes);
    setSelectedAttributeValues(variationState.selectedAttributeValues);
    setVariants(variationState.variants);
    setForm2026Meta((prev) => ({
      ...prev,
      productType: initialProductType,
      digitalAssetUrl:
        initialProductType === "digital"
          ? String(product.digitalAssetUrl ?? product.seo?.digitalAssetUrl ?? "")
          : "",
      enablePromoPrice:
        product.pricing?.salePrice !== null &&
        typeof product.pricing?.salePrice !== "undefined" &&
        Number(product.pricing?.salePrice) > 0,
      brand: product.productInfo?.brand || product.brand || "",
      weight: product.attributes?.weight == null ? "" : String(product.attributes.weight),
      length: dimensions.length == null ? "" : String(dimensions.length),
      width: dimensions.width == null ? "" : String(dimensions.width),
      height: dimensions.height == null ? "" : String(dimensions.height),
      additionalNotes: String(product.descriptions?.notes || product.notes || ""),
    }));
    setLocalImages(
      initialImages.slice(0, MAX_PRODUCT_IMAGES).map((imagePath, index) => ({
        id: `remote-${productId}-${index + 1}`,
        name: `Current image ${index + 1}`,
        url: resolveAssetUrl(imagePath),
        file: null,
        remote: true,
        storedUrl: imagePath,
      }))
    );
    setSlugTouched(Boolean(product.slug));
  }, [detailQuery.data, isEdit, productId, storeId]);

  useEffect(() => {
    localImagesRef.current = localImages;
  }, [localImages]);

  useEffect(
    () => () => {
      localImagesRef.current.forEach((image) => {
        if (!image.remote && image.url) URL.revokeObjectURL(image.url);
      });
    },
    []
  );

  useEffect(() => {
    const targetAttributes = selectedAttributes.filter((entry) => !attributeValuesMap[entry.id]);
    if (!storeId || !targetAttributes.length) return undefined;

    let cancelled = false;
    setAttributeValuesLoading(true);
    Promise.all(
      targetAttributes.map(async (attribute) => {
        const response = await getSellerAttributeValues(storeId, attribute.id);
        const items = Array.isArray(response?.data) ? response.data : [];
        return [
          attribute.id,
          items.map((item) => ({
            id: item?.id ?? null,
            label: String(item?.value || "").trim(),
            value: String(item?.value || "").trim(),
          })),
        ];
      })
    )
      .then((entries) => {
        if (cancelled) return;
        setAttributeValuesMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      })
      .catch((error) => {
        if (!cancelled) {
          setNotice({
            type: "error",
            message: error?.response?.data?.message || "Failed to load attribute values.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setAttributeValuesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attributeValuesMap, selectedAttributes, storeId]);

  const selectedCategories = useMemo(() => {
    const selectedIdSet = new Set(normalizeSelectedCategoryIds(form.categoryIds));
    return categories.filter((category) => selectedIdSet.has(Number(category.id)));
  }, [categories, form.categoryIds]);
  const defaultCategoryOptions = selectedCategories;
  const selectedStore = sellerStore;
  const availableAttributes = useMemo(() => {
    const selectedIds = new Set(selectedAttributes.map((entry) => Number(entry.id)));
    const keyword = String(attributeSearch || "").trim().toLowerCase();
    return attributes.filter((attribute) => {
      const id = Number(attribute?.id);
      if (!Number.isInteger(id) || selectedIds.has(id)) return false;
      const name = String(attribute?.displayName || attribute?.display_name || attribute?.name || "").trim();
      if (!keyword) return true;
      return name.toLowerCase().includes(keyword);
    });
  }, [attributeSearch, attributes, selectedAttributes]);

  const saveMutation = useMutation({
    mutationFn: async ({ payload, id }) => {
      if (!canSave || !storeId) throw new Error("Draft saving is not available.");
      return id
        ? updateSeller2026ProductDraft({ storeId, productId: id, payload })
        : createSeller2026ProductDraft({ storeId, payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller2026", "products"] });
      queryClient.invalidateQueries({ queryKey: ["seller2026", "product-detail"] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (id) => {
      if (!canSubmit || !storeId || !id) throw new Error("Review submission is not available.");
      const result = await submitSeller2026ProductReview({ storeId, productId: id });
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller2026", "products"] });
      queryClient.invalidateQueries({ queryKey: ["seller2026", "product-detail"] });
    },
  });

  const isSubmitting = saveMutation.isPending || submitMutation.isPending;
  const persistedId = productId || form.id;

  const updateFormFields = (patch) => {
    if (Object.prototype.hasOwnProperty.call(patch, "slug")) setSlugTouched(true);
    setForm((prev) => ({ ...prev, ...patch, storeId: String(storeId || prev.storeId || "") }));
  };

  const handleNameChange = (value) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: !slugTouched ? slugify(value) : prev.slug,
    }));
  };

  const updateForm2026Meta = (patch) => {
    setForm2026Meta((prev) => ({ ...prev, ...patch }));
  };

  const updateSeoFields = (patch) => {
    setSeo((prev) => ({ ...prev, ...patch }));
  };

  const addFiles = async (files) => {
    const incomingFiles = Array.from(files || []);
    if (!incomingFiles.length) return;
    const existingIds = new Set(localImages.map((item) => item.id));
    const availableSlots = Math.max(0, MAX_PRODUCT_IMAGES - localImages.length);
    if (availableSlots <= 0) {
      setNotice({ type: "error", message: `You can upload up to ${MAX_PRODUCT_IMAGES} product images.` });
      return;
    }

    const nextImages = [];
    let rejectedTypeCount = 0;
    let rejectedSizeCount = 0;
    let rejectedUnreadableCount = 0;
    let skippedDuplicateCount = 0;
    let skippedOverflowCount = 0;
    for (const file of incomingFiles) {
      if (nextImages.length >= availableSlots) {
        skippedOverflowCount += 1;
        continue;
      }
      const idValue = `${file.name}-${file.size}-${file.lastModified}`;
      if (existingIds.has(idValue) || nextImages.some((item) => item.id === idValue)) {
        skippedDuplicateCount += 1;
        continue;
      }
      if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
        rejectedTypeCount += 1;
        continue;
      }
      if (Number(file.size || 0) > MAX_PRODUCT_IMAGE_SIZE) {
        rejectedSizeCount += 1;
        continue;
      }
      try {
        const { width, height } = await readImageDimensions(file);
        if (width <= 0 || height <= 0) {
          rejectedUnreadableCount += 1;
          continue;
        }
      } catch {
        rejectedUnreadableCount += 1;
        continue;
      }
      nextImages.push({
        id: idValue,
        name: file.name,
        url: URL.createObjectURL(file),
        file,
        remote: false,
        storedUrl: null,
      });
    }

    if (nextImages.length) {
      setLocalImages((prev) => {
        const merged = [...prev, ...nextImages];
        setForm2026Meta((meta) => ({ ...meta, coverImageId: meta.coverImageId || merged[0]?.id || null }));
        return merged;
      });
    }
    const messageParts = [];
    if (rejectedTypeCount > 0) {
      messageParts.push(`${rejectedTypeCount} file must be JPG, PNG, or WEBP`);
    }
    if (rejectedSizeCount > 0) {
      messageParts.push(`${rejectedSizeCount} file exceeded the 5MB limit`);
    }
    if (rejectedUnreadableCount > 0) {
      messageParts.push(`${rejectedUnreadableCount} file could not be read as an image`);
    }
    if (skippedDuplicateCount > 0) {
      messageParts.push(`${skippedDuplicateCount} duplicate file skipped`);
    }
    if (skippedOverflowCount > 0) {
      messageParts.push(`${skippedOverflowCount} file exceeded the ${MAX_PRODUCT_IMAGES} image limit`);
    }

    setNotice(
      messageParts.length > 0
        ? { type: nextImages.length ? "warning" : "error", message: messageParts.join(". ") }
        : null
    );
  };

  const removeImage = (imageId) => {
    setLocalImages((prev) => {
      const target = prev.find((item) => item.id === imageId);
      if (target && !target.remote && target.url) URL.revokeObjectURL(target.url);
      const next = prev.filter((item) => item.id !== imageId);
      setForm2026Meta((meta) => {
        const nextMediaDetails = { ...meta.mediaDetails };
        delete nextMediaDetails[imageId];
        return {
          ...meta,
          coverImageId: meta.coverImageId === imageId ? next[0]?.id || null : meta.coverImageId,
          mediaDetails: nextMediaDetails,
        };
      });
      return next;
    });
  };

  const setCoverImage = (imageId) => {
    setForm2026Meta((prev) => ({ ...prev, coverImageId: imageId }));
    setLocalImages((prev) => {
      const target = prev.find((item) => item.id === imageId);
      if (!target) return prev;
      return [target, ...prev.filter((item) => item.id !== imageId)];
    });
  };

  const reorderImages = (sourceImageId, targetImageId) => {
    if (!sourceImageId || !targetImageId || sourceImageId === targetImageId) return;
    setLocalImages((prev) => {
      const sourceIndex = prev.findIndex((item) => item.id === sourceImageId);
      const targetIndex = prev.findIndex((item) => item.id === targetImageId);
      if (sourceIndex < 0 || targetIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const updateMediaDetail = (imageId, patch) => {
    setForm2026Meta((prev) => ({
      ...prev,
      mediaDetails: {
        ...prev.mediaDetails,
        [imageId]: { ...(prev.mediaDetails[imageId] || {}), ...patch },
      },
    }));
  };

  const uploadSelectedImages = async () => {
    const uploadedUrlsById = new Map();
    for (const item of localImages.filter((entry) => !entry.remote && entry.file)) {
      const url = await uploadSellerProductImage(item.file);
      if (url) uploadedUrlsById.set(item.id, url);
    }
    return localImages
      .map((item) => (item.remote ? item.storedUrl || null : uploadedUrlsById.get(item.id) || null))
      .filter(Boolean)
      .slice(0, MAX_PRODUCT_IMAGES);
  };

  const onToggleCategory = (categoryId) => {
    setForm((prev) => {
      const nextCategoryIds = prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((entry) => entry !== categoryId)
        : [...prev.categoryIds, categoryId];
      return {
        ...prev,
        categoryIds: normalizeSelectedCategoryIds(nextCategoryIds),
        defaultCategoryId: resolveDefaultCategoryId(nextCategoryIds, prev.defaultCategoryId),
      };
    });
  };

  const handleTagKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const value = String(tagInput || "").trim();
    if (!value) return;
    setForm((prev) => {
      if (prev.tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) return prev;
      return { ...prev, tags: [...prev.tags, value] };
    });
    setTagInput("");
  };

  const removeTag = (targetTag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== targetTag) }));
  };

  const handleSeoKeywordKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const value = String(seoKeywordInput || "").trim();
    if (!value) return;
    setSeo((prev) => {
      if (prev.keywords.some((keyword) => keyword.toLowerCase() === value.toLowerCase())) return prev;
      return { ...prev, keywords: [...prev.keywords, value] };
    });
    setSeoKeywordInput("");
  };

  const removeSeoKeyword = (targetKeyword) => {
    setSeo((prev) => ({ ...prev, keywords: prev.keywords.filter((keyword) => keyword !== targetKeyword) }));
  };

  const addSelectedAttribute = () => {
    const nextId = Number(pendingAttributeId);
    if (!Number.isInteger(nextId) || nextId <= 0) return;
    const attribute = attributes.find((entry) => Number(entry?.id) === nextId);
    if (!attribute) return;
    setSelectedAttributes((prev) => {
      if (prev.some((entry) => Number(entry.id) === nextId)) return prev;
      return [
        ...prev,
        {
          id: nextId,
          name: String(attribute?.displayName || attribute?.display_name || attribute?.name || "").trim(),
        },
      ];
    });
    setPendingAttributeId("");
  };

  const removeSelectedAttribute = (attributeId) => {
    setSelectedAttributes((prev) => prev.filter((entry) => Number(entry.id) !== Number(attributeId)));
    setSelectedAttributeValues((prev) => prev.filter((entry) => Number(entry.attributeId) !== Number(attributeId)));
    setVariants((prev) =>
      prev.filter(
        (variant) =>
          !variant.selections.some((selection) => Number(selection.attributeId) === Number(attributeId))
      )
    );
  };

  const toggleAttributeValue = (attribute, value) => {
    setSelectedAttributeValues((prev) => {
      const existing = prev.find((entry) => Number(entry.attributeId) === Number(attribute.id));
      const nextValues = existing?.values || [];
      const dedupeKey = String(value.id ?? value.value).toLowerCase();
      const alreadySelected = nextValues.some((entry) => String(entry.id ?? entry.value).toLowerCase() === dedupeKey);
      const updatedValues = alreadySelected
        ? nextValues.filter((entry) => String(entry.id ?? entry.value).toLowerCase() !== dedupeKey)
        : [...nextValues, value];
      const nextEntry = { attributeId: Number(attribute.id), values: updatedValues };
      if (!existing) return [...prev, nextEntry];
      return prev.map((entry) => (Number(entry.attributeId) === Number(attribute.id) ? nextEntry : entry));
    });
  };

  const setAllAttributeValues = (attribute, values) => {
    setSelectedAttributeValues((prev) => {
      const nextEntry = { attributeId: Number(attribute.id), values };
      if (!prev.some((entry) => Number(entry.attributeId) === Number(attribute.id))) return [...prev, nextEntry];
      return prev.map((entry) => (Number(entry.attributeId) === Number(attribute.id) ? nextEntry : entry));
    });
  };

  const handleGenerateVariants = () => {
    if (!selectedAttributes.length) {
      setNotice({ type: "error", message: "Select at least one attribute before generating variants." });
      return;
    }
    const attributesWithValues = selectedAttributes.map((attribute) => ({
      attribute,
      values:
        selectedAttributeValues.find((entry) => Number(entry.attributeId) === Number(attribute.id))?.values || [],
    }));
    if (attributesWithValues.some((entry) => !entry.values.length)) {
      setNotice({ type: "error", message: "Choose at least one value for every selected attribute." });
      return;
    }
    const existingByKey = new Map(variants.map((entry) => [entry.combinationKey, entry]));
    const nextVariants = buildCartesianProduct(attributesWithValues).map((selections, index) => {
      const combination = buildVariantCombination(selections);
      const combinationKey = buildVariantCombinationKey(selections);
      const existing = existingByKey.get(combinationKey);
      if (existing) return { ...existing, selections, combination, combinationKey };
      return {
        id: `variant-${Date.now()}-${index + 1}`,
        combination,
        combinationKey,
        selections,
        sku: "",
        barcode: "",
        price: normalizeVariantNumber(form.price),
        salePrice: resolveSalePriceValue(form.salePrice),
        quantity: normalizeVariantQuantity(form.stock),
        image: localImages[0]?.storedUrl || form.imageUrl || null,
      };
    });
    setVariants(nextVariants);
    setNotice({ type: "success", message: `${nextVariants.length} variant combination(s) prepared.` });
  };

  const handleClearVariants = () => {
    if (!variants.length) return;
    setVariants([]);
  };

  const updateVariantField = (variantId, field, value) => {
    setVariants((prev) => prev.map((variant) => (variant.id === variantId ? { ...variant, [field]: value } : variant)));
  };

  const removeVariant = (variantId) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== variantId));
  };

  const handleVariantImageUpload = async (variantId, file) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setNotice({ type: "error", message: "Variant image must be JPG, PNG, or WEBP." });
      return;
    }
    try {
      setVariantImageUploadingId(variantId);
      const url = await uploadSellerProductImage(file);
      updateVariantField(variantId, "image", url);
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Failed to upload variant image." });
    } finally {
      setVariantImageUploadingId(null);
    }
  };

  const validateWizardStep = (step) => {
    const name = String(form.name || "").trim();
    const sku = String(form.sku || "").trim();
    const price = Number(form.price);
    const stock = Number(form.stock || 0);
    const salePrice = resolveSalePriceValue(form.salePrice);

    if (step === 1) {
      if (!name) return setNotice({ type: "error", message: "Product title is required." }), false;
      if (!sku) return setNotice({ type: "error", message: "Product SKU is required." }), false;
    }
    if (step === 3) {
      if (!Number.isFinite(price) || price <= 0) return setNotice({ type: "error", message: "Product price must be a valid number." }), false;
      if (!Number.isFinite(stock) || stock < 0) return setNotice({ type: "error", message: "Product quantity must be a valid number." }), false;
      if (salePrice != null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice >= price)) {
        return setNotice({ type: "error", message: "Sale price must be lower than product price." }), false;
      }
    }
    if (step === 4 && hasVariants) {
      if (!selectedAttributes.length || !variants.length) return setNotice({ type: "error", message: "Generate at least one variant combination." }), false;
      if (variants.some((variant) => variant.salePrice != null && variant.price != null && Number(variant.salePrice) > Number(variant.price))) {
        return setNotice({ type: "error", message: "Variant sale price cannot be greater than variant price." }), false;
      }
    }
    if (step === 5) {
      if (!form.categoryIds.length) return setNotice({ type: "error", message: "Select at least one category before saving this product." }), false;
      if (!form.defaultCategoryId || !form.categoryIds.includes(Number(form.defaultCategoryId))) {
        return setNotice({ type: "error", message: "Choose one default category from the selected categories." }), false;
      }
      if (form2026Meta.productType === "digital" && !String(form2026Meta.digitalAssetUrl || "").trim()) {
        return setNotice({ type: "error", message: "Digital products require a download link or access instructions." }), false;
      }
    }

    setNotice(null);
    return true;
  };

  const buildPayload = async () => {
    const uploadedUrls = await uploadSelectedImages();
    const variationPayload = hasVariants
      ? {
          hasVariants: true,
          selectedAttributes,
          selectedAttributeValues,
          variants: variants.map((variant) => ({
            id: variant.id,
            combination: variant.combination,
            combinationKey: variant.combinationKey,
            selections: variant.selections,
            sku: String(variant.sku || "").trim() || null,
            barcode: String(variant.barcode || "").trim() || null,
            price: normalizeVariantNumber(variant.price),
            salePrice: resolveSalePriceValue(variant.salePrice),
            quantity: normalizeVariantQuantity(variant.quantity),
            image: variant.image || null,
          })),
        }
      : null;

    return {
      name: String(form.name || "").trim(),
      description: form.description || null,
      sku: String(form.sku || "").trim() || null,
      barcode: form.barcode || null,
      slug: form.slug || slugify(form.name),
      categoryIds: normalizeSelectedCategoryIds(form.categoryIds),
      defaultCategoryId: Number(form.defaultCategoryId) || null,
      price: Number(form.price || 0),
      compareAtPrice: resolveSalePriceValue(form.salePrice),
      stock: Math.floor(Number(form.stock || 0)),
      tags: form.tags,
      imageUrls: uploadedUrls,
      hasVariants,
      variations: variationPayload,
      seoTitle: String(seo.metaTitle || "").trim() || null,
      seoDescription: String(seo.metaDescription || "").trim() || null,
      seoKeywords: seo.keywords,
      ogImageUrl: String(seo.ogImageUrl || "").trim() || null,
      productType: form2026Meta.productType || "physical",
      digitalAssetUrl: form2026Meta.productType === "digital" ? form2026Meta.digitalAssetUrl || null : null,
      weight: toOptionalNumber(form2026Meta.weight) ?? null,
      notes: form2026Meta.additionalNotes || null,
      length: toOptionalNumber(form2026Meta.length) ?? null,
      width: toOptionalNumber(form2026Meta.width) ?? null,
      height: toOptionalNumber(form2026Meta.height) ?? null,
      dimensions:
        form2026Meta.length || form2026Meta.width || form2026Meta.height
          ? {
              length: toOptionalNumber(form2026Meta.length),
              width: toOptionalNumber(form2026Meta.width),
              height: toOptionalNumber(form2026Meta.height),
              unit: form2026Meta.dimensionUnit,
            }
          : null,
    };
  };

  const saveDraftProduct = async ({ silent = false } = {}) => {
    if (![1, 3, 4, 5].every(validateWizardStep)) return null;
    try {
      const payload = await buildPayload();
      const saved = await saveMutation.mutateAsync({ payload, id: persistedId });
      const savedId = saved?.id || saved?.product?.id || saved?.data?.id;
      if (!silent) setNotice({ type: "success", message: "Product draft saved." });
      if (!isEdit && savedId) {
        navigate(workspaceRoutes.productEdit(savedId), { replace: true });
      }
      return savedId || persistedId;
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || error?.message || "Unable to save product." });
      return null;
    }
  };

  const submitForReview = async () => {
    if (![1, 3, 4, 5].every(validateWizardStep)) return;
    try {
      const id = await saveDraftProduct({ silent: true });
      if (!id) return;
      const result = await submitMutation.mutateAsync(id);
      setCreatedProduct(result || { id });
      setWizardStep(6);
      setMaxVisitedWizardStep(6);
      setNotice({ type: "success", message: "Product submitted for admin review." });
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || error?.message || "Unable to submit product." });
    }
  };

  const goToWizardStep = (step) => {
    if (step > maxVisitedWizardStep) return;
    setWizardStep(step);
    setNotice(null);
  };

  const goToNextWizardStep = () => {
    if (!validateWizardStep(wizardStep)) return;
    setWizardStep((prev) => {
      const next = Math.min(6, prev + 1);
      setMaxVisitedWizardStep((visited) => Math.max(visited, next));
      return next;
    });
  };

  const goToPreviousWizardStep = () => {
    setWizardStep((prev) => Math.max(1, prev - 1));
    setNotice(null);
  };

  const createdProductId = getCreatedAdminProductId(createdProduct);

  if (metaQuery.isLoading || (isEdit && detailQuery.isLoading)) {
    return <ProductEditorState type="loading" message="Fetching product authoring data." />;
  }

  if (metaQuery.isError || detailQuery.isError) {
    return (
      <ProductEditorState
        type="error"
        message={
          metaQuery.error?.response?.data?.message ||
          detailQuery.error?.response?.data?.message ||
          "Product authoring is temporarily unavailable."
        }
        onRetry={() => {
          metaQuery.refetch();
          detailQuery.refetch();
        }}
      />
    );
  }

  if (!canSave) {
    return (
      <div className="seller2026-dashboard">
        <div className="seller2026-error">
          <AlertTriangle size={18} />
          Product authoring is not available for your current role.
        </div>
      </div>
    );
  }

  return (
    <AdminProductForm2026View
      workflow="seller"
      isEdit={isEdit}
      activeStep={wizardStep}
      maxVisitedStep={maxVisitedWizardStep}
      form={form}
      seo={seo}
      meta={form2026Meta}
      notice={notice}
      stores={[sellerStore]}
      categories={categories}
      selectedCategories={selectedCategories}
      selectedStore={selectedStore}
      defaultCategoryOptions={defaultCategoryOptions}
      localImages={localImages}
      hasVariants={hasVariants}
      selectedAttributes={selectedAttributes}
      selectedAttributeValues={selectedAttributeValues}
      variants={variants}
      pendingAttributeId={pendingAttributeId}
      attributeSearch={attributeSearch}
      attributeValueSearch={attributeValueSearch}
      attributeValuesMap={attributeValuesMap}
      attributeValuesLoading={attributeValuesLoading}
      variantImageUploadingId={variantImageUploadingId}
      availableAttributes={availableAttributes}
      tagInput={tagInput}
      seoKeywordInput={seoKeywordInput}
      isSubmitting={isSubmitting}
      createdProductId={createdProductId}
      fileInputRef={fileInputRef}
      allowGlobalStoreOption={false}
      storeOwnershipLocked
      saveDraftLabel="Save Draft"
      saveDraftBusyLabel="Saving..."
      finalCreateLabel="Submit for Review"
      finalCreateBusyLabel="Submitting..."
      finalEditLabel="Submit for Review"
      finalEditBusyLabel="Submitting..."
      successTitle="Product Submitted for Review"
      successDescription="Your product is waiting for admin approval before it can be published."
      successPrimaryLabel="View Product"
      successSecondaryLabel="Add Another Product"
      successBackLabel="Back to Products"
      onClose={() => navigate(workspaceRoutes.catalog())}
      onRetry={() => {
        metaQuery.refetch();
        detailQuery.refetch();
      }}
      onStepClick={goToWizardStep}
      onNext={goToNextWizardStep}
      onPrevious={goToPreviousWizardStep}
      onSaveDraft={() => saveDraftProduct()}
      onPublish={submitForReview}
      onViewProduct={() => {
        if (createdProductId) navigate(workspaceRoutes.productDetail(createdProductId));
      }}
      onAddAnother={() => navigate(workspaceRoutes.productCreate(), { replace: true })}
      onBackToList={() => navigate(workspaceRoutes.catalog())}
      onFormChange={updateFormFields}
      onNameChange={handleNameChange}
      onMetaChange={updateForm2026Meta}
      onSeoChange={updateSeoFields}
      onAddFiles={addFiles}
      onRemoveImage={removeImage}
      onSetCover={setCoverImage}
      onReorderImages={reorderImages}
      onMediaDetailChange={updateMediaDetail}
      onToggleHasVariants={() => setHasVariants((prev) => !prev)}
      onPendingAttributeChange={setPendingAttributeId}
      onAttributeSearchChange={setAttributeSearch}
      onAttributeValueSearchChange={(attributeId, value) =>
        setAttributeValueSearch((prev) => ({ ...prev, [attributeId]: value }))
      }
      onAddSelectedAttribute={addSelectedAttribute}
      onRemoveSelectedAttribute={removeSelectedAttribute}
      onToggleAttributeValue={toggleAttributeValue}
      onSelectAllAttributeValues={setAllAttributeValues}
      onClearVariants={handleClearVariants}
      onGenerateVariants={handleGenerateVariants}
      onVariantFieldChange={updateVariantField}
      onRemoveVariant={removeVariant}
      onVariantImageUpload={handleVariantImageUpload}
      onToggleCategory={onToggleCategory}
      onTagInputChange={setTagInput}
      onTagKeyDown={handleTagKeyDown}
      onRemoveTag={removeTag}
      onSeoKeywordInputChange={setSeoKeywordInput}
      onSeoKeywordKeyDown={handleSeoKeywordKeyDown}
      onRemoveSeoKeyword={removeSeoKeyword}
    />
  );
}
