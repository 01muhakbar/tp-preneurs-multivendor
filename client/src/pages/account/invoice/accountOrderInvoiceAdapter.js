import { formatCurrency } from "../../../utils/format.js";

const asObject = (value) => (value && typeof value === "object" && !Array.isArray(value) ? value : {});
const asArray = (value) => (Array.isArray(value) ? value : []);
const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const text = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};
const normalizeCode = (value, fallback = "UNKNOWN") =>
  text(value, fallback).toUpperCase().replace(/\s+/g, "_");

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

// Generates monogram letters from store name
const getMonogram = (name) => {
  const parts = text(name, "S").split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return "S";
};

// Normalize store identity
const getStoreIdentity = (source, groupIndex = 0) => {
  const name = text(source.storeName || source.merchantName, `Store ${groupIndex + 1}`);
  return {
    id: source.storeId || source.id || `store-${groupIndex}`,
    name,
    logoUrl: text(source.storeLogoUrl || source.logoUrl || source.imageUrl),
    monogram: getMonogram(name),
    merchantBadge: source.isPremium ? "Premium Merchant" : source.merchantType || "Merchant",
  };
};

export const buildAccountOrderInvoiceModel = ({ order, groupedOrder, user }) => {
  const source = asObject(order);
  const grouped = asObject(groupedOrder);
  const userProfile = asObject(user);

  const reference = text(source.invoiceNo || source.orderRef || source.reference || source.id || grouped.orderId, "Pending ID");
  const placedAt = source.createdAt || grouped.createdAt;
  const paidAt = grouped.paidAt || source.paidAt || null;

  // Status mapping
  const statusCode = normalizeCode(source.status || grouped.orderStatus, "PENDING");
  const isDelivered = /DELIVERED|COMPLETE/.test(statusCode);
  const invoiceStatus = {
    label: titleCase(statusCode),
    tone: isDelivered ? "success" : "blue",
    isDelivered,
  };

  // Timeline for Progress Tracker
  const shipments = asArray(grouped.shipments || source.shipments);
  const rawTimeline = shipments.flatMap(s => asArray(s.trackingEvents || s.timeline));
  
  const progressTracker = [
    { label: "Placed", done: Boolean(placedAt), time: formatDateTime(placedAt) },
    { label: "Paid", done: Boolean(paidAt), time: formatDateTime(paidAt) },
    { label: "Packed", done: rawTimeline.some(e => /PACKED/.test(normalizeCode(e.status))), time: "-" },
    { label: "Shipped", done: rawTimeline.some(e => /SHIPPED/.test(normalizeCode(e.status))), time: "-" },
    { label: "Delivered", done: isDelivered, time: isDelivered ? formatDateTime(source.updatedAt || grouped.updatedAt) : "-" }
  ];

  // Addresses & Customer
  const customerName = text(source.customerName || source.customer?.name || userProfile.name || userProfile.displayName, "Customer");
  const customerEmail = text(source.customerEmail || source.customer?.email || userProfile.email, "-");
  const customerPhone = text(source.customerPhone || source.customer?.phone || userProfile.phone, "-");
  const address = text(source.customerAddress || source.customer?.address || source.shippingAddress, "Address not provided");

  // Groups/Splits
  const groupsSource = asArray(grouped.groups).length ? asArray(grouped.groups) : asArray(source.storeSplits);
  const isMultiStore = groupsSource.length > 1;
  const storeBreakdown = groupsSource.length ? groupsSource.map((group, i) => {
    return {
      identity: getStoreIdentity(group, i),
      suborderNumber: text(group.suborderNumber || group.suborderId, "Split"),
      status: titleCase(group.status || group.fulfillmentStatus || group.shippingStatus || "Pending"),
      paymentStatus: titleCase(group.paymentStatus || "Pending"),
      shipmentStatus: titleCase(group.shippingStatus || group.fulfillmentStatus || "Pending"),
      total: formatCurrency(asNumber(group.totalAmount)),
    };
  }) : [{ identity: getStoreIdentity(source), status: invoiceStatus.label }];
  
  const mainIdentity = storeBreakdown[0].identity; // Fallback for single store view

  // Items
  const allItems = storeBreakdown.length && asArray(groupsSource[0]?.items).length 
    ? groupsSource.flatMap(g => asArray(g.items)) 
    : asArray(source.items || source.lineItems || source.orderItems);

  const itemsList = allItems.map(item => {
    const qty = asNumber(item.quantity || item.qty);
    const unitPrice = asNumber(item.unitPrice || item.price || item.priceSnapshot);
    const variantLines = asArray(item.variantLines || item.variants || item.productVariants).join(" / ") || "Standard option";
    return {
      id: item.id || item.productId,
      image: text(item.imageUrl || item.image),
      name: text(item.name || item.productName || item.product?.name, "Product"),
      variation: variantLines,
      qty,
      unitPrice: formatCurrency(unitPrice),
      total: formatCurrency(qty * unitPrice)
    };
  });

  // Summary
  const summarySource = asObject(grouped.summary);
  const subtotal = asNumber(source.subtotal || source.subtotalAmount || summarySource.subtotalAmount);
  const shipping = asNumber(source.shipping || source.shippingAmount || summarySource.shippingAmount);
  const discount = asNumber(source.discount || source.discountAmount || summarySource.discountAmount);
  const serviceFee = asNumber(source.serviceFee || source.serviceFeeAmount || summarySource.serviceFeeAmount);
  const total = asNumber(source.totalAmount || source.total || source.grandTotal || summarySource.grandTotal);
  const paymentMethod = text(source.paymentMethod || grouped.paymentMethod || "QRIS");

  // Primary Shipment (for page 2)
  const primaryShipment = shipments[0] ? asObject(shipments[0]) : null;

  return {
    meta: {
      orderId: reference,
      invoiceDate: formatDateTime(source.createdAt || new Date()),
      paymentDate: paidAt ? formatDateTime(paidAt) : "Pending",
      status: invoiceStatus,
      isMultiStore,
      orderType: "Standard" // Fallback
    },
    progressTracker,
    customer: {
      name: customerName,
      monogram: getMonogram(customerName),
      email: customerEmail,
      phone: customerPhone
    },
    addresses: {
      billing: address, // In many e-commerce, billing and shipping match if not separated
      shipping: address
    },
    primaryIdentity: mainIdentity,
    storeBreakdown,
    shipment: {
      courier: text(primaryShipment?.courierService || primaryShipment?.courierCode, "Pending"),
      trackingNo: text(primaryShipment?.trackingNumber, "Not assigned"),
      deliveredOn: primaryShipment?.deliveredOn ? formatDateTime(primaryShipment.deliveredOn) : "Pending",
      source: text(primaryShipment?.source, "Persisted shipment"),
      service: text(primaryShipment?.serviceLevel, "Standard"),
      timeline: rawTimeline.map((t, index) => ({
        id: `tl-${index}`,
        label: titleCase(t.status || t.eventType),
        time: formatDateTime(t.happenedAt || t.occurredAt),
        tone: "blue"
      }))
    },
    items: itemsList,
    payment: {
      method: paymentMethod,
      subtotal: formatCurrency(subtotal),
      shipping: formatCurrency(shipping),
      serviceFee: formatCurrency(serviceFee),
      discount: discount > 0 ? `- ${formatCurrency(discount)}` : formatCurrency(0),
      total: formatCurrency(total),
      itemCount: itemsList.length
    },
    notes: {
      buyerNote: text(source.note || source.buyerNote, "No notes provided."),
    }
  };
};

function titleCase(str) {
  if (!str) return "Unknown";
  return str.toLowerCase().replace(/[_-]+/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}
