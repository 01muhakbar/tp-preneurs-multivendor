import React from "react";
import { Link } from "react-router-dom";
import { Seller2026Shell } from "../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import { useSellerWorkspace2026Analytics } from "../../features/sellerWorkspace2026/hooks/useSellerWorkspace2026Analytics.js";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

const panelStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "18px",
};

const mutedText = { color: "#6b7280", fontSize: "13px", lineHeight: 1.6 };

function AnalyticsState({ title, description, action }) {
  return (
    <Seller2026Shell section="dashboard" activeNavOverride="dashboard">
      <div style={{ ...panelStyle, padding: "42px", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "22px", color: "#111827" }}>{title}</h1>
        <p style={{ ...mutedText, margin: "10px auto 0", maxWidth: "560px" }}>{description}</p>
        {action ? <div style={{ marginTop: "18px" }}>{action}</div> : null}
      </div>
    </Seller2026Shell>
  );
}

function DisabledAction({ children }) {
  return (
    <button
      type="button"
      disabled
      title="Unavailable until storefront sync workflow is validated."
      style={{
        border: "1px solid #d1d5db",
        borderRadius: "999px",
        background: "#f3f4f6",
        color: "#9ca3af",
        cursor: "not-allowed",
        fontSize: "12px",
        fontWeight: 700,
        padding: "8px 12px",
      }}
    >
      {children}
    </button>
  );
}

export default function Seller2026LiveAnalyticsPage() {
  const { sellerContext, workspaceStoreId: storeId, workspaceStoreSlug } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canViewAnalytics = can("STORE_DASHBOARD_VIEW") || can("STORE_VIEW");
  const analyticsQuery = useSellerWorkspace2026Analytics(storeId, {
    enabled: canViewAnalytics,
  });

  if (!canViewAnalytics) {
    return (
      <AnalyticsState
        title="Analytics unavailable"
        description="This account can open the seller workspace, but it does not have permission to view store analytics."
      />
    );
  }

  if (analyticsQuery.isLoading) {
    return (
      <AnalyticsState
        title="Loading analytics"
        description="Reading existing store-scoped analytics summary data."
      />
    );
  }

  if (analyticsQuery.isError) {
    return (
      <AnalyticsState
        title="Analytics could not be loaded"
        description={
          analyticsQuery.error?.response?.data?.message ||
          analyticsQuery.error?.message ||
          "An error occurred while fetching analytics."
        }
        action={
          <button
            type="button"
            onClick={() => analyticsQuery.refetch()}
            style={{
              border: "0",
              borderRadius: "999px",
              background: "#111827",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              padding: "9px 16px",
            }}
          >
            Try again
          </button>
        }
      />
    );
  }

  const analytics = analyticsQuery.data;
  const canonicalStoreSlug =
    workspaceStoreSlug || sellerContext?.store?.slug || analytics?.store?.slug || "";

  if (!analytics || analytics.isEmpty) {
    return (
      <AnalyticsState
        title="No analytics data yet"
        description="Analytics will appear after this store receives order, payment, coupon, or product activity through existing workflows."
      />
    );
  }

  return (
    <Seller2026Shell
      section="dashboard"
      activeNavOverride="dashboard"
      storeContext={sellerContext}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <section style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                Growth Overview
              </p>
              <h1 style={{ margin: "6px 0 0", color: "#111827", fontSize: "24px" }}>
                Store Analytics
              </h1>
              <p style={{ ...mutedText, margin: "6px 0 0" }}>
                Read-only performance snapshot for this seller workspace.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" }}>
              <DisabledAction>Sync Now</DisabledAction>
              <DisabledAction>Rebuild Index</DisabledAction>
              <DisabledAction>Publish Storefront</DisabledAction>
              <DisabledAction>Export Sensitive Report</DisabledAction>
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
          {analytics.overview.map((item) => (
            <div key={item.label} style={panelStyle}>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "12px", fontWeight: 700 }}>{item.label}</p>
              <strong style={{ display: "block", marginTop: "8px", color: "#111827", fontSize: "22px" }}>
                {item.value}
              </strong>
              <p style={{ ...mutedText, margin: "6px 0 0" }}>{item.detail}</p>
            </div>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
          <div style={panelStyle}>
            <h2 style={{ margin: 0, color: "#111827", fontSize: "17px" }}>Sales Summary</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: "12px", marginTop: "14px" }}>
              {[
                ["Paid Orders", analytics.salesSummary.paidOrders],
                ["Processing", analytics.salesSummary.processingOrders],
                ["Completed", analytics.salesSummary.completedOrders],
                ["Pending Payment", analytics.salesSummary.pendingPaymentOrders],
                ["Exceptions", analytics.salesSummary.exceptionOrders],
              ].map(([label, value]) => (
                <div key={label} style={{ border: "1px solid #eef2f7", borderRadius: "8px", padding: "12px" }}>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: "12px" }}>{label}</p>
                  <strong style={{ display: "block", marginTop: "6px", color: "#111827" }}>{value}</strong>
                </div>
              ))}
            </div>
            <p style={{ ...mutedText, margin: "14px 0 0" }}>
              Completed gross: {analytics.salesSummary.completedGrossAmount}. Processing gross:{" "}
              {analytics.salesSummary.processingGrossAmount}.
            </p>
          </div>

          <div style={panelStyle}>
            <h2 style={{ margin: 0, color: "#111827", fontSize: "17px" }}>Orders Trend</h2>
            <p style={{ ...mutedText, margin: "10px 0 0" }}>
              Trend charts are intentionally limited to the existing summary endpoint for this adoption.
              Detailed exports remain unavailable until a validated workflow exists.
            </p>
            {analytics.salesSummary.boundaryNote ? (
              <p style={{ ...mutedText, margin: "10px 0 0" }}>{analytics.salesSummary.boundaryNote}</p>
            ) : null}
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={{ margin: 0, color: "#111827", fontSize: "17px" }}>Product Performance</h2>
          <div style={{ marginTop: "14px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "10px" }}>Product</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Quantity Sold</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Revenue</th>
                  <th style={{ padding: "10px" }}>Storefront</th>
                </tr>
              </thead>
              <tbody>
                {analytics.productPerformance.length ? (
                  analytics.productPerformance.map((product) => (
                    <tr key={product.productId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 10px" }}>
                        <strong style={{ color: "#111827" }}>{product.name}</strong>
                        <div style={{ marginTop: "4px" }}>
                          <Link
                            to={`/seller/stores/${encodeURIComponent(canonicalStoreSlug)}/catalog/products/${product.productId}`}
                            style={{ color: "#2563eb", textDecoration: "none", fontSize: "12px", fontWeight: 700 }}
                          >
                            View Product
                          </Link>
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>{product.quantitySold}</td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>{product.revenue}</td>
                      <td style={{ padding: "12px 10px" }}>
                        {product.storefrontVisible ? "Visible" : "Not visible"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: "24px 10px", color: "#6b7280", textAlign: "center" }}>
                      No product performance data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
          <div style={panelStyle}>
            <h2 style={{ margin: 0, color: "#111827", fontSize: "17px" }}>Traffic Snapshot</h2>
            <p style={{ ...mutedText, margin: "10px 0 0" }}>{analytics.trafficSnapshot.note}</p>
            <p style={{ ...mutedText, margin: "10px 0 0" }}>
              Products: {analytics.trafficSnapshot.totalProducts}. Active:{" "}
              {analytics.trafficSnapshot.activeProducts}. Draft: {analytics.trafficSnapshot.draftProducts}.
              Review queue: {analytics.trafficSnapshot.reviewQueue}.
            </p>
          </div>
          <div style={panelStyle}>
            <h2 style={{ margin: 0, color: "#111827", fontSize: "17px" }}>Storefront Readiness</h2>
            <p style={{ ...mutedText, margin: "10px 0 0" }}>{analytics.storefrontReadiness.summary}</p>
            <p style={{ ...mutedText, margin: "10px 0 0" }}>{analytics.storefrontReadiness.boundaryNote}</p>
          </div>
          <div style={panelStyle}>
            <h2 style={{ margin: 0, color: "#111827", fontSize: "17px" }}>Read-only Storefront Sync Notes</h2>
            <ul style={{ margin: "10px 0 0", paddingLeft: "18px", color: "#6b7280", fontSize: "13px", lineHeight: 1.7 }}>
              {analytics.syncNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={{ margin: 0, color: "#111827", fontSize: "17px" }}>Recent Signals</h2>
          {analytics.recentSignals.length ? (
            <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
              {analytics.recentSignals.map((signal, index) => (
                <div key={`${signal.label}-${index}`} style={{ border: "1px solid #eef2f7", borderRadius: "8px", padding: "12px" }}>
                  <strong style={{ color: "#111827", fontSize: "13px" }}>{signal.label}</strong>
                  <p style={{ ...mutedText, margin: "4px 0 0" }}>{signal.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ ...mutedText, margin: "10px 0 0" }}>No recent analytics signals available.</p>
          )}
        </section>
      </div>
    </Seller2026Shell>
  );
}
