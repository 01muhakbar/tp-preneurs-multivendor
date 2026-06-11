import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileClock,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Seller2026AuditEventDrawer from "../../components/seller2026/teamAudit/Seller2026AuditEventDrawer.jsx";
import { useSeller2026TeamAudit } from "../../hooks/seller2026/useSeller2026TeamAudit.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/Seller2026TeamAudit.css";

const formatDateTime = (value, fallback = "-") => {
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

function AuditChip({ children, tone = "slate" }) {
  return <span className={`s26-ta-chip is-${tone}`}>{children}</span>;
}

function KpiCard({ icon: Icon, tone, label, value, detail }) {
  return (
    <article className={`s26-ta-kpi is-${tone}`}>
      <div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div>
      <span><Icon size={22} /></span>
    </article>
  );
}

export default function Seller2026LiveTeamAuditPage() {
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("TEAM_AUDIT_READ");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [email, setEmail] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [notice, setNotice] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const auditQuery = useSeller2026TeamAudit(
    storeId,
    { search, action, dateFrom, dateTo, page, limit },
    { enabled: canView }
  );
  const audit = auditQuery.data;

  useEffect(() => {
    if (!roleCode && audit.assignableRoles.length) {
      setRoleCode(audit.assignableRoles[0].code);
    }
  }, [audit.assignableRoles, roleCode]);

  useEffect(() => {
    setPage(1);
  }, [action, dateFrom, dateTo, limit, search]);

  const submitInvitation = async (event) => {
    event.preventDefault();
    setNotice(null);
    try {
      await auditQuery.inviteMember({ email, roleCode });
      setEmail("");
      setNotice({ type: "success", message: "Invitation sent successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.response?.data?.message || error?.message || "The invitation failed.",
      });
    }
  };

  const resetFilters = () => {
    setSearch("");
    setAction("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  if (!canView) {
    return (
      <main className="s26-ta">
        <div className="s26-ta-state">
          <ShieldCheck size={36} />
          <h1>Team audit is unavailable</h1>
          <p>Your seller role cannot view team activity for this store.</p>
        </div>
      </main>
    );
  }

  if (auditQuery.isLoading) {
    return (
      <main className="s26-ta">
        <div className="s26-ta-skeleton is-heading" />
        <div className="s26-ta-kpis">
          {[0, 1, 2, 3].map((item) => <div className="s26-ta-skeleton is-card" key={item} />)}
        </div>
        <div className="s26-ta-skeleton is-content" />
      </main>
    );
  }

  if (auditQuery.isError) {
    return (
      <main className="s26-ta">
        <div className="s26-ta-state">
          <AlertTriangle size={36} />
          <h1>Team audit could not load</h1>
          <p>{auditQuery.error?.message || "Try loading the audit workspace again."}</p>
          <button type="button" onClick={() => auditQuery.refetch()}>Retry</button>
        </div>
      </main>
    );
  }

  const pagination = audit.pagination;
  const inviteEnabled = audit.capabilities.canInviteMembers && audit.assignableRoles.length > 0;

  return (
    <main className="s26-ta">
      <div className="s26-ta-breadcrumb">
        <Link to={workspaceRoutes.team()}>Team</Link><span>/</span><strong>Audit</strong>
      </div>

      <header className="s26-ta-header">
        <div>
          <h1>Team Audit</h1>
          <p>Track invitations, role changes, and permission updates for your store.</p>
        </div>
        <div>
          <Link className="s26-ta-secondary" to={workspaceRoutes.team()}><Users size={17} /> Team</Link>
          <button className="s26-ta-secondary" type="button" onClick={() => auditQuery.refetch()}>
            <RefreshCw size={17} /> Refresh
          </button>
          <button className="s26-ta-secondary" type="button" disabled title="Export API is not available">
            <Download size={17} /> Export Audit
          </button>
        </div>
      </header>

      <section className="s26-ta-kpis">
        <KpiCard icon={Mail} tone="purple" label="Pending invitations" value={audit.summary.pendingInvitations} detail="Waiting for acceptance" />
        <KpiCard icon={FileClock} tone="blue" label="Audit events" value={audit.summary.auditEvents} detail="Recorded team activity" />
        <KpiCard icon={Users} tone="green" label="Unique actors" value={audit.summary.uniqueActors} detail="Visible on this page" />
        <KpiCard icon={Clock3} tone="orange" label="Last activity" value={formatDateTime(audit.summary.lastActivityAt, "No activity")} detail="Most recent recorded event" />
      </section>

      <section className="s26-ta-top-grid">
        <article className="s26-ta-panel s26-ta-invite">
          <header>
            <span className="s26-ta-panel-icon is-purple"><UserPlus size={20} /></span>
            <div><h2>Invite member</h2><p>Send an invitation to grant store access.</p></div>
          </header>
          <form onSubmit={submitInvitation}>
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                disabled={!inviteEnabled}
                placeholder="name@domain.com"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              <span>Role</span>
              <select
                value={roleCode}
                disabled={!inviteEnabled}
                onChange={(event) => setRoleCode(event.target.value)}
              >
                {audit.assignableRoles.length ? audit.assignableRoles.map((role) => (
                  <option key={role.code} value={role.code}>{role.name}</option>
                )) : <option value="">No assignable roles</option>}
              </select>
            </label>
            <div className="s26-ta-store-scope">
              <ShieldCheck size={17} />
              <span>Access is limited to the current store and requires acceptance.</span>
            </div>
            {!inviteEnabled ? (
              <p className="s26-ta-form-warning">Invitation is unavailable for your current role.</p>
            ) : null}
            {notice ? (
              <div className={`s26-ta-notice is-${notice.type}`}>
                {notice.type === "success" ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
                {notice.message}
              </div>
            ) : null}
            <button type="submit" disabled={!inviteEnabled || !email || !roleCode || auditQuery.isInviting}>
              <Mail size={17} /> {auditQuery.isInviting ? "Sending..." : "Send invitation"}
            </button>
          </form>
        </article>

        <article className="s26-ta-panel s26-ta-pending">
          <header>
            <span className="s26-ta-panel-icon is-blue"><Mail size={20} /></span>
            <div><h2>Pending invitations</h2><p>Invitations waiting for acceptance.</p></div>
          </header>
          {audit.pendingInvitations.length ? (
            <div className="s26-ta-pending-list">
              {audit.pendingInvitations.map((invitation) => (
                <div key={invitation.id}>
                  <span className="s26-ta-avatar">{invitation.name.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong>{invitation.name}</strong>
                    <small>{invitation.email}</small>
                    <small>{invitation.roleName} | Sent {formatDateTime(invitation.invitedAt)}</small>
                  </div>
                  <AuditChip tone="orange">{invitation.statusLabel}</AuditChip>
                </div>
              ))}
            </div>
          ) : (
            <div className="s26-ta-empty">
              <span><Mail size={30} /></span>
              <strong>No pending invitations</strong>
              <p>New invitations will appear here until they are accepted.</p>
            </div>
          )}
        </article>
      </section>

      <section className="s26-ta-panel s26-ta-log">
        <header>
          <div><h2>Audit log</h2><p>Detailed history of team and access activity.</p></div>
          <div className="s26-ta-tools">
            <label className="s26-ta-search">
              <Search size={17} />
              <input value={search} placeholder="Search member or action..." onChange={(event) => setSearch(event.target.value)} />
            </label>
            <select value={action} onChange={(event) => setAction(event.target.value)}>
              <option value="all">All actions</option>
              {audit.actionOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
            <label className="s26-ta-date"><CalendarDays size={16} /><input type="date" value={dateFrom} aria-label="From date" onChange={(event) => setDateFrom(event.target.value)} /></label>
            <label className="s26-ta-date"><CalendarDays size={16} /><input type="date" value={dateTo} aria-label="To date" onChange={(event) => setDateTo(event.target.value)} /></label>
            <button type="button" onClick={resetFilters}>Reset</button>
          </div>
        </header>

        <div className="s26-ta-table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Member</th><th>Action</th><th>Details</th><th>Performed by</th><th /></tr></thead>
            <tbody>
              {audit.auditRows.length ? audit.auditRows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTime(row.recordedAt)}</td>
                  <td><strong>{row.target.name}</strong><small>{row.target.email || row.target.roleName}</small></td>
                  <td><AuditChip tone={row.tone}>{row.actionLabel}</AuditChip><small>{row.category}</small></td>
                  <td><strong>{row.change}</strong><small>{row.summary}</small></td>
                  <td><strong>{row.actor.name}</strong><small>{row.actor.email}</small></td>
                  <td><button type="button" aria-label={`View ${row.actionLabel}`} onClick={() => setSelectedRow(row)}><Eye size={17} /></button></td>
                </tr>
              )) : (
                <tr><td colSpan="6"><div className="s26-ta-empty is-table"><span><FileClock size={29} /></span><strong>No audit events found</strong><p>Try adjusting the current filters.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <footer>
          <div>
            <span>Showing {audit.auditRows.length} of {pagination.total} results</span>
            <label>Rows <select value={limit} onChange={(event) => setLimit(Number(event.target.value))}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label>
          </div>
          <div>
            <button type="button" disabled={pagination.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={17} /></button>
            <strong>{pagination.page} / {pagination.totalPages}</strong>
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}><ChevronRight size={17} /></button>
          </div>
        </footer>
      </section>

      <div className="s26-ta-guardrail"><ShieldCheck size={18} /><span>Team audit records are read-only. Role, status, resend, removal, and export actions remain unavailable here.</span></div>

      <Seller2026AuditEventDrawer open={Boolean(selectedRow)} row={selectedRow} onClose={() => setSelectedRow(null)} />
    </main>
  );
}
