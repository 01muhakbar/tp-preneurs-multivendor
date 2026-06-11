export type Seller2026TeamAuditRow = {
  id: string | number;
  action: string;
  actionLabel: string;
  category: string;
  tone: string;
  actor: {
    id: string | number | null;
    name: string;
    email: string;
  };
  target: {
    memberId: string | number | null;
    name: string;
    email: string;
    roleName: string;
  };
  change: string;
  summary: string;
  result: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  recordedAt: string | null;
};

export type Seller2026TeamAuditViewModel = {
  capabilities: {
    canViewAudit: boolean;
    canInviteMembers: boolean;
  };
  currentAccess: {
    roleCode: string;
    roleName: string;
  };
  assignableRoles: Array<{
    id: string | number;
    code: string;
    name: string;
  }>;
  pendingInvitations: Array<{
    id: string | number;
    name: string;
    email: string;
    roleCode: string;
    roleName: string;
    invitedAt: string | null;
    expiresAt: string | null;
    statusLabel: string;
  }>;
  auditRows: Seller2026TeamAuditRow[];
  actionOptions: Array<{
    value: string;
    label: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    pendingInvitations: number;
    auditEvents: number;
    uniqueActors: number;
    lastActivityAt: string | null;
  };
};

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const numeric = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const idValue = (value: Record<string, unknown>) =>
  (value.id ?? value.memberId ?? value.userId ?? value.email ?? "unknown") as string | number;

const readPayload = (value: unknown) => {
  const response = object(value);
  const data = object(response.data);
  return Object.keys(data).length ? data : response;
};

const titleCase = (value: unknown) =>
  text(value, "Activity")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const snapshotSummary = (value: unknown) => {
  const snapshot = object(value);
  const entries = Object.entries(snapshot).filter(([, item]) => item !== null && item !== undefined);
  if (!entries.length) return "No snapshot";
  return entries
    .slice(0, 3)
    .map(([key, item]) => `${titleCase(key)}: ${text(item, "-")}`)
    .join(" | ");
};

export const emptySeller2026TeamAudit: Seller2026TeamAuditViewModel = {
  capabilities: {
    canViewAudit: false,
    canInviteMembers: false,
  },
  currentAccess: {
    roleCode: "",
    roleName: "No role",
  },
  assignableRoles: [],
  pendingInvitations: [],
  auditRows: [],
  actionOptions: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
  summary: {
    pendingInvitations: 0,
    auditEvents: 0,
    uniqueActors: 0,
    lastActivityAt: null,
  },
};

export function adaptSeller2026TeamAudit(
  auditValue: unknown,
  teamValue: unknown
): Seller2026TeamAuditViewModel {
  const auditPayload = readPayload(auditValue);
  const teamPayload = readPayload(teamValue);
  const currentAccess = object(teamPayload.currentAccess);
  const capabilities = object(currentAccess.capabilities);
  const accessReadModel = object(currentAccess.readModel);
  const primaryRole = object(accessReadModel.primaryRole);
  const manageableRoleCodes = new Set(
    array(capabilities.manageableRoleCodes).map((entry) => text(entry)).filter(Boolean)
  );
  const roles = array(teamPayload.roles).map((entry) => object(entry));
  const assignableRoles = roles
    .filter((role) => role.isActive !== false && manageableRoleCodes.has(text(role.code)))
    .map((role) => ({
      id: idValue(role),
      code: text(role.code),
      name: text(role.name || role.code, "Role"),
    }));
  const currentRoleCode = text(currentAccess.roleCode || primaryRole.code);
  const currentRole = roles.find((role) => text(role.code) === currentRoleCode);

  const pendingInvitations = array(teamPayload.members)
    .map((entry) => object(entry))
    .filter((member) => text(member.status).toUpperCase() === "INVITED")
    .map((member) => {
      const invitation = object(member.invitation);
      const role = object(member.role);
      return {
        id: idValue(member),
        name: text(member.name, "Invited member"),
        email: text(member.email),
        roleCode: text(member.roleCode || role.code),
        roleName: text(member.roleName || role.name || member.roleCode, "Role"),
        invitedAt: (member.invitedAt || invitation.invitedAt || null) as string | null,
        expiresAt: (invitation.expiresAt || null) as string | null,
        statusLabel: text(invitation.label, "Pending invitation"),
      };
    });

  const auditRows = array(auditPayload.items).map((entry) => {
    const item = object(entry);
    const actor = object(item.actor);
    const target = object(item.target);
    const targetUser = object(target.user);
    const targetSnapshot = object(target.snapshot);
    const readModel = object(item.readModel);
    const beforeState = Object.keys(object(item.beforeState)).length
      ? object(item.beforeState)
      : null;
    const afterState = Object.keys(object(item.afterState)).length
      ? object(item.afterState)
      : null;
    return {
      id: idValue(item),
      action: text(item.action, "TEAM_ACTIVITY"),
      actionLabel: text(readModel.title, titleCase(item.action)),
      category: text(readModel.category, "Team"),
      tone: text(readModel.tone, "stone"),
      actor: {
        id: (actor.id ?? null) as string | number | null,
        name: text(actor.name || actor.email, "System"),
        email: text(actor.email),
      },
      target: {
        memberId: (target.memberId ?? null) as string | number | null,
        name: text(targetUser.name || targetUser.email, "Store workspace"),
        email: text(targetUser.email),
        roleName: text(target.roleName || targetSnapshot.roleName),
      },
      change: text(
        readModel.changeSummary,
        `${snapshotSummary(beforeState)} -> ${snapshotSummary(afterState)}`
      ),
      summary: text(readModel.summary),
      result: afterState ? "Recorded" : "Completed",
      beforeState,
      afterState,
      recordedAt: (item.createdAt || null) as string | null,
    };
  });

  const actionOptions = array(auditPayload.actionOptions)
    .map((entry) => text(entry))
    .filter(Boolean)
    .map((action) => ({ value: action, label: titleCase(action) }));
  const paginationPayload = object(auditPayload.pagination);
  const uniqueActors = new Set(
    auditRows.map((row) => row.actor.id || row.actor.email || row.actor.name)
  ).size;
  const lastActivityAt = auditRows.reduce<string | null>((latest, row) => {
    if (!row.recordedAt) return latest;
    if (!latest) return row.recordedAt;
    return new Date(row.recordedAt).getTime() > new Date(latest).getTime()
      ? row.recordedAt
      : latest;
  }, null);

  return {
    capabilities: {
      canViewAudit: Boolean(capabilities.canViewAudit),
      canInviteMembers: Boolean(capabilities.canInviteMembers),
    },
    currentAccess: {
      roleCode: currentRoleCode,
      roleName: text(currentRole?.name || primaryRole.label || currentRoleCode, "No role"),
    },
    assignableRoles,
    pendingInvitations,
    auditRows,
    actionOptions,
    pagination: {
      page: numeric(paginationPayload.page, 1),
      limit: numeric(paginationPayload.limit, 10),
      total: numeric(paginationPayload.total, auditRows.length),
      totalPages: Math.max(1, numeric(paginationPayload.totalPages, auditRows.length ? 1 : 1)),
    },
    summary: {
      pendingInvitations: pendingInvitations.length,
      auditEvents: numeric(paginationPayload.total, auditRows.length),
      uniqueActors,
      lastActivityAt,
    },
  };
}
