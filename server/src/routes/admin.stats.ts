// server/src/routes/admin.stats.ts
import { Router } from "express";
import { Op, fn, col, literal } from "sequelize";
import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { Product } from "../models/Product.js";
import { Store } from "../models/Store.js";
import { requireStaffOrAdmin } from "../middleware/requireRole.js";

const router = Router();

async function getCountAndRevenue(where: any) {
  const [count, revenue] = await Promise.all([
    Order.count({ where }),
    Order.sum("totalAmount", { where }),
  ]);
  return {
    count: Number(count || 0),
    revenue: Number(revenue || 0),
  };
}

const STATUS_KEYS = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

function range(start: Date, end: Date) {
  return { [Op.between]: [start, end] };
}

async function buildOverview() {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(now);
  endToday.setHours(23, 59, 59, 999);

  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const endYesterday = new Date(endToday);
  endYesterday.setDate(endYesterday.getDate() - 1);

  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const statusRows = await Order.findAll({
    attributes: ["status", [fn("COUNT", col("id")), "count"]],
    group: ["status"],
  });
  const statusCounts = STATUS_KEYS.reduce<Record<string, number>>((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
  statusRows.forEach((row: any) => {
    const key = String(row.get?.("status") || row.status || "").toLowerCase();
    const count = Number(row.get?.("count") ?? row.count ?? 0);
    if (key in statusCounts) statusCounts[key] = count;
  });

  const [today, yesterday, month, lastMonth, allTime, activeStores] = await Promise.all([
    getCountAndRevenue({ createdAt: range(startToday, endToday) }),
    getCountAndRevenue({ createdAt: range(startYesterday, endYesterday) }),
    getCountAndRevenue({ createdAt: range(startMonth, endMonth) }),
    getCountAndRevenue({ createdAt: range(startLastMonth, endLastMonth) }),
    getCountAndRevenue({}),
    Store.count({ where: { status: "ACTIVE" } }),
  ]);

  return {
    todayOrdersCount: today.count,
    todayRevenue: today.revenue,
    yesterdayOrdersCount: yesterday.count,
    yesterdayRevenue: yesterday.revenue,
    monthOrdersCount: month.count,
    monthRevenue: month.revenue,
    lastMonthOrdersCount: lastMonth.count,
    lastMonthRevenue: lastMonth.revenue,
    allTimeOrdersCount: allTime.count,
    allTimeRevenue: allTime.revenue,
    statusCounts,
    activeStoresCount: Number(activeStores || 0),
  };
}

router.get("/", requireStaffOrAdmin, async (_req, res) => {
  res.json(await buildOverview());
});

router.get("/overview", requireStaffOrAdmin, async (_req, res) => {
  res.json(await buildOverview());
});

router.get("/statistics", requireStaffOrAdmin, async (_req, res) => {
  res.json(await buildOverview());
});

router.get("/weekly", requireStaffOrAdmin, async (req, res) => {
  const requestedDays = Number(req.query.days || 7);
  const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 7;
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const rows = await Order.findAll({
    attributes: [
      [fn("DATE", col("created_at")), "day"],
      [fn("COUNT", col("id")), "orders"],
      [fn("SUM", col("total_amount")), "sales"],
    ],
    where: { createdAt: range(start, end) },
    group: [literal("day") as any],
    order: [[literal("day") as any, "ASC"]],
  });

  const map = new Map<string, { day: string; orders: number; sales: number }>();
  rows.forEach((row: any) => {
    const day = String(row.get?.("day") ?? "");
    map.set(day, {
      day,
      orders: Number(row.get?.("orders") ?? 0),
      sales: Number(row.get?.("sales") ?? 0),
    });
  });

  const data: { day: string; orders: number; sales: number }[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const day = d.toISOString().slice(0, 10);
    data.push(map.get(day) || { day, orders: 0, sales: 0 });
  }

  res.json({ data });
});

router.get("/best-sellers", requireStaffOrAdmin, async (req, res) => {
  const requestedDays = Number(req.query.days || 7);
  const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 7;
  const limit = Math.min(10, Math.max(1, Number(req.query.limit || 5)));
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  const rows = await OrderItem.findAll({
    attributes: [
      "productId",
      [fn("SUM", col("quantity")), "qty"],
      [fn("SUM", literal("`OrderItem`.`quantity` * `OrderItem`.`price`")), "revenue"],
    ],
    where: { createdAt: { [Op.gte]: start } },
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["id", "name"],
      },
    ],
    group: ["productId"],
    order: [[fn("SUM", col("quantity")), "DESC"]],
    limit,
  });

  const data = rows.map((row: any) => ({
    productId: row.productId ?? row.get?.("productId"),
    name: row.product?.name ?? row.get?.("product")?.name ?? null,
    qty: Number(row.get?.("qty") ?? row.qty ?? 0),
    revenue: Number(row.get?.("revenue") ?? 0),
  }));

  res.json({ data });
});

export default router;
