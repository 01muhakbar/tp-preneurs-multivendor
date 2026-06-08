import React from "react";
import { useParams, Link } from "react-router-dom";
import { useSellerWorkspace2026ProductAuthoring } from "../../features/sellerWorkspace2026/hooks/useSellerWorkspace2026ProductAuthoring.js";
import { Seller2026Shell } from "../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import { Seller2026FallbackBanner } from "../../features/sellerWorkspace2026/components/Seller2026FallbackBanner.jsx";

export default function Seller2026ProductAuthoringPreviewPage({ productionMode = false }) {
  const { storeSlug } = useParams();
  const {
    data,
    form,
    setForm,
    loading,
    saving,
    submitting,
    error,
    saveResult,
    submitResult,
    usingFallback,
    validation,
    saveDraft,
    submitForReview,
    refetch
  } = useSellerWorkspace2026ProductAuthoring(storeSlug);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Seller2026Shell section="products" activeNavOverride="products">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Link
              to={
                productionMode
                  ? `/seller/stores/${encodeURIComponent(storeSlug)}/catalog/products`
                  : `/seller-2026-preview/${storeSlug}/catalog/products`
              }
              style={{
                textDecoration: "none",
                color: "#6b7280",
                fontSize: "14px",
                padding: "6px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                background: "#fff",
              }}
            >
              ← Back
            </Link>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#111827" }}>
              Add Product
            </h1>
          </div>
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
                /seller-2026-preview/{storeSlug}/catalog/products/new
              </code>
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Fallback banner */}
      {usingFallback && (
        <Seller2026FallbackBanner 
          message={
            productionMode
              ? "Live product authoring data is unavailable. Showing fallback data."
              : error
              ? "Live product authoring data is unavailable. Showing preview fallback data."
              : "Live data could not be resolved for this store. Showing preview fallback data."
          }
        />
      )}

      {/* Loading state */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            color: "#6366f1",
            fontSize: "15px",
          }}
        >
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>⏳</div>
          Loading product authoring workspace...
        </div>
      )}

      {!loading && form && (
        <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr 280px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Basic Information */}
            <section style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Basic Information</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Product Name</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    placeholder="e.g. Wireless Mouse"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", minHeight: "100px" }}
                    placeholder="Product description..."
                  />
                </div>
              </div>
            </section>

            {/* Pricing & Inventory */}
            <section style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Pricing & Inventory</h2>
              <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Price (Rp)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Stock</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => handleInputChange("stock", e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    placeholder="0"
                  />
                </div>
              </div>
            </section>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Actions */}
            <section style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Actions</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  onClick={saveDraft}
                  disabled={usingFallback || saving}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    background: usingFallback ? "#f3f4f6" : "#fff",
                    color: usingFallback ? "#9ca3af" : "#374151",
                    border: "1px solid #d1d5db",
                    fontWeight: 600,
                    cursor: usingFallback || saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save Draft"}
                </button>
                {usingFallback && (
                  <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>
                    Save Draft requires live product API.
                  </p>
                )}
                {saveResult?.error && (
                  <p style={{ margin: 0, fontSize: "11px", color: "#ef4444" }}>
                    Failed to save draft.
                  </p>
                )}

                <button
                  onClick={submitForReview}
                  disabled={!data?.meta?.productId || usingFallback || submitting}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    background: !data?.meta?.productId || usingFallback ? "#f3f4f6" : "#6366f1",
                    color: !data?.meta?.productId || usingFallback ? "#9ca3af" : "#fff",
                    border: "none",
                    fontWeight: 600,
                    cursor: !data?.meta?.productId || usingFallback || submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit for Review"}
                </button>
                {(!data?.meta?.productId || usingFallback) && (
                  <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>
                    Submit for Review will be enabled after draft persistence is confirmed.
                  </p>
                )}
                {submitResult?.error && (
                  <p style={{ margin: 0, fontSize: "11px", color: "#ef4444" }}>
                    Failed to submit for review.
                  </p>
                )}
                {submitResult?.success && (
                  <p style={{ margin: 0, fontSize: "11px", color: "#10b981" }}>
                    Successfully submitted for review.
                  </p>
                )}
              </div>
            </section>

            {/* Validation */}
            <section style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Validation</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px", color: "#4b5563" }}>
                <li><span style={{ color: form.title ? "#10b981" : "#9ca3af" }}>{form.title ? "✓" : "○"}</span> Basic Information</li>
                <li><span style={{ color: "#9ca3af" }}>○</span> Media</li>
                <li><span style={{ color: form.price ? "#10b981" : "#9ca3af" }}>{form.price ? "✓" : "○"}</span> Pricing</li>
                <li><span style={{ color: form.stock ? "#10b981" : "#9ca3af" }}>{form.stock ? "✓" : "○"}</span> Inventory</li>
                <li><span style={{ color: "#9ca3af" }}>○</span> Shipping</li>
                <li><span style={{ color: "#9ca3af" }}>○</span> SEO</li>
                <li><span style={{ color: data?.meta?.productId ? "#10b981" : "#9ca3af" }}>{data?.meta?.productId ? "✓" : "○"}</span> Review Readiness</li>
              </ul>
            </section>
          </div>
        </div>
      )}
      </div>
    </Seller2026Shell>
  );
}
