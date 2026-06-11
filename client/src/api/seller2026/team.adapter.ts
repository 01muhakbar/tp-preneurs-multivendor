export type Seller2026MemberStatus = "active" | "inactive" | "pending" | "invited" | "unknown";
export type Seller2026InvitationStatus = "pending" | "accepted" | "expired" | "cancelled" | "unknown";

export type Seller2026TeamViewModel = {
  summary: {
    totalMembers: number;
    activeMembers: number;
    pendingInvitations: number;
    disabledMembers: number;
    removedMembers: number;
    totalRoles: number;
  };
  currentAccess: {
    roleCode: string;
    roleName: string;
    membershipStatus: string;
    accessLabel: string;
    authorityLabel: string;
    authoritySummary: string;
    membershipBoundary: string;
    permissionKeys: string[];
    permissionGroups: Array<{
      key: string;
      label: string;
      granted: number;
      total: number;
      accessLabel: string;
    }>;
    capabilities: {
      canViewTeam: boolean;
      canViewLifecycle: boolean;
      canViewAudit: boolean;
      canInviteMembers: boolean;
      canAttachMembers: boolean;
      manageableRoleCodes: string[];
    };
  };
  roles: Array<{
    id: string | number;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
    permissionKeys: string[];
    permissionCount: number;
    isManageable: boolean;
  }>;
  members: Array<{
    id: string | number;
    userId: string | number | null;
    name: string;
    email: string;
    initials: string;
    avatarUrl?: string | null;
    roleCode: string;
    roleName: string;
    roleDescription: string;
    permissionSummary: string;
    joinedAt: string | null;
    invitedAt: string | null;
    acceptedAt: string | null;
    lastActiveAt: string | null;
    status: Seller2026MemberStatus;
    statusCode: string;
    statusLabel: string;
    governance: {
      canViewLifecycle: boolean;
      isSelf: boolean;
      isOwner: boolean;
      restrictionReason: string;
    };
  }>;
};

export type Seller2026MemberLifecycleViewModel = {
  member: Seller2026TeamViewModel["members"][number] | null;
  lifecycle: {
    invitedAt: string | null;
    acceptedAt: string | null;
    disabledAt: string | null;
    removedAt: string | null;
  };
  permissions: Array<{
    key: string;
    label: string;
  }>;
  history: Array<{
    id: string | number;
    action: string;
    title: string;
    summary: string;
    actorName: string;
    createdAt: string | null;
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

const permissionAliases: Record<string, string[]> = {
  STORE_PROFILE_UPDATE: ["STORE_EDIT"],
  CATALOG_PRODUCT_CREATE: ["PRODUCT_CREATE"],
  CATALOG_PRODUCT_UPDATE: ["PRODUCT_EDIT", "PRODUCT_UPDATE"],
  ORDER_READ: ["ORDER_VIEW"],
  ORDER_FULFILLMENT_UPDATE: ["ORDER_FULFILLMENT_MANAGE"],
  PAYMENT_REVIEW_READ: ["PAYMENT_STATUS_VIEW"],
  STORE_PAYMENT_PROFILE_READ: ["PAYMENT_PROFILE_VIEW"],
  TEAM_INVITE: ["STORE_MEMBERS_MANAGE"],
  TEAM_ROLE_UPDATE: ["STORE_ROLES_MANAGE", "STORE_MEMBERS_MANAGE"],
  TEAM_AUDIT_READ: ["AUDIT_LOG_VIEW"],
};

export const emptySeller2026Team: Seller2026TeamViewModel = {
  summary: {
    totalMembers: 0,
    activeMembers: 0,
    pendingInvitations: 0,
    disabledMembers: 0,
    removedMembers: 0,
    totalRoles: 0,
  },
  currentAccess: {
    roleCode: "",
    roleName: "No role",
    membershipStatus: "",
    accessLabel: "No access",
    authorityLabel: "No access",
    authoritySummary: "No team access is available for this store.",
    membershipBoundary: "",
    permissionKeys: [],
    permissionGroups: [],
    capabilities: {
      canViewTeam: false,
      canViewLifecycle: false,
      canViewAudit: false,
      canInviteMembers: false,
      canAttachMembers: false,
      manageableRoleCodes: [],
    },
  },
  roles: [],
  members: [],
};

export const emptySeller2026MemberLifecycle: Seller2026MemberLifecycleViewModel = {
  member: null,
  lifecycle: {
    invitedAt: null,
    acceptedAt: null,
    disabledAt: null,
    removedAt: null,
  },
  permissions: [],
  history: [],
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

const initials = (value: unknown) => {
  const parts = text(value, "Team member").split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const permissionLabel = (key: string) =>
  key
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const permissionGroups = [
  {
    key: "store",
    label: "Store",
    matches: (permission: string) =>
      permission.startsWith("STORE_") && !permission.startsWith("STORE_MEMBER"),
  },
  {
    key: "orders",
    label: "Orders",
    matches: (permission: string) => permission.startsWith("ORDER_"),
  },
  {
    key: "payments",
    label: "Payments",
    matches: (permission: string) =>
      permission.startsWith("PAYMENT_") || permission.includes("PAYMENT_PROFILE"),
  },
  {
    key: "team",
    label: "Team",
    matches: (permission: string) =>
      permission.startsWith("TEAM_") ||
      permission.startsWith("STORE_MEMBER") ||
      permission.startsWith("STORE_ROLE") ||
      permission === "AUDIT_LOG_VIEW",
  },
];

const buildPermissionGroups = (permissionKeys: string[], isOwner: boolean) =>
  permissionGroups.map((group) => {
    const granted = permissionKeys.filter(group.matches).length;
    return {
      key: group.key,
      label: group.label,
      granted,
      total: granted,
      accessLabel: isOwner ? "Full access" : granted ? "Manage" : "No access",
    };
  });

const adaptTeamMember = (
  entry: unknown
): Seller2026TeamViewModel["members"][number] => {
  const member = object(entry);
  const user = object(member.user);
  const role = object(member.role);
  const governance = object(member.governance);
  const statusCode = text(member.status, "UNKNOWN").toUpperCase();
  const permissionCount = readPermissionKeys(member).length;
  const name = text(member.name || user.name, "Team member");

  return {
    id: idValue(member),
    userId: (member.userId ?? user.id ?? null) as string | number | null,
    name,
    email: text(member.email || user.email),
    initials: initials(name),
    avatarUrl: (member.avatarUrl || user.avatarUrl || null) as string | null,
    roleCode: text(member.roleCode || role.code),
    roleName: text(member.roleName || role.name || member.roleCode, "Role"),
    roleDescription: text(role.description),
    permissionSummary: permissionCount ? `${permissionCount} permissions` : "No explicit permissions",
    joinedAt: (member.joinedAt || member.acceptedAt || member.createdAt || null) as string | null,
    invitedAt: (member.invitedAt || object(member.lifecycle).invitedAt || null) as string | null,
    acceptedAt: (member.acceptedAt || object(member.lifecycle).acceptedAt || null) as string | null,
    lastActiveAt: (member.lastActiveAt || member.updatedAt || member.acceptedAt || null) as string | null,
    status: normalizeMemberStatus(member.status),
    statusCode,
    statusLabel: text(object(member.statusMeta).label, permissionLabel(statusCode)),
    governance: {
      canViewLifecycle: Boolean(governance.canViewLifecycle),
      isSelf: Boolean(governance.isSelf),
      isOwner: Boolean(governance.isOwner),
      restrictionReason: text(governance.restrictionReason),
    },
  };
};

export function adaptSeller2026Team(value: unknown): Seller2026TeamViewModel {
  const payload = readPayload(value);
  const summary = object(payload.summary);
  const currentAccessPayload = object(payload.currentAccess);
  const capabilities = object(currentAccessPayload.capabilities);
  const accessReadModel = object(currentAccessPayload.readModel);
  const primaryRole = object(accessReadModel.primaryRole);
  const authority = object(accessReadModel.authority);
  const permissionKeys = array(currentAccessPayload.permissionKeys)
    .map((permission) => text(permission))
    .filter(Boolean);
  const manageableRoleCodes = array(capabilities.manageableRoleCodes)
    .map((roleCode) => text(roleCode))
    .filter(Boolean);
  const roleCode = text(currentAccessPayload.roleCode || primaryRole.code);
  const isOwner = roleCode === "STORE_OWNER";
  const rawMembers = array(payload.members);
  const roles = array(payload.roles).map((entry) => {
    const role = object(entry);
    const code = text(role.code);
    const rolePermissions = array(role.permissionKeys).map((permission) => text(permission)).filter(Boolean);
    return {
      id: idValue(role),
      code,
      name: text(role.name || role.code, "Role"),
      description: text(role.description),
      isActive: role.isActive !== false,
      permissionKeys: rolePermissions,
      permissionCount: rolePermissionCount(role),
      isManageable: manageableRoleCodes.includes(code),
    };
  });
  const members = rawMembers.map(adaptTeamMember);

  const pendingInvitations = number(summary.invitedMembers, members.filter((member) => member.status === "invited" || member.status === "pending").length);
  const currentRole = roles.find((role) => role.code === roleCode);

  return {
    summary: {
      totalMembers: number(summary.totalMembers, members.length),
      activeMembers: number(summary.activeMembers, members.filter((member) => member.status === "active").length),
      pendingInvitations,
      disabledMembers: number(summary.disabledMembers),
      removedMembers: number(summary.removedMembers),
      totalRoles: number(summary.systemRolesAvailable, roles.length),
    },
    currentAccess: {
      roleCode,
      roleName: text(primaryRole.label || currentRole?.name || roleCode, "No role"),
      membershipStatus: text(currentAccessPayload.membershipStatus),
      accessLabel:
        text(currentAccessPayload.membershipStatus).toUpperCase() === "ACTIVE"
          ? "Has access"
          : "Access restricted",
      authorityLabel: text(authority.label, isOwner ? "Store Owner" : "Team member"),
      authoritySummary: text(
        authority.description || primaryRole.summary,
        isOwner ? "Full access to all store features." : "Access follows the assigned store role."
      ),
      membershipBoundary: text(accessReadModel.membershipBoundary),
      permissionKeys,
      permissionGroups: buildPermissionGroups(permissionKeys, isOwner),
      capabilities: {
        canViewTeam: Boolean(capabilities.canViewTeam),
        canViewLifecycle: Boolean(capabilities.canViewLifecycle),
        canViewAudit: Boolean(capabilities.canViewAudit),
        canInviteMembers: Boolean(capabilities.canInviteMembers),
        canAttachMembers: Boolean(capabilities.canAttachMembers),
        manageableRoleCodes,
      },
    },
    roles,
    members,
  };
}

export function adaptSeller2026MemberLifecycle(
  value: unknown,
  fallbackMember: Seller2026TeamViewModel["members"][number] | null = null
): Seller2026MemberLifecycleViewModel {
  const payload = readPayload(value);
  const memberPayload = object(payload.member);
  const member = Object.keys(memberPayload).length
    ? adaptTeamMember(memberPayload)
    : fallbackMember;
  const lifecycle = object(payload.lifecycle);
  const role = object(memberPayload.role);
  const permissions = array(role.permissionKeys).map((entry) => {
    const key = text(entry);
    return { key, label: permissionLabel(key) };
  }).filter((entry) => entry.key);
  const historyPayload = object(payload.history);
  const history = array(historyPayload.items).map((entry) => {
    const item = object(entry);
    const readModel = object(item.readModel);
    const actor = object(item.actor);
    return {
      id: idValue(item),
      action: text(item.action, "TEAM_ACTIVITY"),
      title: text(readModel.title || item.action, "Team activity"),
      summary: text(readModel.summary || readModel.changeSummary),
      actorName: text(actor.name || actor.email, "System"),
      createdAt: (item.createdAt || null) as string | null,
    };
  });

  return {
    member,
    lifecycle: {
      invitedAt: (lifecycle.invitedAt || member?.invitedAt || null) as string | null,
      acceptedAt: (lifecycle.acceptedAt || member?.acceptedAt || null) as string | null,
      disabledAt: (lifecycle.disabledAt || null) as string | null,
      removedAt: (lifecycle.removedAt || null) as string | null,
    },
    permissions,
    history,
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
    enabled:
      permissionKeys.has(permission.key) ||
      (permissionAliases[permission.key] || []).some((alias) => permissionKeys.has(alias)),
    scope: permission.group,
  }));
  const groups = permissionCatalog.reduce<Record<string, { granted: number; total: number }>>(
    (accumulator, permission) => {
      const group = accumulator[permission.group] || { granted: 0, total: 0 };
      group.total += 1;
      if (
        permissionKeys.has(permission.key) ||
        (permissionAliases[permission.key] || []).some((alias) => permissionKeys.has(alias))
      ) {
        group.granted += 1;
      }
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
