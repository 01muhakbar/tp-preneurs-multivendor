export default function Seller2026ErrorState({ title = "Unable to load data", description, onRetry }) {
  return (
    <div className="s26-state s26-state-restricted">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {onRetry ? (
        <button type="button" className="s26-btn" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
