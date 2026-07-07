export const PRODUCT_FORM_2026_STEPS = [
  { id: 1, key: "basic", label: "Basic Info", helper: "Product details" },
  { id: 2, key: "media", label: "Media", helper: "Images & gallery" },
  { id: 3, key: "pricing", label: "Pricing & Stock", helper: "Price & inventory" },
  { id: 4, key: "details", label: "Details", helper: "Additional info" },
  { id: 5, key: "review", label: "Review", helper: "Review & publish" },
];

export const createInitialProductForm2026Meta = () => ({
  brand: "",
  productType: "physical",
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
    productType: meta.productType || "physical",
    weight: meta.weight ? `${meta.weight} ${meta.weightUnit}` : "-",
    dimensions:
      meta.length || meta.width || meta.height
        ? `${meta.length || 0} x ${meta.width || 0} x ${meta.height || 0} ${meta.dimensionUnit}`
        : "-",
    basePrice: form.price || "0",
    salePrice: form.salePrice || "-",
    lowStockThreshold: meta.lowStockThreshold || "-",
    stock: form.stock || "0",
    status: form.status || "active",
    slug: form.slug || "-",
    tags: form.tags || [],
  };
};

export const getProductForm2026Checklist = ({ form, meta, localImages }) => [
  {
    label: "Basic Information",
    helper: form.name && form.storeId && form.sku ? "All required fields are completed." : "Complete name, store, and SKU.",
    done: Boolean(form.name && form.storeId && form.sku),
  },
  {
    label: "Product Media",
    helper: localImages.length ? `${localImages.length} image(s) selected.` : "Images are optional, but recommended.",
    done: true,
  },
  {
    label: "Pricing & Stock",
    helper: form.price && String(form.stock || "") !== "" ? "Pricing and inventory look good." : "Add base price and stock.",
    done: Boolean(form.price && String(form.stock || "") !== ""),
  },
  {
    label: "Additional Details",
    helper: form.categoryIds?.length && form.defaultCategoryId ? "Category and product details added." : "Choose categories and default category.",
    done: Boolean(form.categoryIds?.length && form.defaultCategoryId),
  },
  {
    label: "Tags & Metadata",
    helper: form.tags?.length || form.slug ? "Metadata is ready." : "Slug will be generated from product name.",
    done: true,
  },
  {
    label: "Publication Settings",
    helper: meta.productType ? "Product is ready for save or publish." : "Choose product type.",
    done: Boolean(meta.productType),
  },
];
