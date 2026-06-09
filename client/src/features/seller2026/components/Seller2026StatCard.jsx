export default function Seller2026StatCard({ label, value, change }) {
  return (
    <section className="s26-card">
      <p className="hint">{label}</p>
      <div className="s26-stat-value">{value}</div>
      {change ? <div className="s26-stat-change">{change}</div> : null}
    </section>
  );
}
