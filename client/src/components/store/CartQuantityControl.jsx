import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { clampCartQuantity, normalizeCartStock } from "../../utils/cartQuantity.js";

export default function CartQuantityControl({
  quantity,
  stock,
  disabled = false,
  name,
  onCommit,
  variant = "page",
}) {
  const safeQuantity = clampCartQuantity(quantity, null);
  const availableStock = normalizeCartStock(stock);
  const [draft, setDraft] = useState(String(safeQuantity));
  const controlRef = useRef(null);

  useEffect(() => {
    setDraft(String(safeQuantity));
  }, [safeQuantity]);

  const commit = (value = draft) => {
    const nextQuantity = clampCartQuantity(value, availableStock, safeQuantity);
    setDraft(String(nextQuantity));
    if (!disabled && nextQuantity !== safeQuantity) onCommit(nextQuantity);
  };

  const handleBlur = (event) => {
    if (controlRef.current?.contains(event.relatedTarget)) return;
    commit();
  };

  const handleStep = (step) => {
    const currentDraft = clampCartQuantity(draft, availableStock, safeQuantity);
    commit(currentDraft + step);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft(String(safeQuantity));
    }
  };

  const isDrawer = variant === "drawer";
  const currentDraft = clampCartQuantity(draft, availableStock, safeQuantity);
  const decrementDisabled = disabled || currentDraft <= 1;
  const incrementDisabled =
    disabled || (availableStock !== null && currentDraft >= availableStock);
  const buttonClass = isDrawer
    ? "flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-[var(--tp-primary)] hover:text-white disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-600"
    : undefined;
  const inputClass = isDrawer
    ? "h-6 w-8 appearance-none bg-transparent p-0 text-center text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-[var(--tp-primary)] dark:text-white"
    : undefined;

  return (
    <div
      ref={controlRef}
      className={isDrawer
        ? "flex h-8 items-center rounded-full border border-slate-200 bg-slate-50 px-1 dark:border-white/10 dark:bg-slate-950"
        : "cart-quantity-control"}
    >
      <button type="button" onClick={() => handleStep(-1)} disabled={decrementDisabled} className={buttonClass} aria-label={`Decrease ${name} quantity`}>
        <Minus className={isDrawer ? "h-3 w-3" : undefined} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        role="spinbutton"
        value={draft}
        disabled={disabled}
        className={inputClass}
        aria-label={`Quantity for ${name}`}
        aria-valuemin="1"
        aria-valuemax={availableStock ?? undefined}
        aria-valuenow={draft === "" ? undefined : currentDraft}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      <button type="button" onClick={() => handleStep(1)} disabled={incrementDisabled} className={buttonClass} aria-label={`Increase ${name} quantity`}>
        <Plus className={isDrawer ? "h-3 w-3" : undefined} />
      </button>
    </div>
  );
}
