export const INVITATION_TABS = [
  { key: "pending", label: "Pending", idLabel: "Menunggu" },
  { key: "accepted", label: "Accepted", idLabel: "Diterima" },
  { key: "declined", label: "Declined", idLabel: "Ditolak" },
];

const normalizeText = (value) => String(value ?? "").trim();

const firstText = (...values) => {
  for (const value of values) {
    const text = normalizeText(value);
    if (text) return text;
  }
  return "";
};

const parseTimestamp = (value) => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const normalizeMemberId = (value) => {
  const memberId = Number(value);
  return Number.isInteger(memberId) && memberId > 0 ? memberId : null;
};

const resolveStatus = (item) => {
  const state = firstText(
    item?.invitationState,
    item?.stateMeta?.code,
    item?.invitation?.state,
    item?.invitation?.status,
    item?.membershipStatus,
    item?.status
  ).toUpperCase();

  if (
    ["ACCEPTED", "ACTIVE", "ENABLED", "APPROVED"].includes(state) ||
    Boolean(item?.acceptedAt)
  ) {
    return "accepted";
  }

  if (
    ["DECLINED", "REMOVED", "REJECTED", "CANCELLED", "CANCELED"].includes(state) ||
    Boolean(item?.declinedAt || item?.removedAt)
  ) {
    return "declined";
  }

  return "pending";
};

const resolveInvitationState = (item, status) => {
  const state = firstText(
    item?.invitationState,
    item?.stateMeta?.code,
    item?.invitation?.state,
    item?.invitation?.status
  ).toUpperCase();

  if (state) return state;
  if (status === "accepted") return "ACCEPTED";
  if (status === "declined") return "DECLINED";
  return "PENDING";
};

const defaultStateMessage = (status, invitationState, isIndo = false) => {
  if (invitationState === "EXPIRED") {
    return isIndo
      ? "Undangan ini telah kedaluwarsa. Minta pemilik toko untuk mengirimkan ulang."
      : "This invitation has expired. Ask the store owner or admin to send it again.";
  }
  if (status === "accepted") {
    return isIndo
      ? "Undangan toko ini telah diterima dan akses Anda aktif."
      : "This store invitation has been accepted and access is active.";
  }
  if (status === "declined") {
    return isIndo
      ? "Undangan toko ini telah ditolak dan tidak lagi aktif."
      : "This store invitation was declined and is no longer active.";
  }
  return isIndo
    ? "Undangan toko ini menunggu tanggapan Anda."
    : "This store invitation is waiting for your response.";
};

export function unwrapInvitationCollection(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  for (const key of ["items", "invitations", "memberships"]) {
    if (Array.isArray(value[key])) return value[key];
  }

  if (value.data !== value) {
    return unwrapInvitationCollection(value.data);
  }

  return [];
}

export function formatInvitationDate(value, isIndo = false) {
  if (!value) return isIndo ? "Tidak tersedia" : "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return isIndo ? "Tidak tersedia" : "Not available";

  return new Intl.DateTimeFormat(isIndo ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function normalizeInvitation(item, isIndo = false) {
  if (!item || typeof item !== "object") return null;

  const membership =
    item.membership && typeof item.membership === "object" ? item.membership : null;
  const store =
    item.store && typeof item.store === "object"
      ? item.store
      : membership?.store && typeof membership.store === "object"
        ? membership.store
        : {};
  const inviter =
    item.invitedBy && typeof item.invitedBy === "object"
      ? item.invitedBy
      : item.inviter && typeof item.inviter === "object"
        ? item.inviter
        : {};
  const memberId = normalizeMemberId(
    item.memberId ?? item.membershipId ?? membership?.id ?? item.id
  );
  const status = resolveStatus(item);
  const invitationState = resolveInvitationState(item, status);
  const invitedAt = item.invitedAt ?? item.createdAt ?? membership?.invitedAt ?? null;
  const expiresAt =
    item.expiresAt ?? item.invitation?.expiresAt ?? membership?.expiresAt ?? null;
  const storeName = firstText(store.name, item.storeName, item.shopName, "Store");
  const storeSlug = firstText(store.slug, item.storeSlug, item.shopSlug);
  const rawRoleName = firstText(
    item.roleName,
    item.role?.name,
    membership?.roleName,
    item.roleCode,
    item.role?.code,
    "Store member"
  );
  const roleName = isIndo && rawRoleName.toLowerCase() === "store member" ? "Anggota toko" : rawRoleName;

  const inviterEmail = firstText(
    inviter.email,
    item.inviterEmail,
    item.invitedByEmail,
    inviter.name,
    isIndo ? "Administrator toko" : "Store administrator"
  );
  const message = firstText(
    item.message,
    item.stateMeta?.description,
    item.invitation?.description,
    defaultStateMessage(status, invitationState, isIndo)
  );
  const fallbackId = [storeSlug || storeName, invitedAt || invitationState]
    .filter(Boolean)
    .join(":");

  const statusLabel = isIndo
    ? invitationState === "EXPIRED"
      ? "Undangan Kedaluwarsa"
      : status === "accepted"
        ? "Diterima"
        : status === "declined"
          ? "Ditolak"
          : "Menunggu"
    : invitationState === "EXPIRED"
      ? "Expired invitation"
      : status === "accepted"
        ? "Accepted"
        : status === "declined"
          ? "Declined"
          : "Pending invitation";

  return {
    id: firstText(item.id, memberId, fallbackId),
    memberId,
    status,
    invitationState,
    statusLabel,
    storeName,
    storeSlug,
    roleName,
    inviterEmail,
    invitedAt,
    invitedAtLabel: formatInvitationDate(invitedAt, isIndo),
    expiresAt,
    expiresAtLabel: formatInvitationDate(expiresAt, isIndo),
    message,
    isActionable:
      status === "pending" &&
      invitationState !== "EXPIRED" &&
      item.isActionable !== false &&
      memberId !== null,
  };
}

export function countInvitations(items) {
  return (Array.isArray(items) ? items : []).reduce(
    (counts, item) => {
      if (item?.status && Object.hasOwn(counts, item.status)) {
        counts[item.status] += 1;
      }
      return counts;
    },
    { pending: 0, accepted: 0, declined: 0 }
  );
}

export function filterInvitations(items, status) {
  const source = Array.isArray(items) ? items : [];
  if (!status) return source;
  return source.filter((item) => item?.status === status);
}

export function sortInvitations(items, direction = "recent") {
  const multiplier = direction === "oldest" ? 1 : -1;
  return [...(Array.isArray(items) ? items : [])].sort(
    (left, right) =>
      (parseTimestamp(left?.invitedAt) - parseTimestamp(right?.invitedAt)) * multiplier
  );
}
