import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { WalletCards, CreditCard } from "lucide-react";
import { createOrderSchema } from "@ecommerce/schemas";
import { useAuth } from "../../auth/useAuth.js";
import { useCart } from "../../hooks/useCart.ts";
import { useCartStore } from "../../store/cart.store.ts";
import {
  createMultiStoreCheckoutOrder,
  previewCheckoutByStore,
} from "../../api/public/storeCheckout.ts";
import { quoteStoreCoupon } from "../../api/public/storeCoupons.ts";
import { getStoreCustomization } from "../../api/public/storeCustomizationPublic.ts";
import { getDefaultAddress } from "../../api/userAddresses.ts";
import { formatCurrency } from "../../utils/format.js";
import {
  findInvalidVariantCheckoutItem,
  resolveVariantCheckoutMessage,
} from "../../utils/variantCheckoutErrors.js";
import { GENERIC_ERROR, ORDER_FAILED } from "../../constants/uiMessages.js";
import {
  getCityOptions,
  getDistrictOptions,
  getProvinceOptions,
} from "../../utils/idRegions.ts";
import {
  buildFullName,
  formatAddressSummary,
  resolveAddressEmailAddress,
  splitFullName,
  toUserAddressPayload,
} from "../../utils/userAddress.ts";
import { resolvePublicOrderReference } from "../../utils/publicOrderReference.js";
import {
  buildLoginRedirectState,
  CHECKOUT_LOGIN_REQUIRED_NOTICE,
} from "../../auth/loginRedirectState.ts";
import Checkout2026View from "./checkout2026/Checkout2026View.jsx";
import { createCheckout2026ViewModel } from "./checkout2026/checkout2026Adapter.js";

// Warm the lazy account route while checkout is being created. This prevents React
// from retaining the checkout screen for a noticeable time after the URL changes.
const preloadAccountPaymentRoute = () =>
  Promise.all([
    import("../../layouts/AccountLayout.jsx"),
    import("../account/AccountOrderPaymentPage.jsx"),
  ]).catch(() => undefined);

const INPUT_CLASS =
  "mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-[0_1px_1px_rgba(15,23,42,0.03)] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100";

const PAYMENT_OPTIONS = [
  {
    id: "duitku",
    title: "Duitku POP (Virtual Account, E-Wallet, Retail)",
    Icon: CreditCard,
  },
  {
    id: "qris",
    title: "Manual Transfer (QRIS by Store)",
    Icon: WalletCards,
  },
];

const DUITKU_PAYMENT_METHOD_OPTIONS = [
  { code: "BC", label: "BCA VA", category: "Virtual Account" },
  { code: "I1", label: "BNI VA", category: "Virtual Account" },
  { code: "BR", label: "BRI VA", category: "Virtual Account" },
  { code: "M2", label: "Mandiri VA H2H", category: "Virtual Account" },
  { code: "BT", label: "Permata VA", category: "Virtual Account" },
  { code: "B1", label: "CIMB Niaga VA", category: "Virtual Account" },
  { code: "BV", label: "BSI VA", category: "Virtual Account" },
  { code: "DA", label: "DANA", category: "E-Wallet" },
  { code: "OV", label: "OVO", category: "E-Wallet" },
  { code: "IR", label: "Indomaret", category: "Retail" },
  { code: "FT", label: "Retail", category: "Retail" },
  { code: "SP", label: "QRIS ShopeePay", category: "QRIS" },
  { code: "NQ", label: "QRIS Nobu", category: "QRIS" },
  { code: "GQ", label: "QRIS Gudang Voucher", category: "QRIS" },
];

const DEFAULT_DUITKU_PAYMENT_METHOD = "";
const checkoutCustomerSchema = createOrderSchema.shape.customer;
const DEFAULT_CHECKOUT_COPY = {
  personalDetails: {
    sectionTitle: "Personal Details",
    sectionHint: "",
    firstNameLabel: "First Name",
    lastNameLabel: "Last Name",
    emailLabel: "Email Address",
    phoneLabel: "Phone Number",
    firstNamePlaceholder: "First Name",
    lastNamePlaceholder: "Last Name",
    emailPlaceholder: "Email Address",
    phonePlaceholder: "Phone Number",
  },
  shippingDetails: {
    sectionTitle: "Shipping Details",
    sectionHint: "",
    provinceLabel: "Province",
    cityLabel: "City/Regency",
    districtLabel: "Subdistrict",
    postalCodeLabel: "Postal Code",
    streetNameLabel: "Street Name",
    houseNumberLabel: "House Number",
    buildingLabel: "Building",
    otherDetailsLabel: "Other Details",
    provincePlaceholder: "Select Province",
    cityPlaceholder: "Select City/Regency",
    districtPlaceholder: "Select Subdistrict",
    postalCodePlaceholder: "Postal Code",
    streetNamePlaceholder: "Street Name",
    houseNumberPlaceholder: "House Number",
    buildingPlaceholder: "Building",
    otherDetailsPlaceholder: "Block / Unit / Reference",
    defaultShippingToggleLabel: "Use Default Shipping Address",
    defaultShippingToggleEnabledLabel: "Yes",
    defaultShippingToggleDisabledLabel: "No",
    defaultShippingLoadingLabel: "Loading your default shipping address...",
    paymentMethodLabel: "Payment Method",
    paymentMethodPlaceholder: "Select a preferred payment option.",
  },
  buttons: {
    continueButtonLabel: "Back to Cart",
    confirmButtonLabel: "Place an Order",
    processingButtonLabel: "Processing...",
  },
  cartItemSection: {
    sectionTitle: "Checkout Summary",
    orderSummaryLabel: "Order Summary",
    sectionDescription: "",
    estimatedTotalLabel: "Estimated Total",
    itemCountSuffix: "Items",
    applyButtonLabel: "Apply",
    applyingButtonLabel: "Applying...",
    couponCodeLabel: "Coupon Code",
    couponCodePlaceholder: "Coupon Code",
    couponHelperText: "",
    itemPriceLabel: "Item Price",
    subTotalLabel: "Subtotal",
    shippingLabel: "Shipping",
    discountLabel: "Discount",
    taxLabel: "Tax",
    totalCostLabel: "TOTAL COST",
    postSubmitNotice: "",
    confirmationHelperText: "",
    summaryReadyHint: "",
  },
};

const CHECKOUT_REQUEST_KEY_STORAGE_KEY = "tppreneurs.checkout.request";
const IS_CHECKOUT_PREVIEW_DEBUG_ENABLED = Boolean(import.meta.env?.DEV);
const RECOVERY_RESELECT_CODES = new Set([
  "PRODUCT_VARIANT_REQUIRED",
  "PRODUCT_VARIANT_MISSING",
  "VARIANT_NOT_AVAILABLE",
]);

const createCheckoutRequestKey = () => {
  const randomUUID =
    typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID.bind(globalThis.crypto)
      : null;
  if (randomUUID) {
    return randomUUID();
  }
  return `checkout-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const readCheckoutRequestKeyState = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_REQUEST_KEY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const hashCheckoutRequestSignature = (signature) => {
  const value = String(signature || "");
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36);
};

const getCheckoutRequestKeyForSignature = (signature) => {
  const safeSignature = hashCheckoutRequestSignature(signature);
  if (!safeSignature || typeof window === "undefined") {
    return createCheckoutRequestKey();
  }
  const stored = readCheckoutRequestKeyState();
  if (
    stored?.signature === safeSignature &&
    typeof stored?.key === "string" &&
    stored.key.trim()
  ) {
    return stored.key.trim();
  }
  const key = createCheckoutRequestKey();
  try {
    window.sessionStorage.setItem(
      CHECKOUT_REQUEST_KEY_STORAGE_KEY,
      JSON.stringify({ signature: safeSignature, key, createdAt: Date.now() })
    );
  } catch {
    // Best-effort only; the server still treats the generated key as authoritative.
  }
  return key;
};

const clearCheckoutRequestKeyForSignature = (signature) => {
  if (typeof window === "undefined") return;
  const safeSignature = hashCheckoutRequestSignature(signature);
  const stored = readCheckoutRequestKeyState();
  if (!stored || stored.signature !== safeSignature) return;
  try {
    window.sessionStorage.removeItem(CHECKOUT_REQUEST_KEY_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
};

const toCopyText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const normalizeRegionLabel = (value, fallback) => {
  const normalized = toCopyText(value, fallback);
  if (normalized === "Country") {
    return "Province";
  }
  if (
    normalized === "City / Kabupaten/Kota" ||
    normalized === "City / Regency" ||
    normalized === "City"
  ) {
    return "City/Regency";
  }
  if (normalized === "District / Kecamatan" || normalized === "District") {
    return "Subdistrict";
  }
  return normalized;
};

const normalizeRegionPlaceholder = (value, fallback) => {
  const normalized = toCopyText(value, fallback);
  if (normalized === "Country" || normalized === "Select Country") {
    return "Select Province";
  }
  if (
    normalized === "Select City / Kabupaten/Kota" ||
    normalized === "Select City / Regency" ||
    normalized === "Select City"
  ) {
    return "Select City/Regency";
  }
  if (normalized === "Select District / Kecamatan" || normalized === "Select District") {
    return "Select Subdistrict";
  }
  return normalized;
};

const normalizeCheckoutButtonLabel = (value, fallback) => {
  const normalized = toCopyText(value, fallback);
  const lowered = normalized.toLowerCase();
  if (lowered === "continue shipping") return DEFAULT_CHECKOUT_COPY.buttons.continueButtonLabel;
  if (lowered === "confirm order") return DEFAULT_CHECKOUT_COPY.buttons.confirmButtonLabel;
  return normalized;
};

const normalizeCheckoutSectionTitle = (value, fallback) => {
  const normalized = toCopyText(value, fallback);
  return normalized.toLowerCase() === "cart item section"
    ? DEFAULT_CHECKOUT_COPY.cartItemSection.sectionTitle
    : normalized;
};

const normalizeCheckoutSubtotalLabel = (value, fallback) => {
  const normalized = toCopyText(value, fallback);
  return normalized.toLowerCase() === "sub total"
    ? DEFAULT_CHECKOUT_COPY.cartItemSection.subTotalLabel
    : normalized;
};

const normalizeCheckoutTotalLabel = (value, fallback) => {
  const normalized = toCopyText(value, fallback);
  return normalized.toLowerCase() === "total cost"
    ? DEFAULT_CHECKOUT_COPY.cartItemSection.totalCostLabel
    : normalized;
};

const normalizeCheckoutCopy = (raw) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const personalDetails =
    source.personalDetails && typeof source.personalDetails === "object"
      ? source.personalDetails
      : {};
  const shippingDetails =
    source.shippingDetails && typeof source.shippingDetails === "object"
      ? source.shippingDetails
      : {};
  const buttons = source.buttons && typeof source.buttons === "object" ? source.buttons : {};
  const cartItemSection =
    source.cartItemSection && typeof source.cartItemSection === "object"
      ? source.cartItemSection
      : {};

  return {
    personalDetails: {
      sectionTitle: toCopyText(
        personalDetails.sectionTitle,
        DEFAULT_CHECKOUT_COPY.personalDetails.sectionTitle
      ),
      sectionHint: toCopyText(
        personalDetails.sectionHint,
        DEFAULT_CHECKOUT_COPY.personalDetails.sectionHint
      ),
      firstNameLabel: toCopyText(
        personalDetails.firstNameLabel,
        DEFAULT_CHECKOUT_COPY.personalDetails.firstNameLabel
      ),
      lastNameLabel: toCopyText(
        personalDetails.lastNameLabel,
        DEFAULT_CHECKOUT_COPY.personalDetails.lastNameLabel
      ),
      emailLabel: toCopyText(
        personalDetails.emailLabel,
        DEFAULT_CHECKOUT_COPY.personalDetails.emailLabel
      ),
      phoneLabel: toCopyText(
        personalDetails.phoneLabel,
        DEFAULT_CHECKOUT_COPY.personalDetails.phoneLabel
      ),
      firstNamePlaceholder: toCopyText(
        personalDetails.firstNamePlaceholder,
        DEFAULT_CHECKOUT_COPY.personalDetails.firstNamePlaceholder
      ),
      lastNamePlaceholder: toCopyText(
        personalDetails.lastNamePlaceholder,
        DEFAULT_CHECKOUT_COPY.personalDetails.lastNamePlaceholder
      ),
      emailPlaceholder: toCopyText(
        personalDetails.emailPlaceholder,
        DEFAULT_CHECKOUT_COPY.personalDetails.emailPlaceholder
      ),
      phonePlaceholder: toCopyText(
        personalDetails.phonePlaceholder,
        DEFAULT_CHECKOUT_COPY.personalDetails.phonePlaceholder
      ),
    },
    shippingDetails: {
      sectionTitle: toCopyText(
        shippingDetails.sectionTitle,
        DEFAULT_CHECKOUT_COPY.shippingDetails.sectionTitle
      ),
      sectionHint: toCopyText(
        shippingDetails.sectionHint,
        DEFAULT_CHECKOUT_COPY.shippingDetails.sectionHint
      ),
      provinceLabel: normalizeRegionLabel(
        shippingDetails.provinceLabel ?? shippingDetails.countryLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.provinceLabel
      ),
      cityLabel: normalizeRegionLabel(
        shippingDetails.cityLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.cityLabel
      ),
      districtLabel: normalizeRegionLabel(
        shippingDetails.districtLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.districtLabel
      ),
      postalCodeLabel: toCopyText(
        shippingDetails.postalCodeLabel ?? shippingDetails.zipLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.postalCodeLabel
      ),
      streetNameLabel: toCopyText(
        shippingDetails.streetNameLabel ?? shippingDetails.streetAddressLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.streetNameLabel
      ),
      houseNumberLabel: toCopyText(
        shippingDetails.houseNumberLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.houseNumberLabel
      ),
      buildingLabel: toCopyText(
        shippingDetails.buildingLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.buildingLabel
      ),
      otherDetailsLabel: toCopyText(
        shippingDetails.otherDetailsLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.otherDetailsLabel
      ),
      provincePlaceholder: normalizeRegionPlaceholder(
        shippingDetails.provincePlaceholder ?? shippingDetails.countryPlaceholder,
        DEFAULT_CHECKOUT_COPY.shippingDetails.provincePlaceholder
      ),
      cityPlaceholder: normalizeRegionPlaceholder(
        shippingDetails.cityPlaceholder,
        DEFAULT_CHECKOUT_COPY.shippingDetails.cityPlaceholder
      ),
      districtPlaceholder: normalizeRegionPlaceholder(
        shippingDetails.districtPlaceholder,
        DEFAULT_CHECKOUT_COPY.shippingDetails.districtPlaceholder
      ),
      postalCodePlaceholder: toCopyText(
        shippingDetails.postalCodePlaceholder ?? shippingDetails.zipPlaceholder,
        DEFAULT_CHECKOUT_COPY.shippingDetails.postalCodePlaceholder
      ),
      streetNamePlaceholder: toCopyText(
        shippingDetails.streetNamePlaceholder ?? shippingDetails.streetAddressPlaceholder,
        DEFAULT_CHECKOUT_COPY.shippingDetails.streetNamePlaceholder
      ),
      houseNumberPlaceholder: toCopyText(
        shippingDetails.houseNumberPlaceholder,
        DEFAULT_CHECKOUT_COPY.shippingDetails.houseNumberPlaceholder
      ),
      buildingPlaceholder: toCopyText(
        shippingDetails.buildingPlaceholder,
        DEFAULT_CHECKOUT_COPY.shippingDetails.buildingPlaceholder
      ),
      otherDetailsPlaceholder: toCopyText(
        shippingDetails.otherDetailsPlaceholder,
        DEFAULT_CHECKOUT_COPY.shippingDetails.otherDetailsPlaceholder
      ),
      defaultShippingToggleLabel: toCopyText(
        shippingDetails.defaultShippingToggleLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.defaultShippingToggleLabel
      ),
      defaultShippingToggleEnabledLabel: toCopyText(
        shippingDetails.defaultShippingToggleEnabledLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.defaultShippingToggleEnabledLabel
      ),
      defaultShippingToggleDisabledLabel: toCopyText(
        shippingDetails.defaultShippingToggleDisabledLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.defaultShippingToggleDisabledLabel
      ),
      defaultShippingLoadingLabel: toCopyText(
        shippingDetails.defaultShippingLoadingLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.defaultShippingLoadingLabel
      ),
      paymentMethodLabel: toCopyText(
        shippingDetails.paymentMethodLabel,
        DEFAULT_CHECKOUT_COPY.shippingDetails.paymentMethodLabel
      ),
      paymentMethodPlaceholder: toCopyText(
        shippingDetails.paymentMethodPlaceholder,
        DEFAULT_CHECKOUT_COPY.shippingDetails.paymentMethodPlaceholder
      ),
    },
    buttons: {
      continueButtonLabel: normalizeCheckoutButtonLabel(
        buttons.continueButtonLabel,
        DEFAULT_CHECKOUT_COPY.buttons.continueButtonLabel
      ),
      confirmButtonLabel: normalizeCheckoutButtonLabel(
        buttons.confirmButtonLabel,
        DEFAULT_CHECKOUT_COPY.buttons.confirmButtonLabel
      ),
      processingButtonLabel: toCopyText(
        buttons.processingButtonLabel,
        DEFAULT_CHECKOUT_COPY.buttons.processingButtonLabel
      ),
    },
    cartItemSection: {
      sectionTitle: normalizeCheckoutSectionTitle(
        cartItemSection.sectionTitle,
        DEFAULT_CHECKOUT_COPY.cartItemSection.sectionTitle
      ),
      orderSummaryLabel: toCopyText(
        cartItemSection.orderSummaryLabel,
        DEFAULT_CHECKOUT_COPY.cartItemSection.orderSummaryLabel
      ),
      sectionDescription: toCopyText(
        cartItemSection.sectionDescription,
        DEFAULT_CHECKOUT_COPY.cartItemSection.sectionDescription
      ),
      estimatedTotalLabel: toCopyText(
        cartItemSection.estimatedTotalLabel,
        DEFAULT_CHECKOUT_COPY.cartItemSection.estimatedTotalLabel
      ),
      itemCountSuffix: toCopyText(
        cartItemSection.itemCountSuffix,
        DEFAULT_CHECKOUT_COPY.cartItemSection.itemCountSuffix
      ),
      applyButtonLabel: toCopyText(
        cartItemSection.applyButtonLabel,
        DEFAULT_CHECKOUT_COPY.cartItemSection.applyButtonLabel
      ),
      applyingButtonLabel: toCopyText(
        cartItemSection.applyingButtonLabel,
        DEFAULT_CHECKOUT_COPY.cartItemSection.applyingButtonLabel
      ),
      couponCodeLabel: toCopyText(
        cartItemSection.couponCodeLabel,
        DEFAULT_CHECKOUT_COPY.cartItemSection.couponCodeLabel
      ),
      couponCodePlaceholder: toCopyText(
        cartItemSection.couponCodePlaceholder,
        DEFAULT_CHECKOUT_COPY.cartItemSection.couponCodePlaceholder
      ),
      couponHelperText: toCopyText(
        cartItemSection.couponHelperText,
        DEFAULT_CHECKOUT_COPY.cartItemSection.couponHelperText
      ),
      itemPriceLabel: toCopyText(
        cartItemSection.itemPriceLabel,
        DEFAULT_CHECKOUT_COPY.cartItemSection.itemPriceLabel
      ),
      subTotalLabel: normalizeCheckoutSubtotalLabel(
        cartItemSection.subTotalLabel,
        DEFAULT_CHECKOUT_COPY.cartItemSection.subTotalLabel
      ),
      shippingLabel: toCopyText(
        cartItemSection.shippingLabel,
        DEFAULT_CHECKOUT_COPY.cartItemSection.shippingLabel
      ),
      discountLabel: toCopyText(
        cartItemSection.discountLabel,
        DEFAULT_CHECKOUT_COPY.cartItemSection.discountLabel
      ),
      taxLabel: toCopyText(
        cartItemSection.taxLabel,
        DEFAULT_CHECKOUT_COPY.cartItemSection.taxLabel
      ),
      totalCostLabel: normalizeCheckoutTotalLabel(
        cartItemSection.totalCostLabel,
        DEFAULT_CHECKOUT_COPY.cartItemSection.totalCostLabel
      ),
      postSubmitNotice: toCopyText(
        cartItemSection.postSubmitNotice,
        DEFAULT_CHECKOUT_COPY.cartItemSection.postSubmitNotice
      ),
      confirmationHelperText: toCopyText(
        cartItemSection.confirmationHelperText,
        DEFAULT_CHECKOUT_COPY.cartItemSection.confirmationHelperText
      ),
      summaryReadyHint: toCopyText(
        cartItemSection.summaryReadyHint,
        DEFAULT_CHECKOUT_COPY.cartItemSection.summaryReadyHint
      ),
    },
  };
};

const resolveOrderPayload = (response) => {
  const candidates = [
    response?.data?.data,
    response?.data?.order,
    response?.data,
    response?.order,
    response,
  ];
  return (
    candidates.find((candidate) => candidate && typeof candidate === "object") || {}
  );
};

function SectionTitle({ number, title, hint }) {
  return (
    <div className="space-y-1">
      <div className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
        {number}
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

function fieldClass(hasError) {
  return `${INPUT_CLASS} ${
    hasError ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""
  }`;
}

const EMPTY_CHECKOUT_SHIPPING_FORM = {
  province: "",
  city: "",
  district: "",
  postalCode: "",
  streetName: "",
  building: "",
  houseNumber: "",
  otherDetails: "",
  markAs: "HOME",
};

function resolveCouponReasonMessage(reason, minSpend) {
  switch (reason) {
    case "not_found":
      return "Coupon not found";
    case "inactive":
      return "Coupon is inactive";
    case "not_started":
      return "Coupon is not active yet";
    case "expired":
      return "Coupon has expired";
    case "minSpend":
      return `Minimum purchase ${formatCurrency(Number(minSpend || 0))} required`;
    case "scope_required":
      return "This coupon only applies to its linked store";
    case "scope_mismatch":
      return "This coupon does not match the store in this checkout";
    default:
      return GENERIC_ERROR;
  }
}

function resolveInvalidCheckoutItemMessage(item) {
  return resolveVariantCheckoutMessage(item, "This item is currently blocked from checkout.");
}

function getCheckoutPaymentProfileStatusLabel(group) {
  return (
    group?.paymentProfileStatusMeta?.label ||
    String(group?.paymentProfileStatus || "").trim() ||
    "Unavailable"
  );
}

function getCheckoutPaymentProfileStatusSource(group) {
  return group?.paymentProfileStatusMeta?.label ? "meta" : "fallback";
}

function getCheckoutGroupPaymentBadgeLabel(group) {
  return (
    group?.paymentAvailabilityMeta?.label ||
    (group?.paymentAvailable ? "Payment Ready" : "Payment Blocked")
  );
}

function getCheckoutGroupPaymentBadgeSource(group) {
  return group?.paymentAvailabilityMeta?.label ? "meta" : "fallback";
}

function getCheckoutGroupBlockedReason(group) {
  const metaReason = String(group?.paymentAvailabilityMeta?.reason || "").trim();
  if (metaReason) return metaReason;
  const warning = String(group?.warning || "").trim();
  if (warning) return warning;
  return "This store is not ready for checkout yet.";
}

function getCheckoutGroupBlockedReasonSource(group) {
  const metaReason = String(group?.paymentAvailabilityMeta?.reason || "").trim();
  if (metaReason) return "meta";
  const warning = String(group?.warning || "").trim();
  if (warning) return "warning";
  return "fallback";
}

function getCheckoutPaymentBlockerMessage(groups) {
  const blockedGroups = Array.isArray(groups)
    ? groups.filter((group) => !group?.paymentAvailable)
    : [];
  if (blockedGroups.length === 0) return null;

  if (blockedGroups.length === 1) {
    const group = blockedGroups[0];
    return `${group?.storeName || "This store"} cannot accept checkout yet. ${getCheckoutGroupBlockedReason(
      group
    )}`;
  }

  const blockedSummary = blockedGroups
    .map(
      (group) =>
        `${group?.storeName || `Store ${group?.storeId}`}: ${getCheckoutGroupBlockedReason(group)}`
    )
    .join(" ");

  return `Checkout is blocked until every store has an active backend payment setup. ${blockedSummary}`;
}

function getCheckoutPreviewGroupTestId(group, part) {
  return `checkout-preview-group-${part}-${group?.storeId ?? "unknown"}`;
}

function resolveCheckoutSubmitErrorMessage(data, fallbackMessage) {
  const serverMessage =
    typeof fallbackMessage === "string" && fallbackMessage.trim()
      ? fallbackMessage.trim()
      : "";
  const invalidItems = Array.isArray(data?.data?.invalidItems) ? data.data.invalidItems : [];
  if (invalidItems.length > 0) {
    const invalidDetail = resolveVariantCheckoutMessage(
      invalidItems[0],
      resolveInvalidCheckoutItemMessage(invalidItems[0])
    );
    return serverMessage ? `${serverMessage} ${invalidDetail}` : invalidDetail;
  }

  const couponMessage =
    typeof data?.data?.coupon?.message === "string" && data.data.coupon.message.trim()
      ? data.data.coupon.message.trim()
      : "";
  if (couponMessage) {
    return serverMessage || couponMessage;
  }

  const available = Number(data?.data?.available);
  const requested = Number(data?.data?.requested);
  const productName =
    typeof data?.data?.name === "string" && data.data.name.trim() ? data.data.name.trim() : "";
  if (Number.isFinite(available) && Number.isFinite(requested)) {
    const stockDetail = productName
      ? `${productName} only has ${Math.max(0, available)} left, but checkout requested ${requested}.`
      : `Stock changed before checkout. Only ${Math.max(0, available)} left for the requested quantity ${requested}.`;
    return serverMessage ? `${serverMessage} ${stockDetail}` : stockDetail;
  }

  if (Array.isArray(data?.data?.groups)) {
    return (
      serverMessage ||
      "One or more stores are not ready for checkout yet. Fix the blocked store groups and try again."
    );
  }

  return serverMessage || ORDER_FAILED;
}

const canReselectInvalidCheckoutItem = (invalidItem) =>
  RECOVERY_RESELECT_CODES.has(String(invalidItem?.code || invalidItem?.reason || "").trim().toUpperCase());

const buildVariantRecoveryState = (item, invalidItem, sourcePath) => {
  const rawSelections =
    invalidItem?.meta?.variantSelections ??
    invalidItem?.variantSelections ??
    item?.variantSelections ??
    [];

  return {
    checkoutRecovery: {
      reason: String(invalidItem?.code || invalidItem?.reason || "").trim().toUpperCase() || null,
      productId: Number(item?.productId ?? invalidItem?.productId) || null,
      productName:
        String(item?.name || item?.productName || invalidItem?.productName || "").trim() || null,
      variantKey: invalidItem?.variantKey ?? item?.variantKey ?? null,
      variantSelections: Array.isArray(rawSelections) ? rawSelections : [],
      source: "checkout",
      fromPath: sourcePath,
    },
  };
};

const CHECKOUT_PREVIEW_AMOUNT_TOLERANCE = 0.01;

const toCheckoutPreviewNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeCheckoutPreviewToken = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized || null;
};

const normalizeCheckoutPreviewSelections = (value) => {
  if (!Array.isArray(value)) return "";

  return value
    .map((selection) => {
      const attribute =
        normalizeCheckoutPreviewToken(
          selection?.attributeId ??
            selection?.attribute_id ??
            selection?.attributeName ??
            selection?.name
        ) || "";
      const selectedValue =
        normalizeCheckoutPreviewToken(
          selection?.valueId ??
            selection?.value_id ??
            selection?.value ??
            selection?.label
        ) || "";
      return `${attribute}:${selectedValue}`;
    })
    .filter((entry) => entry !== ":")
    .sort()
    .join("|");
};

const resolveCheckoutPreviewQuantity = (item) => {
  const quantityEntries = [
    ["quantity", item?.quantity],
    ["qty", item?.qty],
    ["count", item?.count],
    ["cartQuantity", item?.cartQuantity],
  ];
  const selected =
    quantityEntries.find(([, value]) => Number.isFinite(Number(value))) ?? quantityEntries[0];
  return {
    value: Math.max(0, toCheckoutPreviewNumber(selected?.[1])),
    source: selected?.[0] || "unknown",
  };
};

const resolveCheckoutPreviewVariantIdentity = (item) =>
  normalizeCheckoutPreviewToken(
    item?.variantId ??
      item?.selectedVariantId ??
      item?.variant?.id ??
      item?.variant?.variantId ??
      item?.selectedVariant?.id ??
      item?.optionsHash ??
      item?.variantKey ??
      item?.variant_key
  );

const normalizeCheckoutPreviewLine = (item) => {
  const quantity = resolveCheckoutPreviewQuantity(item);
  const price = Math.max(
    0,
    toCheckoutPreviewNumber(item?.price ?? item?.unitPrice ?? item?.unit_price)
  );
  const explicitLineTotal = toCheckoutPreviewNumber(
    item?.lineTotal ?? item?.line_total ?? item?.totalPrice,
    Number.NaN
  );
  const lineTotal = Number.isFinite(explicitLineTotal) ? explicitLineTotal : quantity.value * price;
  const productId = normalizeCheckoutPreviewToken(item?.productId ?? item?.product_id ?? item?.id);
  const productSlug = normalizeCheckoutPreviewToken(item?.productSlug ?? item?.slug);
  const variantIdentity = resolveCheckoutPreviewVariantIdentity(item);
  const storeId = normalizeCheckoutPreviewToken(
    item?.storeId ?? item?.store_id ?? item?.vendorId ?? item?.store?.id
  );
  const storeSlug = normalizeCheckoutPreviewToken(
    item?.storeSlug ?? item?.store_slug ?? item?.store?.slug
  );

  return {
    lineId: normalizeCheckoutPreviewToken(item?.lineId ?? item?.line_id),
    cartItemId: toCheckoutPreviewNumber(item?.cartItemId ?? item?.cart_item_id, 0) || null,
    productId,
    productSlug,
    productName: String(item?.productName ?? item?.name ?? "").trim(),
    variantId: normalizeCheckoutPreviewToken(
      item?.variantId ?? item?.variant_id ?? item?.selectedVariantId ?? item?.variant?.id
    ),
    variantIdentity,
    variantKey: normalizeCheckoutPreviewToken(item?.variantKey ?? item?.variant_key),
    variantSelectionsKey: normalizeCheckoutPreviewSelections(item?.variantSelections),
    storeId,
    storeSlug,
    qty: quantity.value,
    quantitySource: quantity.source,
    price,
    lineTotal,
  };
};

const normalizeCheckoutPreviewSummary = (summary) => {
  if (!summary || typeof summary !== "object") return null;
  const subtotalAmount = toCheckoutPreviewNumber(
    summary.subtotalAmount ?? summary.subtotal ?? summary.subtotal_amount,
    Number.NaN
  );
  const shippingAmount = toCheckoutPreviewNumber(
    summary.shippingAmount ?? summary.shipping ?? summary.shipping_amount,
    Number.NaN
  );
  const grandTotal = toCheckoutPreviewNumber(
    summary.grandTotal ?? summary.totalAmount ?? summary.total ?? summary.grand_total,
    Number.NaN
  );
  const totalItems = toCheckoutPreviewNumber(
    summary.totalItems ??
      summary.totalQuantity ??
      summary.quantity ??
      summary.itemQuantity ??
      summary.total_items,
    Number.NaN
  );

  return {
    ...summary,
    subtotalAmount,
    shippingAmount,
    grandTotal,
    totalItems,
  };
};

const getRawCheckoutPreviewGroups = (data) => {
  const candidates = [
    data?.groups,
    data?.storeGroups,
    data?.stores,
    data?.sellerGroups,
  ];
  const groups = candidates.find((entry) => Array.isArray(entry));
  return Array.isArray(groups) ? groups : [];
};

const buildCheckoutDisplayItemFromSummary = (item) => ({
  lineId: item.lineId,
  cartItemId: item.cartItemId,
  productId: item.productId,
  productName: item.name,
  slug: "",
  qty: item.qty,
  price: item.price,
  lineTotal: Number(item.price || 0) * Number(item.qty || 0),
  image: item.imageUrl,
  stock: item.stock,
  sku: item.variantSku ?? null,
  barcode: item.variantBarcode ?? null,
  variantKey: item.variantKey,
  variantLabel: item.variantLabel,
  variantSelections: item.variantSelections ?? [],
  category: null,
});

const buildVisibleCartCheckoutDisplayGroup = (sourceGroups, summaryItems, summary) => {
  if (!summaryItems.length) return [];
  const sourceGroup =
    Array.isArray(sourceGroups) && sourceGroups.length === 1 ? sourceGroups[0] : null;
  const displayItems = summaryItems.map(buildCheckoutDisplayItemFromSummary);
  const displaySubtotal = displayItems.reduce(
    (sum, item) => sum + Number(item.lineTotal || 0),
    0
  );
  const sourceSubtotal = Number(sourceGroup?.subtotalAmount);
  const sourceShipping = Number(sourceGroup?.shippingAmount);
  const sourceTotal = Number(sourceGroup?.totalAmount);
  const summaryShipping = Number(summary?.shippingAmount);
  const shippingAmount = Number.isFinite(sourceShipping)
    ? sourceShipping
    : Number.isFinite(summaryShipping)
      ? summaryShipping
      : 0;
  const subtotalAmount = Number.isFinite(sourceSubtotal) ? sourceSubtotal : displaySubtotal;

  return [
    {
      storeId: sourceGroup?.storeId ?? "visible-cart",
      storeName: sourceGroup?.storeName || "Store summary",
      storeSlug: sourceGroup?.storeSlug || "",
      subtotalAmount,
      shippingAmount,
      totalAmount: Number.isFinite(sourceTotal) ? sourceTotal : subtotalAmount + shippingAmount,
      paymentAvailable:
        typeof sourceGroup?.paymentAvailable === "boolean" ? sourceGroup.paymentAvailable : true,
      paymentMethod: sourceGroup?.paymentMethod ?? null,
      paymentProfileStatus: sourceGroup?.paymentProfileStatus ?? "Unavailable",
      paymentProfileStatusMeta: sourceGroup?.paymentProfileStatusMeta ?? null,
      paymentAvailabilityMeta: sourceGroup?.paymentAvailabilityMeta ?? null,
      merchantName: sourceGroup?.merchantName ?? null,
      accountName: sourceGroup?.accountName ?? null,
      qrisImageUrl: sourceGroup?.qrisImageUrl ?? null,
      qrisPayload: sourceGroup?.qrisPayload ?? null,
      paymentInstruction: sourceGroup?.paymentInstruction ?? null,
      warning: sourceGroup?.warning ?? null,
      items: displayItems,
    },
  ];
};

const resolveCheckoutPreviewDisplayGroups = ({
  checkoutPreviewGroups,
  rawCheckoutPreviewGroups,
  summaryItems,
  checkoutPreviewSummary,
  canUseVisibleCartFallback,
}) => {
  const previewGroups = Array.isArray(checkoutPreviewGroups) ? checkoutPreviewGroups : [];
  const hasRenderablePreviewItems = previewGroups.some(
    (group) => Array.isArray(group?.items) && group.items.length > 0
  );
  if (hasRenderablePreviewItems) return previewGroups;
  if (!canUseVisibleCartFallback) return previewGroups;
  return buildVisibleCartCheckoutDisplayGroup(
    previewGroups.length > 0 ? previewGroups : rawCheckoutPreviewGroups,
    summaryItems,
    checkoutPreviewSummary
  );
};

const checkoutPreviewAmountsMatch = (left, right) =>
  Math.abs(toCheckoutPreviewNumber(left) - toCheckoutPreviewNumber(right)) <=
  CHECKOUT_PREVIEW_AMOUNT_TOLERANCE;

const buildCheckoutPreviewLineFingerprint = (line) =>
  [
    line?.storeId ? `sid:${line.storeId}` : line?.storeSlug ? `sslug:${line.storeSlug}` : "store:",
    line?.productId ? `pid:${line.productId}` : line?.productSlug ? `pslug:${line.productSlug}` : "product:",
    line?.variantIdentity ? `variant:${line.variantIdentity}` : "variant:",
    `qty:${toCheckoutPreviewNumber(line?.qty)}`,
  ].join("|");

const buildCheckoutPreviewFingerprint = (lines) =>
  (Array.isArray(lines) ? lines : [])
    .map(buildCheckoutPreviewLineFingerprint)
    .sort()
    .join("||");

const checkoutPreviewStoreCompatible = (localLine, previewLine) => {
  if (localLine?.storeId && previewLine?.storeId) {
    return localLine.storeId === previewLine.storeId;
  }
  if (localLine?.storeSlug && previewLine?.storeSlug) {
    return localLine.storeSlug === previewLine.storeSlug;
  }
  return true;
};

const checkoutPreviewVariantCompatible = (localLine, previewLine, requireVariantIdentity) => {
  const bothHaveCartItemId = Boolean(localLine.cartItemId && previewLine.cartItemId);
  const sameCartItem = bothHaveCartItemId && localLine.cartItemId === previewLine.cartItemId;
  const bothHaveLineId = Boolean(localLine.lineId && previewLine.lineId);
  const sameLineId = bothHaveLineId && localLine.lineId === previewLine.lineId;

  const bothHaveVariantId = Boolean(localLine.variantIdentity && previewLine.variantIdentity);
  const bothHaveVariantKey = Boolean(localLine.variantKey && previewLine.variantKey);
  const bothHaveSelections = Boolean(localLine.variantSelectionsKey && previewLine.variantSelectionsKey);
  const variantIdsMatch = bothHaveVariantId && localLine.variantIdentity === previewLine.variantIdentity;
  const variantKeysMatch = bothHaveVariantKey && localLine.variantKey === previewLine.variantKey;
  const selectionsMatch =
    bothHaveSelections && localLine.variantSelectionsKey === previewLine.variantSelectionsKey;
  if (!sameCartItem && !sameLineId) {
    if (bothHaveVariantId && !variantIdsMatch) return false;
    if (bothHaveVariantKey && !variantKeysMatch) return false;
    if (!variantIdsMatch && !variantKeysMatch && bothHaveSelections && !selectionsMatch) return false;
  }
  if (
    requireVariantIdentity &&
    (
      localLine.variantIdentity ||
      previewLine.variantIdentity ||
      localLine.variantKey ||
      previewLine.variantKey ||
      localLine.variantSelectionsKey ||
      previewLine.variantSelectionsKey
    ) &&
    !sameCartItem &&
    !sameLineId &&
    !variantIdsMatch &&
    !variantKeysMatch &&
    !selectionsMatch
  ) {
    return false;
  }

  return true;
};

const checkoutPreviewLineMatches = (localLine, previewLine, requireVariantIdentity) => {
  if (!localLine?.productId || localLine.productId !== previewLine?.productId) return false;
  if (!checkoutPreviewStoreCompatible(localLine, previewLine)) return false;
  if (!checkoutPreviewVariantCompatible(localLine, previewLine, requireVariantIdentity)) {
    return false;
  }
  return checkoutPreviewAmountsMatch(localLine.qty, previewLine.qty);
};

const compareCheckoutPreviewLines = (localLines, previewLines) => {
  if (!localLines.length) {
    return {
      matched: false,
      reason: "VISIBLE_CART_EMPTY",
      visible: localLines,
      preview: previewLines,
    };
  }
  if (!previewLines.length) {
    return {
      matched: false,
      reason: "PREVIEW_EMPTY",
      visible: localLines,
      preview: previewLines,
    };
  }
  if (localLines.length !== previewLines.length) {
    return {
      matched: false,
      reason: "ITEM_COUNT_MISMATCH",
      visible: localLines,
      preview: previewLines,
    };
  }

  const localProductCounts = localLines.reduce((counts, line) => {
    counts.set(line.productId, (counts.get(line.productId) || 0) + 1);
    return counts;
  }, new Map());
  const previewProductCounts = previewLines.reduce((counts, line) => {
    counts.set(line.productId, (counts.get(line.productId) || 0) + 1);
    return counts;
  }, new Map());
  const unmatchedPreviewLines = [...previewLines];

  for (const localLine of localLines) {
    const requireVariantIdentity =
      (localProductCounts.get(localLine.productId) || 0) > 1 ||
      (previewProductCounts.get(localLine.productId) || 0) > 1;
    const matchIndex = unmatchedPreviewLines.findIndex((previewLine) =>
      checkoutPreviewLineMatches(localLine, previewLine, requireVariantIdentity)
    );
    if (matchIndex === -1) {
      const productCandidates = unmatchedPreviewLines.filter(
        (previewLine) => previewLine?.productId === localLine?.productId
      );
      const storeCandidates = productCandidates.filter((previewLine) =>
        checkoutPreviewStoreCompatible(localLine, previewLine)
      );
      const variantCandidates = storeCandidates.filter((previewLine) =>
        checkoutPreviewVariantCompatible(localLine, previewLine, requireVariantIdentity)
      );
      const hasUnmappedStoreIdentity =
        productCandidates.length > 0 &&
        !localLine?.storeId &&
        !previewLines.some((line) => line?.storeSlug && localLine?.storeSlug);
      return {
        matched: false,
        reason:
          productCandidates.length === 0
            ? "PRODUCT_ID_MISMATCH"
            : storeCandidates.length === 0
              ? hasUnmappedStoreIdentity
                ? "STORE_ID_SLUG_UNMAPPED"
                : "STORE_MISMATCH"
              : variantCandidates.length === 0
                ? "VARIANT_ID_MISMATCH"
                : "QUANTITY_MISMATCH",
        visible: localLines,
        preview: previewLines,
        visibleLine: localLine,
        previewCandidates: productCandidates,
      };
    }
    unmatchedPreviewLines.splice(matchIndex, 1);
  }

  return {
    matched: true,
    reason: "MATCHED",
    visible: localLines,
    preview: previewLines,
  };
};

const getCheckoutPreviewStatus = ({
  visibleLines,
  previewLines,
  visibleSummary,
  previewSummary,
  isBootstrapping,
  isPreviewLoading,
  previewError,
  hasPreviewSnapshot,
  previewHasRenderableGroups,
}) => {
  const normalizedVisibleLines = Array.isArray(visibleLines) ? visibleLines : [];
  const normalizedPreviewLines = Array.isArray(previewLines) ? previewLines : [];
  const visibleLineCount = normalizedVisibleLines.length;
  const previewLineCount = normalizedPreviewLines.length;
  const visibleTotalQuantity = toCheckoutPreviewNumber(visibleSummary?.totalItems);
  const visibleSubtotal = toCheckoutPreviewNumber(visibleSummary?.subtotalAmount);
  const previewLineTotalQuantity = normalizedPreviewLines.reduce(
    (sum, line) => sum + toCheckoutPreviewNumber(line?.qty),
    0
  );
  const previewLineSubtotal = normalizedPreviewLines.reduce(
    (sum, line) => sum + toCheckoutPreviewNumber(line?.lineTotal),
    0
  );
  const previewTotalQuantity = Number.isFinite(Number(previewSummary?.totalItems))
    ? toCheckoutPreviewNumber(previewSummary?.totalItems)
    : previewLineTotalQuantity;
  const previewSubtotal = Number.isFinite(Number(previewSummary?.subtotalAmount))
    ? toCheckoutPreviewNumber(previewSummary?.subtotalAmount)
    : previewLineSubtotal;

  const base = {
    isLoading: false,
    isReady: false,
    isMismatch: false,
    isUsingFallback: false,
    reason: "unknown",
    comparison: {
      matched: false,
      reason: "UNKNOWN",
      visible: normalizedVisibleLines,
      preview: normalizedPreviewLines,
    },
    visibleFingerprint: buildCheckoutPreviewFingerprint(normalizedVisibleLines),
    previewFingerprint: buildCheckoutPreviewFingerprint(normalizedPreviewLines),
    visibleSubtotal,
    previewSubtotal,
    visibleTotalQuantity,
    previewTotalQuantity,
    visibleLineCount,
    previewLineCount,
    lineCountMatches: visibleLineCount === previewLineCount,
    totalQuantityMatches: checkoutPreviewAmountsMatch(
      visibleTotalQuantity,
      previewTotalQuantity
    ),
    subtotalMatches: checkoutPreviewAmountsMatch(visibleSubtotal, previewSubtotal),
    linesMatch: false,
  };

  if (visibleLineCount === 0) {
    return {
      ...base,
      reason: "VISIBLE_CART_EMPTY",
      comparison: {
        ...base.comparison,
        reason: "VISIBLE_CART_EMPTY",
      },
    };
  }

  if (isBootstrapping || isPreviewLoading) {
    return {
      ...base,
      isLoading: true,
      reason: "PREVIEW_LOADING",
      comparison: {
        ...base.comparison,
        reason: "PREVIEW_LOADING",
      },
    };
  }

  if (previewError) {
    return {
      ...base,
      isMismatch: false,
      reason: "PREVIEW_ERROR",
      comparison: {
        ...base.comparison,
        reason: "PREVIEW_ERROR",
      },
    };
  }

  if (!hasPreviewSnapshot || !previewSummary) {
    return {
      ...base,
      isLoading: true,
      reason: "PREVIEW_EMPTY",
      comparison: {
        ...base.comparison,
        reason: "PREVIEW_EMPTY",
      },
    };
  }

  const comparison = compareCheckoutPreviewLines(
    normalizedVisibleLines,
    normalizedPreviewLines
  );
  const status = {
    ...base,
    comparison,
    linesMatch: comparison.matched,
    lineCountMatches: visibleLineCount === previewLineCount,
    totalQuantityMatches: checkoutPreviewAmountsMatch(
      visibleTotalQuantity,
      previewTotalQuantity
    ),
    subtotalMatches: checkoutPreviewAmountsMatch(visibleSubtotal, previewSubtotal),
  };
  const isReady =
    comparison.matched &&
    status.lineCountMatches &&
    status.totalQuantityMatches;

  if (isReady) {
    return {
      ...status,
      isReady: true,
      isUsingFallback: !previewHasRenderableGroups,
      reason: "READY",
    };
  }

  const reason = !status.lineCountMatches
    ? "ITEM_COUNT_MISMATCH"
    : !comparison.matched
      ? comparison.reason
      : !status.totalQuantityMatches
        ? "QUANTITY_MISMATCH"
        : "CHECKOUT_PREVIEW_MISMATCH";

  return {
    ...status,
    isMismatch: true,
    reason,
  };
};

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const publicStoreSettings = outletContext.storeSettings || null;
  const { user, isLoading: isAuthLoading } = useAuth() || {};
  const queryClient = useQueryClient();
  const {
    items,
    isLoading: isCartLoading,
    hasInitialized: hasCartBootstrapInitialized,
    refreshCart,
    update: updateCartItem,
    remove: removeCartItem,
  } = useCart();
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const subtotal = useCartStore((state) => state.subtotal);
  const totalQty = useCartStore((state) => state.totalQty);
  const clearCart = useCartStore((state) => state.clearCart);
  const isRemoteSyncing = useCartStore((state) => state.isRemoteSyncing);
  const cartPreflightWarning =
    typeof location.state?.cartPreflightWarning === "string"
      ? location.state.cartPreflightWarning
      : "";
  const postLoginState =
    location.state && typeof location.state === "object"
      ? { ...location.state }
      : undefined;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingForm, setShippingForm] = useState(EMPTY_CHECKOUT_SHIPPING_FORM);
  const [useDefaultShipping, setUseDefaultShipping] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressStatus, setAddressStatus] = useState("");
  const [paymentOptionId, setPaymentOptionId] = useState(PAYMENT_OPTIONS[0].id);
  const [duitkuPaymentMethod, setDuitkuPaymentMethod] = useState(DEFAULT_DUITKU_PAYMENT_METHOD);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponStatus, setCouponStatus] = useState("idle");
  const [appliedCouponMeta, setAppliedCouponMeta] = useState(null);
  const [couponBaseline, setCouponBaseline] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [groupCouponCodes, setGroupCouponCodes] = useState({});
  const [groupCouponStates, setGroupCouponStates] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    postalCode: "",
    streetName: "",
    houseNumber: "",
  });
  const submitLockRef = useRef(false);
  const firstNameRef = useRef(null);
  const phoneRef = useRef(null);
  const provinceRef = useRef(null);
  const streetNameRef = useRef(null);
  const resolveHasAuthHint = () => {
    try {
      return (
        Boolean(localStorage.getItem("authToken")) ||
        localStorage.getItem("authSessionHint") === "true"
      );
    } catch {
      return false;
    }
  };
  const hasCheckoutAuthHint = resolveHasAuthHint();
  const checkoutCustomizationQuery = useQuery({
    queryKey: ["store-customization", "checkout", "en"],
    queryFn: () => getStoreCustomization({ lang: "en", include: "checkout" }),
    staleTime: 60_000,
    retry: 1,
  });

  const checkoutCopy = useMemo(
    () => normalizeCheckoutCopy(checkoutCustomizationQuery.data?.customization?.checkout),
    [checkoutCustomizationQuery.data]
  );
  useEffect(() => {
    if (!checkoutCustomizationQuery.isError) return;
    if (IS_CHECKOUT_PREVIEW_DEBUG_ENABLED) {
      console.warn("[checkout] failed to load checkout customization; using defaults.");
    }
  }, [checkoutCustomizationQuery.isError]);

  useEffect(() => {
    if (!user?.email) return;
    setEmail((prev) => (prev.trim() ? prev : String(user.email).trim()));
  }, [user?.email]);

  useEffect(() => {
    if (!hasCheckoutAuthHint) {
      return;
    }
    if (isAuthLoading) return;
    if (user) return;
    navigate(
      "/auth/login",
      {
        replace: true,
        state: buildLoginRedirectState({
          from: "/checkout",
          authNotice: CHECKOUT_LOGIN_REQUIRED_NOTICE,
          postLoginState,
        }),
      }
    );
  }, [hasCheckoutAuthHint, isAuthLoading, navigate, postLoginState, user]);

  useEffect(() => {
    if (!hasCheckoutAuthHint || !hasHydrated || !user) return;
    void refreshCart(false);
  }, [hasCheckoutAuthHint, hasHydrated, refreshCart, user]);

  const hasItems = items.length > 0;
  const isInitialCartSyncing =
    hasCheckoutAuthHint &&
    hasHydrated &&
    (Boolean(isAuthLoading) ||
      !hasCartBootstrapInitialized ||
      (Boolean(isCartLoading) && !hasItems));
  const showCheckoutSkeleton = !hasHydrated || isInitialCartSyncing;
  const lockAddressFields = isSubmitting || isAddressLoading || useDefaultShipping;
  const fallbackShippingCost = 0;
  const provinceOptions = useMemo(
    () => getProvinceOptions(shippingForm.province),
    [shippingForm.province]
  );
  const cityOptions = useMemo(
    () => getCityOptions(shippingForm.province, shippingForm.city),
    [shippingForm.province, shippingForm.city]
  );
  const districtOptions = useMemo(
    () =>
      getDistrictOptions(
        shippingForm.province,
        shippingForm.city,
        shippingForm.district
      ),
    [shippingForm.province, shippingForm.city, shippingForm.district]
  );

  const summaryItems = useMemo(
    () =>
      items.map((item) => ({
        lineId: item.lineId || `${Number(item.productId ?? item.id)}:${String(item.variantKey || "base")}`,
        cartItemId: Number(item.cartItemId) || null,
        productId: Number(item.productId ?? item.id),
        name: item.name || "Product",
        qty: Math.max(1, Number(item.quantity ?? item.qty ?? 1)),
        price: Number(item.price ?? 0),
        imageUrl: item.imageUrl ?? item.image ?? null,
        stock: item.stock ?? null,
        storeSlug: item.storeSlug ?? item.store?.slug ?? null,
        variantId: item.variantId ?? item.selectedVariantId ?? item.variant?.id ?? null,
        variantKey: item.variantKey ?? null,
        variantLabel: item.variantLabel ?? null,
        variantSelections: Array.isArray(item.variantSelections) ? item.variantSelections : [],
        variantSku: item.variantSku ?? null,
        variantBarcode: item.variantBarcode ?? null,
      })),
    [items]
  );
  const checkoutPreviewSignature = useMemo(
    () =>
      summaryItems
        .map((item) => `${item.lineId}:${item.qty}`)
        .sort()
        .join("|"),
    [summaryItems]
  );
  const checkoutPreviewRequestPayload = useMemo(() => ({}), []);
  const checkoutPreviewQuery = useQuery({
    queryKey: ["checkout-preview-by-store", checkoutPreviewSignature],
    queryFn: () => previewCheckoutByStore(checkoutPreviewRequestPayload),
    enabled:
      hasHydrated &&
      hasCartBootstrapInitialized &&
      hasItems &&
      !isCartLoading &&
      !isRemoteSyncing &&
      hasCheckoutAuthHint &&
      Boolean(user),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: false,
  });

  const fullName = buildFullName(firstName, lastName);
  const phoneValue = phone.trim();
  const paymentMethod = "QRIS";
  const normalizedShippingForm = useMemo(
    () => toUserAddressPayload({ ...shippingForm, fullName, phoneNumber: phoneValue }),
    [shippingForm, fullName, phoneValue]
  );
  const shippingAddress = formatAddressSummary(normalizedShippingForm);
  const shippingDetailsPayload = useMemo(
    () => ({
      fullName,
      phoneNumber: phoneValue,
      province: normalizedShippingForm.province,
      city: normalizedShippingForm.city,
      district: normalizedShippingForm.district,
      postalCode: normalizedShippingForm.postalCode,
      streetName: normalizedShippingForm.streetName,
      building: normalizedShippingForm.building || "",
      houseNumber: normalizedShippingForm.houseNumber,
      otherDetails: normalizedShippingForm.otherDetails || "",
      markAs: normalizedShippingForm.markAs,
    }),
    [fullName, phoneValue, normalizedShippingForm]
  );

  const payloadDraft = useMemo(
    () => ({
      customer: {
        name: fullName,
        phone: phoneValue,
        address: shippingAddress,
      },
      paymentMethod,
      items: summaryItems.map((item) => ({
        lineId: item.lineId,
        cartItemId: item.cartItemId,
        productId: item.productId,
        variantKey: item.variantKey,
        qty: item.qty,
      })),
      couponCode: appliedCouponMeta?.code || undefined,
      useDefaultShipping,
      shippingDetails: useDefaultShipping ? undefined : shippingDetailsPayload,
    }),
    [
      fullName,
      phoneValue,
      shippingAddress,
      paymentMethod,
      summaryItems,
      appliedCouponMeta,
      useDefaultShipping,
      shippingDetailsPayload,
    ]
  );
  const checkoutPreviewData = checkoutPreviewQuery.data?.data;
  const hasCheckoutPreviewSnapshot =
    checkoutPreviewData && typeof checkoutPreviewData === "object";
  const rawCheckoutPreviewGroups = getRawCheckoutPreviewGroups(checkoutPreviewData);
  const rawCheckoutPreviewSummary = normalizeCheckoutPreviewSummary(
    checkoutPreviewData?.summary ?? null
  );
  const localCartSubtotalValue = summaryItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0
  );
  const localCartTotalQty = summaryItems.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0
  );
  const localCartPreviewLines = summaryItems.map((item) =>
    normalizeCheckoutPreviewLine({
      lineId: item.lineId,
      cartItemId: item.cartItemId,
      productId: item.productId,
      variantId: item.variantId,
      storeSlug: item.storeSlug,
      variantKey: item.variantKey,
      variantSelections: item.variantSelections,
      qty: item.qty,
      price: item.price,
      lineTotal: Number(item.price || 0) * Number(item.qty || 0),
    })
  );
  const backendCartPreviewLines = rawCheckoutPreviewGroups
    .flatMap((group) =>
      (Array.isArray(group?.items) ? group.items : []).map((item) => ({
        ...item,
        storeSlug: item?.storeSlug ?? group?.storeSlug ?? group?.store?.slug ?? null,
      }))
    )
    .map((item) => normalizeCheckoutPreviewLine(item));
  const rawCheckoutPreviewItemsLength = rawCheckoutPreviewGroups.reduce(
    (sum, group) => sum + (Array.isArray(group?.items) ? group.items.length : 0),
    0
  );
  const rawCheckoutPreviewHasRenderableGroups = rawCheckoutPreviewGroups.some(
    (group) => Array.isArray(group?.items) && group.items.length > 0
  );
  const checkoutPreviewStatus = getCheckoutPreviewStatus({
    visibleLines: localCartPreviewLines,
    previewLines: backendCartPreviewLines,
    visibleSummary: {
      totalItems: localCartTotalQty,
      subtotalAmount: localCartSubtotalValue,
      shippingAmount: 0,
      grandTotal: localCartSubtotalValue,
    },
    previewSummary: rawCheckoutPreviewSummary,
    isBootstrapping:
      !hasHydrated ||
      !hasCartBootstrapInitialized ||
      isCartLoading ||
      isRemoteSyncing,
    isPreviewLoading: checkoutPreviewQuery.isLoading,
    previewError: checkoutPreviewQuery.isError,
    hasPreviewSnapshot: Boolean(hasCheckoutPreviewSnapshot),
    previewHasRenderableGroups: rawCheckoutPreviewHasRenderableGroups,
  });
  const checkoutPreviewInvalidItems = checkoutPreviewData?.invalidItems ?? [];
  const hasCheckoutPreviewInvalidItems = checkoutPreviewInvalidItems.length > 0;
  const hasCheckoutPreviewCartMismatch =
    checkoutPreviewStatus.isMismatch && !hasCheckoutPreviewInvalidItems;
  const checkoutPreviewGroups = hasCheckoutPreviewCartMismatch
    ? []
    : rawCheckoutPreviewGroups;
  const checkoutPreviewInvalidMessages = checkoutPreviewInvalidItems.map((item) => ({
    ...item,
    message: resolveInvalidCheckoutItemMessage(item),
  }));
  const checkoutPreviewSummary = hasCheckoutPreviewCartMismatch
    ? null
    : rawCheckoutPreviewSummary;
  const checkoutPreviewDisplayGroups = resolveCheckoutPreviewDisplayGroups({
    checkoutPreviewGroups,
    rawCheckoutPreviewGroups,
    summaryItems,
    checkoutPreviewSummary,
    canUseVisibleCartFallback:
      hasItems &&
      !checkoutPreviewQuery.isLoading &&
      !checkoutPreviewQuery.isError &&
      checkoutPreviewStatus.isReady,
  });
  const checkoutMode = checkoutPreviewData?.checkoutMode ?? "SINGLE_STORE";
  const singleStoreCheckoutGroup =
    checkoutMode === "SINGLE_STORE" && checkoutPreviewGroups.length === 1
      ? checkoutPreviewGroups[0]
      : null;
  const appliedGroupCoupons = useMemo(
    () =>
      checkoutPreviewGroups
        .map((group) => {
          const storeKey = String(group.storeId);
          const appliedMeta = groupCouponStates?.[storeKey]?.appliedMeta ?? null;
          if (!appliedMeta?.code) return null;
          return {
            storeId: Number(group.storeId),
            couponCode: String(appliedMeta.code).trim().toUpperCase(),
            discount: Number(appliedMeta.discount || 0),
          };
        })
        .filter(Boolean),
    [checkoutPreviewGroups, groupCouponStates]
  );
  const previewSubtotalValue = Number(checkoutPreviewSummary?.subtotalAmount);
  const previewShippingValue = Number(checkoutPreviewSummary?.shippingAmount);
  const previewGrandTotalValue = Number(checkoutPreviewSummary?.grandTotal);
  const subtotalValue = Number.isFinite(previewSubtotalValue)
    ? previewSubtotalValue
    : localCartSubtotalValue || Number(subtotal || 0);
  const shippingCost = Number.isFinite(previewShippingValue)
    ? previewShippingValue
    : fallbackShippingCost;
  const orderLevelDiscountValue = Number(discount || 0);
  const groupDiscountValue = appliedGroupCoupons.reduce(
    (sum, entry) => sum + Number(entry?.discount || 0),
    0
  );
  const discountValue = orderLevelDiscountValue + groupDiscountValue;
  const taxValue = 0;
  const baseGrandTotal = Number.isFinite(previewGrandTotalValue)
    ? previewGrandTotalValue
    : subtotalValue + shippingCost;
  const total = Math.max(0, baseGrandTotal - discountValue);
  const previewHasPaymentBlocker = checkoutPreviewGroups.some(
    (group) => !group.paymentAvailable
  );
  const previewPaymentBlockerMessage = getCheckoutPaymentBlockerMessage(
    checkoutPreviewGroups
  );
  const couponBlocksSubmission =
    checkoutMode === "MULTI_STORE" && Boolean(appliedCouponMeta?.code);
  const hasGroupCouponLoading = checkoutPreviewGroups.some((group) => {
    const storeKey = String(group.storeId);
    return groupCouponStates?.[storeKey]?.status === "loading";
  });
  const previewBlocksPricingActions =
    hasCheckoutAuthHint &&
    hasItems &&
    !checkoutPreviewStatus.isReady;
  const isCheckoutSummaryReady = checkoutPreviewStatus.isReady;
  const checkoutSummaryGuardMessage = checkoutPreviewStatus.isMismatch
    ? hasCheckoutPreviewInvalidItems
      ? "Resolve checkout blockers before totals can be finalized."
      : "Latest checkout snapshot is refreshing. Totals below use the cart currently shown."
    : checkoutPreviewStatus.reason === "PREVIEW_ERROR"
      ? "Latest checkout snapshot is unavailable. Totals stay hidden until preview recovers."
      : "Waiting for the latest backend snapshot before showing checkout totals.";
  const isPreviewBlockingSubmission =
    previewBlocksPricingActions ||
    (!checkoutPreviewQuery.isError &&
      (previewHasPaymentBlocker || checkoutPreviewInvalidItems.length > 0));
  const paymentOptions = useMemo(() => {
    const allStoresPaymentReady =
      isCheckoutSummaryReady &&
      checkoutPreviewGroups.length > 0 &&
      checkoutPreviewGroups.every((group) => group?.paymentAvailable === true);
    
    if (!allStoresPaymentReady) return [];

    const availableMethods = Array.isArray(publicStoreSettings?.payments?.methods)
      ? publicStoreSettings.payments.methods
      : [];
    const availableCodes = availableMethods
      .map((method) => String(method?.code || "").trim().toUpperCase())
      .filter(Boolean);
    const hasDuitkuAvailabilitySignal =
      availableCodes.length > 0 ||
      typeof publicStoreSettings?.payments?.duitkuEnabled === "boolean";
    const isDuitkuAvailable = hasDuitkuAvailabilitySignal
      ? availableCodes.includes("DUITKU") || publicStoreSettings?.payments?.duitkuEnabled === true
      : true;

    return PAYMENT_OPTIONS.filter(option => {
      if (option.id === "duitku") return isDuitkuAvailable;
      return true; // Keep qris by default as fallback
    });
  }, [checkoutPreviewGroups, isCheckoutSummaryReady, publicStoreSettings]);
  const paymentMethodNotice = previewHasPaymentBlocker
    ? previewPaymentBlockerMessage ||
      "Payment is unavailable until every store has an active approved payment setup."
    : !isCheckoutSummaryReady
      ? "Payment methods appear after the latest backend checkout preview is ready."
      : "No active payment method is available for this cart.";

  useEffect(() => {
    if (paymentOptions.length === 0) return;
    const hasSelected = paymentOptions.some((option) => option.id === paymentOptionId);
    if (hasSelected) return;
    setPaymentOptionId(paymentOptions[0].id);
  }, [paymentOptions, paymentOptionId]);

  const hasDuitkuChannelSelection =
    paymentOptionId !== "duitku" ||
    DUITKU_PAYMENT_METHOD_OPTIONS.some((option) => option.code === duitkuPaymentMethod);

  const checkoutPreviewDebugSnapshot = useMemo(
    () => ({
      previewLoading: checkoutPreviewQuery.isLoading || checkoutPreviewQuery.isFetching,
      previewError: checkoutPreviewQuery.isError,
      previewReady: checkoutPreviewStatus.isReady,
      previewMismatch: checkoutPreviewStatus.isMismatch,
      mismatchReason: checkoutPreviewStatus.comparison?.reason || checkoutPreviewStatus.reason,
      disabledReason: isPreviewBlockingSubmission
        ? checkoutPreviewStatus.comparison?.reason || checkoutPreviewStatus.reason
        : couponBlocksSubmission
          ? "COUPON_SCOPE_BLOCKED"
          : null,
      canApplyCoupon: !previewBlocksPricingActions,
      canPlaceOrder: !isPreviewBlockingSubmission && !couponBlocksSubmission,
      visibleFingerprint: checkoutPreviewStatus.visibleFingerprint,
      previewFingerprint: checkoutPreviewStatus.previewFingerprint,
      visibleItemsNormalized: checkoutPreviewStatus.comparison?.visible || [],
      previewItemsNormalized: checkoutPreviewStatus.comparison?.preview || [],
      rawPreviewKeys:
        checkoutPreviewData && typeof checkoutPreviewData === "object"
          ? Object.keys(checkoutPreviewData)
          : [],
      rawPreviewSummary: rawCheckoutPreviewSummary,
      rawPreviewGroupsLength: rawCheckoutPreviewGroups.length,
      rawPreviewItemsLength: rawCheckoutPreviewItemsLength,
      lastPreviewRequestPayload: checkoutPreviewRequestPayload,
      lastPreviewResponseStatus:
        checkoutPreviewQuery.data?.__httpStatus ??
        checkoutPreviewQuery.error?.response?.status ??
        null,
    }),
    [
      checkoutPreviewData,
      checkoutPreviewQuery.data,
      checkoutPreviewQuery.error,
      checkoutPreviewQuery.isError,
      checkoutPreviewQuery.isFetching,
      checkoutPreviewQuery.isLoading,
      checkoutPreviewRequestPayload,
      checkoutPreviewStatus,
      couponBlocksSubmission,
      isPreviewBlockingSubmission,
      previewBlocksPricingActions,
      rawCheckoutPreviewGroups.length,
      rawCheckoutPreviewItemsLength,
      rawCheckoutPreviewSummary,
    ]
  );

  useEffect(() => {
    if (
      !hasCheckoutPreviewCartMismatch ||
      checkoutPreviewQuery.isFetching ||
      isCartLoading ||
      isRemoteSyncing
    ) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      void checkoutPreviewQuery.refetch();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [
    checkoutPreviewQuery,
    hasCheckoutPreviewCartMismatch,
    isCartLoading,
    isRemoteSyncing,
  ]);

  useEffect(() => {
    if (!IS_CHECKOUT_PREVIEW_DEBUG_ENABLED || !hasCheckoutPreviewCartMismatch) return;
    console.debug("[checkout-preview-sync]", checkoutPreviewDebugSnapshot);
  }, [
    checkoutPreviewDebugSnapshot,
    hasCheckoutPreviewCartMismatch,
  ]);
  const scrollToFirstCheckoutInvalidItem = useCallback(() => {
    if (typeof document === "undefined") return;
    const invalidTarget =
      document.querySelector('[data-checkout-invalid-item="true"]') ||
      document.querySelector('[data-checkout-invalid-summary="true"]');
    if (invalidTarget && typeof invalidTarget.scrollIntoView === "function") {
      invalidTarget.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);
  const handleFocusCheckoutIssues = useCallback(() => {
    scrollToFirstCheckoutInvalidItem();
  }, [scrollToFirstCheckoutInvalidItem]);
  const applyAddressToCheckoutForm = (address) => {
    const normalized = toUserAddressPayload(address || {});
    const fullNameParts = splitFullName(normalized.fullName);
    const nextEmail = resolveAddressEmailAddress(address, user?.email);
    setFirstName(fullNameParts.firstName);
    setLastName(fullNameParts.lastName);
    setEmail(nextEmail);
    setPhone(normalized.phoneNumber);
    setFieldErrors((prev) => ({
      ...prev,
      firstName: "",
      lastName: "",
      phone: "",
      province: "",
      city: "",
      district: "",
      postalCode: "",
      streetName: "",
      houseNumber: "",
    }));
    setShippingForm((prev) => ({
      ...prev,
      province: normalized.province,
      city: normalized.city,
      district: normalized.district,
      postalCode: normalized.postalCode,
      streetName: normalized.streetName,
      building: normalized.building || "",
      houseNumber: normalized.houseNumber,
      otherDetails: normalized.otherDetails || "",
      markAs: normalized.markAs,
    }));
  };

  const loadDefaultAddress = async () => {
    setAddressStatus("");
    setIsAddressLoading(true);
    try {
      const defaultAddress = await getDefaultAddress();
      if (!defaultAddress) {
        setUseDefaultShipping(false);
        setAddressStatus("Default shipping address not found.");
        return null;
      }
      applyAddressToCheckoutForm(defaultAddress);
      setAddressStatus(
        "Default shipping address applied. Disable the toggle to edit manually."
      );
      return defaultAddress;
    } catch (requestError) {
      setUseDefaultShipping(false);
      setAddressStatus(
        requestError?.response?.data?.message ||
          "Failed to load default shipping address."
      );
      return null;
    } finally {
      setIsAddressLoading(false);
    }
  };

  const focusField = (ref) => {
    if (!ref?.current) return;
    ref.current.focus();
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const clearAppliedCoupon = (message = "", status = "idle") => {
    setDiscount(0);
    setAppliedCouponMeta(null);
    setCouponBaseline(null);
    setCouponStatus(status);
    setCouponMessage(message);
  };

  const clearGroupCoupon = (storeId, message = "", status = "idle", nextCode = null) => {
    const storeKey = String(storeId);
    setGroupCouponStates((prev) => ({
      ...prev,
      [storeKey]: {
        status,
        message,
        appliedMeta: null,
        baseline: null,
      },
    }));
    if (nextCode !== null) {
      setGroupCouponCodes((prev) => ({
        ...prev,
        [storeKey]: nextCode,
      }));
    }
  };

  const handleApplyCoupon = async () => {
    if (couponStatus === "loading") return;

    const code = couponCode.trim().toUpperCase();
    if (!code) {
      if (appliedCouponMeta?.code) {
        setCouponCode("");
        clearAppliedCoupon("Coupon removed.", "idle");
        return;
      }
      clearAppliedCoupon("Please enter coupon code.", "error");
      return;
    }

    if (previewBlocksPricingActions) {
      clearAppliedCoupon(
        "Checkout preview is still syncing. Wait for the latest totals before applying a coupon.",
        "error"
      );
      return;
    }

    if (checkoutMode === "MULTI_STORE") {
      clearAppliedCoupon(
        "Use the coupon field inside each store group during multi-store checkout.",
        "error"
      );
      return;
    }

    if (!singleStoreCheckoutGroup?.storeId && !singleStoreCheckoutGroup?.storeSlug) {
      clearAppliedCoupon("Store scope is still loading. Try again in a moment.", "error");
      return;
    }

    setCouponStatus("loading");
    setCouponMessage("");
    try {
      const quoted = await quoteStoreCoupon({
        code,
        subtotal: subtotalValue,
        shipping: shippingCost,
        storeId: singleStoreCheckoutGroup?.storeId,
        storeSlug: singleStoreCheckoutGroup?.storeSlug || undefined,
      });

      if (!quoted?.valid) {
        clearAppliedCoupon(
          resolveCouponReasonMessage(quoted?.reason, quoted?.minSpend),
          "error"
        );
        return;
      }

      const normalizedCode = String(quoted.code || code).trim().toUpperCase();
      const normalizedDiscount = Number(quoted.discount || 0);
      const normalizedTotal = Number(quoted.total || 0);
      setCouponCode(normalizedCode);
      setDiscount(Number.isFinite(normalizedDiscount) ? normalizedDiscount : 0);
      setAppliedCouponMeta({
        code: normalizedCode,
        discount: Number.isFinite(normalizedDiscount) ? normalizedDiscount : 0,
        discountType: quoted.discountType || "percent",
        discountValue: Number(quoted.discountValue || 0),
        minSpend: Number(quoted.minSpend || 0),
        scopeType: quoted.scopeType || null,
        storeId: Number.isFinite(Number(quoted.storeId)) ? Number(quoted.storeId) : null,
        total: Number.isFinite(normalizedTotal) ? normalizedTotal : 0,
      });
      setCouponBaseline({
        subtotal: subtotalValue,
        shipping: shippingCost,
      });
      setCouponStatus("applied");
      setCouponMessage(`Coupon ${normalizedCode} applied.`);
    } catch (err) {
      const serverMessage =
        typeof err?.response?.data?.message === "string"
          ? err.response.data.message
          : "";
      clearAppliedCoupon(serverMessage || GENERIC_ERROR, "error");
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    clearAppliedCoupon("Coupon removed.", "idle");
  };

  const handleApplyGroupCoupon = async (group) => {
    const storeId = Number(group?.storeId);
    const storeKey = String(storeId);
    const code = String(groupCouponCodes?.[storeKey] || "")
      .trim()
      .toUpperCase();
    const currentState = groupCouponStates?.[storeKey] || null;

    if (!storeId || currentState?.status === "loading") return;

    if (!code) {
      if (currentState?.appliedMeta?.code) {
        clearGroupCoupon(storeId, "Coupon removed.", "idle", "");
        return;
      }
      clearGroupCoupon(storeId, "Please enter coupon code.", "error");
      return;
    }

    if (previewBlocksPricingActions) {
      clearGroupCoupon(
        storeId,
        "Checkout preview is still syncing. Wait for the latest store totals before applying a coupon.",
        "error"
      );
      return;
    }

    setGroupCouponStates((prev) => ({
      ...prev,
      [storeKey]: {
        ...(prev?.[storeKey] || {}),
        status: "loading",
        message: "",
      },
    }));

    try {
      const quoted = await quoteStoreCoupon({
        code,
        subtotal: Number(group?.subtotalAmount || 0),
        shipping: Number(group?.shippingAmount || 0),
        storeId,
        storeSlug: group?.storeSlug || undefined,
      });

      if (!quoted?.valid) {
        clearGroupCoupon(
          storeId,
          resolveCouponReasonMessage(quoted?.reason, quoted?.minSpend),
          "error"
        );
        return;
      }

      if (String(quoted.scopeType || "").toUpperCase() !== "STORE") {
        clearGroupCoupon(
          storeId,
          "Only store-scoped coupons can be claimed inside a store group.",
          "error"
        );
        return;
      }

      const normalizedCode = String(quoted.code || code).trim().toUpperCase();
      const normalizedDiscount = Number(quoted.discount || 0);
      setGroupCouponCodes((prev) => ({
        ...prev,
        [storeKey]: normalizedCode,
      }));
      setGroupCouponStates((prev) => ({
        ...prev,
        [storeKey]: {
          status: "applied",
          message: `Coupon ${normalizedCode} applied to ${group.storeName}.`,
          appliedMeta: {
            code: normalizedCode,
            discount: Number.isFinite(normalizedDiscount) ? normalizedDiscount : 0,
            discountType: quoted.discountType || "percent",
            discountValue: Number(quoted.discountValue || 0),
            minSpend: Number(quoted.minSpend || 0),
            scopeType: quoted.scopeType || null,
            storeId: Number.isFinite(Number(quoted.storeId)) ? Number(quoted.storeId) : storeId,
            total: Number(quoted.total || 0),
          },
          baseline: {
            subtotal: Number(group?.subtotalAmount || 0),
            shipping: Number(group?.shippingAmount || 0),
          },
        },
      }));
    } catch (err) {
      const serverMessage =
        typeof err?.response?.data?.message === "string"
          ? err.response.data.message
          : "";
      clearGroupCoupon(storeId, serverMessage || GENERIC_ERROR, "error");
    }
  };

  const handleRemoveGroupCoupon = (storeId) => {
    clearGroupCoupon(storeId, "Coupon removed.", "idle", "");
  };

  useEffect(() => {
    if (!appliedCouponMeta || !couponBaseline) return;
    const hasSubtotalChanged = Number(couponBaseline.subtotal) !== Number(subtotalValue);
    const hasShippingChanged = Number(couponBaseline.shipping) !== Number(shippingCost);
    if (!hasSubtotalChanged && !hasShippingChanged) return;

    clearAppliedCoupon("Cart updated. Please re-apply coupon.", "idle");
  }, [appliedCouponMeta, couponBaseline, subtotalValue, shippingCost]);

  useEffect(() => {
    if (!appliedCouponMeta?.code) return;
    if (checkoutMode !== "MULTI_STORE") return;
    clearAppliedCoupon(
      "Cart now spans multiple stores. Use the coupon field inside each store group.",
      "idle"
    );
  }, [appliedCouponMeta, checkoutMode]);

  useEffect(() => {
    if (checkoutMode === "MULTI_STORE") return;
    if (Object.keys(groupCouponStates).length === 0 && Object.keys(groupCouponCodes).length === 0) {
      return;
    }
    setGroupCouponStates({});
    setGroupCouponCodes({});
  }, [checkoutMode, groupCouponCodes, groupCouponStates]);

  useEffect(() => {
    if (Object.keys(groupCouponStates).length === 0) return;

    const groupsByStore = new Map(
      checkoutPreviewGroups.map((group) => [String(group.storeId), group])
    );

    setGroupCouponStates((prev) => {
      let changed = false;
      const next = { ...prev };

      Object.entries(prev).forEach(([storeKey, state]) => {
        if (!state?.appliedMeta) return;
        const group = groupsByStore.get(storeKey);
        if (!group) {
          next[storeKey] = {
            status: "idle",
            message: "Store group changed. Please re-apply coupon.",
            appliedMeta: null,
            baseline: null,
          };
          changed = true;
          return;
        }

        const baselineSubtotal = Number(state?.baseline?.subtotal || 0);
        const baselineShipping = Number(state?.baseline?.shipping || 0);
        const currentSubtotal = Number(group?.subtotalAmount || 0);
        const currentShipping = Number(group?.shippingAmount || 0);
        if (baselineSubtotal === currentSubtotal && baselineShipping === currentShipping) {
          return;
        }

        next[storeKey] = {
          status: "idle",
          message: "Store cart updated. Please re-apply coupon.",
          appliedMeta: null,
          baseline: null,
        };
        changed = true;
      });

      return changed ? next : prev;
    });
  }, [checkoutPreviewGroups, groupCouponStates]);

  const handleQtyDecrement = (item) => {
    const currentQty = Math.max(1, Number(item.qty ?? 1));
    if (currentQty <= 1) return;
    updateCartItem(item, currentQty - 1);
  };

  const handleQtyIncrement = (item) => {
    const currentQty = Math.max(1, Number(item.qty ?? 1));
    const stockValue = Number(item.stock);
    const stock = Number.isFinite(stockValue) && stockValue >= 0 ? stockValue : null;
    const nextQty = stock !== null ? Math.min(stock, currentQty + 1) : currentQty + 1;
    if (nextQty <= currentQty) return;
    updateCartItem(item, nextQty);
  };

  const handleReselectVariant = useCallback(
    (item, invalidItem) => {
      const productId = Number(item?.productId ?? invalidItem?.productId);
      if (!Number.isFinite(productId) || productId <= 0) return;
      navigate(`/product/${encodeURIComponent(String(productId))}`, {
        state: buildVariantRecoveryState(item, invalidItem, "/checkout"),
      });
    },
    [navigate]
  );

  const handleToggleDefaultShipping = async () => {
    if (!resolveHasAuthHint()) {
      navigate(
        "/auth/login",
        {
          replace: true,
          state: buildLoginRedirectState({
            from: "/checkout",
            authNotice: CHECKOUT_LOGIN_REQUIRED_NOTICE,
            postLoginState,
          }),
        }
      );
      return;
    }
    if (isAddressLoading) return;
    if (useDefaultShipping) {
      setUseDefaultShipping(false);
      setAddressStatus("");
      return;
    }
    setUseDefaultShipping(true);
    await loadDefaultAddress();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitLockRef.current || isSubmitting) {
      return;
    }

    const hasAuthHint = resolveHasAuthHint();
    if (!hasAuthHint) {
      navigate(
        "/auth/login",
        {
          replace: true,
          state: buildLoginRedirectState({
            from: "/checkout",
            authNotice: CHECKOUT_LOGIN_REQUIRED_NOTICE,
            postLoginState,
          }),
        }
      );
      return;
    }

    if (checkoutPreviewInvalidItems.length > 0) {
      setError("Fix the highlighted items before continuing.");
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          scrollToFirstCheckoutInvalidItem();
        });
      }
      return;
    }

    if (previewBlocksPricingActions) {
      setError(
        "Checkout preview is still syncing with the latest cart data. Wait for the latest snapshot before placing the order."
      );
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          scrollToFirstCheckoutInvalidItem();
        });
      }
      return;
    }

    setError("");
    setFieldErrors({
      firstName: "",
      lastName: "",
      phone: "",
      province: "",
      city: "",
      district: "",
      postalCode: "",
      streetName: "",
      houseNumber: "",
    });

    const requiredShippingFields = {
      province: shippingForm.province.trim(),
      city: shippingForm.city.trim(),
      district: shippingForm.district.trim(),
      postalCode: shippingForm.postalCode.trim(),
      streetName: shippingForm.streetName.trim(),
      houseNumber: shippingForm.houseNumber.trim(),
    };

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !phoneValue ||
      !requiredShippingFields.province ||
      !requiredShippingFields.city ||
      !requiredShippingFields.district ||
      !requiredShippingFields.postalCode ||
      !requiredShippingFields.streetName ||
      !requiredShippingFields.houseNumber
    ) {
      setError("Please complete required checkout fields.");
      const nextErrors = {
        firstName: firstName.trim() ? "" : "First name is required.",
        lastName: lastName.trim() ? "" : "Last name is required.",
        phone: phoneValue ? "" : "Phone is required.",
        province: requiredShippingFields.province ? "" : "Province is required.",
        city: requiredShippingFields.city ? "" : "City/Regency is required.",
        district: requiredShippingFields.district ? "" : "Subdistrict is required.",
        postalCode: requiredShippingFields.postalCode ? "" : "Postal code is required.",
        streetName: requiredShippingFields.streetName ? "" : "Street name is required.",
        houseNumber: requiredShippingFields.houseNumber ? "" : "House number is required.",
      };
      setFieldErrors(nextErrors);
      if (nextErrors.firstName) {
        focusField(firstNameRef);
      } else if (nextErrors.phone) {
        focusField(phoneRef);
      } else if (nextErrors.province) {
        focusField(provinceRef);
      } else if (nextErrors.streetName) {
        focusField(streetNameRef);
      }
      return;
    }

    if (!/^\d{5}$/.test(requiredShippingFields.postalCode)) {
      setError("Postal code must be 5 digits.");
      setFieldErrors((prev) => ({
        ...prev,
        postalCode: "Postal code must be 5 digits.",
      }));
      focusField(streetNameRef);
      return;
    }

    const parsedCustomer = checkoutCustomerSchema.safeParse(payloadDraft.customer);
    if (!parsedCustomer.success) {
      const nextErrors = {
        firstName: "",
        lastName: "",
        phone: "",
        province: "",
        city: "",
        district: "",
        postalCode: "",
        streetName: "",
        houseNumber: "",
      };
      for (const issue of parsedCustomer.error.issues) {
        const path = issue.path.join(".");
        if (path === "name") {
          nextErrors.firstName = issue.message;
        }
        if (path === "phone") {
          nextErrors.phone = issue.message;
        }
        if (path === "address") {
          nextErrors.streetName = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setError("Please check highlighted fields.");
      if (nextErrors.firstName) {
        focusField(firstNameRef);
      } else if (nextErrors.phone) {
        focusField(phoneRef);
      } else if (nextErrors.province) {
        focusField(provinceRef);
      } else if (nextErrors.streetName) {
        focusField(streetNameRef);
      }
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (couponBlocksSubmission) {
      setError(
        "Order-level coupon only supports single-store checkout. Use store-group coupons for multi-store carts."
      );
      return;
    }

    if (!hasDuitkuChannelSelection) {
      setError("Please choose a Duitku payment channel.");
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
      const submitPayload = {
        customer: parsedCustomer.data,
        couponCode: appliedCouponMeta?.code || undefined,
        groupCoupons:
          checkoutMode === "MULTI_STORE"
            ? appliedGroupCoupons.map((entry) => ({
                storeId: Number(entry.storeId),
                couponCode: String(entry.couponCode),
              }))
            : undefined,
        useDefaultShipping,
        shippingDetails: useDefaultShipping ? undefined : shippingDetailsPayload,
        paymentMethod: paymentOptionId === "duitku" ? "DUITKU" : "QRIS",
        duitkuPaymentMethod: paymentOptionId === "duitku" ? duitkuPaymentMethod : undefined,
      };
      const checkoutRequestSignature = JSON.stringify({
        items: summaryItems
          .map((item) => ({
            lineId: String(item.lineId),
            cartItemId: Number(item.cartItemId || 0),
            productId: Number(item.productId),
            variantKey: item.variantKey || null,
            qty: Number(item.qty),
          }))
          .sort((left, right) => String(left.lineId).localeCompare(String(right.lineId))),
        couponCode: submitPayload.couponCode || null,
        groupCoupons: Array.isArray(submitPayload.groupCoupons)
          ? [...submitPayload.groupCoupons].sort(
              (left, right) => Number(left.storeId) - Number(right.storeId)
            )
          : [],
        useDefaultShipping: submitPayload.useDefaultShipping === true,
        shippingDetails: submitPayload.shippingDetails || null,
        customer: submitPayload.customer || null,
        paymentMethod: submitPayload.paymentMethod || null,
        duitkuPaymentMethod: submitPayload.duitkuPaymentMethod || null,
      });
      const checkoutRequestKey = getCheckoutRequestKeyForSignature(checkoutRequestSignature);
      void preloadAccountPaymentRoute();
      const response = await createMultiStoreCheckoutOrder({
        ...submitPayload,
        checkoutRequestKey,
      });
      const result = resolveOrderPayload(response);
      const resolvedOrderRef = resolvePublicOrderReference(
        result?.invoiceNo,
        result?.ref,
        result?.invoice,
        result?.orderRef
      );
      const resolvedOrderId =
        result?.orderId != null
          ? String(result.orderId)
          : result?.id != null
            ? String(result.id)
            : "";
      if (!resolvedOrderId) {
        throw new Error("Checkout completed without an order id.");
      }
      const paymentParams = new URLSearchParams();
      paymentParams.set("checkoutCreated", "true");
      if (resolvedOrderRef) {
        paymentParams.set("ref", resolvedOrderRef);
      }
      const fallbackPaymentUrl = `/user/my-orders/${resolvedOrderId}/payment?${paymentParams.toString()}`;
      const nextPaymentUrl = result?.paymentUrl ? result.paymentUrl : fallbackPaymentUrl;
      setPaymentRedirectUrl(nextPaymentUrl);
      clearCheckoutRequestKeyForSignature(checkoutRequestSignature);
      clearCart();
      queryClient.setQueryData(["account", "order", "payment", resolvedOrderId], response);
      void queryClient
        .invalidateQueries({
          queryKey: ["account", "orders", "my"],
        })
        .catch(() => {});
      window.location.href = nextPaymentUrl;
    } catch (err) {
      const data = err?.response?.data;
      const serverMessage =
        typeof data?.message === "string" && data.message.trim()
          ? data.message.trim()
          : "";
      if (err?.response?.status === 401) {
        navigate(
          "/auth/login",
          {
            replace: true,
            state: buildLoginRedirectState({
              from: "/checkout",
              authNotice: CHECKOUT_LOGIN_REQUIRED_NOTICE,
              postLoginState,
            }),
          }
        );
        return;
      }
      if (err?.response?.status === 409 && data?.code === "CHECKOUT_IDEMPOTENCY_IN_PROGRESS") {
        setError(
          serverMessage ||
            "Your checkout is still being processed. Please wait a moment and try again. If the order completed, check My Orders."
        );
      } else if (err?.response?.status === 409 && Array.isArray(data?.data?.invalidItems)) {
        setError(resolveCheckoutSubmitErrorMessage(data, serverMessage));
      } else if (
        err?.response?.status === 409 &&
        (Array.isArray(data?.data?.groups) ||
          data?.data?.coupon ||
          Number.isFinite(Number(data?.data?.available)) ||
          Number.isFinite(Number(data?.data?.requested)))
      ) {
        setError(resolveCheckoutSubmitErrorMessage(data, serverMessage));
      } else if (err?.response?.status === 400 && Array.isArray(data?.missing)) {
        clearCart();
        setError("Cart items are no longer available. Please add them again.");
        setTimeout(() => navigate("/search"), 800);
      } else {
        setError(serverMessage || ORDER_FAILED);
      }
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const checkout2026ViewModel = createCheckout2026ViewModel({
    preview: {
      ...checkoutPreviewData,
      groups: checkoutPreviewDisplayGroups,
      summary: {
        ...(checkoutPreviewData?.summary || {}),
        ...(checkoutPreviewSummary || {}),
      },
      invalidItems: checkoutPreviewInvalidMessages,
      previewReady: isCheckoutSummaryReady,
      previewLoading: checkoutPreviewQuery.isLoading || checkoutPreviewQuery.isFetching,
      previewError: checkoutPreviewQuery.isError
        ? "The latest checkout preview is unavailable. Please wait and try again."
        : null,
      paymentReady:
        isCheckoutSummaryReady &&
        checkoutPreviewGroups.length > 0 &&
        checkoutPreviewGroups.every((group) => group?.paymentAvailable === true) &&
        paymentOptions.length > 0,
    },
    cartItems: summaryItems,
    couponCode,
  });

  return (
    <Checkout2026View
      viewModel={checkout2026ViewModel}
      form={{
        firstName,
        lastName,
        email,
        phone,
        shipping: shippingForm,
        errors: fieldErrors,
        useSavedAddress: useDefaultShipping,
        lockAddress: lockAddressFields,
        paymentOptionId,
        setPaymentOptionId,
        paymentOptions,
        duitkuPaymentMethod,
        setDuitkuPaymentMethod,
        duitkuPaymentMethods: DUITKU_PAYMENT_METHOD_OPTIONS,
      }}
      options={{
        provinces: provinceOptions,
        cities: cityOptions,
        districts: districtOptions,
      }}
      refs={{
        firstName: firstNameRef,
        phone: phoneRef,
        province: provinceRef,
        streetName: streetNameRef,
      }}
      status={{
        loading: showCheckoutSkeleton,
        redirectUrl: paymentRedirectUrl,
        hasItems,
        submitting: isSubmitting,
        cartSyncing: isRemoteSyncing,
        addressLoading: isAddressLoading,
        addressMessage: addressStatus,
        authHint: !user,
        error,
        previewBlocked: previewBlocksPricingActions,
        submitDisabled:
          isRemoteSyncing ||
          couponStatus === "loading" ||
          hasGroupCouponLoading ||
          isPreviewBlockingSubmission ||
          couponBlocksSubmission ||
          !hasDuitkuChannelSelection,
        submitMessage: !hasDuitkuChannelSelection
          ? "Choose a Duitku payment channel."
          : isPreviewBlockingSubmission
          ? previewHasPaymentBlocker
            ? "Payment is unavailable for one or more stores."
            : checkoutPreviewInvalidItems.length > 0
              ? "Resolve invalid items before placing this order."
              : "Waiting for the latest backend checkout preview."
          : couponBlocksSubmission
            ? "Apply coupons inside their matching store group."
            : "",
      }}
      coupons={{
        code: couponCode,
        status: couponStatus,
        message: couponMessage,
        groups: Object.fromEntries(
          checkoutPreviewDisplayGroups.map((group) => {
            const key = String(group.storeId);
            return [key, {
              code: groupCouponCodes[key] || "",
              status: groupCouponStates[key]?.status || "idle",
              message: groupCouponStates[key]?.message || "",
            }];
          })
        ),
        onChange: setCouponCode,
        onApply: handleApplyCoupon,
        onRemove: handleRemoveCoupon,
        onGroupChange: (storeId, value) =>
          setGroupCouponCodes((current) => ({ ...current, [String(storeId)]: value })),
        onGroupApply: handleApplyGroupCoupon,
        onGroupRemove: handleRemoveGroupCoupon,
      }}
      formatMoney={formatCurrency}
      onFieldChange={(field, value) => {
        if (field === "firstName") setFirstName(value);
        if (field === "lastName") setLastName(value);
        if (field === "email") setEmail(value);
        if (field === "phone") setPhone(value);
      }}
      onShippingChange={(field, value) => {
        setShippingForm((current) => ({
          ...current,
          [field]: value,
          ...(field === "province" ? { city: "", district: "" } : {}),
          ...(field === "city" ? { district: "" } : {}),
        }));
      }}
      onToggleSavedAddress={handleToggleDefaultShipping}
      onDecrease={(item) => handleQtyDecrement(item.raw || item)}
      onIncrease={(item) => handleQtyIncrement(item.raw || item)}
      onRemove={(item) => removeCartItem(item.raw || item)}
      onReselectVariant={(item, invalidItem) =>
        handleReselectVariant(item.raw || item, invalidItem)
      }
      onSubmit={handleSubmit}
      onBackToCart={() => navigate("/cart")}
    />
  );

}
