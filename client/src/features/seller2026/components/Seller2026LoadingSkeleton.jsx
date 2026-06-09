export default function Seller2026LoadingSkeleton({ label = "Loading seller workspace..." }) {
  return (
    <div className="s26-card">
      <p className="hint">{label}</p>
      <div className="s26-spark" />
    </div>
  );
}
