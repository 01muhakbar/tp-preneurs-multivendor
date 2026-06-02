export type Seller2026MemberStatus = "active" | "inactive" | "pending" | "invited" | "unknown";
export type Seller2026InvitationStatus = "pending" | "accepted" | "expired" | "cancelled" | "unknown";

export type Seller2026TeamViewModel = {
  summary: {
    totalMembers: number;
    activeMembers: number;
    pendingInvitations: number;
    totalRoles: number;
  };
  roles: Array<{
    id: string | number;
    name: string;
    permissionCount?: number;
  }>;
  members: Array<{
    id: string | number;
    name: string;
    email: string;
    avatarUrl?: string | null;
    roleName: string;
    permissionSummary: string;
    lastActiveAt: string | null;
    status: Seller2026MemberStatus;
  }>;
};

export type Seller2026MemberDetailViewModel = {
  member: {
    id: string | number;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string | null;
    roleName: string;
    status: Seller2026MemberStatus;
    joinedAt: string | null;
    lastActiveAt: string | null;
  } | null;
  roles: Array<{
    id: string | number;
    name: string;
  }>;
  permissions: Array<{
    key: string;
    label: string;
    description?: string;
    enabled: boolean;
    scope?: string;
  }>;
  storeAccess: Array<{
    id: string | number;
    name: string;
    enabled: boolean;
  }>;
  permissionSummary: Array<{
    group: string;
    granted: number;
    total: number;
  }>;
};

export type Seller2026TeamAuditViewModel = {
  invitations: Array<{
    id: string | number;
    name: string;
    email: string;
    roleName: string;
    invitedBy: string;
    invitedAt: string | null;
    status: Seller2026InvitationStatus;
  }>;
  auditLogs: Array<{
    id: string | number;
    time: string | null;
    memberName: string;
    action: string;
    target: string;
    details?: string;
    ipAddress?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const idValue = (value: Record<string, unknown>) =>
  (value.id ?? value.memberId ?? value.userId ?? value.email ?? "unknown") as string | number;

export function normalizeMemberStatus(status: unknown): Seller2026MemberStatus {
  const value = String(status || "").toLowerCase();

  if (value === "active" || value === "accepted") return "active";
  if (value === "inactive" || value === "disabled" || value === "removed") return "inactive";
  if (value === "pending") return "pending";
  if (value === "invited" || value === "invite") return "invited";

  return "unknown";
}

function normalizeInvitationStatus(status: unknown): Seller2026InvitationStatus {
  const value = String(status || "").toLowerCase();

  if (value.includes("accepted")) return "accepted";
  if (value.includes("expired")) return "expired";
  if (value.includes("cancel")) return "cancelled";
  if (value.includes("pending") || value.includes("invite")) return "pending";

  return "unknown";
}

const permissionCatalog = [
  {
    key: "STORE_PROFILE_UPDATE",
    label: "Update Store Profile",
    group: "Store",
    description: "Edit identity, contact, address, policies, and storefront settings.",
  },
  {
    key: "CATALOG_PRODUCT_CREATE",
    label: "Create Products",
    group: "Catalog",
    description: "Add new catalog items and prepare product drafts.",
  },
  {
    key: "CATALOG_PRODUCT_UPDATE",
    label: "Update Products",
    group: "Catalog",
    description: "Edit catalog products, inventory, pricing, variants, and media.",
  },
  {
    key: "ORDER_READ",
    label: "View Orders",
    group: "Orders",
    description: "Read store-scoped orders and fulfillment details.",
  },
  {
    key: "ORDER_FULFILLMENT_UPDATE",
    label: "Update Fulfillment",
    group: "Orders",
    description: "Pack orders, manage tracking, and update shipment states.",
  },
  {
    key: "PAYMENT_REVIEW_READ",
    label: "View Payment Review",
    group: "Payments",
    description: "Inspect pending payment proof and payment review details.",
  },
  {
    key: "STORE_PAYMENT_PROFILE_READ",
    label: "View Payment Profile",
    group: "Payments",
    description: "Read payout account, payment methods, and verification status.",
  },
  {
    key: "TEAM_INVITE",
    label: "Invite Members",
    group: "Team",
    description: "Invite store team members into this seller workspace.",
  },
  {
    key: "TEAM_ROLE_UPDATE",
    label: "Update Roles",
    group: "Team",
    description: "Change role assignment and permission scope for members.",
  },
  {
    key: "TEAM_AUDIT_READ",
    label: "View Audit Log",
    group: "Team",
    description: "Review team lifecycle, invitation, role, and access audit trail.",
  },
];

export const emptySeller2026Team: Seller2026TeamViewModel = {
  summary: {
    totalMembers: 0,
    activeMembers: 0,
    pendingInvitations: 0,
    totalRoles: 0,
  },
  roles: [],
  members: [],
};

export const emptySeller2026MemberDetail: Seller2026MemberDetailViewModel = {
  member: null,
  roles: [],
  permissions: permissionCatalog.map((permission) => ({
    key: permission.key,
    label: permission.label,
    description: permission.description,
    enabled: false,
    scope: permission.group,
  })),
  storeAccess: [],
  permissionSummary: [],
};

export const emptySeller2026TeamAudit: Seller2026TeamAuditViewModel = {
  invitations: [],
  auditLogs: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

const readPayload = (value: unknown) => {
  const response = object(value);
  const data = object(response.data);
  return Object.keys(data).length ? data : response;
};

const readPermissionKeys = (member: Record<string, unknown>) => {
  const role = object(member.role);
  return [
    ...array(member.permissionKeys),
    ...array(member.permissions),
    ...array(role.permissionKeys),
  ]
    .map((permission) => text(permission))
    .filter(Boolean);
};

const rolePermissionCount = (role: Record<string, unknown>) => array(role.permissionKeys).length;

export function adaptSeller2026Team(value: unknown): Seller2026TeamViewModel {
  const payload = readPayload(value);
  const summary = object(payload.summary);
  const rawMembers = array(payload.members);
  const roles = array(payload.roles).map((entry) => {
    const role = object(entry);
    return {
      id: idValue(role),
      name: text(role.name || role.code, "Role"),
      permissionCount: rolePermissionCount(role),
    };
  });

  const members = rawMembers.map((entry) => {
    const member = object(entry);
    const user = object(member.user);
    const role = object(member.role);
    const permissionCount = readPermissionKeys(member).length;
    return {
      id: idValue(member),
      name: text(member.name || user.name, "Team member"),
      email: text(member.email || user.email),
      avatarUrl: (member.avatarUrl || user.avatarUrl || null) as string | null,
      roleName: text(member.roleName || role.name || member.roleCode, "Role"),
      permissionSummary: permissionCount ? `${permissionCount} permissions` : "No explicit permissions",
      lastActiveAt: (member.lastActiveAt || member.updatedAt || member.acceptedAt || null) as string | null,
      status: normalizeMemberStatus(member.status),
    };
  });

  const pendingInvitations = number(summary.invitedMembers, members.filter((member) => member.status === "invited" || member.status === "pending").length);

  return {
    summary: {
      totalMembers: number(summary.totalMembers, members.length),
      activeMembers: number(summary.activeMembers, members.filter((member) => member.status === "active").length),
      pendingInvitations,
      totalRoles: number(summary.systemRolesAvailable, roles.length),
    },
    roles,
    members,
  };
}

export function adaptSeller2026MemberDetail(
  value: unknown,
  teamValue: unknown = null
): Seller2026MemberDetailViewModel {
  const payload = readPayload(value);
  const team = adaptSeller2026Team(teamValue);
  const memberPayload = object(payload.member || payload);

  if (!memberPayload.id && !memberPayload.userId && !memberPayload.email) {
    return {
      ...emptySeller2026MemberDetail,
      roles: team.roles.map((role) => ({ id: role.id, name: role.name })),
    };
  }

  const user = object(memberPayload.user);
  const role = object(memberPayload.role);
  const permissionKeys = new Set(readPermissionKeys(memberPayload));
  const permissions = permissionCatalog.map((permission) => ({
    key: permission.key,
    label: permission.label,
    description: permission.description,
    enabled: permissionKeys.has(permission.key),
    scope: permission.group,
  }));
  const groups = permissionCatalog.reduce<Record<string, { granted: number; total: number }>>(
    (accumulator, permission) => {
      const group = accumulator[permission.group] || { granted: 0, total: 0 };
      group.total += 1;
      if (permissionKeys.has(permission.key)) group.granted += 1;
      accumulator[permission.group] = group;
      return accumulator;
    },
    {}
  );
  const storeAccess = array(memberPayload.storeAccess).map((entry) => {
    const access = object(entry);
    return {
      id: idValue(access),
      name: text(access.name || access.storeName || access.slug, "Store"),
      enabled: access.enabled !== false,
    };
  });

  return {
    member: {
      id: idValue(memberPayload),
      name: text(memberPayload.name || user.name, "Team member"),
      email: text(memberPayload.email || user.email),
      phone: text(memberPayload.phone || user.phone) || undefined,
      avatarUrl: (memberPayload.avatarUrl || user.avatarUrl || null) as string | null,
      roleName: text(memberPayload.roleName || role.name || memberPayload.roleCode, "Role"),
      status: normalizeMemberStatus(memberPayload.status),
      joinedAt: (memberPayload.joinedAt || memberPayload.acceptedAt || memberPayload.createdAt || null) as string | null,
      lastActiveAt: (memberPayload.lastActiveAt || memberPayload.updatedAt || null) as string | null,
    },
    roles: team.roles.map((entry) => ({ id: entry.id, name: entry.name })),
    permissions,
    storeAccess,
    permissionSummary: Object.entries(groups).map(([group, count]) => ({
      group,
      granted: count.granted,
      total: count.total,
    })),
  };
}

export function adaptSeller2026TeamAudit(
  auditValue: unknown,
  teamValue: unknown = null
): Seller2026TeamAuditViewModel {
  const auditPayload = readPayload(auditValue);
  const teamPayload = readPayload(teamValue);
  const paginationPayload = object(auditPayload.pagination);

  const invitations = array(teamPayload.members)
    .map((entry) => object(entry))
    .filter((member) => {
      const status = normalizeMemberStatus(member.status);
      return status === "invited" || status === "pending" || Boolean(member.invitation);
    })
    .map((member) => {
      const invitation = object(member.invitation);
      const user = object(member.user);
      const invitedBy = object(invitation.invitedBy);
      return {
        id: idValue(member),
        name: text(member.name || user.name, "Invited member"),
        email: text(member.email || user.email),
        roleName: text(member.roleName || object(member.role).name || member.roleCode, "Role"),
        invitedBy: text(invitedBy.name || invitation.invitedByName, "System"),
        invitedAt: (member.invitedAt || invitation.invitedAt || invitation.createdAt || null) as string | null,
        status: normalizeInvitationStatus(invitation.status || member.status),
      };
    });

  const auditLogs = array(auditPayload.items).map((entry) => {
    const item = object(entry);
    const actor = object(item.actor);
    const target = object(item.target);
    const targetUser = object(target.user);
    const snapshot = object(target.snapshot);
    const readModel = object(item.readModel);
    return {
      id: idValue(item),
      time: (item.createdAt || null) as string | null,
      memberName: text(actor.name || actor.email, "System"),
      action: text(readModel.title || item.action, "Activity"),
      target: text(targetUser.name || targetUser.email || snapshot.roleName || target.roleName, "Store workspace"),
      details: text(readModel.summary || readModel.changeSummary || item.details),
      ipAddress: text(item.ipAddress) || undefined,
    };
  });

  return {
    invitations,
    auditLogs,
    pagination: {
      page: number(paginationPayload.page, 1),
      limit: number(paginationPayload.limit, 10),
      total: number(paginationPayload.total, auditLogs.length),
      totalPages: number(paginationPayload.totalPages, auditLogs.length ? 1 : 0),
    },
  };
}

export function adaptSellerTeamMember(value: unknown) {
  const member = object(value);
  const user = object(member.user);
  const role = object(member.role);
  return {
    id: member.id ?? member.userId ?? null,
    name: text(member.name || user.name, "Team member"),
    email: text(member.email || user.email),
    role: text(member.roleName || role.name || member.roleCode),
    permissions: Array.isArray(member.permissions) ? member.permissions : [],
    storeAccess: Array.isArray(member.storeAccess) ? member.storeAccess : [],
    lastActiveAt: member.lastActiveAt || null,
    status: text(member.status, "Active"),
  };
}

export function adaptSellerInvitation(value: unknown) {
  const invitation = object(value);
  return {
    id: invitation.id ?? null,
    email: text(invitation.email),
    role: text(invitation.roleName || invitation.roleCode),
    status: text(invitation.status, "Pending"),
    invitedAt: invitation.createdAt || null,
    expiresAt: invitation.expiresAt || null,
  };
}
