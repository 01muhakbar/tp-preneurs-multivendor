import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  History,
  ImageOff,
  Info,
  Layers3,
  Package,
  Pencil,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Store,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";
import { moneyIDR } from "../../../utils/money.js";
import { PRODUCT_DETAIL_FALLBACK_IMAGE } from "./adminProductDetail2026Adapter.js";
import "./admin-product-detail-2026.css";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : dateFormatter.format(parsed);
};

const mutationLabel = (operation, fallback) => (operation?.busy ? operation.label || fallback : fallback);

function StateCard({ mode, message, onRetry }) {
  const isLoading = mode === "loading";
  return (
    <div className={`apd26-state apd26-state--${mode}`} role={mode === "error" ? "alert" : "status"}>
      <div className="apd26-state__icon">
        {isLoading ? <RefreshCw className="apd26-spin" /> : mode === "error" ? <RotateCcw /> : <Package />}
      </div>
      <h2>{isLoading ? "Loading product details" : mode === "error" ? "Product details unavailable" : "Product not found"}</h2>
      <p>{message}</p>
      {mode === "error" ? (
        <button type="button" className="apd26-button apd26-button--primary" onClick={onRetry}>
          <RefreshCw size={16} /> Retry
        </button>
      ) : null}
      {isLoading ? (
        <div className="apd26-skeletons" aria-hidden="true">
          <span /><span /><span />
        </div>
      ) : null}
    </div>
  );
}

function CardTitle({ icon: Icon, children, action }) {
  return (
    <div className="apd26-card-title">
      <div><Icon size={18} /><h3>{children}</h3></div>
      {action}
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="apd26-meta-item">
      <span className="apd26-meta-item__icon"><Icon size={17} /></span>
      <div><span>{label}</span><strong>{value || "—"}</strong></div>
    </div>
  );
}

function Gallery({ product }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = product.images || [PRODUCT_DETAIL_FALLBACK_IMAGE];

  useEffect(() => setActiveIndex(0), [product.id]);

  const selectRelative = (offset) => {
    setActiveIndex((current) => (current + offset + images.length) % images.length);
  };

  return (
    <div className="apd26-gallery">
      <div className="apd26-gallery__main">
        {images.length > 1 ? (
          <>
            <button type="button" onClick={() => selectRelative(-1)} aria-label="Previous product image"><ChevronLeft /></button>
            <button type="button" onClick={() => selectRelative(1)} aria-label="Next product image"><ChevronRight /></button>
          </>
        ) : null}
        <img
          src={images[activeIndex] || PRODUCT_DETAIL_FALLBACK_IMAGE}
          alt={`${product.name} — image ${activeIndex + 1}`}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = PRODUCT_DETAIL_FALLBACK_IMAGE;
          }}
        />
      </div>
      <div className="apd26-gallery__thumbs" aria-label="Product image gallery">
        {images.slice(0, 6).map((image, index) => (
          <button
            type="button"
            key={`${image}-${index}`}
            className={index === activeIndex ? "is-active" : ""}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show product image ${index + 1}`}
            aria-pressed={index === activeIndex}
          >
            <img
              src={image}
              alt=""
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = PRODUCT_DETAIL_FALLBACK_IMAGE;
              }}
            />
          </button>
        ))}
        {!images.length ? <ImageOff /> : null}
      </div>
    </div>
  );
}

function MoreMenu({ product, permissions, operation, actions }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const run = (callback) => {
    setOpen(false);
    callback();
  };

  return (
    <div className="apd26-more" ref={rootRef}>
      <button
        type="button"
        className="apd26-button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        More <ChevronDown size={16} />
      </button>
      {open ? (
        <div className="apd26-more__menu" role="menu">
          <button type="button" role="menuitem" disabled={!permissions.canUpdate || operation.busy} onClick={() => run(actions.onTogglePublish)}>
            <Eye size={16} /> {product.published ? "Unpublish product" : "Publish product"}
          </button>
          <button type="button" role="menuitem" disabled={!permissions.canUpdate || operation.busy} onClick={() => run(actions.onDuplicate)}>
            <Copy size={16} /> Duplicate product
          </button>
          <button className="is-danger" type="button" role="menuitem" disabled={!permissions.canDelete || operation.busy} onClick={() => run(actions.onDelete)}>
            <Trash2 size={16} /> Delete product
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Hero({ product }) {
  return (
    <section className="apd26-card apd26-hero">
      <Gallery product={product} />
      <div className="apd26-hero__content">
        <div className="apd26-product-heading">
          <div>
            <h2>{product.name}</h2>
            <p>SKU: <strong>{product.sku}</strong></p>
          </div>
          <span className={`apd26-badge ${product.published ? "apd26-badge--success" : "apd26-badge--neutral"}`}>
            {product.published ? "Published" : "Draft"}
          </span>
        </div>
        <div className="apd26-price">
          <strong>{moneyIDR(product.effectivePrice)}</strong>
          {product.salePrice ? <del>{moneyIDR(product.price)}</del> : null}
          {product.discountPercent ? <span>-{product.discountPercent}%</span> : null}
        </div>
        <div className="apd26-stock-row">
          <span className={`apd26-badge ${product.stock > 0 ? "apd26-badge--stock" : "apd26-badge--danger"}`}>
            {product.stock > 0 ? "In Stock" : "Out of Stock"}
          </span>
          <span className="apd26-quantity">Quantity: {product.stock}</span>
        </div>
        <p className="apd26-description">{product.description}</p>
        <div className="apd26-meta-grid">
          <MetaItem icon={Layers3} label="Category" value={product.category} />
          <MetaItem icon={Tag} label="Tags" value={product.tags.length ? product.tags.join(", ") : "No tags"} />
          <MetaItem icon={Store} label="Store Scope" value={product.storeName} />
          <MetaItem icon={CalendarDays} label="Created" value={formatDate(product.createdAt)} />
          <MetaItem icon={Clock3} label="Updated" value={formatDate(product.updatedAt)} />
          <MetaItem icon={UserRound} label="Created By" value={product.createdBy} />
        </div>
      </div>
    </section>
  );
}

function StatusPanel({ product, operation, actions }) {
  return (
    <section className="apd26-card apd26-side-card">
      <CardTitle icon={ShieldCheck}>Product Status</CardTitle>
      <div className="apd26-status-heading">
        <span>Publication Status</span>
        <span className={`apd26-badge ${product.published ? "apd26-badge--success" : "apd26-badge--neutral"}`}>
          {product.published ? "Published" : "Draft"}
        </span>
      </div>
      <dl className="apd26-detail-list">
        <div><dt>Visibility</dt><dd className={product.visibility === "Public" ? "is-positive" : ""}>{product.visibility}</dd></div>
        <div><dt>Featured</dt><dd>{product.featured ? "Yes" : "No"}</dd></div>
        <div><dt>Digital Product</dt><dd>{product.digital ? "Yes" : "No"}</dd></div>
        <div><dt>Backorder</dt><dd>{product.backorder ? "Allowed" : "Not allowed"}</dd></div>
      </dl>
      <button type="button" className="apd26-button apd26-button--wide" disabled={!product.slug || operation.busy} onClick={actions.onViewStore}>
        View on Store <ExternalLink size={15} />
      </button>
    </section>
  );
}

function QuickActions({ product, permissions, operation, actions }) {
  return (
    <section className="apd26-card apd26-side-card">
      <CardTitle icon={Boxes}>Quick Actions</CardTitle>
      <div className="apd26-quick-actions">
        <button type="button" disabled={!product.slug || operation.busy} onClick={actions.onViewStore}><ExternalLink /> Preview on Store</button>
        <button type="button" disabled={!permissions.canUpdate || operation.busy} onClick={actions.onDuplicate}><Copy /> Duplicate Product</button>
        <button type="button" className="is-warning" disabled={!permissions.canUpdate || operation.busy || product.submissionStatus !== "submitted"} onClick={actions.onRequestRevision} title={product.submissionStatus !== "submitted" ? "Revision can only be requested for submitted seller products." : ""}><RotateCcw /> Request Revision</button>
        <button type="button" className="is-danger" disabled={!permissions.canDelete || operation.busy} onClick={actions.onDelete}><Trash2 /> Delete Product</button>
      </div>
    </section>
  );
}

function VariantsCard({ product, permissions, operation, actions }) {
  return (
    <section className="apd26-card apd26-variants">
      <CardTitle
        icon={Package}
        action={<button type="button" className="apd26-mini-action" disabled={!permissions.canUpdate || operation.busy} onClick={actions.onManageVariants}>+ Manage Variants</button>}
      >Product Variants</CardTitle>
      <div className="apd26-table-wrap">
        <table>
          <thead><tr><th>Variant</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
          <tbody>
            {product.variants.map((variant) => (
              <tr key={variant.id}>
                <td>{variant.name}</td>
                <td>{variant.sku}</td>
                <td>{moneyIDR(variant.price)}</td>
                <td>{variant.stock}</td>
                <td><span className={`apd26-badge ${variant.stock <= 0 ? "apd26-badge--danger" : variant.lowStock ? "apd26-badge--warning" : "apd26-badge--success"}`}>{variant.stock <= 0 ? "Out of Stock" : variant.lowStock ? "Low Stock" : "In Stock"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="apd26-card-footer">
        <span>Showing {product.variants.length} variant{product.variants.length === 1 ? "" : "s"}</span>
        <button type="button" disabled={!permissions.canUpdate || operation.busy} onClick={actions.onManageVariants}>View All Variants <ArrowRight size={15} /></button>
      </div>
    </section>
  );
}

function PricingCard({ product, permissions, operation, actions }) {
  return (
    <section className="apd26-card apd26-pricing">
      <CardTitle icon={CircleDollarSign}>Pricing &amp; Stock</CardTitle>
      <dl className="apd26-detail-list">
        <div><dt>Base Price</dt><dd>{moneyIDR(product.price)}</dd></div>
        <div><dt>Sale Price</dt><dd className="is-accent">{product.salePrice ? moneyIDR(product.salePrice) : "—"}</dd></div>
        <div><dt>Discount</dt><dd className="is-positive">{product.discountPercent ? `${product.discountPercent}%` : "No"}</dd></div>
        <div><dt>Stock Quantity</dt><dd>{product.stock}</dd></div>
        <div><dt>Low Stock Threshold</dt><dd>{product.lowStockThreshold}</dd></div>
        <div><dt>Backorder</dt><dd className={!product.backorder ? "is-danger" : "is-positive"}>{product.backorder ? "Allowed" : "Not allowed"}</dd></div>
      </dl>
      <button type="button" className="apd26-button apd26-button--wide" disabled={!permissions.canUpdate || operation.busy} onClick={actions.onManageInventory}>
        <Package size={16} /> Manage Inventory
      </button>
    </section>
  );
}

function TimelineCard({ product }) {
  return (
    <section className="apd26-card apd26-timeline-card">
      <CardTitle icon={History}>Activity Timeline / Audit</CardTitle>
      {product.timeline.length ? (
        <ol className="apd26-timeline">
          {product.timeline.map((entry) => (
            <li key={entry.id} className={`is-${entry.tone}`}>
              <span className="apd26-timeline__dot" />
              <strong>{entry.title}</strong>
              <small>{formatDate(entry.date)} by {entry.actor}</small>
            </li>
          ))}
        </ol>
      ) : <p className="apd26-empty-note">No product activity has been recorded yet.</p>}
      <div className="apd26-card-footer"><span>Audit summary</span><span>Latest {product.timeline.length} events</span></div>
    </section>
  );
}

function ProductInfoCard({ product }) {
  return (
    <section className="apd26-card apd26-product-info">
      <CardTitle icon={Info}>Product Info</CardTitle>
      <dl className="apd26-detail-list">
        <div><dt>Product Type</dt><dd>{product.productType}</dd></div>
        <div><dt>Created By</dt><dd>{product.createdBy}<small>{formatDate(product.createdAt)}</small></dd></div>
        <div><dt>Last Updated By</dt><dd>{product.updatedBy}<small>{formatDate(product.updatedAt)}</small></dd></div>
        <div><dt>Product ID</dt><dd>#{product.code}</dd></div>
        <div><dt>Store Scope</dt><dd>{product.storeName}</dd></div>
      </dl>
    </section>
  );
}

function InsightsCard({ product }) {
  return (
    <section className="apd26-card apd26-insights">
      <CardTitle icon={FileText}>Publication Insights &amp; Notes</CardTitle>
      <div className="apd26-insights__grid">
        <div><span>Short Description (Internal)</span><p>{product.shortDescription || "No internal summary has been added."}</p><span>Target Audience</span><p>{product.categories.length ? `Customers browsing ${product.categories.map((item) => item.name).join(", ")}.` : "General marketplace customers."}</p></div>
        <div><span>Key Themes</span><div className="apd26-tag-list">{(product.tags.length ? product.tags : ["Product catalog"]).map((tag) => <em key={tag}>{tag}</em>)}</div><span>SEO Description</span><p>{product.seo.description || "No SEO description has been added."}</p></div>
        <div><span>Publication Notes</span><p>{product.publicationNotes || product.revisionNote || "No publication notes have been recorded."}</p><span>SEO Keywords</span><div className="apd26-tag-list">{(product.seo.keywords.length ? product.seo.keywords : ["No keywords"]).map((tag) => <em key={tag}>{tag}</em>)}</div></div>
      </div>
    </section>
  );
}

export default function AdminProductDetail2026View({
  product,
  loading,
  error,
  permissions,
  operation,
  actions,
}) {
  if (loading) return <StateCard mode="loading" message="Fetching the latest catalog, inventory, and publication data." />;
  if (error) return <StateCard mode="error" message={error} onRetry={actions.onRetry} />;
  if (!product) return <StateCard mode="empty" message="This product may have been removed or is no longer available." />;

  return (
    <div className="apd26-page">
      <header className="apd26-header">
        <div>
          <nav aria-label="Breadcrumb"><span>Catalog</span><ChevronRight /><span>Products</span><ChevronRight /><strong>Product Details</strong></nav>
          <h1>Product Details</h1>
          <p>View and manage product information, inventory, and settings.</p>
        </div>
        <div className="apd26-header__actions">
          <button type="button" className="apd26-button" onClick={actions.onBack}><ArrowLeft size={16} /> Back to Products</button>
          <button type="button" className="apd26-button apd26-button--primary" disabled={!permissions.canUpdate || operation.busy} onClick={actions.onEdit}><Pencil size={16} /> Edit Product</button>
          <MoreMenu product={product} permissions={permissions} operation={operation} actions={actions} />
        </div>
      </header>

      {operation.busy ? <div className="apd26-operation" role="status"><RefreshCw className="apd26-spin" /> {mutationLabel(operation, "Updating product…")}</div> : null}

      <div className="apd26-hero-layout">
        <Hero product={product} />
        <aside className="apd26-side-stack"><StatusPanel product={product} operation={operation} actions={actions} /><QuickActions product={product} permissions={permissions} operation={operation} actions={actions} /></aside>
      </div>

      <div className="apd26-operations-grid">
        <VariantsCard product={product} permissions={permissions} operation={operation} actions={actions} />
        <PricingCard product={product} permissions={permissions} operation={operation} actions={actions} />
        <TimelineCard product={product} />
        <ProductInfoCard product={product} />
      </div>
      <InsightsCard product={product} />

      {!permissions.canUpdate ? <p className="apd26-permission-note"><BadgeCheck size={16} /> You have read-only catalog access. Product mutations require PRODUCTS_UPDATE permission.</p> : null}
    </div>
  );
}
