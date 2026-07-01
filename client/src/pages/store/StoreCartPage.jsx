import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef } from "react";
import { previewCheckoutByStore } from "../../api/public/storeCheckout.ts";
import { useCart } from "../../hooks/useCart.ts";
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
  const subtotalValue = Number(subtotal || 0);
  const discountValue = 0;
  const canProceedToCheckout =
    hasItems && !hasCheckoutPreflightInvalidItems && !isCheckoutPreflightLoading;

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

  const handleProceedToCheckout = useCallback(() => {
    if (!canProceedToCheckout) {
      if (hasCheckoutPreflightInvalidItems) {
        scrollToFirstCartInvalidItem('[data-cart-page-invalid-item="true"]');
      }
      return;
    }
    navigate("/checkout");
  }, [canProceedToCheckout, hasCheckoutPreflightInvalidItems, navigate]);

  const handleReviewIssues = useCallback(() => {
    scrollToFirstCartInvalidItem('[data-cart-page-invalid-item="true"]');
  }, []);

  const viewModel = createStoreCart2026ViewModel({
    cartItems: items,
    cart: {
      ...cart,
      subtotal: subtotalValue,
      discount: discountValue,
    },
  });

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
