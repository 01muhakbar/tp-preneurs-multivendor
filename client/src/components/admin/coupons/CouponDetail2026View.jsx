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

function PublishToggle({ checked, disabled, busy, onChange, label }) {
  return (
    <button
      type="button"
      className={`ac26-toggle ${checked ? "is-on" : ""}`}
      disabled={disabled || busy}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
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

function resolveCouponStatus(coupon, isId) {
  if (!resolveCouponActive(coupon)) {
    return { label: isId ? "Nonaktif" : "Inactive", tone: "inactive" };
  }

  const now = new Date();
  const startsAt = coupon?.startsAt || coupon?.startDate;
  const expiresAt = coupon?.expiresAt || coupon?.endDate || coupon?.endsAt;
  if (startsAt && new Date(startsAt) > now) {
    return { label: isId ? "Terjadwal" : "Scheduled", tone: "scheduled" };
  }
  if (expiresAt && new Date(expiresAt) < now) {
    return { label: isId ? "Kedaluwarsa" : "Expired", tone: "expired" };
  }
  return { label: isId ? "Aktif" : "Active", tone: "active" };
}

function formatDateDisplay(dateValue, isId) {
  if (!dateValue) return "-";
  try {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return String(dateValue);
    return date.toLocaleDateString(isId ? "id-ID" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateValue);
  }
}

function formatPeriod(startsAt, expiresAt, isId) {
  const startShort = formatDateDisplay(startsAt, isId);
  const endShort = formatDateDisplay(expiresAt, isId);
  if (startShort !== "-" && endShort !== "-") return `${startShort} - ${endShort}`;
  if (startShort !== "-") return `${isId ? "Mulai" : "Starts"} ${startShort}`;
  if (endShort !== "-") return `${isId ? "Selesai" : "Expires"} ${endShort}`;
  return isId ? "Tanpa batas waktu" : "No expiry";
}

export default function CouponDetail2026View({
  coupon,
  loading,
  error,
  operation,
  actions,
}) {
  const { t, i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");

  const statusObj = coupon ? resolveCouponStatus(coupon, isId) : null;
  const isActive = coupon ? resolveCouponActive(coupon) : false;
  const isStore = String(coupon?.scopeType || "PLATFORM").toUpperCase() === "STORE";
  const storeName = coupon?.store?.name || (coupon?.storeId ? `Store #${coupon.storeId}` : "");
  const title = coupon?.campaignName || coupon?.name || coupon?.code || (isId ? "Kupon" : "Coupon");
  const discountDisplay = coupon
    ? coupon.discountType === "fixed"
      ? formatCurrency(coupon.amount || 0)
      : `${Number(coupon.amount || 0)}% ${isId ? "DISKON" : "OFF"}`
    : "-";
  const limitLabel = coupon?.usageLimit ? Number(coupon.usageLimit) : (isId ? "Tanpa batas" : "Unlimited");
  const usedLabel = `${Number(coupon?.usedCount || 0)} / ${limitLabel}`;
  const scopeLabel = isStore
    ? storeName || (isId ? "Toko" : "Store")
    : "Platform";
  const periodLabel = formatPeriod(coupon?.startDate || coupon?.startsAt, coupon?.endDate || coupon?.expiresAt, isId);
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
          <strong>{isId ? "Detail kupon tidak dapat dimuat." : t("coupons.Coupon details could not be loaded.", "Coupon details could not be loaded.")}</strong>
          <p>{error || (isId ? "Silakan coba lagi." : t("coupons.Please retry the request.", "Please retry the request."))}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button type="button" className="ac26-action" onClick={actions?.onBack}>
              <RotateCcw size={16} />
              <span>{isId ? "Kembali ke Kupon" : t("coupons.Back to Coupons", "Back to Coupons")}</span>
            </button>
            <button type="button" className="ac26-action ac26-action--primary" onClick={actions?.onRetry}>
              <RefreshCw size={16} />
              <span>{isId ? "Coba Lagi" : t("coupons.Retry", "Retry")}</span>
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
              {isId ? "Kupon" : t("coupons.Coupons", "Coupons")}
            </button>
            <ChevronRight size={14} />
            <span>{isId ? "Detail Kupon" : t("coupons.Coupon Details", "Coupon Details")}</span>
          </nav>
        </div>
        <div className="ac26-header__actions">
          <button type="button" className="ac26-action" onClick={actions?.onBack}>
            <RotateCcw size={16} />
            <span>{isId ? "Kembali ke Kupon" : t("coupons.Back to Coupons", "Back to Coupons")}</span>
          </button>
          <button type="button" className="ac26-action ac26-action--primary" onClick={actions?.onEdit}>
            <Pencil size={16} />
            <span>{isId ? "Edit Kupon" : t("coupons.Edit Coupon", "Edit Coupon")}</span>
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
            <span className="ac26-detail-kicker">{isId ? "Detail Kupon" : t("coupons.Coupon Details", "Coupon Details")}</span>
            <h2 id="ac26-detail-title">{title}</h2>
            <p>{coupon.code || "-"}</p>
          </div>
        </header>

        <section className="ac26-detail-summary" aria-label={isId ? "Ringkasan kupon" : "Coupon overview"}>
          <div>
            <span className={`ac26-status ac26-status--${statusObj.tone}`}>
              <span className="ac26-status__dot" />
              <span>{statusObj.label}</span>
            </span>
            <span className={`ac26-detail-publish ${isActive ? "is-on" : ""}`}>
              {isActive ? (isId ? "Diterbitkan" : "Published") : (isId ? "Tidak Diterbitkan" : "Unpublished")}
            </span>
          </div>
          <strong>{discountDisplay}</strong>
          <span>{isId ? "Nilai Diskon" : t("coupons.Discount value", "Discount value")}</span>
        </section>

        <section className="ac26-detail-grid">
          <DetailItem label={isId ? "Cakupan" : t("coupons.Scope", "Scope")} value={scopeLabel} />
          <DetailItem label={isId ? "Min. Belanja" : t("coupons.Minimum spend", "Minimum spend")} value={minSpendLabel} />
          <DetailItem label={isId ? "Penggunaan" : t("coupons.Usage", "Usage")} value={usedLabel} />
          <DetailItem label={isId ? "Periode Berlaku" : t("coupons.Valid period", "Valid period")} value={periodLabel} />
        </section>

        <section className="ac26-detail-section">
          <h3>{isId ? "Checkout Publik" : t("coupons.Public checkout", "Public checkout")}</h3>
          <div className="ac26-detail-toggle-row">
            <div>
              <strong>{isActive ? (isId ? "Aktif" : "Active") : (isId ? "Tidak Aktif" : "Inactive")}</strong>
              <span>
                {isActive
                  ? isId
                    ? "Kupon ini dapat digunakan pembeli saat checkout publik."
                    : "This coupon can be used in public checkout."
                  : isId
                    ? "Kupon ini disembunyikan dan tidak dapat digunakan saat checkout publik."
                    : "This coupon is hidden from public checkout."}
              </span>
            </div>
            <PublishToggle
              checked={isActive}
              disabled={operation?.busy}
              busy={operation?.busy}
              onChange={actions?.onToggleActive}
              label={
                isActive
                  ? isId
                    ? "Kupon aktif di checkout"
                    : "Active coupon in public checkout"
                  : isId
                    ? "Kupon tidak aktif di checkout"
                    : "Inactive coupon in public checkout"
              }
            />
          </div>
        </section>
      </section>
    </div>
  );
}
