import { ChevronRight, Pencil, RefreshCw, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../../utils/format.js";
import "./admin-coupons-2026.css";

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getCouponDetailScopeKey = (coupon) => {
  const isStore = String(coupon?.scopeType || "PLATFORM").toUpperCase() === "STORE";
  if (!isStore) return "platform";
  return (
    slugify(coupon?.store?.slug) ||
    slugify(coupon?.store?.name) ||
    (coupon?.storeId ? `store-${coupon.storeId}` : "store")
  );
};

export const buildAdminCouponDetailPath = (coupon) => {
  const id = Number(coupon?.id);
  if (!id) return "/admin/catalog/coupons";
  return `/admin/catalog/coupons/${encodeURIComponent(String(id))}/${encodeURIComponent(getCouponDetailScopeKey(coupon))}`;
};

function PublishToggle({ checked, disabled, busy, onChange, t }) {
  const label = checked
    ? t("coupons.Active coupon in public checkout", "Active coupon in public checkout")
    : t("coupons.Inactive coupon in public checkout", "Inactive coupon in public checkout");

  return (
    <button
      type="button"
      className={`ac26-toggle ${checked ? "is-on" : ""}`}
      disabled={disabled || busy}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={checked ? t("coupons.Active", "Active") : t("coupons.Inactive", "Inactive")}
    >
      <span />
    </button>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="ac26-detail-item">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function resolveCouponActive(coupon) {
  if (typeof coupon?.active === "boolean") return coupon.active;
  if (typeof coupon?.published === "boolean") return coupon.published;
  return true;
}

function resolveCouponStatus(coupon, t = (key, fallback) => fallback) {
  if (!resolveCouponActive(coupon)) {
    return { label: t("coupons.Inactive", "Inactive"), tone: "inactive" };
  }

  const now = new Date();
  const startsAt = coupon?.startsAt || coupon?.startDate;
  const expiresAt = coupon?.expiresAt || coupon?.endDate || coupon?.endsAt;
  if (startsAt && new Date(startsAt) > now) {
    return { label: t("coupons.Scheduled", "Scheduled"), tone: "scheduled" };
  }
  if (expiresAt && new Date(expiresAt) < now) {
    return { label: t("coupons.Expired", "Expired"), tone: "expired" };
  }
  return { label: t("coupons.Active", "Active"), tone: "active" };
}

function formatDateShort(dateValue) {
  if (!dateValue) return "-";
  try {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return String(dateValue);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateValue);
  }
}

function formatPeriod(startsAt, expiresAt, t = (key, fallback) => fallback) {
  const startShort = formatDateShort(startsAt);
  const endShort = formatDateShort(expiresAt);
  if (startShort !== "-" && endShort !== "-") return `${startShort} - ${endShort}`;
  if (startShort !== "-") return `${t("coupons.Starts", "Starts")} ${startShort}`;
  if (endShort !== "-") return `${t("coupons.Expires", "Expires")} ${endShort}`;
  return t("coupons.No expiry", "No expiry");
}

export default function CouponDetail2026View({
  coupon,
  loading,
  error,
  operation,
  actions,
}) {
  const { t } = useTranslation("admin");
  const statusObj = coupon ? resolveCouponStatus(coupon, t) : null;
  const isActive = coupon ? resolveCouponActive(coupon) : false;
  const isStore = String(coupon?.scopeType || "PLATFORM").toUpperCase() === "STORE";
  const storeName = coupon?.store?.name || (coupon?.storeId ? `Store #${coupon.storeId}` : "");
  const title = coupon?.campaignName || coupon?.name || coupon?.code || t("coupons.Coupon", "Coupon");
  const discountDisplay = coupon
    ? coupon.discountType === "fixed"
      ? formatCurrency(coupon.amount || 0)
      : `${Number(coupon.amount || 0)}% ${t("coupons.OFF", "OFF")}`
    : "-";
  const limitLabel = coupon?.usageLimit ? Number(coupon.usageLimit) : t("coupons.Unlimited", "Unlimited");
  const usedLabel = `${Number(coupon?.usedCount || 0)} / ${limitLabel}`;
  const scopeLabel = isStore
    ? storeName || t("coupons.Store", "Store")
    : t("coupons.Platform", "Platform");
  const periodLabel = formatPeriod(coupon?.startDate || coupon?.startsAt, coupon?.endDate || coupon?.expiresAt, t);
  const minSpendLabel = formatCurrency(Number(coupon?.minSpend || coupon?.minimumAmount || 0));

  if (loading) {
    return (
      <div className="ac26-page ac26-page--coupons ac26-page--coupon-detail">
        <section className="ac26-detail-page-card">
          <div className="ac26-detail-skeleton" />
          <div className="ac26-detail-skeleton is-small" />
          <div className="ac26-detail-skeleton-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error || !coupon) {
    return (
      <div className="ac26-page ac26-page--coupons ac26-page--coupon-detail">
        <section className="ac26-detail-empty">
          <strong>{t("coupons.Coupon details could not be loaded.", "Coupon details could not be loaded.")}</strong>
          <p>{error || t("coupons.Please retry the request.", "Please retry the request.")}</p>
          <div>
            <button type="button" className="ac26-action" onClick={actions?.onBack}>
              <RotateCcw size={16} />
              <span>{t("coupons.Back to Coupons", "Back to Coupons")}</span>
            </button>
            <button type="button" className="ac26-action ac26-action--primary" onClick={actions?.onRetry}>
              <RefreshCw size={16} />
              <span>{t("coupons.Retry", "Retry")}</span>
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="ac26-page ac26-page--coupons ac26-page--coupon-detail">
      <section className="ac26-header">
        <div>
          <h1>{title}</h1>
          <nav aria-label="Breadcrumb">
            <button type="button" className="ac26-breadcrumb-button" onClick={actions?.onBack}>
              {t("coupons.Coupons", "Coupons")}
            </button>
            <ChevronRight size={14} />
            <span>{t("coupons.Coupon Details", "Coupon Details")}</span>
          </nav>
        </div>
        <div className="ac26-header__actions">
          <button type="button" className="ac26-action" onClick={actions?.onBack}>
            <RotateCcw size={16} />
            <span>{t("coupons.Back to Coupons", "Back to Coupons")}</span>
          </button>
          <button type="button" className="ac26-action ac26-action--primary" onClick={actions?.onEdit}>
            <Pencil size={16} />
            <span>{t("coupons.Edit Coupon", "Edit Coupon")}</span>
          </button>
        </div>
      </section>

      {operation?.label ? (
        <div className="ac26-detail-operation" role="status">
          {operation.label}
        </div>
      ) : null}

      <section className="ac26-detail-page-card">
        <header className="ac26-detail-header">
          <div>
            <span className="ac26-detail-kicker">{t("coupons.Coupon Details", "Coupon Details")}</span>
            <h2 id="ac26-detail-title">{title}</h2>
            <p>{coupon.code || "-"}</p>
          </div>
        </header>

        <section className="ac26-detail-summary" aria-label={t("coupons.Coupon overview", "Coupon overview")}>
          <div>
            <span className={`ac26-status ac26-status--${statusObj.tone}`}>{statusObj.label}</span>
            <span className={`ac26-detail-publish ${isActive ? "is-on" : ""}`}>
              {isActive ? t("coupons.Published", "Published") : t("coupons.Unpublished", "Unpublished")}
            </span>
          </div>
          <strong>{discountDisplay}</strong>
          <span>{t("coupons.Discount value", "Discount value")}</span>
        </section>

        <section className="ac26-detail-grid">
          <DetailItem label={t("coupons.Scope", "Scope")} value={scopeLabel} />
          <DetailItem label={t("coupons.Minimum spend", "Minimum spend")} value={minSpendLabel} />
          <DetailItem label={t("coupons.Usage", "Usage")} value={usedLabel} />
          <DetailItem label={t("coupons.Valid period", "Valid period")} value={periodLabel} />
        </section>

        <section className="ac26-detail-section">
          <h3>{t("coupons.Public checkout", "Public checkout")}</h3>
          <div className="ac26-detail-toggle-row">
            <div>
              <strong>{isActive ? t("coupons.Active", "Active") : t("coupons.Inactive", "Inactive")}</strong>
              <span>
                {isActive
                  ? t("coupons.This coupon can be used in public checkout.", "This coupon can be used in public checkout.")
                  : t("coupons.This coupon is hidden from public checkout.", "This coupon is hidden from public checkout.")}
              </span>
            </div>
            <PublishToggle
              checked={isActive}
              disabled={operation?.busy}
              busy={operation?.busy}
              onChange={actions?.onToggleActive}
              t={t}
            />
          </div>
        </section>
      </section>
    </div>
  );
}
