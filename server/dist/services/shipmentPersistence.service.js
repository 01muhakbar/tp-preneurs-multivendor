import { Shipment, TrackingEvent } from "../models/index.js";
import { isMultistoreShipmentMvpEnabled } from "./featureFlags.service.js";
const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const getAttr = (row, key) => row?.getDataValue?.(key) ?? row?.get?.(key) ?? row?.dataValues?.[key];
const buildShippingRateSnapshot = (group) => ({
    source: "CHECKOUT_MVP_FALLBACK",
    courierCode: null,
    courierService: null,
    amount: Math.max(0, toNumber(group.shippingAmount, 0)),
    storeId: toNumber(group.storeId, 0) || null,
    storeName: String(group.storeName || "").trim() || null,
    storeSlug: String(group.storeSlug || "").trim() || null,
});
const buildInitialTrackingEvent = (shipment) => ({
    shipmentId: toNumber(getAttr(shipment, "id"), 0),
    eventType: "WAITING_PAYMENT",
    eventLabel: "Waiting Payment",
    eventDescription: "Shipment record was created during checkout and stays blocked until payment is ready.",
    occurredAt: getAttr(shipment, "createdAt") || new Date(),
    source: "SYSTEM",
    actorType: "SYSTEM",
    actorId: null,
    metadata: {
        reason: "CHECKOUT_CREATE",
        suborderId: toNumber(getAttr(shipment, "suborderId"), 0) || null,
        orderId: toNumber(getAttr(shipment, "orderId"), 0) || null,
    },
});
export const createCheckoutShipmentForSuborder = async (input) => {
    if (!isMultistoreShipmentMvpEnabled())
        return null;
    const orderId = toNumber(getAttr(input.order, "id"), 0);
    const suborderId = toNumber(getAttr(input.suborder, "id"), 0);
    const storeId = toNumber(input.group.storeId, 0);
    if (orderId <= 0 || suborderId <= 0 || storeId <= 0) {
        throw new Error("Invalid checkout shipment context.");
    }
    const sellerUserId = toNumber(getAttr(input.group.store, "ownerUserId"), 0) ||
        toNumber(getAttr(input.group.store, "owner_user_id"), 0) ||
        null;
    const shipment = await Shipment.create({
        orderId,
        suborderId,
        storeId,
        sellerUserId,
        status: "WAITING_PAYMENT",
        courierCode: null,
        courierService: null,
        trackingNumber: null,
        estimatedDelivery: null,
        shippingFee: Math.max(0, toNumber(getAttr(input.suborder, "shippingAmount") ?? input.group.shippingAmount, 0)),
        shippingAddressSnapshot: input.shippingDetails,
        shippingRateSnapshot: buildShippingRateSnapshot(input.group),
    }, { transaction: input.transaction });
    await TrackingEvent.create(buildInitialTrackingEvent(shipment), {
        transaction: input.transaction,
    });
    return shipment;
};
