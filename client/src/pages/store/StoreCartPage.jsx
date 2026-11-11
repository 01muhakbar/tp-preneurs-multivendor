import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getStoreCustomization } from "../../api/public/storeCustomizationPublic.ts";
import { previewCheckoutByStore } from "../../api/public/storeCheckout.ts";
import { fetchStoreProductById } from "../../api/public/storeProducts.ts";
import { useCart } from "../../hooks/useCart.ts";
import { useStorefrontWishlist } from "../../utils/storefrontWishlist.js";
import { formatCurrency } from "../../utils/format.js";
import {
  findInvalidVariantCheckoutItem,
  resolveVariantCheckoutMessage,
} from "../../utils/variantCheckoutErrors.js";
import { GENERIC_ERROR } from "../../constants/uiMessages.js";
import StoreCart2026View from "./cart2026/StoreCart2026View.jsx";
import StoreCartVoucherModal from "./cart2026/StoreCartVoucherModal.jsx";
import StoreCartPlatformVoucherModal from "./cart2026/StoreCartPlatformVoucherModal.jsx";
import { createStoreCart2026ViewModel } from "./cart2026/storeCart2026Adapter.js";

const RECOVERY_RESELECT_CODES = new Set([
  "PRODUCT_VARIANT_REQUIRED",
  "PRODUCT_VARIANT_MISSING",
  "VARIANT_NOT_AVAILABLE",
]);

const resolveHasCheckoutAuthHint = () => {
  try {
    return (
      Boolean(localStorage.getItem("authToken")) ||
      localStorage.getItem("authSessionHint") === "true"
    );
  } catch {
    return false;
  }
};

const buildCartCheckoutSignature = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => {
      const productId = Number(item?.productId ?? item?.id);
      const lineId =
        String(item?.lineId || "").trim() ||
        `${productId}:${String(item?.variantKey || "").trim().toLowerCase() || "base"}`;
      const qty = Math.max(0, Number(item?.quantity ?? item?.qty ?? 0));
      return `${lineId}:${qty}`;
    })
    .filter((value) => !value.startsWith(":"))
    .sort()
    .join("|");

const canReselectInvalidCartItem = (invalidItem) =>
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
      productName: String(item?.name || invalidItem?.productName || "").trim() || null,
      variantKey: invalidItem?.variantKey ?? item?.variantKey ?? null,
      variantSelections: Array.isArray(rawSelections) ? rawSelections : [],
      source: "cart",
      fromPath: sourcePath,
    },
  };
};

function useCartCheckoutPreflight(items, enabled) {
  const checkoutSignature = buildCartCheckoutSignature(items);
  const preflightQuery = useQuery({
    queryKey: ["cart-checkout-preflight", checkoutSignature],
    queryFn: () => previewCheckoutByStore(),
    enabled: enabled && Boolean(checkoutSignature),
    staleTime: 10_000,
    retry: false,
  });

  const invalidItems = Array.isArray(preflightQuery.data?.data?.invalidItems)
    ? preflightQuery.data.data.invalidItems.map((item) => ({
        ...item,
        message: resolveVariantCheckoutMessage(
          item,
          "This cart line needs attention before checkout."
        ),
      }))
    : [];

  return {
    invalidItems,
    hasInvalidItems: invalidItems.length > 0,
    isLoading: preflightQuery.isLoading,
    isError: preflightQuery.isError,
  };
}

const scrollToFirstCartInvalidItem = (selector) => {
  if (typeof document === "undefined") return;
  const target = document.querySelector(selector);
  if (target && typeof target.scrollIntoView === "function") {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

export { StoreCartDrawer } from "../../components/store/StoreCartDrawer2026.jsx";

export default function StoreCartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const [, setLangSyncCounter] = useState(0);

  const isIndo =
    i18n.language === "id" ||
    i18n.language === "id-ID" ||
    i18n.language?.startsWith("id") ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("store_language") === "Indonesia" ||
        localStorage.getItem("store_language") === "Bahasa Indonesia"));
  const lang = isIndo ? "id" : "en";

  useEffect(() => {
    const handleSync = () => setLangSyncCounter((c) => c + 1);
    i18n.on("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      i18n.off("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [i18n]);

  const customizationQuery = useQuery({
    queryKey: ["store-customization", "cart-page", lang],
    queryFn: () => getStoreCustomization({ lang, include: "shoppingCart" }),
    staleTime: 60_000,
  });

  const cartCustomization = customizationQuery.data?.customization?.shoppingCart || null;

  const {
    cart,
    items,
    subtotal,
    hasHydrated,
    isLoading,
    error,
    update,
    remove,
    refreshCart,
  } = useCart();
  const wishlist = useStorefrontWishlist();

  const [selectedLineIds, setSelectedLineIds] = useState(() => new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [appliedStoreCoupons, setAppliedStoreCoupons] = useState({});
  const [voucherModalStore, setVoucherModalStore] = useState(null);
  const [hydratedStores, setHydratedStores] = useState({});

  // Platform Voucher State
  const [appliedPlatformCoupon, setAppliedPlatformCoupon] = useState(null);
  const [isPlatformVoucherModalOpen, setIsPlatformVoucherModalOpen] = useState(false);
  const autoAppliedCouponRef = useRef(false);

  // Auto-apply voucher passed from PDP "Beli dengan Voucher"
  useEffect(() => {
    if (autoAppliedCouponRef.current) return;
    let couponToApply = location.state?.autoApplyCoupon;
    if (!couponToApply) {
      try {
        const raw = sessionStorage.getItem("tp_auto_coupon");
        if (raw) {
          couponToApply = JSON.parse(raw);
        }
      } catch (_) {}
    }

    if (couponToApply && couponToApply.code) {
      autoAppliedCouponRef.current = true;
      try {
        sessionStorage.removeItem("tp_auto_coupon");
      } catch (_) {}

      const isPlatform =
        couponToApply.scopeType === "PLATFORM" ||
        !couponToApply.storeId ||
        couponToApply.storeId === null;

      if (isPlatform) {
        setAppliedPlatformCoupon(couponToApply);
        toast.success(
          isIndo
            ? `Voucher Diskon Platform ${couponToApply.code} berhasil diterapkan!`
            : `Platform Voucher ${couponToApply.code} applied!`
        );
      } else {
        const updates = {};
        if (couponToApply.storeSlug) {
          updates[`slug:${couponToApply.storeSlug}`] = couponToApply;
        }
        if (couponToApply.storeId) {
          updates[`id:${couponToApply.storeId}`] = couponToApply;
        }
        if (Object.keys(updates).length > 0) {
          setAppliedStoreCoupons((prev) => ({
            ...prev,
            ...updates,
          }));
          toast.success(
            isIndo
              ? `Voucher toko ${couponToApply.code} berhasil diterapkan!`
              : `Store voucher ${couponToApply.code} applied!`
          );
        }
      }
    }
  }, [location.state, isIndo]);

  // Auto-hydrate missing store info for cart items
  useEffect(() => {
    const unhydratedIds = items
      .filter(
        (it) =>
          Number(it.productId) > 0 &&
          (!it.storeSlug || !it.storeName || it.storeName === "Marketplace Store") &&
          !hydratedStores[it.productId]
      )
      .map((it) => Number(it.productId));

    const uniqueIds = Array.from(new Set(unhydratedIds));
    if (uniqueIds.length === 0) return;

    let isCancelled = false;
    Promise.all(
      uniqueIds.map((id) =>
        fetchStoreProductById(id)
          .then((res) => {
            const prod = res?.data ?? res;
            if (!prod) return null;
            const rawStore = prod.store ?? prod.sellerInfo ?? null;
            const storeId = prod.storeId ?? rawStore?.id ?? rawStore?.storeId ?? null;
            const storeName = prod.store?.name ?? rawStore?.name ?? prod.storeName ?? null;
            const storeSlug = prod.storeSlug ?? prod.store?.slug ?? rawStore?.slug ?? null;
            const slug = prod.slug ?? prod.routeSlug ?? null;
            const productHref = prod.productHref ?? null;
            return {
              productId: id,
              storeId,
              storeName,
              storeSlug,
              slug,
              productHref,
            };
          })
          .catch(() => null)
      )
    ).then((results) => {
      if (isCancelled) return;
      const updates = {};
      results.forEach((entry) => {
        if (entry && (entry.storeName || entry.storeSlug || entry.slug)) {
          updates[entry.productId] = entry;
        }
      });
      if (Object.keys(updates).length > 0) {
        setHydratedStores((prev) => ({ ...prev, ...updates }));
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [items, hydratedStores]);

  // Enriched items with hydrated store info
  const enrichedItems = useMemo(() => {
    return items.map((it) => {
      const extra = hydratedStores[it.productId];
      if (!extra) return it;
      return {
        ...it,
        storeId: it.storeId || extra.storeId,
        storeName:
          it.storeName && it.storeName !== "Marketplace Store"
            ? it.storeName
            : extra.storeName || it.storeName,
        storeSlug: it.storeSlug || extra.storeSlug,
        slug: it.slug || extra.slug,
        productHref: it.productHref || extra.productHref,
      };
    });
  }, [items, hydratedStores]);

  // Sync selected items with available items without overriding user unchecking
  const knownCartLineIdsRef = useRef(null);

  useEffect(() => {
    const currentLineIds = items.map((it) => it.lineId).filter(Boolean);
    if (currentLineIds.length === 0) {
      knownCartLineIdsRef.current = [];
      setSelectedLineIds(new Set());
      return;
    }

    // First time initializing: select all items by default
    if (knownCartLineIdsRef.current === null) {
      knownCartLineIdsRef.current = currentLineIds;
      setSelectedLineIds(new Set(currentLineIds));
      return;
    }

    const previousLineIds = knownCartLineIdsRef.current;
    knownCartLineIdsRef.current = currentLineIds;

    // Detect brand new items added to cart (which should be checked by default)
    const newlyAdded = currentLineIds.filter((id) => !previousLineIds.includes(id));

    setSelectedLineIds((prev) => {
      const next = new Set();
      // Keep user's existing selections that are still in the cart
      prev.forEach((id) => {
        if (currentLineIds.includes(id)) {
          next.add(id);
        }
      });
      // Add newly added items
      newlyAdded.forEach((id) => next.add(id));
      return next;
    });
  }, [items.map((it) => it.lineId).join(",")]);

  const hasItems = items.length > 0;
  const isInitialSyncing = hasHydrated && isLoading && !hasItems;
  const showSkeleton = !hasHydrated || isInitialSyncing;
  const isFatalError = Boolean(error) && !showSkeleton && !hasItems;
  const showInlineError = Boolean(error) && hasItems;
  const lastRefreshAtRef = useRef(0);
  const errorMessage =
    resolveVariantCheckoutMessage(error, "") ||
    error?.response?.data?.message ||
    error?.message ||
    GENERIC_ERROR;
  const hasCheckoutAuthHint = resolveHasCheckoutAuthHint();
  const {
    invalidItems: checkoutPreflightInvalidItems,
    hasInvalidItems: hasCheckoutPreflightInvalidItems,
    isLoading: isCheckoutPreflightLoading,
  } = useCartCheckoutPreflight(
    items,
    hasHydrated && hasItems && !isLoading && hasCheckoutAuthHint
  );

  useEffect(() => {
    const now = Date.now();
    const isStale = now - lastRefreshAtRef.current > 30_000;
    if (!hasHydrated || isStale || error) {
      lastRefreshAtRef.current = now;
      void refreshCart(false);
    }
  }, [error, hasHydrated, refreshCart]);

  const resolveCartTarget = (item) => {
    const cartItemId = Number(item?.cartItemId);
    const productId = Number(item?.productId ?? item?.id ?? item?.product?.id);
    return {
      lineId: item?.lineId,
      cartItemId: Number.isFinite(cartItemId) && cartItemId > 0 ? cartItemId : null,
      productId: Number.isFinite(productId) && productId > 0 ? productId : null,
      variantKey: item?.variantKey ?? null,
    };
  };

  const handleReselectVariant = useCallback(
    (item, invalidItem) => {
      const productId = Number(item?.productId ?? invalidItem?.productId);
      if (!Number.isFinite(productId) || productId <= 0) return;
      navigate(`/product/${encodeURIComponent(String(productId))}`, {
        state: buildVariantRecoveryState(item, invalidItem, "/cart"),
      });
    },
    [navigate]
  );

  // Selected items calculations
  const selectedItems = useMemo(() => {
    return enrichedItems.filter((it) => selectedLineIds.has(it.lineId));
  }, [enrichedItems, selectedLineIds]);

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce(
      (acc, it) => acc + Number(it.price || 0) * Number(it.quantity || it.qty || 1),
      0
    );
  }, [selectedItems]);

  const selectedCount = useMemo(() => {
    return selectedItems.reduce(
      (acc, it) => acc + Number(it.quantity || it.qty || 1),
      0
    );
  }, [selectedItems]);

  // Compute subtotal per store for voucher qualification
  const getStoreSelectedSubtotal = useCallback(
    (storeKey) => {
      if (!storeKey) return 0;
      const isSlugKey = storeKey.startsWith("slug:");
      const isIdKey = storeKey.startsWith("id:");
      const rawSlug = isSlugKey ? storeKey.slice(5) : null;
      const rawId = isIdKey ? Number(storeKey.slice(3)) : null;

      return selectedItems
        .filter((it) => {
          if (isSlugKey && it.storeSlug) return it.storeSlug === rawSlug;
          if (isIdKey && it.storeId != null) return Number(it.storeId) === rawId;
          const key = it.storeSlug
            ? `slug:${it.storeSlug}`
            : it.storeId != null
              ? `id:${it.storeId}`
              : it.storeName && it.storeName !== "Marketplace Store"
                ? `name:${String(it.storeName).toLowerCase()}`
                : `item:${it.productId || it.lineId}`;
          return key === storeKey;
        })
        .reduce(
          (acc, it) => acc + Number(it.price || 0) * Number(it.quantity || it.qty || 1),
          0
        );
    },
    [selectedItems]
  );

  // Calculate total discount from applied store coupons for selected items
  const totalStoreDiscount = useMemo(() => {
    const processedCoupons = new Set();
    return Object.entries(appliedStoreCoupons).reduce((sum, [storeKey, coupon]) => {
      if (!coupon || !coupon.code) return sum;

      // Unique coupon identifier per store to prevent double-counting across key aliases
      const uniqueCouponKey = `${coupon.code}:${coupon.storeId || coupon.storeSlug || storeKey}`;
      if (processedCoupons.has(uniqueCouponKey)) return sum;
      processedCoupons.add(uniqueCouponKey);

      const subtotal = getStoreSelectedSubtotal(storeKey);
      if (subtotal <= 0) return sum;
      const minSpend = Number(coupon.minSpend) || 0;
      if (subtotal < minSpend) return sum;

      const discountType = String(coupon.discountType || "").toLowerCase();
      const val = Number(coupon.discountValue ?? coupon.amount ?? 0);
      let saving = 0;
      if (discountType === "percent" || discountType === "percentage") {
        saving = Math.round((subtotal * val) / 100);
        const maxDiscount = Number(coupon.maxDiscount);
        if (Number.isFinite(maxDiscount) && maxDiscount > 0) {
          saving = Math.min(saving, maxDiscount);
        }
      } else {
        saving = Number(coupon.discountAmount ?? coupon.discountValue ?? coupon.amount ?? 0);
      }
      saving = Math.min(subtotal, Math.max(0, saving));
      return sum + saving;
    }, 0);
  }, [appliedStoreCoupons, getStoreSelectedSubtotal]);

  // Calculate total discount from applied platform coupon across all selected items
  const totalPlatformDiscount = useMemo(() => {
    if (!appliedPlatformCoupon) return 0;
    if (selectedSubtotal <= 0) return 0;
    const minSpend = Number(appliedPlatformCoupon.minSpend) || 0;
    if (selectedSubtotal < minSpend) return 0;

    const discountType = String(appliedPlatformCoupon.discountType || "").toLowerCase();
    const val = Number(
      appliedPlatformCoupon.discountValue ?? appliedPlatformCoupon.amount ?? 0
    );

    if (discountType === "percent" || discountType === "percentage") {
      let d = Math.round((selectedSubtotal * val) / 100);
      const maxDiscount = Number(appliedPlatformCoupon.maxDiscount);
      if (Number.isFinite(maxDiscount) && maxDiscount > 0) {
        d = Math.min(d, maxDiscount);
      }
      return Math.min(selectedSubtotal, d);
    }

    const amt = Number(
      appliedPlatformCoupon.discountAmount ??
        appliedPlatformCoupon.discountValue ??
        appliedPlatformCoupon.amount ??
        0
    );
    return Math.min(selectedSubtotal, amt);
  }, [appliedPlatformCoupon, selectedSubtotal]);

  const combinedTotalDiscount = totalStoreDiscount + totalPlatformDiscount;
  const selectedFinalTotal = Math.max(0, selectedSubtotal - combinedTotalDiscount);

  const canProceedToCheckout =
    selectedItems.length > 0 &&
    !hasCheckoutPreflightInvalidItems &&
    !isCheckoutPreflightLoading;

  const handleProceedToCheckout = useCallback(() => {
    if (selectedItems.length === 0) {
      toast(isIndo ? "Pilih produk yang ingin di-checkout terlebih dahulu." : "Please select products to checkout first.");
      return;
    }
    if (!canProceedToCheckout) {
      if (hasCheckoutPreflightInvalidItems) {
        scrollToFirstCartInvalidItem('[data-cart-page-invalid-item="true"]');
      }
      return;
    }

    // Pass applied store & platform coupons to checkout
    const groupCouponCodes = {};
    Object.values(appliedStoreCoupons).forEach((c) => {
      if (c?.storeId && c?.code) {
        groupCouponCodes[String(c.storeId)] = c.code;
      }
    });

    navigate("/checkout", {
      state: {
        appliedStoreCoupons,
        groupCouponCodes,
        appliedPlatformCoupon,
        platformCouponCode: appliedPlatformCoupon?.code || null,
        totalPlatformDiscount,
      },
    });
  }, [
    appliedPlatformCoupon,
    appliedStoreCoupons,
    canProceedToCheckout,
    hasCheckoutPreflightInvalidItems,
    isIndo,
    navigate,
    selectedItems.length,
    totalPlatformDiscount,
  ]);

  const handleReviewIssues = useCallback(() => {
    scrollToFirstCartInvalidItem('[data-cart-page-invalid-item="true"]');
  }, []);

  const viewModel = useMemo(() => {
    return createStoreCart2026ViewModel({
      cartItems: enrichedItems,
      cart: {
        ...cart,
        subtotal: selectedSubtotal,
        discount: combinedTotalDiscount,
        estimatedTotal: selectedFinalTotal,
      },
    });
  }, [cart, combinedTotalDiscount, enrichedItems, selectedFinalTotal, selectedSubtotal]);

  // Selection handlers
  const handleToggleSelect = useCallback((lineId) => {
    setSelectedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  }, []);

  const handleToggleStore = useCallback((storeLineIds) => {
    setSelectedLineIds((prev) => {
      const next = new Set(prev);
      const allSelected = storeLineIds.every((id) => next.has(id));
      if (allSelected) {
        storeLineIds.forEach((id) => next.delete(id));
      } else {
        storeLineIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedLineIds((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(items.map((it) => it.lineId));
    });
  }, [items]);

  const handleBatchRemove = useCallback(async () => {
    const toRemove = items.filter((it) => selectedLineIds.has(it.lineId));
    if (toRemove.length === 0) return;
    for (const item of toRemove) {
      const target = resolveCartTarget(item);
      if (target.productId) await remove(target);
    }
    toast.success(
      isIndo
        ? `${toRemove.length} produk dihapus dari keranjang.`
        : `${toRemove.length} item(s) removed from cart.`
    );
  }, [isIndo, items, remove, selectedLineIds]);

  const handleBatchWishlist = useCallback(async () => {
    const toWishlist = items.filter((it) => selectedLineIds.has(it.lineId));
    if (toWishlist.length === 0) return;
    for (const item of toWishlist) {
      wishlist.add(item);
      const target = resolveCartTarget(item);
      if (target.productId) await remove(target);
    }
    toast.success(
      isIndo
        ? `${toWishlist.length} produk dipindahkan ke Wishlist.`
        : `${toWishlist.length} item(s) moved to Wishlist.`
    );
  }, [isIndo, items, remove, selectedLineIds, wishlist]);

  const handleDecrease = (item, quantity = item.quantity - 1) => {
    const target = resolveCartTarget(item.raw || item);
    if (!target.productId) return;
    if (quantity < 1) {
      remove(target);
      return;
    }
    return update(target, quantity);
  };

  const handleIncrease = (item, quantity = item.quantity + 1) => {
    const target = resolveCartTarget(item.raw || item);
    if (!target.productId) return;
    const hasStockValue = item.stock !== null && item.stock !== undefined && item.stock !== "";
    const stockValue = Number(item.stock);
    const stock = hasStockValue && Number.isFinite(stockValue) && stockValue >= 0
      ? stockValue
      : null;
    const nextQuantity = stock === null
      ? quantity
      : Math.min(stock, quantity);
    if (nextQuantity > item.quantity) return update(target, nextQuantity);
  };

  const handleRemove = (item) => {
    const target = resolveCartTarget(item.raw || item);
    if (target.productId) remove(target);
  };

  return (
    <>
      <StoreCart2026View
      viewModel={viewModel}
      customization={cartCustomization}
      isIndo={isIndo}
      lang={lang}
      status={{
        loading: showSkeleton,
        fatalError: isFatalError,
        inlineError: showInlineError,
        errorMessage,
        busy: isLoading,
        hasInvalidItems: hasCheckoutPreflightInvalidItems,
        preflightLoading: isCheckoutPreflightLoading,
        canCheckout: canProceedToCheckout,
      }}
      formatMoney={formatCurrency}
      selectedLineIds={selectedLineIds}
      selectedCount={selectedCount}
      selectedSubtotal={selectedSubtotal}
      totalStoreDiscount={totalStoreDiscount}
      appliedPlatformCoupon={appliedPlatformCoupon}
      totalPlatformDiscount={totalPlatformDiscount}
      selectedFinalTotal={selectedFinalTotal}
      appliedStoreCoupons={appliedStoreCoupons}
      onOpenStoreVoucher={(store) => setVoucherModalStore(store)}
      onRemoveStoreVoucher={(storeKeyOrGroup) => {
        setAppliedStoreCoupons((prev) => {
          const next = { ...prev };
          const storeKey = typeof storeKeyOrGroup === "string" ? storeKeyOrGroup : storeKeyOrGroup?.key;
          if (storeKey) delete next[storeKey];
          if (storeKeyOrGroup?.storeSlug) delete next[`slug:${storeKeyOrGroup.storeSlug}`];
          if (storeKeyOrGroup?.storeId) delete next[`id:${storeKeyOrGroup.storeId}`];
          return next;
        });
        toast(isIndo ? "Voucher toko dilepas." : "Store voucher removed.");
      }}
      onOpenPlatformVoucher={() => setIsPlatformVoucherModalOpen(true)}
      onRemovePlatformVoucher={() => {
        setAppliedPlatformCoupon(null);
        toast.success(isIndo ? "Voucher platform dilepas." : "Platform voucher removed.");
      }}
      isEditMode={isEditMode}
      onToggleEditMode={() => setIsEditMode((prev) => !prev)}
      onToggleSelect={handleToggleSelect}
      onToggleStore={handleToggleStore}
      onToggleAll={handleToggleAll}
      onBatchRemove={handleBatchRemove}
      onBatchWishlist={handleBatchWishlist}
      getInvalidItem={(item) =>
        findInvalidVariantCheckoutItem(checkoutPreflightInvalidItems, item.raw || item)
      }
      canReselect={(item, invalidItem) =>
        Boolean(item.productId) && canReselectInvalidCartItem(invalidItem)
      }
      onIncrease={handleIncrease}
      onDecrease={handleDecrease}
      onRemove={handleRemove}
      onReselect={(item, invalidItem) =>
        handleReselectVariant(item.raw || item, invalidItem)
      }
      onRetry={() => refreshCart(false)}
      onReviewIssues={handleReviewIssues}
      onCheckout={handleProceedToCheckout}
      onContinueShopping={() => navigate("/shop")}
    />
    {voucherModalStore && (
      <StoreCartVoucherModal
        isOpen={Boolean(voucherModalStore)}
        onClose={() => setVoucherModalStore(null)}
        store={voucherModalStore}
        storeSubtotal={getStoreSelectedSubtotal(voucherModalStore.key)}
        appliedCoupon={
          appliedStoreCoupons[voucherModalStore.key] ||
          (voucherModalStore.storeSlug && appliedStoreCoupons[`slug:${voucherModalStore.storeSlug}`]) ||
          (voucherModalStore.storeId && appliedStoreCoupons[`id:${voucherModalStore.storeId}`]) ||
          null
        }
        onApplyCoupon={(couponData) => {
          const updates = {};
          if (voucherModalStore.key) updates[voucherModalStore.key] = couponData;
          if (voucherModalStore.storeSlug) updates[`slug:${voucherModalStore.storeSlug}`] = couponData;
          if (voucherModalStore.storeId) updates[`id:${voucherModalStore.storeId}`] = couponData;
          setAppliedStoreCoupons((prev) => ({
            ...prev,
            ...updates,
          }));
        }}
        onRemoveCoupon={() => {
          setAppliedStoreCoupons((prev) => {
            const next = { ...prev };
            if (voucherModalStore.key) delete next[voucherModalStore.key];
            if (voucherModalStore.storeSlug) delete next[`slug:${voucherModalStore.storeSlug}`];
            if (voucherModalStore.storeId) delete next[`id:${voucherModalStore.storeId}`];
            return next;
          });
        }}
        isIndo={isIndo}
        formatMoney={formatCurrency}
      />
    )}
    <StoreCartPlatformVoucherModal
      isOpen={isPlatformVoucherModalOpen}
      onClose={() => setIsPlatformVoucherModalOpen(false)}
      cartSubtotal={selectedSubtotal}
      appliedCoupon={appliedPlatformCoupon}
      onApplyCoupon={(couponData) => setAppliedPlatformCoupon(couponData)}
      onRemoveCoupon={() => setAppliedPlatformCoupon(null)}
      isIndo={isIndo}
      formatMoney={formatCurrency}
    />
    </>
  );
}
