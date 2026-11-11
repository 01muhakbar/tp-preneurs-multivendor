import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Sparkles, Ticket, X } from "lucide-react";
import toast from "react-hot-toast";
import { fetchStoreCoupons, quoteStoreCoupon } from "../../../api/storeCoupons.ts";

export default function StoreCartPlatformVoucherModal({
  isOpen,
  onClose,
  cartSubtotal = 0,
  appliedCoupon = null,
  onApplyCoupon,
  onRemoveCoupon,
  isIndo = true,
  formatMoney = (val) => `Rp ${Number(val || 0).toLocaleString("id-ID")}`,
}) {
  const [inputCode, setInputCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch active platform coupons (call without storeId to query global/platform vouchers)
  const { data: couponResponse, isLoading: isCouponsLoading } = useQuery({
    queryKey: ["platform-coupons"],
    queryFn: () => fetchStoreCoupons(),
    enabled: isOpen,
    staleTime: 30_000,
  });

  const availableCoupons = Array.isArray(couponResponse?.data)
    ? couponResponse.data.filter((c) => {
        if (!c || !c.code || c.published === false) return false;
        // Platform scope vouchers have scopeType === 'PLATFORM' or no storeId
        if (c.scopeType && c.scopeType !== "PLATFORM") return false;
        if (c.storeId && Number(c.storeId) > 0) return false;
        const now = new Date();
        if (c.startsAt && new Date(c.startsAt) > now) return false;
        if (c.expiresAt && new Date(c.expiresAt) < now) return false;
        return true;
      })
    : [];

  if (!isOpen) return null;

  const handleApply = async (codeToApply) => {
    const code = String(codeToApply || inputCode).trim().toUpperCase();
    if (!code) {
      setErrorMessage(
        isIndo
          ? "Masukkan kode voucher platform terlebih dahulu."
          : "Please enter a platform voucher code."
      );
      return;
    }

    setIsValidating(true);
    setErrorMessage("");

    try {
      const result = await quoteStoreCoupon({
        code,
        subtotal: cartSubtotal,
        shipping: 0,
      });

      if (!result.valid) {
        const msg =
          result.message ||
          (result.reason === "minSpend"
            ? isIndo
              ? `Belanja minimum ${formatMoney(result.minSpend || 0)} belum terpenuhi.`
              : `Minimum spend of ${formatMoney(result.minSpend || 0)} required.`
            : isIndo
              ? "Kode voucher tidak valid atau sudah kedaluwarsa."
              : "Voucher code is invalid or expired.");
        setErrorMessage(msg);
        return;
      }

      const discountAmount = Math.max(0, Number(result.discount || 0));
      onApplyCoupon?.({
        code: result.code || code,
        discountAmount,
        discountType: result.discountType || "percent",
        discountValue: result.discountValue || 0,
        minSpend: result.minSpend || 0,
        maxDiscount: result.maxDiscount || 0,
        scopeType: "PLATFORM",
      });

      toast.success(
        isIndo
          ? `Voucher Platform ${code} berhasil dipasang! Hemat ${formatMoney(discountAmount)}.`
          : `Platform voucher ${code} applied! Saved ${formatMoney(discountAmount)}.`
      );
      setInputCode("");
      onClose();
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message ||
          (isIndo ? "Gagal memvalidasi voucher platform." : "Failed to validate platform voucher.")
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    onRemoveCoupon?.();
    toast.success(isIndo ? "Voucher platform dilepas." : "Platform voucher removed.");
    onClose();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return isIndo ? "Tanpa batas waktu" : "No expiry";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(isIndo ? "id-ID" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="store-cart-voucher-modal-overlay" onClick={onClose}>
      <div
        className="store-cart-voucher-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="store-cart-voucher-modal-header">
          <div className="store-cart-voucher-modal-title-wrap">
            <Ticket className="store-cart-voucher-header-icon" size={20} />
            <h3 className="store-cart-voucher-modal-title">
              {isIndo ? "Voucher Diskon Platform" : "Platform Discount Voucher"}
            </h3>
          </div>
          <button
            type="button"
            className="store-cart-voucher-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="store-cart-voucher-modal-body">
          {/* Manual Input Form */}
          <div className="store-cart-voucher-input-box">
            <label className="store-cart-voucher-input-label">
              {isIndo
                ? "Punya kode voucher platform / promo?"
                : "Have a platform voucher or promo code?"}
            </label>
            <div className="store-cart-voucher-input-row">
              <input
                type="text"
                className="store-cart-voucher-input"
                placeholder={isIndo ? "Masukkan kode voucher platform" : "Enter platform voucher code"}
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setErrorMessage("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApply();
                  }
                }}
              />
              <button
                type="button"
                className="store-cart-voucher-apply-btn"
                disabled={!inputCode.trim() || isValidating}
                onClick={() => handleApply()}
              >
                {isValidating ? (
                  <Loader2 className="store-cart-spin" size={16} />
                ) : isIndo ? (
                  "Pakai"
                ) : (
                  "Apply"
                )}
              </button>
            </div>
            {errorMessage && (
              <div className="store-cart-voucher-error-msg">{errorMessage}</div>
            )}
          </div>

          {/* Currently Applied Banner */}
          {appliedCoupon && (
            <div className="store-cart-voucher-current-banner">
              <div className="store-cart-voucher-current-info">
                <span className="store-cart-voucher-current-tag">
                  {appliedCoupon.code}
                </span>
                <span className="store-cart-voucher-current-text">
                  {(() => {
                    const discountType = String(appliedCoupon.discountType || "").toLowerCase();
                    const val = Number(appliedCoupon.discountValue || appliedCoupon.amount || 0);
                    let saving = appliedCoupon.discountAmount || 0;
                    if (discountType === "percent" || discountType === "percentage") {
                      saving = Math.round((cartSubtotal * val) / 100);
                      const maxDiscount = Number(appliedCoupon.maxDiscount);
                      if (Number.isFinite(maxDiscount) && maxDiscount > 0) {
                        saving = Math.min(saving, maxDiscount);
                      }
                    }
                    saving = Math.min(cartSubtotal, saving);
                    return isIndo
                      ? `Hemat ${formatMoney(saving)}`
                      : `Save ${formatMoney(saving)}`;
                  })()}
                </span>
              </div>
              <button
                type="button"
                className="store-cart-voucher-remove-link"
                onClick={handleRemove}
              >
                {isIndo ? "Hapus" : "Remove"}
              </button>
            </div>
          )}

          {/* Available Coupons List */}
          <div className="store-cart-voucher-list-header">
            <h4>{isIndo ? "Voucher Platform Tersedia" : "Available Platform Vouchers"}</h4>
            <span className="store-cart-voucher-subtotal-hint">
              {isIndo
                ? `Total Belanja: ${formatMoney(cartSubtotal)}`
                : `Cart Subtotal: ${formatMoney(cartSubtotal)}`}
            </span>
          </div>

          <div className="store-cart-voucher-list">
            {isCouponsLoading ? (
              <div className="store-cart-voucher-loading">
                <Loader2 className="store-cart-spin" size={24} />
                <span>{isIndo ? "Memuat voucher platform..." : "Loading platform vouchers..."}</span>
              </div>
            ) : availableCoupons.length === 0 ? (
              <div className="store-cart-voucher-empty">
                <Ticket className="store-cart-voucher-empty-icon" size={32} />
                <p>
                  {isIndo
                    ? "Belum ada voucher diskon platform saat ini. Anda dapat memasukkan kode promo khusus di atas jika memilikinya."
                    : "No active platform vouchers at the moment. You can enter a promo code above."}
                </p>
              </div>
            ) : (
              availableCoupons.map((coupon) => {
                const isSelected = appliedCoupon?.code === coupon.code;
                const minSpend = Number(coupon.minSpend || 0);
                const isEligible = cartSubtotal >= minSpend;
                const diff = minSpend - cartSubtotal;

                return (
                  <div
                    key={coupon.id || coupon.code}
                    className={`store-cart-voucher-card ${
                      isSelected ? "is-selected" : ""
                    } ${!isEligible ? "is-disabled" : ""}`}
                  >
                    <div className="store-cart-voucher-card-left">
                      <div className="store-cart-voucher-badge-icon">
                        <Sparkles size={16} />
                      </div>
                      <div className="store-cart-voucher-card-text">
                        <div className="store-cart-voucher-card-code">
                          {coupon.code}
                        </div>
                        <div className="store-cart-voucher-card-discount">
                          {coupon.discountType === "percent"
                            ? isIndo
                              ? `Diskon ${coupon.amount}%`
                              : `${coupon.amount}% Off`
                            : isIndo
                              ? `Potongan ${formatMoney(coupon.amount)}`
                              : `Discount ${formatMoney(coupon.amount)}`}
                        </div>
                        <div className="store-cart-voucher-card-meta">
                          {minSpend > 0 ? (
                            <span>
                              {isIndo
                                ? `Min. blj ${formatMoney(minSpend)}`
                                : `Min. spend ${formatMoney(minSpend)}`}
                            </span>
                          ) : (
                            <span>{isIndo ? "Tanpa min. belanja" : "No min. spend"}</span>
                          )}
                          <span className="store-cart-voucher-dot">•</span>
                          <span>
                            {isIndo ? "s/d " : "Exp: "}
                            {formatDate(coupon.expiresAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="store-cart-voucher-card-right">
                      {isSelected ? (
                        <button
                          type="button"
                          className="store-cart-voucher-btn is-applied"
                          disabled
                        >
                          <Check size={14} />
                          {isIndo ? "Dipakai" : "Used"}
                        </button>
                      ) : isEligible ? (
                        <button
                          type="button"
                          className="store-cart-voucher-btn is-claim"
                          disabled={isValidating}
                          onClick={() => handleApply(coupon.code)}
                        >
                          {isIndo ? "Gunakan" : "Use"}
                        </button>
                      ) : (
                        <div className="store-cart-voucher-locked">
                          <span>
                            {isIndo
                              ? `+${formatMoney(diff)} lagi`
                              : `+${formatMoney(diff)} more`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="store-cart-voucher-modal-footer">
          <button
            type="button"
            className="store-cart-voucher-modal-done-btn"
            onClick={onClose}
          >
            {isIndo ? "Selesai" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
