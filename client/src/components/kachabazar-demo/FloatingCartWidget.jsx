import { ShoppingCart } from "lucide-react";
import { useCart } from "../../hooks/useCart.ts";
import { formatCurrency } from "../../utils/format.js";

export default function FloatingCartWidget() {
  const { count, subtotal } = useCart();

  const handleOpenDrawer = () => {
    window.dispatchEvent(new Event("cart-drawer:open"));
  };

  return (
    <button
      type="button"
      onClick={handleOpenDrawer}
      aria-label="Open shopping cart"
      className="no-print fixed right-4 top-1/2 z-30 hidden w-[104px] -translate-y-1/2 flex-col items-center overflow-hidden rounded-[24px] border border-[#d8e4f2] bg-white text-[#071a3f] shadow-[0_22px_44px_rgba(3,76,133,0.16)] transition hover:-translate-y-[calc(50%+2px)] hover:shadow-[0_26px_54px_rgba(3,76,133,0.2)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 2xl:flex"
    >
      <span className="relative mt-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f7fbff] text-[#034c85] shadow-inner dark:bg-slate-800 dark:text-sky-300">
        <ShoppingCart className="h-6 w-6" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#fe6f05] px-1.5 text-[11px] font-black leading-5 text-white">
            {count}
          </span>
        ) : null}
      </span>
      <span className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-300">
        {count} Items
      </span>
      <span className="mt-4 block w-full bg-[#034c85] px-2 py-4 text-center text-lg font-black leading-none text-white">
        {formatCurrency(Number(subtotal || 0))}
      </span>
    </button>
  );
}
