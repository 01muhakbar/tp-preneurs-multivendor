import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Globe,
  Grid2X2,
  List,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Store,
  Ticket,
  Trash2,
  Upload,
  X,
  XCircle,
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
      <ChevronDown size={15} aria-hidden="true" style={{ pointerEvents: "none" }} />
    </label>
  );
}

function KpiCard({ label, value, helper, icon: Icon, tone }) {
  return (
    <article className={`ac26-kpi ac26-kpi--${tone}`}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {helper ? <span>{helper}</span> : null}
      </div>
      <span className="ac26-kpi__icon">
        <Icon size={22} />
      </span>
    </article>
  );
}

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

function RowMoreMenu({
  coupon,
  disabled,
  open,
  onToggle,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
  isId,
  t,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onToggle();
      }
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open, onToggle]);

  const isActive = resolveCouponActive(coupon);

  return (
    <div className="ac26-more-actions" ref={menuRef}>
      <IconButton
        label={`${isId ? "Aksi lainnya untuk" : "More actions for"} ${coupon.code}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={open ? "is-active" : ""}
        onClick={onToggle}
      >
        <MoreVertical size={16} />
      </IconButton>
      {open ? (
        <div
          className="ac26-more-menu"
          role="menu"
          aria-label={`${isId ? "Aksi kupon" : "Coupon actions"} ${coupon.code}`}
        >
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onView?.(coupon);
            }}
          >
            <Eye size={15} />
            <span>{isId ? "Lihat Kupon" : t("coupons.View Coupon", "View Coupon")}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onEdit?.(coupon);
            }}
          >
            <Pencil size={15} />
            <span>{isId ? "Edit Kupon" : t("coupons.Edit Coupon", "Edit Coupon")}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onToggleActive?.(coupon);
            }}
          >
            {isActive ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>
              {isActive
                ? isId
                  ? "Nonaktifkan Kupon"
                  : t("coupons.Deactivate Coupon", "Deactivate Coupon")
                : isId
                  ? "Aktifkan Kupon"
                  : t("coupons.Activate Coupon", "Activate Coupon")}
            </span>
          </button>
          <span className="ac26-more-menu__divider" aria-hidden="true" />
          <button
            type="button"
            role="menuitem"
            className="is-danger"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onDelete?.(coupon);
            }}
          >
            <Trash2 size={15} />
            <span>{isId ? "Hapus Kupon" : t("coupons.Delete Coupon", "Delete Coupon")}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BulkActionsMenu({ open, onToggle, onClose, disabled, onBulkAction, isId, t }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const runAction = (action) => {
    onClose();
    onBulkAction(action);
  };

  return (
    <div className="ac26-more-actions" ref={menuRef}>
      <ActionButton
        icon={ChevronDown}
        disabled={disabled}
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {isId ? "Aksi Massal" : t("coupons.Bulk Action", "Bulk Action")}
      </ActionButton>
      {open ? (
        <div
          className="ac26-more-menu"
          role="menu"
          style={{
            left: 0,
            right: "auto",
            top: "calc(100% + 4px)",
            bottom: "auto",
            minWidth: 185,
            zIndex: 100,
          }}
        >
          <button type="button" role="menuitem" disabled={disabled} onClick={() => runAction("activate")}>
            <CheckCircle2 size={15} />
            <span>{isId ? "Aktifkan Massal" : t("coupons.Bulk Activate", "Bulk Activate")}</span>
          </button>
          <button type="button" role="menuitem" disabled={disabled} onClick={() => runAction("deactivate")}>
            <XCircle size={15} />
            <span>{isId ? "Nonaktifkan Massal" : t("coupons.Bulk Deactivate", "Bulk Deactivate")}</span>
          </button>
          <span className="ac26-more-menu__divider" aria-hidden="true" />
          <button
            type="button"
            role="menuitem"
            className="is-danger"
            disabled={disabled}
            onClick={() => runAction("delete")}
          >
            <Trash2 size={15} />
            <span>{isId ? "Hapus Massal" : t("coupons.Bulk Delete", "Bulk Delete")}</span>
          </button>
        </div>
      ) : null}
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
  const startsAt = coupon.startsAt || coupon.startDate;
  const expiresAt = coupon.expiresAt || coupon.endDate || coupon.endsAt;
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
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);
    return d.toLocaleDateString(isId ? "id-ID" : "en-US", {
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
  const { t, i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");

  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = async (code) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback
      setCopiedCode(null);
    }
  };

  const discountTypeOptions = useMemo(
    () => [
      { value: "all", label: isId ? "Semua Tipe" : "All Types" },
      { value: "percent", label: isId ? "Persentase (%)" : "Percent (%)" },
      { value: "fixed", label: isId ? "Nominal Tetap (Rp)" : "Fixed Amount (Rp)" },
    ],
    [isId]
  );

  const scopeOptions = useMemo(
    () => [
      { value: "all", label: isId ? "Semua Cakupan" : "All Scopes" },
      { value: "PLATFORM", label: isId ? "Cakupan Platform" : "Platform Scope" },
      { value: "STORE", label: isId ? "Cakupan Toko" : "Store Scope" },
    ],
    [isId]
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: isId ? "Semua Status" : "All Status" },
      { value: "active", label: isId ? "Aktif" : "Active" },
      { value: "scheduled", label: isId ? "Terjadwal" : "Scheduled" },
      { value: "expired", label: isId ? "Kedaluwarsa" : "Expired" },
      { value: "inactive", label: isId ? "Tidak Aktif" : "Inactive" },
    ],
    [isId]
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
  const allSelected =
    safeCoupons.length > 0 && safeCoupons.every((item) => selectedSet.has(Number(item.id)));

  const hasActiveFilters = Boolean(
    safeFilters.q ||
    (safeFilters.discountType && safeFilters.discountType !== "all") ||
    (safeFilters.scopeType && safeFilters.scopeType !== "all") ||
    (safeFilters.status && safeFilters.status !== "all")
  );

  const startIdx = safeMeta.total === 0 ? 0 : (safeMeta.page - 1) * safeMeta.limit + 1;
  const endIdx = Math.min(safeMeta.total, safeMeta.page * safeMeta.limit);

  return (
    <div className="ac26-page ac26-page--coupons">
      {/* Header Section */}
      <section className="ac26-header">
        <div>
          <h1>{isId ? "Kupon" : t("coupons.Coupons", "Coupons")}</h1>
          <nav aria-label="Breadcrumb">
            <span>{isId ? "Katalog" : t("coupons.Catalog", "Catalog")}</span>
            <ChevronRight size={14} />
            <span>{isId ? "Kupon" : t("coupons.Coupons", "Coupons")}</span>
          </nav>
        </div>
        <div className="ac26-header__actions">
          <ActionButton icon={Download} onClick={() => onExport("csv")}>
            {isId ? "Ekspor" : t("coupons.Export", "Export")}
          </ActionButton>
          <ActionButton icon={Upload} onClick={onImport}>
            {isId ? "Impor" : t("coupons.Import", "Import")}
          </ActionButton>
          <BulkActionsMenu
            open={bulkMenuOpen}
            onToggle={() => setBulkMenuOpen((open) => !open)}
            onClose={() => setBulkMenuOpen(false)}
            disabled={!anySelected}
            onBulkAction={onBulkAction}
            isId={isId}
            t={t}
          />
          <ActionButton
            icon={Trash2}
            tone="danger"
            disabled={!anySelected}
            onClick={() => onBulkAction("delete")}
          >
            {isId ? "Hapus" : t("coupons.Delete", "Delete")}
          </ActionButton>
          <ActionButton icon={Plus} tone="primary" onClick={onAddCoupon}>
            {isId ? "Tambah Kupon" : t("coupons.Add Coupon", "Add Coupon")}
          </ActionButton>
        </div>
      </section>

      {/* KPI Summary Cards */}
      <section
        className="ac26-kpis"
        aria-label={isId ? "Ringkasan metrik kupon" : "Coupon summary metrics"}
      >
        <KpiCard
          label={isId ? "Total Kupon" : t("coupons.Total Coupons", "Total Coupons")}
          value={safeStats.total}
          icon={Ticket}
          tone="blue"
        />
        <KpiCard
          label={isId ? "Diterbitkan" : t("coupons.Published", "Published")}
          value={safeStats.published}
          icon={CheckCircle2}
          tone="green"
        />
        <KpiCard
          label={isId ? "Cakupan Platform" : t("coupons.Platform Scope", "Platform Scope")}
          value={safeStats.platform}
          icon={SlidersHorizontal}
          tone="orange"
        />
        <KpiCard
          label={isId ? "Cakupan Toko" : t("coupons.Store Scope", "Store Scope")}
          value={safeStats.store}
          icon={Store}
          tone="red"
        />
      </section>

      {/* Toolbar: Search, Filters & View Toggles */}
      <section className="ac26-toolbar">
        <label className="ac26-search">
          <Search size={18} />
          <input
            id="admin-coupons-search"
            name="search"
            value={safeFilters.q || ""}
            onChange={(event) => onFilterChange({ q: event.target.value })}
            placeholder={
              isId
                ? "Cari kupon..."
                : t("coupons.Search coupons...", "Search coupons...")
            }
          />
          {safeFilters.q ? (
            <button
              type="button"
              className="ac26-icon-button"
              style={{ width: 26, height: 26, border: "none" }}
              onClick={() => onFilterChange({ q: "" })}
              aria-label={isId ? "Hapus pencarian" : "Clear search"}
            >
              <X size={15} />
            </button>
          ) : null}
        </label>

        <FieldSelect
          label={isId ? "Tipe Diskon" : t("coupons.Discount Type", "Discount Type")}
          value={safeFilters.discountType || "all"}
          onChange={(value) => onFilterChange({ discountType: value === "all" ? "" : value })}
          options={discountTypeOptions}
        />

        <FieldSelect
          label={isId ? "Cakupan" : t("coupons.Scope", "Scope")}
          value={safeFilters.scopeType || "all"}
          onChange={(value) => onFilterChange({ scopeType: value === "all" ? "" : value })}
          options={scopeOptions}
        />

        <FieldSelect
          label={isId ? "Status" : t("coupons.Status", "Status")}
          value={safeFilters.status || "all"}
          onChange={(value) => onFilterChange({ status: value === "all" ? "" : value })}
          options={statusOptions}
        />

        <div className="ac26-toolbar__actions">
          {hasActiveFilters ? (
            <button
              type="button"
              className="ac26-action"
              onClick={onResetFilters}
              style={{ height: 44, padding: "0 12px", fontSize: 12.5 }}
            >
              <X size={14} />
              <span>{isId ? "Atur Ulang" : t("coupons.Reset filters", "Reset filters")}</span>
            </button>
          ) : null}

          <div className="ac26-view-toggles">
            <IconButton
              label={isId ? "Tampilan Tabel" : t("coupons.Table View", "Table View")}
              className={viewMode === "table" ? "is-active" : ""}
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
            >
              <List size={18} />
            </IconButton>
            <IconButton
              label={isId ? "Tampilan Grid" : t("coupons.Grid View", "Grid View")}
              className={viewMode === "grid" ? "is-active" : ""}
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
            >
              <Grid2X2 size={18} />
            </IconButton>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {isError ? (
        <section className="ac26-table-card p-8 text-center" style={{ padding: "48px 24px" }}>
          <strong className="block text-base font-semibold" style={{ color: "var(--ac26-text-main)" }}>
            {isId ? "Kupon tidak dapat dimuat." : t("coupons.Coupons could not be loaded.", "Coupons could not be loaded.")}
          </strong>
          <p className="mt-1 text-sm" style={{ color: "var(--ac26-text-sub)" }}>
            {errorMessage || (isId ? "Silakan coba lagi untuk memuat data kupon terbaru." : "Please retry to fetch the latest coupons.")}
          </p>
          <div className="mt-4">
            <ActionButton icon={RefreshCw} tone="primary" onClick={onRetry}>
              {isId ? "Coba Lagi" : t("coupons.Retry", "Retry")}
            </ActionButton>
          </div>
        </section>
      ) : isLoading ? (
        <div className="ac26-table-card" style={{ padding: 24 }}>
          <div
            className="animate-pulse"
            style={{
              height: 40,
              width: "100%",
              borderRadius: 8,
              background: "var(--ac26-surface-soft)",
            }}
          />
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="mt-3 animate-pulse"
              style={{
                height: 56,
                width: "100%",
                borderRadius: 8,
                background: "var(--ac26-surface-soft)",
              }}
            />
          ))}
        </div>
      ) : safeCoupons.length === 0 ? (
        <section className="ac26-table-card" style={{ padding: "64px 24px", textAlign: "center" }}>
          <strong className="block text-lg font-bold" style={{ color: "var(--ac26-text-main)" }}>
            {isId ? "Tidak ada kupon ditemukan" : t("coupons.No coupons found", "No coupons found")}
          </strong>
          <p className="mt-1 text-sm" style={{ color: "var(--ac26-text-sub)" }}>
            {isId
              ? "Mulai dengan membuat kupon baru."
              : t("coupons.Start by creating a coupon.", "Start by creating a coupon.")}
          </p>
          <div className="mt-5">
            <ActionButton icon={Plus} tone="primary" onClick={onAddCoupon}>
              {isId ? "Tambah Kupon" : t("coupons.Add Coupon", "Add Coupon")}
            </ActionButton>
          </div>
        </section>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <section className="ac26-table-card ac26-grid-card">
          <div className="ac26-grid-view">
            {safeCoupons.map((coupon) => {
              const id = Number(coupon.id);
              const statusObj = resolveCouponStatus(coupon, isId);
              const isStore = String(coupon.scopeType || "PLATFORM").toUpperCase() === "STORE";
              const storeName = coupon.store?.name || (coupon.storeId ? `Store #${coupon.storeId}` : null);
              const isActive = resolveCouponActive(coupon);
              const discountDisplay =
                coupon.discountType === "fixed"
                  ? formatCurrency(coupon.amount || 0)
                  : `${Number(coupon.amount || 0)}% ${isId ? "DISKON" : "OFF"}`;
              const couponCode = coupon.code || "";

              return (
                <article
                  key={coupon.id}
                  className={`ac26-grid-item ${selectedSet.has(id) ? "is-selected" : ""}`}
                >
                  <div className="ac26-grid-item__header">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(id)}
                      onChange={() => onSelectOne(id)}
                      aria-label={`${isId ? "Pilih kupon" : "Select coupon"} ${couponCode}`}
                    />
                    <RowMoreMenu
                      coupon={coupon}
                      disabled={false}
                      open={openActionMenuId === coupon.id}
                      onToggle={() =>
                        setOpenActionMenuId((current) => (current === coupon.id ? null : coupon.id))
                      }
                      onView={onViewCoupon}
                      onEdit={onEditCoupon}
                      onToggleActive={onToggleActive}
                      onDelete={onDeleteCoupon}
                      isId={isId}
                      t={t}
                    />
                  </div>

                  <div className="ac26-grid-item__body">
                    <strong>{coupon.campaignName || coupon.name || couponCode}</strong>
                    <div className="ac26-coupon-code-wrap">
                      <span className="ac26-coupon-code">{couponCode}</span>
                      <button
                        type="button"
                        className="ac26-code-copy-btn"
                        onClick={() => handleCopyCode(couponCode)}
                        title={copiedCode === couponCode ? (isId ? "Kode tersalin!" : "Code copied!") : (isId ? "Salin kode kupon" : "Copy coupon code")}
                        aria-label={isId ? "Salin kode kupon" : "Copy coupon code"}
                      >
                        {copiedCode === couponCode ? <Check size={13} style={{ color: "#10b981" }} /> : <Copy size={13} />}
                      </button>
                    </div>

                    <div className="ac26-grid-item__badges">
                      <span
                        className={`ac26-badge ac26-badge--${coupon.discountType === "fixed" ? "fixed" : "percent"}`}
                      >
                        {discountDisplay}
                      </span>
                      <span className={`ac26-badge ac26-badge--${isStore ? "store" : "platform"}`}>
                        {isStore ? <Store size={12} /> : <Globe size={12} />}
                        <span>{isStore ? storeName || (isId ? "Toko" : "Store") : "Platform"}</span>
                      </span>
                      <span className={`ac26-status ac26-status--${statusObj.tone}`}>
                        <span className="ac26-status__dot" />
                        <span>{statusObj.label}</span>
                      </span>
                    </div>
                  </div>

                  <div className="ac26-grid-item__meta">
                    <div className="flex items-center justify-between">
                      <span className="font-medium" style={{ color: "var(--ac26-text-sub)" }}>
                        {isId ? "Min. belanja" : "Min spend"}:
                      </span>
                      <span className="ac26-min-spend">
                        {formatCurrency(Number(coupon.minSpend || coupon.minimumAmount || 0))}
                      </span>
                    </div>
                    <div className="ac26-dates">
                      <div className="ac26-dates-row">
                        <span className="ac26-dates-label">{isId ? "Mulai" : "Start"}:</span>
                        <span className="ac26-dates-val">
                          {formatDateDisplay(coupon.startDate || coupon.startsAt, isId)}
                        </span>
                      </div>
                      <div className="ac26-dates-row">
                        <span className="ac26-dates-label">{isId ? "Selesai" : "End"}:</span>
                        <span className="ac26-dates-val">
                          {formatDateDisplay(coupon.endDate || coupon.expiresAt, isId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ac26-grid-item__footer">
                    <span className="ac26-usage">
                      <strong>{Number(coupon.usedCount || 0)}</strong>
                      <span>
                        / {coupon.usageLimit ? Number(coupon.usageLimit) : (isId ? "Tanpa batas" : "Unlimited")}
                      </span>
                    </span>
                    <PublishToggle
                      checked={isActive}
                      disabled={false}
                      busy={false}
                      onChange={() => onToggleActive(coupon)}
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
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        /* High Contrast Table View */
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
                <col className="ac26-col-published" />
                <col className="ac26-col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label={isId ? "Pilih semua kupon" : "Select all coupons"}
                      checked={allSelected}
                      onChange={onSelectAll}
                    />
                  </th>
                  <th>{isId ? "KUPON" : t("coupons.COUPON", "COUPON")}</th>
                  <th>{isId ? "DISKON" : t("coupons.DISCOUNT", "DISCOUNT")}</th>
                  <th>{isId ? "MIN. BELANJA" : t("coupons.MIN SPEND", "MIN SPEND")}</th>
                  <th>{isId ? "CAKUPAN" : t("coupons.SCOPE", "SCOPE")}</th>
                  <th>{isId ? "PERIODE" : t("coupons.PERIOD", "PERIOD")}</th>
                  <th>{isId ? "PAKAI" : t("coupons.USAGE", "USAGE")}</th>
                  <th>{isId ? "STATUS" : t("coupons.STATUS", "STATUS")}</th>
                  <th style={{ textAlign: "center" }}>
                    {isId ? "TERBIT" : t("coupons.PUBLISHED", "PUBLISHED")}
                  </th>
                  <th style={{ textAlign: "center" }}>
                    {isId ? "AKSI" : t("coupons.ACTIONS", "ACTIONS")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {safeCoupons.map((coupon) => {
                  const id = Number(coupon.id);
                  const statusObj = resolveCouponStatus(coupon, isId);
                  const isStore = String(coupon.scopeType || "PLATFORM").toUpperCase() === "STORE";
                  const storeName = coupon.store?.name || (coupon.storeId ? `Store #${coupon.storeId}` : null);
                  const isActive = resolveCouponActive(coupon);
                  const discountDisplay =
                    coupon.discountType === "fixed"
                      ? formatCurrency(coupon.amount || 0)
                      : `${Number(coupon.amount || 0)}% ${isId ? "DISKON" : "OFF"}`;
                  const couponCode = coupon.code || "";

                  return (
                    <tr key={coupon.id} className={selectedSet.has(id) ? "is-selected" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedSet.has(id)}
                          onChange={() => onSelectOne(id)}
                          aria-label={`${isId ? "Pilih kupon" : "Select coupon"} ${couponCode}`}
                        />
                      </td>

                      {/* Coupon Name & Code */}
                      <td>
                        <div className="ac26-coupon-cell">
                          <strong>{coupon.campaignName || coupon.name || couponCode}</strong>
                          <div className="ac26-coupon-code-wrap">
                            <span className="ac26-coupon-code">{couponCode}</span>
                            <button
                              type="button"
                              className="ac26-code-copy-btn"
                              onClick={() => handleCopyCode(couponCode)}
                              title={
                                copiedCode === couponCode
                                  ? isId
                                    ? "Kode tersalin!"
                                    : "Code copied!"
                                  : isId
                                    ? "Salin kode kupon"
                                    : "Copy coupon code"
                              }
                              aria-label={isId ? "Salin kode kupon" : "Copy coupon code"}
                            >
                              {copiedCode === couponCode ? (
                                <Check size={13} style={{ color: "#10b981" }} />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Discount Badge */}
                      <td>
                        <span
                          className={`ac26-badge ac26-badge--${coupon.discountType === "fixed" ? "fixed" : "percent"}`}
                        >
                          {discountDisplay}
                        </span>
                      </td>

                      {/* Minimum Spend (High Contrast) */}
                      <td>
                        <span className="ac26-min-spend">
                          {formatCurrency(Number(coupon.minSpend || coupon.minimumAmount || 0))}
                        </span>
                      </td>

                      {/* Scope Badge */}
                      <td>
                        <span className={`ac26-badge ac26-badge--${isStore ? "store" : "platform"}`}>
                          {isStore ? <Store size={12} /> : <Globe size={12} />}
                          <span>{isStore ? storeName || (isId ? "Toko" : "Store") : "Platform"}</span>
                        </span>
                      </td>

                      {/* Period (Start & End with high contrast) */}
                      <td>
                        <div className="ac26-dates">
                          <div className="ac26-dates-row">
                            <Calendar size={13} style={{ color: "var(--ac26-text-sub)", flexShrink: 0 }} />
                            <span className="ac26-dates-label">{isId ? "Mulai" : "Start"}:</span>
                            <span className="ac26-dates-val">
                              {formatDateDisplay(coupon.startDate || coupon.startsAt, isId)}
                            </span>
                          </div>
                          <div className="ac26-dates-row" style={{ paddingLeft: 18 }}>
                            <span className="ac26-dates-label">{isId ? "Selesai" : "End"}:</span>
                            <span className="ac26-dates-val">
                              {formatDateDisplay(coupon.endDate || coupon.expiresAt, isId)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Usage */}
                      <td>
                        <span className="ac26-usage">
                          <strong>{Number(coupon.usedCount || 0)}</strong>
                          <span>
                            / {coupon.usageLimit ? Number(coupon.usageLimit) : "-"}
                          </span>
                        </span>
                      </td>

                      {/* Status Pill */}
                      <td>
                        <span className={`ac26-status ac26-status--${statusObj.tone}`}>
                          <span className="ac26-status__dot" />
                          <span>{statusObj.label}</span>
                        </span>
                      </td>

                      {/* Published Toggle */}
                      <td>
                        <div className="ac26-published-cell">
                          <PublishToggle
                            checked={isActive}
                            disabled={false}
                            busy={false}
                            onChange={() => onToggleActive(coupon)}
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
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="ac26-actions-cell">
                          <IconButton
                            label={`${isId ? "Lihat kupon" : "View coupon"} ${couponCode}`}
                            onClick={() => onViewCoupon?.(coupon)}
                          >
                            <Eye size={16} />
                          </IconButton>
                          <IconButton
                            label={`${isId ? "Edit kupon" : "Edit coupon"} ${couponCode}`}
                            onClick={() => onEditCoupon?.(coupon)}
                          >
                            <Pencil size={16} />
                          </IconButton>
                          <RowMoreMenu
                            coupon={coupon}
                            disabled={false}
                            open={openActionMenuId === coupon.id}
                            onToggle={() =>
                              setOpenActionMenuId((current) =>
                                current === coupon.id ? null : coupon.id
                              )
                            }
                            onView={onViewCoupon}
                            onEdit={onEditCoupon}
                            onToggleActive={onToggleActive}
                            onDelete={onDeleteCoupon}
                            isId={isId}
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

      {/* Pagination Bar */}
      {safeCoupons.length > 0 ? (
        <div className="ac26-pagination">
          <p>
            {isId ? "Menampilkan" : t("coupons.Showing", "Showing")} {startIdx}{" "}
            {isId ? "sampai" : t("coupons.to", "to")} {endIdx}{" "}
            {isId ? "dari" : t("coupons.of", "of")} {safeMeta.total}{" "}
            {isId ? "kupon" : t("coupons.coupons", "coupons")}
          </p>
          <div>
            <IconButton
              label={isId ? "Halaman sebelumnya" : t("coupons.Previous page", "Previous page")}
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
              label={isId ? "Halaman berikutnya" : t("coupons.Next page", "Next page")}
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
