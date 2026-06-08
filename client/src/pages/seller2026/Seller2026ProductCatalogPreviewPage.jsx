import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSellerWorkspace2026ProductCatalog } from "../../features/sellerWorkspace2026/hooks/useSellerWorkspace2026ProductCatalog.js";
import { Seller2026Shell } from "../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import { Seller2026FallbackBanner } from "../../features/sellerWorkspace2026/components/Seller2026FallbackBanner.jsx";

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------
const STATUS_TONE = {
  Published: { bg: "#d1fae5", color: "#065f46" },
  Draft: { bg: "#f3f4f6", color: "#374151" },
  Hidden: { bg: "#fef3c7", color: "#92400e" },
  "In Review": { bg: "#dbeafe", color: "#1e40af" },
  "Revision Required": { bg: "#fee2e2", color: "#991b1b" },
  Rejected: { bg: "#fee2e2", color: "#991b1b" },
  Approved: { bg: "#d1fae5", color: "#065f46" },
  "Not Submitted": { bg: "#f3f4f6", color: "#6b7280" },
  "Ready to Submit": { bg: "#e0e7ff", color: "#3730a3" },
  Unknown: { bg: "#f9fafb", color: "#9ca3af" },
};

function StatusBadge({ label }) {
  const tone = STATUS_TONE[label] ?? STATUS_TONE["Unknown"];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 600,
        background: tone.bg,
        color: tone.color,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Summary card row
// ---------------------------------------------------------------------------
function SummaryBar({ summary }) {
  const items = [
    { label: "Total", value: summary.totalProducts, color: "#6366f1" },
    { label: "Published", value: summary.published, color: "#10b981" },
    { label: "Draft", value: summary.draft, color: "#6b7280" },
    { label: "In Review", value: summary.inReview, color: "#3b82f6" },
    { label: "Revision", value: summary.revisionRequired, color: "#f59e0b" },
    { label: "Hidden", value: summary.hidden, color: "#d97706" },
    { label: "Out of Stock", value: summary.outOfStock, color: "#ef4444" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "20px",
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "10px 16px",
            minWidth: "90px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: item.color,
              lineHeight: 1.2,
            }}
          >
            {item.value}
          </div>
          <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter bar (frontend-side filtering in preview)
// ---------------------------------------------------------------------------
function FilterBar({ filters, setFilters, filterOptions }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginBottom: "16px",
        alignItems: "center",
      }}
    >
      <input
        type="text"
        placeholder="Search product name or SKU..."
        value={filters.keyword}
        onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value, page: 1 }))}
        style={{
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          padding: "7px 12px",
          fontSize: "13px",
          minWidth: "200px",
          flex: "1 1 200px",
          outline: "none",
        }}
        id="seller2026-product-search"
      />

      <select
        value={filters.status}
        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
        style={{
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          padding: "7px 10px",
          fontSize: "13px",
          background: "#fff",
        }}
        id="seller2026-product-status-filter"
      >
        {filterOptions.statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={filters.submissionStatus}
        onChange={(e) =>
          setFilters((f) => ({ ...f, submissionStatus: e.target.value, page: 1 }))
        }
        style={{
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          padding: "7px 10px",
          fontSize: "13px",
          background: "#fff",
        }}
        id="seller2026-product-review-filter"
      >
        {filterOptions.submissionStatuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product table
// ---------------------------------------------------------------------------
function ProductTable({ products, storeSlug }) {
  if (!products.length) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 24px",
          color: "#6b7280",
          background: "#f9fafb",
          borderRadius: "10px",
          border: "1px dashed #d1d5db",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>📦</div>
        <div style={{ fontSize: "15px", fontWeight: 600 }}>
          No products found for this store.
        </div>
        <div style={{ fontSize: "13px", marginTop: "4px" }}>
          Try adjusting your filters, or add a new product.
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          background: "#fff",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        <thead>
          <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            {["Product", "SKU", "Category", "Stock", "Price", "Status", "Review", "Updated", "Actions"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {products.map((product, i) => (
            <tr
              key={product.id ?? i}
              style={{
                borderBottom: "1px solid #f3f4f6",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Product title + thumbnail */}
              <td style={{ padding: "10px 12px", maxWidth: "220px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      style={{
                        width: "36px",
                        height: "36px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        background: "#e5e7eb",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        flexShrink: 0,
                      }}
                    >
                      🖼️
                    </div>
                  )}
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#111827",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={product.title}
                  >
                    {product.title}
                  </span>
                </div>
              </td>
              <td style={{ padding: "10px 12px", color: "#6b7280", fontFamily: "monospace", fontSize: "11px" }}>
                {product.sku ?? "—"}
              </td>
              <td style={{ padding: "10px 12px", color: "#374151" }}>
                {product.category ?? "—"}
              </td>
              <td style={{ padding: "10px 12px" }}>
                {product.stock === 0 ? (
                  <span style={{ color: "#ef4444", fontWeight: 600 }}>Out of Stock</span>
                ) : (
                  <span style={{ color: "#111827" }}>{product.stock}</span>
                )}
              </td>
              <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: "#111827" }}>
                {product.price != null
                  ? `Rp ${Number(product.price).toLocaleString("id-ID")}`
                  : "—"}
              </td>
              <td style={{ padding: "10px 12px" }}>
                <StatusBadge label={product.status} />
              </td>
              <td style={{ padding: "10px 12px" }}>
                <StatusBadge label={product.reviewStatus} />
              </td>
              <td style={{ padding: "10px 12px", color: "#9ca3af", whiteSpace: "nowrap", fontSize: "12px" }}>
                {product.updatedAt ?? "—"}
              </td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  {/* View action — read-only, safe */}
                  <button
                    title="View product (preview only)"
                    style={{
                      padding: "4px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      background: "#fff",
                      color: "#374151",
                      fontSize: "12px",
                      cursor: "default",
                    }}
                    disabled
                  >
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function Seller2026ProductCatalogPreviewPage({ productionMode = false }) {
  const { storeSlug } = useParams();

  const { data, loading, error, usingFallback, filters, setFilters, refetch } =
    useSellerWorkspace2026ProductCatalog(storeSlug);

  return (
    <Seller2026Shell section="products">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#111827" }}>
            Product Catalog
          </h1>
          {!productionMode && (
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>
              Preview route:{" "}
              <code
                style={{
                  background: "#f3f4f6",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
              >
                /seller-2026-preview/{storeSlug}/catalog/products
              </code>
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Add Product */}
          <Link
            to={
              productionMode
                ? `/seller/stores/${encodeURIComponent(storeSlug)}/catalog/products/new`
                : `/seller-2026-preview/${storeSlug}`
            }
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "#6366f1",
              color: "#fff",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            id="seller2026-add-product-cta"
          >
            + Add Product
          </Link>

          <button
            onClick={refetch}
            style={{
              padding: "7px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              background: "#fff",
              cursor: "pointer",
              fontSize: "13px",
              color: "#374151",
            }}
            id="seller2026-product-refetch"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {usingFallback && (
        <Seller2026FallbackBanner 
          message={
            productionMode
              ? "Live product catalog data is unavailable. Showing fallback data."
              : error
              ? "Live product catalog data is unavailable. Showing preview fallback data."
              : "Live data could not be resolved for this store. Showing preview fallback data."
          }
        />
      )}

      {/* Bulk actions notice */}
      <div
        style={{
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "8px",
          padding: "8px 14px",
          marginBottom: "16px",
          fontSize: "12px",
          color: "#0369a1",
        }}
      >
        ℹ {productionMode ? "Bulk actions will be connected after production safety validation." : "Bulk actions will be connected in a later task. View and filter are available now."}
      </div>

      {/* Loading state */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            color: "#6366f1",
            fontSize: "15px",
          }}
          id="seller2026-product-loading"
        >
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>⏳</div>
          Loading live product catalog data...
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary bar */}
          <SummaryBar summary={data.summary} />

          {/* Filter bar */}
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            filterOptions={data.filters}
          />

          {/* Product table */}
          <ProductTable products={data.products} storeSlug={storeSlug} />

          {/* Pagination info */}
          {data.meta && (
            <div
              style={{
                marginTop: "12px",
                fontSize: "12px",
                color: "#9ca3af",
                textAlign: "right",
              }}
            >
              Showing {data.products.length} of {data.meta.total} products
              {usingFallback ? (productionMode ? " (fallback)" : " (preview fallback)") : " (live)"}
              {" — "}Page {data.meta.page}
            </div>
          )}
        </>
      )}

      {!loading && !data && (
        <div style={{ textAlign: "center", padding: "48px", color: "#6b7280" }}>
          No product catalog data available.
        </div>
      )}
    </Seller2026Shell>
  );
}
