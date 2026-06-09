export default function Seller2026StatusBadge({ status = "Pending" }) {
  return <span className={`s26-status ${String(status).split(/\s|_/)[0]}`}>{status}</span>;
}
