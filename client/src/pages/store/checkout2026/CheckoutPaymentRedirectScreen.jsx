import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  CreditCard,
  QrCode,
  WalletCards,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function CheckoutPaymentRedirectScreen({
  redirectUrl,
  orderInfo = null,
  grandTotal = 0,
  formatMoney = (val) => `Rp ${Number(val || 0).toLocaleString("id-ID")}`,
  isIndo = true,
  duitkuMethod = "SP",
  duitkuMethods = [],
}) {
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Determine order reference & total
  const orderRef = orderInfo?.orderRef || orderInfo?.orderId || "";
  const displayTotal = Number(orderInfo?.amount || grandTotal || 0);

  // Resolve payment channel name & category
  const paymentDetails = useMemo(() => {
    const code = String(orderInfo?.paymentMethod || duitkuMethod || "SP").trim();
    const matched = Array.isArray(duitkuMethods)
      ? duitkuMethods.find((m) => m?.code === code)
      : null;

    let icon = <CreditCard className="w-4 h-4 text-blue-400" />;
    let label = matched?.label || "Duitku Payment";
    const category = matched?.category || "Gateway";

    if (category === "QRIS" || code === "SP" || code === "NQ" || code === "GQ") {
      icon = <QrCode className="w-4 h-4 text-[#fe6f05]" />;
      label = matched?.label || "QRIS Instant";
    } else if (category === "E-Wallet" || code === "DA" || code === "OV") {
      icon = <WalletCards className="w-4 h-4 text-emerald-400" />;
      label = matched?.label || "E-Wallet";
    } else if (category === "Virtual Account") {
      icon = <CreditCard className="w-4 h-4 text-blue-400" />;
      label = matched?.label || "Virtual Account";
    }

    return { code, label, category, icon };
  }, [orderInfo?.paymentMethod, duitkuMethod, duitkuMethods]);

  // Execute redirection
  const handleRedirect = useCallback(() => {
    if (!redirectUrl) return;
    setIsRedirecting(true);
    try {
      window.location.assign(redirectUrl);
    } catch {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  // Auto countdown & auto redirect
  useEffect(() => {
    if (!redirectUrl) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [redirectUrl, handleRedirect]);

  // Copy invoice reference
  const handleCopy = () => {
    if (!orderRef) return;
    try {
      navigator.clipboard.writeText(orderRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Translations
  const T = isIndo
    ? {
        badge: "Pesanan Siap Dibayar",
        title: "Pesanan Berhasil Dibuat!",
        subtitle:
          "Sistem sedang menghubungkan Anda ke gateway pembayaran resmi Duitku...",
        orderNo: "Nomor Pesanan",
        copied: "Disalin!",
        paymentMethod: "Metode Pembayaran",
        totalAmount: "Total Pembayaran",
        autoRedirect: (sec) => `Mengalihkan otomatis dalam ${sec} detik...`,
        btnContinue: "Lanjutkan ke Pembayaran",
        btnConnecting: "Menghubungkan ke Duitku...",
        fallbackHint:
          "Jika Anda tidak dialihkan secara otomatis, silakan klik tombol di atas.",
        duitkuCloseTip:
          "💡 Tips: Setelah transaksi sukses di Duitku, tekan tombol \"Tutup\" untuk kembali otomatis ke Rincian Pesanan TP Preneurs.",
        viewOrders: "Lihat Daftar Pesanan",
        sslSecure: "Enkripsi SSL 256-Bit",
        duitkuCertified: "Duitku Payment Gateway",
        bankIndonesia: "Diawasi Bank Indonesia",
      }
    : {
        badge: "Ready for Payment",
        title: "Order Created Successfully!",
        subtitle:
          "Connecting you securely to the official Duitku payment gateway...",
        orderNo: "Order Reference",
        copied: "Copied!",
        paymentMethod: "Payment Method",
        totalAmount: "Total Amount",
        autoRedirect: (sec) => `Redirecting automatically in ${sec}s...`,
        btnContinue: "Continue to Payment",
        btnConnecting: "Connecting to Duitku...",
        fallbackHint:
          "If you are not redirected automatically, please click the button above.",
        duitkuCloseTip:
          "💡 Tip: After completing payment in Duitku, click the \"Tutup\" (Close) button to automatically return to your TP Preneurs Order Details.",
        viewOrders: "View Order List",
        sslSecure: "256-Bit SSL Encryption",
        duitkuCertified: "Duitku Payment Gateway",
        bankIndonesia: "Bank Indonesia Licensed",
      };

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-slate-950/40">
      <div className="w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Subtle decorative background gradient glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#034c85]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#fe6f05]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Animated Success Badge */}
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#034c85] border-2 border-slate-900 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5 text-[#fe6f05]" />
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{T.badge}</span>
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            {T.title}
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
            {T.subtitle}
          </p>

          {/* Order Details Card */}
          <div className="w-full bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 mb-6 text-left space-y-3">
            {/* Order Ref */}
            {orderRef ? (
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-400">{T.orderNo}</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-slate-200">
                  <span>#{orderRef}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                    title={copied ? T.copied : "Salin nomor pesanan"}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Payment Method */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400">{T.paymentMethod}</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-medium">
                {paymentDetails.icon}
                <span>{paymentDetails.label}</span>
              </div>
            </div>

            {/* Total Amount */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-slate-300">
                {T.totalAmount}
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#fe6f05] tracking-tight">
                {formatMoney(displayTotal)}
              </span>
            </div>
          </div>

          {/* Countdown & Animated Progress Bar */}
          <div className="w-full mb-5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#fe6f05]" />
                <span>{T.autoRedirect(countdown)}</span>
              </span>
              <span className="font-semibold text-slate-300">
                {Math.round(((3 - countdown) / 3) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#034c85] via-blue-500 to-[#fe6f05] rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min(100, Math.max(10, ((3 - countdown) / 3) * 100))}%` }}
              />
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleRedirect}
            disabled={isRedirecting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#034c85] to-[#023660] hover:from-[#023660] hover:to-[#01223d] active:scale-[0.99] text-white font-bold text-base shadow-xl shadow-[#034c85]/30 border border-blue-400/20 flex items-center justify-center gap-2.5 transition-all group cursor-pointer disabled:opacity-85"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#fe6f05]" />
                <span>{T.btnConnecting}</span>
              </>
            ) : (
              <>
                <LockKeyhole className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>{T.btnContinue}</span>
                <ExternalLink className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          {/* Fallback Notice */}
          <p className="text-[11px] sm:text-xs text-slate-500 mt-3 max-w-xs leading-normal">
            {T.fallbackHint}
          </p>

          {/* Duitku Return Guidance Tip */}
          <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-blue-950/40 border border-blue-800/30 text-[11px] text-blue-300 leading-relaxed text-center max-w-sm">
            {T.duitkuCloseTip}
          </div>

          {/* Secondary Link */}
          <div className="mt-4 pt-4 border-t border-slate-800/60 w-full flex items-center justify-center">
            <Link
              to="/user/my-orders"
              className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition"
            >
              <span>{T.viewOrders}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Security & Trust Badges */}
          <div className="mt-6 pt-4 border-t border-slate-800/50 w-full flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{T.sslSecure}</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <LockKeyhole className="w-3.5 h-3.5 text-blue-400" />
              <span>{T.duitkuCertified}</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <span>{T.bankIndonesia}</span>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

