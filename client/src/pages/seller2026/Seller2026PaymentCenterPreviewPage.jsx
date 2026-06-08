import { useState } from "react";
import { useParams } from "react-router-dom";
import { useSellerWorkspace2026PaymentCenter } from "../../features/sellerWorkspace2026/hooks/useSellerWorkspace2026PaymentCenter.js";
import { Seller2026Shell } from "../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import { Seller2026FallbackBanner } from "../../features/sellerWorkspace2026/components/Seller2026FallbackBanner.jsx";

export function Seller2026PaymentCenterPreviewPage({ productionMode = false }) {
  const { storeSlug } = useParams();
  const { 
    data, 
    loading, 
    error, 
    usingFallback, 
    selectedPaymentId, 
    setSelectedPaymentId,
    refetch,
    actions,
    actionState
  } = useSellerWorkspace2026PaymentCenter(storeSlug);

  const [reviewNote, setReviewNote] = useState("");

  if (error && !data) {
    return (
      <Seller2026Shell section="operations">
        <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
          <h2>Error Loading Payment Center</h2>
          <p>{error.message || "Failed to load payment information."}</p>
        </div>
      </Seller2026Shell>
    );
  }

  const handleRowClick = (id) => {
    if (selectedPaymentId === id) {
      setSelectedPaymentId(null);
    } else {
      setSelectedPaymentId(id);
      setReviewNote("");
    }
  };

  const selectedReview = data?.paymentReviews?.find(r => r.id === selectedPaymentId);

  return (
    <Seller2026Shell section="operations">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div>
          {usingFallback && (
            <Seller2026FallbackBanner 
              compact 
              title={productionMode ? "Fallback Mode" : undefined}
              message={productionMode ? "Live payment data is unavailable. Showing fallback data." : undefined}
            />
          )}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={refetch} style={{ padding: "8px 16px", borderRadius: "8px", background: "#fff", border: "1px solid #d1d5db", cursor: "pointer", fontWeight: 500 }}>
            Refresh
          </button>
        </div>
      </div>
      
      {/* Governance Note */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px 16px", borderRadius: "8px", color: "#1e40af", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <strong>Governance Note:</strong> Admin audit is the final authority for payment settlement and profile verification.
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Pending Reviews", val: data?.summary?.pendingReviews },
          { label: "Verified Payments", val: data?.summary?.verifiedPayments },
          { label: "Rejected Payments", val: data?.summary?.rejectedPayments },
          { label: "Profile Readiness", val: data?.summary?.payoutReadiness },
          { label: "Next Payout", val: new Date(data?.summary?.nextPayoutDate).toLocaleDateString() },
          { label: "Estimated Payout", val: `Rp ${data?.summary?.estimatedPayoutAmount?.toLocaleString("id-ID")}` },
        ].map((stat, i) => (
          <div 
            key={i} 
            style={{ 
              background: "#fff", 
              border: "1px solid #e5e7eb", 
              padding: "16px", borderRadius: "12px", textAlign: "center"
            }}
          >
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
              {stat.val}
            </div>
            <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "24px" }}>
        {/* Main List Column */}
        <div style={{ flex: 2, minWidth: 0, display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Payment Reviews Table */}
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Payment Reviews</h2>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead style={{ borderBottom: "1px solid #e5e7eb" }}>
                <tr>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Invoice / Order ID</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Buyer</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Amount</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Method</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data?.paymentReviews?.length ? (
                  <tr><td colSpan="5" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>Loading reviews...</td></tr>
                ) : data?.paymentReviews?.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>No pending reviews</td></tr>
                ) : (
                  data?.paymentReviews?.map(review => (
                    <tr 
                      key={review.id} 
                      onClick={() => handleRowClick(review.id)}
                      style={{ 
                        borderBottom: "1px solid #e5e7eb", 
                        background: selectedPaymentId === review.id ? "#f3f4f6" : "#fff",
                        cursor: "pointer" 
                      }}
                    >
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontWeight: 600, color: "#111827", marginBottom: "4px" }}>{review.invoiceNumber}</div>
                        <div style={{ color: "#9ca3af", fontSize: "11px" }}>Order: {review.orderId}</div>
                        <div style={{ color: "#9ca3af", fontSize: "11px", marginTop: "4px" }}>{new Date(review.submittedAt).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: "16px", color: "#4b5563" }}>{review.buyerName}</td>
                      <td style={{ padding: "16px", fontWeight: 500 }}>Rp {review.amount?.toLocaleString("id-ID")}</td>
                      <td style={{ padding: "16px", color: "#4b5563" }}>{review.method}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ 
                          padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                          background: review.status === "Verified" ? "#d1fae5" : review.status === "Rejected" ? "#fee2e2" : "#fef3c7",
                          color: review.status === "Verified" ? "#065f46" : review.status === "Rejected" ? "#991b1b" : "#92400e"
                        }}>
                          {review.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Sidebar - Dynamic Context */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {selectedPaymentId && selectedReview ? (
            /* Selected Payment Review Detail */
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Review Details</h2>
                <button onClick={() => setSelectedPaymentId(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#6b7280" }}>×</button>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>Amount</span>
                <div style={{ fontSize: "20px", fontWeight: 700 }}>Rp {selectedReview.amount?.toLocaleString("id-ID")}</div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>Proof</span>
                {selectedReview.proofThumbnails?.length > 0 ? (
                  <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                    {selectedReview.proofThumbnails.map((url, i) => (
                      <img key={i} src={url} alt="Proof" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: "8px", fontSize: "13px", color: "#9ca3af" }}>No proof provided</div>
                )}
              </div>

              {selectedReview.allowedActions.length > 0 && !usingFallback && (
                <div style={{ marginBottom: "20px" }}>
                  <input 
                    type="text" 
                    placeholder="Optional review note..." 
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", marginBottom: "12px" }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    {selectedReview.allowedActions.includes("APPROVE") && (
                      <button 
                        onClick={() => actions.approvePayment(selectedReview.paymentId, reviewNote)}
                        disabled={actionState.isUpdating}
                        style={{ flex: 1, padding: "8px", borderRadius: "6px", background: "#10b981", color: "#fff", border: "none", fontWeight: 600, cursor: actionState.isUpdating ? "not-allowed" : "pointer", fontSize: "13px" }}
                      >
                        Approve
                      </button>
                    )}
                    {selectedReview.allowedActions.includes("REJECT") && (
                      <button 
                        onClick={() => actions.rejectPayment(selectedReview.paymentId, reviewNote)}
                        disabled={actionState.isUpdating}
                        style={{ flex: 1, padding: "8px", borderRadius: "6px", background: "#fff", color: "#ef4444", border: "1px solid #ef4444", fontWeight: 600, cursor: actionState.isUpdating ? "not-allowed" : "pointer", fontSize: "13px" }}
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              )}

              {(!selectedReview.allowedActions.length || usingFallback) && (
                <div style={{ fontSize: "12px", color: "#6b7280", textAlign: "center", background: "#f9fafb", padding: "12px", borderRadius: "6px" }}>
                  Payment actions require live payment review permissions and active endpoints.
                </div>
              )}

              {actionState.error && (
                <div style={{ marginTop: "12px", padding: "8px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", fontSize: "12px", textAlign: "center" }}>
                  {actionState.error}
                </div>
              )}
              {actionState.successMessage && (
                <div style={{ marginTop: "12px", padding: "8px", background: "#ecfdf5", color: "#047857", borderRadius: "6px", fontSize: "12px", textAlign: "center" }}>
                  {actionState.successMessage}
                </div>
              )}
            </div>
          ) : (
            /* Payment Profile / Payout Details */
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Payment Profile</h2>
                <span style={{ 
                  padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                  background: data?.payoutProfile?.activationStatus === "Active" ? "#d1fae5" : "#f3f4f6",
                  color: data?.payoutProfile?.activationStatus === "Active" ? "#065f46" : "#4b5563"
                }}>
                  {data?.payoutProfile?.activationStatus}
                </span>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>Primary Bank Account</span>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827", marginTop: "4px" }}>
                  {data?.payoutProfile?.primaryBank || "Not configured"}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>Status</span>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827", marginTop: "4px" }}>
                  {data?.payoutProfile?.status}
                </div>
              </div>

              <button 
                disabled
                title="Payment profile editing will be connected after status workflow validation."
                style={{ 
                  width: "100%", padding: "10px", borderRadius: "8px", 
                  background: "#f3f4f6", color: "#9ca3af", border: "1px solid #d1d5db", 
                  fontWeight: 600, cursor: "not-allowed" 
                }}
              >
                Update Profile
              </button>
              
              <p style={{ margin: "12px 0 0", fontSize: "11px", color: "#6b7280", textAlign: "center" }}>
                Seller cannot self-activate payout profile.
              </p>
            </div>
          )}

        </div>
      </div>

      </div>
    </Seller2026Shell>
  );
}
