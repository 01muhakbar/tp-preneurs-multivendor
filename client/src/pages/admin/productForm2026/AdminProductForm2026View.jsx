import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Box,
  Check,
  ChevronRight,
  Download,
  Eye,
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
} from "./adminProductForm2026Adapter.js";
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
            <span>
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
                  onChange={(event) => onFormChange({ storeId: event.target.value })}
                >
                  <option value="global">{t("productForm.Global (Admin)")}</option>
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
  onMediaDetailChange,
  onFormChange,
  tagInput,
  onTagInputChange,
  onTagKeyDown,
  onRemoveTag,
}) {
  const { t } = useTranslation("admin");
  const coverImage =
    localImages.find((image) => image.id === meta.coverImageId) || localImages[0] || null;
  const selectedDetails = coverImage ? meta.mediaDetails[coverImage.id] || {} : {};

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
        <div className="mt-5 apf26-gallery">
          {localImages.map((image) => {
            const isCover = coverImage?.id === image.id;
            return (
              <div key={image.id} className={`apf26-thumb ${isCover ? "is-cover" : ""}`}>
                <img src={image.url} alt={image.name} />
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
                  onClick={() => onSetCover(image.id)}
                  aria-label={t("productForm.Set cover image")}
                />
              </div>
            );
          })}
        </div>
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

function ReviewStep({ form, meta, selectedCategories, selectedStore, localImages }) {
  const review = buildProductForm2026Review({
    form,
    meta,
    selectedCategories,
    selectedStore,
    localImages,
  });
  const checklist = getProductForm2026Checklist({ form, meta, localImages });

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
            <div key={item.label} className="apf26-check">
              <span className="apf26-check__icon">
                <Check size={14} />
              </span>
              <div>
                <strong>{t("productForm." + item.label)}</strong>
                <p>{t("productForm." + item.helper)}</p>
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

function SuccessState({ createdProductId, onViewProduct, onAddAnother, onBackToList }) {
  const { t } = useTranslation("admin");
  return (
    <div className="apf26-success">
      <span className="apf26-success__mark">
        <Check size={58} />
      </span>
      <h1>{t("productForm.Product Created Successfully")}</h1>
      <p>{t("productForm.Your product has been added to the catalog and is ready to go.")}</p>
      <div className="apf26-success__actions">
        <button
          type="button"
          className="apf26-button apf26-button--primary"
          disabled={!createdProductId}
          onClick={onViewProduct}
        >
          <Eye size={18} />
          View Product
        </button>
        <button type="button" className="apf26-button" onClick={onAddAnother}>
          <Plus size={18} />
          Add Another Product
        </button>
      </div>
      <button type="button" className="apf26-button apf26-success__back" onClick={onBackToList}>
        <ArrowLeft size={18} />
        Back to Products List
      </button>
    </div>
  );
}

export default function AdminProductForm2026View({
  isEdit = false,
  isLoading = false,
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
  onMediaDetailChange,
  onToggleCategory,
  onTagInputChange,
  onTagKeyDown,
  onRemoveTag,
  onSeoKeywordInputChange,
  onSeoKeywordKeyDown,
  onRemoveSeoKeyword,
}) {
  const { t } = useTranslation("admin");
  const subtitle =
    isEdit
      ? activeStep === 5
        ? t("productForm.Review your changes before updating this product.")
        : t("productForm.Update product information, media, pricing, inventory, and settings.")
      : activeStep === 5
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
            {activeStep === 5 ? (
              <ReviewStep
                form={form}
                meta={meta}
                selectedCategories={selectedCategories}
                selectedStore={selectedStore}
                localImages={localImages}
              />
            ) : null}
          </main>
          <footer className="apf26-actions">
            {activeStep > 1 ? (
              <button type="button" className="apf26-button" onClick={onPrevious} disabled={isSubmitting}>
                Previous
              </button>
            ) : null}
            {activeStep < 5 ? (
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
                {isSubmitting ? t("productForm.Saving Changes...") : t("productForm.Save Changes")}
                <Send size={18} />
              </button>
            ) : (
              <>
                <button type="button" className="apf26-button" onClick={onSaveDraft} disabled={isSubmitting}>
                  {isSubmitting ? t("productForm.Saving...") : t("productForm.Save Draft")}
                </button>
                <button
                  type="button"
                  className="apf26-button apf26-button--accent"
                  onClick={onPublish}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("productForm.Publishing...") : t("productForm.Publish Product")}
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
