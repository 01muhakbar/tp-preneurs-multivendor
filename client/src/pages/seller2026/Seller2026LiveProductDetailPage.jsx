import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Box,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  Eye,
  Heart,
  Image,
  PackageOpen,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { adaptSeller2026ProductDetailPresentation } from "../../api/seller2026/productDetail.adapter.ts";
import { useSeller2026ProductDetail } from "../../hooks/seller2026/useSeller2026ProductDetail.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/SellerWorkspace2026.css";

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

  if (!canView) return <div className="seller2026-dashboard"><div className="seller2026-error"><ShieldCheck size={18} />You do not have permission to view this product.</div></div>;
  if (query.isLoading) return <div className="seller2026-dashboard seller2026-product-detail"><div className="seller2026-skeleton seller2026-skeleton--hero" /></div>;
  if (query.isError || !data) return <div className="seller2026-dashboard"><div className="seller2026-error">Unable to load product.<button onClick={query.refetch}>Retry</button></div></div>;

  const product = data.product;
  const images = product.gallery || [];
  const publicUrl = product.isPublished && workspaceStoreSlug && product.slug
    ? `/store/${encodeURIComponent(workspaceStoreSlug)}/products/${encodeURIComponent(product.slug)}`
    : null;
  const lifecycle = product.status === "active" ? "Active" : product.status === "submitted" ? "Submitted for Review" : product.status === "needs_revision" ? "Needs Revision" : product.status === "inactive" ? "Archived" : "Draft";

  return (
    <div className="seller2026-dashboard seller2026-product-detail">
      <div className="seller2026-detail__breadcrumbs"><Link to={workspaceRoutes.catalog()}>Catalog</Link><ChevronRight size={14} /><Link to={workspaceRoutes.catalog()}>Products</Link><ChevronRight size={14} /><span>{product.name}</span></div>
      <header className="seller2026-detail__header">
        <div><h1>Product Details</h1><p>View and manage product information, status, and performance.</p><div><Pill>{lifecycle}</Pill><Pill>{data.labels.visibility}</Pill><Pill>{data.labels.inventory}</Pill><Pill>{data.labels.review}</Pill></div></div>
        <div><Link to={workspaceRoutes.catalog()}><ArrowLeft size={16} />Back to Catalog</Link>{publicUrl ? <a href={publicUrl} target="_blank" rel="noreferrer"><Eye size={16} />View in Store<ExternalLink size={14} /></a> : <span className="is-disabled"><Eye size={16} />View in Store</span>}{canEdit ? <Link className="is-primary" to={workspaceRoutes.productEdit(product.id)}><Edit3 size={16} />Edit Product</Link> : null}</div>
      </header>

      <section className="seller2026-detail__overview">
        <div className="seller2026-product-gallery">
          <div className="seller2026-product-gallery__main">
            {images[activeImage] ? <img src={resolveAssetUrl(images[activeImage])} alt={product.name} /> : <div><Image size={42} /><span>No image</span></div>}
            <button className="is-favorite" disabled><Heart size={20} /></button>
            {images.length > 1 ? <><button className="is-prev" onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}><ChevronLeft /></button><button className="is-next" onClick={() => setActiveImage((activeImage + 1) % images.length)}><ChevronRight /></button></> : null}
          </div>
          {images.length ? <div className="seller2026-product-gallery__thumbs">{images.slice(0, 5).map((url, index) => <button className={index === activeImage ? "is-active" : ""} onClick={() => setActiveImage(index)} key={url}><img src={resolveAssetUrl(url)} alt="" /></button>)}{images.length > 5 ? <span>+{images.length - 5}</span> : null}</div> : null}
        </div>

        <div className="seller2026-product-summary">
          <div className="seller2026-product-summary__content">
            <h2>{product.name}</h2><small>{product.slug || product.sku}</small>
            <div className="seller2026-product-summary__price"><strong>{currency(data.pricing.effectivePrice)}</strong>{data.pricing.discount ? <del>{currency(data.pricing.regularPrice)}</del> : null}</div>
            <div className="seller2026-product-summary__stock"><Pill>Stock: {product.stock}</Pill><Pill>Quantity: {product.stock}</Pill><Pill>{data.labels.inventory}</Pill></div>
            <p>{product.description}</p>
            <dl><div><dt><Box size={16} />Category</dt><dd>{product.category}</dd></div><div><dt><Tag size={16} />Tags</dt><dd>{product.tags.length ? product.tags.map((item) => <span key={item}>{item}</span>) : "No tags"}</dd></div></dl>
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
          {data.variants.length ? data.variants.map((variant) => <div className="seller2026-detail-card__variant" key={variant.id}><strong>{variant.name}</strong><span>{variant.sku}</span><span>{currency(variant.price)}</span><span>Stock {variant.stock}</span></div>) : <div className="seller2026-detail-card__empty"><PackageOpen size={38} /><strong>No variants yet</strong><span>This product does not have any variants.</span></div>}
        </div>
        <div className="seller2026-detail-card">
          <h2><Tag size={17} />Pricing Snapshot</h2>
          <dl className="seller2026-detail-card__pricing"><div><dt>Price</dt><dd>{currency(data.pricing.regularPrice)}</dd></div><div><dt>Sale Price</dt><dd className="is-sale">{data.pricing.discount ? currency(data.pricing.effectivePrice) : "-"}</dd></div><div><dt>Discount</dt><dd>{data.pricing.discount}%</dd></div></dl>
          {data.pricing.discount ? <p>You are offering a {data.pricing.discount}% discount on this product.</p> : null}
        </div>
        <div className="seller2026-detail-card">
          <h2><Eye size={17} />Storefront Preview &amp; Health</h2>
          <div className="seller2026-detail-card__preview">{images[0] ? <img src={resolveAssetUrl(images[0])} alt="" /> : <Box size={24} />}<div><Pill>{publicUrl ? "Listed on Storefront" : "Not listed"}</Pill><span>{publicUrl ? "Your product is visible to buyers." : "Publish approval is required."}</span>{publicUrl ? <a href={publicUrl} target="_blank" rel="noreferrer">Preview in Store <ExternalLink size={13} /></a> : null}</div></div>
          <div className="seller2026-detail-card__health"><span>Listing Health</span><i><b style={{ width: `${data.listingHealth}%` }} /></i><strong>{data.listingHealth}%</strong></div>
        </div>
      </section>
    </div>
  );
}
