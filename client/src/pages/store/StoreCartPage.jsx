import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getStoreCustomization } from "../../api/public/storeCustomizationPublic.ts";
import { previewCheckoutByStore } from "../../api/public/storeCheckout.ts";
import { useCart } from "../../hooks/useCart.ts";
import { useStorefrontWishlist } from "../../utils/storefrontWishlist.js";
import { formatCurrency } from "../../utils/format.js";
import {
  findInvalidVariantCheckoutItem,
  resolveVariantCheckoutMessage,
} from "../../utils/variantCheckoutErrors.js";
import { GENERIC_ERROR } from "../../constants/uiMessages.js";
import StoreCart2026View from "./cart2026/StoreCart2026View.jsx";
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

  // Sync selected items with available items
  useEffect(() => {
    if (!items || items.length === 0) {
      setSelectedLineIds(new Set());
      return;
    }
    setSelectedLineIds((prev) => {
      const next = new Set();
      let hasOverlap = false;
      items.forEach((it) => {
        if (prev.has(it.lineId)) {
          next.add(it.lineId);
          hasOverlap = true;
        }
      });
      // If nothing selected or first load, select all
      if (!hasOverlap) {
        items.forEach((it) => next.add(it.lineId));
      }
      return next;
    });
  }, [items]);

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
    return items.filter((it) => selectedLineIds.has(it.lineId));
  }, [items, selectedLineIds]);

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
    navigate("/checkout");
  }, [canProceedToCheckout, hasCheckoutPreflightInvalidItems, isIndo, navigate, selectedItems.length]);

  const handleReviewIssues = useCallback(() => {
    scrollToFirstCartInvalidItem('[data-cart-page-invalid-item="true"]');
  }, []);

  const viewModel = useMemo(() => {
    return createStoreCart2026ViewModel({
      cartItems: items,
      cart: {
        ...cart,
        subtotal: selectedSubtotal,
        discount: 0,
      },
    });
  }, [cart, items, selectedSubtotal]);

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
  );
}
