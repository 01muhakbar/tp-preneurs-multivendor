import { useNavigate, useParams } from "react-router-dom";
import ProductForm from "./ProductForm.jsx";

export default function AdminProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const detailPath = `/admin/catalog/products/${encodeURIComponent(String(id))}`;

  const returnToDetail = () => {
    navigate(detailPath, { replace: true });
  };

  return (
    <ProductForm
      mode="page"
      productId={id}
      onClose={returnToDetail}
      onSuccess={returnToDetail}
    />
  );
}
