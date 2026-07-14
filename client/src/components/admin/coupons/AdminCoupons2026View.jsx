import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Grid2X2,
  List,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Store,
  Ticket,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { formatCurrency } from "../../../utils/format.js";
import "./admin-coupons-2026.css";

function IconButton({ children, label, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`ac26-icon-button ${className}`.trim()}
      title={label}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
}

function ActionButton({ children, icon: Icon, tone = "default", ...props }) {
  return (
    <button type="button" className={`ac26-action ac26-action--${tone}`} {...props}>
      {Icon ? <Icon size={16} /> : null}
      <span>{children}</span>
    </button>
  );
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <label className="ac26-select-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden="true" />
    </label>
  );
}

function KpiCard({ label, value, helper, icon: Icon, tone }) {
  return (
    <article className={`ac26-kpi ac26-kpi--${tone}`}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{helper}</span>
      </div>
      <span className="ac26-kpi__icon">
        <Icon size={22} />
      </span>
    </article>
  );
}

function PublishToggle({ checked, disabled, busy, onChange }) {
  return (
    <button
      type="button"
      className={`ac26-toggle ${checked ? "is-on" : ""}`}
      disabled={disabled || busy}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      title={checked ? "Published" : "Unpublished"}
    >
      <span />
    </button>
  );
}

function RowMoreMenu({
  coupon,
  disabled,
  open,
  onToggle,
  onEdit,
  onToggleActive,
  onDelete,
  t,
}) {
  return (
    <div className="ac26-more-actions">
      <IconButton
        label={`More actions for ${coupon.code}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={open ? "is-active" : ""}
        onClick={onToggle}
      >
        <MoreVertical size={16} />
      </IconButton>
      {open ? (
        <div className="ac26-more-menu" role="menu" aria-label={`More actions for ${coupon.code}`}>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onEdit(coupon);
            }}
          >
            <Pencil size={15} />
            <span>{t("coupons.Edit Coupon", "Edit Coupon")}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onToggleActive(coupon);
            }}
          >
            <CheckCircle2 size={15} />
            <span>
              {resolveCouponActive(coupon)
                ? t("coupons.Deactivate Coupon", "Deactivate Coupon")
                : t("coupons.Activate Coupon", "Activate Coupon")}
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="is-danger"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onDelete(coupon);
            }}
          >
            <Trash2 size={15} />
            <span>{t("coupons.Delete Coupon", "Delete Coupon")}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function resolveCouponStatus(coupon, t = (k, d) => d) {
  const now = new Date();
  const isActive = resolveCouponActive(coupon);
  const startsAt = coupon.startsAt || coupon.startDate;
  const expiresAt = coupon.expiresAt || coupon.endDate || coupon.endsAt;
  if (!isActive) {
    return { label: t("coupons.Draft / Inactive", "Draft / Inactive"), tone: "inactive" };
  }
  if (startsAt && new Date(startsAt) > now) {
    return { label: t("coupons.Scheduled", "Scheduled"), tone: "scheduled" };
  }
  if (expiresAt && new Date(expiresAt) < now) {
    return { label: t("coupons.Expired", "Expired"), tone: "expired" };
  }
  return { label: t("coupons.Active", "Active"), tone: "active" };
}

function resolveCouponActive(coupon) {
  if (typeof coupon?.active === "boolean") return coupon.active;
  if (typeof coupon?.published === "boolean") return coupon.published;
  return true;
}

function formatPeriod(startsAt, expiresAt) {
  if (!startsAt && !expiresAt) return "No expiry";
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };
  const start = formatDate(startsAt);
  const end = formatDate(expiresAt);
  if (start && end) return `${start} — ${end}`;
  if (start) return `Starts ${start}`;
  if (end) return `Expires ${end}`;
  return "No expiry";
}

function formatDateShort(dateValue) {
  if (!dateValue) return "-";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateValue);
  }
}

export default function AdminCoupons2026View({
  coupons,
  stats,
  meta,
  filters,
  selectedIds,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onFilterChange,
  onResetFilters,
  onSelectOne,
  onSelectAll,
  onAddCoupon,
  onViewCoupon,
  onEditCoupon,
  onDeleteCoupon,
  onToggleActive,
  onExport,
  onImport,
  onBulkAction,
  onPageChange,
}) {
  const { t } = useTranslation("admin");
  const openMenuRef = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [viewMode, setViewMode] = useState("table");

  const discountTypeOptions = useMemo(
    () => [
      { value: "all", label: t("coupons.All", "All") },
      { value: "percent", label: t("coupons.Percent (%)", "Percent (%)") },
      { value: "fixed", label: t("coupons.Fixed Amount (Rp)", "Fixed Amount (Rp)") },
    ],
    [t]
  );

  const scopeOptions = useMemo(
    () => [
      { value: "all", label: t("coupons.All", "All") },
      { value: "PLATFORM", label: t("coupons.Platform Scope", "Platform Scope") },
      { value: "STORE", label: t("coupons.Store Scope", "Store Scope") },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("coupons.All", "All") },
      { value: "active", label: t("coupons.Active", "Active") },
      { value: "scheduled", label: t("coupons.Scheduled", "Scheduled") },
      { value: "expired", label: t("coupons.Expired", "Expired") },
      { value: "inactive", label: t("coupons.Draft / Inactive", "Draft / Inactive") },
    ],
    [t]
  );

  const safeCoupons = Array.isArray(coupons) ? coupons : [];
  const safeMeta = meta || { page: 1, limit: 10, total: safeCoupons.length, totalPages: 1 };
  const safeStats = stats || {
    total: safeCoupons.length,
    published: 0,
    platform: 0,
    store: 0,
  };
  const safeFilters = filters || {
    q: "",
    discountType: "all",
    scopeType: "all",
    status: "all",
  };

  const selectedSet = useMemo(() => new Set(selectedIds || []), [selectedIds]);
  const anySelected = selectedSet.size > 0;

  useEffect(() => {
    if (!openActionMenuId) return undefined;
    const handlePointerDown = (event) => {
      if (openMenuRef.current?.contains(event.target)) return;
      setOpenActionMenuId(null);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpenActionMenuId(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openActionMenuId]);

  useEffect(() => {
    setOpenActionMenuId(null);
  }, [coupons, filters]);

  const startIdx = safeMeta.total === 0 ? 0 : (safeMeta.page - 1) * safeMeta.limit + 1;
  const endIdx = Math.min(safeMeta.total, safeMeta.page * safeMeta.limit);

  return (
    <div className="ac26-page">
      <section className="ac26-header">
        <div>
          <h1>{t("coupons.Coupons", "Coupons")}</h1>
          <nav aria-label="Breadcrumb">
            <span>{t("coupons.Catalog", "Catalog")}</span>
            <ChevronRight size={14} />
            <span>{t("coupons.Coupons", "Coupons")}</span>
          </nav>
        </div>
        <div className="ac26-header__actions">
          <ActionButton icon={Download} onClick={() => onExport("csv")}>
            {t("coupons.Export", "Export")}
          </ActionButton>
          <ActionButton icon={Upload} onClick={onImport}>
            {t("coupons.Import", "Import")}
          </ActionButton>
          <ActionButton
            icon={ChevronDown}
            disabled={!anySelected}
            onClick={() => onBulkAction("activate")}
          >
            {t("coupons.Bulk Action", "Bulk Action")}
          </ActionButton>
          <ActionButton
            icon={Trash2}
            tone="danger"
            disabled={!anySelected}
            onClick={() => onBulkAction("delete")}
          >
            {t("coupons.Delete", "Delete")}
          </ActionButton>
          <ActionButton icon={Plus} tone="primary" onClick={onAddCoupon}>
            {t("coupons.Add Coupon", "Add Coupon")}
          </ActionButton>
        </div>
      </section>

      <section className="ac26-kpis" aria-label="Coupon summary">
        <KpiCard
          label={t("coupons.Total Coupons", "Total Coupons")}
          value={safeStats.total}
          helper={t("coupons.All discount promotions", "All discount promotions")}
          icon={Ticket}
          tone="blue"
        />
        <KpiCard
          label={t("coupons.Published", "Published")}
          value={safeStats.published}
          helper={t("coupons.Loaded active coupons", "Loaded active coupons")}
          icon={CheckCircle2}
          tone="green"
        />
        <KpiCard
          label={t("coupons.Platform Scope", "Platform Scope")}
          value={safeStats.platform}
          helper={t("coupons.System-wide coupons", "System-wide coupons")}
          icon={SlidersHorizontal}
          tone="orange"
        />
        <KpiCard
          label={t("coupons.Store Scope", "Store Scope")}
          value={safeStats.store}
          helper={t("coupons.Seller store coupons", "Seller store coupons")}
          icon={Store}
          tone="red"
        />
      </section>

      <section className="ac26-toolbar">
        <label className="ac26-search">
          <Search size={20} />
          <input
            value={safeFilters.q || ""}
            onChange={(event) => onFilterChange({ q: event.target.value })}
            placeholder={t("coupons.Search by coupon name, code, or store...", "Search by coupon name, code, or store...")}
          />
        </label>
        <FieldSelect
          label={t("coupons.Discount Type", "Discount Type")}
          value={safeFilters.discountType || "all"}
          onChange={(value) => onFilterChange({ discountType: value === "all" ? "" : value })}
          options={discountTypeOptions}
        />
        <FieldSelect
          label={t("coupons.Scope", "Scope")}
          value={safeFilters.scopeType || "all"}
          onChange={(value) => onFilterChange({ scopeType: value === "all" ? "" : value })}
          options={scopeOptions}
        />
        <FieldSelect
          label={t("coupons.Status", "Status")}
          value={safeFilters.status || "all"}
          onChange={(value) => onFilterChange({ status: value === "all" ? "" : value })}
          options={statusOptions}
        />
        <div className="ac26-toolbar__actions">
          <button
            type="button"
            className="ac26-filter-button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal size={17} />
            <span>{t("coupons.More", "More")}</span>
          </button>
          <div className="ac26-view-toggles">
            <IconButton
              label={t("coupons.Table View", "Table View")}
              className={viewMode === "table" ? "is-active" : ""}
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
            >
              <List size={18} />
            </IconButton>
            <IconButton
              label={t("coupons.Grid View", "Grid View")}
              className={viewMode === "grid" ? "is-active" : ""}
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
            >
              <Grid2X2 size={18} />
            </IconButton>
          </div>
        </div>
        {filtersOpen ? (
          <div className="ac26-filter-drawer">
            <button type="button" className="ac26-action" onClick={onResetFilters}>
              <X size={16} />
              {t("coupons.Reset filters", "Reset filters")}
            </button>
          </div>
        ) : null}
      </section>

      {isError ? (
        <section className="ac26-table-card p-8 text-center">
          <strong className="block text-base font-semibold text-slate-900">{t("coupons.Coupons could not be loaded.", "Coupons could not be loaded.")}</strong>
          <p className="mt-1 text-sm text-slate-500">{errorMessage || t("coupons.Please retry to fetch the latest coupons.", "Please retry to fetch the latest coupons.")}</p>
          <div className="mt-4">
            <button type="button" className="ac26-action ac26-action--primary" onClick={onRetry}>
              {t("coupons.Retry", "Retry")}
            </button>
          </div>
        </section>
      ) : isLoading ? (
        <div className="ac26-table-card p-6">
          <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="mt-3 h-14 w-full animate-pulse rounded bg-slate-50" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <section className="ac26-table-card p-12 text-center">
          <strong className="block text-base font-semibold text-slate-900">{t("coupons.No coupons found", "No coupons found")}</strong>
          <p className="mt-1 text-sm text-slate-500">
            {t("coupons.Create your first coupon to enable checkout discounts.", "Create your first coupon to enable checkout discounts.")}
          </p>
          <div className="mt-5">
            <button type="button" className="ac26-action ac26-action--primary" onClick={onAddCoupon}>
              + {t("coupons.Add Coupon", "Add Coupon")}
            </button>
          </div>
        </section>
      ) : viewMode === "grid" ? (
        <section className="ac26-table-card ac26-grid-card">
          <div className="ac26-grid-view">
            {safeCoupons.map((coupon) => {
              const id = Number(coupon.id);
              const statusObj = resolveCouponStatus(coupon, t);
              const isStore = String(coupon.scopeType || "PLATFORM").toUpperCase() === "STORE";
              const storeName = coupon.store?.name || (coupon.storeId ? `Store #${coupon.storeId}` : null);
              const isActive = resolveCouponActive(coupon);
              const discountDisplay =
                coupon.discountType === "fixed"
                  ? formatCurrency(coupon.amount || 0)
                  : `${Number(coupon.amount || 0)}% ${t("coupons.OFF", "OFF")}`;

              return (
                <article key={coupon.id} className={`ac26-grid-item ${selectedSet.has(id) ? "is-selected" : ""}`}>
                  <div className="ac26-grid-item__header">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(id)}
                      onChange={() => onSelectOne(id)}
                      aria-label={`Select ${coupon.code}`}
                    />
                    <div ref={openActionMenuId === coupon.id ? openMenuRef : null}>
                      <RowMoreMenu
                        coupon={coupon}
                        disabled={false}
                        open={openActionMenuId === coupon.id}
                        onToggle={() =>
                          setOpenActionMenuId((current) => (current === coupon.id ? null : coupon.id))
                        }
                        onEdit={onEditCoupon}
                        onToggleActive={onToggleActive}
                        onDelete={onDeleteCoupon}
                        t={t}
                      />
                    </div>
                  </div>
                  <div className="ac26-grid-item__body">
                    <strong>{coupon.campaignName || coupon.code}</strong>
                    <span className="ac26-coupon-code">{coupon.code}</span>
                    <div className="ac26-grid-item__badges">
                      <span className={`ac26-badge ac26-badge--${coupon.discountType === "fixed" ? "fixed" : "percent"}`}>
                        {discountDisplay}
                      </span>
                      <span className={`ac26-badge ac26-badge--${isStore ? "store" : "platform"}`}>
                        {isStore ? storeName || t("coupons.Store", "Store") : t("coupons.Platform", "Platform")}
                      </span>
                      <span className={`ac26-status ac26-status--${statusObj.tone}`}>{statusObj.label}</span>
                    </div>
                  </div>
                  <div className="ac26-grid-item__meta">
                    <span>{t("coupons.Min spend", "Min spend")}: {formatCurrency(Number(coupon.minSpend || coupon.minimumAmount || 0))}</span>
                    <span>{formatPeriod(coupon.startDate || coupon.startsAt, coupon.endDate || coupon.expiresAt)}</span>
                  </div>
                  <div className="ac26-grid-item__footer">
                    <span className="ac26-usage">
                      <strong>{Number(coupon.usedCount || 0)}</strong>
                      <span>/ {coupon.usageLimit ? Number(coupon.usageLimit) : t("coupons.Unlimited", "Unlimited")}</span>
                    </span>
                    <PublishToggle
                      checked={isActive}
                      disabled={false}
                      busy={false}
                      onChange={() => onToggleActive(coupon)}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="ac26-table-card">
          <div className="ac26-table-wrap">
            <table className="ac26-table">
              <colgroup>
                <col className="ac26-col-select" />
                <col className="ac26-col-coupon" />
                <col className="ac26-col-discount" />
                <col className="ac26-col-min" />
                <col className="ac26-col-scope" />
                <col className="ac26-col-period" />
                <col className="ac26-col-usage" />
                <col className="ac26-col-state" />
                <col className="ac26-col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select all coupons"
                      checked={
                        coupons.length > 0 &&
                        coupons.every((item) => selectedSet.has(Number(item.id)))
                      }
                      onChange={onSelectAll}
                    />
                  </th>
                  <th>{t("coupons.COUPON", "COUPON")}</th>
                  <th>{t("coupons.DISCOUNT", "DISCOUNT")}</th>
                  <th>{t("coupons.MIN SPEND", "MIN SPEND")}</th>
                  <th>{t("coupons.SCOPE", "SCOPE")}</th>
                  <th>{t("coupons.PERIOD", "PERIOD")}</th>
                  <th>{t("coupons.USAGE", "USAGE")}</th>
                  <th>{t("coupons.STATUS", "STATUS")}</th>
                  <th>{t("coupons.ACTIONS", "ACTIONS")}</th>
                </tr>
              </thead>
              <tbody>
                {safeCoupons.map((coupon) => {
                  const id = Number(coupon.id);
                  const statusObj = resolveCouponStatus(coupon, t);
                  const isStore = String(coupon.scopeType || "PLATFORM").toUpperCase() === "STORE";
                  const storeName = coupon.store?.name || (coupon.storeId ? `Store #${coupon.storeId}` : null);
                  const isActive = resolveCouponActive(coupon);
                  const discountDisplay =
                    coupon.discountType === "fixed"
                      ? formatCurrency(coupon.amount || 0)
                      : `${Number(coupon.amount || 0)}% ${t("coupons.OFF", "OFF")}`;

                  return (
                    <tr key={coupon.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedSet.has(id)}
                          onChange={() => onSelectOne(id)}
                          aria-label={`Select ${coupon.code}`}
                        />
                      </td>
                      <td>
                        <div className="ac26-coupon-cell">
                          <strong>{coupon.campaignName || coupon.code}</strong>
                          <div>
                            <span className="ac26-coupon-code">{coupon.code}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className={`ac26-badge ac26-badge--${coupon.discountType === "fixed" ? "fixed" : "percent"}`}>
                            {discountDisplay}
                          </span>
                        </div>
                      </td>
                      <td>
                        {formatCurrency(Number(coupon.minSpend || coupon.minimumAmount || 0))}
                      </td>
                      <td>
                        <span className={`ac26-badge ac26-badge--${isStore ? "store" : "platform"}`}>
                          {isStore ? storeName || t("coupons.Store", "Store") : t("coupons.Platform", "Platform")}
                        </span>
                      </td>
                      <td>
                        <span className="ac26-dates">
                          <span>{t("coupons.Start:", "Start:")} {formatDateShort(coupon.startDate || coupon.startsAt)}</span>
                          <span>{t("coupons.End:", "End:")} {formatDateShort(coupon.endDate || coupon.expiresAt)}</span>
                        </span>
                      </td>
                      <td>
                        <span className="ac26-usage">
                          <strong>{Number(coupon.usedCount || 0)}</strong>
                          <span title={coupon.usageLimit ? undefined : t("coupons.No limit", "No limit")}>
                            / {coupon.usageLimit ? Number(coupon.usageLimit) : "-"}
                          </span>
                        </span>
                      </td>
                      <td>
                        <div className="ac26-state-cell">
                          <PublishToggle
                            checked={isActive}
                            disabled={false}
                            busy={false}
                            onChange={() => onToggleActive(coupon)}
                          />
                          <span className={`ac26-status ac26-status--${statusObj.tone}`}>
                            {statusObj.label}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="ac26-actions-cell">
                          <IconButton
                            label={`${t("coupons.View Coupon", "View Coupon")} ${coupon.code}`}
                            onClick={() => (onViewCoupon || onEditCoupon)?.(coupon)}
                          >
                            <Eye size={16} />
                          </IconButton>
                          <IconButton
                            label={`${t("coupons.Edit Coupon", "Edit Coupon")} ${coupon.code}`}
                            onClick={() => onEditCoupon(coupon)}
                          >
                            <Pencil size={16} />
                          </IconButton>
                          <RowMoreMenu
                            coupon={coupon}
                            disabled={false}
                            open={openActionMenuId === coupon.id}
                            onToggle={() =>
                              setOpenActionMenuId((current) => (current === coupon.id ? null : coupon.id))
                            }
                            onEdit={onEditCoupon}
                            onToggleActive={onToggleActive}
                            onDelete={onDeleteCoupon}
                            t={t}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {safeCoupons.length > 0 ? (
        <div className="ac26-pagination">
          <p>
            {t("coupons.Showing", "Showing")} {startIdx} {t("coupons.to", "to")} {endIdx} {t("coupons.of", "of")} {safeMeta.total} {t("coupons.coupons", "coupons")}
          </p>
          <div>
            <IconButton
              label="Previous page"
              disabled={safeMeta.page <= 1}
              onClick={() => onPageChange(safeMeta.page - 1)}
            >
              <ChevronLeft size={18} />
            </IconButton>
            <span className="ac26-page-group">
              <button type="button" className="is-active" disabled>
                {safeMeta.page}
              </button>
            </span>
            <IconButton
              label="Next page"
              disabled={safeMeta.page >= (safeMeta.totalPages || 1)}
              onClick={() => onPageChange(safeMeta.page + 1)}
            >
              <ChevronRight size={18} />
            </IconButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
