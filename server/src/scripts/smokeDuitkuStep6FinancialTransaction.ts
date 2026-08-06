import assert from "node:assert/strict";
import { Op } from "sequelize";
import {
  sequelize,
  User,
  Store,
  Order,
  Suborder,
  Payment,
  PaymentProof,
  PaymentStatusLog,
  OrderCollectionClaim,
  OrderPaymentAttempt,
  DuitkuCallbackInbox,
  OrderPaymentAttemptEvent,
} from "../models/index.js";
import { sha256Hex } from "../services/duitku/duitkuCallbackParser.service.js";
import {
  applyDuitkuCallback,
  approveQrisProof,
  DUITKU_FINANCIAL_LOCK_ORDER,
  FinancialTransactionError,
} from "../services/payments/financialTransaction.service.js";

const logPass = (label: string) => {
  console.log(`[duitku-step6] PASS ${label}`);
};

const getAttr = (row: any, key: string) =>
  row?.getDataValue?.(key) ?? row?.get?.(key) ?? row?.dataValues?.[key];

const prefix = `STEP6-${Date.now()}`;

async function cleanup() {
  const orderRows = await Order.findAll({
    where: { invoiceNo: { [Op.like]: `${prefix}%` } },
    attributes: ["id"],
  });
  const orderIds = orderRows.map((row: any) => Number(getAttr(row, "id"))).filter(Boolean);
  const userRows = await User.findAll({
    where: { email: { [Op.like]: `${prefix.toLowerCase()}%@example.test` } },
    attributes: ["id"],
  });
  const userIds = userRows.map((row: any) => Number(getAttr(row, "id"))).filter(Boolean);
  const suborderRows = orderIds.length
    ? await Suborder.findAll({ where: { orderId: { [Op.in]: orderIds } }, attributes: ["id"] })
    : [];
  const suborderIds = suborderRows.map((row: any) => Number(getAttr(row, "id"))).filter(Boolean);
  const paymentRows = suborderIds.length
    ? await Payment.findAll({ where: { suborderId: { [Op.in]: suborderIds } }, attributes: ["id"] })
    : [];
  const paymentIds = paymentRows.map((row: any) => Number(getAttr(row, "id"))).filter(Boolean);
  const attemptRows = orderIds.length
    ? await OrderPaymentAttempt.findAll({ where: { orderId: { [Op.in]: orderIds } }, attributes: ["id"] })
    : [];
  const attemptIds = attemptRows.map((row: any) => Number(getAttr(row, "id"))).filter(Boolean);
  const inboxRows = attemptIds.length
    ? await DuitkuCallbackInbox.findAll({
        where: { paymentAttemptId: { [Op.in]: attemptIds } },
        attributes: ["id"],
      })
    : [];
  const inboxIds = inboxRows.map((row: any) => Number(getAttr(row, "id"))).filter(Boolean);

  if (inboxIds.length) await OrderPaymentAttemptEvent.destroy({ where: { callbackInboxId: { [Op.in]: inboxIds } } });
  if (attemptIds.length) await OrderPaymentAttemptEvent.destroy({ where: { paymentAttemptId: { [Op.in]: attemptIds } } });
  if (inboxIds.length) await DuitkuCallbackInbox.destroy({ where: { id: { [Op.in]: inboxIds } } });
  if (orderIds.length) await OrderCollectionClaim.destroy({ where: { orderId: { [Op.in]: orderIds } } });
  if (paymentIds.length) await PaymentStatusLog.destroy({ where: { paymentId: { [Op.in]: paymentIds } } });
  if (paymentIds.length) await PaymentProof.destroy({ where: { paymentId: { [Op.in]: paymentIds } } });
  if (paymentIds.length) await Payment.destroy({ where: { id: { [Op.in]: paymentIds } } });
  if (suborderIds.length) await Suborder.destroy({ where: { id: { [Op.in]: suborderIds } } });
  if (attemptIds.length) await OrderPaymentAttempt.destroy({ where: { id: { [Op.in]: attemptIds } } });
  if (orderIds.length) await Order.destroy({ where: { id: { [Op.in]: orderIds } } });
  if (userIds.length) {
    await Store.destroy({ where: { ownerUserId: { [Op.in]: userIds } } });
    await User.destroy({ where: { id: { [Op.in]: userIds } } });
  }
}

async function createBaseOrder(rail: "DUITKU_POP" | "QRIS_STATIC") {
  const suffix = `${rail}-${Math.random().toString(36).slice(2, 8)}`;
  const buyer = await User.create({
    name: `${prefix} Buyer ${suffix}`,
    email: `${prefix.toLowerCase()}-${suffix}-buyer@example.test`,
    password: "not-a-real-password",
    role: "user",
    status: "active",
  } as any);
  const seller = await User.create({
    name: `${prefix} Seller ${suffix}`,
    email: `${prefix.toLowerCase()}-${suffix}-seller@example.test`,
    password: "not-a-real-password",
    role: "user",
    status: "active",
  } as any);
  const store = await Store.create({
    ownerUserId: Number(getAttr(seller, "id")),
    name: `${prefix} Store ${suffix}`,
    slug: `${prefix.toLowerCase()}-${suffix}`,
    status: "ACTIVE",
  } as any);
  const order = await Order.create({
    invoiceNo: `${prefix}-${suffix}`,
    userId: Number(getAttr(buyer, "id")),
    checkoutMode: "MULTI_STORE",
    subtotalAmount: 150000,
    shippingAmount: 0,
    serviceFeeAmount: 0,
    totalAmount: 150000,
    paymentStatus: "UNPAID",
    paymentMethod: rail === "DUITKU_POP" ? "DUITKU" : "QRIS",
    status: "pending",
  } as any);
  const suborder = await Suborder.create({
    orderId: Number(getAttr(order, "id")),
    suborderNumber: `${prefix}-SUB-${suffix}`,
    storeId: Number(getAttr(store, "id")),
    subtotalAmount: 150000,
    shippingAmount: 0,
    serviceFeeAmount: 0,
    totalAmount: 150000,
    paymentMethod: rail === "DUITKU_POP" ? "DUITKU" : "QRIS",
    paymentStatus: rail === "DUITKU_POP" ? "UNPAID" : "PENDING_CONFIRMATION",
    fulfillmentStatus: "UNFULFILLED",
  } as any);
  const payment = await Payment.create({
    suborderId: Number(getAttr(suborder, "id")),
    storeId: Number(getAttr(store, "id")),
    paymentChannel: rail === "DUITKU_POP" ? "DUITKU" : "QRIS",
    paymentType: rail === "DUITKU_POP" ? "DUITKU_POP" : "QRIS_STATIC",
    internalReference: `${prefix}-PAY-${suffix}`,
    allocationKey: `${prefix}-ALLOC-${suffix}`,
    amount: 150000,
    status: rail === "DUITKU_POP" ? "CREATED" : "PENDING_CONFIRMATION",
  } as any);

  return { buyer, seller, store, order, suborder, payment, suffix };
}

async function createDuitkuScenario() {
  const base = await createBaseOrder("DUITKU_POP");
  const merchantOrderId = `${prefix}-MOR-${base.suffix}`;
  const attempt = await OrderPaymentAttempt.create({
    orderId: Number(getAttr(base.order, "id")),
    provider: "DUITKU",
    status: "PENDING",
    merchantOrderId,
    providerReference: `${prefix}-REF-${base.suffix}`,
    paymentUrl: "https://example.test/duitku",
    amount: 150000,
    currency: "IDR",
    expiryPeriodMinutes: 60,
    idempotencyKeyHash: sha256Hex(`${prefix}-idem-${base.suffix}`),
    requestFingerprint: sha256Hex(`${prefix}-request-${base.suffix}`),
  } as any);
  await base.payment.update({ paidByOrderPaymentAttemptId: Number(getAttr(attempt, "id")) } as any);
  await OrderCollectionClaim.create({
    orderId: Number(getAttr(base.order, "id")),
    rail: "DUITKU_POP",
    claimState: "CLAIMED",
    claimSource: "DUITKU_CREATE_INVOICE",
    orderPaymentAttemptId: Number(getAttr(attempt, "id")),
  } as any);
  const inbox = await DuitkuCallbackInbox.create({
    paymentAttemptId: Number(getAttr(attempt, "id")),
    merchantCodeRaw: "D123",
    merchantOrderIdRaw: merchantOrderId,
    providerReferenceRaw: `${prefix}-REF-${base.suffix}`,
    amountRaw: "150000",
    resultCodeRaw: "00",
    signatureState: "VALID",
    bindingState: "BOUND",
    processingResult: "QUARANTINED",
    occurrenceKey: sha256Hex(`${prefix}-occ-${base.suffix}`),
    eventHash: sha256Hex(`${prefix}-event-${base.suffix}`),
    rawBodyDigest: sha256Hex(`${prefix}-raw-${base.suffix}`),
    fieldValuesDigest: sha256Hex(`${prefix}-fields-${base.suffix}`),
  } as any);
  return { ...base, attempt, inbox };
}

async function createQrisScenario(claimRail: "DUITKU_POP" | "QRIS_STATIC") {
  const base = await createBaseOrder("QRIS_STATIC");
  const attempt = await OrderPaymentAttempt.create({
    orderId: Number(getAttr(base.order, "id")),
    provider: "DUITKU",
    status: claimRail === "DUITKU_POP" ? "PENDING" : "FAILED",
    merchantOrderId: `${prefix}-QRIS-MOR-${base.suffix}`,
    amount: 150000,
    currency: "IDR",
    expiryPeriodMinutes: 60,
    idempotencyKeyHash: sha256Hex(`${prefix}-qris-idem-${base.suffix}`),
    requestFingerprint: sha256Hex(`${prefix}-qris-request-${base.suffix}`),
  } as any);
  await OrderCollectionClaim.create({
    orderId: Number(getAttr(base.order, "id")),
    rail: claimRail,
    claimState: "CLAIMED",
    claimSource: claimRail === "DUITKU_POP" ? "DUITKU_CREATE_INVOICE" : "QRIS_FALLBACK",
    orderPaymentAttemptId: claimRail === "DUITKU_POP" ? Number(getAttr(attempt, "id")) : null,
  } as any);
  const proof = await PaymentProof.create({
    paymentId: Number(getAttr(base.payment, "id")),
    uploadedByUserId: Number(getAttr(base.buyer, "id")),
    proofImageUrl: "https://example.test/proof.jpg",
    senderName: "Buyer",
    senderBankOrWallet: "Wallet",
    transferAmount: 150000,
    transferTime: new Date(),
    reviewStatus: "PENDING",
  } as any);
  return { ...base, attempt, proof };
}

async function main() {
  await sequelize.authenticate();
  await cleanup();

  try {
    assert.deepEqual(DUITKU_FINANCIAL_LOCK_ORDER, [
      "ORDER",
      "CLAIM",
      "ATTEMPT",
      "SUBORDERS",
      "PAYMENTS",
      "EVIDENCE",
    ]);
    logPass("declared lock order");

    const duitku = await createDuitkuScenario();
    const duitkuTrace: string[] = [];
    const paidResult = await applyDuitkuCallback({
      callbackInboxId: Number(getAttr(duitku.inbox, "id")),
      lockTrace: (step) => duitkuTrace.push(step),
    });
    assert.equal(paidResult.action, "APPLIED_PAID");
    assert.deepEqual(duitkuTrace, DUITKU_FINANCIAL_LOCK_ORDER);
    await duitku.order.reload();
    await duitku.suborder.reload();
    await duitku.payment.reload();
    await duitku.attempt.reload();
    assert.equal(getAttr(duitku.order, "paymentStatus"), "PAID");
    assert.equal(getAttr(duitku.suborder, "paymentStatus"), "PAID");
    assert.equal(getAttr(duitku.payment, "status"), "PAID");
    assert.equal(getAttr(duitku.attempt, "status"), "PAID");
    logPass("Duitku paid callback applies via shared lock order");

    const idempotent = await applyDuitkuCallback({
      callbackInboxId: Number(getAttr(duitku.inbox, "id")),
    });
    assert.equal(idempotent.idempotent, true);
    assert.equal(idempotent.action, "IDEMPOTENT");
    logPass("duplicate Duitku callback is idempotent");

    const blockedQris = await createQrisScenario("DUITKU_POP");
    await assert.rejects(
      () =>
        approveQrisProof({
          paymentId: Number(getAttr(blockedQris.payment, "id")),
          proofId: Number(getAttr(blockedQris.proof, "id")),
          actorUserId: Number(getAttr(blockedQris.seller, "id")),
        }),
      (error: any) =>
        error instanceof FinancialTransactionError && error.code === "COLLECTION_CLAIM_MISMATCH"
    );
    logPass("QRIS proof approval is blocked by Duitku claim");

    const qris = await createQrisScenario("QRIS_STATIC");
    const qrisTrace: string[] = [];
    const qrisResult = await approveQrisProof({
      paymentId: Number(getAttr(qris.payment, "id")),
      proofId: Number(getAttr(qris.proof, "id")),
      actorUserId: Number(getAttr(qris.seller, "id")),
      lockTrace: (step) => qrisTrace.push(step),
    });
    assert.equal(qrisResult.action, "APPLIED_QRIS_APPROVED");
    assert.deepEqual(qrisTrace, DUITKU_FINANCIAL_LOCK_ORDER);
    await qris.payment.reload();
    await qris.suborder.reload();
    await qris.proof.reload();
    assert.equal(getAttr(qris.payment, "status"), "PAID");
    assert.equal(getAttr(qris.suborder, "paymentStatus"), "PAID");
    assert.equal(getAttr(qris.proof, "reviewStatus"), "APPROVED");
    logPass("QRIS proof approval applies only under QRIS claim");
  } finally {
    await cleanup();
    await sequelize.close().catch(() => null);
  }

  console.log("[duitku-step6] DONE");
}

main().catch((error) => {
  console.error("[duitku-step6] FAIL", error);
  process.exitCode = 1;
});
