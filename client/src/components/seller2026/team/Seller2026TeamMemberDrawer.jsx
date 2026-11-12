import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

const formatDate = (value, isId, fallback = "-") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function TimelineDate({ icon: Icon, label, value, isId }) {
  return (
    <div className="s26-team-life-date">
      <span><Icon size={17} /></span>
      <div>
        <small>{label}</small>
        <strong>{formatDate(value, isId)}</strong>
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
  isId: isIdProp,
}) {
  const { i18n } = useTranslation();
  const isId =
    isIdProp !== undefined
      ? isIdProp
      : Boolean(String(i18n?.language || localStorage.getItem("store_language") || "").toLowerCase().startsWith("id"));
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
  const ownerProtected = resolvedMember.governance?.isOwner || resolvedMember.governance?.isSelf;

  const tabOptions = [
    ["overview", isId ? "Ringkasan" : "Overview"],
    ["permissions", isId ? "Izin" : "Permissions"],
    ["activity", isId ? "Aktivitas" : "Activity"],
  ];

  return (
    <div className="s26-team-drawer-layer" role="presentation">
      <button
        className="s26-team-drawer-backdrop"
        type="button"
        aria-label={isId ? "Tutup detail anggota" : "Close member details"}
        onClick={onClose}
      />
      <aside className="s26-team-drawer" role="dialog" aria-modal="true" aria-label={isId ? "Detail anggota" : "Member details"}>
        <header>
          <div>
            <span className="s26-team-avatar is-large">{resolvedMember.initials}</span>
            <div>
              <small>{isId ? "Detail anggota" : "Member details"}</small>
              <h2>{resolvedMember.name}</h2>
              <p>{resolvedMember.email || (isId ? "Email tidak tersedia" : "No email available")}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={isId ? "Tutup detail anggota" : "Close member details"}>
            <X size={20} />
          </button>
        </header>

        <div className="s26-team-drawer-badges">
          <span className="s26-team-chip is-blue">
            {localizeStatus(resolvedMember.statusLabel || resolvedMember.status, isId)}
          </span>
          <span className="s26-team-chip is-orange">
            {localizeRole(resolvedMember.roleName, isId)}
          </span>
          {ownerProtected ? (
            <span className="s26-team-chip">{isId ? "Pemilik" : "Owner protected"}</span>
          ) : null}
        </div>

        <nav className="s26-team-drawer-tabs" aria-label={isId ? "Tab detail anggota" : "Member detail tabs"}>
          {tabOptions.map(([value, label]) => (
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
              <strong>{isId ? "Gagal memuat riwayat anggota" : "Member lifecycle could not load"}</strong>
              <p>{state.error?.message || (isId ? "Coba muat ulang data anggota." : "Try loading the member again.")}</p>
              <button type="button" onClick={() => state.refetch()}>
                {isId ? "Coba Lagi" : "Retry"}
              </button>
            </div>
          ) : tab === "overview" ? (
            <>
              <section className="s26-team-drawer-card">
                <h3><UserRound size={17} /> {isId ? "Keanggotaan" : "Membership"}</h3>
                <dl className="s26-team-member-facts">
                  <div>
                    <dt>{isId ? "ID Anggota" : "Member ID"}</dt>
                    <dd>{resolvedMember.id}</dd>
                  </div>
                  <div>
                    <dt>{isId ? "Peran" : "Role"}</dt>
                    <dd>{localizeRole(resolvedMember.roleName, isId)}</dd>
                  </div>
                  <div>
                    <dt>{isId ? "Status" : "Status"}</dt>
                    <dd>{localizeStatus(resolvedMember.statusLabel || resolvedMember.status, isId)}</dd>
                  </div>
                  <div>
                    <dt>{isId ? "Terakhir aktif" : "Last active"}</dt>
                    <dd>{formatDate(resolvedMember.lastActiveAt, isId)}</dd>
                  </div>
                </dl>
              </section>
              <section className="s26-team-life-grid">
                <TimelineDate icon={CalendarClock} label={isId ? "Diundang" : "Invited"} value={lifecycle.lifecycle?.invitedAt} isId={isId} />
                <TimelineDate icon={CalendarCheck} label={isId ? "Diterima" : "Accepted"} value={lifecycle.lifecycle?.acceptedAt} isId={isId} />
                <TimelineDate icon={CircleOff} label={isId ? "Dinonaktifkan" : "Disabled"} value={lifecycle.lifecycle?.disabledAt} isId={isId} />
                <TimelineDate icon={Clock3} label={isId ? "Dihapus" : "Removed"} value={lifecycle.lifecycle?.removedAt} isId={isId} />
              </section>
              <div className="s26-team-protection-note">
                <ShieldCheck size={18} />
                <span>
                  {ownerProtected
                    ? (isId ? "Tindakan terhadap pemilik toko terlindungi sistem." : "Owner actions stay protected.")
                    : (isId ? "Tindakan tim dikelola sesuai izin dan audit sistem." : "Team actions follow system permissions.")}
                </span>
              </div>
            </>
          ) : tab === "permissions" ? (
            <section className="s26-team-drawer-card">
              <h3><KeyRound size={17} /> {isId ? "Izin peran" : "Role permissions"}</h3>
              {lifecycle.permissions?.length ? (
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
                  <p>{isId ? "Tidak ada daftar izin khusus untuk peran ini." : "No explicit permission list was returned for this role."}</p>
                </div>
              )}
            </section>
          ) : (
            <section className="s26-team-drawer-card">
              <h3><Activity size={17} /> {isId ? "Linimasa aktivitas" : "Activity timeline"}</h3>
              {lifecycle.history?.length ? (
                <div className="s26-team-history">
                  {lifecycle.history.map((item) => (
                    <article key={item.id}>
                      <i />
                      <div>
                        <time>{formatDate(item.createdAt, isId)}</time>
                        <strong>{item.title}</strong>
                        {item.summary ? <p>{item.summary}</p> : null}
                        <small>{isId ? "Oleh" : "By"} {item.actorName}</small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="s26-team-drawer-empty is-compact">
                  <p>{isId ? "Belum ada aktivitas tercatat." : "No lifecycle activity has been recorded yet."}</p>
                </div>
              )}
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
