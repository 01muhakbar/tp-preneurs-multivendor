import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Inbox,
  LoaderCircle,
  RefreshCw,
  Store,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import {
  acceptUserStoreInvitation,
  declineUserStoreInvitation,
  fetchUserStoreInvitations,
} from "../../api/userStoreInvitations.ts";
import {
  INVITATION_TABS,
  countInvitations,
  filterInvitations,
  normalizeInvitation,
  sortInvitations,
  unwrapInvitationCollection,
} from "../../utils/storeInvitationViewModel.js";
import { createSellerWorkspaceRoutes } from "../../utils/sellerWorkspaceRoute.js";
import "./AccountStoreInvitationsPage.css";

const QUERY_KEY = ["account", "store-invitations"];

const isIndonesianLanguage = (i18nInstance) => {
  if (i18nInstance?.language?.toLowerCase().startsWith("id")) return true;
  if (typeof window !== "undefined") {
    const storeLang = (localStorage.getItem("store_language") || "").toLowerCase();
    if (storeLang === "indonesia" || storeLang.startsWith("id")) return true;
    const i18nLng = (localStorage.getItem("i18nextLng") || "").toLowerCase();
    if (i18nLng.startsWith("id")) return true;
    const appLang = (localStorage.getItem("app_lang") || "").toLowerCase();
    if (appLang === "indonesia" || appLang.startsWith("id")) return true;
  }
  return false;
};

const TRANSLATIONS = {
  id: {
    heroTitle: "Undangan Toko",
    heroSubtitle: "Tinjau dan kelola undangan akses toko.",
    stats: {
      pending: { label: "Menunggu", detail: "Perlu tindakan Anda" },
      accepted: { label: "Diterima", detail: "Akses aktif" },
      declined: { label: "Ditolak", detail: "Tidak diterima" },
    },
    tabs: {
      pending: "Menunggu",
      accepted: "Diterima",
      declined: "Ditolak",
    },
    sortLabel: "Urutkan undangan",
    sortRecent: "Terbaru",
    sortOldest: "Terlama",
    card: {
      roleOnAction: "Peran saat diterima:",
      invitedBy: "Diundang oleh",
      invitedAt: "Waktu undangan",
      invitationState: "Status undangan",
      expiresPrefix: "Berlaku hingga:",
      noExpiration: "Tidak ada batas waktu",
      accept: "Terima",
      accepting: "Menerima...",
      decline: "Tolak",
      declining: "Menolak...",
      accessActive: "Akses aktif",
      invitationClosed: "Undangan ditutup",
      openWorkspace: "Buka Toko",
      notActionable: "Undangan ini sudah tidak dapat diubah.",
      missingReference: "Tindakan tidak tersedia: referensi undangan tidak ditemukan.",
    },
    empty: {
      pendingTitle: "Belum ada undangan menunggu",
      pendingDesc: "Semua undangan telah ditanggapi. Undangan baru akan muncul di sini.",
      acceptedTitle: "Belum ada undangan diterima",
      acceptedDesc: "Undangan toko yang Anda terima akan tampil di sini.",
      declinedTitle: "Belum ada undangan ditolak",
      declinedDesc: "Undangan toko yang Anda tolak akan tampil di sini.",
    },
    error: {
      loadFailed: "Gagal memuat undangan toko",
      tryAgain: "Coba Lagi",
      tryingAgain: "Mencoba lagi...",
      fallback: "Undangan toko tidak dapat dimuat.",
    },
    modal: {
      title: "Tolak undangan ini?",
      messagePrefix: "Anda tidak akan menerima akses ke",
      messageSuffix: "Pemilik toko harus mengirimkan undangan baru jika Anda berubah pikiran nanti.",
      keep: "Batal",
      decline: "Tolak Undangan",
      declining: "Menolak...",
    },
    feedback: {
      acceptSuccess: "Undangan toko berhasil diterima.",
      declineSuccess: "Undangan toko berhasil ditolak.",
      openWorkspace: "Buka Toko",
      invalidRef: "Undangan tidak memiliki referensi tindakan yang valid.",
      acceptFailed: "Gagal menerima undangan toko.",
      declineFailed: "Gagal menolak undangan toko.",
      expired: "Undangan ini telah kedaluwarsa. Minta pemilik toko untuk mengirimkan ulang.",
      alreadyAccepted: "Undangan ini sudah diterima sebelumnya. Akses toko Anda mungkin sudah aktif.",
      alreadyDeclined: "Undangan ini sudah ditolak sebelumnya. Diperlukan undangan baru.",
      notFound: "Undangan tidak ditemukan untuk akun ini.",
    },
  },
  en: {
    heroTitle: "Store Invitations",
    heroSubtitle: "Review and manage store access invitations.",
    stats: {
      pending: { label: "Pending", detail: "Needs your action" },
      accepted: { label: "Accepted", detail: "Active access" },
      declined: { label: "Declined", detail: "Not accepted" },
    },
    tabs: {
      pending: "Pending",
      accepted: "Accepted",
      declined: "Declined",
    },
    sortLabel: "Sort invitations",
    sortRecent: "Most recent",
    sortOldest: "Oldest first",
    card: {
      roleOnAction: "Role on action:",
      invitedBy: "Invited by",
      invitedAt: "Invited at",
      invitationState: "Invitation state",
      expiresPrefix: "Expires:",
      noExpiration: "No expiration date provided",
      accept: "Accept",
      accepting: "Accepting...",
      decline: "Decline",
      declining: "Declining...",
      accessActive: "Access active",
      invitationClosed: "Invitation closed",
      openWorkspace: "Open workspace",
      notActionable: "This invitation is no longer actionable.",
      missingReference: "Action unavailable: invitation reference is missing.",
    },
    empty: {
      pendingTitle: "No pending invitations",
      pendingDesc: "You are all caught up. New store invitations will appear here.",
      acceptedTitle: "No accepted invitations",
      acceptedDesc: "Store invitations marked as accepted will appear here.",
      declinedTitle: "No declined invitations",
      declinedDesc: "Store invitations marked as declined will appear here.",
    },
    error: {
      loadFailed: "Invitations could not be loaded",
      tryAgain: "Try again",
      tryingAgain: "Trying again...",
      fallback: "Store invitations could not be loaded.",
    },
    modal: {
      title: "Decline this invitation?",
      messagePrefix: "You will not receive access to",
      messageSuffix: "The store owner will need to send a new invitation if you change your mind.",
      keep: "Keep invitation",
      decline: "Decline invitation",
      declining: "Declining...",
    },
    feedback: {
      acceptSuccess: "Store invitation accepted.",
      declineSuccess: "Store invitation declined.",
      openWorkspace: "Open workspace",
      invalidRef: "This invitation does not have a valid action reference.",
      acceptFailed: "Failed to accept store invitation.",
      declineFailed: "Failed to decline store invitation.",
      expired: "This invitation expired. Ask the store owner or admin to send it again.",
      alreadyAccepted: "This invitation was already accepted. Your store access may already be active.",
      alreadyDeclined: "This invitation was already declined. A new invitation is required.",
      notFound: "Invitation not found for this account.",
    },
  },
};

const getMutationErrorMessage = (error, fallbackMessage, tFeedback) => {
  const code = String(error?.response?.data?.code || "").toUpperCase();
  const knownMessages = {
    INVITATION_EXPIRED: tFeedback.expired,
    INVITATION_ALREADY_ACCEPTED: tFeedback.alreadyAccepted,
    INVITATION_ALREADY_DECLINED: tFeedback.alreadyDeclined,
    INVITATION_NOT_FOUND: tFeedback.notFound,
    INVALID_MEMBER_ID: tFeedback.invalidRef,
  };

  return (
    knownMessages[code] ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

function StoreMark({ size = "large" }) {
  return (
    <span className={`si26-store-mark si26-store-mark--${size}`} aria-hidden="true">
      <Store strokeWidth={2.2} />
    </span>
  );
}

function InvitationSkeleton() {
  return (
    <div className="si26-card si26-card--skeleton" aria-label="Loading store invitations">
      <div className="si26-skeleton-identity">
        <span className="si26-skeleton-block si26-skeleton-block--mark" />
        <div>
          <span className="si26-skeleton-block si26-skeleton-block--title" />
          <span className="si26-skeleton-block si26-skeleton-block--pill" />
          <span className="si26-skeleton-block si26-skeleton-block--line" />
        </div>
      </div>
      <div className="si26-skeleton-column">
        <span className="si26-skeleton-block si26-skeleton-block--line" />
        <span className="si26-skeleton-block si26-skeleton-block--line-short" />
      </div>
      <div className="si26-skeleton-column">
        <span className="si26-skeleton-block si26-skeleton-block--line" />
        <span className="si26-skeleton-block si26-skeleton-block--line-wide" />
      </div>
      <div className="si26-skeleton-actions">
        <span className="si26-skeleton-block si26-skeleton-block--button" />
        <span className="si26-skeleton-block si26-skeleton-block--button" />
      </div>
    </div>
  );
}

function DeclineConfirmation({ invitation, isPending, onCancel, onConfirm, tModal }) {
  if (!invitation) return null;

  return (
    <div className="si26-modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="si26-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="si26-decline-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="si26-modal-close"
          onClick={onCancel}
          disabled={isPending}
          aria-label={tModal.keep}
          title={tModal.keep}
        >
          <X size={18} />
        </button>
        <span className="si26-modal-icon" aria-hidden="true">
          <XCircle size={26} />
        </span>
        <h2 id="si26-decline-title">{tModal.title}</h2>
        <p>
          {tModal.messagePrefix} <strong>{invitation.storeName}</strong>. {tModal.messageSuffix}
        </p>
        <div className="si26-modal-actions">
          <button
            type="button"
            className="si26-button si26-button--secondary"
            onClick={onCancel}
            disabled={isPending}
          >
            {tModal.keep}
          </button>
          <button
            type="button"
            className="si26-button si26-button--decline-solid"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <LoaderCircle className="si26-spin" size={17} /> : <XCircle size={17} />}
            <span>{isPending ? tModal.declining : tModal.decline}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function InvitationCard({
  invitation,
  busyAction,
  actionsDisabled,
  onAccept,
  onDecline,
  tCard,
}) {
  const isPending = invitation.status === "pending";
  const canAct = isPending && invitation.isActionable;
  const accepting = busyAction === `accept:${invitation.memberId}`;
  const declining = busyAction === `decline:${invitation.memberId}`;

  const storeWorkspaceRoute =
    invitation.storeSlug
      ? `/seller/stores/${encodeURIComponent(invitation.storeSlug)}`
      : null;

  return (
    <article className={`si26-card si26-card--${invitation.status}`}>
      <div className="si26-card-identity">
        <StoreMark size="card" />
        <div className="si26-card-identity-copy">
          <h3>{invitation.storeName}</h3>
          <span className={`si26-status si26-status--${invitation.status}`}>
            {invitation.invitationState === "EXPIRED" ? <Clock3 size={13} /> : null}
            {invitation.statusLabel}
          </span>
          <p>
            {tCard.roleOnAction} <strong>{invitation.roleName}</strong>
          </p>
          {invitation.storeSlug ? (
            <span className="si26-store-slug">/{invitation.storeSlug}</span>
          ) : null}
        </div>
      </div>

      <dl className="si26-card-meta">
        <div>
          <dt>
            <UserRound size={15} />
            {tCard.invitedBy}
          </dt>
          <dd>{inviterEmailDisplay(invitation.inviterEmail)}</dd>
        </div>
        <div>
          <dt>
            <CalendarDays size={15} />
            {tCard.invitedAt}
          </dt>
          <dd>{invitation.invitedAtLabel}</dd>
        </div>
      </dl>

      <div className="si26-card-state">
        <p className="si26-card-state-title">
          <Store size={15} />
          {tCard.invitationState}
        </p>
        <p>{invitation.message}</p>
        {invitation.expiresAt ? (
          <span>
            {tCard.expiresPrefix} {invitation.expiresAtLabel}
          </span>
        ) : (
          <span>{tCard.noExpiration}</span>
        )}
      </div>

      <div className="si26-card-actions">
        {canAct ? (
          <>
            <button
              type="button"
              className="si26-button si26-button--accept"
              onClick={() => onAccept(invitation)}
              disabled={actionsDisabled}
            >
              {accepting ? <LoaderCircle className="si26-spin" size={17} /> : <CheckCircle2 size={17} />}
              <span>{accepting ? tCard.accepting : tCard.accept}</span>
            </button>
            <button
              type="button"
              className="si26-button si26-button--decline"
              onClick={() => onDecline(invitation)}
              disabled={actionsDisabled}
            >
              {declining ? <LoaderCircle className="si26-spin" size={17} /> : <XCircle size={17} />}
              <span>{declining ? tCard.declining : tCard.decline}</span>
            </button>
          </>
        ) : invitation.status === "accepted" ? (
          <div className="si26-final-wrapper">
            <div className="si26-final-state si26-final-state--accepted">
              <Check size={17} />
              <span>{tCard.accessActive}</span>
            </div>
            {storeWorkspaceRoute ? (
              <Link to={storeWorkspaceRoute} className="si26-button si26-button--open-store">
                <span>{tCard.openWorkspace}</span>
                <ArrowUpRight size={15} />
              </Link>
            ) : null}
          </div>
        ) : invitation.status === "declined" ? (
          <div className="si26-final-state si26-final-state--declined">
            <X size={17} />
            <span>{tCard.invitationClosed}</span>
          </div>
        ) : (
          <div className="si26-action-guard">
            <AlertCircle size={17} />
            <span>
              {invitation.memberId ? tCard.notActionable : tCard.missingReference}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

function inviterEmailDisplay(email) {
  return email || "—";
}

export default function AccountStoreInvitationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [sortOrder, setSortOrder] = useState("recent");
  const [feedback, setFeedback] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [declineTarget, setDeclineTarget] = useState(null);

  const { i18n } = useTranslation();
  const [activeLang, setActiveLang] = useState(
    typeof window !== "undefined"
      ? (localStorage.getItem("store_language") === "Indonesia" ? "id" : i18n?.language || "en")
      : "en"
  );

  useEffect(() => {
    const handleSync = (lng) => setActiveLang(lng);
    const handleCustomLang = (e) => {
      if (e?.detail?.isoCode) setActiveLang(e.detail.isoCode);
    };
    const handleStorage = () => {
      const stored = localStorage.getItem("store_language");
      if (stored === "Indonesia") setActiveLang("id");
      else if (stored === "English") setActiveLang("en");
      else setActiveLang(i18n?.language || "en");
    };

    i18n?.on?.("languageChanged", handleSync);
    window.addEventListener("store_language_changed", handleCustomLang);
    window.addEventListener("storage", handleStorage);
    return () => {
      i18n?.off?.("languageChanged", handleSync);
      window.removeEventListener("store_language_changed", handleCustomLang);
      window.removeEventListener("storage", handleStorage);
    };
  }, [i18n]);

  const isIndo = useMemo(
    () => isIndonesianLanguage({ language: activeLang }),
    [activeLang]
  );

  const t = isIndo ? TRANSLATIONS.id : TRANSLATIONS.en;

  const invitationsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchUserStoreInvitations,
    retry: 1,
    staleTime: 15_000,
  });

  const invalidateInvitationData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["seller", "invitations"] }),
      queryClient.invalidateQueries({ queryKey: ["seller", "team"] }),
      queryClient.invalidateQueries({ queryKey: ["seller", "workspace", "stores"] }),
      queryClient.invalidateQueries({ queryKey: ["account", "notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["user", "notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["user", "me"] }),
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
    ]);
  };

  const acceptMutation = useMutation({
    mutationFn: acceptUserStoreInvitation,
    onMutate: (memberId) => {
      setFeedback(null);
      setBusyAction(`accept:${memberId}`);
    },
    onSuccess: async (result) => {
      setFeedback({
        type: "success",
        message: result?.message || t.feedback.acceptSuccess,
        store: result?.data?.store || null,
      });
      await invalidateInvitationData();
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: getMutationErrorMessage(error, t.feedback.acceptFailed, t.feedback),
      });
    },
    onSettled: () => setBusyAction(""),
  });

  const declineMutation = useMutation({
    mutationFn: declineUserStoreInvitation,
    onMutate: (memberId) => {
      setFeedback(null);
      setBusyAction(`decline:${memberId}`);
    },
    onSuccess: async (result) => {
      setDeclineTarget(null);
      setFeedback({
        type: "success",
        message: result?.message || t.feedback.declineSuccess,
      });
      await invalidateInvitationData();
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: getMutationErrorMessage(error, t.feedback.declineFailed, t.feedback),
      });
    },
    onSettled: () => setBusyAction(""),
  });

  const invitations = useMemo(
    () =>
      unwrapInvitationCollection(invitationsQuery.data)
        .map((item) => normalizeInvitation(item, isIndo))
        .filter(Boolean),
    [invitationsQuery.data, isIndo]
  );
  const counts = useMemo(() => countInvitations(invitations), [invitations]);
  const visibleInvitations = useMemo(
    () => sortInvitations(filterInvitations(invitations, activeTab), sortOrder),
    [activeTab, invitations, sortOrder]
  );
  const actionsDisabled = acceptMutation.isPending || declineMutation.isPending;

  const handleAccept = (invitation) => {
    if (!invitation?.memberId || actionsDisabled) {
      setFeedback({
        type: "error",
        message: t.feedback.invalidRef,
      });
      return;
    }
    acceptMutation.mutate(invitation.memberId);
  };

  const handleDeclineRequest = (invitation) => {
    if (!invitation?.memberId || actionsDisabled) {
      setFeedback({
        type: "error",
        message: t.feedback.invalidRef,
      });
      return;
    }
    setDeclineTarget(invitation);
  };

  const handleDeclineConfirm = () => {
    if (!declineTarget?.memberId || actionsDisabled) return;
    declineMutation.mutate(declineTarget.memberId);
  };

  const getEmptyCopy = () => {
    if (activeTab === "pending") {
      return {
        title: t.empty.pendingTitle,
        desc: t.empty.pendingDesc,
      };
    }
    if (activeTab === "accepted") {
      return {
        title: t.empty.acceptedTitle,
        desc: t.empty.acceptedDesc,
      };
    }
    return {
      title: t.empty.declinedTitle,
      desc: t.empty.declinedDesc,
    };
  };

  const emptyCopy = getEmptyCopy();

  return (
    <section className="store-invite-2026-page" aria-labelledby="store-invitations-title">
      <header className="si26-hero">
        <div className="si26-hero-copy">
          <StoreMark />
          <div>
            <h1 id="store-invitations-title">{t.heroTitle}</h1>
            <p>{t.heroSubtitle}</p>
          </div>
        </div>
        <div className="si26-stats" aria-label="Invitation summary">
          {INVITATION_TABS.map((tab) => {
            const meta = t.stats[tab.key];
            const Icon = tab.key === "pending" ? Store : tab.key === "accepted" ? UserRound : XCircle;
            return (
              <button
                type="button"
                className={`si26-stat si26-stat--${tab.key} ${
                  activeTab === tab.key ? "is-active" : ""
                }`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="si26-stat-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <span>
                  <strong>{counts[tab.key]}</strong>
                  <b>{meta.label}</b>
                  <small>{meta.detail}</small>
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {feedback ? (
        <div className={`si26-feedback si26-feedback--${feedback.type}`} role="status">
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
          {feedback.type === "success" && (feedback.store?.slug || feedback.store?.id) ? (
            <Link
              to={createSellerWorkspaceRoutes(feedback.store).home()}
              className="si26-feedback-link"
            >
              <span>{t.feedback.openWorkspace}</span>
              <ArrowUpRight size={14} />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss message"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      <section className="si26-panel">
        <div className="si26-toolbar">
          <div className="si26-tabs" role="tablist" aria-label="Invitation status">
            {INVITATION_TABS.map((tab) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={activeTab === tab.key ? "is-active" : ""}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                {t.tabs[tab.key]} <span>({counts[tab.key]})</span>
              </button>
            ))}
          </div>
          <label className="si26-sort">
            <span className="sr-only">{t.sortLabel}</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="recent">{t.sortRecent}</option>
              <option value="oldest">{t.sortOldest}</option>
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </label>
        </div>

        <div className="si26-content">
          {invitationsQuery.isLoading ? (
            <div className="si26-list">
              <InvitationSkeleton />
              <InvitationSkeleton />
            </div>
          ) : null}

          {!invitationsQuery.isLoading && invitationsQuery.isError ? (
            <div className="si26-state si26-state--error" role="alert">
              <span className="si26-state-icon">
                <AlertCircle size={26} />
              </span>
              <h2>{t.error.loadFailed}</h2>
              <p>{invitationsQuery.error?.message || t.error.fallback}</p>
              <button
                type="button"
                className="si26-button si26-button--secondary"
                onClick={() => invitationsQuery.refetch()}
                disabled={invitationsQuery.isFetching}
              >
                <RefreshCw
                  className={invitationsQuery.isFetching ? "si26-spin" : ""}
                  size={16}
                />
                <span>{invitationsQuery.isFetching ? t.error.tryingAgain : t.error.tryAgain}</span>
              </button>
            </div>
          ) : null}

          {!invitationsQuery.isLoading &&
          !invitationsQuery.isError &&
          visibleInvitations.length > 0 ? (
            <div className="si26-list">
              {visibleInvitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  busyAction={busyAction}
                  actionsDisabled={actionsDisabled}
                  onAccept={handleAccept}
                  onDecline={handleDeclineRequest}
                  tCard={t.card}
                />
              ))}
            </div>
          ) : null}

          {!invitationsQuery.isLoading &&
          !invitationsQuery.isError &&
          visibleInvitations.length === 0 ? (
            <div className="si26-state">
              <span className="si26-state-icon si26-state-icon--empty">
                <Inbox size={26} />
              </span>
              <h2>{emptyCopy.title}</h2>
              <p>{emptyCopy.desc}</p>
            </div>
          ) : null}
        </div>
      </section>

      <DeclineConfirmation
        invitation={declineTarget}
        isPending={declineMutation.isPending}
        onCancel={() => {
          if (!declineMutation.isPending) setDeclineTarget(null);
        }}
        onConfirm={handleDeclineConfirm}
        tModal={t.modal}
      />
    </section>
  );
}
