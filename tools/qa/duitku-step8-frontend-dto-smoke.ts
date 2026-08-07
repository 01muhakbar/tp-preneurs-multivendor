import assert from "node:assert/strict";
import { normalizeOrderPaymentFor2026 } from "../../client/src/pages/account/accountOrderPayment2026Adapter.js";
import { adaptSeller2026PaymentProof } from "../../client/src/api/seller2026/paymentReview.adapter.ts";

const duitkuBuyer = normalizeOrderPaymentFor2026({
  order: { id: 9001, invoiceNo: "INV-DUITKU-1" },
  payment: null,
  readModel: {
    orderId: 9001,
    invoiceNo: "INV-DUITKU-1",
    paymentStatus: "UNPAID",
    collection: {
      collectionRail: "DUITKU_POP",
      claimState: "CLAIMED",
      attemptStatus: "PENDING",
      callbackState: "NONE",
      paymentUrl: "https://sandbox.duitku.test/payment/abc",
      allocations: [{ paymentId: 71, suborderId: 31, storeId: 5, paymentChannel: "DUITKU", paymentType: "DUITKU_POP", status: "CREATED", amount: 150000 }],
    },
    summary: { grandTotal: 150000, totalItems: 2 },
    groups: [
      {
        suborderId: 31,
        storeId: 5,
        storeName: "Store Duitku",
        totalAmount: 150000,
        paymentStatus: "UNPAID",
        collectionRail: "DUITKU_POP",
        paymentUrl: "https://sandbox.duitku.test/payment/abc",
        callbackState: "NONE",
        payment: {
          id: 71,
          paymentChannel: "DUITKU",
          paymentType: "DUITKU_POP",
          internalReference: "DUITKU-REF",
          amount: 150000,
          status: "CREATED",
        },
      },
    ],
  },
});

assert.equal(duitkuBuyer.primaryPayment?.isHostedRedirect, true);
assert.equal(duitkuBuyer.primaryPayment?.paymentUrl, "https://sandbox.duitku.test/payment/abc");
assert.equal(duitkuBuyer.actions.canConfirmTransfer, false);
assert.equal(duitkuBuyer.canConfirm, false);

const qrisBuyer = normalizeOrderPaymentFor2026({
  order: { id: 9002, invoiceNo: "INV-QRIS-1" },
  payment: null,
  readModel: {
    orderId: 9002,
    invoiceNo: "INV-QRIS-1",
    paymentStatus: "UNPAID",
    groups: [
      {
        suborderId: 32,
        storeId: 6,
        storeName: "Store QRIS",
        totalAmount: 50000,
        paymentStatus: "UNPAID",
        buyerActions: [{ code: "SUBMIT_PAYMENT_PROOF", enabled: true }],
        payment: {
          id: 72,
          paymentChannel: "QRIS",
          paymentType: "QRIS_STATIC",
          internalReference: "QRIS-REF",
          amount: 50000,
          status: "CREATED",
          proofActionability: { canStartProof: true },
        },
      },
    ],
  },
});

assert.equal(qrisBuyer.primaryPayment?.isHostedRedirect, false);
assert.equal(qrisBuyer.actions.canConfirmTransfer, true);

const duitkuSellerRow = adaptSeller2026PaymentProof({
  suborderId: 31,
  suborderNumber: "SO-DUITKU-1",
  orderId: 9001,
  orderNumber: "INV-DUITKU-1",
  storeId: 5,
  storeName: "Store Duitku",
  paymentStatus: "PENDING_CONFIRMATION",
  fulfillmentStatus: "UNFULFILLED",
  totalAmount: 150000,
  buyer: { name: "Buyer", email: "buyer@example.test" },
  items: [],
  collection: {
    collectionRail: "DUITKU_POP",
    claimState: "CLAIMED",
    attemptStatus: "PENDING",
    callbackState: "NONE",
    paymentUrl: "https://sandbox.duitku.test/payment/abc",
  },
  payment: {
    id: 71,
    internalReference: "DUITKU-REF",
    paymentChannel: "DUITKU",
    paymentType: "DUITKU_POP",
    amount: 150000,
    status: "PENDING_CONFIRMATION",
    reviewActionability: { canReview: true },
    proof: {
      id: 11,
      proofImageUrl: "https://example.test/proof.png",
      senderName: "Buyer",
      senderBankOrWallet: "Wallet",
      transferAmount: 150000,
      transferTime: null,
      reviewStatus: "PENDING",
    },
  },
});

assert.equal(duitkuSellerRow.collectionRail, "DUITKU_POP");
assert.equal(duitkuSellerRow.canReview, false);
assert.match(duitkuSellerRow.reviewReason, /callback/i);

const qrisSellerRow = adaptSeller2026PaymentProof({
  suborderId: 32,
  suborderNumber: "SO-QRIS-1",
  orderId: 9002,
  orderNumber: "INV-QRIS-1",
  storeId: 6,
  storeName: "Store QRIS",
  paymentStatus: "PENDING_CONFIRMATION",
  fulfillmentStatus: "UNFULFILLED",
  totalAmount: 50000,
  buyer: { name: "Buyer", email: "buyer@example.test" },
  items: [],
  payment: {
    id: 72,
    internalReference: "QRIS-REF",
    paymentChannel: "QRIS",
    paymentType: "QRIS_STATIC",
    amount: 50000,
    status: "PENDING_CONFIRMATION",
    reviewActionability: { canReview: true },
    proof: {
      id: 12,
      proofImageUrl: "https://example.test/proof.png",
      senderName: "Buyer",
      senderBankOrWallet: "Wallet",
      transferAmount: 50000,
      transferTime: null,
      reviewStatus: "PENDING",
    },
  },
});

assert.equal(qrisSellerRow.collectionRail, "");
assert.equal(qrisSellerRow.canReview, true);

console.log("Duitku Step 8 frontend DTO smoke passed");
