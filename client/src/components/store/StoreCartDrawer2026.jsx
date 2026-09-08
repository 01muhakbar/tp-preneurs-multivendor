import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Trash2, ShieldCheck, Zap, Bookmark, Shield, RefreshCcw, Headphones } from 'lucide-react';
import { useCart } from '../../hooks/useCart.ts';
import CartQuantityControl from './CartQuantityControl.jsx';
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
const getCategoryLabel = (item) => item?.category?.name || item?.category || "Product";
const getUnitLabel = (item) => item?.variantLabel || item?.weight || "unit";
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

const buildFallbackEmoji = (item) => {
  const name = getItemName(item).toLowerCase();
  const cat = getCategoryLabel(item).toLowerCase();
  const str = name + " " + cat;
  if (str.includes('banana')) return '🍌';
  if (str.includes('apple')) return '🍎';
  if (str.includes('orange')) return '🍊';
  if (str.includes('vegetable') || str.includes('spinach')) return '🥬';
  if (str.includes('bread') || str.includes('bakery')) return '🥖';
  if (str.includes('milk') || str.includes('dairy')) return '🥛';
  return '🛒';
};

const normalizeItems = (cart) => {
  if (Array.isArray(cart?.items)) return cart.items;
  if (Array.isArray(cart?.cart?.items)) return cart.cart.items;
  return [];
};

function CartTrustPill({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
      <Icon className="h-3 w-3 text-[var(--tp-primary)] dark:text-sky-400" />
      <span>{label}</span>
    </div>
  );
}

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
    } catch (e) {
        // ignore
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
    } catch (e) {
        // ignore
    } finally {
        setBusy(false);
    }
  };

  return (
    <div className={`relative flex gap-4 rounded-xl border border-slate-200 bg-white p-3 transition-opacity dark:border-white/10 dark:bg-slate-900 ${busy ? 'opacity-50' : 'opacity-100'}`}>
      <button 
        onClick={handleDelete}
        disabled={isLoading || busy}
        className="absolute right-4 top-4 z-10 flex items-center justify-center text-slate-400 transition hover:text-rose-500 dark:hover:text-rose-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Link to={`/product/${getItemSlug(item)}`} className="flex h-[86px] w-[86px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5">
        {getItemImage(item) ? (
          <img src={getItemImage(item)} alt={getItemName(item)} className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
        ) : (
          <span className="text-3xl">{buildFallbackEmoji(item)}</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-center">
        <div className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          PRODUCT
        </div>
        <Link to={`/product/${getItemSlug(item)}`} className="mt-1 line-clamp-1 pr-6 text-[14px] font-bold text-slate-950 hover:text-[var(--tp-primary)] dark:text-white dark:hover:text-sky-400">
          {getItemName(item)}
        </Link>
        <div className="mt-0.5 text-[12px] font-medium text-slate-500 dark:text-slate-400">
          {qty} &times; {getUnitLabel(item)}
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div className="text-[14px] font-black text-slate-950 dark:text-white">
            {rupiah(getLineTotal(item))}
          </div>
          
          <CartQuantityControl
            quantity={qty}
            stock={item?.stock}
            disabled={isLoading || busy}
            name={getItemName(item)}
            onCommit={handleUpdate}
            variant="drawer"
          />
        </div>
      </div>
    </div>
  );
}

function EmptyCart({ onClose, isIndo }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-600">
        <ShoppingCart className="h-10 w-10" />
      </div>
      <h3 className="mt-6 text-xl font-black text-slate-950 dark:text-white">{isIndo ? "Keranjang Anda kosong" : "Your cart is empty"}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{isIndo ? "Sepertinya Anda belum menambahkan apa pun." : "Looks like you haven't added anything yet."}</p>
      <button 
        onClick={onClose}
        className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--tp-primary)] px-8 text-sm font-bold text-white shadow-md transition hover:bg-[#023b69] dark:bg-sky-600 dark:hover:bg-sky-700"
      >
        {isIndo ? "Lanjut Belanja" : "Continue Shopping"}
      </button>
    </div>
  );
}

function OrderSummary({ itemsCount, subtotal, isIndo }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-slate-950 dark:text-white">Order Summary</h3>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{itemsCount} items</span>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-300">
          <span>Subtotal</span>
          <span className="font-bold text-slate-950 dark:text-white">{rupiah(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span>Discount</span>
            <button className="text-[13px] font-medium text-[var(--tp-accent)] hover:underline">Add code</button>
          </div>
          <span className="font-bold text-slate-950 dark:text-white">- Rp 0</span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-300">
          <span>Shipping</span>
          <span className="text-[12px] font-medium text-[var(--tp-accent)] hover:underline">Calculated at checkout</span>
        </div>
      </div>
    </div>
  );
}

export function StoreCartDrawer2026({
  open,
  isOpen,
  onClose,
  onRequestClose,
  onCheckout,
  placement
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
        className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-[2px] transition-opacity dark:bg-slate-950/75" 
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <div 
        className={`fixed z-[100] flex flex-col bg-slate-50 transition-transform dark:bg-slate-950 store-cart-drawer-2026-sheet ${
          isBottom 
            ? 'inset-0 store-cart-drawer-2026-mobile-full' 
            : 'inset-y-0 right-0 w-full max-w-[440px]'
        }`}
        style={{ transform: visible ? 'translate3d(0,0,0)' : (isBottom ? 'translate3d(0,100%,0)' : 'translate3d(100%,0,0)') }}
      >
        <div className={`flex shrink-0 items-center bg-white px-4 py-3 dark:bg-slate-900 ${isBottom ? 'pt-safe' : ''}`}>
          <button 
            onClick={closeDrawer}
            className="flex items-center gap-1.5 text-[15px] font-bold text-[#034c85] transition hover:text-[#023b69] dark:text-sky-400"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
          
          <div className="ml-5 flex flex-col justify-center">
            <h2 className="text-[17px] font-black leading-tight text-slate-950 dark:text-white">{isIndo ? "Keranjang Belanja" : "Shopping Cart"}</h2>
            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{itemCount} {isIndo ? "barang" : "items"}</p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex shrink-0 gap-2 overflow-x-auto bg-slate-50 px-4 py-2.5 store-cart-drawer-2026-scroll dark:bg-slate-950 border-b border-slate-200 dark:border-white/10">
            <CartTrustPill icon={Zap} label={isIndo ? "Checkout cepat" : "Fast checkout"} />
            <CartTrustPill icon={ShieldCheck} label={isIndo ? "Pembayaran aman" : "Secure payment"} />
            <CartTrustPill icon={Bookmark} label={isIndo ? "Keranjang tersimpan" : "Saved cart"} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 store-cart-drawer-2026-scroll relative">
          {items.length === 0 ? (
            <EmptyCart onClose={closeDrawer} isIndo={isIndo} />
          ) : (
            <div className="flex flex-col gap-4">
              {items.map(item => (
                <CartItemCard 
                  key={getCartTarget(item).lineId || getCartTarget(item).productId || item.id}
                  item={item} 
                  onUpdate={cart.update}
                  onRemove={cart.remove}
                  isLoading={cart.isLoading}
                  isIndo={isIndo}
                />
              ))}
              <div className="mt-1">
                <OrderSummary itemsCount={itemCount} subtotal={subtotal} isIndo={isIndo} />
              </div>
              
              <button 
                onClick={handleViewCart}
                className="mt-2 flex h-12 w-full items-center justify-center rounded-full border border-[var(--tp-accent)] text-sm font-bold text-[var(--tp-accent)] transition hover:bg-[var(--tp-accent)] hover:text-white dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-500 dark:hover:text-white"
              >
                {isIndo ? "Lihat Keranjang" : "View Cart"}
              </button>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="absolute bottom-0 left-0 w-full shrink-0 border-t border-slate-200 bg-white px-4 py-4 z-50 dark:border-white/10 dark:bg-slate-900 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-950 dark:text-white">
                <span className="text-[15px] font-bold">{isIndo ? "Total:" : "Total:"}</span>
                <span className="text-[18px] font-black">{rupiah(subtotal)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="flex h-[42px] px-6 items-center justify-center rounded-full bg-[var(--tp-accent)] text-sm font-bold text-white shadow-md transition hover:bg-[#e66404]"
              >
                {isIndo ? "Lanjut ke Checkout" : "Proceed to Checkout"}
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
