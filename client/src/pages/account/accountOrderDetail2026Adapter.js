import { getBuyerShipmentPresentation } from "../../utils/buyerShipmentPresentation.js";
import { getGroupedPaymentReadModel } from "../../utils/groupedPaymentReadModel.ts";
import {
  getFirstEnabledOrderContractAction,
  getOrderContractSummary,
} from "../../utils/orderContract.ts";
import { getOrderTruthStatus } from "../../utils/orderTruth.js";
import { getOrderItemVariantLines } from "../../utils/orderVariantPresentation.js";
import { resolvePublicOrderReference } from "../../utils/publicOrderReference.js";
import { normalizeShipmentList } from "../../utils/shipmentReadModel.ts";
import {
  getSplitOperationalBuyerAction,
  getSplitOperationalPayment,
  getSplitOperationalShipment,
  getSplitOperationalStatusSummary,
} from "../../utils/splitOperationalTruth.ts";

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const text = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const normalizeTone = (value) => {
  const tone = text(value, "stone").toLowerCase();
  return [
    "emerald",
    "amber",
    "sky",
    "teal",
    "indigo",
    "rose",
    "orange",
    "stone",
  ].includes(tone)
    ? tone
    : "stone";
};

const normalizeStatus = (code, meta, fallbackLabel = "Unknown") => {
  const source = asObject(meta);
  const normalizedCode = text(source.code || code, "UNKNOWN").toUpperCase();
  return {
    code: normalizedCode,
    label: text(source.label, fallbackLabel || normalizedCode),
    tone: normalizeTone(source.tone),
    description: text(source.description),
    isFinal: Boolean(source.isFinal),
  };
};

const normalizeItem = (value, index) => {
  const item = asObject(value);
  const quantity = asNumber(item.quantity ?? item.qty, 0);
  const unitPrice = asNumber(item.price ?? item.unitPrice, 0);
  return {
    id: item.id ?? item.productId ?? index,
    productId: item.productId ?? item.product?.id ?? null,
    name: text(item.name || item.productName || item.product?.name, "Product"),
    image: text(item.imageUrl || item.image),
    quantity,
    unitPrice,
    lineTotal: asNumber(item.lineTotal, 0),
    variantLines: getOrderItemVariantLines(item),
  };
};

const normalizeShipment = (value, index) => {
  const shipment = asObject(value);
  const presentation = getBuyerShipmentPresentation(
    shipment.shipmentStatus,
    shipment.shipmentStatusMeta
  );
  const events = asArray(shipment.trackingEvents).map((eventValue, eventIndex) => {
    const event = asObject(eventValue);
    return {
      id: event.eventId ?? `${index}-${eventIndex}`,
      status: normalizeStatus(
        event.status,
        event.statusMeta,
        text(event.status, "Shipment update")
      ),
      note: text(event.note || event.statusMeta?.description, "Shipment updated."),
      happenedAt: event.happenedAt || null,
    };
  });

  return {
    id: shipment.shipmentId ?? shipment.suborderId ?? index,
    storeName: text(shipment.storeName, "Store shipment"),
    suborderNumber: text(shipment.suborderNumber, "Shipment"),
    source: shipment.usedLegacyFallback ? "Legacy fallback" : "Persisted shipment",
    courier: text(
      shipment.courierService || shipment.courierCode,
      "Pending assignment"
    ),
    trackingNumber: text(shipment.trackingNumber, "Not assigned"),
    shippingFee: asNumber(shipment.shippingFee, 0),
    status: normalizeStatus(
      shipment.shipmentStatus,
      {
        ...asObject(shipment.shipmentStatusMeta),
        label: presentation.label,
        tone: presentation.tone,
        description: presentation.description,
      },
      presentation.label
    ),
    events,
  };
};

const normalizeStoreGroup = (value, index) => {
  const group = asObject(value);
  const payment = getSplitOperationalPayment(group);
  const shipment = getSplitOperationalShipment(group);
  const summary = asObject(getSplitOperationalStatusSummary(group));
  const buyerShipment = getBuyerShipmentPresentation(
    shipment.status,
    shipment.statusMeta
  );
  const groupedPayment = getGroupedPaymentReadModel(group);

  return {
    id: group.suborderId ?? group.storeId ?? index,
    storeName: text(group.storeName, "Store"),
    storeSlug: text(group.storeSlug),
    suborderNumber: text(group.suborderNumber, "Legacy split"),
    totalAmount: asNumber(group.totalAmount, 0),
    itemCount: asArray(group.items).length,
    merchantName: text(
      group.payment?.merchantName || group.merchantName,
      "Not provided"
    ),
    accountLabel: text(
      group.payment?.accountName || group.accountName,
      "Not provided"
    ),
    paymentMethod: text(group.paymentMethod || group.payment?.paymentChannel, "-"),
    status: normalizeStatus(
      summary.code || group.paymentStatus,
      summary,
      text(summary.label, "Store status")
    ),
    paymentStatus: normalizeStatus(
      payment.status || groupedPayment.status,
      payment.statusMeta || groupedPayment.statusMeta,
      text(payment.status, "Payment")
    ),
    shipmentStatus: normalizeStatus(
      shipment.status,
      {
        ...asObject(shipment.statusMeta),
        label: buyerShipment.label,
        tone: buyerShipment.tone,
        description: buyerShipment.description,
      },
      buyerShipment.label
    ),
    items: asArray(group.items).map(normalizeItem),
    buyerActions: ["SUBMIT_PAYMENT_PROOF", "CANCEL_PAYMENT"]
      .map((code) => getSplitOperationalBuyerAction(group, code))
      .filter(Boolean)
      .map((action) => ({
        code: text(action.code).toUpperCase(),
        label: text(action.label, "Payment action"),
        enabled: Boolean(action.enabled),
        reason: text(action.reason),
      })),
  };
};

export const normalizeOrderDetailFor2026 = ({ order, payment }) => {
  const source = asObject(order);
  const grouped = asObject(payment);
  const id = source.id ?? grouped.orderId ?? null;
  const contract = asObject(grouped.contract || source.contract);
  const contractSummary = getOrderContractSummary(contract);
  const truthStatus = getOrderTruthStatus(
    Object.keys(contract).length ? { ...source, contract } : source
  );
  const paymentMeta = asObject(grouped.paymentStatusMeta || source.paymentStatusMeta);
  const shipmentMeta = asObject(grouped.shippingStatusMeta || source.shippingStatusMeta);
  const paymentEntry = asObject(grouped.paymentEntry || source.paymentEntry);
  const continuePaymentAction = getFirstEnabledOrderContractAction(contract, [
    "CONTINUE_PAYMENT",
    "CONTINUE_STRIPE_PAYMENT",
  ]);
  const groups = asArray(grouped.groups).map(normalizeStoreGroup);
  const hasEnabledSplitPaymentAction = groups.some((group) =>
    group.buyerActions.some((action) => action.enabled)
  );
  const paymentPath =
    (paymentEntry.visible && text(paymentEntry.targetPath)) ||
    text(continuePaymentAction?.targetPath) ||
    (id && hasEnabledSplitPaymentAction
      ? `/user/my-orders/${encodeURIComponent(String(id))}/payment`
      : null);
  const reference =
    resolvePublicOrderReference(
      source.invoiceNo,
      source.ref,
      grouped.invoiceNo,
      grouped.ref
    ) || (id ? `#${id}` : "Order");
  const shipments = normalizeShipmentList(grouped.shipments || source.shipments).map(
    normalizeShipment
  );
  const summary = asObject(grouped.summary);

  return {
    id,
    reference,
    placedAt: source.createdAt || grouped.createdAt || null,
    checkoutMode: text(source.checkoutMode || grouped.checkoutMode, "LEGACY")
      .toUpperCase()
      .replaceAll("_", " "),
    paymentMethod: text(source.paymentMethod || grouped.paymentMethod, "-"),
    totals: {
      subtotal: asNumber(
        source.subtotal ?? source.subtotalAmount ?? summary.subtotalAmount,
        0
      ),
      shipping: asNumber(
        source.shipping ?? source.shippingAmount ?? summary.shippingAmount,
        0
      ),
      discount: asNumber(source.discount ?? source.discountAmount, 0),
      total: asNumber(
        source.totalAmount ?? source.total ?? source.grandTotal ?? summary.grandTotal,
        0
      ),
    },
    orderStatus: normalizeStatus(
      contractSummary?.code || source.status || grouped.orderStatus,
      contractSummary || truthStatus,
      text(contractSummary?.label || truthStatus.label, "Unknown")
    ),
    paymentStatus: normalizeStatus(
      grouped.paymentStatus || source.paymentStatus,
      paymentMeta,
      text(paymentMeta.label, "Payment")
    ),
    shipmentStatus: normalizeStatus(
      grouped.shippingStatus || source.shippingStatus,
      shipmentMeta,
      text(shipmentMeta.label, "Shipment")
    ),
    paymentSummary: text(
      paymentEntry.summaryLabel ||
        contract.paymentActionability?.reason ||
        contractSummary?.description
    ),
    shipments,
    stores: groups,
    items: asArray(source.items).map(normalizeItem),
    paymentAction: paymentPath
      ? {
          label: text(
            paymentEntry.label || continuePaymentAction?.label,
            "Manage Payment"
          ),
          path: paymentPath,
        }
      : null,
    availableActions: asArray(contract.availableActions).map((actionValue) => {
      const action = asObject(actionValue);
      return {
        code: text(action.code).toUpperCase(),
        label: text(action.label, "Order action"),
        enabled: Boolean(action.enabled),
        reason: text(action.reason),
        targetPath: text(action.targetPath),
      };
    }),
  };
};
