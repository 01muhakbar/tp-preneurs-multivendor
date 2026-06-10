import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Eye,
  FileText,
  Image,
  Layers,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
} from "lucide-react";
import { SELLER_2026_MUTATIONS } from "../../api/seller2026/mutation-flags.ts";
import { hasSeller2026Permission } from "../../api/seller2026/permissions.ts";
import { uploadSellerProductImage } from "../../api/sellerProducts.ts";
import { slugifySeller2026Product } from "../../api/seller2026/productEditor.adapter.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { useSeller2026ProductEditor } from "../../hooks/seller2026/useSeller2026ProductEditor.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/SellerWorkspace2026.css";

function Field({ label, error, children, ...props }) {
  return (
    <label className={`seller2026-editor-field${error ? " has-error" : ""}`}>
      <span>{label}</span>{children || <input {...props} />}{error ? <small>{error}</small> : null}
    </label>
  );
}

export default function Seller2026LiveProductEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { productId } = useParams();
  const imageInputRef = useRef(null);
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes } = useSellerWorkspaceRoute();
  const { can, permissions, sourceAvailable } = getSeller2026PagePermissions(sellerContext);
  const savePermission = mode === "edit" ? "CATALOG_PRODUCT_UPDATE" : "CATALOG_PRODUCT_CREATE";
  const canSave =
    sourceAvailable &&
    hasSeller2026Permission(permissions, savePermission) &&
    SELLER_2026_MUTATIONS.productDraftSave;
  const canSubmit =
    sourceAvailable &&
    hasSeller2026Permission(permissions, "CATALOG_PRODUCT_SUBMIT") &&
    SELLER_2026_MUTATIONS.productSubmitReview;
  const editor = useSeller2026ProductEditor({
    storeId,
    productId,
    mode,
    enabled: mode === "create" || can("CATALOG_PRODUCT_READ"),
    canSave,
    canSubmit,
  });
  const [notice, setNotice] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const initial = useMemo(() => JSON.stringify(editor.detail ? editor.form : editor.form), [editor.detail]);
  const dirty = JSON.stringify(editor.form) !== initial || mode === "create";
  const setValue = (key) => (event) => editor.setForm((current) => ({ ...current, [key]: event.target.value }));
  const persistedId = productId || editor.form.id;

  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    editor.setForm((current) => ({ ...current, tags: Array.from(new Set([...current.tags, value])).slice(0, 20) }));
    setTagInput("");
  };
  const handleImages = async (files) => {
    const selected = Array.from(files || []).slice(0, Math.max(0, 10 - editor.form.images.length));
    if (!selected.length) return;
    setUploading(true);
    setNotice(null);
    try {
      const urls = await Promise.all(selected.map(uploadSellerProductImage));
      editor.setForm((current) => ({ ...current, images: Array.from(new Set([...current.images, ...urls])).slice(0, 10) }));
    } catch (error) {
      setNotice({ type: "error", text: error?.message || "Unable to upload product images." });
    } finally {
      setUploading(false);
    }
  };
  const saveDraft = async () => {
    setNotice(null);
    try {
      const product = await editor.saveDraft();
      const id = product?.id || product?.productId;
      setNotice({ type: "success", text: "Product draft saved." });
      if (mode === "create" && id) navigate(workspaceRoutes.productEdit(id), { replace: true });
      return id;
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || error?.message || "Unable to save product." });
      return null;
    }
  };
  const submitReview = async () => {
    setNotice(null);
    try {
      const id = persistedId || await saveDraft();
      if (!id) return;
      await editor.submitForReview(id);
      setNotice({ type: "success", text: "Product submitted for review." });
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.message || error?.message || "Unable to submit product." });
    }
  };

  if (editor.isLoading) return <div className="seller2026-dashboard seller2026-product-editor"><div className="seller2026-skeleton seller2026-skeleton--hero" /></div>;
  if (editor.isError) return <div className="seller2026-dashboard"><div className="seller2026-error"><AlertTriangle size={18} />Unable to load editor.<button onClick={() => window.location.reload()}>Retry</button></div></div>;

  const status = editor.detail?.product?.status === "submitted" ? "Submitted for Review" : editor.detail?.product?.status === "active" ? "Active" : "Draft";
  const formIsReady =
    Boolean(editor.form.name.trim()) &&
    editor.form.categoryIds.length > 0 &&
    Number.isFinite(Number(editor.form.price)) &&
    Number(editor.form.price) >= 0 &&
    Number.isFinite(Number(editor.form.quantity)) &&
    Number(editor.form.quantity) >= 0;
  const submitDisabled =
    !canSubmit ||
    !formIsReady ||
    editor.isSubmitting ||
    editor.isSaving ||
    (mode === "edit" && !editor.detail?.product?.canSubmitReview);

  return (
    <div className="seller2026-dashboard seller2026-product-editor">
      <header className="seller2026-editor__header">
        <div><h1>Product Editor</h1><p>Create or update your product details and settings.</p></div>
        <div className="seller2026-editor__actions">
          <span>Status</span><button className="seller2026-editor__status"><i />{status}<ChevronDown size={15} /></button>
          <button disabled title="Preview is available after saving"><Eye size={16} />Live Preview</button>
          <button onClick={() => navigate(workspaceRoutes.catalog())}>Cancel</button>
          <button className="is-outline" disabled={!canSave || !dirty || editor.isSaving} onClick={saveDraft}><Save size={16} />{editor.isSaving ? "Saving..." : "Save Draft"}</button>
          <button className="is-primary" disabled={submitDisabled} onClick={submitReview}><ShieldCheck size={16} />{editor.isSubmitting ? "Submitting..." : "Submit for Review"}</button>
          <button disabled><MoreHorizontal size={18} /></button>
        </div>
      </header>

      {notice ? <div className={`seller2026-profile__notice seller2026-profile__notice--${notice.type}`}>{notice.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}{notice.text}</div> : null}

      <form className="seller2026-editor__surface" onSubmit={(event) => event.preventDefault()}>
        <nav className="seller2026-editor__tabs">
          {[["details", FileText], ["media", Image], ["pricing", Tag], ["inventory", Layers], ["seo", Search]].map(([label, Icon], index) => <a className={index === 0 ? "is-active" : ""} href={`#editor-${label}`} key={label}><Icon size={17} />{label[0].toUpperCase() + label.slice(1)}</a>)}
        </nav>

        <section className="seller2026-editor__details" id="editor-details">
          <div className="seller2026-editor__column">
            <Field label="Product Name *" error={editor.validation.name} value={editor.form.name} onChange={(event) => editor.setForm((current) => ({ ...current, name: event.target.value, slug: current.slug || slugifySeller2026Product(event.target.value) }))} />
            <Field label="Product Description"><textarea rows={4} value={editor.form.description} onChange={setValue("description")} /></Field>
            <div className="seller2026-editor__media" id="editor-media">
              <strong>Images</strong>
              <div>
                {editor.form.images.map((url, index) => (
                  <figure key={url}><img src={resolveAssetUrl(url)} alt={`Product ${index + 1}`} />{index === 0 ? <span>Cover</span> : null}<button type="button" onClick={() => window.confirm("Remove this image from the draft?") && editor.setForm((current) => ({ ...current, images: current.images.filter((item) => item !== url) }))}><Trash2 size={13} /></button></figure>
                ))}
                <button className="seller2026-editor__add-image" type="button" onClick={() => imageInputRef.current?.click()} disabled={uploading || editor.form.images.length >= 10}><Plus size={22} />{uploading ? "Uploading..." : "Add Image"}</button>
                <input ref={imageInputRef} hidden multiple accept="image/*" type="file" onChange={(event) => handleImages(event.target.files)} />
              </div>
              <small>Upload up to 10 images. JPG or PNG.</small>
            </div>
          </div>

          <div className="seller2026-editor__column">
            <Field label="Short Description" value={editor.form.shortDescription} disabled title="Short description is not supported by the current seller draft API" />
            <Field label="Categories *" error={editor.validation.categoryIds}>
              <div className="seller2026-editor__category-picker">
                {editor.categories.map((category) => <label key={category.value}><input type="checkbox" checked={editor.form.categoryIds.includes(category.value)} onChange={(event) => editor.setForm((current) => {
                  const categoryIds = event.target.checked ? [...current.categoryIds, category.value] : current.categoryIds.filter((id) => id !== category.value);
                  return { ...current, categoryIds, defaultCategoryId: categoryIds.includes(current.defaultCategoryId) ? current.defaultCategoryId : categoryIds[0] || "" };
                })} />{category.label}</label>)}
              </div>
            </Field>
            <Field label="Default Category *">
              <select value={editor.form.defaultCategoryId} onChange={setValue("defaultCategoryId")}><option value="">Select default category</option>{editor.categories.filter((item) => editor.form.categoryIds.includes(item.value)).map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select>
            </Field>
          </div>
        </section>

        <section className="seller2026-editor__fields" id="editor-pricing">
          <Field label="Product Price *" error={editor.validation.price}><div className="seller2026-editor__money"><span>Rp</span><input type="number" min="0" value={editor.form.price} onChange={setValue("price")} /></div></Field>
          <Field label="Sale Price" error={editor.validation.salePrice}><div className="seller2026-editor__money"><span>Rp</span><input type="number" min="0" value={editor.form.salePrice} onChange={setValue("salePrice")} /></div></Field>
          <Field label="Quantity *" error={editor.validation.quantity} type="number" min="0" value={editor.form.quantity} onChange={setValue("quantity")} />
          <Field label="SKU" value={editor.form.sku} onChange={setValue("sku")} />
          <Field label="Barcode (ISBN / EAN)" value={editor.form.barcode} onChange={setValue("barcode")} />
          <Field label="Product Slug *" value={editor.form.slug} onChange={setValue("slug")} />
          <Field label="Tags">
            <div className="seller2026-editor__tags">{editor.form.tags.map((tag) => <span key={tag}>{tag}<button type="button" aria-label={`Remove ${tag}`} onClick={() => editor.setForm((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }))}>x</button></span>)}<input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} placeholder="Press Enter to add" /></div>
          </Field>
        </section>

        <section className="seller2026-editor__variant" id="editor-inventory">
          <div><strong>This product has variants</strong><span>Variant management is not available in this workflow.</span></div><button className="seller2026-switch" disabled><i /></button>
        </section>

        <section className="seller2026-editor__seo" id="editor-seo">
          <Field label="SEO Title" value={editor.form.seoTitle} onChange={setValue("seoTitle")} />
          <Field label="SEO Description"><textarea rows={3} value={editor.form.seoDescription} onChange={setValue("seoDescription")} /></Field>
        </section>
      </form>
    </div>
  );
}
