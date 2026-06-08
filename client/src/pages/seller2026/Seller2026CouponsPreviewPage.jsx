import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSellerWorkspace2026Coupons } from "../../features/sellerWorkspace2026/hooks/useSellerWorkspace2026Coupons.js";
import { Seller2026Shell } from "../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import { Seller2026FallbackBanner } from "../../features/sellerWorkspace2026/components/Seller2026FallbackBanner.jsx";

export function Seller2026CouponsPreviewPage({ productionMode = false }) {
  const { storeSlug } = useParams();
  const { 
    data, 
    loading, 
    error, 
    usingFallback, 
    filters,
    setFilters,
    selectedCouponId, 
    setSelectedCouponId,
    refetch,
    actions,
    actionState
  } = useSellerWorkspace2026Coupons(storeSlug);

  if (error && !data) {
    return (
      <Seller2026Shell section="taxonomy">
        <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
          <h2>Error Loading Coupons</h2>
          <p>{error.message || "Failed to load coupon information."}</p>
        </div>
      </Seller2026Shell>
    );
  }

  const filteredCoupons = useMemo(() => {
    let result = data?.coupons || [];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }
    if (filters.scope !== "all") {
      result = result.filter(c => c.scope === filters.scope);
    }
    if (filters.status !== "all") {
      result = result.filter(c => c.status === filters.status);
    }
    return result;
  }, [data?.coupons, filters]);

  const selectedCoupon = data?.coupons?.find(c => c.id === selectedCouponId);

  return (
    <Seller2026Shell section="taxonomy">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div>
          {usingFallback && <Seller2026FallbackBanner compact message={productionMode ? "Live coupon data is unavailable. Showing fallback data." : undefined} />}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={refetch} style={{ padding: "8px 16px", borderRadius: "8px", background: "#fff", border: "1px solid #d1d5db", cursor: "pointer", fontWeight: 500 }}>
            Refresh
          </button>
          <button 
            disabled 
            title="Coupon mutations will be connected after attribution validation."
            style={{ padding: "8px 16px", borderRadius: "8px", background: "#4f46e5", color: "#fff", border: "none", opacity: 0.5, cursor: "not-allowed", fontWeight: 500 }}
          >
            Create Coupon
          </button>
          <button 
            disabled 
            title="Campaign actions will be connected after workflow validation."
            style={{ padding: "8px 16px", borderRadius: "8px", background: "#fff", border: "1px solid #d1d5db", opacity: 0.5, cursor: "not-allowed", fontWeight: 500 }}
          >
            Campaign Action
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "8px" }}>
        {[
          { label: "Active Coupons", val: data?.summary?.activeCoupons },
          { label: "Scheduled Campaigns", val: data?.summary?.scheduledCampaigns },
          { label: "Total Redemptions", val: data?.summary?.totalRedemptions },
          { label: "Attributed Revenue", val: `Rp ${data?.summary?.attributedRevenue?.toLocaleString("id-ID")}` },
          { label: "Conflict Warnings", val: data?.summary?.conflictWarnings, alert: data?.summary?.conflictWarnings > 0 },
        ].map((stat, i) => (
          <div 
            key={i} 
            style={{ 
              background: stat.alert ? "#fef2f2" : "#fff", 
              border: `1px solid ${stat.alert ? "#fecaca" : "#e5e7eb"}`, 
              padding: "16px", borderRadius: "12px", textAlign: "center"
            }}
          >
            <div style={{ fontSize: "20px", fontWeight: 700, color: stat.alert ? "#991b1b" : "#111827" }}>
              {stat.val}
            </div>
            <div style={{ fontSize: "13px", color: stat.alert ? "#991b1b" : "#6b7280", marginTop: "4px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        
        {/* Main Area */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
          
          {/* Filters */}
          <div style={{ display: "flex", gap: "12px", background: "#f9fafb", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <input 
              type="text" 
              placeholder="Search code or name..." 
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
            />
            <select 
              value={filters.scope} 
              onChange={e => setFilters(prev => ({ ...prev, scope: e.target.value }))}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
            >
              <option value="all">All Scopes</option>
              <option value="Store Coupon">Store Coupon</option>
              <option value="Platform Coupon">Platform Coupon</option>
            </select>
            <select 
              value={filters.status} 
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Code / Name</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Scope</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Discount</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Validity</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !filteredCoupons.length ? (
                    <tr><td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>Loading live coupon data...</td></tr>
                  ) : filteredCoupons.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>No coupons found</td></tr>
                  ) : (
                    filteredCoupons.map(coupon => (
                      <tr 
                        key={coupon.id} 
                        style={{ borderBottom: "1px solid #e5e7eb", background: selectedCouponId === coupon.id ? "#f3f4f6" : "#fff" }}
                      >
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontWeight: 600, color: "#111827", marginBottom: "4px" }}>{coupon.code}</div>
                          <div style={{ color: "#6b7280", fontSize: "12px" }}>{coupon.name}</div>
                        </td>
                        <td style={{ padding: "16px", color: "#4b5563" }}>
                          {coupon.scope}
                          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Attr: {coupon.attribution || 'Requires Verification'}</div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontWeight: 500 }}>
                            {coupon.discountType === "Percentage" ? `${coupon.discountValue}%` : `Rp ${coupon.discountValue?.toLocaleString("id-ID")}`}
                          </div>
                          {coupon.minPurchase > 0 && <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>Min. Rp {coupon.minPurchase.toLocaleString("id-ID")}</div>}
                        </td>
                        <td style={{ padding: "16px", color: "#4b5563" }}>
                          {coupon.validFrom ? new Date(coupon.validFrom).toLocaleDateString() : '-'} <br/>
                          to {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ 
                            padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                            background: coupon.status === "Active" ? "#d1fae5" : coupon.status === "Expired" ? "#f3f4f6" : "#fef3c7",
                            color: coupon.status === "Active" ? "#065f46" : coupon.status === "Expired" ? "#4b5563" : "#92400e"
                          }}>
                            {coupon.status}
                          </span>
                        </td>
                        <td style={{ padding: "16px", textAlign: "right" }}>
                          <button 
                            onClick={() => setSelectedCouponId(coupon.id === selectedCouponId ? null : coupon.id)}
                            style={{ background: "none", border: "1px solid #d1d5db", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {selectedCouponId && selectedCoupon ? (
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Coupon Details</h2>
                <button onClick={() => setSelectedCouponId(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#6b7280" }}>×</button>
              </div>

              <div style={{ background: "#f9fafb", border: "1px dashed #d1d5db", padding: "16px", textAlign: "center", borderRadius: "8px", marginBottom: "16px" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#111827", letterSpacing: "1px" }}>{selectedCoupon.code}</div>
              </div>

              <div style={{ display: "grid", gap: "12px", fontSize: "13px" }}>
                <div><span style={{ color: "#6b7280" }}>Discount:</span> <span style={{ fontWeight: 500 }}>{selectedCoupon.discountType === "Percentage" ? `${selectedCoupon.discountValue}%` : `Rp ${selectedCoupon.discountValue?.toLocaleString("id-ID")}`}</span></div>
                <div><span style={{ color: "#6b7280" }}>Scope:</span> <span style={{ fontWeight: 500 }}>{selectedCoupon.scope}</span></div>
                <div><span style={{ color: "#6b7280" }}>Eligibility:</span> <span style={{ fontWeight: 500 }}>{selectedCoupon.storefrontEligibility}</span></div>
                <div><span style={{ color: "#6b7280" }}>Attribution:</span> <span style={{ fontWeight: 500 }}>{selectedCoupon.attribution}</span></div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "16px 0" }} />

              <div style={{ display: "flex", gap: "8px" }}>
                {selectedCoupon.allowedActions?.includes("DELETE") && !usingFallback && (
                  <button 
                    disabled
                    title="Coupon mutation requires attribution validation and confirmation."
                    style={{ flex: 1, padding: "8px", borderRadius: "6px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", fontWeight: 600, cursor: "not-allowed", fontSize: "13px" }}
                  >
                    Delete
                  </button>
                )}
                <button 
                  disabled
                  title="Mutation currently disabled pending validation"
                  style={{ flex: 1, padding: "8px", borderRadius: "6px", background: "#f3f4f6", color: "#9ca3af", border: "1px solid #e5e7eb", fontWeight: 600, cursor: "not-allowed", fontSize: "13px" }}
                >
                  Edit
                </button>
              </div>

              {actionState.error && (
                <div style={{ marginTop: "12px", padding: "8px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", fontSize: "12px", textAlign: "center" }}>
                  {actionState.error}
                </div>
              )}
            </div>
          ) : (
            <>
              {data?.conflicts?.length > 0 && (
                <div style={{ background: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#991b1b", display: "flex", alignItems: "center", gap: "8px" }}>
                    ⚠️ Conflict Warnings
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {data.conflicts.map((conflict, i) => (
                      <div key={i} style={{ fontSize: "12px", color: "#7f1d1d" }}>
                        <div style={{ fontWeight: 600, marginBottom: "2px" }}>{conflict.title}</div>
                        <div>{conflict.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#111827" }}>Storefront Preview</h3>
                <div style={{ background: "#f9fafb", border: "1px dashed #d1d5db", padding: "24px", textAlign: "center", borderRadius: "8px", color: "#9ca3af", fontSize: "13px" }}>
                  Select a coupon to preview storefront visualization
                </div>
                <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "12px", textAlign: "center" }}>
                  *Preview is visual only and does not imply changes to checkout validation rules.<br/>
                  *Checkout coupon validation is not changed by this workspace.
                </p>
              </div>
            </>
          )}

        </div>

      </div>

      </div>
    </Seller2026Shell>
  );
}
