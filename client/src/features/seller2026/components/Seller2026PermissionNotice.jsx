export default function Seller2026PermissionNotice({
  message = "This action is controlled by seller permissions and backend governance.",
}) {
  return <p className="hint">{message}</p>;
}
