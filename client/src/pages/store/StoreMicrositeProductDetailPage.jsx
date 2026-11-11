import React from "react";
import { Navigate, useParams } from "react-router-dom";

export default function StoreMicrositeProductDetailPage() {
  const { productSlug } = useParams();
  const safeProductSlug = String(productSlug || "").trim();
  const target = safeProductSlug ? `/product/${encodeURIComponent(safeProductSlug)}` : "/shop";
  return <Navigate to={target} replace />;
}
