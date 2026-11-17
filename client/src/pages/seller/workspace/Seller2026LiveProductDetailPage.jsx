import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Box,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  Globe,
  Heart,
  Image,
  MapPin,
  MessageSquare,
  PackageOpen,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import { adaptSeller2026ProductDetailPresentation } from "../../../api/seller2026/productDetail.adapter.ts";
import { useSeller2026ProductDetail } from "../../../hooks/seller2026/useSeller2026ProductDetail.ts";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../../features/sellerWorkspace2026/SellerWorkspace2026.css";

const currency = (value) =>
  `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
const date = (value) => {
  const parsed = new Date(value);
  return value && !Number.isNaN(parsed.getTime())
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(parsed)
    : "Not available";
};
const tone = (label) => {
  const value = String(label).toLowerCase();
  if (["active", "approved", "visible", "in stock", "listed"].some((item) => value.includes(item))) return "success";
  if (["low", "draft", "revision"].some((item) => value.includes(item))) return "warning";
  if (["pending", "submitted"].some((item) => value.includes(item))) return "info";
  return "neutral";
};
function Pill({ children }) {
  return <span className={`seller2026-pill seller2026-pill--${tone(children)}`}>{children}</span>;
}

export default function Seller2026LiveProductDetailPage() {
  const { productId } = useParams();
  const { sellerContext, workspaceStoreId: storeId, workspaceStoreSlug, workspaceRoutes } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("CATALOG_PRODUCT_READ");
  const canEdit = can("CATALOG_PRODUCT_UPDATE");
  const query = useSeller2026ProductDetail(storeId, productId, { enabled: canView });
  const data = useMemo(() => adaptSeller2026ProductDetailPresentation(query.data), [query.data]);
  const [activeImage, setActiveImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  if (!canView) return <div className="seller2026-dashboard"><div className="seller2026-error"><ShieldCheck size={18} />You do not have permission to view this product.</div></div>;
  if (query.isLoading) return <div className="seller2026-dashboard seller2026-product-detail"><div className="seller2026-skeleton seller2026-skeleton--hero" /></div>;
  if (query.isError || !data) return <div className="seller2026-dashboard"><div className="seller2026-error">Unable to load product.<button type="button" onClick={query.refetch}>Retry</button></div></div>;

  const product = data.product;
  const images = product.gallery || [];
  const publicUrl = product.isPublished && product.slug
    ? `/product/${encodeURIComponent(product.slug)}`
    : null;
  const lifecycle = product.status === "active" ? "Active" : product.status === "submitted" ? "Submitted" : product.status === "needs_revision" ? "Needs Revision" : product.status === "inactive" ? "Archived" : "Draft";

  return (
    <div className="seller2026-dashboard seller2026-product-detail">
      <div className="seller2026-detail__breadcrumbs"><Link to={workspaceRoutes.catalog()}>Catalog</Link><ChevronRight size={14} /><Link to={workspaceRoutes.catalog()}>Products</Link><ChevronRight size={14} /><span>{product.name}</span></div>
      <header className="seller2026-detail__header">
        <div>
          <h1>Product Details</h1>
          <p>Product specifications, inventory, and storefront performance.</p>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginTop: "6px" }}>
            <Pill>{lifecycle}</Pill>
            {product.productType === "service" ? (
              <span className="seller2026-pill" style={{ background: "rgba(249, 115, 22, 0.2)", color: "#f97316", borderColor: "rgba(249, 115, 22, 0.4)", fontWeight: 600 }}>
                🛠️ Layanan (Jasa)
              </span>
            ) : product.productType === "digital" ? (
              <span className="seller2026-pill" style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", borderColor: "rgba(168, 85, 247, 0.4)", fontWeight: 600 }}>
                ⚡ Produk Digital
              </span>
            ) : (
              <span className="seller2026-pill" style={{ background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.4)", fontWeight: 600 }}>
                📦 Produk Fisik
              </span>
            )}
            <Pill>{data.labels.visibility}</Pill>
            <Pill>{data.labels.inventory}</Pill>
            <Pill>{data.labels.review}</Pill>
          </div>
        </div>
        <div><Link to={workspaceRoutes.catalog()}><ArrowLeft size={16} />Back to Catalog</Link>{publicUrl ? <a href={publicUrl} target="_blank" rel="noreferrer"><Eye size={16} />View in Store<ExternalLink size={14} /></a> : <span className="is-disabled"><Eye size={16} />View in Store</span>}{canEdit ? <Link className="is-primary" to={workspaceRoutes.productEdit(product.id)}><Edit3 size={16} />Edit Product</Link> : null}</div>
      </header>

      <section className="seller2026-detail__overview">
        <div className="seller2026-product-gallery">
          <div className="seller2026-product-gallery__main">
            {images[activeImage] ? (
              <img
                src={resolveAssetUrl(images[activeImage])}
                alt={product.name}
                onClick={() => setIsFullscreen(true)}
                style={{ cursor: "zoom-in" }}
              />
            ) : (
              <div><Image size={42} /><span>No image</span></div>
            )}
            <button type="button" className="is-favorite" disabled aria-label="Favorite"><Heart size={20} /></button>
            {images.length > 1 ? (
              <>
                <button type="button" className="is-prev" onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)} aria-label="Previous image"><ChevronLeft /></button>
                <button type="button" className="is-next" onClick={() => setActiveImage((activeImage + 1) % images.length)} aria-label="Next image"><ChevronRight /></button>
              </>
            ) : null}
          </div>
          {images.length ? (
            <div className="seller2026-product-gallery__thumbs">
              {images.slice(0, 5).map((url, index) => (
                <button
                  type="button"
                  className={index === activeImage ? "is-active" : ""}
                  onClick={() => setActiveImage(index)}
                  key={url}
                  aria-label={`View image ${index + 1}`}
                >
                  <img src={resolveAssetUrl(url)} alt="" />
                </button>
              ))}
              {images.length > 5 ? <span>+{images.length - 5}</span> : null}
            </div>
          ) : null}
        </div>

        <div className="seller2026-product-summary">
          <div className="seller2026-product-summary__content">
            <h2>{product.name}</h2><small>{product.slug || product.sku}</small>
            <div className="seller2026-product-summary__price"><strong>{currency(data.pricing.effectivePrice)}</strong>{data.pricing.discount ? <del>{currency(data.pricing.regularPrice)}</del> : null}</div>
            <div className="seller2026-product-summary__stock"><Pill>Stock: {product.stock}</Pill><Pill>Quantity: {product.stock}</Pill><Pill>{data.labels.inventory}</Pill></div>
            <p>{product.description}</p>
            <dl><div><dt><Box size={16} />Category</dt><dd>{product.category}</dd></div><div><dt><Tag size={16} />Tags</dt><dd>{product.tags.length ? product.tags.map((item) => <span key={item}>{item}</span>) : "—"}</dd></div></dl>
          </div>
          <aside className="seller2026-product-summary__meta">
            <div><span>SKU</span><strong>{product.sku}</strong></div>
            <div><span>Visibility</span><strong><Eye size={14} />{data.labels.visibility}</strong></div>
            <div><span>Created</span><strong>{date(product.createdAt)}</strong></div>
            <div><span>Updated</span><strong>{date(product.updatedAt)}</strong></div>
            <div><span>Status</span><Pill>{data.labels.review}</Pill></div>
          </aside>
        </div>
      </section>

      <section className="seller2026-detail__lower">
        <div className="seller2026-detail-card">
          <h2><PackageOpen size={17} />Variant List</h2>
          {data.variants.length ? data.variants.map((variant) => <div className="seller2026-detail-card__variant" key={variant.id}><strong>{variant.name}</strong><span>{variant.sku}</span><span>{currency(variant.price)}</span><span>Stock {variant.stock}</span></div>) : <div className="seller2026-detail-card__empty"><PackageOpen size={38} /><strong>No variants available</strong><span>—</span></div>}
        </div>
        <div className="seller2026-detail-card">
          <h2><Tag size={17} />Pricing Snapshot</h2>
          <dl className="seller2026-detail-card__pricing"><div><dt>Price</dt><dd>{currency(data.pricing.regularPrice)}</dd></div><div><dt>Sale Price</dt><dd className="is-sale">{data.pricing.discount ? currency(data.pricing.effectivePrice) : "-"}</dd></div><div><dt>Discount</dt><dd>{data.pricing.discount}%</dd></div></dl>
          {data.pricing.discount ? <p>{data.pricing.discount}% discount active.</p> : null}
        </div>
        <div className="seller2026-detail-card">
          <h2><Eye size={17} />Storefront Preview &amp; Health</h2>
          <div className="seller2026-detail-card__preview">{images[0] ? <img src={resolveAssetUrl(images[0])} alt="" /> : <Box size={24} />}<div><Pill>{publicUrl ? "Listed on Storefront" : "Not listed"}</Pill><span>{publicUrl ? "Visible in storefront." : "Approval required."}</span>{publicUrl ? <a href={publicUrl} target="_blank" rel="noreferrer">Preview in Store <ExternalLink size={13} /></a> : null}</div></div>
          <div className="seller2026-detail-card__health"><span>Listing Health</span><i><b style={{ width: `${data.listingHealth}%` }} /></i><strong>{data.listingHealth}%</strong></div>
        </div>
        <div className="seller2026-detail-card">
          {product.productType === "service" ? (
            <>
              <h2><Briefcase size={17} />Informasi Layanan &amp; Jasa</h2>
              <dl className="seller2026-detail-card__pricing" style={{ gridTemplateColumns: "1fr" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <dt style={{ display: "flex", alignItems: "center", gap: "6px" }}><Globe size={14} /> Mode Pelaksanaan</dt>
                  <dd style={{ fontWeight: 600 }}>{product.serviceDeliveryType === "onsite" ? "📍 On-Site (Datang ke Lokasi)" : "🌐 Online / Jarak Jauh"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <dt>Estimasi Durasi / Waktu</dt>
                  <dd style={{ fontWeight: 600 }}>{product.serviceDuration || "Sesuai Kesepakatan"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <dt style={{ display: "flex", alignItems: "center", gap: "6px" }}><MessageSquare size={14} /> WhatsApp Hotline</dt>
                  <dd style={{ fontWeight: 600 }}>{product.serviceContactWhatsapp || "Sama dengan nomor toko"}</dd>
                </div>
              </dl>
              {product.serviceInstructions ? (
                <div style={{ marginTop: "10px", fontSize: "12.5px", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <strong style={{ display: "block", marginBottom: "4px", color: "var(--prod-text)" }}>Instruksi untuk Pembeli:</strong>
                  <p style={{ margin: 0, color: "var(--prod-muted)", whiteSpace: "pre-line" }}>{product.serviceInstructions}</p>
                </div>
              ) : null}
            </>
          ) : product.productType === "digital" ? (
            <>
              <h2><Download size={17} />Informasi Berkas Digital</h2>
              <dl className="seller2026-detail-card__pricing" style={{ gridTemplateColumns: "1fr" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <dt>Tautan Berkas Digital</dt>
                  <dd style={{ wordBreak: "break-all", fontWeight: 600 }}>
                    {product.digitalAssetUrl ? (
                      <a href={product.digitalAssetUrl} target="_blank" rel="noreferrer" style={{ color: "#38bdf8" }}>
                        {product.digitalAssetUrl}
                      </a>
                    ) : "-"}
                  </dd>
                </div>
              </dl>
              {product.digitalInstructions ? (
                <div style={{ marginTop: "10px", fontSize: "12.5px", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <strong style={{ display: "block", marginBottom: "4px", color: "var(--prod-text)" }}>Petunjuk Akses / Lisensi:</strong>
                  <p style={{ margin: 0, color: "var(--prod-muted)", whiteSpace: "pre-line" }}>{product.digitalInstructions}</p>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <h2><Box size={17} />Informasi Logistik Fisik</h2>
              <dl className="seller2026-detail-card__pricing">
                <div><dt>Pengiriman</dt><dd>Kurir Logistik</dd></div>
                <div><dt>Status Berat</dt><dd>Dihitung Otomatis</dd></div>
              </dl>
              <p style={{ fontSize: "12px", color: "var(--prod-muted)", marginTop: "8px" }}>
                Produk ini memerlukan kurir pengiriman dan nomor resi ekspedisi.
              </p>
            </>
          )}
        </div>
      </section>

      {isFullscreen && images[activeImage] ? (
        <div className="apd26-fullscreen-modal" onClick={() => setIsFullscreen(false)}>
          <button type="button" className="apd26-fullscreen-close" aria-label="Close fullscreen">
            <X size={28} />
          </button>
          <img
            src={resolveAssetUrl(images[activeImage])}
            alt={`${product.name} fullscreen`}
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 ? (
            <>
              <button
                type="button"
                className="apd26-fullscreen-nav left"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage((activeImage - 1 + images.length) % images.length);
                }}
                aria-label="Previous fullscreen image"
              >
                <ChevronLeft size={36} />
              </button>
              <button
                type="button"
                className="apd26-fullscreen-nav right"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage((activeImage + 1) % images.length);
                }}
                aria-label="Next fullscreen image"
              >
                <ChevronRight size={36} />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
