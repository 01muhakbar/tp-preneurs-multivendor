import { sequelize, Store, StoreMember, StoreRole, User, } from "../../models/index.js";
import { SELLER_ROLE_CODES } from "./permissionMap.js";
import { ensureSystemStoreRoles } from "./storeRoles.js";
const storeAttributes = ["id", "ownerUserId", "name", "slug"];
function toNumber(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
function labelAction(base, lazyMode) {
    if (!lazyMode)
        return base;
    if (base === "insert")
        return "lazy_insert";
    if (base === "normalize")
        return "lazy_normalize";
    if (base === "noop")
        return "lazy_noop";
    return "lazy_anomaly";
}
function buildResult(input) {
    return {
        storeId: input.storeId,
        ownerUserId: input.ownerUserId,
        storeName: input.storeName,
        storeSlug: input.storeSlug,
        action: input.action,
        reasons: input.reasons || [],
        memberId: input.memberId ?? null,
        roleCode: input.roleCode ?? null,
        anomalyCode: input.anomalyCode ?? null,
    };
}
async function resolveStoreOwnerRole(transaction) {
    const role = await StoreRole.findOne({
        where: {
            code: SELLER_ROLE_CODES.STORE_OWNER,
            isActive: true,
        },
        transaction,
    });
    return role;
}
async function loadOwnerMembershipRows(storeId, ownerUserId, transaction) {
    return StoreMember.findAll({
        where: { storeId, userId: ownerUserId },
        include: [
            {
                model: StoreRole,
                as: "role",
                attributes: ["id", "code", "name", "isActive"],
                required: false,
            },
        ],
        order: [["id", "ASC"]],
        transaction,
    });
}
function summarizeStoreRow(store) {
    return {
        storeId: Number(store.id),
        ownerUserId: toNumber(store.ownerUserId),
        storeName: String(store.name || ""),
        storeSlug: String(store.slug || ""),
    };
}
async function ensureOwnerMembershipInternal(input) {
    const store = await Store.findByPk(input.storeId, {
        attributes: [...storeAttributes],
        include: [
            {
                model: User,
                as: "owner",
                attributes: ["id", "name", "email"],
                required: false,
            },
        ],
        transaction: input.transaction,
    });
    if (!store) {
        return buildResult({
            storeId: input.storeId,
            ownerUserId: toNumber(input.ownerUserId),
            storeName: "",
            storeSlug: "",
            action: labelAction("anomaly", Boolean(input.lazyMode)),
            reasons: ["Store not found during owner membership ensure."],
            anomalyCode: "INVALID_OWNER_USER_ID",
        });
    }
    const summary = summarizeStoreRow(store);
    const ownerUserId = summary.ownerUserId;
    if (!ownerUserId) {
        return buildResult({
            ...summary,
            action: labelAction("anomaly", Boolean(input.lazyMode)),
            reasons: ["Store owner id is missing or invalid."],
            anomalyCode: "INVALID_OWNER_USER_ID",
        });
    }
    const owner = store.owner ?? store.get?.("owner") ?? null;
    if (!owner) {
        return buildResult({
            ...summary,
            action: labelAction("anomaly", Boolean(input.lazyMode)),
            reasons: ["Owner user record was not found."],
            anomalyCode: "OWNER_USER_NOT_FOUND",
        });
    }
    const storeOwnerRole = await resolveStoreOwnerRole(input.transaction);
    if (!storeOwnerRole) {
        return buildResult({
            ...summary,
            action: labelAction("anomaly", Boolean(input.lazyMode)),
            reasons: ["System STORE_OWNER role is missing or inactive."],
            anomalyCode: "STORE_OWNER_ROLE_MISSING",
        });
    }
    const rows = await loadOwnerMembershipRows(summary.storeId, ownerUserId, input.transaction);
    if (rows.length > 1) {
        return buildResult({
            ...summary,
            action: labelAction("anomaly", Boolean(input.lazyMode)),
            reasons: ["Duplicate owner membership rows were found."],
            anomalyCode: "DUPLICATE_OWNER_MEMBERSHIP",
        });
    }
    if (rows.length === 0) {
        if (input.applyChanges) {
            const created = await StoreMember.create({
                storeId: summary.storeId,
                userId: ownerUserId,
                storeRoleId: Number(storeOwnerRole.id),
                status: "ACTIVE",
                acceptedAt: new Date(),
                disabledAt: null,
                disabledByUserId: null,
                removedAt: null,
                removedByUserId: null,
            }, { transaction: input.transaction });
            return buildResult({
                ...summary,
                action: labelAction("insert", Boolean(input.lazyMode)),
                reasons: ["Owner membership was created."],
                memberId: Number(created.id),
                roleCode: SELLER_ROLE_CODES.STORE_OWNER,
            });
        }
        return buildResult({
            ...summary,
            action: labelAction("insert", Boolean(input.lazyMode)),
            reasons: ["Owner membership is missing and would be created."],
            roleCode: SELLER_ROLE_CODES.STORE_OWNER,
        });
    }
    const membership = rows[0];
    const membershipRole = membership.role ?? membership.get?.("role") ?? null;
    const nextReasons = [];
    const nextPatch = {};
    if (String(membership.status || "").toUpperCase() !== "ACTIVE") {
        nextPatch.status = "ACTIVE";
        nextPatch.acceptedAt = membership.acceptedAt || new Date();
        nextPatch.disabledAt = null;
        nextPatch.disabledByUserId = null;
        nextPatch.removedAt = null;
        nextPatch.removedByUserId = null;
        nextReasons.push("Membership status will be normalized to ACTIVE.");
    }
    if (!membership.acceptedAt) {
        nextPatch.acceptedAt = membership.createdAt || new Date();
    }
    if (Number(membership.storeRoleId || 0) !== Number(storeOwnerRole.id) ||
        String(membershipRole?.code || "") !== SELLER_ROLE_CODES.STORE_OWNER) {
        nextPatch.storeRoleId = Number(storeOwnerRole.id);
        nextReasons.push("Membership role will be normalized to STORE_OWNER.");
    }
    if (Object.keys(nextPatch).length === 0) {
        return buildResult({
            ...summary,
            action: labelAction("noop", Boolean(input.lazyMode)),
            reasons: ["Owner membership already matches ACTIVE + STORE_OWNER."],
            memberId: Number(membership.id),
            roleCode: SELLER_ROLE_CODES.STORE_OWNER,
        });
    }
    if (input.applyChanges) {
        await membership.update(nextPatch, { transaction: input.transaction });
    }
    return buildResult({
        ...summary,
        action: labelAction("normalize", Boolean(input.lazyMode)),
        reasons: nextReasons,
        memberId: Number(membership.id),
        roleCode: SELLER_ROLE_CODES.STORE_OWNER,
    });
}
function summarizeResults(mode, items) {
    return {
        mode,
        totalStoresScanned: items.length,
        totalValidStores: items.filter((item) => item.anomalyCode === null).length,
        insertedCount: items.filter((item) => item.action === "insert" || item.action === "lazy_insert").length,
        normalizedCount: items.filter((item) => item.action === "normalize" || item.action === "lazy_normalize").length,
        noopCount: items.filter((item) => item.action === "noop" || item.action === "lazy_noop").length,
        anomalyCount: items.filter((item) => item.anomalyCode !== null).length,
    };
}
export async function ensureOwnerStoreMembership(input) {
    return ensureOwnerMembershipInternal({
        storeId: Number(input.storeId),
        ownerUserId: input.ownerUserId,
        applyChanges: Boolean(input.applyChanges),
        lazyMode: Boolean(input.lazyMode),
    });
}
export async function backfillOwnerStoreMembers(mode) {
    await ensureSystemStoreRoles();
    const stores = await Store.findAll({
        attributes: [...storeAttributes],
        include: [
            {
                model: User,
                as: "owner",
                attributes: ["id", "name", "email"],
                required: false,
            },
        ],
        order: [["id", "ASC"]],
    });
    const items = [];
    for (const store of stores) {
        if (mode === "apply") {
            const result = await sequelize.transaction(async (transaction) => ensureOwnerMembershipInternal({
                storeId: Number(store.id),
                ownerUserId: toNumber(store.ownerUserId),
                applyChanges: true,
                transaction,
            }));
            items.push(result);
            continue;
        }
        const result = await ensureOwnerMembershipInternal({
            storeId: Number(store.id),
            ownerUserId: toNumber(store.ownerUserId),
            applyChanges: false,
        });
        items.push(result);
    }
    return {
        summary: summarizeResults(mode, items),
        items,
        anomalies: items.filter((item) => item.anomalyCode !== null),
    };
}
