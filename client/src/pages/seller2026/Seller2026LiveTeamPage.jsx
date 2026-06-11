import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  KeyRound,
  Mail,
  MoreVertical,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Seller2026TeamMemberDrawer from "../../components/seller2026/team/Seller2026TeamMemberDrawer.jsx";
import { useSeller2026Team } from "../../hooks/seller2026/useSeller2026Team.ts";
import { downloadCsvFile } from "../../utils/exportFiles.js";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/Seller2026Team.css";

const formatDate = (value, fallback = "-") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const teamExportColumns = [
  { key: "name", label: "Member" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "joined", label: "Joined" },
];

function TeamChip({ children, tone = "slate" }) {
  return <span className={`s26-team-chip is-${tone}`}>{children}</span>;
}

function KpiCard({ icon: Icon, tone, label, value, detail }) {
  return (
    <article className={`s26-team-kpi is-${tone}`}>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
      <span><Icon size={21} /></span>
    </article>
  );
}

export default function Seller2026LiveTeamPage() {
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("TEAM_READ") || can("TEAM_AUDIT_READ");
  const inviteCardRef = useRef(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState("invite");
  const [email, setEmail] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [notice, setNotice] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const teamQuery = useSeller2026Team(
    storeId,
    { search, role: roleFilter, status: statusFilter, page, limit: 10 },
    { enabled: canView, selectedMemberId }
  );
  const { data: team, fullData, pagination, manageableRoles } = teamQuery;
  const capabilities = fullData.currentAccess.capabilities;
  const canUseMode =
    mode === "invite" ? capabilities.canInviteMembers : capabilities.canAttachMembers;
  const selectedMember = useMemo(
    () =>
      fullData.members.find((member) => String(member.id) === String(selectedMemberId)) ||
      null,
    [fullData.members, selectedMemberId]
  );

  useEffect(() => {
    if (!roleCode && manageableRoles.length) setRoleCode(manageableRoles[0].code);
  }, [manageableRoles, roleCode]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, search, statusFilter]);

  const submitMember = async (event) => {
    event.preventDefault();
    setNotice(null);
    try {
      if (mode === "invite") {
        await teamQuery.inviteMember({ email, roleCode });
        setNotice({ type: "success", message: "Invitation sent successfully." });
      } else {
        await teamQuery.addExistingMember({ email, roleCode });
        setNotice({ type: "success", message: "Existing user added successfully." });
      }
      setEmail("");
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.response?.data?.message || error?.message || "The team action failed.",
      });
    }
  };

  const exportMembers = () => {
    downloadCsvFile(
      teamExportColumns,
      fullData.members.map((member) => ({
        name: member.name,
        email: member.email,
        role: member.roleName,
        status: member.statusLabel,
        joined: formatDate(member.joinedAt),
      })),
      `seller-team-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  if (!canView) {
    return (
      <main className="s26-team">
        <div className="s26-team-state">
          <ShieldCheck size={34} />
          <h1>Team access is unavailable</h1>
          <p>Your seller role cannot view members or team audit information for this store.</p>
        </div>
      </main>
    );
  }

  if (teamQuery.isLoading) {
    return (
      <main className="s26-team">
        <div className="s26-team-skeleton is-heading" />
        <div className="s26-team-kpis">
          {[0, 1, 2, 3].map((item) => (
            <div className="s26-team-skeleton is-card" key={item} />
          ))}
        </div>
        <div className="s26-team-skeleton is-content" />
      </main>
    );
  }

  if (teamQuery.isError) {
    return (
      <main className="s26-team">
        <div className="s26-team-state">
          <AlertTriangle size={34} />
          <h1>Team could not load</h1>
          <p>{teamQuery.error?.message || "Try loading the store team again."}</p>
          <button type="button" onClick={() => teamQuery.refetch()}>Retry</button>
        </div>
      </main>
    );
  }

  return (
    <main className="s26-team">
      <div className="s26-team-breadcrumb">
        <span>Workspace</span><i>/</i><strong>Team</strong>
      </div>

      <header className="s26-team-header">
        <div>
          <h1>Team</h1>
          <p>Manage your store team, roles, and access.</p>
        </div>
        <div>
          <button
            className="s26-team-primary"
            type="button"
            disabled={!capabilities.canInviteMembers && !capabilities.canAttachMembers}
            onClick={() => {
              inviteCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              inviteCardRef.current?.querySelector("input")?.focus();
            }}
          >
            <UserPlus size={18} /> Invite member
          </button>
          <TeamChip tone="green"><ShieldCheck size={15} /> {fullData.currentAccess.roleName}</TeamChip>
        </div>
      </header>

      <section className="s26-team-kpis">
        <KpiCard
          icon={Users}
          tone="green"
          label="Active members"
          value={fullData.summary.activeMembers}
          detail={`${fullData.summary.activeMembers} active · ${fullData.summary.pendingInvitations} invited · ${fullData.summary.disabledMembers} disabled`}
        />
        <KpiCard
          icon={ShieldCheck}
          tone="mint"
          label="Access status"
          value={fullData.currentAccess.accessLabel}
          detail={fullData.currentAccess.authorityLabel}
        />
        <KpiCard
          icon={KeyRound}
          tone="purple"
          label="Your role"
          value={fullData.currentAccess.roleName}
          detail={fullData.currentAccess.authoritySummary}
        />
        <KpiCard
          icon={UserPlus}
          tone="orange"
          label="Available roles"
          value={fullData.summary.totalRoles}
          detail={`${manageableRoles.length} assignable by you`}
        />
      </section>

      <section className="s26-team-main-grid">
        <article className="s26-team-panel s26-team-access">
          <header>
            <div>
              <span className="s26-team-panel-icon"><ShieldCheck size={19} /></span>
              <div><h2>Your access</h2><p>Overview of your permissions in this store.</p></div>
            </div>
          </header>
          <div className="s26-team-access-summary">
            <div>
              <small>Current role</small>
              <strong>{fullData.currentAccess.roleName}</strong>
              <p>{fullData.currentAccess.authorityLabel}</p>
            </div>
            <div>
              <small>Access level</small>
              <strong>{fullData.currentAccess.accessLabel}</strong>
              <p>{fullData.currentAccess.membershipBoundary || "Team operations follow backend permissions."}</p>
            </div>
          </div>
          <div className="s26-team-access-list">
            {fullData.currentAccess.permissionGroups.map((group) => (
              <div key={group.key}>
                <span>{group.label}</span>
                <strong>{group.accessLabel}</strong>
              </div>
            ))}
          </div>
          <p className="s26-team-boundary-note">
            Backend permissions remain final. Owner and current-user destructive actions stay protected.
          </p>
        </article>

        <article className="s26-team-panel s26-team-invite" ref={inviteCardRef}>
          <header>
            <div>
              <span className="s26-team-panel-icon"><UserPlus size={19} /></span>
              <div><h2>Invite or add member</h2><p>Add new people or assign an existing user.</p></div>
            </div>
          </header>
          <div className="s26-team-form-tabs">
            <button
              type="button"
              className={mode === "invite" ? "is-active" : ""}
              onClick={() => { setMode("invite"); setNotice(null); }}
            >
              Invite by email
            </button>
            <button
              type="button"
              className={mode === "attach" ? "is-active" : ""}
              onClick={() => { setMode("attach"); setNotice(null); }}
            >
              Add existing user
            </button>
          </div>
          <form onSubmit={submitMember}>
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                disabled={!canUseMode}
                placeholder="name@example.com"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              <span>Assignable role</span>
              <select
                value={roleCode}
                disabled={!canUseMode || !manageableRoles.length}
                onChange={(event) => setRoleCode(event.target.value)}
              >
                {manageableRoles.length ? manageableRoles.map((role) => (
                  <option value={role.code} key={role.code}>{role.name}</option>
                )) : <option value="">No assignable roles</option>}
              </select>
            </label>
            <div className="s26-team-form-info">
              <Mail size={17} />
              <span>
                {mode === "invite"
                  ? "Invitation requires acceptance."
                  : "Immediate access after backend validation."}
              </span>
            </div>
            {!canUseMode ? (
              <div className="s26-team-form-warning">
                This action is not available for your current store role.
              </div>
            ) : null}
            {notice ? (
              <div className={`s26-team-notice is-${notice.type}`}>
                {notice.type === "success" ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
                {notice.message}
              </div>
            ) : null}
            <button
              className="s26-team-submit"
              type="submit"
              disabled={!canUseMode || !email || !roleCode || teamQuery.isSubmitting}
            >
              <Mail size={17} />
              {teamQuery.isSubmitting
                ? "Saving..."
                : mode === "invite"
                  ? "Send invitation"
                  : "Add existing user"}
            </button>
          </form>
        </article>

        <aside className="s26-team-panel s26-team-roles">
          <header>
            <div><div><h2>Role summary</h2><p>Choose a role to see what they can do.</p></div></div>
          </header>
          <div className="s26-team-role-list">
            {fullData.roles.map((role) => (
              <button
                type="button"
                key={role.code || role.id}
                onClick={() => setRoleFilter(role.code)}
              >
                <span><strong>{role.name}</strong><small>{role.permissionCount} permissions</small></span>
                <TeamChip tone={role.isActive ? "green" : "slate"}>
                  {role.isActive ? "Active" : "Inactive"}
                </TeamChip>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section className="s26-team-panel s26-team-people">
        <header>
          <div>
            <div><h2>People with access</h2><p>Manage active members and their roles.</p></div>
          </div>
          <div className="s26-team-table-tools">
            <label className="s26-team-search">
              <Search size={17} />
              <input
                value={search}
                placeholder="Search members..."
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">All roles</option>
              {fullData.roles.map((role) => (
                <option value={role.code} key={role.code}>{role.name}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="disabled">Disabled</option>
              <option value="removed">Removed</option>
            </select>
            <button type="button" onClick={exportMembers}><Download size={17} /> Export</button>
          </div>
        </header>
        <div className="s26-team-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.members.length ? team.members.map((member) => {
                const ownerProtected = member.governance.isOwner || member.governance.isSelf;
                return (
                  <tr key={member.id}>
                    <td>
                      <div className="s26-team-member">
                        <span className="s26-team-avatar">{member.initials}</span>
                        <div><strong>{member.name}</strong><small>{member.email}</small></div>
                      </div>
                    </td>
                    <td>
                      <strong>{member.roleName}</strong>
                      <small>{member.permissionSummary}</small>
                    </td>
                    <td>
                      <TeamChip tone={member.status === "active" ? "green" : "slate"}>
                        {member.statusLabel}
                      </TeamChip>
                      <small>{ownerProtected ? "Owner protected" : member.governance.restrictionReason}</small>
                    </td>
                    <td>{formatDate(member.joinedAt)}</td>
                    <td>
                      <div className="s26-team-row-actions">
                        {member.governance.canViewLifecycle ? (
                          <button type="button" onClick={() => setSelectedMemberId(member.id)}>
                            View lifecycle
                          </button>
                        ) : <span>Read only</span>}
                        <button type="button" disabled aria-label="More member actions">
                          <MoreVertical size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="5"><div className="s26-team-empty">No team members match these filters.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <footer>
          <span>Showing {team.members.length} of {pagination.total} members</span>
          <div>
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft size={17} />
            </button>
            <strong>{pagination.page} / {pagination.totalPages}</strong>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </footer>
      </section>

      <Seller2026TeamMemberDrawer
        open={Boolean(selectedMember)}
        member={selectedMember}
        lifecycle={teamQuery.lifecycle}
        state={teamQuery.lifecycleState}
        onClose={() => setSelectedMemberId(null)}
      />
    </main>
  );
}
