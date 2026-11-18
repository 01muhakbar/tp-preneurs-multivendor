import { Router } from "express";
import { Op } from "sequelize";
import { z } from "zod";
import requireSellerStoreAccess from "../middleware/requireSellerStoreAccess.js";
import { Store, StoreShowcase, StoreShowcaseProduct, Product } from "../models/index.js";

const router = Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const toText = (value: unknown) => String(value ?? "").trim();

const buildSlug = (name: string, suffix = "") => {
  const base = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 50);
  const root = base || "showcase";
  const nextSuffix = suffix
    ? suffix.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 6)
    : Math.random().toString(36).slice(2, 6);
  return `${root}-${nextSuffix}`.slice(0, 140);
};

const resolveUniqueSlug = async (storeId: number, name: string) => {
  const baseSlug = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60) || "showcase";

  const directMatch = await StoreShowcase.findOne({
    where: { storeId, slug: baseSlug },
  });
  if (!directMatch) return baseSlug;

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const slug = buildSlug(name, String(attempt));
    const existing = await StoreShowcase.findOne({ where: { storeId, slug } });
    if (!existing) return slug;
  }
  return buildSlug(name, String(Date.now()).slice(-4));
};

const showcaseInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().max(140).optional().nullable(),
  description: z.string().trim().max(255).optional().nullable(),
  icon: z.string().trim().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  productIds: z.array(z.number().int().positive()).optional(),
});

// GET /api/seller/stores/:storeId/showcases
router.get(
  "/stores/:storeId/showcases",
  requireSellerStoreAccess(["CATEGORY_VIEW"]),
  async (req, res, next) => {
    try {
      const storeId = Number(req.params.storeId || 0);
      const q = toText(req.query.q);
      const activeParam = req.query.isActive ?? req.query.active;
      const page = Math.max(1, Number(req.query.page || 1) || 1);
      const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit || DEFAULT_LIMIT) || DEFAULT_LIMIT));
      const offset = (page - 1) * limit;

      const where: Record<string, any> = { storeId };
      if (q) where.name = { [Op.like]: `%${q}%` };
      if (activeParam === "true" || activeParam === "1") where.isActive = true;
      if (activeParam === "false" || activeParam === "0") where.isActive = false;

      const { rows, count } = await StoreShowcase.findAndCountAll({
        where,
        include: [
          {
            model: Product,
            as: "products",
            attributes: ["id", "name", "price", "stock", "images", "slug"],
            through: { attributes: ["sortOrder"] },
          },
        ],
        order: [
          ["sortOrder", "ASC"],
          ["createdAt", "DESC"],
        ],
        limit,
        offset,
        distinct: true,
      });

      const items = rows.map((row: any) => {
        const products = Array.isArray(row.products) ? row.products : [];
        return {
          id: row.id,
          storeId: row.storeId,
          name: row.name,
          slug: row.slug,
          description: row.description || null,
          icon: row.icon || null,
          sortOrder: row.sortOrder,
          isActive: Boolean(row.isActive),
          productCount: products.length,
          productsCount: products.length,
          productIds: products.map((p: any) => Number(p.id)),
          products,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      });

      return res.json({
        success: true,
        data: {
          items,
          meta: {
            page,
            limit,
            total: count,
            totalPages: Math.max(1, Math.ceil(count / limit)),
          },
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// POST /api/seller/stores/:storeId/showcases
router.post(
  "/stores/:storeId/showcases",
  requireSellerStoreAccess(["CATEGORY_MANAGE"]),
  async (req, res, next) => {
    try {
      const storeId = Number(req.params.storeId || 0);
      const body = showcaseInputSchema.parse(req.body);

      const name = toText(body.name);
      const slug = body.slug ? toText(body.slug).toLowerCase() : await resolveUniqueSlug(storeId, name);
      const description = toText(body.description) || null;
      const icon = toText(body.icon) || null;
      const isActive = body.isActive !== false;
      const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;

      const showcase = await StoreShowcase.create({
        storeId,
        name,
        slug,
        description,
        icon,
        isActive,
        sortOrder,
      });

      // Synchronize product assignments if provided
      if (Array.isArray(body.productIds) && body.productIds.length > 0) {
        // Validate products belong to this store
        const validProducts = await Product.findAll({
          attributes: ["id"],
          where: {
            id: { [Op.in]: body.productIds },
            storeId,
          },
          raw: true,
        });
        const validProductIds = validProducts.map((p: any) => Number(p.id));

        const pivotRows = validProductIds.map((productId, idx) => ({
          showcaseId: showcase.id,
          productId,
          sortOrder: idx,
        }));

        if (pivotRows.length > 0) {
          await StoreShowcaseProduct.bulkCreate(pivotRows as any, { ignoreDuplicates: true });
        }
      }

      const created = await StoreShowcase.findByPk(showcase.id, {
        include: [
          {
            model: Product,
            as: "products",
            attributes: ["id", "name", "price", "stock", "images", "slug"],
            through: { attributes: ["sortOrder"] },
          },
        ],
      });

      const products = Array.isArray((created as any)?.products) ? (created as any).products : [];

      return res.status(201).json({
        success: true,
        data: {
          id: showcase.id,
          storeId: showcase.storeId,
          name: showcase.name,
          slug: showcase.slug,
          description: showcase.description,
          icon: showcase.icon,
          sortOrder: showcase.sortOrder,
          isActive: showcase.isActive,
          productCount: products.length,
          productsCount: products.length,
          productIds: products.map((p: any) => Number(p.id)),
          products,
          createdAt: showcase.createdAt,
          updatedAt: showcase.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// GET /api/seller/stores/:storeId/showcases/:showcaseId
router.get(
  "/stores/:storeId/showcases/:showcaseId",
  requireSellerStoreAccess(["CATEGORY_VIEW"]),
  async (req, res, next) => {
    try {
      const storeId = Number(req.params.storeId || 0);
      const showcaseId = Number(req.params.showcaseId || 0);

      const showcase = await StoreShowcase.findOne({
        where: { id: showcaseId, storeId },
        include: [
          {
            model: Product,
            as: "products",
            attributes: ["id", "name", "price", "stock", "images", "slug"],
            through: { attributes: ["sortOrder"] },
          },
        ],
      });

      if (!showcase) {
        return res.status(404).json({
          success: false,
          code: "SELLER_SHOWCASE_NOT_FOUND",
          message: "Store showcase was not found.",
        });
      }

      const products = Array.isArray((showcase as any).products) ? (showcase as any).products : [];

      return res.json({
        success: true,
        data: {
          id: showcase.id,
          storeId: showcase.storeId,
          name: showcase.name,
          slug: showcase.slug,
          description: showcase.description,
          icon: showcase.icon,
          sortOrder: showcase.sortOrder,
          isActive: showcase.isActive,
          productCount: products.length,
          productsCount: products.length,
          productIds: products.map((p: any) => Number(p.id)),
          products,
          createdAt: showcase.createdAt,
          updatedAt: showcase.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// PUT /api/seller/stores/:storeId/showcases/:showcaseId
router.put(
  "/stores/:storeId/showcases/:showcaseId",
  requireSellerStoreAccess(["CATEGORY_MANAGE"]),
  async (req, res, next) => {
    try {
      const storeId = Number(req.params.storeId || 0);
      const showcaseId = Number(req.params.showcaseId || 0);

      const showcase = await StoreShowcase.findOne({
        where: { id: showcaseId, storeId },
      });

      if (!showcase) {
        return res.status(404).json({
          success: false,
          code: "SELLER_SHOWCASE_NOT_FOUND",
          message: "Store showcase was not found.",
        });
      }

      const body = showcaseInputSchema.partial().parse(req.body);
      const patch: Record<string, any> = {};

      if (typeof body.name === "string" && toText(body.name)) {
        patch.name = toText(body.name);
      }
      if (typeof body.slug === "string" && toText(body.slug)) {
        const slug = toText(body.slug).toLowerCase();
        if (slug !== showcase.slug) {
          const existing = await StoreShowcase.findOne({
            where: { storeId, slug, id: { [Op.ne]: showcaseId } },
          });
          if (!existing) {
            patch.slug = slug;
          }
        }
      }
      if (Object.prototype.hasOwnProperty.call(body, "description")) {
        patch.description = toText(body.description) || null;
      }
      if (Object.prototype.hasOwnProperty.call(body, "icon")) {
        patch.icon = toText(body.icon) || null;
      }
      if (typeof body.isActive === "boolean") {
        patch.isActive = body.isActive;
      }
      if (typeof body.sortOrder === "number") {
        patch.sortOrder = body.sortOrder;
      }

      if (Object.keys(patch).length > 0) {
        await showcase.update(patch);
      }

      // Update product associations if provided
      if (Array.isArray(body.productIds)) {
        // Validate products belong to store
        const validProducts = await Product.findAll({
          attributes: ["id"],
          where: {
            id: { [Op.in]: body.productIds },
            storeId,
          },
          raw: true,
        });
        const validProductIds = validProducts.map((p: any) => Number(p.id));

        // Delete old pivot rows
        await StoreShowcaseProduct.destroy({
          where: { showcaseId: showcase.id },
        });

        const pivotRows = validProductIds.map((productId, idx) => ({
          showcaseId: showcase.id,
          productId,
          sortOrder: idx,
        }));

        if (pivotRows.length > 0) {
          await StoreShowcaseProduct.bulkCreate(pivotRows as any, { ignoreDuplicates: true });
        }
      }

      const updated = await StoreShowcase.findByPk(showcase.id, {
        include: [
          {
            model: Product,
            as: "products",
            attributes: ["id", "name", "price", "stock", "images", "slug"],
            through: { attributes: ["sortOrder"] },
          },
        ],
      });

      const products = Array.isArray((updated as any)?.products) ? (updated as any).products : [];

      return res.json({
        success: true,
        data: {
          id: showcase.id,
          storeId: showcase.storeId,
          name: showcase.name,
          slug: showcase.slug,
          description: showcase.description,
          icon: showcase.icon,
          sortOrder: showcase.sortOrder,
          isActive: showcase.isActive,
          productCount: products.length,
          productsCount: products.length,
          productIds: products.map((p: any) => Number(p.id)),
          products,
          createdAt: showcase.createdAt,
          updatedAt: showcase.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// PATCH /api/seller/stores/:storeId/showcases/:showcaseId/active
router.patch(
  "/stores/:storeId/showcases/:showcaseId/active",
  requireSellerStoreAccess(["CATEGORY_MANAGE"]),
  async (req, res, next) => {
    try {
      const storeId = Number(req.params.storeId || 0);
      const showcaseId = Number(req.params.showcaseId || 0);

      const showcase = await StoreShowcase.findOne({
        where: { id: showcaseId, storeId },
      });

      if (!showcase) {
        return res.status(404).json({
          success: false,
          code: "SELLER_SHOWCASE_NOT_FOUND",
          message: "Store showcase was not found.",
        });
      }

      const isActive =
        typeof req.body.isActive === "boolean"
          ? req.body.isActive
          : typeof req.body.published === "boolean"
            ? req.body.published
            : !showcase.isActive;

      await showcase.update({ isActive });

      return res.json({
        success: true,
        data: {
          id: showcase.id,
          storeId: showcase.storeId,
          isActive: showcase.isActive,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// DELETE /api/seller/stores/:storeId/showcases/:showcaseId
router.delete(
  "/stores/:storeId/showcases/:showcaseId",
  requireSellerStoreAccess(["CATEGORY_MANAGE"]),
  async (req, res, next) => {
    try {
      const storeId = Number(req.params.storeId || 0);
      const showcaseId = Number(req.params.showcaseId || 0);

      const showcase = await StoreShowcase.findOne({
        where: { id: showcaseId, storeId },
      });

      if (!showcase) {
        return res.status(404).json({
          success: false,
          code: "SELLER_SHOWCASE_NOT_FOUND",
          message: "Store showcase was not found.",
        });
      }

      // Delete association rows first
      await StoreShowcaseProduct.destroy({
        where: { showcaseId: showcase.id },
      });

      await showcase.destroy();

      return res.json({
        success: true,
        message: "Store showcase deleted successfully.",
      });
    } catch (error) {
      return next(error);
    }
  }
);

// PUT /api/seller/stores/:storeId/showcases/reorder
router.put(
  "/stores/:storeId/showcases/reorder",
  requireSellerStoreAccess(["CATEGORY_MANAGE"]),
  async (req, res, next) => {
    try {
      const storeId = Number(req.params.storeId || 0);
      const schema = z.object({
        items: z.array(
          z.object({
            id: z.number().int().positive(),
            sortOrder: z.number().int(),
          })
        ),
      });

      const { items } = schema.parse(req.body);

      await Promise.all(
        items.map((item) =>
          StoreShowcase.update(
            { sortOrder: item.sortOrder },
            { where: { id: item.id, storeId } }
          )
        )
      );

      return res.json({
        success: true,
        message: "Showcase order updated successfully.",
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
