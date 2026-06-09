import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSellerAnalyticsSummary } from "../../api/sellerWorkspace.ts";
import { Seller2026Shell } from "../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import { Seller2026FallbackBanner } from "../../features/sellerWorkspace2026/components/Seller2026FallbackBanner.jsx";

export default function Seller2026LiveAnalyticsPage() {
  const { storeSlug } = useParams();

  const analyticsQuery = useQuery({
    queryKey: ["seller", "workspace", "analytics-summary", storeSlug],
    queryFn: () => getSellerAnalyticsSummary(storeSlug),
    enabled: Boolean(storeSlug),
  });

  const { data: analytics, isLoading, isError, error } = analyticsQuery;

  if (isLoading) {
    return (
      <Seller2026Shell section="dashboard">
        <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
          <p>Loading analytics...</p>
        </div>
      </Seller2026Shell>
    );
  }

  if (isError) {
    return (
      <Seller2026Shell section="dashboard">
        <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
          <h2>Analytics could not be loaded</h2>
          <p>{error?.message || "An error occurred while fetching analytics."}</p>
          <button 
            onClick={() => analyticsQuery.refetch()}
            style={{ marginTop: "16px", padding: "8px 16px", borderRadius: "8px", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </Seller2026Shell>
    );
  }

  const hasData = analytics?.orderSnapshot?.totalOrders > 0 || analytics?.revenueSnapshot?.paidGrossAmount > 0;

  if (!hasData) {
    return (
      <Seller2026Shell section="dashboard">
        <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
          <h2>No analytics data yet</h2>
          <p>Analytics will appear after your store receives activity.</p>
        </div>
      </Seller2026Shell>
    );
  }

  const revenueSnapshot = analytics?.revenueSnapshot;
  const orderSnapshot = analytics?.orderSnapshot;
  const productPerformance = analytics?.productSnapshot?.topProducts || [];

  return (
    <Seller2026Shell section="dashboard">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", color: "#111827" }}>Analytics</h1>
            <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px" }}>Performance overview of your store</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              disabled 
              title="Export feature is currently disabled."
              style={{ padding: "8px 16px", borderRadius: "8px", background: "#f3f4f6", color: "#9ca3af", border: "1px solid #e5e7eb", cursor: "not-allowed", fontWeight: 500 }}
            >
              Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
          {[
            { label: "Revenue", val: `Rp ${(revenueSnapshot?.paidGrossAmount || 0).toLocaleString()}` },
            { label: "Orders", val: orderSnapshot?.totalOrders || 0 },
            { label: "Average Order Value", val: `Rp ${(revenueSnapshot?.averageOrderValue || 0).toLocaleString()}` },
            { label: "Completed Orders", val: orderSnapshot?.completedOrders || 0 }
          ].map((stat, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>{stat.label}</span>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>{stat.val}</span>
            </div>
          ))}
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
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563", textAlign: "right" }}>Quantity Sold</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563", textAlign: "right" }}>Revenue</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {!productPerformance?.length ? (
                  <tr><td colSpan="4" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>No product data available</td></tr>
                ) : (
                  productPerformance.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>{p.name}</div>
                        <div style={{ color: "#6b7280", fontSize: "12px" }}>
                          <a href={`/seller/stores/${storeSlug}/catalog/products/${p.productId}`} style={{ color: "#4f46e5", textDecoration: "none" }}>
                            View Product
                          </a>
                        </div>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>{p.qtySold}</td>
                      <td style={{ padding: "16px", textAlign: "right" }}>Rp {p.revenueAmount?.toLocaleString()}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ 
                          padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                          background: p.status === "ACTIVE" ? "#d1fae5" : "#f3f4f6",
                          color: p.status === "ACTIVE" ? "#065f46" : "#4b5563"
                        }}>
                          {p.status}
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
    </Seller2026Shell>
  );
}
