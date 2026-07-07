import { useState } from "react";
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
              <strong>{step.label}</strong>
              <span>{step.helper}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Header({ isEdit, subtitle, onClose }) {
  return (
    <header className="apf26-header">
      <div>
        <h1>{isEdit ? "Edit Product" : "Add New Product"}</h1>
        <p>{subtitle || "Create a new product and add it to your catalog."}</p>
      </div>
      <button
        type="button"
        className="apf26-close"
        onClick={onClose}
        aria-label={isEdit ? "Close edit product page" : "Close add product page"}
      >
        <X size={22} />
      </button>
    </header>
  );
}

function FormState({ type, message, onRetry }) {
  return (
    <main className={`apf26-form-state is-${type}`} role={type === "error" ? "alert" : "status"}>
      <span className="apf26-form-state__icon">
        {type === "loading" ? <span className="apf26-loader" /> : <Package size={28} />}
      </span>
      <h2>{type === "loading" ? "Loading product data" : "Unable to load product"}</h2>
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
              label="Product Name"
              required
              placeholder="Enter product name"
              value={form.name}
              onChange={(event) => onNameChange(event.target.value)}
            />
            <TextField
              label="Short Description"
              as="textarea"
              maxLength={300}
              placeholder="Enter a short description about this product..."
              value={form.description}
              onChange={(event) => onFormChange({ description: event.target.value })}
              helper={`${String(form.description || "").length} / 300`}
            />
            <div className="apf26-grid apf26-grid--3">
              <TextField label="Store Ownership" required helper="Product ownership uses storeId as the source of truth.">
                <select
                  className="apf26-select"
                  required
                  aria-required="true"
                  value={selectedStoreId}
                  onChange={(event) => onFormChange({ storeId: event.target.value })}
                >
                  <option value="global">Global (Admin)</option>
                  {stores.map((store) => (
                    <option key={store.id} value={String(store.id)}>
                      {store.name}
                      {store.slug ? ` (${store.slug})` : ""}
                    </option>
                  ))}
                </select>
              </TextField>
              <TextField
                label="Product SKU"
                required
                placeholder="Enter product SKU"
                value={form.sku}
                onChange={(event) => onFormChange({ sku: event.target.value })}
              />
              <TextField
                label="Barcode (ISBN, EAN, UPC)"
                placeholder="Enter barcode (optional)"
                value={form.barcode}
                onChange={(event) => onFormChange({ barcode: event.target.value })}
              />
            </div>
            <div className="apf26-grid apf26-grid--2">
              <TextField label="Brand" helper="Choose the brand this product belongs to.">
                <input
                  className="apf26-input"
                  value={meta.brand}
                  placeholder="Brand (optional)"
                  onChange={(event) => onMetaChange({ brand: event.target.value })}
                />
              </TextField>
              <TextField
                label="Product Slug"
                helper="Auto-generated from product name unless edited."
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
                label="SEO Title"
                placeholder="Leave empty to use product name"
                value={seo.metaTitle}
                onChange={(event) => onSeoChange({ metaTitle: event.target.value })}
              />
              <TextField
                label="SEO Description"
                as="textarea"
                placeholder="Search result description"
                value={seo.metaDescription}
                onChange={(event) => onSeoChange({ metaDescription: event.target.value })}
              />
            </div>
            <TextField label="SEO Keywords">
              <input
                className="apf26-input"
                value={seoKeywordInput}
                onChange={(event) => onSeoKeywordInputChange(event.target.value)}
                onKeyDown={onSeoKeywordKeyDown}
                placeholder="Type keyword and press Enter"
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
            <TextField label="Product Tags">
              <input
                className="apf26-input"
                value={tagInput}
                onChange={(event) => onTagInputChange(event.target.value)}
                onKeyDown={onTagKeyDown}
                placeholder="Add tags and press Enter"
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
  const coverImage =
    localImages.find((image) => image.id === meta.coverImageId) || localImages[0] || null;
  const selectedDetails = coverImage ? meta.mediaDetails[coverImage.id] || {} : {};

  return (
    <div className="apf26-layout-2">
      <section className="apf26-card">
        <div className="apf26-section-title">
          <div>
            <p className="apf26-eyebrow">Media</p>
            <h2>Images</h2>
            <p>Upload product visuals and review selected previews.</p>
          </div>
          <span className="apf26-chip">{localImages.length} / 5 image(s)</span>
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
            <strong>Drag & drop images here</strong>
            <p>Only JPG, PNG, and WEBP images are accepted.</p>
            <p>Up to 5 images. Square 1:1 previews are recommended.</p>
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
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
                <button
                  type="button"
                  className="apf26-thumb__cover"
                  onClick={() => onSetCover(image.id)}
                  aria-label="Set cover image"
                />
              </div>
            );
          })}
        </div>
      </section>
      <aside className="apf26-panel">
        <h3>Image Details</h3>
        {coverImage ? (
          <div className="mt-4 apf26-product-preview">
            <div className="apf26-thumb is-cover">
              <img src={coverImage.url} alt={coverImage.name} />
            </div>
            <p>{coverImage.name}</p>
          </div>
        ) : (
          <p>No image selected yet.</p>
        )}
        <div className="apf26-grid mt-4">
          <TextField label="Alt Text">
            <input
              className="apf26-input"
              value={selectedDetails.alt || ""}
              placeholder="Enter alt text for accessibility"
              disabled={!coverImage}
              onChange={(event) =>
                coverImage ? onMediaDetailChange(coverImage.id, { alt: event.target.value }) : null
              }
            />
          </TextField>
          <TextField label="Caption">
            <textarea
              className="apf26-textarea"
              maxLength={200}
              value={selectedDetails.caption || ""}
              placeholder="Enter a caption or note about this image"
              disabled={!coverImage}
              onChange={(event) =>
                coverImage ? onMediaDetailChange(coverImage.id, { caption: event.target.value }) : null
              }
            />
          </TextField>
          <TextField
            label="Product Slug"
            value={form.slug}
            onChange={(event) => onFormChange({ slug: event.target.value })}
          />
          <TextField label="Product Tags">
            <input
              className="apf26-input"
              value={tagInput}
              onChange={(event) => onTagInputChange(event.target.value)}
              onKeyDown={onTagKeyDown}
              placeholder="Add tags and press Enter"
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
  return (
    <div className="apf26-grid">
      <section className="apf26-card">
        <div className="apf26-section-title">
          <div>
            <p className="apf26-eyebrow">Pricing</p>
            <h2>Pricing</h2>
            <p>Configure base price and sale price for your product.</p>
          </div>
          <span className="apf26-chip">Base + promo pricing</span>
        </div>
        <div className="apf26-grid apf26-grid--2">
          <TextField label="Base Price" required helper="Enter the original price of the product.">
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
          <TextField label="Sale Price" helper="Optional. Leave empty if no sale.">
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
            <p className="apf26-eyebrow">Inventory</p>
            <h2>Inventory</h2>
            <p>Manage stock, status, and product identifiers.</p>
          </div>
        </div>
        <div className="apf26-grid apf26-grid--2">
          <TextField
            label="Stock Quantity"
            required
            type="number"
            min="0"
            step="1"
            value={form.stock}
            helper="Enter available quantity in stock."
            onChange={(event) => onFormChange({ stock: event.target.value })}
          />
          <TextField
            label="Low Stock Threshold"
            type="number"
            min="0"
            step="1"
            value={meta.lowStockThreshold}
            helper="You'll be notified when stock reaches this level."
            onChange={(event) => onMetaChange({ lowStockThreshold: event.target.value })}
          />
          <TextField
            label="SKU (Stock Keeping Unit)"
            required
            value={form.sku}
            helper="Unique identifier for this product."
            onChange={(event) => onFormChange({ sku: event.target.value })}
          />
          <TextField
            label="Product Slug"
            value={form.slug}
            helper="URL-friendly product slug."
            onChange={(event) => onFormChange({ slug: event.target.value })}
          />
        </div>
        <div className="mt-5">
          <label className="mb-2 block text-sm font-extrabold">Status <RequiredMark /></label>
          <div className="apf26-radio-row">
            {[
              { value: "active", label: "Active", helper: "Product is available for purchase." },
              { value: "draft", label: "Draft", helper: "Product is hidden from store." },
              { value: "inactive", label: "Inactive", helper: "Product is disabled." },
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
  return (
    <div className="apf26-grid">
      <div className="apf26-grid apf26-grid--2">
        <section className="apf26-card">
          <h2>Category</h2>
          <p>Choose one or more categories for this product.</p>
          <div className="mt-4 apf26-grid">
            <TextField label="Categories" required>
              <select
                className="apf26-select"
                value=""
                onChange={(event) => {
                  const id = Number(event.target.value);
                  if (id) onToggleCategory(id);
                }}
              >
                <option value="">Select one or more categories</option>
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
            <TextField label="Default Category" required>
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
                <option value="">Default Category</option>
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
          <h2>Product Type <RequiredMark /></h2>
          <p>Choose the type of product you are adding.</p>
          <div className="mt-5 apf26-choice-grid">
            {[
              { value: "physical", label: "Physical", helper: "Shippable physical product", icon: Package },
              { value: "digital", label: "Digital", helper: "Downloadable product", icon: Download },
              { value: "service", label: "Service", helper: "Non-shippable service", icon: Box },
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
          <h2>Weight <span className="font-normal">(Optional)</span></h2>
          <p>Provide weight if applicable.</p>
          <div className="mt-4 apf26-grid apf26-grid--2">
            <TextField
              label="Weight"
              type="number"
              min="0"
              step="0.01"
              value={meta.weight}
              onChange={(event) => onMetaChange({ weight: event.target.value })}
            />
            <TextField label="Unit">
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
          <h2>Dimensions <span className="font-normal">(Optional)</span></h2>
          <p>Provide product dimensions if applicable.</p>
          <div className="mt-4 apf26-grid apf26-grid--3">
            {["length", "width", "height"].map((field) => (
              <TextField
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
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
          <h2>Tags <span className="font-normal">(Optional)</span></h2>
          <p>Add tags to help organize and find this product.</p>
          <input
            className="apf26-input mt-4"
            value={tagInput}
            onChange={(event) => onTagInputChange(event.target.value)}
            onKeyDown={onTagKeyDown}
            placeholder="Enter tag and press Enter"
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
          <h2>Additional Notes <span className="font-normal">(Optional)</span></h2>
          <p>Add any additional information about this product.</p>
          <textarea
            className="apf26-textarea mt-4"
            maxLength={300}
            value={meta.additionalNotes}
            onChange={(event) => onMetaChange({ additionalNotes: event.target.value })}
            placeholder="Enter additional notes..."
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
          <h3>Product Images ({localImages.length})</h3>
          <div className="apf26-review-images">
            {localImages.slice(0, 5).map((image) => (
              <img key={image.id} src={image.url} alt={image.name} />
            ))}
          </div>
        </section>
        <section className="apf26-review-card">
          <h3>Category & Type</h3>
          <ReviewRow label="Category" value={review.categoryPath} />
          <ReviewRow label="Product Type" value={review.productType} />
          <ReviewRow label="Weight" value={review.weight} />
          <ReviewRow label="Dimensions" value={review.dimensions} />
        </section>
        <section className="apf26-review-card">
          <h3>Product Identity</h3>
          <ReviewRow label="Product Name" value={review.productName} />
          <ReviewRow label="Short Description" value={review.description} />
          <ReviewRow label="SKU" value={review.sku} />
          <ReviewRow label="Barcode" value={review.barcode} />
          <ReviewRow label="Brand" value={review.brand} />
          <ReviewRow label="Store Ownership" value={review.storeName} />
        </section>
        <section className="apf26-review-card">
          <h3>Pricing & Stock</h3>
          <ReviewRow label="Base Price" value={`Rp ${review.basePrice}`} />
          <ReviewRow label="Sale Price" value={review.salePrice === "-" ? "-" : `Rp ${review.salePrice}`} />
          <ReviewRow label="Low Stock Threshold" value={review.lowStockThreshold} />
          <ReviewRow label="Quantity in Stock" value={review.stock} />
          <ReviewRow label="Status" value={review.status} />
        </section>
        <section className="apf26-review-card">
          <h3>Product Tags</h3>
          <div className="apf26-chip-row">
            {review.tags.length ? (
              review.tags.map((tag) => (
                <span key={tag} className="apf26-chip">
                  {tag}
                </span>
              ))
            ) : (
              <p>No tags added.</p>
            )}
          </div>
        </section>
        <section className="apf26-review-card">
          <h3>Publication</h3>
          <ReviewRow label="Product Status" value={review.status} />
          <ReviewRow label="Slug" value={review.slug} />
          <ReviewRow label="Available Channels" value="Catalog & Search" />
        </section>
      </div>
      <aside className="apf26-panel">
        <div className="apf26-section-title">
          <h3>Review Checklist</h3>
          <span className="apf26-chip">All good</span>
        </div>
        <div className="apf26-checklist">
          {checklist.map((item) => (
            <div key={item.label} className="apf26-check">
              <span className="apf26-check__icon">
                <Check size={14} />
              </span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.helper}</p>
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
  return (
    <div className="apf26-success">
      <span className="apf26-success__mark">
        <Check size={58} />
      </span>
      <h1>Product Created Successfully</h1>
      <p>Your product has been added to the catalog and is ready to go.</p>
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
  const subtitle =
    isEdit
      ? activeStep === 5
        ? "Review your changes before updating this product."
        : "Update product information, media, pricing, inventory, and settings."
      : activeStep === 5
        ? "Review your product details before publishing."
        : "Create a new product and add it to your catalog.";
  const isSuccess = Boolean(createdProductId);

  return (
    <div className="apf26-shell">
      <Header isEdit={isEdit} subtitle={subtitle} onClose={onClose} />
      {isLoading ? (
        <FormState type="loading" message="Fetching the latest product information and inventory." />
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
                {isSubmitting ? "Saving Changes..." : "Save Changes"}
                <Send size={18} />
              </button>
            ) : (
              <>
                <button type="button" className="apf26-button" onClick={onSaveDraft} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  className="apf26-button apf26-button--accent"
                  onClick={onPublish}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Publishing..." : "Publish Product"}
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
