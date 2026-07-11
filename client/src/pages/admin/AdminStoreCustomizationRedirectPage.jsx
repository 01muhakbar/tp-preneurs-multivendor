import { Navigate, useLocation } from "react-router-dom";

export default function AdminStoreCustomizationRedirectPage() {
  const location = useLocation();
  const target = {
    pathname: "/admin/store/customization",
    search: location.search,
    hash: location.hash,
  };
  return <Navigate to={target} replace />;
}
