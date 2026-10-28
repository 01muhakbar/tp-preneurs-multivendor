import { User, Store } from "../../models/index.js";
import { ensureSystemStoreRoles } from "./storeRoles.js";
import { ensureOwnerStoreMembership } from "./backfillOwnerMembers.js";
export function buildDefaultStoreName(user, ownerUserId) {
    const name = String(user?.getDataValue?.("name") ?? user?.name ?? "").trim();
    if (name)
        return name;
    const email = String(user?.getDataValue?.("email") ?? user?.email ?? "").trim();
    if (email) {
        const localPart = email.split("@")[0].replace(/[._-]+/g, " ").trim();
        if (localPart) {
            return localPart
                .split(" ")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
        }
    }
    return `Store ${ownerUserId}`;
}
export function slugifyStore(name) {
    return String(name || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}
export async function findUniqueStoreSlug(baseName, ownerUserId, transaction) {
    const baseSlug = slugifyStore(baseName) || `store-${ownerUserId}`;
    let candidate = baseSlug;
    const existingWithBase = await Store.findOne({
        where: { slug: candidate },
        attributes: ["id", "ownerUserId"],
        transaction,
    });
    if (!existingWithBase || Number(existingWithBase.ownerUserId) === ownerUserId) {
        return candidate;
    }
    candidate = `${baseSlug}-${ownerUserId}`;
    const existingWithOwner = await Store.findOne({
        where: { slug: candidate },
        attributes: ["id", "ownerUserId"],
        transaction,
    });
    if (!existingWithOwner || Number(existingWithOwner.ownerUserId) === ownerUserId) {
        return candidate;
    }
    let counter = 1;
    while (counter < 100) {
        const nextCandidate = `${candidate}-${counter}`;
        const found = await Store.findOne({
            where: { slug: nextCandidate },
            attributes: ["id"],
            transaction,
        });
        if (!found)
            return nextCandidate;
        counter++;
    }
    return `${candidate}-${Date.now().toString(36)}`;
}
export async function ensureSellerStoreForUser(userOrUserId, options) {
    const userId = typeof userOrUserId === "number"
        ? userOrUserId
        : Number(userOrUserId?.id ?? userOrUserId?.getDataValue?.("id"));
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error("Invalid userId provided to ensureSellerStoreForUser.");
    }
    const transaction = options?.transaction;
    // 1. Check if user already owns an active store
    let store = await Store.findOne({
        where: { ownerUserId: userId },
        transaction,
    });
    const user = typeof userOrUserId === "object" && (userOrUserId?.email || userOrUserId?.name)
        ? userOrUserId
        : await User.findByPk(userId, { transaction });
    if (!store) {
        const rawStoreName = String(options?.storeName || "").trim();
        const finalStoreName = rawStoreName || buildDefaultStoreName(user, userId);
        const slug = await findUniqueStoreSlug(finalStoreName, userId, transaction);
        const email = user?.getDataValue?.("email") ?? user?.email ?? null;
        const phone = user?.getDataValue?.("phoneNumber") ??
            user?.phoneNumber ??
            user?.phone ??
            null;
        store = await Store.create({
            ownerUserId: userId,
            name: finalStoreName,
            slug,
            status: "ACTIVE",
            email,
            phone,
        }, { transaction });
    }
    // 2. Ensure system store roles exist
    await ensureSystemStoreRoles().catch(() => null);
    // 3. Ensure Owner Store Membership in store_members
    await ensureOwnerStoreMembership({
        storeId: Number(store.id),
        ownerUserId: userId,
        applyChanges: true,
        lazyMode: true,
    });
    return store;
}
