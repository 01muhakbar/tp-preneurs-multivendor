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

function Avatar({ profile }) {
  return (
    <div className="tpacct2026-avatar-wrap">
      <div className="tpacct2026-avatar" aria-hidden="true">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" />
        ) : (
          <span>{profile.initials}</span>
        )}
      </div>
      <span className="tpacct2026-avatar-camera">
        <Camera aria-hidden="true" />
      </span>
    </div>
  );
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="tpacct2026-field">
      <Icon aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{value || "Not set"}</strong>
      </div>
    </div>
  );
}

function QuickLink({ LinkComponent, to, icon: Icon, title, text, count }) {
  return (
    <LinkComponent className="tpacct2026-quick-card" to={to}>
      <span className="tpacct2026-quick-icon">
        <Icon aria-hidden="true" />
        {count > 0 ? <i>{count > 99 ? "99+" : count}</i> : null}
      </span>
      <strong>{title}</strong>
      <small>{text}</small>
      <em>
        <ArrowRight aria-hidden="true" />
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
  LinkComponent,
  onEditProfile,
  onEditAddress,
}) {
  const quickLinks = [
    {
      to: "/user/update-profile",
      icon: User,
      title: "Update Profile",
      text: "Edit your personal information",
      count: 0,
    },
    {
      to: "/user/change-password",
      icon: KeyRound,
      title: "Change Password",
      text: "Update your account password",
      count: 0,
    },
    {
      to: "/user/notifications",
      icon: Bell,
      title: "Notifications",
      text: "Manage your notification preferences",
      count: notificationCount,
    },
    {
      to: "/user/my-account",
      icon: ShieldCheck,
      title: "Privacy & Security",
      text: "Manage your privacy settings",
      count: 0,
    },
  ];

  return (
    <section className="tpacct2026-root">
      <header className="tpacct2026-heading">
        <div>
          <h1>My Account</h1>
          <p>Manage your profile and preferences</p>
        </div>
        <IconButton onClick={onEditProfile} label="Edit Profile">
          <Pencil aria-hidden="true" />
          <span>Edit Profile</span>
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
              <h2>Profile Overview</h2>
            </div>

            <div className="tpacct2026-profile-main">
              <Avatar profile={profile} />
              <div className="tpacct2026-profile-id">
                <div>
                  <h3>{profile.name}</h3>
                  <span>{profile.statusLabel}</span>
                </div>
                <p>{profile.email}</p>
                {profile.memberSince ? <small>{profile.memberSince}</small> : null}
              </div>
            </div>

            <div className="tpacct2026-fields">
              <Field icon={Phone} label="Phone / Mobile" value={profile.phone} />
              <Field icon={MapPin} label="Address" value={profile.address} />
            </div>
          </article>

          <article className="tpacct2026-panel tpacct2026-address">
            <div className="tpacct2026-panel-title">
              <h2>Default Shipping Address</h2>
              <IconButton onClick={onEditAddress} label="Edit Address">
                <Pencil aria-hidden="true" />
                <span>Edit Address</span>
              </IconButton>
            </div>

            <div className="tpacct2026-address-box">
              <span className="tpacct2026-address-icon">
                <MapPin aria-hidden="true" />
              </span>
              <div className="tpacct2026-address-body">
                <strong>{defaultAddress.name}</strong>
                {defaultAddress.hasAddress ? (
                  <>
                    <p>{defaultAddress.summary}</p>
                    <small>{defaultAddress.phone}</small>
                  </>
                ) : (
                  <p>{defaultAddress.summary}</p>
                )}
                <div className="tpacct2026-tags">
                  <span>{defaultAddress.isPrimary ? "Primary" : "Default"}</span>
                  <span>{defaultAddress.label}</span>
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
