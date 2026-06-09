import React from "react";
import { useParams, Link } from "react-router-dom";

export default function SellerAnalyticsPage() {
  const { storeSlug } = useParams();

  return (
    <div style={{ padding: "24px" }}>
      <h1>Analytics</h1>
      <div style={{ marginTop: "24px", padding: "48px", textAlign: "center", background: "#f9fafb", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
        <h2>Analytics Dashboard</h2>
        <p style={{ color: "#6b7280", margin: "16px 0" }}>Legacy Analytics view is currently unavailable. Please enable Seller Workspace 2026 for the new experience.</p>
        <Link 
          to={`/seller/stores/${storeSlug}/dashboard`}
          style={{ padding: "8px 16px", background: "#4f46e5", color: "#fff", borderRadius: "8px", textDecoration: "none" }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
