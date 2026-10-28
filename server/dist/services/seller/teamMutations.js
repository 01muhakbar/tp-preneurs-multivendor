import { getPermissionKeysForSellerRole, SELLER_ROLE_CODES } from "./permissionMap.js";
import { StoreMember, StoreRole, User } from "../../models/index.js";
export const SELLER_TEAM_API_STATUS = {
    ACTIVE: "ACTIVE",
    DISABLED: "DISABLED",
};
export const SELLER_TEAM_PERSISTENCE_STATUS = {
    INVITED: "INVITED",
    ACTIVE: "ACTIVE",
    DISABLED: "DISABLED",
    REMOVED: "REMOVED",
};
export const SELLER_TEAM_LEGACY_PERSISTENCE_STATUS = {
    INACTIVE: "INACTIVE",
};
export const SELLER_TEAM_STATUS_CONTRACT = {
    active: SELLER_TEAM_API_STATUS.ACTIVE,
    disabled: SELLER_TEAM_API_STATUS.DISABLED,
    persistenceDisabled: SELLER_TEAM_PERSISTENCE_STATUS.DISABLED,
    lifecycleStatuses: [
        SELLER_TEAM_PERSISTENCE_STATUS.INVITED,
        SELLER_TEAM_PERSISTENCE_STATUS.ACTIVE,
        SELLER_TEAM_PERSISTENCE_STATUS.DISABLED,
        SELLER_TEAM_PERSISTENCE_STATUS.REMOVED,
    ],
    legacyPersistenceDisabled: SELLER_TEAM_LEGACY_PERSISTENCE_STATUS.INACTIVE,
};
export const SELLER_INVITATION_EXPIRY_DAYS = (() => {
    const parsed = Number.parseInt(process.env.SELLER_INVITATION_EXPIRY_DAYS || "7", 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 7;
})();
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const OPERATIONAL_ROLE_CODES = new Set([
    SELLER_ROLE_CODES.CATALOG_MANAGER,
    SELLER_ROLE_CODES.MARKETING_MANAGER,
    SELLER_ROLE_CODES.ORDER_MANAGER,
    SELLER_ROLE_CODES.FINANCE_VIEWER,
    SELLER_ROLE_CODES.CONTENT_MANAGER,
]);
const MANAGEABLE_BY_OWNER = new Set([
    SELLER_ROLE_CODES.STORE_ADMIN,
    ...OPERATIONAL_ROLE_CODES,
]);
const MANAGEABLE_BY_ADMIN = OPERATIONAL_ROLE_CODES;
export function getAttr(row, key) {
    return row?.getDataValue?.(key) ?? row?.get?.(key) ?? row?.dataValues?.[key];
}
function parseDateLike(value) {
    if (!value)
        return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
}
export function getSellerInvitationExpiresAt(invitedAt) {
    const invitedDate = parseDateLike(invitedAt);
    if (!invitedDate)
        return null;
    return new Date(invitedDate.getTime() + SELLER_INVITATION_EXPIRY_DAYS * DAY_IN_MS);
}
export function isSellerInvitationExpired(invitedAt, now = new Date()) {
    const expiresAt = getSellerInvitationExpiresAt(invitedAt);
    return Boolean(expiresAt && expiresAt.getTime() <= now.getTime());
}
export function serializeSellerInvitationState(member) {
    const invitedAt = getAttr(member, "invitedAt") || null;
    const expiresAt = getSellerInvitationExpiresAt(invitedAt);
    const isExpired = isSellerInvitationExpired(invitedAt);
    return {
        state: isExpired ? "EXPIRED" : "PENDING",
        label: isExpired ? "Expired invitation" : "Pending invitation",
        description: isExpired
            ? "This store invitation is no longer actionable. A store owner or admin must send it again."
            : "This store invitation is waiting for the invited user to accept in the account lane.",
        invitedAt,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        isExpired,
        isActionable: !isExpired,
    };
}
export function toTeamStatus(value) {
    const normalized = String(value || "").toUpperCase();
    if (normalized === SELLER_TEAM_PERSISTENCE_STATUS.ACTIVE) {
        return SELLER_TEAM_API_STATUS.ACTIVE;
    }
    if (normalized === SELLER_TEAM_PERSISTENCE_STATUS.DISABLED ||
        normalized === SELLER_TEAM_LEGACY_PERSISTENCE_STATUS.INACTIVE) {
        return SELLER_TEAM_API_STATUS.DISABLED;
    }
    if (normalized === SELLER_TEAM_PERSISTENCE_STATUS.INVITED) {
        return SELLER_TEAM_PERSISTENCE_STATUS.INVITED;
    }
    if (normalized === SELLER_TEAM_PERSISTENCE_STATUS.REMOVED) {
        return SELLER_TEAM_PERSISTENCE_STATUS.REMOVED;
    }
    return SELLER_TEAM_API_STATUS.DISABLED;
}
export function toMemberDbStatus(value) {
    return value === SELLER_TEAM_API_STATUS.ACTIVE
        ? SELLER_TEAM_PERSISTENCE_STATUS.ACTIVE
        : SELLER_TEAM_PERSISTENCE_STATUS.DISABLED;
}
export function isActiveStoreMemberStatus(value) {
    return String(value || "").toUpperCase() === SELLER_TEAM_PERSISTENCE_STATUS.ACTIVE;
}
export function isPhase1OperationalStatus(value) {
    const normalized = toTeamStatus(value);
    return (normalized === SELLER_TEAM_API_STATUS.ACTIVE ||
        normalized === SELLER_TEAM_API_STATUS.DISABLED);
}
export function isOwnerRole(roleCode) {
    return String(roleCode || "") === SELLER_ROLE_CODES.STORE_OWNER;
}
export function isAdminRole(roleCode) {
    return String(roleCode || "") === SELLER_ROLE_CODES.STORE_ADMIN;
}
export function canManageRole(args) {
    const actorRoleCode = String(args.actorRoleCode || "");
    const targetRoleCode = String(args.targetRoleCode || "");
    if (isOwnerRole(targetRoleCode))
        return false;
    if (isOwnerRole(actorRoleCode))
        return MANAGEABLE_BY_OWNER.has(targetRoleCode);
    if (isAdminRole(actorRoleCode))
        return MANAGEABLE_BY_ADMIN.has(targetRoleCode);
    return false;
}
export function canAssignRole(args) {
    const actorRoleCode = String(args.actorRoleCode || "");
    const nextRoleCode = String(args.nextRoleCode || "");
    if (isOwnerRole(nextRoleCode))
        return false;
    if (isOwnerRole(actorRoleCode))
        return MANAGEABLE_BY_OWNER.has(nextRoleCode);
    if (isAdminRole(actorRoleCode))
        return MANAGEABLE_BY_ADMIN.has(nextRoleCode);
    return false;
}
export async function resolveStoreRoleByCode(roleCode) {
    return StoreRole.findOne({
        where: { code: roleCode, isActive: true },
        attributes: ["id", "code", "name", "description", "isActive", "isSystem"],
    });
}
export async function findUserByEmail(email) {
    return User.findOne({
        where: { email },
        attributes: ["id", "name", "email", "status", "role"],
    });
}
export async function loadStoreMemberById(storeId, memberId) {
    return StoreMember.findOne({
        where: { id: memberId, storeId },
        attributes: [
            "id",
            "storeId",
            "userId",
            "storeRoleId",
            "status",
            "invitedAt",
            "acceptedAt",
            "disabledAt",
            "removedAt",
            "createdAt",
            "updatedAt",
        ],
        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "name", "email"],
                required: false,
            },
            {
                model: StoreRole,
                as: "role",
                attributes: ["id", "code", "name", "isActive"],
                required: false,
            },
        ],
    });
}
export async function loadStoreMemberByUserId(storeId, userId) {
    return StoreMember.findOne({
        where: { storeId, userId },
        attributes: [
            "id",
            "storeId",
            "userId",
            "storeRoleId",
            "status",
            "invitedAt",
            "acceptedAt",
            "disabledAt",
            "removedAt",
            "createdAt",
            "updatedAt",
        ],
        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "name", "email"],
                required: false,
            },
            {
                model: StoreRole,
                as: "role",
                attributes: ["id", "code", "name", "isActive"],
                required: false,
            },
        ],
    });
}
export async function listStoreMembersForTeam(storeId) {
    return StoreMember.findAll({
        where: { storeId },
        attributes: [
            "id",
            "storeId",
            "userId",
            "storeRoleId",
            "status",
            "invitedAt",
            "acceptedAt",
            "disabledAt",
            "removedAt",
            "createdAt",
            "updatedAt",
        ],
        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "name", "email"],
                required: false,
            },
            {
                model: StoreRole,
                as: "role",
                attributes: ["id", "code", "name", "description", "isActive"],
                required: false,
            },
        ],
        order: [["createdAt", "ASC"]],
    });
}
export function serializeStoreMember(member) {
    const user = member?.user ?? member?.get?.("user") ?? null;
    const role = member?.role ?? member?.get?.("role") ?? null;
    const status = toTeamStatus(getAttr(member, "status"));
    const roleCode = role ? String(getAttr(role, "code") || "") : "";
    const roleName = role ? String(getAttr(role, "name") || "") : "";
    const roleDescription = role?.description ? String(getAttr(role, "description") || "") : "";
    const invitation = status === SELLER_TEAM_PERSISTENCE_STATUS.INVITED
        ? serializeSellerInvitationState(member)
        : null;
    const statusMeta = {
        code: status,
        label: status === SELLER_TEAM_API_STATUS.ACTIVE
            ? "Active"
            : status === SELLER_TEAM_API_STATUS.DISABLED
                ? "Disabled"
                : status === SELLER_TEAM_PERSISTENCE_STATUS.INVITED
                    ? "Invited"
                    : "Removed",
        description: status === SELLER_TEAM_API_STATUS.ACTIVE
            ? "This membership currently has seller workspace access."
            : status === SELLER_TEAM_API_STATUS.DISABLED
                ? "This membership stays recorded, but seller access is disabled."
                : status === SELLER_TEAM_PERSISTENCE_STATUS.INVITED
                    ? "This membership is waiting for invitation acceptance."
                    : "This membership is closed and cannot access the workspace.",
        isOperational: status === SELLER_TEAM_API_STATUS.ACTIVE || status === SELLER_TEAM_API_STATUS.DISABLED,
    };
    return {
        id: Number(getAttr(member, "id")),
        userId: Number(getAttr(member, "userId")),
        name: user ? String(getAttr(user, "name") || "") : "",
        email: user ? String(getAttr(user, "email") || "") : "",
        roleCode,
        roleName,
        role: {
            id: role ? Number(getAttr(role, "id")) : null,
            code: roleCode || null,
            name: roleName || null,
            description: roleDescription || null,
            isActive: role ? Boolean(getAttr(role, "isActive")) : null,
            permissionKeys: roleCode ? getPermissionKeysForSellerRole(roleCode) : [],
        },
        status,
        statusMeta,
        invitation,
        invitedAt: getAttr(member, "invitedAt") || null,
        acceptedAt: getAttr(member, "acceptedAt") || null,
        disabledAt: getAttr(member, "disabledAt") || null,
        removedAt: getAttr(member, "removedAt") || null,
        joinedAt: getAttr(member, "createdAt") || null,
        updatedAt: getAttr(member, "updatedAt") || null,
        lifecycle: {
            invitedAt: getAttr(member, "invitedAt") || null,
            acceptedAt: getAttr(member, "acceptedAt") || null,
            disabledAt: getAttr(member, "disabledAt") || null,
            removedAt: getAttr(member, "removedAt") || null,
        },
    };
}
export function serializeTeamMutationEnvelope(args) {
    return {
        success: true,
        message: args.message,
        data: {
            action: args.action,
            member: serializeStoreMember(args.member),
            auditLogId: args.auditLogId ?? null,
            statusContract: SELLER_TEAM_STATUS_CONTRACT,
        },
    };
}
export function buildTeamMutationError(res, status, code, message) {
    return res.status(status).json({
        success: false,
        code,
        message,
    });
}
