import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Download,
  Grid2X2,
  List,
  MoreVertical,
  Percent,
  Plus,
  Search,
  Tag,
  Ticket,
  TrendingUp,
  Upload,
} from "lucide-react";
import Seller2026CouponDrawer from "../../../components/seller2026/coupons/Seller2026CouponDrawer.jsx";
import { useSeller2026Coupons } from "../../../hooks/seller2026/useSeller2026Coupons.ts";
import { downloadCsvFile } from "../../../utils/exportFiles.js";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../../features/sellerWorkspace2026/Seller2026Coupons.css";

const getExportColumns = (isId) => [
  { key: "campaign", label: isId ? "Kampanye" : "Campaign" },
  { key: "code", label: isId ? "Kode" : "Code" },
  { key: "discount", label: isId ? "Diskon" : "Discount" },
  { key: "scope", label: isId ? "Target" : "Audience / Scope" },
  { key: "validity", label: isId ? "Periode" : "Validity" },
  { key: "usage", label: isId ? "Penggunaan" : "Usage" },
  { key: "status", label: isId ? "Status" : "Status" },
];

const readPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const formatMoney = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value, isId) => {
  if (!value) return isId ? "Tidak diatur" : "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return isId ? "Tidak diatur" : "Not set";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const statusLabel = (status, isId) => {
  if (status === "active") return isId ? "Aktif" : "Active";
  if (status === "scheduled") return isId ? "Terjadwal" : "Scheduled";
  if (status === "expired") return isId ? "Kedaluwarsa" : "Expired";
  return isId ? "Draf" : "Draft";
};

const statusTone = (status) => {
  if (status === "active") return "green";
  if (status === "scheduled") return "blue";
  if (status === "expired") return "slate";
  return "neutral";
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

function CouponVisual({ coupon }) {
  const tone = coupon.status === "scheduled"
    ? "violet"
    : coupon.status === "expired"
      ? "rose"
      : coupon.discountType === "percent"
        ? "amber"
        : "mint";
  return (
    <span className={`s26-coupon-visual is-${tone}`}>
      {coupon.discountType === "percent" ? <Percent size={20} /> : <Ticket size={20} />}
    </span>
  );
}

function StatusBadge({ status, isId }) {
  return (
    <span className={`s26-coupon-status is-${statusTone(status)}`}>
      <i />
      {statusLabel(status, isId)}
    </span>
  );
}

function CouponActions({
  coupon,
  open,
  busy,
  isId,
  canUpdate,
  canManageStatus,
  canArchive,
  onToggle,
  onEdit,
  onArchive,
  onOpen,
}) {
  return (
    <div className="s26-coupon-actions">
      <button
        type="button"
        className={`s26-coupon-switch${coupon.active ? " is-on" : ""}`}
        aria-label={coupon.active ? (isId ? "Nonaktifkan kupon" : "Deactivate coupon") : (isId ? "Aktifkan kupon" : "Activate coupon")}
        aria-pressed={coupon.active}
        disabled={!canManageStatus || !coupon.canManageStatus || busy}
        onClick={() => onToggle(coupon)}
      >
        <i />
      </button>
      <button
        type="button"
        className="s26-coupon-kebab"
        aria-label={isId ? `Tindakan untuk ${coupon.title}` : `Actions for ${coupon.title}`}
        onClick={() => onOpen(coupon.id)}
      >
        <MoreVertical size={17} />
      </button>
      {open ? (
        <div className="s26-coupon-menu">
          <button
            type="button"
            disabled={!canUpdate || !coupon.canEdit || busy}
            onClick={() => onEdit(coupon)}
          >
            {isId ? "Edit Kupon" : "Edit Coupon"}
          </button>
          <button
            type="button"
            disabled={!canManageStatus || !coupon.canManageStatus || busy}
            onClick={() => onToggle(coupon)}
          >
            {coupon.active ? (isId ? "Nonaktifkan" : "Deactivate") : (isId ? "Aktifkan" : "Activate")}
          </button>
          <button
            type="button"
            className="is-danger"
            disabled={!canArchive || !coupon.canArchive || busy}
            onClick={() => onArchive(coupon)}
          >
            {isId ? "Arsipkan Kupon" : "Archive Coupon"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Seller2026LiveCouponsPage() {
  const { i18n } = useTranslation();
  const isId = Boolean(String(i18n?.language || "").toLowerCase().startsWith("id"));
  const [searchParams, setSearchParams] = useSearchParams();
  const actionMenuRef = useRef(null);
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("COUPON_READ");
  const query = {
    search: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    type: searchParams.get("type") || "all",
    page: readPositiveNumber(searchParams.get("page"), 1),
    limit: readPositiveNumber(searchParams.get("limit"), 10),
  };
  const couponsQuery = useSeller2026Coupons(storeId, query, {
    enabled: canView,
    permissions: {
      canCreate: can("COUPON_CREATE"),
      canUpdate: can("COUPON_UPDATE"),
      canDelete: can("COUPON_DELETE"),
      canManageStatus: can("COUPON_STATUS_MANAGE"),
    },
  });
  const [view, setView] = useState("list");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [menuCouponId, setMenuCouponId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [notice, setNotice] = useState(null);

  const handleQueryChange = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries({ ...patch, ...(patch.page ? {} : { page: 1 }) }).forEach(([key, value]) => {
      const paramKey = key === "search" ? "q" : key;
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "all" ||
        (paramKey === "page" && Number(value) <= 1) ||
        (paramKey === "limit" && Number(value) === 10)
      ) {
        next.delete(paramKey);
      } else {
        next.set(paramKey, String(value));
      }
    });
    setSearchParams(next);
  };

  const filteredCoupons = couponsQuery.data.coupons;
  const pageCount = Math.max(1, Math.ceil(filteredCoupons.length / query.limit));
  const currentPage = Math.min(query.page, pageCount);
  const visibleCoupons = filteredCoupons.slice(
    (currentPage - 1) * query.limit,
    currentPage * query.limit
  );
  const allVisibleSelected =
    visibleCoupons.length > 0 && visibleCoupons.every((coupon) => selectedIds.has(String(coupon.id)));
  const busy = Boolean(
    couponsQuery.creating ||
    couponsQuery.updatingId ||
    couponsQuery.statusChangingId ||
    couponsQuery.deletingId
  );

  useEffect(() => {
    if (query.page > pageCount) handleQueryChange({ page: pageCount });
  }, [pageCount, query.page]);

  useEffect(() => {
    if (!menuCouponId) return undefined;
    const closeMenu = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setMenuCouponId(null);
      }
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [menuCouponId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const dateRangeLabel = useMemo(() => {
    const dates = filteredCoupons
      .flatMap((coupon) => [coupon.startsAt, coupon.expiresAt])
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((value) => !Number.isNaN(value.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    if (!dates.length) return isId ? "Semua periode kampanye" : "All campaign dates";
    return `${formatDate(dates[0], isId)} - ${formatDate(dates[dates.length - 1], isId)}`;
  }, [filteredCoupons, isId]);

  const redemptionRate = useMemo(() => {
    const usage = filteredCoupons.reduce((sum, coupon) => sum + coupon.usageCount, 0);
    const limits = filteredCoupons.reduce(
      (sum, coupon) => sum + (coupon.usageLimit || 0),
      0
    );
    return limits > 0 ? `${((usage / limits) * 100).toFixed(1)}%` : "0%";
  }, [filteredCoupons]);

  const openCreate = () => {
    setEditingCoupon(null);
    setDrawerOpen(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setMenuCouponId(null);
    setDrawerOpen(true);
  };

  const submitCoupon = async (payload) => {
    try {
      if (editingCoupon?.id) {
        await couponsQuery.updateCoupon({ couponId: editingCoupon.id, payload });
        setNotice({ type: "success", text: isId ? "Kupon berhasil diperbarui." : "Coupon updated." });
      } else {
        await couponsQuery.createCoupon(payload);
        setNotice({ type: "success", text: isId ? "Kupon baru berhasil dibuat." : "Coupon created." });
      }
      setDrawerOpen(false);
      setEditingCoupon(null);
    } catch (error) {
      throw new Error(getErrorMessage(error, isId ? "Gagal menyimpan kupon." : "Unable to save coupon."));
    }
  };

  const toggleCoupon = async (coupon) => {
    setMenuCouponId(null);
    try {
      await couponsQuery.changeCouponStatus({
        couponId: coupon.id,
        active: !coupon.active,
      });
      setNotice({
        type: "success",
        text: coupon.active
          ? (isId ? "Kupon dinonaktifkan." : "Coupon deactivated.")
          : (isId ? "Kupon diaktifkan." : "Coupon activated."),
      });
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error, isId ? "Gagal mengubah status kupon." : "Unable to update coupon status.") });
    }
  };

  const archiveCoupon = async (coupon) => {
    setMenuCouponId(null);
    const confirmText = isId
      ? `Arsipkan kupon ${coupon.code}? Kupon ini akan dinonaktifkan.`
      : `Archive ${coupon.code}? This deactivates the coupon.`;
    if (!window.confirm(confirmText)) return;
    try {
      await couponsQuery.deleteOrArchiveCoupon(coupon.id);
      setNotice({ type: "success", text: isId ? "Kupon berhasil diarsipkan." : "Coupon archived." });
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error, isId ? "Gagal mengarsipkan kupon." : "Unable to archive coupon.") });
    }
  };

  const exportCoupons = () => {
    const rows = filteredCoupons.map((coupon) => ({
      campaign: coupon.title,
      code: coupon.code,
      discount: coupon.discountLabel,
      scope: isId ? (coupon.isStoreScoped ? "Kupon Toko" : "Kupon Platform") : coupon.scopeLabel,
      validity: `${formatDate(coupon.startsAt, isId)} - ${formatDate(coupon.expiresAt, isId)}`,
      usage: coupon.usageLimit ? `${coupon.usageCount}/${coupon.usageLimit}` : `${coupon.usageCount} ${isId ? "terpakai" : "used"}`,
      status: statusLabel(coupon.status, isId),
    }));
    downloadCsvFile(getExportColumns(isId), rows, `seller-coupons-${new Date().toISOString().slice(0, 10)}.csv`);
    setNotice({ type: "success", text: isId ? `${rows.length} kupon berhasil diekspor.` : `${rows.length} coupon(s) exported.` });
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setNotice({ type: "success", text: isId ? `${code} berhasil disalin.` : `${code} copied.` });
    } catch {
      setNotice({ type: "error", text: isId ? "Gagal menyalin kode kupon." : "Unable to copy coupon code." });
    }
  };

  const toggleVisibleSelection = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      visibleCoupons.forEach((coupon) => {
        const id = String(coupon.id);
        if (allVisibleSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  if (couponsQuery.isLoading) {
    return (
      <div className="s26-coupons">
        <div className="s26-coupons-skeleton is-heading" />
        <div className="s26-coupons-summary">
          {[1, 2, 3, 4].map((item) => <div className="s26-coupons-skeleton is-card" key={item} />)}
        </div>
        <div className="s26-coupons-skeleton is-table" />
      </div>
    );
  }

  if (couponsQuery.isError) {
    return (
      <div className="s26-coupons">
        <div className="s26-coupon-error">
          <AlertTriangle size={20} />
          <div>
            <strong>{isId ? "Gagal memuat kupon" : "Unable to load coupons"}</strong>
            <span>{getErrorMessage(couponsQuery.error, isId ? "Coba lagi nanti." : "Try again.")}</span>
          </div>
          <button type="button" onClick={() => couponsQuery.refetch()}>{isId ? "Coba Lagi" : "Retry"}</button>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      label: isId ? "Kupon Aktif" : "Active Coupons",
      value: couponsQuery.data.summary.active,
      icon: Tag,
      tone: "mint",
      hint: isId ? `${couponsQuery.data.summary.total} total kampanye` : `${couponsQuery.data.summary.total} total campaigns`,
    },
    {
      label: isId ? "Terjadwal" : "Scheduled",
      value: couponsQuery.data.summary.scheduled,
      icon: CalendarDays,
      tone: "blue",
      hint: isId ? "Sesuai jadwal berlaku" : "Based on campaign validity",
    },
    {
      label: isId ? "Tingkat Penggunaan" : "Redemption Rate",
      value: redemptionRate,
      icon: Percent,
      tone: "violet",
      hint: isId ? `${couponsQuery.data.summary.redemptions} kali digunakan` : `${couponsQuery.data.summary.redemptions} recorded uses`,
    },
    {
      label: isId ? "Total Nilai Diskon" : "Revenue Lift",
      value: formatMoney(couponsQuery.data.summary.discountGiven),
      icon: TrendingUp,
      tone: "amber",
      hint: isId ? "Akumulasi diskon terpakai" : "Available attributed value",
    },
  ];

  return (
    <div className="s26-coupons">
      <nav className="s26-coupons-breadcrumb" aria-label="Breadcrumb">
        <span>{isId ? "Toko" : "Stores"}</span><i>/</i>
        <span>{sellerContext?.store?.name || (isId ? "Toko Aktif" : "Active Store")}</span><i>/</i>
        <span>{isId ? "Katalog" : "Catalog"}</span><i>/</i>
        <strong>{isId ? "Kupon" : "Coupons"}</strong>
      </nav>

      <header className="s26-coupons-header">
        <div>
          <h1>{isId ? "Kupon Toko" : "Coupons"}</h1>
          <p>{isId ? "Kelola kupon diskon toko." : "Manage store coupons."}</p>
        </div>
        <div className="s26-coupons-header__actions">
          <button type="button" onClick={exportCoupons}><Download size={17} />{isId ? "Ekspor" : "Export"}</button>
          <button type="button" disabled title={isId ? "Fitur impor belum tersedia untuk toko ini." : "Coupon import is not enabled for this workspace."}><Upload size={17} />{isId ? "Impor" : "Import"}</button>
          <button
            type="button"
            className="is-primary"
            disabled={!couponsQuery.canCreate}
            title={couponsQuery.canCreate ? (isId ? "Buat kupon baru" : "Create a coupon") : (isId ? "Membutuhkan izin buat kupon" : "Requires coupon create permission")}
            onClick={openCreate}
          >
            <Plus size={18} />{isId ? "Tambah Kupon" : "New Coupon"}
          </button>
        </div>
      </header>

      {notice ? (
        <div className={`s26-coupon-notice is-${notice.type}`} role="status">
          {notice.type === "success" ? <Check size={17} /> : <AlertTriangle size={17} />}
          {notice.text}
        </div>
      ) : null}

      <section className="s26-coupons-summary">
        {summaryCards.map(({ label, value, icon: Icon, tone, hint }) => (
          <article key={label}>
            <span className={`is-${tone}`}><Icon size={24} /></span>
            <div><small>{label}</small><strong>{value}</strong><em>{hint}</em></div>
          </article>
        ))}
      </section>

      <section className="s26-coupons-panel">
        <div className="s26-coupons-toolbar">
          <label className="s26-coupons-search">
            <Search size={18} />
            <input
              id="seller-coupons-search"
              name="search"
              value={query.search}
              placeholder={isId ? "Cari kupon..." : "Search coupons..."}
              onChange={(event) => handleQueryChange({ search: event.target.value })}
            />
          </label>
          <select value={query.status} onChange={(event) => handleQueryChange({ status: event.target.value })} aria-label={isId ? "Filter status" : "Filter by status"}>
            <option value="all">{isId ? "Semua status" : "All statuses"}</option>
            <option value="active">{isId ? "Aktif" : "Active"}</option>
            <option value="scheduled">{isId ? "Terjadwal" : "Scheduled"}</option>
            <option value="expired">{isId ? "Kedaluwarsa" : "Expired"}</option>
            <option value="inactive">{isId ? "Draf" : "Draft"}</option>
          </select>
          <select value={query.type} onChange={(event) => handleQueryChange({ type: event.target.value })} aria-label={isId ? "Filter tipe diskon" : "Filter by discount type"}>
            <option value="all">{isId ? "Semua tipe diskon" : "All discount types"}</option>
            <option value="fixed">{isId ? "Nominal Tetap" : "Fixed"}</option>
            <option value="percentage">{isId ? "Persentase" : "Percentage"}</option>
          </select>
          <span className="s26-coupons-date"><CalendarDays size={17} />{dateRangeLabel}</span>
          <div className="s26-coupons-view" aria-label={isId ? "Tampilan kupon" : "Coupon view"}>
            <button type="button" className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} aria-label={isId ? "Tampilan tabel" : "List view"}><List size={17} /></button>
            <button type="button" className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")} aria-label={isId ? "Tampilan kartu" : "Grid view"}><Grid2X2 size={16} /></button>
          </div>
        </div>

        {visibleCoupons.length === 0 ? (
          <div className="s26-coupons-empty">
            <Ticket size={30} />
            <h2>{isId ? "Tidak ada kupon ditemukan" : "No coupons found"}</h2>
            <p>{isId ? "Mulai dengan membuat kupon baru." : "Start by creating a coupon."}</p>
            <button type="button" disabled={!couponsQuery.canCreate} onClick={openCreate}>{isId ? "Tambah Kupon" : "New Coupon"}</button>
          </div>
        ) : view === "list" ? (
          <div className="s26-coupons-table-wrap" ref={actionMenuRef}>
            <table className="s26-coupons-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection} aria-label={isId ? "Pilih semua kupon yang tampil" : "Select visible coupons"} /></th>
                  <th>{isId ? "Kampanye" : "Campaign"}</th>
                  <th>{isId ? "Kode" : "Code"}</th>
                  <th>{isId ? "Diskon" : "Discount"}</th>
                  <th>{isId ? "Target" : "Audience / Scope"}</th>
                  <th>{isId ? "Periode" : "Validity"}</th>
                  <th>{isId ? "Penggunaan" : "Usage"}</th>
                  <th>{isId ? "Status" : "Status"}</th>
                  <th>{isId ? "Aksi" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {visibleCoupons.map((coupon) => {
                  const usagePercent = coupon.usageLimit
                    ? Math.min(100, Math.round((coupon.usageCount / coupon.usageLimit) * 100))
                    : 0;
                  const hasCustomDesc = coupon.description && coupon.description !== "No description available.";
                  return (
                    <tr key={coupon.id}>
                      <td><input type="checkbox" checked={selectedIds.has(String(coupon.id))} onChange={() => setSelectedIds((current) => {
                        const next = new Set(current);
                        const id = String(coupon.id);
                        if (next.has(id)) next.delete(id); else next.add(id);
                        return next;
                      })} aria-label={`Select ${coupon.title}`} /></td>
                      <td>
                        <div className="s26-coupon-campaign">
                          <CouponVisual coupon={coupon} />
                          <div>
                            <strong
                              className="s26-coupon-title-clickable"
                              role="button"
                              tabIndex={0}
                              onClick={() => openEdit(coupon)}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openEdit(coupon); }}
                            >
                              {coupon.title}
                            </strong>
                            {hasCustomDesc ? <span>{coupon.description}</span> : null}
                            <em>{isId ? (coupon.isStoreScoped ? "Kupon Toko" : "Kupon Platform") : coupon.scopeLabel}</em>
                          </div>
                        </div>
                      </td>
                      <td>
                        <button type="button" className="s26-coupon-code" onClick={() => copyCode(coupon.code)} title={isId ? "Klik untuk salin kode" : "Click to copy code"}>
                          {coupon.code}
                          <Copy size={13} />
                        </button>
                      </td>
                      <td>
                        <strong>{coupon.discountLabel}</strong>
                        <span className={`s26-coupon-type is-${coupon.discountType}`}>
                          {coupon.discountType === "percent" ? (isId ? "Persentase" : "Percentage") : (isId ? "Nominal" : "Fixed")}
                        </span>
                        <small>{isId ? "Min. belanja" : "Min. spend"} {formatMoney(coupon.minSpend)}</small>
                      </td>
                      <td>
                        <span>{isId ? "Semua Produk" : "All Products"}</span>
                        <small>{isId ? "Semua Pelanggan" : "All Customers"}</small>
                      </td>
                      <td>
                        <span>{formatDate(coupon.startsAt, isId)}</span>
                        <small>{isId ? "s/d" : "to"} {formatDate(coupon.expiresAt, isId)}</small>
                      </td>
                      <td>
                        <span>{coupon.usageLimit ? `${coupon.usageCount}/${coupon.usageLimit}` : `${coupon.usageCount} ${isId ? "terpakai" : "used"}`}</span>
                        <small>{coupon.usageLimit ? `${usagePercent}% ${isId ? "terpakai" : "used"}` : (isId ? "Tanpa batas" : "Unlimited usage")}</small>
                        <i className="s26-coupon-usage"><b style={{ width: `${usagePercent}%` }} /></i>
                      </td>
                      <td><StatusBadge status={coupon.status} isId={isId} /></td>
                      <td>
                        <CouponActions
                          coupon={coupon}
                          open={String(menuCouponId) === String(coupon.id)}
                          busy={busy}
                          isId={isId}
                          canUpdate={couponsQuery.canUpdate}
                          canManageStatus={couponsQuery.canManageStatus}
                          canArchive={couponsQuery.canDelete}
                          onToggle={toggleCoupon}
                          onEdit={openEdit}
                          onArchive={archiveCoupon}
                          onOpen={(id) => setMenuCouponId((current) => String(current) === String(id) ? null : id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="s26-coupons-grid" ref={actionMenuRef}>
            {visibleCoupons.map((coupon) => (
              <article key={coupon.id}>
                <header>
                  <CouponVisual coupon={coupon} />
                  <StatusBadge status={coupon.status} isId={isId} />
                </header>
                <h2
                  className="s26-coupon-title-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => openEdit(coupon)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openEdit(coupon); }}
                >
                  {coupon.title}
                </h2>
                <button type="button" className="s26-coupon-code" onClick={() => copyCode(coupon.code)}>
                  {coupon.code}
                  <Copy size={13} />
                </button>
                <dl>
                  <div>
                    <dt>{isId ? "Diskon" : "Discount"}</dt>
                    <dd>{coupon.discountLabel}</dd>
                  </div>
                  <div>
                    <dt>{isId ? "Minimal Belanja" : "Minimum spend"}</dt>
                    <dd>{formatMoney(coupon.minSpend)}</dd>
                  </div>
                  <div>
                    <dt>{isId ? "Periode" : "Validity"}</dt>
                    <dd>{`${formatDate(coupon.startsAt, isId)} - ${formatDate(coupon.expiresAt, isId)}`}</dd>
                  </div>
                  <div>
                    <dt>{isId ? "Penggunaan" : "Usage"}</dt>
                    <dd>{coupon.usageLimit ? `${coupon.usageCount} / ${coupon.usageLimit}` : `${coupon.usageCount} ${isId ? "terpakai" : "used"}`}</dd>
                  </div>
                </dl>
                <footer>
                  <span>{isId ? "Semua Produk · Semua Pelanggan" : "All Products · All Customers"}</span>
                  <CouponActions
                    coupon={coupon}
                    open={String(menuCouponId) === String(coupon.id)}
                    busy={busy}
                    isId={isId}
                    canUpdate={couponsQuery.canUpdate}
                    canManageStatus={couponsQuery.canManageStatus}
                    canArchive={couponsQuery.canDelete}
                    onToggle={toggleCoupon}
                    onEdit={openEdit}
                    onArchive={archiveCoupon}
                    onOpen={(id) => setMenuCouponId((current) => String(current) === String(id) ? null : id)}
                  />
                </footer>
              </article>
            ))}
          </div>
        )}

        <footer className="s26-coupons-pagination">
          <span>
            {isId
              ? `Menampilkan ${filteredCoupons.length ? (currentPage - 1) * query.limit + 1 : 0} hingga ${Math.min(currentPage * query.limit, filteredCoupons.length)} dari ${filteredCoupons.length} kupon`
              : `Showing ${filteredCoupons.length ? (currentPage - 1) * query.limit + 1 : 0} to ${Math.min(currentPage * query.limit, filteredCoupons.length)} of ${filteredCoupons.length} coupons`}
          </span>
          <div>
            <select value={query.limit} onChange={(event) => handleQueryChange({ limit: Number(event.target.value) })} aria-label={isId ? "Kupon per halaman" : "Coupons per page"}>
              <option value="5">{isId ? "5 per halaman" : "5 per page"}</option>
              <option value="10">{isId ? "10 per halaman" : "10 per page"}</option>
              <option value="20">{isId ? "20 per halaman" : "20 per page"}</option>
            </select>
            <button type="button" disabled={currentPage <= 1} onClick={() => handleQueryChange({ page: 1 })} aria-label={isId ? "Halaman pertama" : "First page"}><ChevronsLeft size={16} /></button>
            <button type="button" disabled={currentPage <= 1} onClick={() => handleQueryChange({ page: currentPage - 1 })} aria-label={isId ? "Halaman sebelumnya" : "Previous page"}><ChevronLeft size={16} /></button>
            <strong>{currentPage}</strong>
            <button type="button" disabled={currentPage >= pageCount} onClick={() => handleQueryChange({ page: currentPage + 1 })} aria-label={isId ? "Halaman berikutnya" : "Next page"}><ChevronRight size={16} /></button>
            <button type="button" disabled={currentPage >= pageCount} onClick={() => handleQueryChange({ page: pageCount })} aria-label={isId ? "Halaman terakhir" : "Last page"}><ChevronsRight size={16} /></button>
          </div>
        </footer>
      </section>

      <Seller2026CouponDrawer
        open={drawerOpen}
        coupon={editingCoupon}
        canManageStatus={couponsQuery.canManageStatus}
        isSubmitting={couponsQuery.creating || Boolean(couponsQuery.updatingId)}
        isId={isId}
        onClose={() => {
          if (busy) return;
          setDrawerOpen(false);
          setEditingCoupon(null);
        }}
        onSubmit={submitCoupon}
      />
    </div>
  );
}
