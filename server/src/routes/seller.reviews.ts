import { Op, type Order } from "sequelize";
import {
  Router,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import requireSellerStoreAccess from "../middleware/requireSellerStoreAccess.js";
import { Product, ProductReview, User, sequelize } from "../models/index.js";

const router = Router();
const REVIEW_STATUSES = new Set(["pending", "published", "hidden"]);
const asyncRoute = (
  handler: (req: Request, res: Response) => Promise<unknown>
): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res).catch((error) => {
      console.error("[seller/reviews] request failed", error);
      if (res.headersSent) return next(error);
      return res.status(500).json({
        success: false,
        message: "The review request could not be completed.",
      });
    });
  };

const text = (value: unknown) => String(value ?? "").trim();
const positiveInt = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
};

const imageList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  const raw = text(value);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(text).filter(Boolean) : [raw];
  } catch {
    return [raw];
  }
};

const normalizeImage = (value: unknown) => {
  const raw = text(value);
  if (!raw) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("/uploads/")) return raw;
  if (raw.startsWith("uploads/")) return `/${raw}`;
  return raw.startsWith("/") ? raw : `/uploads/${raw}`;
};

const serializeReview = (review: any) => {
  const plain = review?.get ? review.get({ plain: true }) : review || {};
  const product = plain.product || {};
  const user = plain.user || {};
  const status = REVIEW_STATUSES.has(text(plain.status).toLowerCase())
    ? text(plain.status).toLowerCase()
    : "published";
  const productImages = imageList(product.imagePaths);

  return {
    id: Number(plain.id),
    userId: Number(plain.userId),
    productId: Number(plain.productId),
    rating: Math.max(1, Math.min(5, Number(plain.rating) || 1)),
    comment: plain.comment ?? null,
    images: imageList(plain.images).map(normalizeImage).filter(Boolean).slice(0, 4),
    status,
    moderationReason: plain.moderationReason ?? null,
    sellerReply: plain.sellerReply ?? null,
    repliedAt: plain.repliedAt ?? null,
    repliedByUserId: plain.repliedByUserId ?? null,
    reportedAt: plain.reportedAt ?? null,
    reportReason: plain.reportReason ?? null,
    reportedByUserId: plain.reportedByUserId ?? null,
    isReported: Boolean(plain.reportedAt && plain.reportReason),
    helpfulCount: Math.max(0, Number(plain.helpfulCount) || 0),
    notHelpfulCount: Math.max(0, Number(plain.notHelpfulCount) || 0),
    verifiedBuyer: true,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
    user: {
      id: Number(user.id) || null,
      name: text(user.name) || "Customer",
    },
    product: {
      id: Number(product.id) || Number(plain.productId),
      name: text(product.name) || `Product #${plain.productId}`,
      slug: text(product.slug) || null,
      sku: text(product.sku) || null,
      price: Number(product.salePrice || product.price || 0),
      imageUrl:
        normalizeImage(product.promoImagePath) ||
        normalizeImage(productImages[0]) ||
        null,
    },
  };
};

const reviewInclude = (storeId: number) => [
  {
    model: Product,
    as: "product",
    attributes: [
      "id",
      "storeId",
      "name",
      "slug",
      "sku",
      "price",
      "salePrice",
      "promoImagePath",
      "imagePaths",
    ],
    where: { storeId },
    required: true,
  },
  {
    model: User,
    as: "user",
    attributes: ["id", "name"],
    required: false,
  },
];

const findScopedReview = (storeId: number, reviewId: number) =>
  ProductReview.findOne({
    where: { id: reviewId },
    include: reviewInclude(storeId),
  });

const readStats = async (storeId: number) => {
  const [rows] = await sequelize.query(
    `SELECT
       COUNT(pr.id) AS totalReviews,
       COALESCE(ROUND(AVG(pr.rating), 1), 0) AS averageRating,
       SUM(CASE WHEN COALESCE(pr.status, 'published') = 'pending' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN COALESCE(pr.status, 'published') = 'published' THEN 1 ELSE 0 END) AS published,
       SUM(CASE WHEN COALESCE(pr.status, 'published') = 'hidden' THEN 1 ELSE 0 END) AS hidden,
       SUM(CASE
         WHEN COALESCE(pr.status, 'published') <> 'hidden'
          AND (pr.seller_reply IS NULL OR TRIM(pr.seller_reply) = '')
         THEN 1 ELSE 0 END) AS pendingReplies,
       SUM(CASE WHEN pr.seller_reply IS NOT NULL AND TRIM(pr.seller_reply) <> '' THEN 1 ELSE 0 END) AS replied
     FROM product_reviews pr
     INNER JOIN products p ON p.id = pr.product_id
     WHERE p.store_id = ?`,
    { replacements: [storeId] }
  );
  const row = (Array.isArray(rows) ? rows[0] : {}) as Record<string, unknown>;
  const totalReviews = Number(row.totalReviews) || 0;
  const replied = Number(row.replied) || 0;
  return {
    totalReviews,
    averageRating: Number(row.averageRating) || 0,
    pendingReplies: Number(row.pendingReplies) || 0,
    responseRate: totalReviews ? Math.round((replied / totalReviews) * 100) : 0,
    published: Number(row.published) || 0,
    pending: Number(row.pending) || 0,
    hidden: Number(row.hidden) || 0,
  };
};

router.get(
  "/stores/:storeId/reviews",
  requireSellerStoreAccess(["PRODUCT_VIEW"]),
  async (req, res) => {
    try {
      const storeId = Number(req.params.storeId);
      const page = positiveInt(req.query.page, 1, 10_000);
      const limit = positiveInt(req.query.limit, 10, 50);
      const status = text(req.query.status).toLowerCase();
      const search = text(req.query.search);
      const sort = text(req.query.sort).toLowerCase() || "newest";
      const where: Record<PropertyKey, unknown> = {};

      if (REVIEW_STATUSES.has(status)) where.status = status;
      if (search) {
        const like = `%${search}%`;
        where[Op.or] = [
          { comment: { [Op.like]: like } },
          { sellerReply: { [Op.like]: like } },
          { "$product.name$": { [Op.like]: like } },
          { "$product.sku$": { [Op.like]: like } },
          { "$user.name$": { [Op.like]: like } },
        ];
      }

      const orderMap: Record<string, Order> = {
        newest: [["createdAt", "DESC"], ["id", "DESC"]],
        oldest: [["createdAt", "ASC"], ["id", "ASC"]],
        rating_high: [["rating", "DESC"], ["createdAt", "DESC"]],
        rating_low: [["rating", "ASC"], ["createdAt", "DESC"]],
      };
      const [result, stats] = await Promise.all([
        ProductReview.findAndCountAll({
          where,
          include: reviewInclude(storeId),
          order: orderMap[sort] || orderMap.newest,
          limit,
          offset: (page - 1) * limit,
          distinct: true,
          subQuery: false,
        }),
        readStats(storeId),
      ]);
      const total = Number(result.count || 0);

      return res.json({
        success: true,
        data: {
          items: result.rows.map(serializeReview),
          stats,
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      });
    } catch (error) {
      console.error("[seller/reviews/list] error", error);
      return res.status(500).json({ success: false, message: "Failed to load seller reviews." });
    }
  }
);

router.get(
  "/stores/:storeId/reviews/:reviewId",
  requireSellerStoreAccess(["PRODUCT_VIEW"]),
  asyncRoute(async (req, res) => {
    const review = await findScopedReview(Number(req.params.storeId), Number(req.params.reviewId));
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    return res.json({ success: true, data: serializeReview(review) });
  })
);

router.patch(
  "/stores/:storeId/reviews/:reviewId/reply",
  requireSellerStoreAccess(["PRODUCT_EDIT"]),
  asyncRoute(async (req, res) => {
    const reply = text(req.body?.reply);
    if (!reply || reply.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Reply is required and must be 500 characters or fewer.",
      });
    }
    const review = await findScopedReview(Number(req.params.storeId), Number(req.params.reviewId));
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    await review.update({
      sellerReply: reply,
      repliedAt: new Date(),
      repliedByUserId: Number((req as any).user?.id) || null,
    });
    const refreshed = await findScopedReview(Number(req.params.storeId), Number(req.params.reviewId));
    return res.json({ success: true, data: serializeReview(refreshed) });
  })
);

router.patch(
  "/stores/:storeId/reviews/:reviewId/status",
  requireSellerStoreAccess(["PRODUCT_EDIT"]),
  asyncRoute(async (req, res) => {
    const status = text(req.body?.status).toLowerCase();
    const reason = text(req.body?.reason);
    if (!["published", "hidden"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be published or hidden." });
    }
    const review = await findScopedReview(Number(req.params.storeId), Number(req.params.reviewId));
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    await review.update({
      status: status as "published" | "hidden",
      moderationReason: reason || null,
    });
    const refreshed = await findScopedReview(Number(req.params.storeId), Number(req.params.reviewId));
    return res.json({ success: true, data: serializeReview(refreshed) });
  })
);

router.post(
  "/stores/:storeId/reviews/:reviewId/report",
  requireSellerStoreAccess(["PRODUCT_EDIT"]),
  asyncRoute(async (req, res) => {
    const reason = text(req.body?.reason);
    if (!reason || reason.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Report reason is required and must be 1000 characters or fewer.",
      });
    }
    const review = await findScopedReview(Number(req.params.storeId), Number(req.params.reviewId));
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    const reportedAt = new Date();
    const reportedByUserId = Number((req as any).user?.id) || null;
    await review.update({ reportedAt, reportReason: reason, reportedByUserId });
    const refreshed = await findScopedReview(Number(req.params.storeId), Number(req.params.reviewId));
    return res.status(201).json({
      success: true,
      data: {
        review: serializeReview(refreshed),
        report: { reason, reportedAt, reportedByUserId },
      },
    });
  })
);

export default router;
