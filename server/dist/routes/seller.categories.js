import { Router } from "express";
import { Op } from "sequelize";
import { z } from "zod";
import requireSellerStoreAccess from "../middleware/requireSellerStoreAccess.js";
import { Category, Product, ProductCategory } from "../models/index.js";
const router = Router();
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const toText = (value) => String(value ?? "").trim();
const parsePublishedFilter = (value) => {
    if (typeof value === "boolean")
        return value;
    const normalized = toText(value).toLowerCase();
    if (!normalized)
        return undefined;
    if (["true", "1", "yes"].includes(normalized))
        return true;
    if (["false", "0", "no"].includes(normalized))
        return false;
    return undefined;
};
const buildCategoryCode = (name, suffix = "") => {
    const slug = String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 24);
    const base = slug || "category";
    const nextSuffix = suffix
        ? suffix.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 6)
        : Math.random().toString(36).slice(2, 6);
    return `${base}-${nextSuffix}`.slice(0, 32);
};
const resolveUniqueCategoryCode = async (name) => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const code = buildCategoryCode(name, attempt === 0 ? "" : String(attempt));
        const existing = await Category.findOne({ where: { code } });
        if (!existing)
            return code;
    }
    return buildCategoryCode(name, String(Date.now()).slice(-4));
};
const createHttpError = (statusCode, message, code) => Object.assign(new Error(message), { statusCode, code });
const ensureParentExists = async (parentId) => {
    if (!parentId)
        return null;
    const parent = await Category.findByPk(parentId);
    if (!parent) {
        throw createHttpError(400, "Parent category was not found.", "SELLER_CATEGORY_PARENT_INVALID");
    }
    return parent;
};
const wouldCauseCycle = async (id, parentId) => {
    if (!parentId)
        return false;
    if (parentId === id)
        return true;
    let current = await Category.findByPk(parentId);
    while (current && current.parentId) {
        if (Number(current.parentId) === id)
            return true;
        current = await Category.findByPk(Number(current.parentId));
    }
    return false;
};
async function getCategoryProductCountMap(categoryIds, storeId) {
    const ids = Array.from(new Set(categoryIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)));
    const counts = new Map();
    ids.forEach((id) => counts.set(id, new Set()));
    if (ids.length === 0)
        return new Map();
    const storeProductIds = storeId && storeId > 0
        ? new Set((await Product.findAll({
            attributes: ["id"],
            where: { storeId },
            raw: true,
        })).map((p) => Number(p.id)))
        : null;
    const directProductWhere = {
        [Op.or]: [
            { categoryId: { [Op.in]: ids } },
            { defaultCategoryId: { [Op.in]: ids } },
        ],
    };
    if (storeId && storeId > 0) {
        directProductWhere.storeId = storeId;
    }
    const directProducts = await Product.findAll({
        attributes: ["id", "categoryId", "defaultCategoryId"],
        where: directProductWhere,
        raw: true,
    });
    directProducts.forEach((product) => {
        const productId = Number(product.id);
        [product.categoryId, product.defaultCategoryId].forEach((categoryId) => {
            const normalizedCategoryId = Number(categoryId);
            if (counts.has(normalizedCategoryId) && Number.isFinite(productId)) {
                counts.get(normalizedCategoryId).add(productId);
            }
        });
    });
    const joinRows = await ProductCategory.findAll({
        attributes: ["productId", "categoryId"],
        where: { categoryId: { [Op.in]: ids } },
        raw: true,
    });
    joinRows.forEach((row) => {
        const productId = Number(row.productId);
        const categoryId = Number(row.categoryId);
        if (counts.has(categoryId) &&
            Number.isFinite(productId) &&
            (!storeProductIds || storeProductIds.has(productId))) {
            counts.get(categoryId).add(productId);
        }
    });
    return new Map(ids.map((id) => [id, counts.get(id)?.size ?? 0]));
}
const serializeCategory = (category, productCountMap) => {
    const parent = category?.parent ?? category?.get?.("parent") ?? null;
    const image = toText(category?.icon || category?.image || "");
    const id = Number(category?.id || 0);
    const resolvedCount = productCountMap
        ? (productCountMap.get(id) ?? 0)
        : Number(category?.productsCount ?? category?.productCount ?? 0);
    return {
        id,
        code: toText(category?.code) || null,
        name: toText(category?.name) || "-",
        description: toText(category?.description) || null,
        image: image || null,
        icon: image || null,
        parentId: Number(category?.parentId ?? category?.parent_id ?? 0) || null,
        parent: parent && Number(parent?.id || 0) > 0
            ? {
                id: Number(parent.id),
                name: toText(parent.name) || "-",
                code: toText(parent.code) || null,
            }
            : null,
        isPublished: Boolean(category?.published ?? category?.isPublished),
        published: Boolean(category?.published ?? category?.isPublished),
        productCount: resolvedCount,
        productsCount: resolvedCount,
        createdAt: category?.createdAt ?? null,
        updatedAt: category?.updatedAt ?? null,
    };
};
const categoryCreateSchema = z.object({
    name: z.string().trim().min(1).max(120),
    code: z.string().trim().max(32).optional().nullable(),
    description: z.string().trim().max(255).optional().nullable(),
    parentId: z.number().int().positive().optional().nullable(),
    image: z.string().trim().max(255).optional().nullable(),
    icon: z.string().trim().max(255).optional().nullable(),
    isPublished: z.boolean().optional(),
    published: z.boolean().optional(),
});
router.get("/stores/:storeId/categories", requireSellerStoreAccess(["CATEGORY_VIEW"]), async (req, res, next) => {
    try {
        const storeId = Number(req.params.storeId || 0);
        const q = toText(req.query.q);
        const published = parsePublishedFilter(req.query.published);
        const page = Math.max(1, Number(req.query.page || 1) || 1);
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit || DEFAULT_LIMIT) || DEFAULT_LIMIT));
        const offset = (page - 1) * limit;
        const where = {};
        if (q)
            where.name = { [Op.like]: `%${q}%` };
        if (typeof published === "boolean")
            where.published = published;
        const { rows, count } = await Category.findAndCountAll({
            where,
            include: [{ model: Category, as: "parent", attributes: ["id", "name", "code"] }],
            order: [["createdAt", "DESC"]],
            limit,
            offset,
        });
        const productCountMap = await getCategoryProductCountMap(rows.map((row) => Number(row.id)), storeId);
        return res.json({
            success: true,
            data: {
                items: rows.map((row) => serializeCategory(row, productCountMap)),
                meta: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.max(1, Math.ceil(count / limit)),
                },
            },
        });
    }
    catch (error) {
        return next(error);
    }
});
router.post("/stores/:storeId/categories", requireSellerStoreAccess(["CATEGORY_MANAGE"]), async (req, res, next) => {
    try {
        const body = categoryCreateSchema.parse(req.body);
        const parentId = body.parentId ?? null;
        await ensureParentExists(parentId);
        let code = body.code ? toText(body.code).replace(/[^a-z0-9-]+/g, "").slice(0, 32) : "";
        if (!code) {
            code = await resolveUniqueCategoryCode(body.name);
        }
        else {
            const existing = await Category.findOne({ where: { code } });
            if (existing) {
                code = await resolveUniqueCategoryCode(code);
            }
        }
        const created = await Category.create({
            code,
            name: body.name,
            description: toText(body.description) || null,
            icon: toText(body.image || body.icon) || null,
            parentId,
            published: body.isPublished ?? body.published ?? true,
        });
        const detail = await Category.findByPk(created.id, {
            include: [{ model: Category, as: "parent", attributes: ["id", "name", "code"] }],
        });
        return res.status(201).json({
            success: true,
            data: serializeCategory(detail || created),
        });
    }
    catch (error) {
        return next(error);
    }
});
router.put("/stores/:storeId/categories/:categoryId", requireSellerStoreAccess(["CATEGORY_MANAGE"]), async (req, res, next) => {
    try {
        const categoryId = Number(req.params.categoryId || 0);
        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                code: "SELLER_CATEGORY_NOT_FOUND",
                message: "Category was not found.",
            });
        }
        const body = categoryCreateSchema.partial().parse(req.body);
        const patch = {};
        if (typeof body.name === "string" && toText(body.name)) {
            patch.name = toText(body.name);
        }
        if (typeof body.code === "string") {
            let code = toText(body.code).replace(/[^a-z0-9-]+/g, "").slice(0, 32);
            if (code && code !== category.code) {
                const existing = await Category.findOne({ where: { code, id: { [Op.ne]: categoryId } } });
                if (!existing) {
                    patch.code = code;
                }
            }
        }
        if (Object.prototype.hasOwnProperty.call(body, "description")) {
            patch.description = toText(body.description) || null;
        }
        if (Object.prototype.hasOwnProperty.call(body, "image")) {
            patch.icon = toText(body.image) || null;
        }
        else if (Object.prototype.hasOwnProperty.call(body, "icon")) {
            patch.icon = toText(body.icon) || null;
        }
        if (Object.prototype.hasOwnProperty.call(body, "isPublished")) {
            patch.published = Boolean(body.isPublished);
        }
        else if (Object.prototype.hasOwnProperty.call(body, "published")) {
            patch.published = Boolean(body.published);
        }
        if (Object.prototype.hasOwnProperty.call(body, "parentId")) {
            const nextParentId = body.parentId ?? null;
            await ensureParentExists(nextParentId);
            if (await wouldCauseCycle(categoryId, nextParentId)) {
                throw createHttpError(400, "Invalid parent category selection.", "SELLER_CATEGORY_PARENT_CYCLE");
            }
            patch.parentId = nextParentId;
        }
        await category.update(patch);
        const detail = await Category.findByPk(categoryId, {
            include: [{ model: Category, as: "parent", attributes: ["id", "name", "code"] }],
        });
        return res.json({
            success: true,
            data: serializeCategory(detail || category),
        });
    }
    catch (error) {
        return next(error);
    }
});
router.patch("/stores/:storeId/categories/:categoryId/publish", requireSellerStoreAccess(["CATEGORY_MANAGE"]), async (req, res, next) => {
    try {
        const categoryId = Number(req.params.categoryId || 0);
        const parsed = z
            .object({
            isPublished: z.boolean().optional(),
            published: z.boolean().optional(),
        })
            .parse(req.body);
        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                code: "SELLER_CATEGORY_NOT_FOUND",
                message: "Category was not found.",
            });
        }
        const published = typeof parsed.isPublished === "boolean"
            ? parsed.isPublished
            : Boolean(parsed.published);
        await category.update({ published });
        const detail = await Category.findByPk(categoryId, {
            include: [{ model: Category, as: "parent", attributes: ["id", "name", "code"] }],
        });
        return res.json({
            success: true,
            data: serializeCategory(detail || category),
        });
    }
    catch (error) {
        return next(error);
    }
});
export default router;
