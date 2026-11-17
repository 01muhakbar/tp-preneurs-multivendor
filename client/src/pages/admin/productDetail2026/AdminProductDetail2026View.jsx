import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  Download,
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
  Scale,
  ShieldCheck,
  Store,
  Tag,
  Trash2,
  Truck,
  UserRound,
  X,
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
  const { t } = useTranslation("admin");
  const isLoading = mode === "loading";
  return (
    <div className={`apd26-state apd26-state--${mode}`} role={mode === "error" ? "alert" : "status"}>
      <div className="apd26-state__icon">
        {isLoading ? <RefreshCw className="apd26-spin" /> : mode === "error" ? <RotateCcw /> : <Package />}
      </div>
      <h2>{isLoading ? t("productDetail.Loading product details") : mode === "error" ? t("productDetail.Product details unavailable") : t("productDetail.Product not found")}</h2>
      <p>{message}</p>
      {mode === "error" ? (
        <button type="button" className="apd26-button apd26-button--primary" onClick={onRetry}>
          <RefreshCw size={16} /> {t("productDetail.Retry")}
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
    const { t } = useTranslation("admin");
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const images = product.images || [PRODUCT_DETAIL_FALLBACK_IMAGE];
  
    useEffect(() => setActiveIndex(0), [product.id]);
  
    const selectRelative = (offset) => {
      setActiveIndex((current) => (current + offset + images.length) % images.length);
    };
  
    // Close fullscreen on Escape key
    useEffect(() => {
      if (!isFullscreen) return undefined;
      const onKeyDown = (e) => {
        if (e.key === "Escape") setIsFullscreen(false);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [isFullscreen]);
  
    return (
      <div className="apd26-gallery">
        <div className="apd26-gallery__main">
          {images.length > 1 ? (
            <>
              <button type="button" onClick={() => selectRelative(-1)} aria-label={t("productDetail.Previous product image")}><ChevronLeft /></button>
              <button type="button" onClick={() => selectRelative(1)} aria-label={t("productDetail.Next product image")}><ChevronRight /></button>
            </>
          ) : null}
          <img
            src={images[activeIndex] || PRODUCT_DETAIL_FALLBACK_IMAGE}
            alt={`${product.name} — image ${activeIndex + 1}`}
            onClick={() => setIsFullscreen(true)}
            style={{ cursor: "zoom-in" }}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = PRODUCT_DETAIL_FALLBACK_IMAGE;
            }}
          />
        </div>
      <div className="apd26-gallery__thumbs" aria-label={t("productDetail.Product image gallery")}>
        {images.slice(0, 6).map((image, index) => (
          <button
            type="button"
            key={`${image}-${index}`}
            className={index === activeIndex ? "is-active" : ""}
            onClick={() => setActiveIndex(index)}
            aria-label={t("productDetail.Show product image num", { num: index + 1 })}
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

      {isFullscreen ? (
        <div className="apd26-fullscreen-modal" onClick={() => setIsFullscreen(false)}>
          <button type="button" className="apd26-fullscreen-close" aria-label="Close fullscreen">
            <X size={28} />
          </button>
          <img
            src={images[activeIndex] || PRODUCT_DETAIL_FALLBACK_IMAGE}
            alt={`${product.name} fullscreen`}
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 ? (
            <>
              <button type="button" className="apd26-fullscreen-nav left" onClick={(e) => { e.stopPropagation(); selectRelative(-1); }}>
                <ChevronLeft size={36} />
              </button>
              <button type="button" className="apd26-fullscreen-nav right" onClick={(e) => { e.stopPropagation(); selectRelative(1); }}>
                <ChevronRight size={36} />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MoreMenu({ product, permissions, operation, actions }) {
  const { t } = useTranslation("admin");
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
        {t("productDetail.More")} <ChevronDown size={16} />
      </button>
      {open ? (
        <div className="apd26-more__menu" role="menu">
          <button type="button" role="menuitem" disabled={!permissions.canUpdate || operation.busy} onClick={() => run(actions.onTogglePublish)}>
            <Eye size={16} /> {product.published ? t("productDetail.Unpublish product") : t("productDetail.Publish product")}
          </button>
          <button type="button" role="menuitem" disabled={!permissions.canUpdate || operation.busy} onClick={() => run(actions.onDuplicate)}>
            <Copy size={16} /> {t("productDetail.Duplicate product")}
          </button>
          <button className="is-danger" type="button" role="menuitem" disabled={!permissions.canDelete || operation.busy} onClick={() => run(actions.onDelete)}>
            <Trash2 size={16} /> {t("productDetail.Delete product")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Hero({ product }) {
  const { t } = useTranslation("admin");
  return (
    <section className="apd26-card apd26-hero">
      <Gallery product={product} />
      <div className="apd26-hero__content">
        <div className="apd26-product-heading">
          <div>
            <h2>{product.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
              <p style={{ margin: 0 }}>SKU: <strong>{product.sku}</strong></p>
              {product.isService ? (
                <span className="apd26-badge apd26-badge--warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "700" }}>
                  🛠️ Layanan / Jasa{product.serviceDeliveryType ? ` (${product.serviceDeliveryType === "online" ? "Online" : "On-Site"})` : ""}
                </span>
              ) : product.isDigital ? (
                <span className="apd26-badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "700", background: "rgba(168,85,247,0.15)", color: "#9333ea", border: "1px solid rgba(168,85,247,0.3)" }}>
                  ⚡ Produk Digital
                </span>
              ) : (
                <span className="apd26-badge apd26-badge--neutral" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "700" }}>
                  📦 Produk Fisik
                </span>
              )}
            </div>
          </div>
          <span className={`apd26-badge ${product.published ? "apd26-badge--success" : "apd26-badge--neutral"}`}>
            {product.published ? t("productDetail.Published") : t("productDetail.Draft")}
          </span>
        </div>
        <div className="apd26-price">
          <strong>{moneyIDR(product.effectivePrice)}</strong>
          {product.salePrice ? <del>{moneyIDR(product.price)}</del> : null}
          {product.discountPercent ? <span>-{product.discountPercent}%</span> : null}
        </div>
        <div className="apd26-stock-row">
          <span className={`apd26-badge ${product.stock > 0 ? "apd26-badge--stock" : "apd26-badge--danger"}`}>
            {product.stock > 0 ? t("productDetail.In Stock") : t("productDetail.Out of Stock")}
          </span>
          <span className="apd26-quantity">{t("productDetail.Quantity: ")} {product.stock}</span>
        </div>
        <p className="apd26-description">{product.description}</p>
        <div className="apd26-meta-grid">
          <MetaItem icon={Layers3} label={t("productDetail.Category")} value={product.category} />
          <MetaItem icon={Tag} label={t("productDetail.Tags")} value={product.tags.length ? product.tags.join(", ") : t("productDetail.No tags")} />
          <MetaItem icon={Store} label={t("productDetail.Store Scope")} value={product.storeName} />
          <MetaItem icon={CalendarDays} label={t("productDetail.Created")} value={formatDate(product.createdAt)} />
          <MetaItem icon={Clock3} label={t("productDetail.Updated")} value={formatDate(product.updatedAt)} />
          <MetaItem icon={UserRound} label={t("productDetail.Created By")} value={product.createdBy} />
        </div>
      </div>
    </section>
  );
}

function StatusPanel({ product, operation, actions }) {
  const { t } = useTranslation("admin");
  return (
    <section className="apd26-card apd26-side-card">
      <CardTitle icon={ShieldCheck}>{t("productDetail.Product Status")}</CardTitle>
      <div className="apd26-status-heading">
        <span>{t("productDetail.Publication Status")}</span>
        <span className={`apd26-badge ${product.published ? "apd26-badge--success" : "apd26-badge--neutral"}`}>
          {product.published ? "Published" : "Draft"}
        </span>
      </div>
      <dl className="apd26-detail-list">
        <div><dt>{t("productDetail.Visibility")}</dt><dd className={product.visibility === "Public" ? "is-positive" : ""}>{product.visibility}</dd></div>
        <div><dt>{t("productDetail.Featured")}</dt><dd>{product.featured ? t("productDetail.Yes") : t("productDetail.No")}</dd></div>
        <div><dt>{t("productDetail.Digital Product")}</dt><dd>{product.digital ? t("productDetail.Yes") : t("productDetail.No")}</dd></div>
        <div><dt>{t("productDetail.Backorder")}</dt><dd>{product.backorder ? t("productDetail.Allowed") : t("productDetail.Not allowed")}</dd></div>
      </dl>
      <button type="button" className="apd26-button apd26-button--wide" disabled={!product.slug || operation.busy} onClick={actions.onViewStore}>
        {t("productDetail.View on Store")} <ExternalLink size={15} />
      </button>
    </section>
  );
}

function QuickActions({ product, permissions, operation, actions }) {
  const { t } = useTranslation("admin");
  return (
    <section className="apd26-card apd26-side-card">
      <CardTitle icon={Boxes}>{t("productDetail.Quick Actions")}</CardTitle>
      <div className="apd26-quick-actions">
        <button type="button" disabled={!product.slug || operation.busy} onClick={actions.onViewStore}><ExternalLink /> {t("productDetail.Preview on Store")}</button>
        <button type="button" disabled={!permissions.canUpdate || operation.busy} onClick={actions.onDuplicate}><Copy /> {t("productDetail.Duplicate Product")}</button>
        <button type="button" className="is-warning" disabled={!permissions.canUpdate || operation.busy || product.submissionStatus !== "submitted"} onClick={actions.onRequestRevision} title={product.submissionStatus !== "submitted" ? t("productDetail.Revision can only be requested for submitted seller products.") : ""}><RotateCcw /> {t("productDetail.Request Revision")}</button>
        <button type="button" className="is-danger" disabled={!permissions.canDelete || operation.busy} onClick={actions.onDelete}><Trash2 /> {t("productDetail.Delete Product")}</button>
      </div>
    </section>
  );
}

function VariantsCard({ product, permissions, operation, actions }) {
  const { t } = useTranslation("admin");
  return (
    <section className="apd26-card apd26-variants">
      <CardTitle
        icon={Package}
        action={<button type="button" className="apd26-mini-action" disabled={!permissions.canUpdate || operation.busy} onClick={actions.onManageVariants}>{t("productDetail.+ Manage Variants")}</button>}
      >{t("productDetail.Product Variants")}</CardTitle>
      <div className="apd26-table-wrap">
        <table>
          <thead><tr><th>{t("productDetail.Variant")}</th><th>{t("productDetail.SKU")}</th><th>{t("productDetail.Price")}</th><th>{t("productDetail.Stock")}</th><th>{t("productDetail.Status")}</th></tr></thead>
          <tbody>
            {product.variants.map((variant) => (
              <tr key={variant.id}>
                <td>{variant.name}</td>
                <td>{variant.sku}</td>
                <td>{moneyIDR(variant.price)}</td>
                <td>{variant.stock}</td>
                <td><span className={`apd26-badge ${variant.stock <= 0 ? "apd26-badge--danger" : variant.lowStock ? "apd26-badge--warning" : "apd26-badge--success"}`}>{variant.stock <= 0 ? t("productDetail.Out of Stock") : variant.lowStock ? t("productDetail.Low Stock") : t("productDetail.In Stock")}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="apd26-card-footer">
        <span>{product.variants.length === 1 ? t("productDetail.Showing 1 variant") : t("productDetail.Showing count variant(s)", { count: product.variants.length })}</span>
        <button type="button" disabled={!permissions.canUpdate || operation.busy} onClick={actions.onManageVariants}>{t("productDetail.View All Variants")} <ArrowRight size={15} /></button>
      </div>
    </section>
  );
}

function PricingCard({ product, permissions, operation, actions }) {
  const { t } = useTranslation("admin");
  return (
    <section className="apd26-card apd26-pricing">
      <CardTitle icon={CircleDollarSign}>{t("productDetail.Pricing & Stock")}</CardTitle>
      <dl className="apd26-detail-list">
        <div><dt>{t("productDetail.Base Price")}</dt><dd>{moneyIDR(product.price)}</dd></div>
        <div><dt>{t("productDetail.Sale Price")}</dt><dd className="is-accent">{product.salePrice ? moneyIDR(product.salePrice) : "—"}</dd></div>
        <div><dt>{t("productDetail.Discount")}</dt><dd className="is-positive">{product.discountPercent ? `${product.discountPercent}%` : t("productDetail.No")}</dd></div>
        <div><dt>{t("productDetail.Stock Quantity")}</dt><dd>{product.stock}</dd></div>
        <div><dt>{t("productDetail.Low Stock Threshold")}</dt><dd>{product.lowStockThreshold}</dd></div>
        <div><dt>{t("productDetail.Backorder")}</dt><dd className={!product.backorder ? "is-danger" : "is-positive"}>{product.backorder ? t("productDetail.Allowed") : t("productDetail.Not allowed")}</dd></div>
      </dl>
      <button type="button" className="apd26-button apd26-button--wide" disabled={!permissions.canUpdate || operation.busy} onClick={actions.onManageInventory}>
        <Package size={16} /> {t("productDetail.Manage Inventory")}
      </button>
    </section>
  );
}

function TimelineCard({ product }) {
  const { t } = useTranslation("admin");
  return (
    <section className="apd26-card apd26-timeline-card">
      <CardTitle icon={History}>{t("productDetail.Activity Timeline / Audit")}</CardTitle>
      {product.timeline.length ? (
        <ol className="apd26-timeline">
          {product.timeline.map((entry) => (
            <li key={entry.id} className={`is-${entry.tone}`}>
              <span className="apd26-timeline__dot" />
              <strong>{entry.title}</strong>
              <small>{formatDate(entry.date)} {t("productDetail.by")} {entry.actor}</small>
            </li>
          ))}
        </ol>
      ) : <p className="apd26-empty-note">{t("productDetail.No activity recorded", "No activity recorded.")}</p>}
      <div className="apd26-card-footer"><span>{t("productDetail.Audit summary")}</span><span>{t("productDetail.Latest count events", { count: product.timeline.length })}</span></div>
    </section>
  );
}

function ProductInfoCard({ product }) {
  const { t } = useTranslation("admin");
  const productTypeLabel = product.isService
    ? `Layanan / Jasa (${product.serviceDeliveryType === "onsite" ? "On-Site" : "Online"})`
    : product.isDigital
      ? "Berkas Digital"
      : "Produk Fisik";

  return (
    <section className="apd26-card apd26-product-info">
      <CardTitle icon={Info}>{t("productDetail.Product Info")}</CardTitle>
      <dl className="apd26-detail-list">
        <div><dt>{t("productDetail.Product Type")}</dt><dd><strong>{productTypeLabel}</strong></dd></div>
        <div><dt>{t("productDetail.Created By")}</dt><dd>{product.createdBy}<small>{formatDate(product.createdAt)}</small></dd></div>
        <div><dt>{t("productDetail.Last Updated By")}</dt><dd>{product.updatedBy}<small>{formatDate(product.updatedAt)}</small></dd></div>
        <div><dt>{t("productDetail.Product ID")}</dt><dd>#{product.code}</dd></div>
        <div><dt>{t("productDetail.Store Scope")}</dt><dd>{product.storeName}</dd></div>
      </dl>
    </section>
  );
}

function ProductGovernanceSection({ product }) {
  if (product.isService) {
    return (
      <section className="apd26-card">
        <CardTitle icon={Briefcase}>Informasi Layanan & Jasa (Audit Moderasi)</CardTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(249, 115, 22, 0.08)", border: "1px solid rgba(249, 115, 22, 0.2)" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#ea580c" }}>Mode Pelaksanaan</span>
              <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: "700" }}>
                {product.serviceDeliveryType === "onsite" ? "📍 On-Site (Hadir di Lokasi)" : "🌐 Online / Remote (Jarak Jauh)"}
              </p>
            </div>
            <div style={{ padding: "12px", borderRadius: "8px", background: "var(--apd26-surface-soft, rgba(0,0,0,0.03))", border: "1px solid var(--apd26-border, #e2e8f0)" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--apd26-muted, #64748b)" }}>Estimasi Durasi</span>
              <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: "700" }}>
                {product.serviceDuration || "Sesuai kesepakatan"}
              </p>
            </div>
            <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#16a34a" }}>WhatsApp Hotline Toko</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>{product.serviceContactWhatsapp || "Belum dicantumkan"}</p>
                {product.serviceContactWhatsapp ? (
                  <a
                    href={`https://wa.me/${product.serviceContactWhatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="apd26-button"
                    style={{ fontSize: "11px", padding: "3px 8px", background: "#22c55e", color: "#fff", textDecoration: "none", borderRadius: "4px", fontWeight: "700" }}
                  >
                    Chat WA <ExternalLink size={11} style={{ display: "inline", marginLeft: "2px" }} />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          <div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--apd26-muted, #64748b)" }}>Instruksi Brief untuk Pembeli:</span>
            <div style={{ marginTop: "6px", padding: "12px", borderRadius: "8px", background: "var(--apd26-surface-soft, rgba(0,0,0,0.03))", border: "1px solid var(--apd26-border, #e2e8f0)", fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-line" }}>
              {product.serviceInstructions || "Tidak ada instruksi khusus yang dicantumkan penjual."}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (product.isDigital) {
    return (
      <section className="apd26-card">
        <CardTitle icon={Download}>Informasi Berkas Digital (Audit Moderasi)</CardTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "14px" }}>
          <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#9333ea" }}>Tautan Unduhan Aset Cloud</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", wordBreak: "break-all", fontFamily: "monospace", flex: "1 1 200px" }}>
                {product.digitalAssetUrl || "Belum ada link unduhan yang diinput"}
              </span>
              {product.digitalAssetUrl ? (
                <a
                  href={product.digitalAssetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="apd26-button apd26-button--primary"
                  style={{ fontSize: "12px", padding: "5px 12px", textDecoration: "none" }}
                >
                  <ExternalLink size={13} style={{ marginRight: "4px" }} /> Buka & Periksa Berkas Cloud
                </a>
              ) : null}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--apd26-muted, #64748b)" }}>Petunjuk Akses & Lisensi:</span>
            <div style={{ marginTop: "6px", padding: "12px", borderRadius: "8px", background: "var(--apd26-surface-soft, rgba(0,0,0,0.03))", border: "1px solid var(--apd26-border, #e2e8f0)", fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-line" }}>
              {product.digitalInstructions || "Tidak ada petunjuk khusus."}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="apd26-card">
      <CardTitle icon={Truck}>Informasi Logistik & Pengiriman Fisik</CardTitle>
      <dl className="apd26-detail-list">
        <div><dt>Berat Paket</dt><dd>{product.weight ? `${product.weight} kg` : "—"}</dd></div>
        <div><dt>Dimensi (P × L × T)</dt><dd>{product.length || product.width || product.height ? `${product.length || 0} × ${product.width || 0} × ${product.height || 0} cm` : "—"}</dd></div>
        <div><dt>Bebas Ongkir</dt><dd>Sesuai tarif kurir ekspedisi</dd></div>
      </dl>
    </section>
  );
}

function InsightsCard({ product }) {
  const { t } = useTranslation("admin");
  return (
    <section className="apd26-card apd26-insights">
      <CardTitle icon={FileText}>{t("productDetail.Publication Insights & Notes")}</CardTitle>
      <div className="apd26-insights__grid">
        <div>
          <span>{t("productDetail.Short Description (Internal)")}</span>
          <p>{product.shortDescription || "—"}</p>
          <span>{t("productDetail.Target Audience")}</span>
          <p>{product.categories.length ? product.categories.map((item) => item.name).join(", ") : t("productDetail.All categories", "All categories")}</p>
        </div>
        <div>
          <span>{t("productDetail.Key Themes")}</span>
          <div className="apd26-tag-list">{(product.tags.length ? product.tags : [t("productDetail.General", "General")]).map((tag) => <em key={tag}>{tag}</em>)}</div>
          <span>{t("productDetail.SEO Description")}</span>
          <p>{product.seo.description || "—"}</p>
        </div>
        <div>
          <span>{t("productDetail.Publication Notes")}</span>
          <p>{product.publicationNotes || product.revisionNote || "—"}</p>
          <span>{t("productDetail.SEO Keywords")}</span>
          <div className="apd26-tag-list">{(product.seo.keywords.length ? product.seo.keywords : ["—"]).map((tag) => <em key={tag}>{tag}</em>)}</div>
        </div>
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
  const { t } = useTranslation("admin");

  if (loading) return <StateCard mode="loading" message={t("productDetail.Fetching the latest catalog, inventory, and publication data.")} />;
  if (error) return <StateCard mode="error" message={error} onRetry={actions.onRetry} />;
  if (!product) return <StateCard mode="empty" message={t("productDetail.This product may have been removed or is no longer available.")} />;

  return (
    <div className="apd26-page">
      <header className="apd26-header">
        <div>
          <nav aria-label="Breadcrumb"><span>{t("productDetail.Catalog")}</span><ChevronRight /><span>{t("productDetail.Products")}</span><ChevronRight /><strong>{t("productDetail.Product Details")}</strong></nav>
          <h1>{t("productDetail.Product Details")}</h1>
          <p>{t("productDetail.View and manage product information, inventory, and settings.")}</p>
        </div>
        <div className="apd26-header__actions">
          <button type="button" className="apd26-button" onClick={actions.onBack}><ArrowLeft size={16} /> {t("productDetail.Back to Products")}</button>
          <button type="button" className="apd26-button apd26-button--primary" disabled={!permissions.canUpdate || operation.busy} onClick={actions.onEdit}><Pencil size={16} /> {t("productDetail.Edit Product")}</button>
          <MoreMenu product={product} permissions={permissions} operation={operation} actions={actions} />
        </div>
      </header>

      {operation.busy ? <div className="apd26-operation" role="status"><RefreshCw className="apd26-spin" /> {mutationLabel(operation, t("productDetail.Updating product…"))}</div> : null}

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
      <ProductGovernanceSection product={product} />
      <InsightsCard product={product} />

      {!permissions.canUpdate ? <p className="apd26-permission-note"><BadgeCheck size={16} /> {t("productDetail.You have read-only catalog access. Product mutations require PRODUCTS_UPDATE permission.")}</p> : null}
    </div>
  );
}
