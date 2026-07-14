import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Box,
  Check,
  ChevronRight,
  Download,
  Eye,
  GripVertical,
  Package,
  Plus,
  Send,
  Tag,
  UploadCloud,
  X,
} from "lucide-react";
import {
  PRODUCT_FORM_2026_STEPS,
  buildProductForm2026Review,
  getProductForm2026Checklist,
  getSellerProductForm2026Checklist,
} from "./adminProductForm2026Adapter.js";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import "./admin-product-form-2026.css";

function RequiredMark() {
  return <span className="apf26-required"> *</span>;
}

function TextField({
  label,
  required = false,
  helper,
  as = "input",
  children,
  ...props
}) {
  const Input = as;
  return (
    <div className="apf26-field">
      <label>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {children || (
        <Input
          className={as === "textarea" ? "apf26-textarea" : "apf26-input"}
          aria-required={required ? "true" : undefined}
          {...props}
        />
      )}
      {helper ? <small>{helper}</small> : null}
    </div>
  );
}

function Stepper({ activeStep, maxVisitedStep, onStepClick, success = false }) {
  const { t } = useTranslation("admin");
  return (
    <div className="apf26-stepper">
      {PRODUCT_FORM_2026_STEPS.map((step) => {
        const isComplete = success || step.id < activeStep;
        const isActive = !success && step.id === activeStep;
        const canOpen = step.id <= maxVisitedStep;

        return (
          <button
            key={step.id}
            type="button"
            className={`apf26-step ${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""}`}
            disabled={!canOpen || success}
            onClick={() => onStepClick(step.id)}
          >
            <span className="apf26-step__badge">
              {isComplete ? <Check size={22} /> : step.id}
            </span>
            <span className="apf26-step__copy">
              <strong>{t("productForm." + step.label)}</strong>
              <span>{t("productForm." + step.helper)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Header({ isEdit, subtitle, onClose }) {
  const { t } = useTranslation("admin");
  return (
    <header className="apf26-header">
      <div>
        <h1>{isEdit ? t("productForm.Edit Product") : t("productForm.Add New Product")}</h1>
        <p>{subtitle || t("productForm.Create a new product and add it to your catalog.")}</p>
      </div>
      <button
        type="button"
        className="apf26-close"
        onClick={onClose}
        aria-label={isEdit ? t("productForm.Close edit product page") : t("productForm.Close add product page")}
      >
        <X size={22} />
      </button>
    </header>
  );
}

function FormState({ type, message, onRetry }) {
  const { t } = useTranslation("admin");
  return (
    <main className={`apf26-form-state is-${type}`} role={type === "error" ? "alert" : "status"}>
      <span className="apf26-form-state__icon">
        {type === "loading" ? <span className="apf26-loader" /> : <Package size={28} />}
      </span>
      <h2>{type === "loading" ? t("productForm.Loading product data") : t("productForm.Unable to load product")}</h2>
      <p>{message}</p>
      {type === "error" ? (
        <button type="button" className="apf26-button apf26-button--primary" onClick={onRetry}>
          Try Again
        </button>
      ) : null}
    </main>
  );
}

function BasicStep({
  form,
  seo,
  stores,
  selectedStoreId,
  meta,
  allowGlobalStoreOption = true,
  storeOwnershipLocked = false,
  tagInput,
  seoKeywordInput,
  onFormChange,
  onNameChange,
  onMetaChange,
  onSeoChange,
  onTagInputChange,
  onTagKeyDown,
  onRemoveTag,
  onSeoKeywordInputChange,
  onSeoKeywordKeyDown,
  onRemoveSeoKeyword,
}) {
  const { t } = useTranslation("admin");
  const [activeBasicTab, setActiveBasicTab] = useState("basic");

  return (
    <section className="apf26-card">
      <div className="apf26-tabs">
        <button
          type="button"
          className={activeBasicTab === "basic" ? "is-active" : ""}
          onClick={() => setActiveBasicTab("basic")}
        >
          Basic Info
        </button>
        <button
          type="button"
          className={activeBasicTab === "seo" ? "is-active" : ""}
          onClick={() => setActiveBasicTab("seo")}
        >
          SEO
        </button>
      </div>
      <div className="apf26-grid">
        {activeBasicTab === "basic" ? (
          <>
            <TextField
              label={t("productForm.Product Name")}
              required
              placeholder={t("productForm.Enter product name")}
              value={form.name}
              onChange={(event) => onNameChange(event.target.value)}
            />
            <TextField
              label={t("productForm.Short Description")}
              as="textarea"
              maxLength={300}
              placeholder={t("productForm.Enter a short description about this product...")}
              value={form.description}
              onChange={(event) => onFormChange({ description: event.target.value })}
              helper={`${String(form.description || "").length} / 300`}
            />
            <div className="apf26-grid apf26-grid--3">
              <TextField label={t("productForm.Store Ownership")} required helper={t("productForm.Product ownership uses storeId as the source of truth.")}>
                <select
                  className="apf26-select"
                  required
                  aria-required="true"
                  value={selectedStoreId}
                  disabled={storeOwnershipLocked}
                  onChange={(event) => onFormChange({ storeId: event.target.value })}
                >
                  {allowGlobalStoreOption ? (
                    <option value="global">{t("productForm.Global (Admin)")}</option>
                  ) : null}
                  {stores.map((store) => (
                    <option key={store.id} value={String(store.id)}>
                      {store.name}
                      {store.slug ? ` (${store.slug})` : ""}
                    </option>
                  ))}
                </select>
              </TextField>
              <TextField
                label={t("productForm.Product SKU")}
                required
                placeholder={t("productForm.Enter product SKU")}
                value={form.sku}
                onChange={(event) => onFormChange({ sku: event.target.value })}
              />
              <TextField
                label={t("productForm.Barcode (ISBN, EAN, UPC)")}
                placeholder={t("productForm.Enter barcode (optional)")}
                value={form.barcode}
                onChange={(event) => onFormChange({ barcode: event.target.value })}
              />
            </div>
            <div className="apf26-grid apf26-grid--2">
              <TextField label={t("productForm.Brand")} helper={t("productForm.Choose the brand this product belongs to.")}>
                <input
                  className="apf26-input"
                  value={meta.brand}
                  placeholder={t("productForm.Brand (optional)")}
                  onChange={(event) => onMetaChange({ brand: event.target.value })}
                />
              </TextField>
              <TextField
                label={t("productForm.Product Slug")}
                helper={t("productForm.Auto-generated from product name unless edited.")}
                value={form.slug}
                onChange={(event) => onFormChange({ slug: event.target.value })}
              />
            </div>
          </>
        ) : null}
        {activeBasicTab === "seo" ? (
          <>
            <div className="apf26-grid apf26-grid--2">
              <TextField
                label={t("productForm.SEO Title")}
                placeholder={t("productForm.Leave empty to use product name")}
                value={seo.metaTitle}
                onChange={(event) => onSeoChange({ metaTitle: event.target.value })}
              />
              <TextField
                label={t("productForm.SEO Description")}
                as="textarea"
                placeholder={t("productForm.Search result description")}
                value={seo.metaDescription}
                onChange={(event) => onSeoChange({ metaDescription: event.target.value })}
              />
            </div>
            <TextField label={t("productForm.SEO Keywords")}>
              <input
                className="apf26-input"
                value={seoKeywordInput}
                onChange={(event) => onSeoKeywordInputChange(event.target.value)}
                onKeyDown={onSeoKeywordKeyDown}
                placeholder={t("productForm.Type keyword and press Enter")}
              />
              <div className="apf26-chip-row">
                {seo.keywords.map((keyword) => (
                  <span key={keyword} className="apf26-chip">
                    {keyword}
                    <button type="button" onClick={() => onRemoveSeoKeyword(keyword)} aria-label={`Remove ${keyword}`}>
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </TextField>
            <TextField label={t("productForm.Product Tags")}>
              <input
                className="apf26-input"
                value={tagInput}
                onChange={(event) => onTagInputChange(event.target.value)}
                onKeyDown={onTagKeyDown}
                placeholder={t("productForm.Add tags and press Enter")}
              />
              <div className="apf26-chip-row">
                {form.tags.map((tag) => (
                  <span key={tag} className="apf26-chip">
                    {tag}
                    <button type="button" onClick={() => onRemoveTag(tag)} aria-label={`Remove ${tag}`}>
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </TextField>
          </>
        ) : null}
      </div>
    </section>
  );
}

function MediaStep({
  form,
  meta,
  localImages,
  fileInputRef,
  onAddFiles,
  onRemoveImage,
  onSetCover,
  onReorderImages,
  onMediaDetailChange,
  onFormChange,
  tagInput,
  onTagInputChange,
  onTagKeyDown,
  onRemoveTag,
}) {
  const { t } = useTranslation("admin");
  const [draggedImageId, setDraggedImageId] = useState(null);
  const [dragOverImageId, setDragOverImageId] = useState(null);
  const coverImage =
    localImages.find((image) => image.id === meta.coverImageId) || localImages[0] || null;
  const selectedDetails = coverImage ? meta.mediaDetails[coverImage.id] || {} : {};
  const canReorderImages = typeof onReorderImages === "function" && localImages.length > 1;

  const resetDragState = () => {
    setDraggedImageId(null);
    setDragOverImageId(null);
  };

  const handleImageDrop = (event, targetImageId) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceImageId =
      draggedImageId || event.dataTransfer.getData("text/product-image-id");
    resetDragState();
    if (!canReorderImages || !sourceImageId || sourceImageId === targetImageId) return;
    onReorderImages(sourceImageId, targetImageId);
  };

  return (
    <div className="apf26-layout-2">
      <section className="apf26-card">
        <div className="apf26-section-title">
          <div>
            <p className="apf26-eyebrow">{t("productForm.Media")}</p>
            <h2>{t("productForm.Images")}</h2>
            <p>{t("productForm.Upload product visuals and review selected previews.")}</p>
          </div>
          <span className="apf26-chip">{localImages.length} / 5 {t("productForm.image(s)")}</span>
        </div>
        <div
          className="apf26-uploader"
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
          }}
          onDrop={(event) => {
            event.preventDefault();
            void onAddFiles(event.dataTransfer.files);
          }}
          onDragOver={(event) => event.preventDefault()}
        >
          <div>
            <UploadCloud size={34} />
            <strong>{t("productForm.Drag & drop images here")}</strong>
            <p>{t("productForm.Only JPG, PNG, and WEBP images are accepted.")}</p>
            <p>{t("productForm.Up to 5 images. Square 1:1 previews are recommended.")}</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            void onAddFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="mt-5 apf26-gallery" role="list">
          {localImages.map((image) => {
            const isCover = coverImage?.id === image.id;
            return (
              <div
                key={image.id}
                className={[
                  "apf26-thumb",
                  isCover ? "is-cover" : "",
                  draggedImageId === image.id ? "is-dragging" : "",
                  dragOverImageId === image.id && draggedImageId !== image.id ? "is-drag-over" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                role="listitem"
                draggable={canReorderImages}
                onDragStart={(event) => {
                  if (!canReorderImages) return;
                  if (event.target.closest("button")) {
                    event.preventDefault();
                    return;
                  }
                  setDraggedImageId(image.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/product-image-id", image.id);
                }}
                onDragEnter={(event) => {
                  if (!canReorderImages || !draggedImageId || draggedImageId === image.id) return;
                  event.preventDefault();
                  setDragOverImageId(image.id);
                }}
                onDragOver={(event) => {
                  if (!canReorderImages || !draggedImageId || draggedImageId === image.id) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverImageId(image.id);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setDragOverImageId((current) => (current === image.id ? null : current));
                  }
                }}
                onDrop={(event) => handleImageDrop(event, image.id)}
                onDragEnd={resetDragState}
              >
                <img src={image.url} alt={image.name} />
                {canReorderImages ? (
                  <span
                    className="apf26-thumb__drag"
                    aria-hidden="true"
                    title={t("productForm.Drag images left or right to reorder the gallery.")}
                  >
                    <GripVertical size={15} />
                  </span>
                ) : null}
                <button
                  type="button"
                  className="apf26-thumb__remove"
                  onClick={() => onRemoveImage(image.id)}
                  aria-label={t("productForm.Remove image")}
                >
                  <X size={14} />
                </button>
                <button
                  type="button"
                  className="apf26-thumb__cover"
                  onClick={() => (isCover ? null : onSetCover(image.id))}
                  disabled={isCover}
                  aria-label={
                    isCover ? t("productForm.Cover") : t("productForm.Set cover image")
                  }
                >
                  {isCover ? <Check size={12} /> : null}
                  {isCover ? t("productForm.Cover") : t("productForm.Make cover")}
                </button>
              </div>
            );
          })}
        </div>
        {canReorderImages ? (
          <p className="apf26-media-hint">
            {t("productForm.Drag images left or right to reorder the gallery.")}
          </p>
        ) : null}
      </section>
      <aside className="apf26-panel">
        <h3>{t("productForm.Image Details")}</h3>
        {coverImage ? (
          <div className="mt-4 apf26-product-preview">
            <div className="apf26-thumb is-cover">
              <img src={coverImage.url} alt={coverImage.name} />
            </div>
            <p>{coverImage.name}</p>
          </div>
        ) : (
          <p>{t("productForm.No image selected yet.")}</p>
        )}
        <div className="apf26-grid mt-4">
          <TextField label={t("productForm.Alt Text")}>
            <input
              className="apf26-input"
              value={selectedDetails.alt || ""}
              placeholder={t("productForm.Enter alt text for accessibility")}
              disabled={!coverImage}
              onChange={(event) =>
                coverImage ? onMediaDetailChange(coverImage.id, { alt: event.target.value }) : null
              }
            />
          </TextField>
          <TextField label={t("productForm.Caption")}>
            <textarea
              className="apf26-textarea"
              maxLength={200}
              value={selectedDetails.caption || ""}
              placeholder={t("productForm.Enter a caption or note about this image")}
              disabled={!coverImage}
              onChange={(event) =>
                coverImage ? onMediaDetailChange(coverImage.id, { caption: event.target.value }) : null
              }
            />
          </TextField>
          <TextField
            label={t("productForm.Product Slug")}
            value={form.slug}
            onChange={(event) => onFormChange({ slug: event.target.value })}
          />
          <TextField label={t("productForm.Product Tags")}>
            <input
              className="apf26-input"
              value={tagInput}
              onChange={(event) => onTagInputChange(event.target.value)}
              onKeyDown={onTagKeyDown}
              placeholder={t("productForm.Add tags and press Enter")}
            />
            <div className="apf26-chip-row">
              {form.tags.map((tag) => (
                <span key={tag} className="apf26-chip">
                  {tag}
                  <button type="button" onClick={() => onRemoveTag(tag)} aria-label={`Remove ${tag}`}>
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </TextField>
        </div>
      </aside>
    </div>
  );
}

function PricingStep({ form, meta, onFormChange, onMetaChange }) {
  const { t } = useTranslation("admin");
  return (
    <div className="apf26-grid">
      <section className="apf26-card">
        <div className="apf26-section-title">
          <div>
            <p className="apf26-eyebrow">{t("productForm.Pricing")}</p>
            <h2>{t("productForm.Pricing")}</h2>
            <p>{t("productForm.Configure base price and sale price for your product.")}</p>
          </div>
          <span className="apf26-chip">{t("productForm.Base + promo pricing")}</span>
        </div>
        <div className="apf26-grid apf26-grid--2">
          <TextField label={t("productForm.Base Price")} required helper={t("productForm.Enter the original price of the product.")}>
            <div className="apf26-price-input">
              <span>Rp</span>
              <input
                className="apf26-input"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={(event) => onFormChange({ price: event.target.value })}
              />
            </div>
          </TextField>
          <TextField label={t("productForm.Sale Price")} helper={t("productForm.Optional. Leave empty if no sale.")}>
            <div className="apf26-price-input">
              <span>Rp</span>
              <input
                className="apf26-input"
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                disabled={!meta.enablePromoPrice}
                onChange={(event) => onFormChange({ salePrice: event.target.value })}
              />
            </div>
          </TextField>
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={meta.enablePromoPrice}
            onChange={(event) => onMetaChange({ enablePromoPrice: event.target.checked })}
          />
          Enable Promo Price
        </label>
      </section>
      <section className="apf26-card">
        <div className="apf26-section-title">
          <div>
            <p className="apf26-eyebrow">{t("productForm.Inventory")}</p>
            <h2>{t("productForm.Inventory")}</h2>
            <p>{t("productForm.Manage stock, status, and product identifiers.")}</p>
          </div>
        </div>
        <div className="apf26-grid apf26-grid--2">
          <TextField
            label={t("productForm.Stock Quantity")}
            required
            type="number"
            min="0"
            step="1"
            value={form.stock}
            helper={t("productForm.Enter available quantity in stock.")}
            onChange={(event) => onFormChange({ stock: event.target.value })}
          />
          <TextField
            label={t("productForm.Low Stock Threshold")}
            type="number"
            min="0"
            step="1"
            value={meta.lowStockThreshold}
            helper={t("productForm.You'll be notified when stock reaches this level.")}
            onChange={(event) => onMetaChange({ lowStockThreshold: event.target.value })}
          />
          <TextField
            label={t("productForm.SKU (Stock Keeping Unit)")}
            required
            value={form.sku}
            helper={t("productForm.Unique identifier for this product.")}
            onChange={(event) => onFormChange({ sku: event.target.value })}
          />
          <TextField
            label={t("productForm.Product Slug")}
            value={form.slug}
            helper={t("productForm.URL-friendly product slug.")}
            onChange={(event) => onFormChange({ slug: event.target.value })}
          />
        </div>
        <div className="mt-5">
          <label className="mb-2 block text-sm font-extrabold">{t("productForm.Status")} <RequiredMark /></label>
          <div className="apf26-radio-row">
            {[
              { value: "active", label: t("productForm.Active"), helper: t("productForm.Product is available for purchase.") },
              { value: "draft", label: t("productForm.Draft"), helper: t("productForm.Product is hidden from store.") },
              { value: "inactive", label: t("productForm.Inactive"), helper: t("productForm.Product is disabled.") },
            ].map((option) => (
              <label key={option.value} className={form.status === option.value ? "is-active" : ""}>
                <input
                  type="radio"
                  name="product-status"
                  checked={form.status === option.value}
                  onChange={() => onFormChange({ status: option.value })}
                />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.helper}</small>
                </span>
              </label>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function VariantsStep({
  hasVariants,
  selectedAttributes,
  selectedAttributeValues,
  variants,
  pendingAttributeId,
  attributeSearch,
  attributeValueSearch,
  attributeValuesMap,
  attributeValuesLoading,
  variantImageUploadingId,
  availableAttributes,
  onToggleHasVariants,
  onPendingAttributeChange,
  onAttributeSearchChange,
  onAttributeValueSearchChange,
  onAddSelectedAttribute,
  onRemoveSelectedAttribute,
  onToggleAttributeValue,
  onSelectAllAttributeValues,
  onClearVariants,
  onGenerateVariants,
  onVariantFieldChange,
  onRemoveVariant,
  onVariantImageUpload,
}) {
  const { t } = useTranslation("admin");

  return (
    <div className="apf26-grid">
      <section className="apf26-card">
        <div className="apf26-section-title">
          <div>
            <p className="apf26-eyebrow">{t("productForm.Variants")}</p>
            <h2>{t("productForm.Product Variants")}</h2>
            <p>{t("productForm.Create variants if this product has multiple options, like size or color.")}</p>
          </div>
          <label className="apf26-switch">
            <input type="checkbox" checked={hasVariants} onChange={onToggleHasVariants} />
            <span>{t("productForm.This product has variants")}</span>
          </label>
        </div>

        {!hasVariants ? (
          <div className="apf26-empty">
            {t("productForm.Turn variants on to configure attributes, values, and generated combinations.")}
          </div>
        ) : (
          <div className="apf26-grid">
            <div className="apf26-variant-builder">
              <div className="apf26-panel">
                <h3>{t("productForm.Add Option Type")}</h3>
                <div className="apf26-grid mt-4">
                  <TextField label={t("productForm.Search attributes")}>
                    <input
                      className="apf26-input"
                      value={attributeSearch}
                      onChange={(event) => onAttributeSearchChange(event.target.value)}
                      placeholder={t("productForm.Search attributes")}
                    />
                  </TextField>
                  <div className="apf26-inline-controls">
                    <select
                      className="apf26-select"
                      value={pendingAttributeId}
                      onChange={(event) => onPendingAttributeChange(event.target.value)}
                    >
                      <option value="">{t("productForm.Select an attribute...")}</option>
                      {availableAttributes.map((attribute) => (
                        <option key={attribute.id} value={String(attribute.id)}>
                          {attribute.displayName || attribute.display_name || attribute.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="apf26-button apf26-button--primary"
                      disabled={!pendingAttributeId}
                      onClick={onAddSelectedAttribute}
                    >
                      {t("productForm.Add")}
                    </button>
                  </div>
                  {selectedAttributes.length > 0 ? (
                    <div className="apf26-chip-row">
                      {selectedAttributes.map((attribute) => (
                        <span key={attribute.id} className="apf26-chip">
                          {attribute.name}
                          <button
                            type="button"
                            onClick={() => onRemoveSelectedAttribute(attribute.id)}
                            aria-label={`Remove ${attribute.name}`}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>{t("productForm.Select one or more attributes to start building variants.")}</p>
                  )}
                </div>
              </div>

              <div className="apf26-grid">
                {selectedAttributes.map((attribute) => {
                  const allValues = Array.isArray(attributeValuesMap[attribute.id])
                    ? attributeValuesMap[attribute.id]
                    : [];
                  const currentSearch = String(attributeValueSearch[attribute.id] || "")
                    .trim()
                    .toLowerCase();
                  const filteredValues = allValues.filter((value) =>
                    String(value?.label || value?.value || "")
                      .toLowerCase()
                      .includes(currentSearch)
                  );
                  const selectedEntry =
                    selectedAttributeValues.find(
                      (entry) => Number(entry.attributeId) === Number(attribute.id)
                    ) || null;
                  const selectedValueKeys = new Set(
                    (selectedEntry?.values || []).map((value) =>
                      String(value.id ?? value.value).toLowerCase()
                    )
                  );

                  return (
                    <div key={attribute.id} className="apf26-panel">
                      <div className="apf26-section-title apf26-section-title--compact">
                        <div>
                          <h3>{t("productForm.Select")} {attribute.name}</h3>
                          <p>{t("productForm.Choose the values to include in generated variants.")}</p>
                        </div>
                        <button
                          type="button"
                          className="apf26-link-button"
                          onClick={() => onSelectAllAttributeValues(attribute, filteredValues)}
                        >
                          {t("productForm.Select All")}
                        </button>
                      </div>
                      <input
                        className="apf26-input"
                        value={attributeValueSearch[attribute.id] || ""}
                        onChange={(event) =>
                          onAttributeValueSearchChange(attribute.id, event.target.value)
                        }
                        placeholder={`${t("productForm.Search values")} ${attribute.name}`}
                      />
                      <div className="apf26-value-list">
                        {filteredValues.map((value) => {
                          const dedupeKey = String(value.id ?? value.value).toLowerCase();
                          const checked = selectedValueKeys.has(dedupeKey);
                          return (
                            <label key={`${attribute.id}-${dedupeKey}`} className="apf26-value-option">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => onToggleAttributeValue(attribute, value)}
                              />
                              <span>{value.label || value.value}</span>
                            </label>
                          );
                        })}
                        {attributeValuesLoading ? (
                          <p>{t("productForm.Loading values...")}</p>
                        ) : null}
                        {!attributeValuesLoading && filteredValues.length === 0 ? (
                          <p>{t("productForm.No values available.")}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="apf26-variant-actions">
              <button
                type="button"
                className="apf26-button"
                disabled={variants.length === 0}
                onClick={onClearVariants}
              >
                {t("productForm.Clear Variants")}
              </button>
              <button type="button" className="apf26-button apf26-button--primary" onClick={onGenerateVariants}>
                {t("productForm.Generate Variants")}
              </button>
            </div>

            <div className="apf26-table-wrap">
              <table className="apf26-table">
                <thead>
                  <tr>
                    {[
                      "Image",
                      "Variant",
                      "SKU",
                      "Barcode",
                      "Price",
                      "Sale Price",
                      "Quantity",
                      "Action",
                    ].map((label) => (
                      <th key={label}>{t("productForm." + label)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {variants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="apf26-table-empty">
                        {t("productForm.Generate variants to review and edit each combination.")}
                      </td>
                    </tr>
                  ) : (
                    variants.map((variant) => (
                      <tr key={variant.id}>
                        <td>
                          <div className="apf26-variant-image-cell">
                            <span className="apf26-variant-image">
                              {variant.image ? (
                                <img src={resolveAssetUrl(variant.image)} alt={variant.combination} />
                              ) : (
                                "IMG"
                              )}
                            </span>
                            <label className="apf26-file-button">
                              {variantImageUploadingId === variant.id
                                ? t("productForm.Uploading...")
                                : t("productForm.Change")}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) => {
                                  onVariantImageUpload(variant.id, event.target.files?.[0] || null);
                                  event.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </td>
                        <td>
                          <strong>{variant.combination}</strong>
                        </td>
                        <td>
                          <input
                            className="apf26-input"
                            value={variant.sku || ""}
                            onChange={(event) =>
                              onVariantFieldChange(variant.id, "sku", event.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="apf26-input"
                            value={variant.barcode || ""}
                            onChange={(event) =>
                              onVariantFieldChange(variant.id, "barcode", event.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="apf26-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.price ?? ""}
                            onChange={(event) =>
                              onVariantFieldChange(variant.id, "price", event.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="apf26-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.salePrice ?? ""}
                            onChange={(event) =>
                              onVariantFieldChange(variant.id, "salePrice", event.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="apf26-input"
                            type="number"
                            min="0"
                            step="1"
                            value={variant.quantity ?? ""}
                            onChange={(event) =>
                              onVariantFieldChange(variant.id, "quantity", event.target.value)
                            }
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="apf26-icon-button"
                            onClick={() => onRemoveVariant(variant.id)}
                            aria-label={`Remove ${variant.combination}`}
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function DetailsStep({
  form,
  meta,
  categories,
  selectedCategories,
  defaultCategoryOptions,
  tagInput,
  onFormChange,
  onMetaChange,
  onToggleCategory,
  onTagInputChange,
  onTagKeyDown,
  onRemoveTag,
}) {
  const { t } = useTranslation("admin");
  return (
    <div className="apf26-grid">
      <div className="apf26-grid apf26-grid--2">
        <section className="apf26-card">
          <h2>{t("productForm.Category")}</h2>
          <p>{t("productForm.Choose one or more categories for this product.")}</p>
          <div className="mt-4 apf26-grid">
            <TextField label={t("productForm.Categories")} required>
              <select
                className="apf26-select"
                value=""
                onChange={(event) => {
                  const id = Number(event.target.value);
                  if (id) onToggleCategory(id);
                }}
              >
                <option value="">{t("productForm.Select one or more categories")}</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="apf26-chip-row">
                {selectedCategories.map((category) => (
                  <span key={category.id} className="apf26-chip">
                    {category.name}
                    <button type="button" onClick={() => onToggleCategory(Number(category.id))}>
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </TextField>
            <TextField label={t("productForm.Default Category")} required>
              <select
                className="apf26-select"
                required
                value={form.defaultCategoryId ? String(form.defaultCategoryId) : ""}
                onChange={(event) =>
                  onFormChange({
                    defaultCategoryId: event.target.value ? Number(event.target.value) : null,
                  })
                }
              >
                <option value="">{t("productForm.Default Category")}</option>
                {defaultCategoryOptions.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </TextField>
          </div>
        </section>
        <section className="apf26-card">
          <h2>{t("productForm.Product Type")} <RequiredMark /></h2>
          <p>{t("productForm.Choose the type of product you are adding.")}</p>
          <div className="mt-5 apf26-choice-grid">
            {[
              { value: "physical", label: t("productForm.Physical"), helper: t("productForm.Shippable physical product"), icon: Package },
              { value: "digital", label: t("productForm.Digital"), helper: t("productForm.Downloadable product"), icon: Download },
              { value: "service", label: t("productForm.Service"), helper: t("productForm.Non-shippable service"), icon: Box },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`apf26-choice ${meta.productType === option.value ? "is-active" : ""}`}
                  onClick={() => onMetaChange({ productType: option.value })}
                >
                  <Icon size={34} />
                  <strong>{option.label}</strong>
                  <span>{option.helper}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
      {meta.productType === "physical" ? (
        <div className="apf26-grid apf26-grid--2">
          <section className="apf26-card">
            <h2>{t("productForm.Weight")} <span className="font-normal">({t("productForm.Optional")})</span></h2>
            <p>{t("productForm.Provide weight if applicable.")}</p>
            <div className="mt-4 apf26-grid apf26-grid--2">
              <TextField
                label={t("productForm.Weight")}
                type="number"
                min="0"
                step="0.01"
                value={meta.weight}
                onChange={(event) => onMetaChange({ weight: event.target.value })}
              />
              <TextField label={t("productForm.Unit")}>
                <select
                  className="apf26-select"
                  value={meta.weightUnit}
                  onChange={(event) => onMetaChange({ weightUnit: event.target.value })}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </TextField>
            </div>
          </section>
          <section className="apf26-card">
            <h2>{t("productForm.Dimensions")} <span className="font-normal">({t("productForm.Optional")})</span></h2>
            <p>{t("productForm.Provide product dimensions if applicable.")}</p>
            <div className="mt-4 apf26-grid apf26-grid--3">
              {["length", "width", "height"].map((field) => (
                <TextField
                  key={field}
                  label={t(`productForm.${field.charAt(0).toUpperCase() + field.slice(1)}`)}
                  type="number"
                  min="0"
                  step="0.01"
                  value={meta[field]}
                  onChange={(event) => onMetaChange({ [field]: event.target.value })}
                />
              ))}
            </div>
          </section>
        </div>
      ) : meta.productType === "digital" ? (
        <div className="apf26-grid">
          <section className="apf26-card">
            <h2>{t("productForm.Digital Asset")} <RequiredMark /></h2>
            <p>{t("productForm.Provide a download link or access instruction for the digital product.")}</p>
            <div className="mt-4">
              <TextField
                label={t("productForm.Download Link / Instructions")}
                as="textarea"
                required
                value={meta.digitalAssetUrl || ""}
                onChange={(event) => onMetaChange({ digitalAssetUrl: event.target.value })}
                placeholder={t("productForm.Enter download link (e.g. Google Drive, Dropbox) or access instructions...")}
              />
            </div>
          </section>
        </div>
      ) : null}
      <div className="apf26-grid apf26-grid--2">
        <section className="apf26-card">
          <h2>{t("productForm.Tags")} <span className="font-normal">({t("productForm.Optional")})</span></h2>
          <p>{t("productForm.Add tags to help organize and find this product.")}</p>
          <input
            className="apf26-input mt-4"
            value={tagInput}
            onChange={(event) => onTagInputChange(event.target.value)}
            onKeyDown={onTagKeyDown}
            placeholder={t("productForm.Enter tag and press Enter")}
          />
          <div className="apf26-chip-row mt-3">
            {form.tags.map((tag) => (
              <span key={tag} className="apf26-chip">
                {tag}
                <button type="button" onClick={() => onRemoveTag(tag)}>
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </section>
        <section className="apf26-card">
          <h2>{t("productForm.Additional Notes")} <span className="font-normal">({t("productForm.Optional")})</span></h2>
          <p>{t("productForm.Add any additional information about this product.")}</p>
          <textarea
            className="apf26-textarea mt-4"
            maxLength={300}
            value={meta.additionalNotes}
            onChange={(event) => onMetaChange({ additionalNotes: event.target.value })}
            placeholder={t("productForm.Enter additional notes...")}
          />
          <small>{meta.additionalNotes.length} / 300</small>
        </section>
      </div>
    </div>
  );
}

function ReviewStep({ form, meta, selectedCategories, selectedStore, localImages, workflow = "admin" }) {
  const { t } = useTranslation("admin");
  const review = buildProductForm2026Review({
    form,
    meta,
    selectedCategories,
    selectedStore,
    localImages,
  });
  const checklist =
    workflow === "seller"
      ? getSellerProductForm2026Checklist({ form, meta, localImages })
      : getProductForm2026Checklist({ form, meta, localImages });

  return (
    <div className="apf26-review">
      <div className="apf26-review-grid">
        <section className="apf26-review-card">
          <h3>{t("productForm.Product Images")} ({localImages.length})</h3>
          <div className="apf26-review-images">
            {localImages.slice(0, 5).map((image) => (
              <img key={image.id} src={image.url} alt={image.name} />
            ))}
          </div>
        </section>
        <section className="apf26-review-card">
          <h3>{t("productForm.Category & Type")}</h3>
          <ReviewRow label={t("productForm.Category")} value={review.categoryPath} />
          <ReviewRow label={t("productForm.Product Type")} value={review.productType} />
          <ReviewRow label={t("productForm.Weight")} value={review.weight} />
          <ReviewRow label={t("productForm.Dimensions")} value={review.dimensions} />
        </section>
        <section className="apf26-review-card">
          <h3>{t("productForm.Product Identity")}</h3>
          <ReviewRow label={t("productForm.Product Name")} value={review.productName} />
          <ReviewRow label={t("productForm.Short Description")} value={review.description} />
          <ReviewRow label="SKU" value={review.sku} />
          <ReviewRow label="Barcode" value={review.barcode} />
          <ReviewRow label={t("productForm.Brand")} value={review.brand} />
          <ReviewRow label={t("productForm.Store Ownership")} value={review.storeName} />
        </section>
        <section className="apf26-review-card">
          <h3>{t("productForm.Pricing & Stock")}</h3>
          <ReviewRow label={t("productForm.Base Price")} value={`Rp ${review.basePrice}`} />
          <ReviewRow label={t("productForm.Sale Price")} value={review.salePrice === "-" ? "-" : `Rp ${review.salePrice}`} />
          <ReviewRow label={t("productForm.Low Stock Threshold")} value={review.lowStockThreshold} />
          <ReviewRow label={t("productForm.Quantity in Stock")} value={review.stock} />
          <ReviewRow label={t("productForm.Status")} value={review.status} />
        </section>
        <section className="apf26-review-card">
          <h3>{t("productForm.Product Tags")}</h3>
          <div className="apf26-chip-row">
            {review.tags.length ? (
              review.tags.map((tag) => (
                <span key={tag} className="apf26-chip">
                  {tag}
                </span>
              ))
            ) : (
              <p>{t("productForm.No tags added.")}</p>
            )}
          </div>
        </section>
        <section className="apf26-review-card">
          <h3>{t("productForm.Publication")}</h3>
          <ReviewRow label={t("productForm.Product Status")} value={review.status} />
          <ReviewRow label={t("productForm.Slug")} value={review.slug} />
          <ReviewRow label={t("productForm.Available Channels")} value={t("productForm.Catalog & Search")} />
        </section>
      </div>
      <aside className="apf26-panel">
        <div className="apf26-section-title">
          <h3>{t("productForm.Review Checklist")}</h3>
          <span className="apf26-chip">{t("productForm.All good")}</span>
        </div>
        <div className="apf26-checklist">
          {checklist.map((item) => (
            <div key={item.labelKey} className="apf26-check">
              <span className="apf26-check__icon">
                <Check size={14} />
              </span>
              <div>
                <strong>{t("productForm." + item.labelKey)}</strong>
                <p>{t("productForm." + item.helperKey, item.helperValues)}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="apf26-review-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SuccessState({
  createdProductId,
  onViewProduct,
  onAddAnother,
  onBackToList,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  backLabel,
}) {
  const { t } = useTranslation("admin");
  return (
    <div className="apf26-success">
      <span className="apf26-success__mark">
        <Check size={58} />
      </span>
      <h1>{title || t("productForm.Product Created Successfully")}</h1>
      <p>{description || t("productForm.Your product has been added to the catalog and is ready to go.")}</p>
      <div className="apf26-success__actions">
        <button
          type="button"
          className="apf26-button apf26-button--primary"
          disabled={!createdProductId}
          onClick={onViewProduct}
        >
          <Eye size={18} />
          {primaryLabel || "View Product"}
        </button>
        <button type="button" className="apf26-button" onClick={onAddAnother}>
          <Plus size={18} />
          {secondaryLabel || "Add Another Product"}
        </button>
      </div>
      <button type="button" className="apf26-button apf26-success__back" onClick={onBackToList}>
        <ArrowLeft size={18} />
        {backLabel || "Back to Products List"}
      </button>
    </div>
  );
}

export default function AdminProductForm2026View({
  isEdit = false,
  isLoading = false,
  workflow = "admin",
  loadError = "",
  activeStep,
  maxVisitedStep,
  form,
  seo,
  meta,
  notice,
  stores,
  categories,
  selectedCategories,
  selectedStore,
  defaultCategoryOptions,
  localImages,
  hasVariants,
  selectedAttributes,
  selectedAttributeValues,
  variants,
  pendingAttributeId,
  attributeSearch,
  attributeValueSearch,
  attributeValuesMap,
  attributeValuesLoading,
  variantImageUploadingId,
  availableAttributes,
  tagInput,
  seoKeywordInput,
  isSubmitting,
  createdProductId,
  fileInputRef,
  onClose,
  onRetry,
  onStepClick,
  onNext,
  onPrevious,
  onSaveDraft,
  onPublish,
  onViewProduct,
  onAddAnother,
  onBackToList,
  onFormChange,
  onNameChange,
  onMetaChange,
  onSeoChange,
  onAddFiles,
  onRemoveImage,
  onSetCover,
  onReorderImages,
  onMediaDetailChange,
  onToggleHasVariants,
  onPendingAttributeChange,
  onAttributeSearchChange,
  onAttributeValueSearchChange,
  onAddSelectedAttribute,
  onRemoveSelectedAttribute,
  onToggleAttributeValue,
  onSelectAllAttributeValues,
  onClearVariants,
  onGenerateVariants,
  onVariantFieldChange,
  onRemoveVariant,
  onVariantImageUpload,
  onToggleCategory,
  onTagInputChange,
  onTagKeyDown,
  onRemoveTag,
  onSeoKeywordInputChange,
  onSeoKeywordKeyDown,
  onRemoveSeoKeyword,
  allowGlobalStoreOption = true,
  storeOwnershipLocked = false,
  saveDraftLabel,
  saveDraftBusyLabel,
  finalCreateLabel,
  finalCreateBusyLabel,
  finalEditLabel,
  finalEditBusyLabel,
  successTitle,
  successDescription,
  successPrimaryLabel,
  successSecondaryLabel,
  successBackLabel,
}) {
  const { t } = useTranslation("admin");
  const subtitle =
    isEdit
      ? activeStep === 6
        ? t("productForm.Review your changes before updating this product.")
        : t("productForm.Update product information, media, pricing, inventory, and settings.")
      : activeStep === 6
        ? t("productForm.Review your product details before publishing.")
        : t("productForm.Create a new product and add it to your catalog.");
  const isSuccess = Boolean(createdProductId);

  return (
    <div className="apf26-shell">
      <Header isEdit={isEdit} subtitle={subtitle} onClose={onClose} />
      {isLoading ? (
        <FormState type="loading" message={t("productForm.Fetching the latest product information and inventory.")} />
      ) : loadError ? (
        <FormState type="error" message={loadError} onRetry={onRetry} />
      ) : (
        <>
      <Stepper
        activeStep={activeStep}
        maxVisitedStep={maxVisitedStep}
        onStepClick={onStepClick}
        success={isSuccess}
      />
      {notice ? (
        <div className={`apf26-notice ${notice.type === "success" ? "is-success" : ""}`}>
          {notice.message}
        </div>
      ) : null}
      {isSuccess ? (
        <SuccessState
          createdProductId={createdProductId}
          onViewProduct={onViewProduct}
          onAddAnother={onAddAnother}
          onBackToList={onBackToList}
          title={successTitle}
          description={successDescription}
          primaryLabel={successPrimaryLabel}
          secondaryLabel={successSecondaryLabel}
          backLabel={successBackLabel}
        />
      ) : (
        <>
          <main className="apf26-content">
            {activeStep === 1 ? (
              <BasicStep
                form={form}
                seo={seo}
                stores={stores}
                selectedStoreId={form.storeId}
                meta={meta}
                allowGlobalStoreOption={allowGlobalStoreOption}
                storeOwnershipLocked={storeOwnershipLocked}
                tagInput={tagInput}
                seoKeywordInput={seoKeywordInput}
                onFormChange={onFormChange}
                onNameChange={onNameChange}
                onMetaChange={onMetaChange}
                onSeoChange={onSeoChange}
                onTagInputChange={onTagInputChange}
                onTagKeyDown={onTagKeyDown}
                onRemoveTag={onRemoveTag}
                onSeoKeywordInputChange={onSeoKeywordInputChange}
                onSeoKeywordKeyDown={onSeoKeywordKeyDown}
                onRemoveSeoKeyword={onRemoveSeoKeyword}
              />
            ) : null}
            {activeStep === 2 ? (
              <MediaStep
                form={form}
                meta={meta}
                localImages={localImages}
                fileInputRef={fileInputRef}
                tagInput={tagInput}
                onAddFiles={onAddFiles}
                onRemoveImage={onRemoveImage}
                onSetCover={onSetCover}
                onReorderImages={onReorderImages}
                onMediaDetailChange={onMediaDetailChange}
                onFormChange={onFormChange}
                onTagInputChange={onTagInputChange}
                onTagKeyDown={onTagKeyDown}
                onRemoveTag={onRemoveTag}
              />
            ) : null}
            {activeStep === 3 ? (
              <PricingStep
                form={form}
                meta={meta}
                onFormChange={onFormChange}
                onMetaChange={onMetaChange}
              />
            ) : null}
            {activeStep === 4 ? (
              <VariantsStep
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
                onToggleHasVariants={onToggleHasVariants}
                onPendingAttributeChange={onPendingAttributeChange}
                onAttributeSearchChange={onAttributeSearchChange}
                onAttributeValueSearchChange={onAttributeValueSearchChange}
                onAddSelectedAttribute={onAddSelectedAttribute}
                onRemoveSelectedAttribute={onRemoveSelectedAttribute}
                onToggleAttributeValue={onToggleAttributeValue}
                onSelectAllAttributeValues={onSelectAllAttributeValues}
                onClearVariants={onClearVariants}
                onGenerateVariants={onGenerateVariants}
                onVariantFieldChange={onVariantFieldChange}
                onRemoveVariant={onRemoveVariant}
                onVariantImageUpload={onVariantImageUpload}
              />
            ) : null}
            {activeStep === 5 ? (
              <DetailsStep
                form={form}
                meta={meta}
                categories={categories}
                selectedCategories={selectedCategories}
                defaultCategoryOptions={defaultCategoryOptions}
                tagInput={tagInput}
                onFormChange={onFormChange}
                onMetaChange={onMetaChange}
                onToggleCategory={onToggleCategory}
                onTagInputChange={onTagInputChange}
                onTagKeyDown={onTagKeyDown}
                onRemoveTag={onRemoveTag}
              />
            ) : null}
            {activeStep === 6 ? (
              <ReviewStep
                form={form}
                meta={meta}
                selectedCategories={selectedCategories}
                selectedStore={selectedStore}
                localImages={localImages}
                workflow={workflow}
              />
            ) : null}
          </main>
          <footer className="apf26-actions">
            {activeStep > 1 ? (
              <button type="button" className="apf26-button" onClick={onPrevious} disabled={isSubmitting}>
                Previous
              </button>
            ) : null}
            {activeStep < 6 ? (
              <button
                type="button"
                className="apf26-button apf26-button--primary"
                onClick={onNext}
                disabled={isSubmitting}
              >
                Save & Continue
                <ChevronRight size={18} />
              </button>
            ) : isEdit ? (
              <button
                type="button"
                className="apf26-button apf26-button--accent"
                onClick={onPublish}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? finalEditBusyLabel || t("productForm.Saving Changes...")
                  : finalEditLabel || t("productForm.Save Changes")}
                <Send size={18} />
              </button>
            ) : (
              <>
                <button type="button" className="apf26-button" onClick={onSaveDraft} disabled={isSubmitting}>
                  {isSubmitting
                    ? saveDraftBusyLabel || t("productForm.Saving...")
                    : saveDraftLabel || t("productForm.Save Draft")}
                </button>
                <button
                  type="button"
                  className="apf26-button apf26-button--accent"
                  onClick={onPublish}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? finalCreateBusyLabel || t("productForm.Publishing...")
                    : finalCreateLabel || t("productForm.Publish Product")}
                  <Send size={18} />
                </button>
              </>
            )}
          </footer>
        </>
      )}
        </>
      )}
    </div>
  );
}
