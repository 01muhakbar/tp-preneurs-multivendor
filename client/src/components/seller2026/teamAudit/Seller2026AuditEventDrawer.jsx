import { useEffect } from "react";
import { Activity, CalendarDays, ShieldCheck, UserRound, X } from "lucide-react";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatKey = (value) =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

function Snapshot({ title, value }) {
  const entries = value ? Object.entries(value) : [];
  return (
    <section className="s26-ta-drawer-card">
      <h3>{title}</h3>
      {entries.length ? (
        <dl className="s26-ta-snapshot">
          {entries.map(([key, item]) => (
            <div key={key}>
              <dt>{formatKey(key)}</dt>
              <dd>{formatValue(item)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="s26-ta-empty-copy">No state snapshot was recorded.</p>
      )}
    </section>
  );
}

export default function Seller2026AuditEventDrawer({ open, row, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || !row) return null;

  return (
    <div className="s26-ta-drawer-layer" role="presentation">
      <button
        className="s26-ta-drawer-backdrop"
        type="button"
        aria-label="Close audit event details"
        onClick={onClose}
      />
      <aside className="s26-ta-drawer" role="dialog" aria-modal="true" aria-label="Audit event details">
        <header>
          <div>
            <span className="s26-ta-drawer-icon"><Activity size={20} /></span>
            <div>
              <small>Audit event</small>
              <h2>{row.actionLabel}</h2>
              <p>{row.category}</p>
            </div>
          </div>
          <button type="button" aria-label="Close audit event details" onClick={onClose}>
            <X size={19} />
          </button>
        </header>

        <div className="s26-ta-drawer-badges">
          <span className={`s26-ta-chip is-${row.tone || "slate"}`}>{row.result}</span>
          <span className="s26-ta-chip">{row.action}</span>
        </div>

        <div className="s26-ta-drawer-body">
          <section className="s26-ta-drawer-card">
            <h3><CalendarDays size={17} /> Event overview</h3>
            <dl className="s26-ta-facts">
              <div><dt>Recorded</dt><dd>{formatDateTime(row.recordedAt)}</dd></div>
              <div><dt>Action</dt><dd>{row.actionLabel}</dd></div>
              <div><dt>Summary</dt><dd>{row.summary || row.change || "-"}</dd></div>
            </dl>
          </section>

          <section className="s26-ta-drawer-card">
            <h3><UserRound size={17} /> Actor and target</h3>
            <dl className="s26-ta-facts">
              <div><dt>Performed by</dt><dd>{row.actor.name}<small>{row.actor.email}</small></dd></div>
              <div><dt>Target</dt><dd>{row.target.name}<small>{row.target.email}</small></dd></div>
              <div><dt>Role</dt><dd>{row.target.roleName || "-"}</dd></div>
            </dl>
          </section>

          <Snapshot title="Before state" value={row.beforeState} />
          <Snapshot title="After state" value={row.afterState} />

          <div className="s26-ta-readonly-note">
            <ShieldCheck size={17} />
            Audit records are read-only and remain governed by backend permissions.
          </div>
        </div>
      </aside>
    </div>
  );
}
