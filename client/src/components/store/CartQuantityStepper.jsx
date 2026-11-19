import React, { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function CartQuantityStepper({
  item,
  disabled = false,
  onDecrease,
  onIncrease,
  onChangeQuantity,
  isIndo = false,
}) {
  const currentQuantity = Number(item?.quantity) || 1;
  const [localVal, setLocalVal] = useState(() => String(currentQuantity));

  useEffect(() => {
    setLocalVal(String(currentQuantity));
  }, [currentQuantity]);

  const handleInputChange = (e) => {
    // Only allow digits
    const numericOnly = e.target.value.replace(/[^0-9]/g, "");
    setLocalVal(numericOnly);
  };

  const commitValue = () => {
    let parsed = Number.parseInt(localVal, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      parsed = 1;
    }
    const maxStock =
      item?.stock !== null && item?.stock !== undefined ? Number(item.stock) : null;
    if (maxStock !== null && !Number.isNaN(maxStock) && parsed > maxStock) {
      parsed = maxStock;
      toast.error(
        isIndo
          ? `Maksimal pembelian ${maxStock} item sesuai stok.`
          : `Maximum order is ${maxStock} item(s) in stock.`
      );
    }
    setLocalVal(String(parsed));
    if (parsed !== currentQuantity && typeof onChangeQuantity === "function") {
      onChangeQuantity(item, parsed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const isMaxStock =
    item?.stock !== null &&
    item?.stock !== undefined &&
    currentQuantity >= Number(item.stock);

  return (
    <div
      className="sc26-shopee-stepper"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="sc26-shopee-step-btn"
        onClick={() => onDecrease(item)}
        disabled={disabled}
        aria-label="Decrease quantity"
        title={isIndo ? "Kurangi jumlah" : "Decrease quantity"}
      >
        <Minus className="w-3 h-3" />
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="sc26-shopee-step-input"
        value={localVal}
        onChange={handleInputChange}
        onBlur={commitValue}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Quantity"
        title={isIndo ? "Ketik jumlah manual" : "Type quantity manually"}
      />

      <button
        type="button"
        className="sc26-shopee-step-btn"
        onClick={() => onIncrease(item)}
        disabled={isMaxStock || disabled}
        aria-label="Increase quantity"
        title={isIndo ? "Tambah jumlah" : "Increase quantity"}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}
