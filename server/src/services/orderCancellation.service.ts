import { Op } from "sequelize";
import {
  Order,
  OrderItem,
  OrderPaymentAttempt,
  Payment,
  Product,
  Suborder,
  SuborderItem,
  sequelize,
} from "../models/index.js";
import { appendPaymentStatusLog } from "./paymentStatusLog.service.js";
import { appendAuditNote } from "./operationalAudit.service.js";
import { createUserOrderStatusUpdatedNotification } from "./notification.service.js";

const normalizeJsonValue = (raw: unknown) => {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
};

export const restoreProductVariationStock = (
  rawVariations: unknown,
  variantQtyByKey: Map<string, number>
) => {
  if (variantQtyByKey.size === 0) {
    return { changed: false, value: rawVariations };
  }

  const normalized = normalizeJsonValue(rawVariations);
  if (!normalized || typeof normalized !== "object") {
    return { changed: false, value: rawVariations };
  }

  const raw = Array.isArray(normalized)
    ? { hasVariants: normalized.length > 0, variants: normalized }
    : (normalized as Record<string, any>);
  const variants = Array.isArray(raw?.variants) ? raw.variants : [];
  let changed = false;

  const nextVariants = variants.map((variant: any) => {
    const key = String(variant?.combinationKey || "").trim().toLowerCase();
    const restoreQty = key ? variantQtyByKey.get(key) || 0 : 0;
    if (restoreQty <= 0) return variant;

    const quantityRaw =
      variant?.quantity === null ||
      typeof variant?.quantity === "undefined" ||
      variant?.quantity === ""
        ? variant?.stock
        : variant?.quantity;
    const currentVariantStock = Number.isFinite(Number(quantityRaw))
      ? Math.max(0, Math.round(Number(quantityRaw)))
      : 0;
    changed = true;

    return {
      ...variant,
      ...(Object.prototype.hasOwnProperty.call(variant || {}, "stock")
        ? { stock: currentVariantStock + restoreQty }
        : {}),
      quantity: currentVariantStock + restoreQty,
    };
  });

  if (!changed) return { changed: false, value: rawVariations };

  return {
    changed: true,
    value: {
      ...raw,
      hasVariants: Boolean(raw?.hasVariants) || nextVariants.length > 0,
      variants: nextVariants,
    },
  };
};

export const restoreSuborderInventory = async (suborderId: number, transaction: any) => {
  if (!Number.isFinite(Number(suborderId)) || Number(suborderId) <= 0) {
    return [];
  }

  const items = await SuborderItem.findAll({
    where: { suborderId: Number(suborderId) },
    attributes: ["id", "productId", "qty", "variantKey"],
    transaction,
  });

  const restoreByProduct = new Map<
    number,
    { totalQty: number; variants: Map<string, number> }
  >();

  for (const item of items as any[]) {
    const productId = Number(item.productId || item.getDataValue?.("productId") || 0);
    const qty = Math.max(0, Math.round(Number(item.qty || item.getDataValue?.("qty") || 0)));
    if (productId <= 0 || qty <= 0) continue;

    const entry =
      restoreByProduct.get(productId) || { totalQty: 0, variants: new Map<string, number>() };
    entry.totalQty += qty;

    const variantKey = String(item.variantKey || item.getDataValue?.("variantKey") || "")
      .trim()
      .toLowerCase();
    if (variantKey) {
      entry.variants.set(variantKey, (entry.variants.get(variantKey) || 0) + qty);
    }
    restoreByProduct.set(productId, entry);
  }

  const restored: Array<{ productId: number; qty: number }> = [];
  for (const [productId, entry] of restoreByProduct.entries()) {
    const product = await Product.findByPk(productId, {
      attributes: ["id", "stock", "variations"],
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
    if (!product) continue;

    const currentStock = Math.max(0, Math.round(Number(product.stock || product.getDataValue?.("stock") || 0)));
    product.set("stock", currentStock + entry.totalQty);

    const variationRestore = restoreProductVariationStock(
      product.getDataValue?.("variations") ?? (product as any).variations,
      entry.variants
    );
    if (variationRestore.changed) {
      product.set("variations", variationRestore.value as any);
    }

    await product.save({ transaction });
    restored.push({ productId, qty: entry.totalQty });
  }

  return restored;
};

export const restoreOrderItemInventory = async (orderId: number, transaction: any) => {
  if (!Number.isFinite(Number(orderId)) || Number(orderId) <= 0) {
    return [];
  }

  const items = await OrderItem.findAll({
    where: { orderId: Number(orderId) },
    attributes: ["id", "productId", "quantity", "variantKey"],
    transaction,
  });

  const restoreByProduct = new Map<
    number,
    { totalQty: number; variants: Map<string, number> }
  >();

  for (const item of items as any[]) {
    const productId = Number(item.productId || item.getDataValue?.("productId") || 0);
    const qty = Math.max(0, Math.round(Number(item.quantity || item.getDataValue?.("quantity") || 0)));
    if (productId <= 0 || qty <= 0) continue;

    const entry =
      restoreByProduct.get(productId) || { totalQty: 0, variants: new Map<string, number>() };
    entry.totalQty += qty;

    const variantKey = String(item.variantKey || item.getDataValue?.("variantKey") || "")
      .trim()
      .toLowerCase();
    if (variantKey) {
      entry.variants.set(variantKey, (entry.variants.get(variantKey) || 0) + qty);
    }
    restoreByProduct.set(productId, entry);
  }

  const restored: Array<{ productId: number; qty: number }> = [];
  for (const [productId, entry] of restoreByProduct.entries()) {
    const product = await Product.findByPk(productId, {
      attributes: ["id", "stock", "variations"],
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
    if (!product) continue;

    const currentStock = Math.max(0, Math.round(Number(product.stock || product.getDataValue?.("stock") || 0)));
    product.set("stock", currentStock + entry.totalQty);

    const variationRestore = restoreProductVariationStock(
      product.getDataValue?.("variations") ?? (product as any).variations,
      entry.variants
    );
    if (variationRestore.changed) {
      product.set("variations", variationRestore.value as any);
    }

    await product.save({ transaction });
    restored.push({ productId, qty: entry.totalQty });
  }

  return restored;
};

export const resolveOrderExpiryMinutes = (): number => {
  const envVal = Number(
    process.env.ORDER_EXPIRY_MINUTES ||
      (process.env.ORDER_EXPIRATION_HOURS ? Number(process.env.ORDER_EXPIRATION_HOURS) * 60 : 1440)
  );
  if (Number.isFinite(envVal) && envVal >= 60 && envVal <= 1440) {
    return Math.round(envVal);
  }
  return 1440; // Default 24 hours (1440 minutes), clamped between 1 hour (60 min) and 24 hours (1440 min)
};

export type CancelOrderActor = {
  type: "BUYER" | "SYSTEM" | "ADMIN";
  id?: number | null;
};

export const cancelOrderAndRestoreStock = async (
  orderId: number,
  actor: CancelOrderActor,
  reason: string,
  externalTx?: any
) => {
  const tx = externalTx || (await sequelize.transaction());
  try {
    const order = await Order.findByPk(orderId, {
      attributes: ["id", "invoiceNo", "status", "paymentStatus", "userId", "createdAt"],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!order) {
      if (!externalTx) await tx.rollback();
      throw new Error("Pesanan tidak ditemukan.");
    }

    const currentStatus = String((order as any).status || "pending").toLowerCase().trim();
    const currentPaymentStatus = String((order as any).paymentStatus || "UNPAID").toUpperCase().trim();

    if (["complete", "completed", "delivered"].includes(currentStatus)) {
      if (!externalTx) await tx.rollback();
      throw new Error("Pesanan sudah selesai atau terkirim dan tidak dapat dibatalkan.");
    }

    if (currentPaymentStatus === "PAID" && actor.type !== "ADMIN") {
      if (!externalTx) await tx.rollback();
      throw new Error("Pesanan yang sudah dibayar tidak dapat dibatalkan secara langsung.");
    }

    if (currentStatus === "cancelled") {
      if (!externalTx) await tx.rollback();
      return { success: true, alreadyCancelled: true, order };
    }

    const targetPaymentStatus = actor.type === "SYSTEM" ? "EXPIRED" : "CANCELLED";

    // 1. Update Order
    await order.update(
      {
        status: "cancelled",
        paymentStatus: targetPaymentStatus,
        updatedAt: new Date(),
      } as any,
      { transaction: tx }
    );

    // 2. Suborders & Inventory Restoration
    const suborders = await Suborder.findAll({
      where: { orderId },
      attributes: ["id", "suborderNumber", "paymentStatus", "fulfillmentStatus"],
      transaction: tx,
    });

    if (suborders.length > 0) {
      for (const suborder of suborders) {
        await suborder.update(
          {
            paymentStatus: targetPaymentStatus,
            fulfillmentStatus: "CANCELLED",
            paidAt: null,
            updatedAt: new Date(),
          } as any,
          { transaction: tx }
        );
        await restoreSuborderInventory(Number((suborder as any).id), tx);
      }
    } else {
      await restoreOrderItemInventory(orderId, tx);
    }

    // 3. Payments
    if (suborders.length > 0) {
      const suborderIds = suborders.map((s: any) => Number(s.id));
      const payments = await Payment.findAll({
        where: { suborderId: { [Op.in]: suborderIds } },
        transaction: tx,
      });
      for (const payment of payments) {
        const oldPaymentStatus = String((payment as any).status || "CREATED").toUpperCase();
        await payment.update(
          {
            status: targetPaymentStatus,
            paidAt: null,
            updatedAt: new Date(),
          } as any,
          { transaction: tx }
        );
        await appendPaymentStatusLog(
          {
            paymentId: Number((payment as any).id),
            oldStatus: oldPaymentStatus,
            newStatus: targetPaymentStatus,
            actorType: actor.type === "BUYER" ? "BUYER" : actor.type === "ADMIN" ? "ADMIN" : "SYSTEM",
            actorId: actor.id ?? null,
            note: appendAuditNote(reason, {
              source: "orderCancellation",
              orderId,
              invoiceNo: String((order as any).invoiceNo || ""),
              actorType: actor.type,
            }),
          },
          tx
        );
      }
    }

    // 4. OrderPaymentAttempts
    try {
      await OrderPaymentAttempt.update(
        {
          status: targetPaymentStatus === "EXPIRED" ? "EXPIRED" : "CANCELLED",
          cancelledAt: actor.type !== "SYSTEM" ? new Date() : null,
          expiredAt: actor.type === "SYSTEM" ? new Date() : null,
          updatedAt: new Date(),
        } as any,
        {
          where: {
            orderId,
            status: { [Op.in]: ["CREATED", "PENDING"] },
          },
          transaction: tx,
        }
      );
    } catch {
      // Graceful if table not present
    }

    // 5. User Notification
    const userId = Number((order as any).userId);
    if (Number.isFinite(userId) && userId > 0) {
      try {
        await createUserOrderStatusUpdatedNotification({
          userId,
          orderId,
          invoiceNo: String((order as any).invoiceNo || ""),
          statusFrom: currentStatus,
          statusTo: "cancelled",
        });
      } catch (notifyErr) {
        console.warn("[orderCancellation] user notification failed", notifyErr);
      }
    }

    if (!externalTx) {
      await tx.commit();
    }

    return {
      success: true,
      orderId,
      invoiceNo: (order as any).invoiceNo,
      status: "cancelled",
      paymentStatus: targetPaymentStatus,
    };
  } catch (error) {
    if (!externalTx) {
      await tx.rollback();
    }
    throw error;
  }
};

export const isOrderExpired = (order: any, latestAttempt?: any, maxAgeMinutes?: number): boolean => {
  const currentStatus = String(order?.status || "").toLowerCase().trim();
  const currentPaymentStatus = String(order?.paymentStatus || "UNPAID").toUpperCase().trim();

  // Only pending, unpaid orders can expire
  if (currentStatus !== "pending" || currentPaymentStatus === "PAID") {
    return false;
  }

  const now = Date.now();
  const attemptExpiry = latestAttempt?.expiresAt ? new Date(latestAttempt.expiresAt).getTime() : null;
  if (attemptExpiry && Number.isFinite(attemptExpiry) && attemptExpiry <= now) {
    return true;
  }

  const expiryMinutes = maxAgeMinutes || resolveOrderExpiryMinutes();
  const createdAt = order?.createdAt ? new Date(order.createdAt).getTime() : null;
  if (createdAt && Number.isFinite(createdAt)) {
    const expiryTimestamp = createdAt + expiryMinutes * 60 * 1000;
    if (now >= expiryTimestamp) {
      return true;
    }
  }

  return false;
};

export const expireOrderIfOverdue = async (orderId: number): Promise<boolean> => {
  if (!Number.isFinite(Number(orderId)) || Number(orderId) <= 0) return false;

  const order = await Order.findByPk(orderId, {
    attributes: ["id", "invoiceNo", "status", "paymentStatus", "createdAt"],
  });

  if (!order) return false;

  let latestAttempt = null;
  try {
    latestAttempt = await OrderPaymentAttempt.findOne({
      where: { orderId },
      order: [["id", "DESC"]],
      attributes: ["id", "status", "expiresAt"],
    });
  } catch {
    // Graceful
  }

  if (isOrderExpired(order, latestAttempt)) {
    try {
      await cancelOrderAndRestoreStock(
        orderId,
        { type: "SYSTEM" },
        "Pesanan dibatalkan otomatis oleh sistem karena telah melewati batas waktu pembayaran."
      );
      return true;
    } catch (err) {
      console.error(`[orderCancellation] Failed to expire order #${orderId}`, err);
    }
  }

  return false;
};

export const sweepExpiredOrders = async (): Promise<number> => {
  try {
    const expiryMinutes = resolveOrderExpiryMinutes();
    const thresholdDate = new Date(Date.now() - expiryMinutes * 60 * 1000);

    const overdueOrders = await Order.findAll({
      where: {
        status: "pending",
        paymentStatus: { [Op.notIn]: ["PAID", "SETTLED"] },
        createdAt: { [Op.lte]: thresholdDate },
      },
      attributes: ["id"],
      limit: 100,
    });

    let sweptCount = 0;
    for (const ord of overdueOrders) {
      try {
        const result = await cancelOrderAndRestoreStock(
          Number((ord as any).id),
          { type: "SYSTEM" },
          "Pesanan dibatalkan otomatis oleh sistem karena telah melewati batas waktu pembayaran."
        );
        if (result.success && !result.alreadyCancelled) sweptCount += 1;
      } catch (err) {
        console.error(`[sweepExpiredOrders] error for order #${(ord as any).id}`, err);
      }
    }

    if (sweptCount > 0) {
      console.log(`[sweepExpiredOrders] Swept and cancelled ${sweptCount} expired unpaid orders.`);
    }

    return sweptCount;
  } catch (error) {
    console.error("[sweepExpiredOrders] unhandled error", error);
    return 0;
  }
};

