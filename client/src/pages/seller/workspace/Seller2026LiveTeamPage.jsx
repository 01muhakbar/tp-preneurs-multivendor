import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import Seller2026TeamMemberDrawer from "../../../components/seller2026/team/Seller2026TeamMemberDrawer.jsx";
import { useSeller2026Team } from "../../../hooks/seller2026/useSeller2026Team.ts";
import { downloadCsvFile } from "../../../utils/exportFiles.js";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../../features/sellerWorkspace2026/Seller2026Team.css";

const formatDate = (value, isId, fallback = "-") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const localizeRole = (name, isId) => {
  if (!isId || !name) return name;
  const map = {
    "Store Owner": "Pemilik Toko",
    "Store Admin": "Admin Toko",
    "Catalog Manager": "Manajer Katalog",
    "Order Manager": "Manajer Pesanan",
    "Marketing Manager": "Manajer Pemasaran",
    "Finance Viewer": "Pemantau Keuangan",
    "Content Manager": "Manajer Konten",
  };
  return map[name] || name;
};

const localizeStatus = (status, isId) => {
  if (!isId || !status) return status;
  const lower = String(status).toLowerCase();
  if (lower === "active") return "Aktif";
  if (lower === "invited") return "Diundang";
  if (lower === "disabled") return "Dinonaktifkan";
  if (lower === "removed") return "Dihapus";
  return status;
};

const localizeGroupLabel = (key, label, isId) => {
  if (!isId) return label;
  const map = {
    store: "Toko",
    orders: "Pesanan",
    payments: "Pembayaran",
    team: "Tim",
  };
  return map[String(key || "").toLowerCase()] || label;
};

const SELLER_TEAM_I18N = {
  id: {
    breadcrumbWorkspace: "Ruang Kerja",
    breadcrumbTeam: "Tim",
    pageTitle: "Tim Toko",
    pageSubtitle: "Kelola anggota tim, peran, dan hak akses toko.",
    inviteMember: "Undang Anggota",
    activeMembers: "Anggota Aktif",
    activeHelper: (active, invited) => `${active} aktif · ${invited} diundang`,
    accessStatus: "Status Akses",
    yourRole: "Peran Anda",
    roleHelper: "Akses penuh pemilik toko",
    availableRoles: "Peran Tersedia",
    rolesHelper: (count) => `${count} dapat Anda tetapkan`,
    yourAccessTitle: "Akses Anda",
    yourAccessSubtitle: "Ringkasan izin Anda di toko ini.",
    currentRole: "Peran saat ini",
    accessLevel: "Tingkat akses",
    hasAccess: "Memiliki akses",
    fullAccess: "Akses penuh",
    invitePanelTitle: "Undang atau Tambah Anggota",
    invitePanelSubtitle: "Tambah orang baru atau tautkan pengguna terdaftar.",
    tabInvite: "Undang lewat email",
    tabAttach: "Tambah pengguna terdaftar",
    emailLabel: "Alamat email",
    roleLabel: "Peran yang ditetapkan",
    noAssignableRoles: "Tidak ada peran yang dapat ditetapkan",
    inviteNotice: "Memerlukan penerimaan undangan via email.",
    attachNotice: "Akses langsung aktif setelah validasi.",
    unauthorizedRole: "Tindakan ini tidak tersedia untuk peran Anda.",
    sendInvite: "Kirim Undangan",
    addExisting: "Tambah Pengguna",
    saving: "Menyimpan...",
    inviteSuccess: "Undangan berhasil dikirim.",
    attachSuccess: "Pengguna berhasil ditambahkan ke tim.",
    actionFailed: "Tindakan tim gagal.",
    roleSummaryTitle: "Ringkasan Peran",
    roleSummarySubtitle: "Pilih peran untuk melihat detail izin.",
    permissionsUnit: "izin",
    activeStatus: "Aktif",
    inactiveStatus: "Nonaktif",
    tableTitle: "Anggota dengan Akses",
    tableSubtitle: "Kelola anggota aktif dan peran mereka.",
    searchPlaceholder: "Cari anggota tim...",
    allRoles: "Semua peran",
    allStatuses: "Semua status",
    statusActive: "Aktif",
    statusInvited: "Diundang",
    statusDisabled: "Dinonaktifkan",
    statusRemoved: "Dihapus",
    exportBtn: "Ekspor",
    colMember: "Anggota",
    colRole: "Peran",
    colStatus: "Status",
    colJoined: "Bergabung",
    colActions: "Aksi",
    viewLifecycle: "Lihat riwayat",
    readOnly: "Hanya baca",
    ownerProtected: "Pemilik",
    noMembersFound: "Tidak ada anggota tim yang cocok dengan filter ini.",
    showing: "Menampilkan",
    of: "dari",
    membersUnit: "anggota",
    teamAccessUnavailable: "Akses Tim Tidak Tersedia",
    teamAccessDesc: "Peran Anda tidak memiliki izin untuk melihat data tim toko ini.",
    teamCouldNotLoad: "Gagal memuat tim",
    teamLoadErrorFallback: "Coba muat ulang data tim toko.",
    retry: "Coba Lagi",
  },
  en: {
    breadcrumbWorkspace: "Workspace",
    breadcrumbTeam: "Team",
    pageTitle: "Team",
    pageSubtitle: "Manage your store team, roles, and access.",
    inviteMember: "Invite member",
    activeMembers: "Active members",
    activeHelper: (active, invited) => `${active} active · ${invited} invited`,
    accessStatus: "Access status",
    yourRole: "Your role",
    roleHelper: "Full store ownership access",
    availableRoles: "Available roles",
    rolesHelper: (count) => `${count} assignable by you`,
    yourAccessTitle: "Your access",
    yourAccessSubtitle: "Overview of your permissions in this store.",
    currentRole: "Current role",
    accessLevel: "Access level",
    hasAccess: "Has access",
    fullAccess: "Full access",
    invitePanelTitle: "Invite or add member",
    invitePanelSubtitle: "Add new people or assign an existing user.",
    tabInvite: "Invite by email",
    tabAttach: "Add existing user",
    emailLabel: "Email address",
    roleLabel: "Assignable role",
    noAssignableRoles: "No assignable roles",
    inviteNotice: "Invitation requires email acceptance.",
    attachNotice: "Immediate access after validation.",
    unauthorizedRole: "This action is not available for your current store role.",
    sendInvite: "Send invitation",
    addExisting: "Add existing user",
    saving: "Saving...",
    inviteSuccess: "Invitation sent successfully.",
    attachSuccess: "Existing user added successfully.",
    actionFailed: "The team action failed.",
    roleSummaryTitle: "Role summary",
    roleSummarySubtitle: "Choose a role to see what they can do.",
    permissionsUnit: "permissions",
    activeStatus: "Active",
    inactiveStatus: "Inactive",
    tableTitle: "People with access",
    tableSubtitle: "Manage active members and their roles.",
    searchPlaceholder: "Search members...",
    allRoles: "All roles",
    allStatuses: "All statuses",
    statusActive: "Active",
    statusInvited: "Invited",
    statusDisabled: "Disabled",
    statusRemoved: "Removed",
    exportBtn: "Export",
    colMember: "Member",
    colRole: "Role",
    colStatus: "Status",
    colJoined: "Joined",
    colActions: "Actions",
    viewLifecycle: "View lifecycle",
    readOnly: "Read only",
    ownerProtected: "Owner protected",
    noMembersFound: "No team members match these filters.",
    showing: "Showing",
    of: "of",
    membersUnit: "members",
    teamAccessUnavailable: "Team access is unavailable",
    teamAccessDesc: "Your seller role cannot view members or team audit information for this store.",
    teamCouldNotLoad: "Team could not load",
    teamLoadErrorFallback: "Try loading the store team again.",
    retry: "Retry",
  },
};

const getTeamExportColumns = (isId) => [
  { key: "name", label: isId ? "Anggota" : "Member" },
  { key: "email", label: isId ? "Email" : "Email" },
  { key: "role", label: isId ? "Peran" : "Role" },
  { key: "status", label: isId ? "Status" : "Status" },
  { key: "joined", label: isId ? "Bergabung" : "Joined" },
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

  const { i18n } = useTranslation();
  const [, setLangSync] = useState(0);

  useEffect(() => {
    const handleSync = () => setLangSync((c) => c + 1);
    i18n?.on?.("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("seller_language_changed", handleSync);
    window.addEventListener("store_language_changed", handleSync);
    return () => {
      i18n?.off?.("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("seller_language_changed", handleSync);
      window.removeEventListener("store_language_changed", handleSync);
    };
  }, [i18n]);

  const isId = Boolean(
    String(i18n?.language || localStorage.getItem("store_language") || "").toLowerCase().startsWith("id")
  );
  const t = isId ? SELLER_TEAM_I18N.id : SELLER_TEAM_I18N.en;

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
        setNotice({ type: "success", message: t.inviteSuccess });
      } else {
        await teamQuery.addExistingMember({ email, roleCode });
        setNotice({ type: "success", message: t.attachSuccess });
      }
      setEmail("");
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.response?.data?.message || error?.message || t.actionFailed,
      });
    }
  };

  const exportMembers = () => {
    downloadCsvFile(
      getTeamExportColumns(isId),
      fullData.members.map((member) => ({
        name: member.name,
        email: member.email,
        role: localizeRole(member.roleName, isId),
        status: localizeStatus(member.statusLabel || member.status, isId),
        joined: formatDate(member.joinedAt, isId),
      })),
      isId
        ? `tim-toko-${new Date().toISOString().slice(0, 10)}.csv`
        : `seller-team-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  if (!canView) {
    return (
      <main className="s26-team">
        <div className="s26-team-state">
          <ShieldCheck size={34} />
          <h1>{t.teamAccessUnavailable}</h1>
          <p>{t.teamAccessDesc}</p>
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
          <h1>{t.teamCouldNotLoad}</h1>
          <p>{teamQuery.error?.message || t.teamLoadErrorFallback}</p>
          <button type="button" onClick={() => teamQuery.refetch()}>{t.retry}</button>
        </div>
      </main>
    );
  }

  return (
    <main className="s26-team">
      <div className="s26-team-breadcrumb">
        <span>{t.breadcrumbWorkspace}</span><i>/</i><strong>{t.breadcrumbTeam}</strong>
      </div>

      <header className="s26-team-header">
        <div>
          <h1>{t.pageTitle}</h1>
          <p>{t.pageSubtitle}</p>
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
            <UserPlus size={18} /> {t.inviteMember}
          </button>
          <TeamChip tone="blue">
            <ShieldCheck size={15} /> {localizeRole(fullData.currentAccess.roleName, isId)}
          </TeamChip>
        </div>
      </header>

      <section className="s26-team-kpis">
        <KpiCard
          icon={Users}
          tone="navy"
          label={t.activeMembers}
          value={fullData.summary.activeMembers}
          detail={t.activeHelper(fullData.summary.activeMembers, fullData.summary.pendingInvitations)}
        />
        <KpiCard
          icon={ShieldCheck}
          tone="orange"
          label={t.accessStatus}
          value={isId ? t.hasAccess : fullData.currentAccess.accessLabel}
          detail={isId ? "Pengelola tim toko" : fullData.currentAccess.authorityLabel}
        />
        <KpiCard
          icon={KeyRound}
          tone="navy"
          label={t.yourRole}
          value={localizeRole(fullData.currentAccess.roleName, isId)}
          detail={t.roleHelper}
        />
        <KpiCard
          icon={UserPlus}
          tone="orange"
          label={t.availableRoles}
          value={fullData.summary.totalRoles}
          detail={t.rolesHelper(manageableRoles.length)}
        />
      </section>

      <section className="s26-team-main-grid">
        <article className="s26-team-panel s26-team-access">
          <header>
            <div>
              <span className="s26-team-panel-icon"><ShieldCheck size={19} /></span>
              <div>
                <h2>{t.yourAccessTitle}</h2>
                <p>{t.yourAccessSubtitle}</p>
              </div>
            </div>
          </header>
          <div className="s26-team-access-summary">
            <div>
              <small>{t.currentRole}</small>
              <strong>{localizeRole(fullData.currentAccess.roleName, isId)}</strong>
              <p>{isId ? "Pengelola operasional toko" : fullData.currentAccess.authorityLabel}</p>
            </div>
            <div>
              <small>{t.accessLevel}</small>
              <strong>{isId ? t.hasAccess : fullData.currentAccess.accessLabel}</strong>
              <p>{isId ? "Izin aktif sesuai peran akun." : "Active permissions follow store role."}</p>
            </div>
          </div>
          <div className="s26-team-access-list">
            {fullData.currentAccess.permissionGroups.map((group) => (
              <div key={group.key}>
                <span>{localizeGroupLabel(group.key, group.label, isId)}</span>
                <strong>{isId ? t.fullAccess : group.accessLabel}</strong>
              </div>
            ))}
          </div>
          <p className="s26-team-boundary-note">
            {isId
              ? "Hak akses dikelola aman sesuai kebijakan keamanan sistem."
              : "Permissions stay securely managed by system policy."}
          </p>
        </article>

        <article className="s26-team-panel s26-team-invite" ref={inviteCardRef}>
          <header>
            <div>
              <span className="s26-team-panel-icon"><UserPlus size={19} /></span>
              <div>
                <h2>{t.invitePanelTitle}</h2>
                <p>{t.invitePanelSubtitle}</p>
              </div>
            </div>
          </header>
          <div className="s26-team-form-tabs">
            <button
              type="button"
              className={mode === "invite" ? "is-active" : ""}
              onClick={() => { setMode("invite"); setNotice(null); }}
            >
              {t.tabInvite}
            </button>
            <button
              type="button"
              className={mode === "attach" ? "is-active" : ""}
              onClick={() => { setMode("attach"); setNotice(null); }}
            >
              {t.tabAttach}
            </button>
          </div>
          <form onSubmit={submitMember}>
            <label>
              <span>{t.emailLabel}</span>
              <input
                type="email"
                value={email}
                disabled={!canUseMode}
                placeholder="name@example.com"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              <span>{t.roleLabel}</span>
              <select
                value={roleCode}
                disabled={!canUseMode || !manageableRoles.length}
                onChange={(event) => setRoleCode(event.target.value)}
              >
                {manageableRoles.length ? manageableRoles.map((role) => (
                  <option value={role.code} key={role.code}>
                    {localizeRole(role.name, isId)}
                  </option>
                )) : <option value="">{t.noAssignableRoles}</option>}
              </select>
            </label>
            <div className="s26-team-form-info">
              <Mail size={17} />
              <span>
                {mode === "invite" ? t.inviteNotice : t.attachNotice}
              </span>
            </div>
            {!canUseMode ? (
              <div className="s26-team-form-warning">
                {t.unauthorizedRole}
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
                ? t.saving
                : (mode === "invite" ? t.sendInvite : t.addExisting)}
            </button>
          </form>
        </article>

        <aside className="s26-team-panel s26-team-roles">
          <header>
            <div>
              <div>
                <h2>{t.roleSummaryTitle}</h2>
                <p>{t.roleSummarySubtitle}</p>
              </div>
            </div>
          </header>
          <div className="s26-team-role-list">
            {fullData.roles.map((role) => (
              <button
                type="button"
                key={role.code || role.id}
                onClick={() => setRoleFilter(role.code)}
              >
                <span>
                  <strong>{localizeRole(role.name, isId)}</strong>
                  <small>{role.permissionCount} {t.permissionsUnit}</small>
                </span>
                <TeamChip tone={role.isActive ? "blue" : "slate"}>
                  {role.isActive ? t.activeStatus : t.inactiveStatus}
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
            <div>
              <h2>{t.tableTitle}</h2>
              <p>{t.tableSubtitle}</p>
            </div>
          </div>
          <div className="s26-team-table-tools">
            <label className="s26-team-search">
              <Search size={17} />
              <input
                value={search}
                placeholder={t.searchPlaceholder}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">{t.allRoles}</option>
              {fullData.roles.map((role) => (
                <option value={role.code} key={role.code}>{localizeRole(role.name, isId)}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">{t.allStatuses}</option>
              <option value="active">{t.statusActive}</option>
              <option value="invited">{t.statusInvited}</option>
              <option value="disabled">{t.statusDisabled}</option>
              <option value="removed">{t.statusRemoved}</option>
            </select>
            <button type="button" onClick={exportMembers}><Download size={17} /> {t.exportBtn}</button>
          </div>
        </header>
        <div className="s26-team-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.colMember}</th>
                <th>{t.colRole}</th>
                <th>{t.colStatus}</th>
                <th>{t.colJoined}</th>
                <th>{t.colActions}</th>
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
                      <strong>{localizeRole(member.roleName, isId)}</strong>
                      <small>{isId ? `${member.permissionsCount || 30} ${t.permissionsUnit}` : member.permissionSummary}</small>
                    </td>
                    <td>
                      <TeamChip tone={member.status === "active" ? "blue" : "slate"}>
                        {localizeStatus(member.statusLabel || member.status, isId)}
                      </TeamChip>
                      <small>{ownerProtected ? t.ownerProtected : (isId ? "Dikelola sistem" : member.governance.restrictionReason)}</small>
                    </td>
                    <td>{formatDate(member.joinedAt, isId)}</td>
                    <td>
                      <div className="s26-team-row-actions">
                        {member.governance.canViewLifecycle ? (
                          <button type="button" onClick={() => setSelectedMemberId(member.id)}>
                            {t.viewLifecycle}
                          </button>
                        ) : <span>{t.readOnly}</span>}
                        <button type="button" disabled aria-label="More member actions">
                          <MoreVertical size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="5"><div className="s26-team-empty">{t.noMembersFound}</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <footer>
          <span>{t.showing} {team.members.length} {t.of} {pagination.total} {t.membersUnit}</span>
          <div>
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>
            <strong>{pagination.page} / {pagination.totalPages}</strong>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              aria-label="Next page"
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
        isId={isId}
      />
    </main>
  );
}
