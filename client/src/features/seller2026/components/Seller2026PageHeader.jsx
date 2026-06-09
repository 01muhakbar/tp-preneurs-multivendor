export default function Seller2026PageHeader({ eyebrow, title, description, actions = null }) {
  return (
    <header className="s26-topbar">
      <div>
        {eyebrow ? <p className="s26-eyebrow">{eyebrow}</p> : null}
        <div className="s26-title-row">
          <h1>{title}</h1>
        </div>
        {description ? <p className="s26-topbar-desc">{description}</p> : null}
      </div>
      {actions ? <div className="s26-actions">{actions}</div> : null}
    </header>
  );
}
