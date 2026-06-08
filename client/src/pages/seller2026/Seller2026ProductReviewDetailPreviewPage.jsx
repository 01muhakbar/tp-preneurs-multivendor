import { useParams, Link } from "react-router-dom";
import { useSellerWorkspace2026ProductReviewDetail } from "../../features/sellerWorkspace2026/hooks/useSellerWorkspace2026ProductReviewDetail.js";
import { Seller2026Shell } from "../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import { Seller2026FallbackBanner } from "../../features/sellerWorkspace2026/components/Seller2026FallbackBanner.jsx";

export function Seller2026ProductReviewDetailPreviewPage({ productionMode = false }) {
  const { storeSlug, productId } = useParams();
  const { data, loading, error, usingFallback, actions, actionState } = useSellerWorkspace2026ProductReviewDetail(storeSlug, productId);

  if (error) {
    return (
      <Seller2026Shell section="products" activeNavOverride="products">
        <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
          <h2>Error Loading Product Detail</h2>
          <p>{error.message || "Failed to load product information."}</p>
        </div>
      </Seller2026Shell>
    );
  }

  return (
    <Seller2026Shell section="products" activeNavOverride="products">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Link
              to={
                productionMode
                  ? `/seller/stores/${encodeURIComponent(storeSlug)}/catalog/products`
                  : `/seller-2026-preview/${storeSlug}/catalog/products`
              }
              style={{ color: "#6b7280", textDecoration: "none", fontSize: "14px" }}
            >
              ← Back to Catalog
            </Link>
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
            {data?.product?.title || "Product Detail"}
          </h1>
          {usingFallback && (
            <Seller2026FallbackBanner
              compact
              message={
                productionMode
                  ? "Live product detail data is unavailable. Showing fallback data."
                  : undefined
              }
            />
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "48px", color: "#6366f1", fontSize: "15px" }}>
          Loading product details...
        </div>
      )}

      {!loading && data && (
        <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr 320px" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Basic Information */}
            <section style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ width: "120px", height: "120px", background: "#f3f4f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {data.product.thumbnailUrl ? (
                    <img src={data.product.thumbnailUrl} alt={data.product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "12px" }}>No Image</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>{data.product.title}</h2>
                  <div style={{ fontSize: "14px", color: "#4b5563", marginBottom: "8px" }}>
                    SKU: {data.product.sku} | Category: {data.product.category}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
                    Rp {data.product.price?.toLocaleString("id-ID")}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{ padding: "4px 8px", background: "#f3f4f6", borderRadius: "4px", fontSize: "12px", fontWeight: 500 }}>
                      Status: {data.product.status}
                    </span>
                    <span style={{ padding: "4px 8px", background: "#e0e7ff", color: "#3730a3", borderRadius: "4px", fontSize: "12px", fontWeight: 500 }}>
                      Review: {data.product.reviewStatus}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Review Workflow Timeline */}
            <section style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Review Timeline</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {data.review.timeline?.length > 0 ? (
                  data.review.timeline.map((item, index) => (
                    <div key={item.key || index} style={{ display: "flex", gap: "12px" }}>
                      <div style={{ width: "12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#6366f1", marginTop: "4px" }} />
                        {index !== data.review.timeline.length - 1 && (
                          <div style={{ width: "2px", height: "100%", background: "#e5e7eb", flex: 1, marginTop: "4px" }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>{item.label}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                          {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Unknown date"}
                        </div>
                        {item.description && (
                          <div style={{ fontSize: "13px", color: "#4b5563", marginTop: "4px" }}>{item.description}</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: "14px", color: "#6b7280", fontStyle: "italic" }}>
                    No timeline activity recorded yet.
                  </div>
                )}
              </div>
            </section>

            {/* Admin Notes */}
            <section style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Admin Review Notes</h2>
              {(data.review.notes || data.review.revisionNotes) ? (
                <div style={{ background: "#fef2f2", color: "#991b1b", padding: "16px", borderRadius: "8px", fontSize: "14px" }}>
                  {data.review.revisionNotes && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Revision Required:</strong> {data.review.revisionNotes}
                    </div>
                  )}
                  {data.review.notes && (
                    <div>
                      <strong>Notes:</strong> {data.review.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: "14px", color: "#6b7280", fontStyle: "italic", padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
                  No admin review notes yet.
                </div>
              )}
            </section>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Actions */}
            <section style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Actions</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                
                <button
                  onClick={() => actions.saveChanges({})} // Needs full payload map, disabled for preview safety
                  disabled={true} 
                  title="Save Changes requires full payload mapping and is disabled in preview to prevent data loss."
                  style={{
                    width: "100%", padding: "10px", borderRadius: "8px",
                    background: "#f3f4f6", color: "#9ca3af", border: "1px solid #d1d5db",
                    fontWeight: 600, cursor: "not-allowed",
                  }}
                >
                  Save Changes
                </button>

                <button
                  onClick={actions.submitForReview}
                  disabled={(!data.readiness.canSubmitReview && !data.readiness.canResubmit) || usingFallback || actionState.isSubmitting}
                  style={{
                    width: "100%", padding: "10px", borderRadius: "8px",
                    background: (!data.readiness.canSubmitReview && !data.readiness.canResubmit) || usingFallback ? "#f3f4f6" : "#6366f1",
                    color: (!data.readiness.canSubmitReview && !data.readiness.canResubmit) || usingFallback ? "#9ca3af" : "#fff",
                    border: "none", fontWeight: 600,
                    cursor: (!data.readiness.canSubmitReview && !data.readiness.canResubmit) || usingFallback || actionState.isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {actionState.isSubmitting ? "Submitting..." : (data.readiness.canResubmit ? "Resubmit for Review" : "Submit for Review")}
                </button>
                {(!data.readiness.canSubmitReview && !data.readiness.canResubmit) && (
                  <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", textAlign: "center" }}>
                    Submit for Review disabled (check readiness/status).
                  </p>
                )}

                <button
                  onClick={actions.duplicateProduct}
                  disabled={!data.readiness.canDuplicate || usingFallback || actionState.isDuplicating}
                  style={{
                    width: "100%", padding: "10px", borderRadius: "8px",
                    background: !data.readiness.canDuplicate || usingFallback ? "#f3f4f6" : "#fff",
                    color: !data.readiness.canDuplicate || usingFallback ? "#9ca3af" : "#374151",
                    border: "1px solid #d1d5db", fontWeight: 600,
                    cursor: !data.readiness.canDuplicate || usingFallback || actionState.isDuplicating ? "not-allowed" : "pointer",
                  }}
                >
                  {actionState.isDuplicating ? "Duplicating..." : "Duplicate Product"}
                </button>

              </div>
            </section>

            {/* Storefront Visibility Panel */}
            <section style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Storefront Visibility</h2>
              {data.readiness.canViewStorefront ? (
                <div>
                  <p style={{ fontSize: "13px", color: "#4b5563", marginBottom: "12px", marginTop: 0 }}>
                    This product is published and visible to customers.
                  </p>
                  <a
                    href={data.product.storefrontUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block", textAlign: "center", width: "100%", padding: "10px", borderRadius: "8px",
                      background: "#10b981", color: "#fff", textDecoration: "none", fontWeight: 600,
                    }}
                  >
                    View on Storefront
                  </a>
                </div>
              ) : (
                <div style={{ background: "#f9fafb", padding: "16px", borderRadius: "8px" }}>
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, textAlign: "center" }}>
                    This product is not visible on the storefront until it is published.
                  </p>
                  <button
                    disabled
                    style={{
                      width: "100%", padding: "10px", borderRadius: "8px", marginTop: "12px",
                      background: "#e5e7eb", color: "#9ca3af", border: "none", fontWeight: 600, cursor: "not-allowed",
                    }}
                  >
                    View Storefront
                  </button>
                </div>
              )}
            </section>

            {/* Review Readiness */}
            <section style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Review Readiness</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px", color: "#4b5563" }}>
                {data.readiness.items?.map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ color: item.status === "Completed" ? "#10b981" : "#9ca3af", marginTop: "2px" }}>
                      {item.status === "Completed" ? "✓" : "○"}
                    </span>
                    <div>
                      <div>{item.label}</div>
                      {item.message && <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px" }}>{item.message}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

        </div>
      )}
      </div>
    </Seller2026Shell>
  );
}
