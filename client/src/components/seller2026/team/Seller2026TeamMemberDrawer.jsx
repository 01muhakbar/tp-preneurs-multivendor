import { useEffect, useState } from "react";
import {
  Activity,
  CalendarCheck,
  CalendarClock,
  CircleOff,
  Clock3,
  KeyRound,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

const formatDate = (value, fallback = "-") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

function TimelineDate({ icon: Icon, label, value }) {
  return (
    <div className="s26-team-life-date">
      <span><Icon size={17} /></span>
      <div>
        <small>{label}</small>
        <strong>{formatDate(value)}</strong>
      </div>
    </div>
  );
}

export default function Seller2026TeamMemberDrawer({
  open,
  member,
  lifecycle,
  state,
  onClose,
}) {
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (open) setTab("overview");
  }, [member?.id, open]);

  if (!open || !member) return null;

  const resolvedMember = lifecycle.member || member;
  const ownerProtected = resolvedMember.governance.isOwner || resolvedMember.governance.isSelf;

  return (
    <div className="s26-team-drawer-layer" role="presentation">
      <button
        className="s26-team-drawer-backdrop"
        type="button"
        aria-label="Close member details"
        onClick={onClose}
      />
      <aside className="s26-team-drawer" role="dialog" aria-modal="true" aria-label="Member details">
        <header>
          <div>
            <span className="s26-team-avatar is-large">{resolvedMember.initials}</span>
            <div>
              <small>Member details</small>
              <h2>{resolvedMember.name}</h2>
              <p>{resolvedMember.email || "No email available"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close member details">
            <X size={20} />
          </button>
        </header>

        <div className="s26-team-drawer-badges">
          <span className="s26-team-chip is-green">{resolvedMember.statusLabel}</span>
          <span className="s26-team-chip is-blue">{resolvedMember.roleName}</span>
          {ownerProtected ? <span className="s26-team-chip">Owner protected</span> : null}
        </div>

        <nav className="s26-team-drawer-tabs" aria-label="Member detail tabs">
          {[
            ["overview", "Overview"],
            ["permissions", "Permissions"],
            ["activity", "Activity"],
          ].map(([value, label]) => (
            <button
              type="button"
              className={tab === value ? "is-active" : ""}
              onClick={() => setTab(value)}
              key={value}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="s26-team-drawer-body">
          {state.isLoading ? (
            <div className="s26-team-drawer-loading">
              <span />
              <span />
              <span />
            </div>
          ) : state.isError ? (
            <div className="s26-team-drawer-empty">
              <CircleOff size={26} />
              <strong>Member lifecycle could not load</strong>
              <p>{state.error?.message || "Try loading the member again."}</p>
              <button type="button" onClick={() => state.refetch()}>Retry</button>
            </div>
          ) : tab === "overview" ? (
            <>
              <section className="s26-team-drawer-card">
                <h3><UserRound size={17} /> Membership</h3>
                <dl className="s26-team-member-facts">
                  <div><dt>Member ID</dt><dd>{resolvedMember.id}</dd></div>
                  <div><dt>Role</dt><dd>{resolvedMember.roleName}</dd></div>
                  <div><dt>Status</dt><dd>{resolvedMember.statusLabel}</dd></div>
                  <div><dt>Last active</dt><dd>{formatDate(resolvedMember.lastActiveAt)}</dd></div>
                </dl>
              </section>
              <section className="s26-team-life-grid">
                <TimelineDate icon={CalendarClock} label="Invited" value={lifecycle.lifecycle.invitedAt} />
                <TimelineDate icon={CalendarCheck} label="Accepted" value={lifecycle.lifecycle.acceptedAt} />
                <TimelineDate icon={CircleOff} label="Disabled" value={lifecycle.lifecycle.disabledAt} />
                <TimelineDate icon={Clock3} label="Removed" value={lifecycle.lifecycle.removedAt} />
              </section>
              <div className="s26-team-protection-note">
                <ShieldCheck size={18} />
                <span>
                  {ownerProtected
                    ? "Owner and current-user destructive actions stay protected."
                    : "Lifecycle actions remain managed by backend permissions and team audit."}
                </span>
              </div>
            </>
          ) : tab === "permissions" ? (
            <section className="s26-team-drawer-card">
              <h3><KeyRound size={17} /> Role permissions</h3>
              {lifecycle.permissions.length ? (
                <div className="s26-team-permission-list">
                  {lifecycle.permissions.map((permission) => (
                    <div key={permission.key}>
                      <ShieldCheck size={16} />
                      <span>{permission.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="s26-team-drawer-empty is-compact">
                  <p>No explicit permission list was returned for this role.</p>
                </div>
              )}
            </section>
          ) : (
            <section className="s26-team-drawer-card">
              <h3><Activity size={17} /> Activity timeline</h3>
              {lifecycle.history.length ? (
                <div className="s26-team-history">
                  {lifecycle.history.map((item) => (
                    <article key={item.id}>
                      <i />
                      <div>
                        <time>{formatDate(item.createdAt)}</time>
                        <strong>{item.title}</strong>
                        {item.summary ? <p>{item.summary}</p> : null}
                        <small>By {item.actorName}</small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="s26-team-drawer-empty is-compact">
                  <p>No lifecycle activity has been recorded yet.</p>
                </div>
              )}
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
