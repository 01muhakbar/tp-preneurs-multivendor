import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Trash2, Minus, Plus } from 'lucide-react';
import { useCart } from '../../hooks/useCart.ts';
import { useTranslation } from 'react-i18next';
import './store-cart-drawer-2026.css';

const rupiah = (value) => {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getQty = (item) => Math.max(1, Number(item?.quantity ?? item?.qty ?? 1));
const getPrice = (item) => Number(item?.price ?? 0);
const getLineTotal = (item) => getPrice(item) * getQty(item);
const getItemName = (item) => item?.name || "Unknown Product";
const getItemImage = (item) => item?.imageUrl || item?.image || null;
const getItemSlug = (item) => item?.slug || item?.productId || item?.id;
const getCartTarget = (item) => {
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

const normalizeItems = (cart) => {
  if (Array.isArray(cart?.items)) return cart.items;
  if (Array.isArray(cart?.cart?.items)) return cart.cart.items;
  return [];
};

function CartItemCard({ item, onUpdate, onRemove, isLoading, isIndo }) {
  const [busy, setBusy] = useState(false);
  const target = getCartTarget(item);
  const qty = getQty(item);

  const handleUpdate = async (newQty) => {
    if (newQty < 1) return;
    setBusy(true);
    try {
      await onUpdate(target, newQty, {
        lineId: target.lineId,
        cartItemId: target.cartItemId,
        productId: target.productId,
        variantKey: target.variantKey,
        variantSelections: target.variantSelections,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onRemove(target, {
        lineId: target.lineId,
        cartItemId: target.cartItemId,
        productId: target.productId,
        variantKey: target.variantKey,
        variantSelections: target.variantSelections,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`relative flex gap-3 rounded-xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-slate-900 ${busy ? 'opacity-50' : 'opacity-100'}`}>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isLoading || busy}
        className="absolute right-3 top-3 z-10 text-slate-400 hover:text-red-500 transition"
        aria-label="Remove item"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Link
        to={`/product/${getItemSlug(item)}`}
        className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-950 dark:border-white/5"
      >
        {getItemImage(item) ? (
          <img
            src={getItemImage(item)}
            alt={getItemName(item)}
            className="h-full w-full object-cover"
          />
        ) : (
          <ShoppingCart className="h-6 w-6 text-slate-300" />
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-center min-w-0 pr-6">
        <Link
          to={`/product/${getItemSlug(item)}`}
          className="line-clamp-2 text-[13px] font-bold text-slate-900 hover:text-[#034c85] dark:text-white dark:hover:text-[#fe6f05] transition"
        >
          {getItemName(item)}
        </Link>

        {item.variantLabel && (
          <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {item.variantLabel}
          </span>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[13.5px] font-black text-[#fe6f05]">
            {rupiah(getLineTotal(item))}
          </span>

          <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950">
            <button
              type="button"
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
              onClick={() => handleUpdate(qty - 1)}
              disabled={qty <= 1 || isLoading || busy}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-[24px] text-center text-xs font-bold text-slate-900 dark:text-white">
              {qty}
            </span>
            <button
              type="button"
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
              onClick={() => handleUpdate(qty + 1)}
              disabled={(item?.stock && qty >= item.stock) || isLoading || busy}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyCart({ onClose, isIndo }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-900">
        <ShoppingCart className="h-9 w-9" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
        {isIndo ? "Keranjang Anda kosong" : "Your cart is empty"}
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {isIndo ? "Belum ada produk yang ditambahkan." : "No items added yet."}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#034c85] px-6 text-xs font-bold text-white shadow-sm hover:bg-[#023b69] transition"
      >
        {isIndo ? "Lanjut Belanja" : "Continue Shopping"}
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
  placement,
}) {
  const visible = typeof isOpen === 'boolean' ? isOpen : typeof open === 'boolean' ? open : true;
  const closeDrawer = onClose || onRequestClose || (() => {});
  const navigate = useNavigate();
  const cart = useCart();
  const { i18n } = useTranslation();
  const isIndo = i18n.language === 'id' || i18n.language === 'id-ID';
  const items = normalizeItems(cart);
  const itemCount = cart.count ?? cart.totalQty ?? items.reduce((acc, it) => acc + getQty(it), 0);
  const subtotal = cart.subtotal ?? items.reduce((acc, it) => acc + getLineTotal(it), 0);
  const isBottom = placement === 'bottom';

  const handleCheckout = () => {
    if (typeof onCheckout === 'function') {
      onCheckout();
    } else {
      closeDrawer();
      navigate('/checkout');
    }
  };

  const handleViewCart = () => {
    closeDrawer();
    navigate('/cart');
  };

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-[2px] transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <div
        className={`fixed z-[100] flex flex-col bg-slate-50 dark:bg-slate-950 store-cart-drawer-2026-sheet ${
          isBottom
            ? 'inset-0 store-cart-drawer-2026-mobile-full'
            : 'inset-y-0 right-0 w-full max-w-[420px]'
        }`}
        style={{
          transform: visible
            ? 'translate3d(0,0,0)'
            : isBottom
              ? 'translate3d(0,100%,0)'
              : 'translate3d(100%,0,0)',
        }}
      >
        {/* Drawer Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3.5 dark:border-white/10 dark:bg-slate-900">
          <button
            type="button"
            onClick={closeDrawer}
            className="flex items-center gap-1.5 text-xs font-bold text-[#034c85] hover:text-[#023b69] dark:text-sky-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{isIndo ? "Kembali" : "Back"}</span>
          </button>

          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {isIndo ? "Keranjang Belanja" : "Shopping Cart"}
            <span className="ml-1 text-xs text-slate-500">({itemCount})</span>
          </h2>

          <button
            type="button"
            onClick={handleViewCart}
            className="text-xs font-bold text-[#fe6f05] hover:underline"
          >
            {isIndo ? "Buka Penuh" : "Full View"}
          </button>
        </div>

        {/* Drawer Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 store-cart-drawer-2026-scroll">
          {items.length === 0 ? (
            <EmptyCart onClose={closeDrawer} isIndo={isIndo} />
          ) : (
            items.map((item) => (
              <CartItemCard
                key={getCartTarget(item).lineId || getCartTarget(item).productId || item.id}
                item={item}
                onUpdate={cart.update}
                onRemove={cart.remove}
                isLoading={cart.isLoading}
                isIndo={isIndo}
              />
            ))
          )}
        </div>

        {/* Drawer Sticky Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-slate-900 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Total:</span>
              <strong className="text-base font-black text-[#fe6f05]">
                {rupiah(subtotal)}
              </strong>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleViewCart}
                className="flex-1 h-10 rounded-lg border border-[#034c85] text-xs font-bold text-[#034c85] hover:bg-[#034c85]/10 dark:border-sky-400 dark:text-sky-400 transition"
              >
                {isIndo ? "Lihat Keranjang" : "View Cart"}
              </button>

              <button
                type="button"
                onClick={handleCheckout}
                className="flex-1 h-10 rounded-lg bg-[#fe6f05] text-xs font-bold text-white shadow-sm hover:bg-[#ea5f00] transition"
              >
                {isIndo ? "Lanjut Checkout" : "Checkout"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export { StoreCartDrawer2026 as StoreCartDrawer };
export default StoreCartDrawer2026;
