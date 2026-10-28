import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import multer from "multer";
import { Router } from "express";
import { Op } from "sequelize";
import * as models from "../models/index.js";
import { SELLER_PERMISSION_KEYS } from "../services/seller/permissionMap.js";
import { AdminPublicAuthError, approveAdminPendingStaffAccount, } from "../services/adminPublicAuth.service.js";
import { ensureSellerStoreForUser } from "../services/seller/provisionSellerStore.js";
const { User, Store, StoreApplication } = models;
const router = Router();
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "uploads/staff");
fs.mkdirSync(uploadDir, { recursive: true });
const MANAGED_ROLES = ["staff", "admin", "super_admin", "seller"];
const MANAGED_ROLE_SET = new Set(MANAGED_ROLES);
const STAFF_PASSWORD_POLICY_MESSAGE = "Password must be at least 8 characters and include at least 1 letter and 1 number.";
const SAFE_SELLER_PERMISSION_KEYS = [
    SELLER_PERMISSION_KEYS.STORE_VIEW,
    SELLER_PERMISSION_KEYS.STORE_EDIT,
    SELLER_PERMISSION_KEYS.STOREFRONT_VIEW,
    SELLER_PERMISSION_KEYS.PRODUCT_VIEW,
    SELLER_PERMISSION_KEYS.PRODUCT_CREATE,
    SELLER_PERMISSION_KEYS.PRODUCT_EDIT,
    SELLER_PERMISSION_KEYS.PRODUCT_MEDIA_MANAGE,
    SELLER_PERMISSION_KEYS.INVENTORY_VIEW,
    SELLER_PERMISSION_KEYS.INVENTORY_MANAGE,
    SELLER_PERMISSION_KEYS.ORDER_VIEW,
    SELLER_PERMISSION_KEYS.ORDER_FULFILLMENT_MANAGE,
    SELLER_PERMISSION_KEYS.PAYMENT_PROFILE_VIEW,
    SELLER_PERMISSION_KEYS.PAYMENT_STATUS_VIEW,
];
const SAFE_SELLER_PERMISSION_SET = new Set(SAFE_SELLER_PERMISSION_KEYS);
const DEFAULT_SELLER_ROLE_CODE = "CATALOG_MANAGER";
const SELLER_ROLE_PRESETS = {
    CATALOG_MANAGER: [
        SELLER_PERMISSION_KEYS.STORE_VIEW,
        SELLER_PERMISSION_KEYS.PRODUCT_VIEW,
        SELLER_PERMISSION_KEYS.PRODUCT_CREATE,
        SELLER_PERMISSION_KEYS.PRODUCT_EDIT,
        SELLER_PERMISSION_KEYS.PRODUCT_MEDIA_MANAGE,
        SELLER_PERMISSION_KEYS.INVENTORY_VIEW,
        SELLER_PERMISSION_KEYS.INVENTORY_MANAGE,
    ],
    ORDER_MANAGER: [
        SELLER_PERMISSION_KEYS.STORE_VIEW,
        SELLER_PERMISSION_KEYS.ORDER_VIEW,
        SELLER_PERMISSION_KEYS.ORDER_FULFILLMENT_MANAGE,
        SELLER_PERMISSION_KEYS.PAYMENT_STATUS_VIEW,
    ],
    FINANCE_VIEWER: [
        SELLER_PERMISSION_KEYS.STORE_VIEW,
        SELLER_PERMISSION_KEYS.ORDER_VIEW,
        SELLER_PERMISSION_KEYS.PAYMENT_PROFILE_VIEW,
        SELLER_PERMISSION_KEYS.PAYMENT_STATUS_VIEW,
    ],
    CONTENT_MANAGER: [
        SELLER_PERMISSION_KEYS.STORE_VIEW,
        SELLER_PERMISSION_KEYS.STORE_EDIT,
        SELLER_PERMISSION_KEYS.STOREFRONT_VIEW,
    ],
};
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        cb(null, safeName);
    },
});
const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const isAllowed = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
        if (isAllowed) {
            cb(null, true);
            return;
        }
        cb(new Error("Only JPG, PNG, or WEBP images are allowed."));
    },
    limits: { fileSize: 2 * 1024 * 1024 },
});
const staffImageUpload = (req, res, next) => {
    upload.single("image")(req, res, (error) => {
        if (!error)
            return next();
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                message: "Profile image is too large. Maximum size is 2 MB.",
            });
        }
        return res.status(400).json({
            success: false,
            message: error?.message || "Invalid profile image upload payload.",
        });
    });
};
function fail(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
}
function sendRouteError(res, error, fallbackMessage) {
    const status = typeof error?.status === "number" ? error.status : 500;
    if (status >= 500) {
        console.error(error);
    }
    return res.status(status).json({
        success: false,
        message: error?.message || fallbackMessage,
    });
}
function normalizeRole(input) {
    const raw = String(input ?? "").trim();
    if (!raw)
        return "staff";
    const lower = raw.toLowerCase();
    if (["super admin", "super_admin", "super-admin", "superadmin"].includes(lower)) {
        return "super_admin";
    }
    if (["admin", "administrator"].includes(lower))
        return "admin";
    if (["staff", "employee"].includes(lower))
        return "staff";
    if (["seller", "merchant"].includes(lower))
        return "seller";
    return lower.replace(/\s+/g, "_");
}
function toOptionalText(value) {
    const text = String(value ?? "").trim();
    return text ? text : null;
}
function parseBooleanField(value) {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value !== 0;
    if (typeof value !== "string")
        return undefined;
    const normalized = value.trim().toLowerCase();
    if (!normalized)
        return undefined;
    if (["true", "1", "yes", "on"].includes(normalized))
        return true;
    if (["false", "0", "no", "off"].includes(normalized))
        return false;
    return undefined;
}
function parseStringArray(value) {
    if (Array.isArray(value)) {
        return [...new Set(value.map((entry) => String(entry ?? "").trim()).filter(Boolean))];
    }
    if (typeof value === "string") {
        const text = value.trim();
        if (!text)
            return [];
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                return [...new Set(parsed.map((entry) => String(entry ?? "").trim()).filter(Boolean))];
            }
        }
        catch {
            // fall through to comma-separated parsing
        }
        return [...new Set(text.split(",").map((entry) => entry.trim()).filter(Boolean))];
    }
    return [];
}
function isCreatePasswordValid(value) {
    return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}
function isManagedRole(value) {
    return MANAGED_ROLE_SET.has(value);
}
function normalizeAvatarUrl(value) {
    const text = String(value ?? "").trim();
    if (!text)
        return null;
    if (/^https?:\/\//i.test(text))
        return text;
    if (text.startsWith("/uploads/"))
        return text;
    if (text.startsWith("uploads/"))
        return `/${text}`;
    return null;
}
function resolveSellerAccess(input) {
    if (input.role !== "seller") {
        return { sellerRoleCode: null, permissionKeys: [] };
    }
    const requestedRoleCode = toOptionalText(input.sellerRoleCode) ?? DEFAULT_SELLER_ROLE_CODE;
    if (!Object.prototype.hasOwnProperty.call(SELLER_ROLE_PRESETS, requestedRoleCode)) {
        throw fail("Invalid seller role preset.");
    }
    const requestedPermissionKeys = parseStringArray(input.permissionKeys);
    if (requestedPermissionKeys.some((permissionKey) => !SAFE_SELLER_PERMISSION_SET.has(permissionKey))) {
        throw fail("Seller permissions include admin-only access.");
    }
    const permissionKeys = requestedPermissionKeys.length > 0
        ? requestedPermissionKeys
        : [...SELLER_ROLE_PRESETS[requestedRoleCode]];
    return {
        sellerRoleCode: requestedRoleCode,
        permissionKeys: [...new Set(permissionKeys)],
    };
}
function toStaffItem(row, latestStoreApp) {
    const normalizedStatus = String(row.status ?? "").toLowerCase().trim();
    const rawStore = row.store ?? row.get?.("store") ?? null;
    const store = rawStore
        ? {
            id: Number(rawStore.id ?? rawStore.get?.("id")),
            name: String(rawStore.name ?? rawStore.get?.("name") ?? ""),
            slug: String(rawStore.slug ?? rawStore.get?.("slug") ?? ""),
            status: String(rawStore.status ?? rawStore.get?.("status") ?? "ACTIVE"),
        }
        : null;
    const rawStoreApp = latestStoreApp ?? row.storeApplication ?? null;
    const storeApplication = rawStoreApp
        ? {
            id: Number(rawStoreApp.id ?? rawStoreApp.get?.("id") ?? 0),
            status: String(rawStoreApp.status ?? rawStoreApp.get?.("status") ?? "draft"),
            currentStep: rawStoreApp.currentStep ?? rawStoreApp.get?.("currentStep") ?? null,
            submittedAt: rawStoreApp.submittedAt
                ? new Date(rawStoreApp.submittedAt).toISOString()
                : null,
        }
        : null;
    const isPublished = typeof row.isPublished === "boolean"
        ? row.isPublished
        : typeof row.is_published === "boolean"
            ? row.is_published
            : true;
    const isPendingApproval = normalizedStatus === "pending_approval";
    const isPendingVerification = normalizedStatus === "pending_verification";
    const isActive = isPendingApproval || isPendingVerification
        ? false
        : normalizedStatus === "active" && isPublished;
    const effectiveStatus = isPendingApproval
        ? "pending_approval"
        : isPendingVerification
            ? "pending_verification"
            : isActive
                ? "active"
                : "inactive";
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        phoneNumber: row.phoneNumber ?? row.phone_number ?? null,
        avatarUrl: normalizeAvatarUrl(row.avatarUrl ?? row.avatar_url),
        role: row.role === "customer" && rawStoreApp ? "seller" : row.role,
        sellerRoleCode: row.sellerRoleCode ?? row.seller_role_code ?? null,
        permissionKeys: parseStringArray(row.permissionKeys ?? row.permission_keys),
        status: effectiveStatus,
        isActive,
        isPendingApproval,
        store,
        storeApplication,
        isPublished,
        createdAt: row.created_at
            ? new Date(row.created_at).toISOString()
            : row.createdAt
                ? new Date(row.createdAt).toISOString()
                : null,
        updatedAt: row.updated_at
            ? new Date(row.updated_at).toISOString()
            : row.updatedAt
                ? new Date(row.updatedAt).toISOString()
                : null,
    };
}
async function ensureEmailAvailable(email, excludeId) {
    const where = { email };
    if (excludeId)
        where.id = { [Op.ne]: excludeId };
    const existing = await User.findOne({ where });
    if (existing) {
        throw fail("Email is already used by another account.", 409);
    }
}
async function ensurePhoneNumberAvailable(phoneNumber, excludeId) {
    const normalizedPhoneNumber = toOptionalText(phoneNumber);
    if (!normalizedPhoneNumber)
        return;
    const where = { phoneNumber: normalizedPhoneNumber };
    if (excludeId)
        where.id = { [Op.ne]: excludeId };
    const existing = await User.findOne({ where });
    if (existing) {
        throw fail("Contact number is already used by another account.", 409);
    }
}
function buildAvatarPath(file) {
    if (!file)
        return null;
    return `/uploads/staff/${file.filename}`;
}
function isSelfSuperAdminDemotion(input) {
    const actorId = Number(input.actorId);
    if (!Number.isFinite(actorId))
        return false;
    const actorRole = normalizeRole(String(input.actorRole ?? ""));
    if (actorRole !== "super_admin")
        return false;
    if (actorId !== input.targetId)
        return false;
    return input.currentRole === "super_admin" && input.nextRole !== "super_admin";
}
function isSelfManagedAccountAction(input) {
    const actorId = Number(input.actorId);
    if (!Number.isFinite(actorId))
        return false;
    const actorRole = normalizeRole(String(input.actorRole ?? ""));
    if (!MANAGED_ROLE_SET.has(actorRole))
        return false;
    return actorId === input.targetId;
}
function toWhereRole(role) {
    if (!role) {
        return { [Op.in]: MANAGED_ROLES };
    }
    if (!MANAGED_ROLE_SET.has(role)) {
        return { [Op.in]: [] };
    }
    return role;
}
// GET /api/admin/staff?page=1&limit=10&q=
router.get("/", async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page ?? 1));
        const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? req.query.pageSize ?? 10)));
        const q = String(req.query.q ?? "").trim();
        const role = req.query.role ? normalizeRole(String(req.query.role)) : null;
        const sortByRaw = String(req.query.sortBy ?? "createdAt");
        const sortBy = sortByRaw === "name" || sortByRaw === "email" || sortByRaw === "role"
            ? sortByRaw
            : "created_at";
        const sortDir = String(req.query.sort ?? "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
        let applicantUserIds = [];
        if (StoreApplication) {
            try {
                const apps = await StoreApplication.findAll({
                    attributes: ["applicantUserId"],
                    raw: true,
                });
                applicantUserIds = Array.from(new Set(apps
                    .map((a) => Number(a.applicantUserId ?? a.applicant_user_id))
                    .filter((id) => Number.isFinite(id) && id > 0)));
            }
            catch (err) {
                console.warn("[admin.staff] Failed to load applicant user ids:", err);
            }
        }
        const andConditions = [];
        if (role === "seller") {
            if (applicantUserIds.length > 0) {
                andConditions.push({
                    [Op.or]: [
                        { role: "seller" },
                        { id: { [Op.in]: applicantUserIds } },
                    ],
                });
            }
            else {
                andConditions.push({ role: "seller" });
            }
        }
        else if (role && MANAGED_ROLE_SET.has(role)) {
            andConditions.push({ role });
        }
        else if (role) {
            andConditions.push({ role: "__none__" });
        }
        else {
            if (applicantUserIds.length > 0) {
                andConditions.push({
                    [Op.or]: [
                        { role: { [Op.in]: [...MANAGED_ROLES] } },
                        { id: { [Op.in]: applicantUserIds } },
                    ],
                });
            }
            else {
                andConditions.push({ role: { [Op.in]: [...MANAGED_ROLES] } });
            }
        }
        if (q) {
            andConditions.push({
                [Op.or]: [
                    { name: { [Op.like]: `%${q}%` } },
                    { email: { [Op.like]: `%${q}%` } },
                    { phoneNumber: { [Op.like]: `%${q}%` } },
                ],
            });
        }
        const where = andConditions.length > 0 ? { [Op.and]: andConditions } : {};
        const { rows, count } = await User.findAndCountAll({
            where,
            include: [
                {
                    model: Store,
                    as: "store",
                    attributes: ["id", "name", "slug", "status"],
                    required: false,
                },
            ],
            offset: (page - 1) * limit,
            limit,
            order: [[sortBy, sortDir]],
            attributes: { exclude: ["password"] },
        });
        const userIds = rows.map((r) => r.id).filter(Boolean);
        const storeAppMap = {};
        if (StoreApplication && userIds.length > 0) {
            const storeApps = await StoreApplication.findAll({
                where: { applicantUserId: { [Op.in]: userIds } },
                attributes: [
                    "id",
                    "applicantUserId",
                    "status",
                    "currentStep",
                    "submittedAt",
                    "reviewedAt",
                    "updatedAt",
                ],
                order: [["id", "DESC"]],
            });
            for (const app of storeApps) {
                const uid = Number(app.applicantUserId ?? app.get?.("applicantUserId"));
                if (uid && !storeAppMap[uid]) {
                    storeAppMap[uid] = app;
                }
            }
        }
        return res.json({
            rows: rows.map((r) => toStaffItem(r, storeAppMap[r.id])),
            count,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(count / limit)),
        });
    }
    catch (error) {
        return sendRouteError(res, error, "Failed to load staff.");
    }
});
// GET /api/admin/staff/:id
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const user = await User.findByPk(id, {
            include: [
                {
                    model: Store,
                    as: "store",
                    attributes: ["id", "name", "slug", "status"],
                    required: false,
                },
            ],
            attributes: { exclude: ["password"] },
        });
        if (!user)
            return res.status(404).json({ success: false, message: "Staff record not found." });
        let latestApp = null;
        if (StoreApplication) {
            latestApp = await StoreApplication.findOne({
                where: { applicantUserId: id },
                attributes: [
                    "id",
                    "applicantUserId",
                    "status",
                    "currentStep",
                    "submittedAt",
                    "reviewedAt",
                    "updatedAt",
                ],
                order: [["id", "DESC"]],
            });
        }
        return res.json(toStaffItem(user, latestApp));
    }
    catch (error) {
        return sendRouteError(res, error, "Failed to load staff detail.");
    }
});
// POST /api/admin/staff
router.post("/", staffImageUpload, async (req, res) => {
    try {
        const name = toOptionalText(req.body.name);
        const email = toOptionalText(req.body.email);
        const phoneNumber = toOptionalText(req.body.phoneNumber);
        const password = toOptionalText(req.body.password);
        const isActive = parseBooleanField(req.body.isActive);
        const isPublished = parseBooleanField(req.body.isPublished);
        const role = normalizeRole(req.body.role);
        if (!name || !email || !password) {
            throw fail("Name, email, and password are required.");
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            throw fail("Please enter a valid email address.");
        }
        if (!isCreatePasswordValid(password)) {
            throw fail(STAFF_PASSWORD_POLICY_MESSAGE);
        }
        if (!isManagedRole(role)) {
            throw fail("Unsupported account role.");
        }
        await ensureEmailAvailable(email);
        await ensurePhoneNumberAvailable(phoneNumber);
        const sellerAccess = resolveSellerAccess({
            role,
            permissionKeys: req.body.permissionKeys,
            sellerRoleCode: req.body.sellerRoleCode,
        });
        const passwordHash = await bcrypt.hash(password, 10);
        const created = await User.create({
            name,
            email,
            phoneNumber,
            avatarUrl: buildAvatarPath(req.file ?? undefined),
            role,
            sellerRoleCode: sellerAccess.sellerRoleCode,
            permissionKeys: sellerAccess.permissionKeys.length
                ? JSON.stringify(sellerAccess.permissionKeys)
                : null,
            status: isActive === false ? "inactive" : "active",
            isPublished: isPublished ?? true,
            password: passwordHash,
        });
        let provisionedStore = null;
        if (role === "seller") {
            try {
                provisionedStore = await ensureSellerStoreForUser(created, {
                    storeName: toOptionalText(req.body.storeName),
                });
            }
            catch (storeError) {
                console.error("[admin.staff] Failed to provision store for new seller:", storeError);
            }
        }
        const responseItem = toStaffItem(created);
        if (provisionedStore) {
            responseItem.store = {
                id: Number(provisionedStore.id),
                name: String(provisionedStore.name),
                slug: String(provisionedStore.slug),
                status: String(provisionedStore.status || "ACTIVE"),
            };
        }
        return res.status(201).json(responseItem);
    }
    catch (error) {
        return sendRouteError(res, error, "Failed to create staff.");
    }
});
// PATCH /api/admin/staff/:id
router.patch("/:id", staffImageUpload, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const user = await User.findByPk(id);
        if (!user)
            return res.status(404).json({ success: false, message: "Staff record not found." });
        const update = {};
        const name = toOptionalText(req.body.name);
        const email = toOptionalText(req.body.email);
        const phoneNumberProvided = Object.prototype.hasOwnProperty.call(req.body, "phoneNumber");
        const roleProvided = Object.prototype.hasOwnProperty.call(req.body, "role");
        const isActive = parseBooleanField(req.body.isActive);
        const isPublished = parseBooleanField(req.body.isPublished);
        const password = toOptionalText(req.body.password);
        const currentRole = normalizeRole(String(user.role ?? "staff"));
        const actorUser = req.user;
        if (name)
            update.name = name;
        if (email) {
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                throw fail("Please enter a valid email address.");
            }
            await ensureEmailAvailable(email, id);
            update.email = email;
        }
        if (phoneNumberProvided) {
            const nextPhoneNumber = toOptionalText(req.body.phoneNumber);
            await ensurePhoneNumberAvailable(nextPhoneNumber, id);
            update.phoneNumber = nextPhoneNumber;
        }
        if (password) {
            if (!isCreatePasswordValid(password)) {
                throw fail(STAFF_PASSWORD_POLICY_MESSAGE);
            }
            update.password = await bcrypt.hash(password, 10);
        }
        if (typeof isActive === "boolean") {
            if (isSelfManagedAccountAction({
                actorId: actorUser?.id,
                actorRole: actorUser?.role,
                targetId: id,
            }) &&
                !isActive) {
                throw fail("You cannot deactivate your own account from this account management flow.", 409);
            }
            if (currentRole === "staff" && String(user.status ?? "").toLowerCase().trim() === "pending_approval") {
                throw fail("Use the approve action to activate this staff account.", 409);
            }
            update.status = isActive ? "active" : "inactive";
            if (typeof isPublished !== "boolean") {
                update.isPublished = isActive;
            }
        }
        if (typeof isPublished === "boolean") {
            update.isPublished = isPublished;
            if (typeof isActive !== "boolean") {
                if (isSelfManagedAccountAction({
                    actorId: actorUser?.id,
                    actorRole: actorUser?.role,
                    targetId: id,
                }) &&
                    !isPublished) {
                    throw fail("You cannot deactivate your own account from this account management flow.", 409);
                }
                if (currentRole === "staff" && String(user.status ?? "").toLowerCase().trim() === "pending_approval") {
                    throw fail("Use the approve action to activate this staff account.", 409);
                }
                update.status = isPublished ? "active" : "inactive";
            }
        }
        if (req.file) {
            update.avatarUrl = buildAvatarPath(req.file);
        }
        const normalizedRole = roleProvided ? normalizeRole(req.body.role) : currentRole;
        if (!isManagedRole(normalizedRole)) {
            throw fail("Unsupported account role.");
        }
        if (roleProvided &&
            isSelfSuperAdminDemotion({
                actorId: actorUser?.id,
                actorRole: actorUser?.role,
                targetId: id,
                currentRole,
                nextRole: normalizedRole,
            })) {
            throw fail("You cannot lower your own role from Super Admin in this account management flow.", 409);
        }
        if (roleProvided) {
            update.role = normalizedRole;
        }
        if (roleProvided ||
            Object.prototype.hasOwnProperty.call(req.body, "permissionKeys") ||
            Object.prototype.hasOwnProperty.call(req.body, "sellerRoleCode")) {
            const sellerAccess = resolveSellerAccess({
                role: normalizedRole,
                permissionKeys: req.body.permissionKeys,
                sellerRoleCode: req.body.sellerRoleCode,
            });
            update.sellerRoleCode = sellerAccess.sellerRoleCode;
            update.permissionKeys = sellerAccess.permissionKeys.length
                ? JSON.stringify(sellerAccess.permissionKeys)
                : null;
        }
        else if (normalizedRole !== "seller") {
            update.sellerRoleCode = null;
            update.permissionKeys = null;
        }
        await user.update(update);
        if (normalizedRole === "seller") {
            try {
                await ensureSellerStoreForUser(user);
            }
            catch (storeError) {
                console.error("[admin.staff] Failed to ensure store for seller on patch:", storeError);
            }
        }
        await user.reload({
            include: [
                {
                    model: Store,
                    as: "store",
                    attributes: ["id", "name", "slug", "status"],
                    required: false,
                },
            ],
        });
        return res.json(toStaffItem(user));
    }
    catch (error) {
        return sendRouteError(res, error, "Failed to update staff.");
    }
});
// POST /api/admin/staff/:id/approve
router.post("/:id/approve", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const result = await approveAdminPendingStaffAccount({
            userId: id,
            actorName: String(req.user?.name || "").trim() || null,
        });
        return res.json({
            success: true,
            message: result.message,
            data: {
                approvalEmailSent: result.approvalEmailSent,
                user: result.user,
            },
        });
    }
    catch (error) {
        if (error instanceof AdminPublicAuthError) {
            return res.status(error.status).json({
                success: false,
                code: error.code,
                message: error.message,
            });
        }
        return sendRouteError(res, error, "Failed to approve staff account.");
    }
});
// DELETE /api/admin/staff/:id
router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const user = await User.findByPk(id);
        if (!user)
            return res.status(404).json({ success: false, message: "Staff record not found." });
        const actorUser = req.user;
        if (isSelfManagedAccountAction({
            actorId: actorUser?.id,
            actorRole: actorUser?.role,
            targetId: id,
        })) {
            throw fail("You cannot delete your own account from this account management flow.", 409);
        }
        await user.destroy();
        return res.json({ success: true });
    }
    catch (error) {
        return sendRouteError(res, error, "Failed to delete staff.");
    }
});
export default router;
