import { Navigate, useLocation } from "react-router-dom";

export default function AdminStorePaymentPage() {
  const location = useLocation();
  const target = {
    pathname: "/admin/store/payment-profiles",
    search: location.search,
    hash: location.hash,
  };
  return <Navigate to={target} replace />;
}
