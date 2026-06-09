import Seller2026StatusBadge from "./Seller2026StatusBadge.jsx";

export default function Seller2026ReadinessPanel({ items = [] }) {
  return (
    <section className="s26-card">
      <div className="s26-card-head">
        <h3>Store Readiness</h3>
      </div>
      <div className="s26-checklist">
        {items.map((item) => (
          <div className="s26-check-row" key={item.label}>
            <span>{item.label}</span>
            <Seller2026StatusBadge status={item.status || "Pending"} />
          </div>
        ))}
      </div>
    </section>
  );
}
