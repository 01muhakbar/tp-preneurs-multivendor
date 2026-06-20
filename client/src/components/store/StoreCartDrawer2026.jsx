import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Trash2, ShieldCheck, Zap, Bookmark, Shield, RefreshCcw, Headphones, Plus, Minus } from 'lucide-react';
import { useCart } from '../../hooks/useCart.ts';
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

function CartItemCard({ item, onUpdate, onRemove, isLoading }) {
  const [busy, setBusy] = useState(false);
  const target = getCartTarget(item);
  const qty = getQty(item);
  const stock = Number(item?.stock);
  const isIncrementDisabled = isLoading || busy || (Number.isFinite(stock) && qty >= stock);
  const isDecrementDisabled = isLoading || busy || qty <= 1;

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
    <div className={`relative flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-3 transition-opacity dark:border-white/10 dark:bg-slate-900 ${busy ? 'opacity-50' : 'opacity-100'}`}>
      <button 
        onClick={handleDelete}
        disabled={isLoading || busy}
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:bg-slate-950 dark:hover:bg-rose-950/50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <Link to={`/product/${getItemSlug(item)}`} className="flex h-[86px] w-[86px] shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-slate-50 dark:bg-slate-950">
        {getItemImage(item) ? (
          <img src={getItemImage(item)} alt={getItemName(item)} className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
        ) : (
          <span className="text-3xl">{buildFallbackEmoji(item)}</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-center">
        <div className="inline-flex w-fit items-center rounded-full bg-[var(--tp-accent)]/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[var(--tp-accent)] dark:bg-[var(--tp-accent)]/20">
          {getCategoryLabel(item)}
        </div>
        <Link to={`/product/${getItemSlug(item)}`} className="mt-1 line-clamp-1 pr-6 text-[13px] font-bold text-slate-950 hover:text-[var(--tp-primary)] dark:text-white dark:hover:text-sky-400">
          {getItemName(item)}
        </Link>
        <div className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {qty} &times; {getUnitLabel(item)}
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div className="text-[13px] font-black text-slate-950 dark:text-white">
            {rupiah(getLineTotal(item))}
          </div>
          
          <div className="flex h-8 items-center rounded-full border border-slate-200 bg-slate-50 px-1 dark:border-white/10 dark:bg-slate-950">
            <button 
              onClick={() => handleUpdate(qty - 1)}
              disabled={isDecrementDisabled}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-[var(--tp-primary)] hover:text-white disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-600"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">{qty}</span>
            <button 
              onClick={() => handleUpdate(qty + 1)}
              disabled={isIncrementDisabled}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-[var(--tp-primary)] hover:text-white disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-600"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyCart({ onClose }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-600">
        <ShoppingCart className="h-10 w-10" />
      </div>
      <h3 className="mt-6 text-xl font-black text-slate-950 dark:text-white">Your cart is empty</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Looks like you haven't added anything yet.</p>
      <button 
        onClick={onClose}
        className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--tp-primary)] px-8 text-sm font-bold text-white shadow-md transition hover:bg-[#023b69] dark:bg-sky-600 dark:hover:bg-sky-700"
      >
        Continue Shopping
      </button>
    </div>
  );
}

function OrderSummary({ itemsCount, subtotal }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-950 dark:text-white">Order Summary</h3>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{itemsCount} items</span>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-950 dark:text-white">{rupiah(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span>Discount</span>
            <button className="text-[10px] font-bold text-[var(--tp-accent)] hover:underline">Add code</button>
          </div>
          <span className="font-semibold text-slate-950 dark:text-white">- Rp 0</span>
        </div>
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
          <span>Shipping</span>
          <span className="text-[11px] font-medium text-slate-400">Calculated at checkout</span>
        </div>
      </div>
      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-950 dark:text-white">Total</span>
          <span className="text-xl font-black text-slate-950 dark:text-white">{rupiah(subtotal)}</span>
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
            ? 'inset-x-0 bottom-0 max-h-[86vh] rounded-t-[32px] store-cart-drawer-2026-mobile-grip' 
            : 'inset-y-0 right-0 w-full max-w-[440px]'
        }`}
        style={{ transform: visible ? 'translate3d(0,0,0)' : (isBottom ? 'translate3d(0,100%,0)' : 'translate3d(100%,0,0)') }}
      >
        <div className={`flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 ${isBottom ? 'pt-8' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--tp-primary)] text-white">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Shopping Cart</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{itemCount} items</p>
            </div>
          </div>
          <button 
            onClick={closeDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {items.length > 0 && (
          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 px-5 py-2.5 store-cart-drawer-2026-scroll dark:border-white/10 dark:bg-slate-950">
            <CartTrustPill icon={Zap} label="Fast checkout" />
            <CartTrustPill icon={ShieldCheck} label="Secure payment" />
            <CartTrustPill icon={Bookmark} label="Saved cart" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 store-cart-drawer-2026-scroll">
          {items.length === 0 ? (
            <EmptyCart onClose={closeDrawer} />
          ) : (
            <div className="flex flex-col gap-4 pb-4">
              {items.map(item => (
                <CartItemCard 
                  key={getCartTarget(item).lineId || getCartTarget(item).productId || item.id}
                  item={item} 
                  onUpdate={cart.update}
                  onRemove={cart.remove}
                  isLoading={cart.isLoading}
                />
              ))}
              <div className="mt-2">
                <OrderSummary itemsCount={itemCount} subtotal={subtotal} />
              </div>
              <div className="mt-2 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> 100% Secure</div>
                <div className="flex items-center gap-1.5"><RefreshCcw className="h-3.5 w-3.5" /> Easy Returns</div>
                <div className="flex items-center gap-1.5"><Headphones className="h-3.5 w-3.5" /> 24/7 Support</div>
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="shrink-0 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCheckout}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--tp-accent)] text-sm font-bold text-white shadow-md transition hover:bg-[#e66404]"
              >
                <ShieldCheck className="h-4 w-4" />
                Proceed to Checkout
              </button>
              <button 
                onClick={handleViewCart}
                className="flex h-12 w-full items-center justify-center rounded-full border-2 border-[var(--tp-primary)] text-sm font-bold text-[var(--tp-primary)] transition hover:bg-[var(--tp-primary)] hover:text-white dark:border-white/10 dark:bg-slate-900 dark:text-sky-100 dark:hover:bg-slate-800"
              >
                View Cart
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
