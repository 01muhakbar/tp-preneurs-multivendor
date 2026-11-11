import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import { useCart } from "../../hooks/useCart.ts";
import {
  createStoreCart2026ViewModel,
  FALLBACK_PRODUCT_IMAGE,
} from "../../pages/store/cart2026/storeCart2026Adapter.js";
import StoreCartVoucherModal from "../../pages/store/cart2026/StoreCartVoucherModal.jsx";
import { useStorefrontWishlist } from "../../utils/storefrontWishlist.js";
import { fetchStoreProductById } from "../../api/public/storeProducts.ts";
import "./store-cart-drawer-2026.css";
import "../../pages/store/cart2026/store-cart-2026.css";

const rupiah = (value) => {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const resolveCartTarget = (item) => {
  const cartItemId = Number(item?.cartItemId);
  const productId = Number(item?.productId ?? item?.id ?? item?.product?.id);
  return {
    lineId: item?.lineId,
    cartItemId: Number.isFinite(cartItemId) && cartItemId > 0 ? cartItemId : null,
    productId: Number.isFinite(productId) && productId > 0 ? productId : null,
    variantKey: item?.variantKey ?? null,
    variantSelections: item?.variantSelections ?? null,
  };
};

function formatVariant(item) {
  const selectionText = (item?.variantSelections || [])
    .map((selection) => `${selection.attributeName || "Varian"}: ${selection.value}`)
    .filter(Boolean);
  return [item?.variantLabel, ...selectionText].filter(Boolean);
}

function EmptyDrawerCart({ onContinue, isIndo }) {
  return (
    <div className="sc26-shopee-empty py-12 px-4">
      <div className="sc26-shopee-empty__icon">
        <ShoppingBag className="w-12 h-12 text-slate-500" />
      </div>
      <h3 className="sc26-shopee-empty__title text-base mt-4">
        {isIndo ? "Keranjang Anda Kosong" : "Your Cart is Empty"}
      </h3>
      <p className="sc26-shopee-empty__desc text-xs mt-1 text-slate-400">
        {isIndo
          ? "Belum ada produk yang ditambahkan ke keranjang belanja."
          : "No items added to your shopping cart yet."}
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="sc26-shopee-btn-primary mt-6 !py-2 !px-5 text-xs"
      >
        <span>{isIndo ? "Mulai Belanja" : "Start Shopping"}</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function StoreCartDrawer2026({
  open,
  isOpen,
  onClose,
  onRequestClose,
  onCheckout,
}) {
  const visible = typeof isOpen === "boolean" ? isOpen : typeof open === "boolean" ? open : true;
  const closeDrawer = onClose || onRequestClose || (() => {});
  const navigate = useNavigate();
  const cart = useCart();
  const wishlist = useStorefrontWishlist();
  const { i18n } = useTranslation();
  const isIndo = i18n.language === "id" || i18n.language === "id-ID";

  const rawItems = Array.isArray(cart?.items)
    ? cart.items
    : Array.isArray(cart?.cart?.items)
      ? cart.cart.items
      : [];

  const [hydratedStores, setHydratedStores] = useState({});
  const [selectedLineIds, setSelectedLineIds] = useState(() => new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [voucherModalStore, setVoucherModalStore] = useState(null);
  const [appliedStoreCoupons, setAppliedStoreCoupons] = useState({});

  // Auto-hydrate store info for items that don't have store info stored locally
  useEffect(() => {
    if (!rawItems || rawItems.length === 0) return;
    const missing = rawItems.filter(
      (it) => (!it.storeSlug || it.storeName === "Marketplace Store" || !it.slug) && it.productId
    );
    if (missing.length === 0) return;

    let isCancelled = false;
    Promise.all(
      missing.map(async (it) => {
        try {
          const res = await fetchStoreProductById(it.productId);
          const prod = res?.data || res;
          const store = prod?.store || {};
          return {
            productId: it.productId,
            storeId: store.id || null,
            storeName: store.name || null,
            storeSlug: store.slug || null,
            slug: prod?.slug || prod?.routeSlug || null,
            productHref: prod?.productHref || null,
          };
        } catch {
          return null;
        }
      })
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
  }, [rawItems]);

  // Enrich items with hydrated store and product slug data
  const enrichedItems = useMemo(() => {
    return rawItems.map((it) => {
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
  }, [rawItems, hydratedStores]);

  // Create Shopee-style view model
  const viewModel = useMemo(() => {
    return createStoreCart2026ViewModel({
      cartItems: enrichedItems,
      cart,
    });
  }, [cart, enrichedItems]);

  // Initialize/sync selected line items without overriding user unchecking
  const knownLineIdsRef = useRef(null);

  useEffect(() => {
    const currentLineIds = enrichedItems.map((it) => it.lineId).filter(Boolean);
    if (currentLineIds.length === 0) {
      knownLineIdsRef.current = [];
      setSelectedLineIds(new Set());
      return;
    }

    // First time initializing: select all items by default
    if (knownLineIdsRef.current === null) {
      knownLineIdsRef.current = currentLineIds;
      setSelectedLineIds(new Set(currentLineIds));
      return;
    }

    const previousLineIds = knownLineIdsRef.current;
    knownLineIdsRef.current = currentLineIds;

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
  }, [enrichedItems.map((it) => it.lineId).join(",")]);

  const allSelected =
    viewModel.items.length > 0 && selectedLineIds.size === viewModel.items.length;

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
      const storeAllSelected = storeLineIds.every((id) => next.has(id));
      if (storeAllSelected) {
        storeLineIds.forEach((id) => next.delete(id));
      } else {
        storeLineIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedLineIds((prev) => {
      if (prev.size === viewModel.items.length) {
        return new Set();
      }
      return new Set(viewModel.items.map((it) => it.lineId));
    });
  }, [viewModel.items]);

  // Reliable navigation handlers that close drawer and transition smoothly
  const handleNavigateStore = useCallback(
    (group) => {
      const storeSlug = group.storeSlug || group.storeId;
      const target = storeSlug ? `/store/${encodeURIComponent(storeSlug)}` : "/shop";
      closeDrawer();
      if (typeof window !== "undefined" && window.location.pathname === target) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate(target);
      }
    },
    [closeDrawer, navigate]
  );

  const handleNavigateProduct = useCallback(
    (item) => {
      const target =
        item.slug || item.productId
          ? `/product/${encodeURIComponent(item.slug || item.productId)}`
          : item.productHref && !item.productHref.includes("/products/")
            ? item.productHref
            : "/shop";
      closeDrawer();
      if (typeof window !== "undefined" && window.location.pathname === target) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate(target);
      }
    },
    [closeDrawer, navigate]
  );

  // Selected items & pricing calculations
  const selectedItems = useMemo(() => {
    return viewModel.items.filter((it) => selectedLineIds.has(it.lineId));
  }, [selectedLineIds, viewModel.items]);

  const selectedCount = selectedItems.length;

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
  }, [selectedItems]);

  const getStoreSelectedSubtotal = useCallback(
    (storeKey) => {
      const group = viewModel.groups.find((g) => g.key === storeKey);
      if (!group) return 0;
      return group.items
        .filter((it) => selectedLineIds.has(it.lineId))
        .reduce((acc, it) => acc + (it.lineTotal || 0), 0);
    },
    [selectedLineIds, viewModel.groups]
  );

  const totalStoreDiscount = useMemo(() => {
    let discount = 0;
    Object.entries(appliedStoreCoupons).forEach(([storeKey, coupon]) => {
      const storeSub = getStoreSelectedSubtotal(storeKey);
      if (storeSub > 0 && coupon?.discountAmount) {
        discount += Math.min(storeSub, Number(coupon.discountAmount) || 0);
      }
    });
    return discount;
  }, [appliedStoreCoupons, getStoreSelectedSubtotal]);

  const selectedFinalTotal = Math.max(0, selectedSubtotal - totalStoreDiscount);

  // Stepper & Item Actions
  const handleDecrease = async (item) => {
    const target = resolveCartTarget(item.raw || item);
    if (!target.productId) return;
    if (item.quantity <= 1) {
      await cart.remove(target);
      return;
    }
    await cart.update(target, item.quantity - 1);
  };

  const handleIncrease = async (item) => {
    const target = resolveCartTarget(item.raw || item);
    if (!target.productId) return;
    const stock =
      item.stock !== null && item.stock !== undefined ? Number(item.stock) : null;
    const nextQty =
      stock !== null ? Math.min(stock, item.quantity + 1) : item.quantity + 1;
    if (nextQty > item.quantity) {
      await cart.update(target, nextQty);
    }
  };

  const handleBatchRemove = async () => {
    const toRemove = viewModel.items.filter((it) => selectedLineIds.has(it.lineId));
    if (toRemove.length === 0) return;
    for (const item of toRemove) {
      const target = resolveCartTarget(item.raw || item);
      if (target.productId) await cart.remove(target);
    }
    toast.success(
      isIndo
        ? `${toRemove.length} produk dihapus dari keranjang.`
        : `${toRemove.length} item(s) removed from cart.`
    );
  };

  const handleBatchWishlist = async () => {
    const toWishlist = viewModel.items.filter((it) => selectedLineIds.has(it.lineId));
    if (toWishlist.length === 0) return;
    for (const item of toWishlist) {
      wishlist.add(item.raw || item);
      const target = resolveCartTarget(item.raw || item);
      if (target.productId) await cart.remove(target);
    }
    toast.success(
      isIndo
        ? `${toWishlist.length} produk dipindahkan ke Wishlist.`
        : `${toWishlist.length} item(s) moved to Wishlist.`
    );
  };

  const handleCheckout = () => {
    if (selectedCount === 0) {
      toast.error(
        isIndo
          ? "Pilih minimal 1 produk untuk checkout."
          : "Please select at least 1 product to checkout."
      );
      return;
    }
    if (typeof onCheckout === "function") {
      onCheckout();
      return;
    }
    const groupCouponCodes = {};
    Object.values(appliedStoreCoupons).forEach((c) => {
      if (c?.storeId && c?.code) {
        groupCouponCodes[String(c.storeId)] = c.code;
      }
    });

    closeDrawer();
    navigate("/checkout", {
      state: {
        appliedStoreCoupons,
        groupCouponCodes,
        selectedLineIds: Array.from(selectedLineIds),
      },
    });
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside
        className="fixed inset-y-0 right-0 z-[101] flex flex-col w-full sm:max-w-[460px] bg-[#07101f] text-[#f8fafc] shadow-2xl overflow-hidden store-cart-drawer-2026-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={isIndo ? "Keranjang Saya" : "My Cart"}
      >
        {/* Shopee Drawer Header */}
        <header className="sc26-shopee-header shrink-0 !rounded-none border-x-0 border-t-0 border-b border-[rgba(3,76,133,0.35)] bg-[#0d1b32] px-4 py-3.5">
          <div className="sc26-shopee-header__left">
            <button
              type="button"
              className="sc26-shopee-header__back"
              onClick={closeDrawer}
              aria-label={isIndo ? "Kembali" : "Back"}
            >
              <ArrowLeft className="w-5 h-5 text-white hover:text-[#fe6f05] transition" />
            </button>
            <h2 className="sc26-shopee-header__title !text-base">
              {isIndo ? "Keranjang Saya" : "My Cart"}
              <span className="sc26-shopee-header__count">({viewModel.itemCount})</span>
            </h2>
          </div>

          <button
            type="button"
            className="sc26-shopee-header__edit-btn"
            onClick={() => setIsEditMode((prev) => !prev)}
          >
            {isEditMode ? (isIndo ? "Selesai" : "Done") : (isIndo ? "Ubah" : "Edit")}
          </button>
        </header>

        {/* Scrollable Groups List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 store-cart-drawer-2026-scroll">
          {viewModel.isEmpty ? (
            <EmptyDrawerCart onContinue={closeDrawer} isIndo={isIndo} />
          ) : (
            <div className="sc26-shopee-groups">
              {viewModel.groups.map((group) => {
                const storeLineIds = group.items.map((it) => it.lineId);
                const isStoreSelected =
                  storeLineIds.length > 0 &&
                  storeLineIds.every((id) => selectedLineIds.has(id));

                return (
                  <section className="sc26-shopee-store-card" key={group.key}>
                    {/* Store Header */}
                    <div className="sc26-shopee-store-header">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isStoreSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStore(storeLineIds);
                        }}
                        className="sc26-shopee-checkbox-btn"
                        title={isStoreSelected ? (isIndo ? "Batalkan pilihan toko" : "Unselect store") : (isIndo ? "Pilih toko" : "Select store")}
                      >
                        <span className={`sc26-shopee-checkbox-custom ${isStoreSelected ? "is-checked" : ""}`}>
                          {isStoreSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                      </button>

                      <div className="sc26-shopee-store-meta">
                        <span className="sc26-shopee-pill-store">Star</span>
                        <Link
                          to={
                            group.storeSlug
                              ? `/store/${encodeURIComponent(group.storeSlug)}`
                              : group.storeId
                                ? `/store/${encodeURIComponent(group.storeId)}`
                                : "/shop"
                          }
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigateStore(group);
                          }}
                          className="sc26-shopee-store-name"
                          title={isIndo ? `Kunjungi Toko ${group.storeName}` : `Visit ${group.storeName}`}
                        >
                          <span>{group.storeName}</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Store Items List */}
                    <div className="sc26-shopee-items-list">
                      {group.items.map((item) => {
                        const isSelected = selectedLineIds.has(item.lineId);
                        const variantLines = formatVariant(item);
                        const itemHref =
                          item.slug || item.productId
                            ? `/product/${encodeURIComponent(item.slug || item.productId)}`
                            : item.productHref && !item.productHref.includes("/products/")
                              ? item.productHref
                              : "/shop";

                        return (
                          <div key={item.lineId} className="sc26-shopee-item-row">
                            {/* Checkbox */}
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={isSelected}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSelect(item.lineId);
                              }}
                              className="sc26-shopee-checkbox-btn"
                              title={isSelected ? (isIndo ? "Batalkan pilihan produk" : "Unselect item") : (isIndo ? "Pilih produk" : "Select item")}
                            >
                              <span className={`sc26-shopee-checkbox-custom ${isSelected ? "is-checked" : ""}`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </span>
                            </button>

                            {/* 1:1 Thumbnail with Stock Badge - Clickable to Product */}
                            <Link
                              to={itemHref}
                              onClick={(e) => {
                                e.preventDefault();
                                handleNavigateProduct(item);
                              }}
                              className="sc26-shopee-item-thumb-wrap block cursor-pointer group/thumb hover:ring-2 hover:ring-[#fe6f05] transition"
                              title={item.name}
                            >
                              <img
                                src={item.image}
                                onError={(e) => {
                                  e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                                }}
                                alt={item.name}
                                className="sc26-shopee-item-thumb transition duration-200 group-hover/thumb:scale-105"
                              />
                              {item.stock !== null &&
                                item.stock !== undefined &&
                                item.stock <= 10 &&
                                item.stock > 0 && (
                                  <span className="sc26-shopee-item-stock-tag">
                                    {isIndo ? `Tersisa ${item.stock}` : `Only ${item.stock} left`}
                                  </span>
                                )}
                            </Link>

                            {/* Product Info & Controls */}
                            <div className="sc26-shopee-item-details">
                              <Link
                                to={itemHref}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleNavigateProduct(item);
                                }}
                                className="sc26-shopee-item-title hover:text-[#fe6f05] transition"
                              >
                                {item.name}
                              </Link>

                              {/* Variant Pill with Chevron Down */}
                              {variantLines.length > 0 && (
                                <div className="sc26-shopee-item-variants">
                                  {variantLines.map((line, idx) => (
                                    <span key={idx} className="sc26-shopee-variant-pill">
                                      {line}
                                      <ChevronDown className="w-3 h-3 ml-1 opacity-70 inline" />
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Price & Stepper */}
                              <div className="sc26-shopee-item-bottom">
                                <span className="sc26-shopee-item-price">
                                  {rupiah(item.unitPrice)}
                                </span>

                                <div className="sc26-shopee-stepper">
                                  <button
                                    type="button"
                                    className="sc26-shopee-step-btn"
                                    onClick={() => handleDecrease(item)}
                                    disabled={cart.isLoading}
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="sc26-shopee-step-val">{item.quantity}</span>
                                  <button
                                    type="button"
                                    className="sc26-shopee-step-btn"
                                    onClick={() => handleIncrease(item)}
                                    disabled={
                                      (item.stock !== null &&
                                        item.stock !== undefined &&
                                        item.quantity >= item.stock) ||
                                      cart.isLoading
                                    }
                                    aria-label="Increase quantity"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Store Voucher Row */}
                    {appliedStoreCoupons?.[group.key] ? (
                      <div className="sc26-shopee-store-voucher is-applied">
                        <Ticket className="w-4 h-4 text-[#fe6f05] flex-shrink-0" />
                        <span className="sc26-shopee-voucher-code-badge">
                          {appliedStoreCoupons[group.key].code}
                        </span>
                        <span className="sc26-shopee-voucher-discount-text">
                          {isIndo
                            ? `Hemat ${rupiah(appliedStoreCoupons[group.key].discountAmount)}`
                            : `Saved ${rupiah(appliedStoreCoupons[group.key].discountAmount)}`}
                        </span>
                        <div className="sc26-shopee-voucher-actions ml-auto flex items-center gap-2">
                          <button
                            type="button"
                            className="sc26-shopee-voucher-change-btn"
                            onClick={() => setVoucherModalStore(group)}
                          >
                            {isIndo ? "Ubah" : "Change"}
                          </button>
                          <button
                            type="button"
                            className="sc26-shopee-voucher-remove-btn"
                            onClick={() => {
                              setAppliedStoreCoupons((prev) => {
                                const next = { ...prev };
                                delete next[group.key];
                                return next;
                              });
                            }}
                            title={isIndo ? "Hapus voucher" : "Remove voucher"}
                            aria-label="Remove voucher"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="sc26-shopee-store-voucher is-action"
                        onClick={() => setVoucherModalStore(group)}
                      >
                        <Ticket className="w-4 h-4 text-[#fe6f05]" />
                        <span>{isIndo ? "Tambahkan kode Voucher Toko" : "Add Store Voucher Code"}</span>
                        <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
                      </button>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Shopee Sticky Bottom Bar in Drawer */}
        {!viewModel.isEmpty && (
          <div className="sc26-shopee-drawer-bottom-bar shrink-0">
            <div className="sc26-shopee-sticky-action-row">
              <button
                type="button"
                role="checkbox"
                aria-checked={allSelected}
                onClick={handleToggleAll}
                className="sc26-shopee-select-all bg-transparent border-none p-0 cursor-pointer text-left"
                title={allSelected ? (isIndo ? "Batalkan pilihan semua" : "Unselect all") : (isIndo ? "Pilih semua" : "Select all")}
              >
                <span className={`sc26-shopee-checkbox-custom ${allSelected ? "is-checked" : ""}`}>
                  {allSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </span>
                <span className="sc26-shopee-select-all-text">
                  {isIndo ? "Semua" : "All"}
                </span>
              </button>

              {!isEditMode ? (
                <>
                  <div className="sc26-shopee-sticky-total-box">
                    <div className="sc26-shopee-total-row">
                      <span className="sc26-shopee-total-label">{isIndo ? "Total:" : "Total:"}</span>
                      <strong className="sc26-shopee-total-amount">
                        {rupiah(selectedFinalTotal)}
                      </strong>
                    </div>
                    {totalStoreDiscount > 0 && (
                      <span className="sc26-shopee-savings-hint">
                        {isIndo
                          ? `Hemat ${rupiah(totalStoreDiscount)}`
                          : `Saved ${rupiah(totalStoreDiscount)}`}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="sc26-shopee-btn-checkout"
                    onClick={handleCheckout}
                    disabled={selectedCount === 0 || cart.isLoading}
                  >
                    {isIndo ? `Checkout (${selectedCount})` : `Checkout (${selectedCount})`}
                  </button>
                </>
              ) : (
                <div className="sc26-shopee-edit-actions ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="sc26-shopee-btn-wishlist inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                    onClick={handleBatchWishlist}
                    disabled={selectedCount === 0 || cart.isLoading}
                  >
                    <Heart className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{isIndo ? "Favoritkan" : "Wishlist"}</span>
                  </button>
                  <button
                    type="button"
                    className="sc26-shopee-btn-delete inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                    onClick={handleBatchRemove}
                    disabled={selectedCount === 0 || cart.isLoading}
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{isIndo ? `Hapus (${selectedCount})` : `Delete (${selectedCount})`}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Interactive Voucher Modal */}
      {voucherModalStore && (
        <StoreCartVoucherModal
          isOpen={Boolean(voucherModalStore)}
          onClose={() => setVoucherModalStore(null)}
          store={voucherModalStore}
          storeSubtotal={getStoreSelectedSubtotal(voucherModalStore.key)}
          appliedCoupon={appliedStoreCoupons[voucherModalStore.key] || null}
          onApplyCoupon={(couponData) => {
            setAppliedStoreCoupons((prev) => ({
              ...prev,
              [voucherModalStore.key]: couponData,
            }));
          }}
          onRemoveCoupon={() => {
            setAppliedStoreCoupons((prev) => {
              const next = { ...prev };
              delete next[voucherModalStore.key];
              return next;
            });
          }}
          isIndo={isIndo}
          formatMoney={rupiah}
        />
      )}
    </>
  );
}

export { StoreCartDrawer2026 as StoreCartDrawer };
export default StoreCartDrawer2026;
