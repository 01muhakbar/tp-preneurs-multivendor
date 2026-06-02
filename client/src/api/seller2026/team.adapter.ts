const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export function adaptSellerTeamMember(value: unknown) {
  const member = object(value);
  const user = object(member.user);
  const role = object(member.role);
  return {
    id: member?.id ?? member?.userId ?? null,
    name: text(member?.name || user.name, "Team member"),
    email: text(member?.email || user.email),
    role: text(member?.roleName || role.name || member?.roleCode),
    permissions: Array.isArray(member?.permissions) ? member.permissions : [],
    storeAccess: Array.isArray(member?.storeAccess) ? member.storeAccess : [],
    lastActiveAt: member?.lastActiveAt || null,
    status: text(member?.status, "Active"),
  };
}

export function adaptSellerInvitation(value: unknown) {
  const invitation = object(value);
  return {
    id: invitation?.id ?? null,
    email: text(invitation?.email),
    role: text(invitation?.roleName || invitation?.roleCode),
    status: text(invitation?.status, "Pending"),
    invitedAt: invitation?.createdAt || null,
    expiresAt: invitation?.expiresAt || null,
  };
}
