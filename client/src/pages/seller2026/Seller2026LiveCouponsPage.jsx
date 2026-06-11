import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import Seller2026CouponDrawer from "../../components/seller2026/coupons/Seller2026CouponDrawer.jsx";
import { useSeller2026Coupons } from "../../hooks/seller2026/useSeller2026Coupons.ts";
import { downloadCsvFile } from "../../utils/exportFiles.js";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/Seller2026Coupons.css";

const EXPORT_COLUMNS = [
  { key: "campaign", label: "Campaign" },
  { key: "code", label: "Code" },
  { key: "discount", label: "Discount" },
  { key: "scope", label: "Audience / Scope" },
  { key: "validity", label: "Validity" },
  { key: "usage", label: "Usage" },
  { key: "status", label: "Status" },
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

const formatDate = (value) => {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const statusLabel = (status) => {
  if (status === "active") return "Active";
  if (status === "scheduled") return "Scheduled";
  if (status === "expired") return "Expired";
  return "Draft";
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

function StatusBadge({ status }) {
  return (
    <span className={`s26-coupon-status is-${statusTone(status)}`}>
      <i />
      {statusLabel(status)}
    </span>
  );
}

function CouponActions({
  coupon,
  open,
  busy,
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
        aria-label={coupon.active ? "Deactivate coupon" : "Activate coupon"}
        aria-pressed={coupon.active}
        disabled={!canManageStatus || !coupon.canManageStatus || busy}
        onClick={() => onToggle(coupon)}
      >
        <i />
      </button>
      <button
        type="button"
        className="s26-coupon-kebab"
        aria-label={`Actions for ${coupon.title}`}
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
            Edit Coupon
          </button>
          <button
            type="button"
            disabled={!canManageStatus || !coupon.canManageStatus || busy}
            onClick={() => onToggle(coupon)}
          >
            {coupon.active ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            className="is-danger"
            disabled={!canArchive || !coupon.canArchive || busy}
            onClick={() => onArchive(coupon)}
          >
            Archive Coupon
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Seller2026LiveCouponsPage() {
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
    if (!dates.length) return "All campaign dates";
    return `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}`;
  }, [filteredCoupons]);

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
        setNotice({ type: "success", text: "Coupon updated." });
      } else {
        await couponsQuery.createCoupon(payload);
        setNotice({ type: "success", text: "Coupon created." });
      }
      setDrawerOpen(false);
      setEditingCoupon(null);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Unable to save coupon."));
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
        text: coupon.active ? "Coupon deactivated." : "Coupon activated.",
      });
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error, "Unable to update coupon status.") });
    }
  };

  const archiveCoupon = async (coupon) => {
    setMenuCouponId(null);
    if (!window.confirm(`Archive ${coupon.code}? This deactivates the coupon.`)) return;
    try {
      await couponsQuery.deleteOrArchiveCoupon(coupon.id);
      setNotice({ type: "success", text: "Coupon archived." });
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error, "Unable to archive coupon.") });
    }
  };

  const exportCoupons = () => {
    const rows = filteredCoupons.map((coupon) => ({
      campaign: coupon.title,
      code: coupon.code,
      discount: coupon.discountLabel,
      scope: coupon.scopeLabel,
      validity: coupon.validityLabel,
      usage: coupon.usageLabel,
      status: statusLabel(coupon.status),
    }));
    downloadCsvFile(EXPORT_COLUMNS, rows, `seller-coupons-${new Date().toISOString().slice(0, 10)}.csv`);
    setNotice({ type: "success", text: `${rows.length} coupon(s) exported.` });
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setNotice({ type: "success", text: `${code} copied.` });
    } catch {
      setNotice({ type: "error", text: "Unable to copy coupon code." });
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
          <div><strong>Unable to load coupons</strong><span>{getErrorMessage(couponsQuery.error, "Try again.")}</span></div>
          <button type="button" onClick={() => couponsQuery.refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: "Active Coupons", value: couponsQuery.data.summary.active, icon: Tag, tone: "mint", hint: `${couponsQuery.data.summary.total} total campaigns` },
    { label: "Scheduled", value: couponsQuery.data.summary.scheduled, icon: CalendarDays, tone: "blue", hint: "Based on campaign validity" },
    { label: "Redemption Rate", value: redemptionRate, icon: Percent, tone: "violet", hint: `${couponsQuery.data.summary.redemptions} recorded uses` },
    { label: "Revenue Lift", value: formatMoney(couponsQuery.data.summary.discountGiven), icon: TrendingUp, tone: "amber", hint: "Available attributed value" },
  ];

  return (
    <div className="s26-coupons">
      <nav className="s26-coupons-breadcrumb" aria-label="Breadcrumb">
        <span>Stores</span><i>/</i>
        <span>{sellerContext?.store?.name || "Active Store"}</span><i>/</i>
        <span>Catalog</span><i>/</i>
        <strong>Coupons</strong>
      </nav>

      <header className="s26-coupons-header">
        <div>
          <h1>Coupons</h1>
          <p>Create, manage, and monitor store discount campaigns.</p>
        </div>
        <div className="s26-coupons-header__actions">
          <button type="button" onClick={exportCoupons}><Download size={17} />Export</button>
          <button type="button" disabled title="Coupon import is not enabled for this workspace."><Upload size={17} />Import</button>
          <button
            type="button"
            className="is-primary"
            disabled={!couponsQuery.canCreate}
            title={couponsQuery.canCreate ? "Create a coupon" : "Requires coupon create permission"}
            onClick={openCreate}
          >
            <Plus size={18} />New Coupon
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
              value={query.search}
              placeholder="Search by campaign name or code..."
              onChange={(event) => handleQueryChange({ search: event.target.value })}
            />
          </label>
          <select value={query.status} onChange={(event) => handleQueryChange({ status: event.target.value })} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="inactive">Draft</option>
          </select>
          <select value={query.type} onChange={(event) => handleQueryChange({ type: event.target.value })} aria-label="Filter by discount type">
            <option value="all">All discount types</option>
            <option value="fixed">Fixed</option>
            <option value="percentage">Percentage</option>
          </select>
          <span className="s26-coupons-date"><CalendarDays size={17} />{dateRangeLabel}</span>
          <div className="s26-coupons-view" aria-label="Coupon view">
            <button type="button" className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} aria-label="List view"><List size={17} /></button>
            <button type="button" className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")} aria-label="Grid view"><Grid2X2 size={16} /></button>
          </div>
        </div>

        {visibleCoupons.length === 0 ? (
          <div className="s26-coupons-empty">
            <Ticket size={30} />
            <h2>No coupons found</h2>
            <p>Adjust the filters or create a new store coupon.</p>
            <button type="button" disabled={!couponsQuery.canCreate} onClick={openCreate}>New Coupon</button>
          </div>
        ) : view === "list" ? (
          <div className="s26-coupons-table-wrap" ref={actionMenuRef}>
            <table className="s26-coupons-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection} aria-label="Select visible coupons" /></th>
                  <th>Campaign</th><th>Code</th><th>Discount</th><th>Audience / Scope</th>
                  <th>Validity</th><th>Usage</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCoupons.map((coupon) => {
                  const usagePercent = coupon.usageLimit
                    ? Math.min(100, Math.round((coupon.usageCount / coupon.usageLimit) * 100))
                    : 0;
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
                          <div><strong>{coupon.title}</strong><span>{coupon.description}</span><em>{coupon.scopeLabel}</em></div>
                        </div>
                      </td>
                      <td><button type="button" className="s26-coupon-code" onClick={() => copyCode(coupon.code)}>{coupon.code}<Copy size={14} /></button></td>
                      <td><strong>{coupon.discountLabel}</strong><span className={`s26-coupon-type is-${coupon.discountType}`}>{coupon.discountType === "percent" ? "Percentage" : "Fixed"}</span><small>Min. spend {formatMoney(coupon.minSpend)}</small></td>
                      <td><span>All Products</span><small>All Customers</small></td>
                      <td><span>{formatDate(coupon.startsAt)}</span><small>to {formatDate(coupon.expiresAt)}</small></td>
                      <td>
                        <span>{coupon.usageLabel}</span><small>{coupon.usageLimit ? `${usagePercent}% used` : "Unlimited usage"}</small>
                        <i className="s26-coupon-usage"><b style={{ width: `${usagePercent}%` }} /></i>
                      </td>
                      <td><StatusBadge status={coupon.status} /></td>
                      <td>
                        <CouponActions
                          coupon={coupon}
                          open={String(menuCouponId) === String(coupon.id)}
                          busy={busy}
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
                <header><CouponVisual coupon={coupon} /><StatusBadge status={coupon.status} /></header>
                <h2>{coupon.title}</h2>
                <button type="button" className="s26-coupon-code" onClick={() => copyCode(coupon.code)}>{coupon.code}<Copy size={14} /></button>
                <dl>
                  <div><dt>Discount</dt><dd>{coupon.discountLabel}</dd></div>
                  <div><dt>Minimum spend</dt><dd>{formatMoney(coupon.minSpend)}</dd></div>
                  <div><dt>Validity</dt><dd>{coupon.validityLabel}</dd></div>
                  <div><dt>Usage</dt><dd>{coupon.usageLabel}</dd></div>
                </dl>
                <footer>
                  <span>All Products · All Customers</span>
                  <CouponActions
                    coupon={coupon}
                    open={String(menuCouponId) === String(coupon.id)}
                    busy={busy}
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
            Showing {filteredCoupons.length ? (currentPage - 1) * query.limit + 1 : 0} to {Math.min(currentPage * query.limit, filteredCoupons.length)} of {filteredCoupons.length} coupons
          </span>
          <div>
            <select value={query.limit} onChange={(event) => handleQueryChange({ limit: Number(event.target.value) })} aria-label="Coupons per page">
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
            </select>
            <button type="button" disabled={currentPage <= 1} onClick={() => handleQueryChange({ page: 1 })} aria-label="First page"><ChevronsLeft size={16} /></button>
            <button type="button" disabled={currentPage <= 1} onClick={() => handleQueryChange({ page: currentPage - 1 })} aria-label="Previous page"><ChevronLeft size={16} /></button>
            <strong>{currentPage}</strong>
            <button type="button" disabled={currentPage >= pageCount} onClick={() => handleQueryChange({ page: currentPage + 1 })} aria-label="Next page"><ChevronRight size={16} /></button>
            <button type="button" disabled={currentPage >= pageCount} onClick={() => handleQueryChange({ page: pageCount })} aria-label="Last page"><ChevronsRight size={16} /></button>
          </div>
        </footer>
      </section>

      <Seller2026CouponDrawer
        open={drawerOpen}
        coupon={editingCoupon}
        canManageStatus={couponsQuery.canManageStatus}
        isSubmitting={couponsQuery.creating || Boolean(couponsQuery.updatingId)}
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
