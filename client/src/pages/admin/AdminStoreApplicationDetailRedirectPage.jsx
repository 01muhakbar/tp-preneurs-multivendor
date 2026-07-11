import { Navigate, useLocation, useParams } from "react-router-dom";

export default function AdminStoreApplicationDetailRedirectPage() {
  const params = useParams();
  const location = useLocation();
  const applicationId = params.applicationId || params.id || "";
  const target = {
    pathname: `/admin/store/applications/${applicationId}`,
    search: location.search,
    hash: location.hash,
  };
  return <Navigate to={target} replace />;
}
