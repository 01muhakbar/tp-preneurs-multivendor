import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertCircle,
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

const STATUS_META = {
  pending: {
    label: "Pending",
    detail: "Needs your action",
    Icon: Store,
  },
  accepted: {
    label: "Accepted",
    detail: "Active access",
    Icon: UserRound,
  },
  declined: {
    label: "Declined",
    detail: "Not accepted",
    Icon: XCircle,
  },
};

const getMutationErrorMessage = (error, fallbackMessage) => {
  const code = String(error?.response?.data?.code || "").toUpperCase();
  const knownMessages = {
    INVITATION_EXPIRED:
      "This invitation expired. Ask the store owner or admin to send it again.",
    INVITATION_ALREADY_ACCEPTED:
      "This invitation was already accepted. Your store access may already be active.",
    INVITATION_ALREADY_DECLINED:
      "This invitation was already declined. A new invitation is required.",
    INVITATION_NOT_FOUND: "Invitation not found for this account.",
    INVALID_MEMBER_ID: "This invitation does not have a valid action reference.",
  };

  return (
    knownMessages[code] ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

const getQueryErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Store invitations could not be loaded.";

function StoreMark({ size = "large" }) {
  return (
    <span className={`si26-store-mark si26-store-mark--${size}`} aria-hidden="true">
      <Store strokeWidth={1.9} />
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

function DeclineConfirmation({ invitation, isPending, onCancel, onConfirm }) {
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
          aria-label="Close confirmation"
          title="Close"
        >
          <X size={18} />
        </button>
        <span className="si26-modal-icon" aria-hidden="true">
          <XCircle size={24} />
        </span>
        <h2 id="si26-decline-title">Decline this invitation?</h2>
        <p>
          You will not receive access to <strong>{invitation.storeName}</strong>. The store
          owner will need to send a new invitation if you change your mind.
        </p>
        <div className="si26-modal-actions">
          <button
            type="button"
            className="si26-button si26-button--secondary"
            onClick={onCancel}
            disabled={isPending}
          >
            Keep invitation
          </button>
          <button
            type="button"
            className="si26-button si26-button--decline-solid"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <LoaderCircle className="si26-spin" size={17} /> : <XCircle size={17} />}
            <span>{isPending ? "Declining..." : "Decline invitation"}</span>
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
}) {
  const isPending = invitation.status === "pending";
  const canAct = isPending && invitation.isActionable;
  const accepting = busyAction === `accept:${invitation.memberId}`;
  const declining = busyAction === `decline:${invitation.memberId}`;

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
            Role on action: <strong>{invitation.roleName}</strong>
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
            Invited by
          </dt>
          <dd>{invitation.inviterEmail}</dd>
        </div>
        <div>
          <dt>
            <CalendarDays size={15} />
            Invited at
          </dt>
          <dd>{invitation.invitedAtLabel}</dd>
        </div>
      </dl>

      <div className="si26-card-state">
        <p className="si26-card-state-title">
          <Store size={15} />
          Invitation state
        </p>
        <p>{invitation.message}</p>
        {invitation.expiresAt ? (
          <span>Expires: {invitation.expiresAtLabel}</span>
        ) : (
          <span>No expiration date provided</span>
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
              <span>{accepting ? "Accepting..." : "Accept"}</span>
            </button>
            <button
              type="button"
              className="si26-button si26-button--decline"
              onClick={() => onDecline(invitation)}
              disabled={actionsDisabled}
            >
              {declining ? <LoaderCircle className="si26-spin" size={17} /> : <XCircle size={17} />}
              <span>{declining ? "Declining..." : "Decline"}</span>
            </button>
          </>
        ) : invitation.status === "accepted" ? (
          <div className="si26-final-state si26-final-state--accepted">
            <Check size={18} />
            <span>Access active</span>
          </div>
        ) : invitation.status === "declined" ? (
          <div className="si26-final-state si26-final-state--declined">
            <X size={18} />
            <span>Invitation closed</span>
          </div>
        ) : (
          <div className="si26-action-guard">
            <AlertCircle size={18} />
            <span>
              {invitation.memberId
                ? "This invitation is no longer actionable."
                : "Action unavailable: invitation reference is missing."}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export default function AccountStoreInvitationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [sortOrder, setSortOrder] = useState("recent");
  const [feedback, setFeedback] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [declineTarget, setDeclineTarget] = useState(null);

  const invitationsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchUserStoreInvitations,
    retry: 1,
  });

  const invalidateInvitationData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["seller", "invitations"] }),
      queryClient.invalidateQueries({ queryKey: ["seller", "team"] }),
      queryClient.invalidateQueries({ queryKey: ["seller", "workspace", "stores"] }),
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
        message: result?.message || "Store invitation accepted.",
        store: result?.data?.store || null,
      });
      await invalidateInvitationData();
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: getMutationErrorMessage(error, "Failed to accept store invitation."),
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
        message: result?.message || "Store invitation declined.",
      });
      await invalidateInvitationData();
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: getMutationErrorMessage(error, "Failed to decline store invitation."),
      });
    },
    onSettled: () => setBusyAction(""),
  });

  const invitations = useMemo(
    () =>
      unwrapInvitationCollection(invitationsQuery.data)
        .map(normalizeInvitation)
        .filter(Boolean),
    [invitationsQuery.data]
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
        message: "This invitation does not have a valid action reference.",
      });
      return;
    }
    acceptMutation.mutate(invitation.memberId);
  };

  const handleDeclineRequest = (invitation) => {
    if (!invitation?.memberId || actionsDisabled) {
      setFeedback({
        type: "error",
        message: "This invitation does not have a valid action reference.",
      });
      return;
    }
    setDeclineTarget(invitation);
  };

  const handleDeclineConfirm = () => {
    if (!declineTarget?.memberId || actionsDisabled) return;
    declineMutation.mutate(declineTarget.memberId);
  };

  return (
    <section className="store-invite-2026-page" aria-labelledby="store-invitations-title">
      <header className="si26-hero">
        <div className="si26-hero-copy">
          <StoreMark />
          <div>
            <h1 id="store-invitations-title">Store Invitations</h1>
            <p>Review and manage store access invitations.</p>
          </div>
        </div>
        <div className="si26-stats" aria-label="Invitation summary">
          {INVITATION_TABS.map((tab) => {
            const meta = STATUS_META[tab.key];
            const Icon = meta.Icon;
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
            <Link to={createSellerWorkspaceRoutes(feedback.store).home()}>Open workspace</Link>
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
                {tab.label} <span>({counts[tab.key]})</span>
              </button>
            ))}
          </div>
          <label className="si26-sort">
            <span className="sr-only">Sort invitations</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
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
                <AlertCircle size={24} />
              </span>
              <h2>Invitations could not be loaded</h2>
              <p>{getQueryErrorMessage(invitationsQuery.error)}</p>
              <button
                type="button"
                className="si26-button si26-button--secondary"
                onClick={() => invitationsQuery.refetch()}
                disabled={invitationsQuery.isFetching}
              >
                <RefreshCw
                  className={invitationsQuery.isFetching ? "si26-spin" : ""}
                  size={17}
                />
                <span>{invitationsQuery.isFetching ? "Trying again..." : "Try again"}</span>
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
                />
              ))}
            </div>
          ) : null}

          {!invitationsQuery.isLoading &&
          !invitationsQuery.isError &&
          visibleInvitations.length === 0 ? (
            <div className="si26-state">
              <span className="si26-state-icon si26-state-icon--empty">
                <Inbox size={25} />
              </span>
              <h2>No {activeTab} invitations</h2>
              <p>
                {activeTab === "pending"
                  ? "You are all caught up. New store invitations will appear here."
                  : `Store invitations marked as ${activeTab} will appear here.`}
              </p>
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
      />
    </section>
  );
}
