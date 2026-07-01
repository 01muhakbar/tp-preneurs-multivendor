import { Link } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  ImageIcon,
  MapPin,
  MessageCircleMore,
  MessageSquareText,
  Package,
  Star,
  Store,
  ShieldCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchSellerKycRequest } from "../../api/seller2026/kyc.ts";
import { getStorePublicIdentityBySlug } from "../../api/storePublicIdentity.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { useAuth } from "../../auth/useAuth.js";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const formatMonthYear = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const formatMetricValue = (value, fallback = "-") => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed.toLocaleString("en-US");
};

const formatRating = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return parsed.toFixed(1);
};

const formatTimeAgo = (dateString) => {
  if (!dateString) {
    try {
      dateString = localStorage.getItem('demoSellerLastLogout');
    } catch {}
  }

  if (!dateString) {
    const defaultDate = new Date();
    defaultDate.setMinutes(defaultDate.getMinutes() - 1);
    dateString = defaultDate.toISOString();
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "1 minute ago";

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "1 minute ago";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

function SellerLogo({ logoUrl, name, isVerified }) {
  const resolved = resolveAssetUrl(logoUrl);

  const renderBadge = () => {
    if (!isVerified) return null;
    return (
      <div 
        className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-[#061520]"
        title="Fully Verified Store"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
      </div>
    );
  };

  if (!resolved) {
    return (
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500 sm:h-[68px] sm:w-[68px]">
          <ImageIcon className="h-5 w-5" />
        </div>
        {renderBadge()}
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src={resolved}
        alt={name || "Store"}
        className="h-16 w-16 rounded-2xl border border-slate-200 object-cover dark:border-white/10 sm:h-[68px] sm:w-[68px]"
      />
      {renderBadge()}
    </div>
  );
}

export default function ProductSellerInfoCard({ sellerInfo }) {
  const auth = useAuth();
  if (!sellerInfo?.name) return null;

  const storeId = sellerInfo?.slug || sellerInfo?.id;
  const { data: kycData } = useQuery({
    queryKey: ["seller-kyc", storeId],
    queryFn: () => fetchSellerKycRequest(storeId),
    enabled: !!storeId,
  });
  const isKycVerified = kycData?.status === "approved";

  const { data: identityResponse } = useQuery({
    queryKey: ["storefront", "identity", sellerInfo?.slug],
    queryFn: () => getStorePublicIdentityBySlug(sellerInfo?.slug),
    enabled: !!sellerInfo?.slug,
  });
  
  const displayCity = toText(identityResponse?.data?.city || sellerInfo?.city || sellerInfo?.location);

  const isOnline = Boolean(sellerInfo?.isOnline) || Boolean(auth?.isAuthenticated);
  const operationalReadiness = sellerInfo?.operationalReadiness || null;
  const isOperationallyReady = operationalReadiness
    ? Boolean(operationalReadiness.isReady)
    : true;
  const description = toText(sellerInfo.shortDescription);
  const joinedLabel = formatMonthYear(sellerInfo.joinedAt);
  const productCount =
    Number.isFinite(Number(sellerInfo.productCount)) && Number(sellerInfo.productCount) >= 0
      ? Number(sellerInfo.productCount)
      : null;
  const ratingAverage = formatRating(sellerInfo.ratingAverage);
  const ratingCount = Math.max(0, Number(sellerInfo.ratingCount || 0));
  const statusLabel = toText(
    operationalReadiness?.label,
    sellerInfo?.status?.label
  );
  const statusToneValue = toText(
    operationalReadiness?.tone,
    sellerInfo?.status?.tone
  ).toLowerCase();
  const statusTone =
    statusToneValue === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300"
      : statusToneValue === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300"
        : statusToneValue === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-300"
          : "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
  const reviewLabel = `${formatMetricValue(ratingCount, "0")} review${ratingCount === 1 ? "" : "s"}`;
  const isChatEnabled = sellerInfo.chatMode === "enabled" && sellerInfo.chatHref;
  const isChatFallback =
    isOperationallyReady &&
    sellerInfo.chatMode === "contact_fallback" &&
    sellerInfo.chatHref;
  const chatButtonLabel =
    sellerInfo.chatMode === "disabled"
      ? isOperationallyReady
        ? "Chat Soon"
        : "Store Gated"
      : "Chat";
  const chatHelper =
    !isOperationallyReady
      ? toText(
          operationalReadiness?.description,
          "This store is not operational yet."
        )
      : sellerInfo.chatMode === "contact_fallback"
      ? "Use the store page to get in touch."
      : sellerInfo.chatMode === "disabled"
        ? "Chat not available yet."
        : "";
  const showOperationalMetrics = !operationalReadiness || isOperationallyReady;

  const metrics = [
    showOperationalMetrics
      ? {
          key: "rating",
          label: "Rating",
          value: ratingAverage ? `${ratingAverage} / 5` : "4.9 / 5",
          helper: ratingAverage ? reviewLabel : "99+ reviews",
        }
      : null,
    showOperationalMetrics && productCount !== null
      ? {
          key: "products",
          label: "Products",
          value: formatMetricValue(productCount),
          helper: "public",
        }
      : null,
    joinedLabel
      ? {
          key: "joined",
          label: "Joined",
          value: joinedLabel,
        }
      : null,
  ].filter(Boolean);

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-[0_6px_14px_rgba(15,23,42,0.03)] dark:border-white/10 dark:bg-[#061520] dark:shadow-none sm:px-5 sm:py-[18px]">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1.5fr)_auto] lg:items-center lg:gap-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Store Info
          </p>
          <div className="mt-2.5 flex items-start gap-3">
            <SellerLogo logoUrl={sellerInfo.logoUrl} name={sellerInfo.name} isVerified={isKycVerified} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-[22px]">
                  {sellerInfo.name}
                </h3>
                {statusLabel ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${statusTone}`}
                  >
                    <BadgeCheck className="h-2.5 w-2.5" />
                    {statusLabel}
                  </span>
                ) : null}
              </div>
              <div className="mt-1.5 space-y-1 text-[13px] text-slate-500 dark:text-slate-400">
                <p className={`flex items-center gap-1.5 font-medium ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <span className="relative flex h-2 w-2">
                    {isOnline && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'}`}></span>
                  </span>
                  {isOnline ? "Active" : `Active ${formatTimeAgo(sellerInfo.lastLogin || sellerInfo.lastActiveAt)}`}
                </p>
                {displayCity ? (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {displayCity}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:border-l lg:border-slate-200 dark:lg:border-white/10 lg:px-5">
          {metrics.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.key} className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    {metric.label}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1">
                    {metric.key === "rating" ? (
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ) : metric.key === "products" ? (
                      <Package className="h-3 w-3 text-[var(--tp-primary)] dark:text-sky-300" />
                    ) : (
                      <CalendarDays className="h-3 w-3 text-[var(--tp-primary)] dark:text-sky-300" />
                    )}
                    <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white sm:text-sm">
                      {metric.value}
                    </p>
                  </div>
                  {metric.helper ? (
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{metric.helper}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] leading-5 text-slate-500 dark:text-slate-400">
              Only verified public store metrics are shown here.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 lg:border-l lg:border-slate-200 dark:lg:border-white/10 lg:pl-5 lg:justify-self-end">
          <div className="flex flex-wrap gap-1.5">
            {isChatEnabled ? (
              <a
                href={sellerInfo.chatHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--tp-primary)] px-4 text-[13px] font-bold text-white shadow-sm transition hover:bg-[var(--tp-accent)]"
              >
                <MessageCircleMore className="mr-1.5 h-3.5 w-3.5" />
                {chatButtonLabel}
              </a>
            ) : isChatFallback ? (
              <Link
                to={sellerInfo.chatHref}
                className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-[13px] font-bold text-slate-800 transition hover:border-[var(--tp-primary)]/40 hover:text-[var(--tp-primary)] dark:border-white/15 dark:bg-white/5 dark:text-slate-100"
              >
                <MessageCircleMore className="mr-1.5 h-3.5 w-3.5" />
                {chatButtonLabel}
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-4 text-[13px] font-bold text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
              >
                <MessageCircleMore className="mr-1.5 h-3.5 w-3.5" />
                {chatButtonLabel}
              </button>
            )}

            {isOperationallyReady && sellerInfo.canVisitStore && sellerInfo.visitStoreHref ? (
              <Link
                to={sellerInfo.visitStoreHref}
                className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-[13px] font-bold text-slate-800 transition hover:border-[var(--tp-primary)]/40 hover:text-[var(--tp-primary)] dark:border-white/15 dark:bg-white/5 dark:text-slate-100"
              >
                <Store className="mr-1.5 h-3.5 w-3.5" />
                Visit Store
              </Link>
            ) : null}
          </div>

          {chatHelper ? (
            <p className="flex items-start gap-1.5 text-[11px] leading-4 text-slate-400 dark:text-slate-500">
              <MessageSquareText className="mt-0.5 h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
              <span>{chatHelper}</span>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
