import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import { Op } from "sequelize";
import sellerPaymentsRouter from "../routes/seller.payments.js";
import {
  sequelize,
  User,
  Store,
  StoreMember,
  Order,
  Suborder,
  Payment,
  PaymentProof,
  PaymentStatusLog,
  OrderCollectionClaim,
  OrderPaymentAttempt,
} from "../models/index.js";
import { sha256Hex } from "../services/duitku/duitkuCallbackParser.service.js";

const logPass = (label: string) => {
  console.log(`[duitku-step7] PASS ${label}`);
};

const prefix = `STEP7-${Date.now()}`;

const getAttr = (row: any, key: string) =>
  row?.getDataValue?.(key) ?? row?.get?.(key) ?? row?.dataValues?.[key];

async function cleanup() {
  const orders = await Order.findAll({
    where: { invoiceNo: { [Op.like]: `${prefix}%` } },
    attributes: ["id"],
  });
  const orderIds = orders.map((row: any) => Number(getAttr(row, "id"))).filter(Boolean);
  const users = await User.findAll({
    where: { email: { [Op.like]: `${prefix.toLowerCase()}%@example.test` } },
    attributes: ["id"],
  });
  const userIds = users.map((row: any) => Number(getAttr(row, "id"))).filter(Boolean);
  const suborders = orderIds.length
    ? await Suborder.findAll({ where: { orderId: { [Op.in]: orderIds } }, attributes: ["id"] })
    : [];
  const suborderIds = suborders.map((row: any) => Number(getAttr(row, "id"))).filter(Boolean);
  const payments = suborderIds.length
    ? await Payment.findAll({ where: { suborderId: { [Op.in]: suborderIds } }, attributes: ["id"] })
    : [];
  const paymentIds = payments.map((row: any) => Number(getAttr(row, "id"))).filter(Boolean);
  const attempts = orderIds.length
    ? await OrderPaymentAttempt.findAll({ where: { orderId: { [Op.in]: orderIds } }, attributes: ["id"] })
    : [];
  const attemptIds = attempts.map((row: any) => Number(getAttr(row, "id"))).filter(Boolean);

  if (orderIds.length) await OrderCollectionClaim.destroy({ where: { orderId: { [Op.in]: orderIds } } });
  if (paymentIds.length) await PaymentStatusLog.destroy({ where: { paymentId: { [Op.in]: paymentIds } } });
  if (paymentIds.length) await PaymentProof.destroy({ where: { paymentId: { [Op.in]: paymentIds } } });
  if (paymentIds.length) await Payment.destroy({ where: { id: { [Op.in]: paymentIds } } });
  if (suborderIds.length) await Suborder.destroy({ where: { id: { [Op.in]: suborderIds } } });
  if (attemptIds.length) await OrderPaymentAttempt.destroy({ where: { id: { [Op.in]: attemptIds } } });
  if (orderIds.length) await Order.destroy({ where: { id: { [Op.in]: orderIds } } });
  if (userIds.length) {
    await StoreMember.destroy({ where: { userId: { [Op.in]: userIds } } });
    await Store.destroy({ where: { ownerUserId: { [Op.in]: userIds } } });
    await User.destroy({ where: { id: { [Op.in]: userIds } } });
  }
}

async function createSellerStore() {
  const seller = await User.create({
    name: `${prefix} Seller`,
    email: `${prefix.toLowerCase()}-seller@example.test`,
    password: "not-a-real-password",
    role: "user",
    status: "active",
  } as any);
  const buyer = await User.create({
    name: `${prefix} Buyer`,
    email: `${prefix.toLowerCase()}-buyer@example.test`,
    password: "not-a-real-password",
    role: "user",
    status: "active",
  } as any);
  const store = await Store.create({
    ownerUserId: Number(getAttr(seller, "id")),
    name: `${prefix} Store`,
    slug: `${prefix.toLowerCase()}-store`,
    status: "ACTIVE",
  } as any);
  return { seller, buyer, store };
}

async function createReviewScenario(input: {
  buyerId: number;
  storeId: number;
  rail: "QRIS_STATIC" | "DUITKU_POP";
  paymentChannel: "QRIS" | "DUITKU";
  paymentType: "QRIS_STATIC" | "DUITKU_POP";
  suffix: string;
}) {
  const order = await Order.create({
    invoiceNo: `${prefix}-${input.suffix}`,
    userId: input.buyerId,
    checkoutMode: "MULTI_STORE",
    subtotalAmount: 150000,
    shippingAmount: 0,
    serviceFeeAmount: 0,
    totalAmount: 150000,
    paymentStatus: "UNPAID",
    paymentMethod: input.paymentChannel,
    status: "pending",
  } as any);
  const suborder = await Suborder.create({
    orderId: Number(getAttr(order, "id")),
    suborderNumber: `${prefix}-SUB-${input.suffix}`,
    storeId: input.storeId,
    subtotalAmount: 150000,
    shippingAmount: 0,
    serviceFeeAmount: 0,
    totalAmount: 150000,
    paymentMethod: input.paymentChannel,
    paymentStatus: "PENDING_CONFIRMATION",
    fulfillmentStatus: "UNFULFILLED",
  } as any);
  const payment = await Payment.create({
    suborderId: Number(getAttr(suborder, "id")),
    storeId: input.storeId,
    paymentChannel: input.paymentChannel,
    paymentType: input.paymentType,
    internalReference: `${prefix}-PAY-${input.suffix}`,
    allocationKey: `${prefix}-ALLOC-${input.suffix}`,
    amount: 150000,
    status: "PENDING_CONFIRMATION",
  } as any);
  const attempt = await OrderPaymentAttempt.create({
    orderId: Number(getAttr(order, "id")),
    provider: "DUITKU",
    status: input.rail === "DUITKU_POP" ? "PENDING" : "FAILED",
    merchantOrderId: `${prefix}-MOR-${input.suffix}`,
    amount: 150000,
    currency: "IDR",
    expiryPeriodMinutes: 60,
    idempotencyKeyHash: sha256Hex(`${prefix}-idem-${input.suffix}`),
    requestFingerprint: sha256Hex(`${prefix}-request-${input.suffix}`),
  } as any);
  await OrderCollectionClaim.create({
    orderId: Number(getAttr(order, "id")),
    rail: input.rail,
    claimState: "CLAIMED",
    claimSource: input.rail === "DUITKU_POP" ? "DUITKU_CREATE_INVOICE" : "QRIS_FALLBACK",
    orderPaymentAttemptId: input.rail === "DUITKU_POP" ? Number(getAttr(attempt, "id")) : null,
  } as any);
  const proof = await PaymentProof.create({
    paymentId: Number(getAttr(payment, "id")),
    uploadedByUserId: input.buyerId,
    proofImageUrl: "https://example.test/proof.jpg",
    senderName: "Buyer",
    senderBankOrWallet: "Wallet",
    transferAmount: 150000,
    transferTime: new Date(),
    reviewStatus: "PENDING",
  } as any);
  return { order, suborder, payment, proof, attempt };
}

async function withServer<T>(sellerUserId: number, callback: (baseUrl: string) => Promise<T>) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.user = { id: sellerUserId, role: "user" };
    next();
  });
  app.use("/api/seller", sellerPaymentsRouter);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.equal(typeof address, "object");
  const port = address && typeof address === "object" ? address.port : 0;
  try {
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function patchReview(baseUrl: string, paymentId: number, action: "APPROVE" | "REJECT") {
  const response = await fetch(`${baseUrl}/api/seller/payments/${paymentId}/review`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, note: `${prefix} ${action}` }),
  });
  return {
    status: response.status,
    json: (await response.json()) as any,
  };
}

async function main() {
  await sequelize.authenticate();
  await cleanup();

  try {
    const { seller, buyer, store } = await createSellerStore();
    const sellerId = Number(getAttr(seller, "id"));
    const buyerId = Number(getAttr(buyer, "id"));
    const storeId = Number(getAttr(store, "id"));
    const qris = await createReviewScenario({
      buyerId,
      storeId,
      rail: "QRIS_STATIC",
      paymentChannel: "QRIS",
      paymentType: "QRIS_STATIC",
      suffix: "QRIS",
    });
    const blockedByDuitku = await createReviewScenario({
      buyerId,
      storeId,
      rail: "DUITKU_POP",
      paymentChannel: "QRIS",
      paymentType: "QRIS_STATIC",
      suffix: "BLOCKED",
    });
    await createReviewScenario({
      buyerId,
      storeId,
      rail: "DUITKU_POP",
      paymentChannel: "DUITKU",
      paymentType: "DUITKU_POP",
      suffix: "DUITKU-LIST",
    });

    await withServer(sellerId, async (baseUrl) => {
      const listResponse = await fetch(
        `${baseUrl}/api/seller/stores/${storeId}/payment-review/suborders?paymentStatus=PENDING_CONFIRMATION`
      );
      assert.equal(listResponse.status, 200);
      const listJson = (await listResponse.json()) as any;
      const items = listJson.data?.items ?? [];
      assert.equal(
        items.some((item: any) => item.payment?.paymentChannel === "DUITKU"),
        false
      );
      assert.equal(items.some((item: any) => item.suborderNumber.includes("DUITKU-LIST")), false);
      logPass("seller review list excludes Duitku allocations");

      const approved = await patchReview(baseUrl, Number(getAttr(qris.payment, "id")), "APPROVE");
      assert.equal(approved.status, 200);
      assert.equal(approved.json.success, true);
      await qris.payment.reload();
      await qris.proof.reload();
      assert.equal(getAttr(qris.payment, "status"), "PAID");
      assert.equal(getAttr(qris.proof, "reviewStatus"), "APPROVED");
      logPass("seller QRIS approval route uses shared service");

      const blocked = await patchReview(
        baseUrl,
        Number(getAttr(blockedByDuitku.payment, "id")),
        "APPROVE"
      );
      assert.equal(blocked.status, 409);
      assert.equal(blocked.json.code, "COLLECTION_CLAIM_MISMATCH");
      await blockedByDuitku.payment.reload();
      await blockedByDuitku.proof.reload();
      assert.equal(getAttr(blockedByDuitku.payment, "status"), "PENDING_CONFIRMATION");
      assert.equal(getAttr(blockedByDuitku.proof, "reviewStatus"), "PENDING");
      logPass("seller QRIS approval route blocks Duitku-claimed order");
    });
  } finally {
    await cleanup();
    await sequelize.close().catch(() => null);
  }

  console.log("[duitku-step7] DONE");
}

main().catch((error) => {
  console.error("[duitku-step7] FAIL", error);
  process.exitCode = 1;
});
