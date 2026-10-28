import { Store, StoreMember, StoreRole } from "../../models/index.js";
import { SELLER_ROLE_CODES, getPermissionKeysForSellerRole, hasSellerPermission, } from "./permissionMap.js";
import { ensureOwnerStoreMembership } from "./backfillOwnerMembers.js";
const storeAttributes = ["id", "ownerUserId", "name", "slug", "status", "logoUrl"];
function isMissingTableError(error) {
    const code = String(error?.original?.code || error?.parent?.code || error?.code || "");
    return code === "ER_NO_SUCH_TABLE";
}
export async function resolveSellerAccess(input) {
    const storeId = Number(input.storeId);
    const userId = Number(input.userId);
    if (!Number.isInteger(storeId) || storeId <= 0) {
        return {
            ok: false,
            status: 400,
            code: "INVALID_STORE_ID",
            message: "Invalid store id.",
        };
    }
    if (!Number.isInteger(userId) || userId <= 0) {
        return {
            ok: false,
            status: 401,
            code: "UNAUTHORIZED",
            message: "Unauthorized",
        };
    }
    const store = await Store.findByPk(storeId, {
        attributes: [...storeAttributes],
    });
    if (!store) {
        return {
            ok: false,
            status: 404,
            code: "STORE_NOT_FOUND",
            message: "Store not found.",
        };
    }
    let member = null;
    try {
        member = await StoreMember.findOne({
            where: { storeId, userId, status: "ACTIVE" },
            include: [
                {
                    model: StoreRole,
                    as: "role",
                    attributes: ["id", "code", "name", "isActive"],
                    required: false,
                },
            ],
        });
    }
    catch (error) {
        if (!isMissingTableError(error))
            throw error;
    }
    const ownerUserId = Number(store.ownerUserId);
    const isOwner = ownerUserId === userId;
    if (isOwner) {
        let ensuredMembership = member;
        if (!ensuredMembership) {
            try {
                const ensureResult = await ensureOwnerStoreMembership({
                    storeId,
                    ownerUserId,
                    applyChanges: true,
                    lazyMode: true,
                });
                if (ensureResult.action === "lazy_insert" ||
                    ensureResult.action === "lazy_normalize" ||
                    ensureResult.action === "lazy_noop") {
                    ensuredMembership = await StoreMember.findOne({
                        where: { storeId, userId, status: "ACTIVE" },
                        include: [
                            {
                                model: StoreRole,
                                as: "role",
                                attributes: ["id", "code", "name", "isActive"],
                                required: false,
                            },
                        ],
                    });
                }
            }
            catch (error) {
                console.error("[seller/access] lazy owner ensure failed", error);
            }
        }
        const roleCode = SELLER_ROLE_CODES.STORE_OWNER;
        return {
            ok: true,
            data: {
                storeId,
                store: {
                    id: Number(store.id),
                    ownerUserId,
                    name: String(store.name || ""),
                    slug: String(store.slug || ""),
                    status: String(store.status || "ACTIVE"),
                    logoUrl: String(store.logoUrl || "").trim() || null,
                    imageUrl: String(store.logoUrl || "").trim() || null,
                },
                accessMode: "OWNER_BRIDGE",
                roleCode,
                permissionKeys: getPermissionKeysForSellerRole(roleCode),
                membershipStatus: ensuredMembership ? "ACTIVE_MEMBER" : "VIRTUAL_OWNER",
                isOwner: true,
                memberId: ensuredMembership ? Number(ensuredMembership.id) : null,
                storeRoleId: ensuredMembership
                    ? Number(ensuredMembership.storeRoleId)
                    : null,
            },
        };
    }
    const memberRoleCode = String(member?.role?.code || "");
    const memberRoleIsActive = Boolean(member?.role?.isActive);
    if (member && memberRoleCode && memberRoleIsActive) {
        return {
            ok: true,
            data: {
                storeId,
                store: {
                    id: Number(store.id),
                    ownerUserId,
                    name: String(store.name || ""),
                    slug: String(store.slug || ""),
                    status: String(store.status || "ACTIVE"),
                    logoUrl: String(store.logoUrl || "").trim() || null,
                    imageUrl: String(store.logoUrl || "").trim() || null,
                },
                accessMode: "MEMBER",
                roleCode: memberRoleCode,
                permissionKeys: getPermissionKeysForSellerRole(memberRoleCode),
                membershipStatus: "ACTIVE_MEMBER",
                isOwner: false,
                memberId: Number(member.id),
                storeRoleId: Number(member.storeRoleId),
            },
        };
    }
    return {
        ok: false,
        status: 403,
        code: "SELLER_FORBIDDEN",
        message: "You do not have permission to access this seller workspace.",
    };
}
export async function resolveSellerAccessBySlug(input) {
    const storeSlug = String(input.storeSlug || "").trim();
    if (!storeSlug) {
        return {
            ok: false,
            status: 400,
            code: "INVALID_STORE_SLUG",
            message: "Invalid store slug.",
        };
    }
    const store = await Store.findOne({
        where: { slug: storeSlug },
        attributes: [...storeAttributes],
    });
    if (!store) {
        return {
            ok: false,
            status: 404,
            code: "STORE_NOT_FOUND",
            message: "Store not found.",
        };
    }
    return resolveSellerAccess({
        storeId: Number(store.id),
        userId: input.userId,
    });
}
export async function listSellerAccessContexts(input) {
    const userId = Number(input.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
        return [];
    }
    const candidateStoreIds = new Set();
    const ownerStores = await Store.findAll({
        where: { ownerUserId: userId },
        attributes: ["id"],
    });
    ownerStores.forEach((store) => {
        const storeId = Number(store?.id);
        if (Number.isInteger(storeId) && storeId > 0) {
            candidateStoreIds.add(storeId);
        }
    });
    try {
        const memberships = await StoreMember.findAll({
            where: { userId, status: "ACTIVE" },
            attributes: ["storeId"],
        });
        memberships.forEach((membership) => {
            const storeId = Number(membership?.getDataValue?.("storeId") ??
                membership?.get?.("storeId") ??
                membership?.storeId);
            if (Number.isInteger(storeId) && storeId > 0) {
                candidateStoreIds.add(storeId);
            }
        });
    }
    catch (error) {
        if (!isMissingTableError(error))
            throw error;
    }
    const resolved = await Promise.all([...candidateStoreIds].map((storeId) => resolveSellerAccess({ storeId, userId })));
    const requiredPermissions = Array.isArray(input.requiredPermissions)
        ? input.requiredPermissions.filter(Boolean)
        : [];
    return resolved
        .filter((result) => result.ok)
        .map((result) => result.data)
        .filter((access) => requiredPermissions.every((permission) => sellerHasPermission(access, permission)));
}
export function sellerHasPermission(access, requiredPermission) {
    return hasSellerPermission(access?.permissionKeys || [], requiredPermission);
}
