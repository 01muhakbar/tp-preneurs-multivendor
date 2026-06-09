export default function Seller2026EmptyState({ title = "No data available", description }) {
  return (
    <div className="s26-empty">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
