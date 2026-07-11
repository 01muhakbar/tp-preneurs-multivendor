import { Router } from "express";
import { requireAdmin, requireStaffOrAdmin } from "../middleware/requireRole.js";
import { Category, Product, ProductCategory } from "../models/index.js";
import { z } from "zod";
import multer from "multer";
import { Op } from "sequelize";

const router = Router();

// helpers
function parseBool(v: any): boolean | undefined {
  if (v === undefined) return undefined;
  const s = String(v).toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  return undefined;
}

async function getCategoryProductCountMap(categoryIds: number[]) {
  const ids = Array.from(
    new Set(
      categoryIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    )
  );
  const counts = new Map<number, Set<number>>();
  ids.forEach((id) => counts.set(id, new Set<number>()));
  if (ids.length === 0) return new Map<number, number>();

  const directProducts = await Product.findAll({
    attributes: ["id", "categoryId", "defaultCategoryId"],
    where: {
      [Op.or]: [
        { categoryId: { [Op.in]: ids } },
        { defaultCategoryId: { [Op.in]: ids } },
      ],
    } as any,
    raw: true,
  });

  directProducts.forEach((product: any) => {
    const productId = Number(product.id);
    [product.categoryId, product.defaultCategoryId].forEach((categoryId) => {
      const normalizedCategoryId = Number(categoryId);
      if (counts.has(normalizedCategoryId) && Number.isFinite(productId)) {
        counts.get(normalizedCategoryId)!.add(productId);
      }
    });
  });

  const joinRows = await ProductCategory.findAll({
    attributes: ["productId", "categoryId"],
    where: { categoryId: { [Op.in]: ids } } as any,
    raw: true,
  });

  joinRows.forEach((row: any) => {
    const productId = Number(row.productId);
    const categoryId = Number(row.categoryId);
    if (counts.has(categoryId) && Number.isFinite(productId)) {
      counts.get(categoryId)!.add(productId);
    }
  });

  return new Map(ids.map((id) => [id, counts.get(id)?.size ?? 0]));
}

function serializeCategory(category: any, productCountMap = new Map<number, number>()) {
  const plain = category?.get ? category.get({ plain: true }) : category;
  const id = Number(plain?.id);
  return {
    ...plain,
    productCount: productCountMap.get(id) ?? Number(plain?.productCount ?? 0),
  };
}

// GET /api/admin/categories
// supports: q, page, pageSize, parentsOnly, parentId, published, sort (e.g. "created_at:desc")
router.get("/", requireStaffOrAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
    const limit = Math.min(
      500,
      Math.max(1, parseInt(String(req.query.limit || req.query.pageSize || 10), 10))
    );
    const parentsOnly = parseBool(req.query.parentsOnly);
    const parentIdRaw = String(req.query.parentId ?? "").trim();
    const parentId = parentIdRaw ? Number(parentIdRaw) : null;
    const published = parseBool(req.query.published);
    const sort = String(req.query.sort || "created_at:desc");
    const [sortKey, sortDirRaw] = sort.split(":");
    const sortDir = (sortDirRaw || "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";

    const where: any = {};
    if (q) where.name = { [Op.like]: `%${q}%` };
    if (Number.isFinite(parentId) && Number(parentId) > 0) {
      where.parent_id = Number(parentId);
    } else if (parentsOnly === true) {
      where.parent_id = { [Op.is]: null };
    }
    if (published !== undefined) where.published = published;

    const offset = (page - 1) * limit;
    const { rows, count } = await Category.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortKey, sortDir]],
      include: [{ model: Category, as: "parent", attributes: ["id", "name", "code"] }],
    });
    const productCountMap = await getCategoryProductCountMap(rows.map((row: any) => Number(row.id)));
    res.json({
      data: rows.map((row: any) => serializeCategory(row, productCountMap)),
      meta: { page, limit, total: count, totalPages: Math.max(1, Math.ceil(count / limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/categories/stats
router.get("/stats", requireStaffOrAdmin, async (_req, res, next) => {
  try {
    const [total, active, subcategories, draft] = await Promise.all([
      Category.count(),
      Category.count({ where: { published: true } as any }),
      Category.count({ where: { parent_id: { [Op.not]: null } } as any }),
      Category.count({ where: { published: false } as any }),
    ]);
    res.json({
      data: {
        total,
        active,
        subcategories,
        draft,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/categories
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const body = z
      .object({
        code: z.string().max(32).optional(),
        name: z.string().min(1),
        description: z.string().max(255).optional(),
        icon: z.string().max(255).optional(),
        parent_id: z.number().int().positive().optional(),
        published: z.boolean().optional(),
      })
      .parse(req.body);

    const code = body.code || Math.random().toString(36).slice(2, 6).toUpperCase();

    const created = await Category.create({
      code,
      name: body.name,
      description: body.description,
      icon: body.icon,
      parentId: body.parent_id,
      published: body.published ?? true,
    } as any);
    res.status(201).json({ data: created });
  } catch (err) {
    // Handle race condition with DB unique constraint
    if ((err as any)?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: "Category code already exists" });
    }
    next(err);
  }
});

// CSV export/import
function toCsvValue(v: any) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

router.get("/export", requireStaffOrAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const parentsOnly = parseBool(req.query.parentsOnly);
    const parentIdRaw = String(req.query.parentId ?? "").trim();
    const parentId = parentIdRaw ? Number(parentIdRaw) : null;
    const published = parseBool(req.query.published);
    const sort = String(req.query.sort || "created_at:desc");
    const [sortKey, sortDirRaw] = sort.split(":");
    const sortDir = (sortDirRaw || "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";
    const format =
      String(req.query.format || "json").trim().toLowerCase() === "csv" ? "csv" : "json";

    const where: any = {};
    if (q) where.name = { [Op.like]: `%${q}%` };
    if (Number.isFinite(parentId) && Number(parentId) > 0) {
      where.parent_id = Number(parentId);
    } else if (parentsOnly === true) {
      where.parent_id = { [Op.is]: null };
    }
    if (published !== undefined) where.published = published;

    const rows = await Category.findAll({
      where,
      order: [[sortKey, sortDir]],
      include: [{ model: Category, as: "parent", attributes: ["id", "name", "code"] }],
    });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (format === "json") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="categories-export-${timestamp}.json"`
      );
      return res.status(200).json({
        format: "admin-categories.v1",
        exportedAt: new Date().toISOString(),
        total: rows.length,
        filters: {
          q: q || null,
          parentsOnly: typeof parentsOnly === "boolean" ? parentsOnly : null,
          parentId: Number.isFinite(parentId) && Number(parentId) > 0 ? Number(parentId) : null,
          published: typeof published === "boolean" ? published : null,
          sort,
        },
        items: rows.map((row: any) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description ?? "",
          icon: row.icon ?? "",
          published: Boolean(row.published),
          parentId: row.parentId ?? row.parent_id ?? null,
          parent: row.parent
            ? {
                id: row.parent.id,
                code: row.parent.code,
                name: row.parent.name,
              }
            : null,
          createdAt: row.createdAt ?? null,
          updatedAt: row.updatedAt ?? null,
        })),
      });
    }

    const header = "code,name,description,icon,published,parent_code\n";
    const body = rows
      .map((r: any) =>
        [r.code, r.name, r.description ?? "", r.icon ?? "", r.published ? "true" : "false", r.parent?.code ?? ""]
          .map(toCsvValue)
          .join(",")
      )
      .join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="categories-export-${timestamp}.csv"`
    );
    res.send(header + body + "\n");
  } catch (err) {
    next(err);
  }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
router.post("/import", requireAdmin, upload.single("file"), async (req, res, next) => {
  try {
    const buf = req.file?.buffer;
    if (!buf) return res.status(400).json({ success: false, message: "No file uploaded" });
    const text = buf.toString("utf8").trim();
    const lines = text.split(/\r?\n/);
    const header = lines.shift();
    if (!header || !/^code,?name,?description,?icon,?published,?parent_code/i.test(header.replace(/\s+/g, ""))) {
      return res.status(400).json({ success: false, message: "Invalid CSV header" });
    }
    let created = 0;
    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = parseCsvLine(line);
      const [code, name, description, icon, published, parent_code] = cols;
      if (!code || !name) continue;
      let parentId: number | null = null;
      if (parent_code) {
        const parent = await Category.findOne({ where: { code: parent_code } });
        parentId = (parent as any)?.id ?? null;
      }
      try {
        await Category.create({ code, name, description, icon, published: String(published).toLowerCase() === "true", parentId } as any);
        created++;
      } catch (_) {
        // ignore duplicates
      }
    }
    res.json({ data: { created } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/categories/:id
router.get("/:id", requireStaffOrAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const cat = await Category.findByPk(id, {
      include: [{ model: Category, as: "parent", attributes: ["id", "name", "code"] }],
    });
    if (!cat) return res.status(404).json({ success: false, message: "Not found" });
    const productCountMap = await getCategoryProductCountMap([id]);
    res.json({ data: serializeCategory(cat, productCountMap) });
  } catch (err) {
    next(err);
  }
});

// helper: prevent cycles when changing parent
async function wouldCauseCycle(id: number, parentId?: number | null) {
  if (!parentId) return false;
  if (parentId === id) return true;
  let cur = await Category.findByPk(parentId);
  while (cur && (cur as any).parentId) {
    if ((cur as any).parentId === id) return true;
    cur = await Category.findByPk((cur as any).parentId);
  }
  return false;
}

// PATCH /api/admin/categories/:id
router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const body = z
      .object({
        code: z.string().max(32).optional(),
        name: z.string().min(1),
        description: z.string().max(255).optional(),
        icon: z.string().max(255).optional(),
        parent_id: z.number().int().positive().nullable().optional(),
        published: z.boolean().optional(),
      })
      .parse(req.body);
    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ success: false, message: "Not found" });
    if (await wouldCauseCycle(id, body.parent_id as any)) {
      return res.status(400).json({ success: false, message: "Invalid parent_id: cycle detected" });
    }
    await cat.update({
      code: body.code ?? (cat as any).code,
      name: body.name,
      description: body.description,
      icon: body.icon,
      parentId: body.parent_id as any,
      published: body.published ?? (cat as any).published,
    } as any);
    res.json({ data: cat });
  } catch (err) {
    if ((err as any)?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: "Category code already exists" });
    }
    next(err);
  }
});

// PATCH /api/admin/categories/:id/publish
router.patch("/:id/publish", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { published } = z.object({ published: z.boolean() }).parse(req.body);
    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ success: false, message: "Not found" });
    await (cat as any).update({ published });
    res.json({ data: cat });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/categories/:id
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ success: false, message: "Not found" });
    await cat.destroy();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/categories/bulk
router.post("/bulk", requireAdmin, async (req, res, next) => {
  try {
    const body = z
      .object({
        action: z.enum(["delete", "publish", "unpublish"]),
        ids: z.array(z.number().int().positive()),
      })
      .parse(req.body);
    if (body.action === "delete") {
      await Category.destroy({ where: { id: { [Op.in]: body.ids } } as any });
    } else if (body.action === "publish") {
      await Category.update({ published: true } as any, { where: { id: { [Op.in]: body.ids } } as any });
    } else if (body.action === "unpublish") {
      await Category.update({ published: false } as any, { where: { id: { [Op.in]: body.ids } } as any });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        out.push(cur);
        cur = "";
      } else if (ch === '"') {
        quoted = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export default router;
