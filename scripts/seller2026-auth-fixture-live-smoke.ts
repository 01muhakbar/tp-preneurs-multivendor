import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { QueryTypes } from "sequelize";
import {
  Attribute,
  Category,
  Coupon,
  Notification,
  Order,
  Payment,
  PaymentProof,
  Product,
  ProductCategory,
  Store,
  StoreAuditLog,
  StoreMember,
  StorePaymentProfile,
  StorePaymentProfileRequest,
  StoreRole,
  Suborder,
  SuborderItem,
  Shipment,
  TrackingEvent,
  User,
  sequelize,
} from "../server/src/models/index.js";
import { ensureSystemStoreRoles } from "../server/src/services/seller/storeRoles.js";
import { createSellerNotification } from "../server/src/services/notification.service.js";

const requireFromServer = createRequire(new URL("../server/package.json", import.meta.url));
const bcrypt = requireFromServer("bcryptjs") as typeof import("bcryptjs");

const PASSWORD = "Password123!";
const CLIENT_URL = String(
  process.env.SELLER2026_CLIENT_BASE_URL || process.env.CLIENT_URL || "http://localhost:5173"
).replace(/\/+$/, "");
const API_URL = String(
  process.env.SELLER2026_API_BASE_URL ||
    process.env.API_URL ||
    process.env.VITE_SERVER_ORIGIN ||
    "http://localhost:3001"
).replace(/\/+$/, "");

type FixtureUser = {
  email: string;
  name: string;
};

const users = {
  owner: { email: "seller.owner@example.test", name: "Seller 2026 Owner" },
  member: { email: "seller.member@example.test", name: "Seller 2026 Order Member" },
  otherOwner: { email: "seller.other@example.test", name: "Other Store Owner" },
  buyer: { email: "seller.buyer@example.test", name: "Buyer Smoke Fixture" },
} satisfies Record<string, FixtureUser>;

const storeSlug = "tp-preneurs-demo-store";
const otherStoreSlug = "other-demo-store";

const dataUrl =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function upsertUser(input: FixtureUser) {
  const password = await bcrypt.hash(PASSWORD, 10);
  const [user, created] = await User.findOrCreate({
    where: { email: input.email },
    defaults: {
      email: input.email,
      name: input.name,
      password,
      role: "customer",
      status: "active",
      isPublished: true,
    } as any,
  });
  if (!created) {
    await user.update({
      name: input.name,
      password,
      role: "customer",
      status: "active",
      isPublished: true,
    } as any);
  }
  return user;
}

async function upsertStore(input: {
  ownerUserId: number;
  slug: string;
  name: string;
}) {
  const existingByOwner = await Store.findOne({ where: { ownerUserId: input.ownerUserId } as any });
  const existingBySlug = await Store.findOne({ where: { slug: input.slug } as any });
  const store = existingByOwner || existingBySlug;
  const payload = {
    ownerUserId: input.ownerUserId,
    slug: input.slug,
    name: input.name,
    status: "ACTIVE",
    description:
      "Deterministic Seller Workspace 2026 smoke fixture with catalog, order, finance, team, and notification data.",
    email: `${input.slug}@example.test`,
    phone: "+628111111111",
    whatsapp: "+628111111111",
    websiteUrl: "https://example.test",
    instagramUrl: "https://instagram.com/tppreneurs",
    tiktokUrl: "https://tiktok.com/@tppreneurs",
    addressLine1: "Jl. Smoke Test No. 26",
    addressLine2: "Fixture District",
    city: "Makassar",
    province: "Sulawesi Selatan",
    postalCode: "90111",
    country: "Indonesia",
    logoUrl: dataUrl,
    bannerUrl: dataUrl,
    shippingSetup: {
      shippingEnabled: true,
      originContactName: "Seller 2026 Warehouse",
      originPhone: "+628111111111",
      originAddressLine1: "Jl. Smoke Test No. 26",
      originDistrict: "Panakkukang",
      originCity: "Makassar",
      originProvince: "Sulawesi Selatan",
      originPostalCode: "90111",
      originCountry: "Indonesia",
      pickupNotes: "QA fixture",
    },
  };

  if (store) {
    await store.update(payload as any);
    return store;
  }
  return Store.create(payload as any);
}

async function roleByCode(code: string) {
  const role = await StoreRole.findOne({ where: { code } as any });
  if (!role) throw new Error(`Missing store role ${code}`);
  return role;
}

async function ensureMember(input: {
  storeId: number;
  userId: number;
  roleCode: string;
  invitedByUserId?: number | null;
}) {
  const role = await roleByCode(input.roleCode);
  const [member, created] = await StoreMember.findOrCreate({
    where: { storeId: input.storeId, userId: input.userId } as any,
    defaults: {
      storeId: input.storeId,
      userId: input.userId,
      storeRoleId: role.id,
      status: "ACTIVE",
      invitedByUserId: input.invitedByUserId ?? null,
      invitedAt: new Date(Date.now() - 7_400_000),
      acceptedAt: new Date(Date.now() - 7_000_000),
    } as any,
  });

  if (!created) {
    await member.update({
      storeRoleId: role.id,
      status: "ACTIVE",
      invitedByUserId: input.invitedByUserId ?? null,
      invitedAt: new Date(Date.now() - 7_400_000),
      acceptedAt: new Date(Date.now() - 7_000_000),
      disabledAt: null,
      disabledByUserId: null,
      removedAt: null,
      removedByUserId: null,
    } as any);
  }
  return member;
}

async function upsertCategory(code: string, name: string, parentId: number | null = null) {
  const [category, created] = await Category.findOrCreate({
    where: { code } as any,
    defaults: { code, name, description: `${name} smoke category`, published: true, parentId } as any,
  });
  if (!created) {
    await category.update({ name, published: true, parentId } as any);
  }
  return category;
}

async function upsertAttribute(input: { name: string; displayName: string; storeId: number; type?: string }) {
  const [attribute, created] = await Attribute.findOrCreate({
    where: { name: input.name, storeId: input.storeId } as any,
    defaults: {
      name: input.name,
      displayName: input.displayName,
      type: input.type || "dropdown",
      published: true,
      scope: "store",
      storeId: input.storeId,
      createdByRole: "seller",
      createdByUserId: null,
      status: "active",
    } as any,
  });
  if (!created) {
    await attribute.update({
      displayName: input.displayName,
      type: input.type || "dropdown",
      published: true,
      scope: "store",
      status: "active",
    } as any);
  }
  return attribute;
}

async function ensureAttributeValues(attributeId: number, values: string[]) {
  try {
    await sequelize.query("SELECT id FROM attribute_values LIMIT 1", { type: QueryTypes.SELECT });
  } catch {
    return [];
  }

  const ids: number[] = [];
  for (const value of values) {
    const rows = await sequelize.query<{ id: number }>(
      "SELECT id FROM attribute_values WHERE attribute_id = ? AND value = ? LIMIT 1",
      { replacements: [attributeId, value], type: QueryTypes.SELECT }
    );
    if (rows[0]?.id) {
      await sequelize.query("UPDATE attribute_values SET status = 'active', updated_at = NOW() WHERE id = ?", {
        replacements: [rows[0].id],
      });
      ids.push(Number(rows[0].id));
      continue;
    }
    await sequelize.query(
      "INSERT INTO attribute_values (attribute_id, value, status, created_at, updated_at) VALUES (?, ?, 'active', NOW(), NOW())",
      { replacements: [attributeId, value] }
    );
    const created = await sequelize.query<{ id: number }>(
      "SELECT id FROM attribute_values WHERE attribute_id = ? AND value = ? LIMIT 1",
      { replacements: [attributeId, value], type: QueryTypes.SELECT }
    );
    if (created[0]?.id) ids.push(Number(created[0].id));
  }
  return ids;
}

async function upsertProduct(input: {
  ownerUserId: number;
  storeId: number;
  categoryId: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number;
  status: "active" | "inactive" | "draft";
  isPublished: boolean;
  sellerSubmissionStatus?: "none" | "submitted" | "needs_revision";
}) {
  const [product, created] = await Product.findOrCreate({
    where: { slug: input.slug } as any,
    defaults: {
      name: input.name,
      slug: input.slug,
      sku: input.sku,
      price: input.price,
      salePrice: Math.max(1000, input.price - 2500),
      stock: input.stock,
      userId: input.ownerUserId,
      storeId: input.storeId,
      categoryId: input.categoryId,
      defaultCategoryId: input.categoryId,
      status: input.status,
      isPublished: input.isPublished,
      sellerSubmissionStatus: input.sellerSubmissionStatus || "none",
      sellerSubmittedAt: input.sellerSubmissionStatus === "submitted" ? new Date() : null,
      sellerSubmittedByUserId: input.sellerSubmissionStatus === "submitted" ? input.ownerUserId : null,
      description: `${input.name} smoke product`,
      promoImagePath: dataUrl,
      imagePaths: [dataUrl],
      tags: ["seller-2026", "smoke"],
      weight: 250,
      condition: "new",
      variations: null,
      wholesale: null,
    } as any,
  });
  if (!created) {
    await product.update({
      name: input.name,
      sku: input.sku,
      price: input.price,
      salePrice: Math.max(1000, input.price - 2500),
      stock: input.stock,
      userId: input.ownerUserId,
      storeId: input.storeId,
      categoryId: input.categoryId,
      defaultCategoryId: input.categoryId,
      status: input.status,
      isPublished: input.isPublished,
      sellerSubmissionStatus: input.sellerSubmissionStatus || "none",
      sellerSubmittedAt: input.sellerSubmissionStatus === "submitted" ? new Date() : null,
      sellerSubmittedByUserId: input.sellerSubmissionStatus === "submitted" ? input.ownerUserId : null,
    } as any);
  }
  await ProductCategory.findOrCreate({
    where: { productId: product.id, categoryId: input.categoryId } as any,
    defaults: { productId: product.id, categoryId: input.categoryId } as any,
  });
  return product;
}

async function upsertPaymentProfile(storeId: number) {
  const [profile, created] = await StorePaymentProfile.findOrCreate({
    where: { storeId, version: 1 } as any,
    defaults: {
      storeId,
      providerCode: "MANUAL_QRIS",
      paymentType: "QRIS_STATIC",
      version: 1,
      snapshotStatus: "ACTIVE",
      accountName: "TP Preneurs Smoke",
      merchantName: "TP Preneurs Demo Store",
      merchantId: "SMOKE-2026",
      qrisImageUrl: dataUrl,
      qrisPayload: "00020101021226680016ID.CO.QRIS.WWW01189360091100202600000215SMOKE2026520400005303360540820266304ABCD",
      instructionText: "Upload proof after transfer.",
      isActive: true,
      verificationStatus: "ACTIVE",
      verifiedAt: new Date(Date.now() - 4_000_000),
      activatedAt: new Date(Date.now() - 3_900_000),
    } as any,
  });
  if (!created) {
    await profile.update({
      snapshotStatus: "ACTIVE",
      accountName: "TP Preneurs Smoke",
      merchantName: "TP Preneurs Demo Store",
      merchantId: "SMOKE-2026",
      qrisImageUrl: dataUrl,
      isActive: true,
      verificationStatus: "ACTIVE",
      verifiedAt: new Date(Date.now() - 4_000_000),
      activatedAt: new Date(Date.now() - 3_900_000),
    } as any);
  }
  await Store.update({ activeStorePaymentProfileId: profile.id } as any, { where: { id: storeId } as any });
  return profile;
}

async function upsertCoupon(input: {
  code: string;
  campaignName: string;
  storeId: number;
  active: boolean;
  startsAt: Date;
  expiresAt: Date;
  discountType?: "percent" | "fixed";
  amount?: number;
}) {
  const [coupon, created] = await Coupon.findOrCreate({
    where: { code: input.code } as any,
    defaults: {
      code: input.code,
      campaignName: input.campaignName,
      discountType: input.discountType || "percent",
      amount: input.amount || 10,
      minSpend: 50000,
      active: input.active,
      scopeType: "STORE",
      storeId: input.storeId,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
    } as any,
  });
  if (!created) {
    await coupon.update({
      campaignName: input.campaignName,
      active: input.active,
      scopeType: "STORE",
      storeId: input.storeId,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      discountType: input.discountType || "percent",
      amount: input.amount || 10,
    } as any);
  }
  return coupon;
}

async function upsertOrderSet(input: {
  buyerId: number;
  storeId: number;
  profileId: number;
  productId: number;
}) {
  const rows = [
    { suffix: "PENDING", paymentStatus: "PENDING_CONFIRMATION", fulfillmentStatus: "UNFULFILLED", orderStatus: "pending" },
    { suffix: "PAID", paymentStatus: "PAID", fulfillmentStatus: "PROCESSING", orderStatus: "processing" },
    { suffix: "SHIP", paymentStatus: "PAID", fulfillmentStatus: "SHIPPED", orderStatus: "shipped" },
    { suffix: "DONE", paymentStatus: "PAID", fulfillmentStatus: "DELIVERED", orderStatus: "delivered" },
    { suffix: "PAYAPPROVE", paymentStatus: "PENDING_CONFIRMATION", fulfillmentStatus: "UNFULFILLED", orderStatus: "pending" },
    { suffix: "PAYREJECT", paymentStatus: "PENDING_CONFIRMATION", fulfillmentStatus: "UNFULFILLED", orderStatus: "pending" },
  ] as const;

  const suborders: any[] = [];
  for (const [index, row] of rows.entries()) {
    const invoiceNo = `SELLER2026-${row.suffix}`;
    const total = 125000 + index * 10000;
    const [order, orderCreated] = await Order.findOrCreate({
      where: { invoiceNo } as any,
      defaults: {
        invoiceNo,
        userId: input.buyerId,
        checkoutMode: "SINGLE_STORE",
        subtotalAmount: total - 10000,
        shippingAmount: 10000,
        serviceFeeAmount: 0,
        paymentStatus: row.paymentStatus === "PAID" ? "PAID" : "UNPAID",
        shippingDetails: {
          fullName: "Buyer Smoke Fixture",
          phoneNumber: "+628222222222",
          province: "Sulawesi Selatan",
          city: "Makassar",
          district: "Panakkukang",
          postalCode: "90111",
          streetName: "Jl. Customer QA",
          houseNumber: "26",
          markAs: "HOME",
        },
        customerName: "Buyer Smoke Fixture",
        customerPhone: "+628222222222",
        customerAddress: "Jl. Customer QA No. 26, Makassar",
        customerNotes: "Seller 2026 smoke fixture",
        paymentMethod: "QRIS",
        couponCode: "SMOKE2026",
        discountAmount: 0,
        totalAmount: total,
        status: row.orderStatus,
      } as any,
    });
    if (!orderCreated) {
      await order.update({
        userId: input.buyerId,
        paymentStatus: row.paymentStatus === "PAID" ? "PAID" : "UNPAID",
        totalAmount: total,
        status: row.orderStatus,
      } as any);
    }

    const suborderNumber = `${invoiceNo}-S1`;
    const [suborder, suborderCreated] = await Suborder.findOrCreate({
      where: { suborderNumber } as any,
      defaults: {
        orderId: order.id,
        suborderNumber,
        storeId: input.storeId,
        storePaymentProfileId: input.profileId,
        subtotalAmount: total - 10000,
        shippingAmount: 10000,
        serviceFeeAmount: 0,
        totalAmount: total,
        paymentMethod: "QRIS",
        paymentStatus: row.paymentStatus,
        fulfillmentStatus: row.fulfillmentStatus,
        paidAt: row.paymentStatus === "PAID" ? new Date(Date.now() - 2_000_000) : null,
        expiresAt: new Date(Date.now() + 86_400_000),
      } as any,
    });
    if (!suborderCreated) {
      await suborder.update({
        orderId: order.id,
        storeId: input.storeId,
        storePaymentProfileId: input.profileId,
        subtotalAmount: total - 10000,
        shippingAmount: 10000,
        totalAmount: total,
        paymentStatus: row.paymentStatus,
        fulfillmentStatus: row.fulfillmentStatus,
        paidAt: row.paymentStatus === "PAID" ? new Date(Date.now() - 2_000_000) : null,
      } as any);
    }

    const staleShipments = await Shipment.findAll({
      where: { suborderId: suborder.id } as any,
      attributes: ["id"],
    });
    const staleShipmentIds = staleShipments.map((shipment: any) => shipment.id).filter(Boolean);
    if (staleShipmentIds.length) {
      await TrackingEvent.destroy({ where: { shipmentId: staleShipmentIds } as any });
    }
    await Shipment.destroy({ where: { suborderId: suborder.id } as any });
    await SuborderItem.destroy({ where: { suborderId: suborder.id } as any });
    await SuborderItem.create({
      suborderId: suborder.id,
      productId: input.productId,
      storeId: input.storeId,
      productNameSnapshot: "Seller 2026 Hero Product",
      skuSnapshot: "S26-HERO",
      variantLabel: "Smoke Variant",
      variantSelections: { color: "Black", size: "M" },
      imageSnapshot: dataUrl,
      priceSnapshot: total - 10000,
      qty: 1,
      totalPrice: total - 10000,
    } as any);

    const [payment, paymentCreated] = await Payment.findOrCreate({
      where: { internalReference: `PAY-${invoiceNo}` } as any,
      defaults: {
        suborderId: suborder.id,
        storeId: input.storeId,
        storePaymentProfileId: input.profileId,
        paymentChannel: "QRIS",
        paymentType: "QRIS_STATIC",
        internalReference: `PAY-${invoiceNo}`,
        externalReference: `EXT-${invoiceNo}`,
        amount: total,
        qrImageUrl: dataUrl,
        qrPayload: "SMOKE-QRIS",
        status: row.paymentStatus === "PAID" ? "PAID" : "PENDING_CONFIRMATION",
        paidAt: row.paymentStatus === "PAID" ? new Date(Date.now() - 2_000_000) : null,
        expiresAt: new Date(Date.now() + 86_400_000),
      } as any,
    });
    if (!paymentCreated) {
      await payment.update({
        suborderId: suborder.id,
        storeId: input.storeId,
        storePaymentProfileId: input.profileId,
        amount: total,
        status: row.paymentStatus === "PAID" ? "PAID" : "PENDING_CONFIRMATION",
        paidAt: row.paymentStatus === "PAID" ? new Date(Date.now() - 2_000_000) : null,
      } as any);
    }

    if (row.paymentStatus === "PENDING_CONFIRMATION") {
      await PaymentProof.destroy({ where: { paymentId: payment.id } as any });
      await PaymentProof.create({
        paymentId: payment.id,
        uploadedByUserId: input.buyerId,
        proofImageUrl: dataUrl,
        senderName: "Buyer Smoke Fixture",
        senderBankOrWallet: "QA Bank",
        transferAmount: total,
        transferTime: new Date(Date.now() - 1_800_000),
        note: "Pending proof for seller review smoke.",
        reviewStatus: "PENDING",
      } as any);
    }
    suborders.push(suborder);
  }
  return suborders;
}

export async function ensureSeller2026AuthSmokeFixture() {
  await sequelize.authenticate();
  await ensureSystemStoreRoles();

  const owner = await upsertUser(users.owner);
  const member = await upsertUser(users.member);
  const otherOwner = await upsertUser(users.otherOwner);
  const buyer = await upsertUser(users.buyer);
  const store = await upsertStore({ ownerUserId: owner.id, slug: storeSlug, name: "TP Preneurs Demo Store" });
  const otherStore = await upsertStore({ ownerUserId: otherOwner.id, slug: otherStoreSlug, name: "Other Demo Store" });

  const ownerMember = await ensureMember({ storeId: store.id, userId: owner.id, roleCode: "STORE_OWNER" });
  const orderMember = await ensureMember({
    storeId: store.id,
    userId: member.id,
    roleCode: "ORDER_MANAGER",
    invitedByUserId: owner.id,
  });
  await ensureMember({ storeId: otherStore.id, userId: otherOwner.id, roleCode: "STORE_OWNER" });

  const fashion = await upsertCategory("S26FASHION", "Seller 2026 Fashion");
  await upsertCategory("S26BEAUTY", "Seller 2026 Beauty");
  await upsertCategory("S26HOME", "Seller 2026 Home Living");

  const color = await upsertAttribute({ storeId: store.id, name: "s26_color", displayName: "Smoke Color" });
  const size = await upsertAttribute({ storeId: store.id, name: "s26_size", displayName: "Smoke Size" });
  await ensureAttributeValues(color.id, ["Black", "White", "Gold"]);
  await ensureAttributeValues(size.id, ["S", "M", "L"]);

  const products = await Promise.all([
    upsertProduct({
      ownerUserId: owner.id,
      storeId: store.id,
      categoryId: fashion.id,
      name: "Seller 2026 Hero Product",
      slug: "seller-2026-hero-product",
      sku: "S26-HERO",
      price: 125000,
      stock: 30,
      status: "active",
      isPublished: true,
    }),
    upsertProduct({
      ownerUserId: owner.id,
      storeId: store.id,
      categoryId: fashion.id,
      name: "Seller 2026 Draft Product",
      slug: "seller-2026-draft-product",
      sku: "S26-DRAFT",
      price: 99000,
      stock: 10,
      status: "draft",
      isPublished: false,
    }),
    upsertProduct({
      ownerUserId: owner.id,
      storeId: store.id,
      categoryId: fashion.id,
      name: "Seller 2026 Submitted Product",
      slug: "seller-2026-submitted-product",
      sku: "S26-SUBMIT",
      price: 155000,
      stock: 8,
      status: "draft",
      isPublished: false,
      sellerSubmissionStatus: "submitted",
    }),
    upsertProduct({
      ownerUserId: owner.id,
      storeId: store.id,
      categoryId: fashion.id,
      name: "Seller 2026 Inactive Product",
      slug: "seller-2026-inactive-product",
      sku: "S26-INACTIVE",
      price: 75000,
      stock: 0,
      status: "inactive",
      isPublished: false,
    }),
  ]);

  const profile = await upsertPaymentProfile(store.id);
  await StorePaymentProfileRequest.destroy({ where: { storeId: store.id } as any });
  const now = Date.now();
  await upsertCoupon({
    code: "SMOKE2026",
    campaignName: "Seller 2026 Active Coupon",
    storeId: store.id,
    active: true,
    startsAt: new Date(now - 86_400_000),
    expiresAt: new Date(now + 7 * 86_400_000),
  });
  await upsertCoupon({
    code: "SCHEDULE2026",
    campaignName: "Seller 2026 Scheduled Coupon",
    storeId: store.id,
    active: true,
    startsAt: new Date(now + 2 * 86_400_000),
    expiresAt: new Date(now + 10 * 86_400_000),
  });
  await upsertCoupon({
    code: "PAUSED2026",
    campaignName: "Seller 2026 Paused Coupon",
    storeId: store.id,
    active: false,
    startsAt: new Date(now - 7 * 86_400_000),
    expiresAt: new Date(now + 7 * 86_400_000),
    discountType: "fixed",
    amount: 15000,
  });

  const suborders = await upsertOrderSet({
    buyerId: buyer.id,
    storeId: store.id,
    profileId: profile.id,
    productId: products[0].id,
  });

  await StoreAuditLog.destroy({ where: { storeId: store.id, action: ["SELLER_MEMBER_INVITED", "SELLER_MEMBER_ROLE_UPDATED"] } as any });
  await StoreAuditLog.bulkCreate([
    {
      storeId: store.id,
      actorUserId: owner.id,
      targetUserId: member.id,
      targetMemberId: orderMember.id,
      action: "SELLER_MEMBER_INVITED",
      beforeState: null,
      afterState: JSON.stringify({ roleCode: "ORDER_MANAGER", status: "ACTIVE" }),
    },
    {
      storeId: store.id,
      actorUserId: owner.id,
      targetUserId: member.id,
      targetMemberId: orderMember.id,
      action: "SELLER_MEMBER_ROLE_UPDATED",
      beforeState: JSON.stringify({ roleCode: "CATALOG_MANAGER" }),
      afterState: JSON.stringify({ roleCode: "ORDER_MANAGER" }),
    },
  ] as any);

  await Notification.destroy({
    where: { type: "SELLER_PAYMENT_REVIEW_REQUIRED", title: "Seller 2026 smoke payment proof" } as any,
  });
  await Notification.destroy({
    where: { type: "SELLER_STOCK_ALERT", title: "Seller 2026 smoke stock alert" } as any,
  });
  const notification = await createSellerNotification({
    userId: owner.id,
    storeId: store.id,
    type: "SELLER_PAYMENT_REVIEW_REQUIRED",
    title: "Seller 2026 smoke payment proof",
    actionCode: "SELLER_PAYMENT_REVIEW_REQUIRED",
    message: "Pending payment proof is ready for seller smoke.",
    route: `/seller/stores/${store.slug}/payment-review`,
    suborderId: suborders[0]?.id ?? null,
  });
  const stockNotification = await createSellerNotification({
    userId: owner.id,
    storeId: store.id,
    type: "SELLER_STOCK_ALERT",
    title: "Seller 2026 smoke stock alert",
    actionCode: "SELLER_STOCK_ALERT",
    message: "A product stock warning is ready for seller notification smoke.",
    route: `/seller/stores/${store.slug}/catalog/products/${products[3]?.id ?? products[0].id}`,
  });
  const notificationRecord =
    notification ||
    (await Notification.findOne({
      where: {
        type: "SELLER_PAYMENT_REVIEW_REQUIRED",
        title: "Seller 2026 smoke payment proof",
      } as any,
    }));
  const stockNotificationRecord =
    stockNotification ||
    (await Notification.findOne({
      where: {
        type: "SELLER_STOCK_ALERT",
        title: "Seller 2026 smoke stock alert",
      } as any,
    }));

  return {
    ownerId: owner.id,
    ownerEmail: users.owner.email,
    memberId: member.id,
    memberEmail: users.member.email,
    ownerMemberId: ownerMember.id,
    orderMemberId: orderMember.id,
    buyerId: buyer.id,
    storeId: store.id,
    storeSlug: store.slug,
    otherStoreId: otherStore.id,
    otherStoreSlug: otherStore.slug,
    productId: products[0].id,
    submitReviewProductId: products[1].id,
    attributeId: color.id,
    suborderId: suborders[0]?.id ?? null,
    fulfillmentSuborderId: suborders[1]?.id ?? null,
    paymentApproveSuborderId: suborders[4]?.id ?? null,
    paymentRejectSuborderId: suborders[5]?.id ?? null,
    notificationId: notificationRecord?.id ?? null,
    secondaryNotificationId: stockNotificationRecord?.id ?? null,
    password: PASSWORD,
  };
}

async function waitForOk(url: string, label: string) {
  const deadline = Date.now() + 30_000;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return true;
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = (error as Error).message;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${label} is not reachable at ${url}: ${lastError}`);
}

function classifyPage(text: string, url: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();
  if (lower.includes("seller session required") || lower.includes("sign in")) return "AUTH_BLOCKED";
  if (lower.includes("access forbidden") || lower.includes("permission denied")) return "FORBIDDEN";
  if (lower.includes("something went wrong") || lower.includes("failed to load")) return "RUNTIME_ERROR";
  if (url.includes("/login")) return "REDIRECTED_TO_LOGIN";
  return "PASS";
}

async function smokeBrowser(fixture: Awaited<ReturnType<typeof ensureSeller2026AuthSmokeFixture>>) {
  await waitForOk(`${API_URL}/api/health`, "API");
  await waitForOk(CLIENT_URL, "client");

  const routes = [
    { name: "dashboard", path: `/seller/stores/${fixture.storeSlug}` },
    { name: "dashboard-explicit", path: `/seller/stores/${fixture.storeSlug}/dashboard` },
    { name: "store-profile", path: `/seller/stores/${fixture.storeSlug}/store-profile` },
    { name: "microsite-preview", path: `/seller/stores/${fixture.storeSlug}/microsite-preview` },
    { name: "products", path: `/seller/stores/${fixture.storeSlug}/catalog/products` },
    { name: "product-new", path: `/seller/stores/${fixture.storeSlug}/catalog/products/new` },
    { name: "product-detail", path: `/seller/stores/${fixture.storeSlug}/catalog/products/${fixture.productId}` },
    { name: "product-edit", path: `/seller/stores/${fixture.storeSlug}/catalog/products/${fixture.productId}/edit` },
    { name: "categories", path: `/seller/stores/${fixture.storeSlug}/catalog/categories` },
    { name: "attributes", path: `/seller/stores/${fixture.storeSlug}/catalog/attributes` },
    { name: "attribute-values", path: `/seller/stores/${fixture.storeSlug}/catalog/attributes/${fixture.attributeId}/values` },
    { name: "coupons", path: `/seller/stores/${fixture.storeSlug}/catalog/coupons` },
    { name: "orders", path: `/seller/stores/${fixture.storeSlug}/orders` },
    { name: "order-detail", path: `/seller/stores/${fixture.storeSlug}/orders/${fixture.suborderId}` },
    { name: "payment-review", path: `/seller/stores/${fixture.storeSlug}/payment-review` },
    { name: "payment-profile", path: `/seller/stores/${fixture.storeSlug}/payment-profile` },
    { name: "team", path: `/seller/stores/${fixture.storeSlug}/team` },
    { name: "member-detail", path: `/seller/stores/${fixture.storeSlug}/team/${fixture.orderMemberId}` },
    { name: "team-audit", path: `/seller/stores/${fixture.storeSlug}/team/audit` },
    { name: "notifications", path: `/seller/stores/${fixture.storeSlug}/notifications` },
    { name: "legacy-catalog", path: `/seller/stores/${fixture.storeSlug}/catalog`, expectedUrlPart: "/catalog/products" },
    { name: "legacy-catalog-new", path: `/seller/stores/${fixture.storeSlug}/catalog/new`, expectedUrlPart: "/catalog/products/new" },
    { name: "legacy-catalog-detail", path: `/seller/stores/${fixture.storeSlug}/catalog/${fixture.productId}`, expectedUrlPart: `/catalog/products/${fixture.productId}` },
    { name: "legacy-catalog-edit", path: `/seller/stores/${fixture.storeSlug}/catalog/${fixture.productId}/edit`, expectedUrlPart: `/catalog/products/${fixture.productId}/edit` },
    { name: "legacy-coupons", path: `/seller/stores/${fixture.storeSlug}/coupons`, expectedUrlPart: "/catalog/coupons" },
  ];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const apiCalls: Array<{ route: string; status: number; url: string }> = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/api/seller")) {
      apiCalls.push({ route: page.url().replace(CLIENT_URL, ""), status: response.status(), url });
    }
  });

  const loginResponse = await page.request.post(`${API_URL}/api/auth/login`, {
    data: { email: fixture.ownerEmail, password: fixture.password },
  });
  if (!loginResponse.ok()) {
    throw new Error(`Fixture login failed: ${loginResponse.status()} ${await loginResponse.text()}`);
  }
  const cookies = await page.request.storageState();
  await context.addCookies(cookies.cookies);
  const mutationResults = [];
  const readUnreadCount = async () => {
    const response = await page.request.get(
      `${API_URL}/api/seller/stores/${fixture.storeId}/notifications/unread-count`
    );
    const body = await response.json().catch(() => ({}));
    return {
      status: response.status(),
      ok: response.ok(),
      count: Number(body?.data?.count ?? body?.count ?? 0) || 0,
      body,
    };
  };
  const unreadBefore = await readUnreadCount();
  if (!unreadBefore.ok || unreadBefore.count < 2) {
    throw new Error(
      `Notification mutation smoke expected at least 2 unread fixture notifications, got ${unreadBefore.count}.`
    );
  }
  if (fixture.notificationId) {
    const markReadResponse = await page.request.patch(
      `${API_URL}/api/seller/stores/${fixture.storeId}/notifications/${fixture.notificationId}/read`
    );
    const afterSingleRead = await readUnreadCount();
    mutationResults.push({
      name: "notification-mark-read",
      status: markReadResponse.status(),
      ok: markReadResponse.ok(),
      body: (await markReadResponse.text()).slice(0, 240),
      unreadBefore: unreadBefore.count,
      unreadAfter: afterSingleRead.count,
    });
    if (!markReadResponse.ok() || afterSingleRead.count >= unreadBefore.count) {
      throw new Error(
        `Notification mark-read smoke failed: status ${markReadResponse.status()}, unread ${unreadBefore.count} -> ${afterSingleRead.count}.`
      );
    }
  } else {
    mutationResults.push({
      name: "notification-mark-read",
      status: 0,
      ok: false,
      body: "Fixture notification id is missing.",
    });
  }
  const markAllReadResponse = await page.request.patch(
    `${API_URL}/api/seller/stores/${fixture.storeId}/notifications/read-all`
  );
  const afterMarkAllRead = await readUnreadCount();
  mutationResults.push({
    name: "notification-mark-all-read",
    status: markAllReadResponse.status(),
    ok: markAllReadResponse.ok(),
    body: (await markAllReadResponse.text()).slice(0, 240),
    unreadAfter: afterMarkAllRead.count,
  });
  if (!markAllReadResponse.ok() || afterMarkAllRead.count !== 0) {
    throw new Error(
      `Notification mark-all-read smoke failed: status ${markAllReadResponse.status()}, unread after ${afterMarkAllRead.count}.`
    );
  }

  const routeResults = [];
  for (const route of routes) {
    consoleErrors.length = 0;
    await page.goto(route.path, { waitUntil: "networkidle", timeout: 45_000 });
    await page.waitForTimeout(300);
    const text = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    const status = classifyPage(text, page.url());
    routeResults.push({
      name: route.name,
      path: route.path,
      finalUrl: page.url().replace(CLIENT_URL, ""),
      status:
        route.expectedUrlPart && !page.url().includes(route.expectedUrlPart)
          ? "REDIRECT_MISMATCH"
          : status,
      consoleErrors: [...consoleErrors],
      snippet: text.replace(/\s+/g, " ").trim().slice(0, 180),
    });
  }

  consoleErrors.length = 0;
  await page.goto(`/seller/stores/${fixture.storeSlug}/catalog/products`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });
  await page.getByRole("link", { name: /^\+?\s*Add Product$/i }).click();
  await page.waitForURL(`**/seller/stores/${fixture.storeSlug}/catalog/products/new`, {
    timeout: 15_000,
  });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  const productCreateShell = page.getByText(/Product Create Shell|Multi-step product authoring/i).first();
  await productCreateShell.waitFor({ state: "visible", timeout: 15_000 });
  const addProductText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const addProductCta = {
    name: "product-catalog-add-product-cta",
    from: `/seller/stores/${fixture.storeSlug}/catalog/products`,
    finalUrl: page.url().replace(CLIENT_URL, ""),
    status:
      page.url().includes(`/seller/stores/${fixture.storeSlug}/catalog/products/new`) &&
      /Product Create Shell|Basic Info/i.test(addProductText)
        ? "PASS"
        : "FAIL",
    consoleErrors: [...consoleErrors],
    snippet: addProductText.replace(/\s+/g, " ").trim().slice(0, 180),
  };
  if (addProductCta.status !== "PASS" || consoleErrors.length) {
    throw new Error(
      `Add Product CTA smoke failed: ${addProductCta.status}, url ${addProductCta.finalUrl}, console ${consoleErrors.join(" | ")}`
    );
  }
  const createSubmitReviewButton = page.getByRole("button", { name: /^Submit Review$/i }).first();
  const invalidReadinessDisabled = await createSubmitReviewButton.isDisabled().catch(() => false);
  const invalidReadiness = {
    name: "product-readiness-invalid-create",
    finalUrl: page.url().replace(CLIENT_URL, ""),
    status:
      /Product name must be at least 2 characters\./i.test(addProductText) &&
      /Review Readiness/i.test(addProductText) &&
      invalidReadinessDisabled
        ? "PASS"
        : "FAIL",
    submitReviewDisabled: invalidReadinessDisabled,
    consoleErrors: [...consoleErrors],
    snippet: addProductText.replace(/\s+/g, " ").trim().slice(0, 180),
  };
  if (invalidReadiness.status !== "PASS" || consoleErrors.length) {
    throw new Error(
      `Invalid product readiness smoke failed: ${invalidReadiness.status}, disabled ${invalidReadinessDisabled}, console ${consoleErrors.join(" | ")}`
    );
  }
  await page.goBack({ waitUntil: "networkidle", timeout: 15_000 }).catch(() => undefined);

  consoleErrors.length = 0;
  await page.goto(
    `/seller/stores/${fixture.storeSlug}/catalog/products/${fixture.submitReviewProductId}/edit`,
    {
      waitUntil: "networkidle",
      timeout: 45_000,
    }
  );
  await page.getByText(/Ready to submit/i).first().waitFor({ state: "visible", timeout: 20_000 });
  const readinessReadyBeforeSubmit = await page.getByText(/Ready to submit/i).first().isVisible().catch(() => false);
  await page.getByRole("button", { name: /^Submit Review$/i }).click();
  await page.getByText(/berhasil dikirim untuk review|Product submitted for review/i).waitFor({
    state: "visible",
    timeout: 20_000,
  });
  const productSubmitText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const publishButtonCount = await page.getByRole("button", { name: /^Publish$/i }).count();
  const productSubmitReview = {
    name: "product-submit-review-mutation",
    productId: fixture.submitReviewProductId,
    finalUrl: page.url().replace(CLIENT_URL, ""),
    status:
      /berhasil dikirim untuk review|Product submitted for review/i.test(productSubmitText) &&
      readinessReadyBeforeSubmit &&
      publishButtonCount === 0
        ? "PASS"
        : "FAIL",
    consoleErrors: [...consoleErrors],
    snippet: productSubmitText.replace(/\s+/g, " ").trim().slice(0, 180),
  };
  if (productSubmitReview.status !== "PASS" || consoleErrors.length) {
    throw new Error(
      `Product submit review smoke failed: ${productSubmitReview.status}, product ${fixture.submitReviewProductId}, console ${consoleErrors.join(" | ")}`
    );
  }
  await page.goto(`/seller/stores/${fixture.storeSlug}/catalog/products?status=submitted`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });
  await page.getByText("S26-DRAFT").waitFor({ state: "visible", timeout: 20_000 });
  const productSubmittedListText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const productSubmittedList = {
    name: "product-submit-review-list-status",
    productId: fixture.submitReviewProductId,
    finalUrl: page.url().replace(CLIENT_URL, ""),
    status:
      productSubmittedListText.includes("S26-DRAFT") &&
      /Submitted|review/i.test(productSubmittedListText)
        ? "PASS"
        : "FAIL",
    consoleErrors: [...consoleErrors],
    snippet: productSubmittedListText.replace(/\s+/g, " ").trim().slice(0, 180),
  };
  if (productSubmittedList.status !== "PASS" || consoleErrors.length) {
    throw new Error(
      `Product submitted list smoke failed: ${productSubmittedList.status}, product ${fixture.submitReviewProductId}, console ${consoleErrors.join(" | ")}`
    );
  }

  consoleErrors.length = 0;
  const smokeCouponCode = `S26SMOKE${Date.now()}`;
  const smokeCouponName = `Seller 2026 Smoke Coupon ${smokeCouponCode}`;
  const editedSmokeCouponName = `Seller 2026 Smoke Coupon Edited ${smokeCouponCode}`;
  await page.goto(`/seller/stores/${fixture.storeSlug}/catalog/coupons`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });
  await page.getByRole("button", { name: /^Create Coupon$/i }).first().click();
  await page.getByLabel("Coupon code").fill(smokeCouponCode);
  await page.getByLabel("Coupon name").fill(smokeCouponName);
  await page.getByLabel("Discount value").fill("10");
  await page.getByLabel("Minimum spend").fill("50000");
  await page.getByRole("button", { name: /^Create Coupon$/i }).last().click();
  const smokeCouponRow = () => page.locator("tr", { hasText: smokeCouponCode }).first();
  await smokeCouponRow().waitFor({ state: "visible", timeout: 20_000 });
  await smokeCouponRow().getByRole("button", { name: /^Edit$/i }).click();
  await page.getByLabel("Coupon name").fill(editedSmokeCouponName);
  await page.getByRole("button", { name: /^Save Coupon$/i }).click();
  await page.getByText(editedSmokeCouponName).waitFor({ state: "visible", timeout: 20_000 });
  await smokeCouponRow().getByRole("button", { name: /^Deactivate$/i }).click();
  await page.getByText("Coupon deactivated.").waitFor({ state: "visible", timeout: 20_000 });
  await smokeCouponRow().getByRole("button", { name: /^Activate$/i }).click();
  await page.getByText("Coupon activated.").waitFor({ state: "visible", timeout: 20_000 });
  await smokeCouponRow().getByRole("button", { name: /^Archive$/i }).click();
  await page.getByText("Coupon archived.").waitFor({ state: "visible", timeout: 20_000 });
  const couponSmokeText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const couponLifecycle = {
    name: "coupon-lifecycle-mutations",
    code: smokeCouponCode,
    finalUrl: page.url().replace(CLIENT_URL, ""),
    status:
      couponSmokeText.includes(smokeCouponCode) &&
      couponSmokeText.includes(editedSmokeCouponName) &&
      couponSmokeText.includes("Coupon archived.")
        ? "PASS"
        : "FAIL",
    consoleErrors: [...consoleErrors],
    snippet: couponSmokeText.replace(/\s+/g, " ").trim().slice(0, 180),
  };
  if (couponLifecycle.status !== "PASS" || consoleErrors.length) {
    throw new Error(
      `Coupon lifecycle smoke failed: ${couponLifecycle.status}, code ${smokeCouponCode}, console ${consoleErrors.join(" | ")}`
    );
  }

  consoleErrors.length = 0;
  await page.goto(`/seller/stores/${fixture.storeSlug}/orders/${fixture.fulfillmentSuborderId}`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });
  await page.getByText(/Suborder Detail/i).first().waitFor({ state: "visible", timeout: 15_000 });
  await page.getByLabel("Tracking Number").waitFor({ state: "visible", timeout: 15_000 });
  await page.getByRole("button", { name: /^Mark as Shipped$/i }).click();
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.waitForFunction(
    () => {
      const text = document.body.innerText || "";
      return /SHIPPED/i.test(text);
    },
    { timeout: 25_000 }
  );
  const fulfillmentDetailText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  await page.goto(`/seller/stores/${fixture.storeSlug}/orders`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });
  const fulfillmentListText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const orderFulfillment = {
    name: "order-fulfillment-mutation",
    suborderId: fixture.fulfillmentSuborderId,
    finalUrl: page.url().replace(CLIENT_URL, ""),
    status:
      /SHIPPED/i.test(fulfillmentDetailText) &&
      /SHIPPED/i.test(fulfillmentListText)
        ? "PASS"
        : "FAIL",
    consoleErrors: [...consoleErrors],
    snippet: fulfillmentDetailText.replace(/\s+/g, " ").trim().slice(0, 180),
  };
  if (orderFulfillment.status !== "PASS" || consoleErrors.length) {
    throw new Error(
      `Order fulfillment smoke failed: ${orderFulfillment.status}, console ${consoleErrors.join(" | ")}`
    );
  }

  consoleErrors.length = 0;
  await page.goto(`/seller/stores/${fixture.storeSlug}/payment-review?q=SELLER2026-PAYAPPROVE`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });
  await page.getByText(/Payment Review/i).first().waitFor({ state: "visible", timeout: 15_000 });
  await page.getByText("PAY-SELLER2026-PAYAPPROVE").waitFor({ state: "visible", timeout: 20_000 });
  await page.getByLabel("Reviewer Note").fill("Approved by Seller 2026 smoke.");
  await page.getByRole("button", { name: /^Approve Payment$/i }).click();
  await page.getByText("Payment approved.").waitFor({ state: "visible", timeout: 25_000 });
  const approveReviewText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  await page.goto(`/seller/stores/${fixture.storeSlug}/orders/${fixture.paymentApproveSuborderId}`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });
  const approveOrderText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const paymentApproveReview = {
    name: "payment-review-approve-mutation",
    suborderId: fixture.paymentApproveSuborderId,
    finalUrl: page.url().replace(CLIENT_URL, ""),
    status:
      /Payment approved\./i.test(approveReviewText) &&
      /Payment information stays read-only/i.test(approveOrderText)
        ? "PASS"
        : "FAIL",
    consoleErrors: [...consoleErrors],
    snippet: approveReviewText.replace(/\s+/g, " ").trim().slice(0, 180),
  };
  if (paymentApproveReview.status !== "PASS" || consoleErrors.length) {
    throw new Error(
      `Payment approve smoke failed: ${paymentApproveReview.status}, console ${consoleErrors.join(" | ")}`
    );
  }

  consoleErrors.length = 0;
  await page.goto(`/seller/stores/${fixture.storeSlug}/payment-review?q=SELLER2026-PAYREJECT`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });
  await page.getByText("PAY-SELLER2026-PAYREJECT").waitFor({ state: "visible", timeout: 20_000 });
  await page.getByLabel("Reason").fill("Rejected by Seller 2026 smoke.");
  await page.getByRole("button", { name: /^Reject Payment$/i }).click();
  await page.getByText("Payment rejected.").waitFor({ state: "visible", timeout: 25_000 });
  const rejectReviewText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  await page.goto(`/seller/stores/${fixture.storeSlug}/orders/${fixture.paymentRejectSuborderId}`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });
  const rejectOrderText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const paymentRejectReview = {
    name: "payment-review-reject-mutation",
    suborderId: fixture.paymentRejectSuborderId,
    finalUrl: page.url().replace(CLIENT_URL, ""),
    status:
      /Payment rejected\./i.test(rejectReviewText) &&
      /Payment information stays read-only/i.test(rejectOrderText)
        ? "PASS"
        : "FAIL",
    consoleErrors: [...consoleErrors],
    snippet: rejectReviewText.replace(/\s+/g, " ").trim().slice(0, 180),
  };
  if (paymentRejectReview.status !== "PASS" || consoleErrors.length) {
    throw new Error(
      `Payment reject smoke failed: ${paymentRejectReview.status}, console ${consoleErrors.join(" | ")}`
    );
  }

  consoleErrors.length = 0;
  const smokeProfileMerchant = `Seller 2026 Smoke Merchant ${Date.now()}`;
  await page.goto(`/seller/stores/${fixture.storeSlug}/payment-profile`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });
  await page.getByText(/Payment Profile/i).first().waitFor({ state: "visible", timeout: 15_000 });
  await page.getByRole("button", { name: /^Submit \/ Update Profile$/i }).click();
  await page.getByLabel("Account Owner Name").fill("Seller 2026 Smoke Owner");
  await page.getByLabel("Merchant Name").fill(smokeProfileMerchant);
  await page.getByLabel("QRIS Identifier").fill("S26-PROFILE-REQUEST");
  await page.getByLabel("QRIS Image URL").fill(dataUrl);
  await page.getByLabel("QRIS Payload").fill("SMOKE-QRIS-PAYLOAD");
  await page.getByLabel("Payment Instructions").fill("Seller 2026 smoke payment setup request.");
  await page.getByLabel("Seller Note").fill("Submitted by Seller 2026 smoke.");
  await page.getByRole("button", { name: /^Submit Request$/i }).click();
  await page.getByText("Payment profile request submitted for admin review.").waitFor({
    state: "visible",
    timeout: 25_000,
  });
  const paymentProfileText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const paymentProfileRequest = {
    name: "payment-profile-request-mutation",
    finalUrl: page.url().replace(CLIENT_URL, ""),
    status:
      /Payment profile request submitted for admin review\./i.test(paymentProfileText) &&
      /SUBMITTED|Submitted for review|Pending admin review/i.test(paymentProfileText) &&
      !/Approved by seller|Activated by seller/i.test(paymentProfileText)
        ? "PASS"
        : "FAIL",
    consoleErrors: [...consoleErrors],
    snippet: paymentProfileText.replace(/\s+/g, " ").trim().slice(0, 180),
  };
  if (paymentProfileRequest.status !== "PASS" || consoleErrors.length) {
    throw new Error(
      `Payment profile request smoke failed: ${paymentProfileRequest.status}, console ${consoleErrors.join(" | ")}`
    );
  }

  await page.goto(`/seller/stores/${fixture.otherStoreSlug}`, { waitUntil: "networkidle", timeout: 45_000 });
  const crossStoreText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const crossStore = {
    name: "cross-store-owner-a-to-store-b",
    finalUrl: page.url().replace(CLIENT_URL, ""),
    status: classifyPage(crossStoreText, page.url()),
    snippet: crossStoreText.replace(/\s+/g, " ").trim().slice(0, 180),
  };

  const memberContext = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 1366, height: 900 } });
  const memberPage = await memberContext.newPage();
  const memberLogin = await memberPage.request.post(`${API_URL}/api/auth/login`, {
    data: { email: fixture.memberEmail, password: fixture.password },
  });
  if (!memberLogin.ok()) {
    throw new Error(`Member fixture login failed: ${memberLogin.status()} ${await memberLogin.text()}`);
  }
  const memberState = await memberPage.request.storageState();
  await memberContext.addCookies(memberState.cookies);
  const memberRoutes = [
    { name: "member-orders", path: `/seller/stores/${fixture.storeSlug}/orders` },
    { name: "member-products-read", path: `/seller/stores/${fixture.storeSlug}/catalog/products` },
    { name: "member-team-restricted", path: `/seller/stores/${fixture.storeSlug}/team` },
    { name: "member-payment-profile-restricted", path: `/seller/stores/${fixture.storeSlug}/payment-profile` },
  ];
  const memberResults = [];
  for (const route of memberRoutes) {
    await memberPage.goto(route.path, { waitUntil: "networkidle", timeout: 45_000 });
    const text = await memberPage.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    memberResults.push({
      name: route.name,
      path: route.path,
      finalUrl: memberPage.url().replace(CLIENT_URL, ""),
      status: classifyPage(text, memberPage.url()),
      snippet: text.replace(/\s+/g, " ").trim().slice(0, 180),
    });
  }

  await browser.close();

  const sellerApiStatuses = apiCalls.reduce<Record<string, number[]>>((acc, call) => {
    const pathname = new URL(call.url).pathname;
    if (!acc[pathname]) acc[pathname] = [];
    acc[pathname].push(call.status);
    return acc;
  }, {});

  return {
    routeResults,
    addProductCta,
    invalidReadiness,
    productSubmitReview,
    productSubmittedList,
    couponLifecycle,
    orderFulfillment,
    paymentApproveReview,
    paymentRejectReview,
    paymentProfileRequest,
    crossStore,
    memberResults,
    sellerApiStatuses,
    mutationResults,
  };
}

async function main() {
  const fixture = await ensureSeller2026AuthSmokeFixture();
  const smoke = await smokeBrowser(fixture);
  await sequelize.close();
  console.log(
    JSON.stringify(
      {
        fixture,
        smoke,
      },
      null,
      2
    )
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    await sequelize.close().catch(() => undefined);
    console.error(error);
    process.exit(1);
  });
}
