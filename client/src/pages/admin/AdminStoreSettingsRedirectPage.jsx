import { Navigate, useLocation } from "react-router-dom";

export default function AdminStoreSettingsRedirectPage() {
  const location = useLocation();
  const target = {
    pathname: "/admin/store/store-settings",
    search: location.search,
    hash: location.hash,
  };
  return <Navigate to={target} replace />;
}
