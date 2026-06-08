import { useParams } from "react-router-dom";
import { useSellerWorkspace2026AnalyticsSync } from "../../features/sellerWorkspace2026/hooks/useSellerWorkspace2026AnalyticsSync.js";
import { Seller2026Shell } from "../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import { Seller2026FallbackBanner } from "../../features/sellerWorkspace2026/components/Seller2026FallbackBanner.jsx";

export function Seller2026AnalyticsSyncPreviewPage({ productionMode = false }) {
  const { storeSlug } = useParams();
  const { 
    data, 
    loading, 
    error, 
    usingFallback, 
    refetch,
    actions
  } = useSellerWorkspace2026AnalyticsSync(storeSlug);

  if (error && !data) {
    return (
      <Seller2026Shell section="dashboard">
        <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
          <h2>Error Loading Analytics & Sync Data</h2>
          <p>{error.message || "Failed to load information."}</p>
        </div>
      </Seller2026Shell>
    );
  }

  const { analytics, storefrontSync, publicPreview, productPerformance } = data || {};

  return (
    <Seller2026Shell section="dashboard">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {usingFallback && <Seller2026FallbackBanner message={productionMode ? "Live analytics or storefront sync data is unavailable. Showing fallback data." : "Live analytics or storefront sync data is unavailable. Showing preview fallback data."} compact={false} />}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={refetch} style={{ padding: "8px 16px", borderRadius: "8px", background: "#fff", border: "1px solid #d1d5db", cursor: "pointer", fontWeight: 500 }}>
            Refresh
          </button>
          <button 
            disabled 
            title="Storefront sync actions will be connected after public visibility workflow validation."
            style={{ padding: "8px 16px", borderRadius: "8px", background: "#4f46e5", color: "#fff", border: "none", opacity: 0.5, cursor: "not-allowed", fontWeight: 500 }}
          >
            Sync Now
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        
        {/* Main Content (Left) */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>
          
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
            {[
              { label: "Revenue", val: `Rp ${analytics?.revenue?.toLocaleString() || 0}` },
              { label: "Orders", val: analytics?.orders || 0 },
              { label: "Conversion Rate", val: `${analytics?.conversionRate || 0}%` },
              { label: "Avg Order Value", val: `Rp ${analytics?.averageOrderValue?.toLocaleString() || 0}` },
              { label: "Visitors", val: analytics?.visitors || 0 },
              { label: "Product Views", val: analytics?.productViews || 0 }
            ].map((stat, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>{stat.label}</span>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>{stat.val}</span>
              </div>
            ))}
          </div>

          {/* Charts area mockup */}
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 2, background: "#fff", border: "1px solid #e5e7eb", padding: "20px", borderRadius: "12px", minHeight: "250px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#111827" }}>Revenue Trend</h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "150px", marginTop: "24px" }}>
                {analytics?.revenueSeries?.map((val, i) => (
                  <div key={i} style={{ flex: 1, background: "#4f46e5", borderRadius: "4px 4px 0 0", height: `${(val / 400) * 100}%` }}></div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, background: "#fff", border: "1px solid #e5e7eb", padding: "20px", borderRadius: "12px", minHeight: "250px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#111827" }}>Channel Performance</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {analytics?.channelPerformance?.map((ch, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                      <span>{ch.name}</span>
                      <span style={{ fontWeight: 600 }}>{ch.value}%</span>
                    </div>
                    <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#4f46e5", width: `${ch.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product Performance Table */}
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#111827" }}>Product Performance</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Product</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563", textAlign: "right" }}>Views</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563", textAlign: "right" }}>Conversion</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563", textAlign: "right" }}>Units Sold</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563", textAlign: "right" }}>Revenue</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !productPerformance?.length ? (
                    <tr><td colSpan="7" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>Loading products...</td></tr>
                  ) : !productPerformance?.length ? (
                    <tr><td colSpan="7" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>No product data available</td></tr>
                  ) : (
                    productPerformance?.map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontWeight: 600, color: "#111827" }}>{p.title}</div>
                          <div style={{ color: "#6b7280", fontSize: "12px" }}>{p.sku}</div>
                        </td>
                        <td style={{ padding: "16px", textAlign: "right" }}>{p.views?.toLocaleString()}</td>
                        <td style={{ padding: "16px", textAlign: "right" }}>{p.conversionRate}%</td>
                        <td style={{ padding: "16px", textAlign: "right" }}>{p.unitsSold}</td>
                        <td style={{ padding: "16px", textAlign: "right" }}>Rp {p.revenue?.toLocaleString()}</td>
                        <td style={{ padding: "16px" }}>{p.status}</td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ 
                            padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                            background: p.visibility === "Visible" ? "#d1fae5" : "#f3f4f6",
                            color: p.visibility === "Visible" ? "#065f46" : "#4b5563"
                          }}>
                            {p.visibility}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Sync & Preview Sidebar (Right) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Sync Control Center */}
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#111827" }}>Storefront Sync</h2>
              <span style={{ 
                fontSize: "12px", padding: "4px 8px", borderRadius: "12px", fontWeight: 600,
                background: storefrontSync?.syncHealth === 'Healthy' ? '#d1fae5' : '#fef3c7',
                color: storefrontSync?.syncHealth === 'Healthy' ? '#065f46' : '#92400e'
              }}>
                {storefrontSync?.syncHealth || 'Unknown'}
              </span>
            </div>
            
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Microsite", status: storefrontSync?.micrositeStatus },
                { label: "Product Index", status: storefrontSync?.productIndexStatus },
                { label: "Search Index", status: storefrontSync?.searchIndexStatus },
                { label: "Coupon Banner", status: storefrontSync?.couponBannerStatus },
                { label: "Logo", status: storefrontSync?.logoStatus },
                { label: "Banner", status: storefrontSync?.bannerStatus },
                { label: "Slug", status: storefrontSync?.slugStatus }
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#4b5563" }}>{item.label}</span>
                  <span style={{ 
                    fontWeight: 500,
                    color: item.status === 'Healthy' ? '#059669' : item.status === 'Missing' ? '#dc2626' : '#d97706'
                  }}>
                    {item.status}
                  </span>
                </div>
              ))}

              <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "4px 0" }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#4b5563" }}>Published Products</span>
                <span style={{ fontWeight: 600, color: "#111827" }}>{storefrontSync?.publishedProductsCount}</span>
              </div>
              
              <button 
                disabled
                title="Storefront sync actions will be connected after public visibility workflow validation."
                style={{ width: "100%", marginTop: "8px", padding: "8px", borderRadius: "6px", background: "#f3f4f6", color: "#9ca3af", border: "1px solid #e5e7eb", fontWeight: 600, cursor: "not-allowed", fontSize: "13px" }}
              >
                Rebuild Index
              </button>
            </div>
          </div>

          {/* Issues Panel */}
          {storefrontSync?.issues?.length > 0 && (
            <div style={{ background: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca", padding: "16px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#991b1b", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>⚠️</span> Action Required
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {storefrontSync.issues.map((issue, idx) => (
                  <div key={idx} style={{ fontSize: "13px", color: "#7f1d1d" }}>
                    <div style={{ fontWeight: 600 }}>{issue.title}</div>
                    <div style={{ marginTop: "2px", opacity: 0.9 }}>{issue.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public Storefront Preview Card */}
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
             <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#111827" }}>Public Storefront Preview</h2>
            </div>
            <div style={{ padding: "16px", background: "#f3f4f6", textAlign: "center" }}>
              {/* Mockup of storefront visual */}
              <div style={{ width: "100%", height: "80px", background: "#d1d5db", borderRadius: "8px", marginBottom: "-24px" }}></div>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#9ca3af", border: "4px solid #fff", margin: "0 auto", position: "relative" }}></div>
              <div style={{ fontWeight: 700, fontSize: "16px", marginTop: "8px", color: "#111827" }}>{publicPreview?.storeName}</div>
              <div style={{ color: "#6b7280", fontSize: "12px", marginTop: "2px" }}>{publicPreview?.tagline}</div>
              <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "8px" }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ width: "40px", height: "40px", background: "#e5e7eb", borderRadius: "4px" }}></div>
                ))}
              </div>
            </div>
            <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb", background: "#fff", fontSize: "12px" }}>
              <div style={{ color: "#4f46e5", marginBottom: "8px", wordBreak: "break-all" }}>{publicPreview?.publicUrl}</div>
              <div style={{ color: "#6b7280", fontStyle: "italic", lineHeight: "1.4" }}>
                Storefront preview is read-only and does not change public visibility.
              </div>
              <button 
                onClick={actions?.refreshPreview}
                style={{ width: "100%", marginTop: "12px", padding: "6px", borderRadius: "6px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", fontWeight: 500, cursor: "pointer", fontSize: "12px" }}
              >
                Refresh Public Preview
              </button>
            </div>
          </div>

        </div>

      </div>

      </div>
    </Seller2026Shell>
  );
}
