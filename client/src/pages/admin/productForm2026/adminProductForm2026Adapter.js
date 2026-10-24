export const PRODUCT_FORM_2026_STEPS = [
  { id: 1, key: "basic", label: "Basic Info", helper: "Product details" },
  { id: 2, key: "media", label: "Media", helper: "Images & gallery" },
  { id: 3, key: "pricing", label: "Pricing & Stock", helper: "Price & inventory" },
  { id: 4, key: "variants", label: "Variants", helper: "Product combinations" },
  { id: 5, key: "details", label: "Details", helper: "Additional info" },
  { id: 6, key: "review", label: "Review", helper: "Review & publish" },
];

export const createInitialProductForm2026Meta = () => ({
  brand: "",
  productType: "physical",
  digitalAssetUrl: "",
  enablePromoPrice: false,
  lowStockThreshold: "",
  weight: "",
  weightUnit: "kg",
  length: "",
  width: "",
  height: "",
  dimensionUnit: "cm",
  additionalNotes: "",
  coverImageId: null,
  mediaDetails: {},
});

export const getCreatedAdminProductId = (payload) =>
  payload?.data?.id ||
  payload?.product?.id ||
  payload?.id ||
  payload?.data?.product?.id ||
  null;

export const toOptionalNumber = (value) => {
  if (value === null || typeof value === "undefined" || String(value).trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const titleCaseValue = (value, fallback = "-") => {
  const normalized = String(value || "").trim();
  if (!normalized) return fallback;
  return normalized
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export const buildProductForm2026Review = ({
  form,
  meta,
  selectedCategories,
  selectedStore,
  localImages,
}) => {
  const defaultCategory = selectedCategories.find(
    (category) => Number(category.id) === Number(form.defaultCategoryId)
  );
  const coverImage =
    localImages.find((image) => image.id === meta.coverImageId) || localImages[0] || null;

  return {
    coverImage,
    images: localImages,
    productName: form.name || "-",
    description: form.description || "-",
    storeName: selectedStore?.name || "-",
    sku: form.sku || "-",
    barcode: form.barcode || "-",
    brand: meta.brand || "-",
    category: defaultCategory?.name || selectedCategories[0]?.name || "-",
    categoryPath: selectedCategories.map((category) => category.name).join(" > ") || "-",
    productType: titleCaseValue(meta.productType, "Physical"),
    weight: meta.weight ? `${meta.weight} ${meta.weightUnit}` : "-",
    dimensions:
      meta.length || meta.width || meta.height
        ? `${meta.length || 0} x ${meta.width || 0} x ${meta.height || 0} ${meta.dimensionUnit}`
        : "-",
    basePrice: form.price || "0",
    salePrice: form.salePrice || "-",
    lowStockThreshold: meta.lowStockThreshold || "-",
    stock: form.stock || "0",
    status: titleCaseValue(form.status, "Active"),
    slug: form.slug || "-",
    tags: form.tags || [],
  };
};

export const getProductForm2026Checklist = ({ form, meta, localImages }) => [
  {
    labelKey: "Basic Information",
    helperKey: form.name && form.storeId && form.sku ? "All required fields are completed." : "Complete name, store, and SKU.",
    done: Boolean(form.name && form.storeId && form.sku),
  },
  {
    labelKey: "Product Media",
    helperKey: localImages.length ? "Selected images count" : "Images are optional, but recommended.",
    helperValues: localImages.length ? { count: localImages.length } : undefined,
    done: true,
  },
  {
    labelKey: "Pricing & Stock",
    helperKey: form.price && String(form.stock || "") !== "" ? "Pricing and inventory look good." : "Add base price and stock.",
    done: Boolean(form.price && String(form.stock || "") !== ""),
  },
  {
    labelKey: "Additional Details",
    helperKey: form.categoryIds?.length && form.defaultCategoryId ? "Category and product details added." : "Choose categories and default category.",
    done: Boolean(form.categoryIds?.length && form.defaultCategoryId),
  },
  {
    labelKey: "Tags & Metadata",
    helperKey: form.tags?.length || form.slug ? "Metadata is ready." : "Slug will be generated from product name.",
    done: true,
  },
  {
    labelKey: "Publication Settings",
    helperKey: meta.productType
      ? "Product is ready for save or publish."
      : "Choose product type.",
    done: Boolean(meta.productType),
  },
];

export const getSellerProductForm2026Checklist = ({ form, meta, localImages }) =>
  getProductForm2026Checklist({ form, meta, localImages }).map((item) =>
    item.labelKey === "Publication Settings" &&
    item.helperKey === "Product is ready for save or publish."
      ? { ...item, helperKey: "Product is ready for draft save or review submission." }
      : item
  );

export const generateProductSku = ({
  name = "",
  storeName = "",
  storeSlug = "",
  brand = "",
  withSuffix = false,
} = {}) => {
  const trimmedName = String(name || "").trim();
  if (!trimmedName) return "";

  const parts = [];

  const storeSource = String(storeName || storeSlug || "").trim();
  if (storeSource) {
    const storeWords = storeSource
      .replace(/[^a-zA-Z0-9\s-_]/g, "")
      .split(/[\s-_]+/)
      .filter(Boolean);
    if (storeWords.length > 1) {
      const initials = storeWords.slice(0, 3).map((w) => w[0].toUpperCase()).join("");
      if (initials) parts.push(initials);
    } else if (storeWords.length === 1) {
      parts.push(storeWords[0].slice(0, 3).toUpperCase());
    }
  }

  const cleanBrand = String(brand || "").trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (cleanBrand) {
    parts.push(cleanBrand.slice(0, 4));
  }

  const nameWords = trimmedName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (nameWords.length > 0) {
    const nameCode = nameWords
      .slice(0, 3)
      .map((w) => w.toUpperCase().slice(0, 8))
      .join("-");
    if (nameCode) parts.push(nameCode);
  }

  if (withSuffix) {
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    parts.push(randomSuffix);
  }

  return parts.filter(Boolean).join("-");
};

export const generateVariantSku = ({
  parentSku = "",
  productName = "",
  storeSlug = "",
  storeName = "",
  brand = "",
  selections = [],
  index = 1,
} = {}) => {
  const baseSku =
    String(parentSku || "").trim() ||
    generateProductSku({ name: productName, storeName, storeSlug, brand });

  const attrTokens = (Array.isArray(selections) ? selections : [])
    .map((s) => {
      const val = String(s.value || s.label || "").trim();
      const clean = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      return clean.slice(0, 6);
    })
    .filter(Boolean);

  if (baseSku && attrTokens.length > 0) {
    return `${baseSku}-${attrTokens.join("-")}`;
  }
  if (baseSku) {
    return `${baseSku}-V${index}`;
  }
  return "";
};

