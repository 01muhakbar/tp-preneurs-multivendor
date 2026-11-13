import {
  ArrowRight,
  Bell,
  Camera,
  KeyRound,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import "./account-my-account-2026.css";

function LoadingBlock() {
  return (
    <div className="tpacct2026-loading" aria-label="Loading account">
      {Array.from({ length: 6 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function IconButton({ children, onClick, label }) {
  return (
    <button
      type="button"
      className="tpacct2026-button"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function Avatar({ profile, onEdit }) {
  return (
    <div
      className="tpacct2026-avatar-wrap"
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEdit?.();
      }}
      aria-label="Edit avatar"
    >
      <div className="tpacct2026-avatar" aria-hidden="true">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" />
        ) : (
          <span>{profile.initials}</span>
        )}
      </div>
      <span className="tpacct2026-avatar-camera" title="Edit avatar">
        <Camera size={15} aria-hidden="true" />
      </span>
    </div>
  );
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="tpacct2026-field">
      <div className="tpacct2026-field-icon" aria-hidden="true">
        <Icon size={18} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function QuickLink({ LinkComponent, to, icon: Icon, title, text, count }) {
  return (
    <LinkComponent className="tpacct2026-quick-card" to={to}>
      <span className="tpacct2026-quick-icon">
        <Icon size={22} aria-hidden="true" />
        {count > 0 ? <i>{count > 99 ? "99+" : count}</i> : null}
      </span>
      <strong>{title}</strong>
      <small>{text}</small>
      <em>
        <ArrowRight size={17} aria-hidden="true" />
      </em>
    </LinkComponent>
  );
}

export default function AccountMyAccount2026View({
  profile,
  defaultAddress,
  notificationCount,
  isLoading,
  error,
  isIndo = false,
  LinkComponent,
  onEditProfile,
  onEditAddress,
}) {
  const t = {
    title: isIndo ? "Akun Saya" : "My Account",
    subtitle: isIndo ? "Kelola profil dan preferensi Anda" : "Manage your profile and preferences",
    editProfile: isIndo ? "Edit Profil" : "Edit Profile",
    profileOverview: isIndo ? "Ringkasan Profil" : "Profile Overview",
    phone: isIndo ? "Telepon / HP" : "Phone / Mobile",
    address: isIndo ? "Alamat" : "Address",
    defaultShippingAddress: isIndo ? "Alamat Pengiriman Utama" : "Default Shipping Address",
    editAddress: isIndo ? "Edit Alamat" : "Edit Address",
    primary: isIndo ? "Utama" : "Primary",
    default: isIndo ? "Bawaan" : "Default",
    updateProfile: isIndo ? "Ubah Profil" : "Update Profile",
    updateProfileDesc: isIndo ? "Edit informasi pribadi Anda" : "Edit your personal information",
    changePassword: isIndo ? "Ganti Kata Sandi" : "Change Password",
    changePasswordDesc: isIndo ? "Perbarui kata sandi akun Anda" : "Update your account password",
    notifications: isIndo ? "Notifikasi" : "Notifications",
    notificationsDesc: isIndo ? "Kelola preferensi notifikasi Anda" : "Manage your notification preferences",
    privacySecurity: isIndo ? "Privasi & Keamanan" : "Privacy & Security",
    privacySecurityDesc: isIndo ? "Kelola pengaturan privasi Anda" : "Manage your privacy settings",
  };

  const quickLinks = [
    {
      to: "/user/update-profile",
      icon: User,
      title: t.updateProfile,
      text: t.updateProfileDesc,
      count: 0,
    },
    {
      to: "/user/change-password",
      icon: KeyRound,
      title: t.changePassword,
      text: t.changePasswordDesc,
      count: 0,
    },
    {
      to: "/user/notifications",
      icon: Bell,
      title: t.notifications,
      text: t.notificationsDesc,
      count: notificationCount,
    },
    {
      to: "/user/change-password",
      icon: ShieldCheck,
      title: t.privacySecurity,
      text: t.privacySecurityDesc,
      count: 0,
    },
  ];

  return (
    <section className="tpacct2026-root" aria-labelledby="tpacct2026-heading-title">
      <header className="tpacct2026-heading">
        <div>
          <h1 id="tpacct2026-heading-title">{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <IconButton onClick={onEditProfile} label={t.editProfile}>
          <Pencil size={15} aria-hidden="true" />
          <span>{t.editProfile}</span>
        </IconButton>
      </header>

      {error ? (
        <div className="tpacct2026-alert" role="alert">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          <article className="tpacct2026-panel tpacct2026-profile">
            <div className="tpacct2026-panel-title">
              <h2>{t.profileOverview}</h2>
            </div>

            <div className="tpacct2026-profile-main">
              <Avatar profile={profile} onEdit={onEditProfile} />
              <div className="tpacct2026-profile-id">
                <div className="tpacct2026-id-badge-row">
                  <h3>{profile.name}</h3>
                  <span className="tpacct2026-status-badge">{profile.statusLabel}</span>
                </div>
                <p>{profile.email}</p>
                {profile.memberSince ? <small>{profile.memberSince}</small> : null}
              </div>
            </div>

            <div className="tpacct2026-fields">
              <Field icon={Phone} label={t.phone} value={profile.phone} />
              <Field icon={MapPin} label={t.address} value={profile.address} />
            </div>
          </article>

          <article className="tpacct2026-panel tpacct2026-address">
            <div className="tpacct2026-panel-title">
              <h2>{t.defaultShippingAddress}</h2>
              <IconButton onClick={onEditAddress} label={t.editAddress}>
                <Pencil size={15} aria-hidden="true" />
                <span>{t.editAddress}</span>
              </IconButton>
            </div>

            <div className="tpacct2026-address-box">
              <span className="tpacct2026-address-icon">
                <MapPin size={22} aria-hidden="true" />
              </span>
              <div className="tpacct2026-address-body">
                <strong>{defaultAddress.name}</strong>
                {defaultAddress.hasAddress ? (
                  <>
                    <p>{defaultAddress.summary}</p>
                    {defaultAddress.phone && defaultAddress.phone !== "Not set" && defaultAddress.phone !== "Belum diatur" ? (
                      <small>{defaultAddress.phone}</small>
                    ) : null}
                  </>
                ) : (
                  <p>{defaultAddress.summary}</p>
                )}
                <div className="tpacct2026-tags">
                  <span className="tpacct2026-tag-primary">
                    {defaultAddress.isPrimary ? t.primary : t.default}
                  </span>
                  <span className="tpacct2026-tag-label">{defaultAddress.label}</span>
                </div>
              </div>
            </div>
          </article>

          <nav className="tpacct2026-quick-grid" aria-label="Account shortcuts">
            {quickLinks.map((item) => (
              <QuickLink
                key={item.title}
                LinkComponent={LinkComponent}
                to={item.to}
                icon={item.icon}
                title={item.title}
                text={item.text}
                count={item.count}
              />
            ))}
          </nav>
        </>
      )}
    </section>
  );
}
