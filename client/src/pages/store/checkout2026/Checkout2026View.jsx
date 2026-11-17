import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  Info,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageSquare,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  Ticket,
  Truck,
  WalletCards,
  X,
} from "lucide-react";
import CheckoutAddressModal from "./CheckoutAddressModal.jsx";
import CheckoutShippingModal from "./CheckoutShippingModal.jsx";
import StoreCartVoucherModal from "../cart2026/StoreCartVoucherModal.jsx";
import StoreCartPlatformVoucherModal from "../cart2026/StoreCartPlatformVoucherModal.jsx";
import CheckoutPaymentRedirectScreen from "./CheckoutPaymentRedirectScreen.jsx";
import "./checkout2026.css";

const DUITKU_CHANNEL_BRANDS = {
  BC: { mark: "BCA", tone: "bca" },
  I1: { mark: "BNI", tone: "bni" },
  BR: { mark: "BRI", tone: "bri" },
  M2: { mark: "MDR", tone: "mandiri" },
  BT: { mark: "PRM", tone: "permata" },
  B1: { mark: "CIMB", tone: "cimb" },
  BV: { mark: "BSI", tone: "bsi" },
  DA: { mark: "DANA", tone: "dana" },
  OV: { mark: "OVO", tone: "ovo" },
  IR: { mark: "IDM", tone: "indomaret" },
  FT: { mark: "RET", tone: "retail" },
  SP: { mark: "SPay", tone: "qris" },
  NQ: { mark: "NOBU", tone: "qris" },
  GQ: { mark: "GV", tone: "qris" },
};

export default function Checkout2026View({
  viewModel,
  isIndo: isIndoProp,
  form,
  status,
  coupons,
  formatMoney = (val) => `Rp ${Number(val || 0).toLocaleString("id-ID")}`,
  savedAddresses = [],
  selectedAddressId = null,
  onSelectAddress,
  onSaveNewAddress,
  onUpdateAddress,
  sellerNotes = {},
  onSellerNoteChange,
  appliedPlatformCoupon = null,
  totalPlatformDiscount = 0,
  onApplyPlatformCoupon,
  onRemovePlatformCoupon,
  appliedStoreCoupons = {},
  onApplyStoreCoupon,
  onRemoveStoreCoupon,
  selectedStoreShipping = {},
  onSelectStoreShipping,
  onSubmit,
  onBackToCart,
}) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const isIndo =
    isIndoProp !== undefined
      ? isIndoProp
      : i18n.language === "id" ||
        i18n.language === "id-ID" ||
        i18n.language?.startsWith("id") ||
        (typeof window !== "undefined" &&
          (localStorage.getItem("store_language") === "Indonesia" ||
            localStorage.getItem("store_language") === "Bahasa Indonesia"));

  // Modals state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [voucherModalStore, setVoucherModalStore] = useState(null);
  const [shippingModalStore, setShippingModalStore] = useState(null);
  const [isPlatformVoucherModalOpen, setIsPlatformVoucherModalOpen] = useState(false);

  // Safe normalized props
  const safeAppliedStoreCoupons =
    appliedStoreCoupons && typeof appliedStoreCoupons === "object"
      ? appliedStoreCoupons
      : {};
  const safeSellerNotes =
    sellerNotes && typeof sellerNotes === "object" ? sellerNotes : {};
  const safeGroups = Array.isArray(viewModel?.groups) ? viewModel.groups : [];
  const safeSavedAddresses = Array.isArray(savedAddresses) ? savedAddresses : [];

  // Translations
  const T = isIndo
    ? {
        checkoutTitle: "Checkout",
        deliveryAddress: "Alamat Pengiriman",
        selectAddress: "Pilih Alamat Pengiriman",
        addAddress: "Tambah Alamat Baru",
        noAddressChosen: "Belum ada alamat pengiriman terpilih. Klik di sini untuk memilih atau menambah alamat.",
        messageForSeller: "Pesan untuk Penjual",
        messagePlaceholder: "Tinggalkan pesan untuk penjual...",
        storeVoucher: "Voucher Toko",
        useVoucher: "Gunakan voucher",
        platformVoucher: "Voucher Diskon Platform",
        usePlatformVoucher: "Gunakan / masukkan kode",
        shippingOption: "Opsi Pengiriman",
        change: "Ubah",
        packageWeight: "Berat Paket",
        shippingAuto: "Otomatis per kg",
        regularShipping: "Reguler",
        shippingEstimate: "Estimasi 2 - 3 Hari Kerja",
        onTimeGuarantee: "Garansi Tepat Waktu · Diproses langsung oleh penjual",
        freeShipping: "Gratis",
        orderSummary: "Rincian Pembayaran",
        orderSubtotal: "Subtotal Pesanan",
        shippingSubtotal: "Subtotal Pengiriman",
        serviceFee: "Biaya Layanan",
        storeDiscount: "Diskon Toko",
        platformDiscount: "Diskon Platform",
        totalPayment: "Total Pembayaran",
        totalProductCount: (count) => `Total ${count} Produk:`,
        paymentMethod: "Metode Pembayaran",
        seeAll: "Lihat Semua",
        chooseChannel: "Pilih Saluran Pembayaran",
        categoryNames: {
          "Virtual Account": "Virtual Account",
          "E-Wallet": "Dompet Digital (E-Wallet)",
          "Retail": "Gerai Retail",
          "QRIS": "QRIS / Instant",
        },
        savedHint: "Hemat",
        placeOrder: "Buat Pesanan",
        placingOrder: "Memproses...",
        emptyTitle: "Keranjang Belanja Masih Kosong",
        emptyDesc: "Pilih produk favorit Anda terlebih dahulu sebelum melakukan checkout.",
        backToCart: "Kembali ke Keranjang",
        orderCreated: "Pesanan Berhasil Dibuat",
        openingPayment: "Membuka halaman pembayaran aman...",
        continueToPayment: "Lanjutkan ke Pembayaran",
        attention: "Perhatian",
      }
    : {
        checkoutTitle: "Checkout",
        deliveryAddress: "Delivery Address",
        selectAddress: "Select Delivery Address",
        addAddress: "Add New Address",
        noAddressChosen: "No delivery address chosen yet. Click here to select or add your address.",
        messageForSeller: "Message for Seller",
        messagePlaceholder: "Leave a message for seller...",
        storeVoucher: "Store Voucher",
        useVoucher: "Use voucher",
        platformVoucher: "Platform Discount Voucher",
        usePlatformVoucher: "Use / enter promo code",
        shippingOption: "Shipping Option",
        change: "Change",
        packageWeight: "Package Weight",
        shippingAuto: "Auto per kg",
        regularShipping: "Standard Delivery",
        shippingEstimate: "Est. 2 - 3 Business Days",
        onTimeGuarantee: "On-Time Guarantee · Processed directly by seller",
        freeShipping: "Free",
        orderSummary: "Payment Details",
        orderSubtotal: "Order Subtotal",
        shippingSubtotal: "Shipping Subtotal",
        serviceFee: "Service Fee",
        storeDiscount: "Store Discount",
        platformDiscount: "Platform Discount",
        totalPayment: "Total Payment",
        totalProductCount: (count) => `Total ${count} Item${count > 1 ? "s" : ""}:`,
        paymentMethod: "Payment Method",
        seeAll: "See All",
        chooseChannel: "Choose Payment Channel",
        categoryNames: {
          "Virtual Account": "Virtual Account",
          "E-Wallet": "E-Wallet",
          "Retail": "Retail Outlets",
          "QRIS": "QRIS / Instant",
        },
        savedHint: "Saved",
        placeOrder: "Place Order",
        placingOrder: "Processing...",
        emptyTitle: "Your Cart is Empty",
        emptyDesc: "Select your favorite items from the store before proceeding to checkout.",
        backToCart: "Back to Cart",
        orderCreated: "Order Created Successfully",
        openingPayment: "Redirecting to secure payment page...",
        continueToPayment: "Continue to Payment",
        attention: "Attention",
      };

  // Active address resolution
  const activeAddress =
    (selectedAddressId
      ? safeSavedAddresses.find(
          (a) => a && Number(a.id) === Number(selectedAddressId)
        )
      : null) ||
    safeSavedAddresses.find((a) => Boolean(a?.isPrimary)) ||
    (safeSavedAddresses.length > 0 ? safeSavedAddresses[0] : null) ||
    (form?.shipping?.streetName
      ? {
          fullName: `${form?.firstName || ""} ${form?.lastName || ""}`.trim() || "Penerima",
          phoneNumber: form?.phone || "",
          streetName: form.shipping.streetName,
          houseNumber: form.shipping.houseNumber,
          district: form.shipping.district,
          city: form.shipping.city,
          province: form.shipping.province,
          postalCode: form.shipping.postalCode,
          isPrimary: true,
        }
      : null);

  // Auto-synchronize resolved primary/saved address to checkout form if not yet selected
  useEffect(() => {
    if (!selectedAddressId && activeAddress?.id && onSelectAddress) {
      onSelectAddress(activeAddress);
    }
  }, [selectedAddressId, activeAddress, onSelectAddress]);

  const formattedAddressText = activeAddress
    ? [
        activeAddress.streetName,
        activeAddress.houseNumber && activeAddress.houseNumber !== "-" ? `No. ${activeAddress.houseNumber}` : null,
        activeAddress.building,
        activeAddress.district,
        activeAddress.city,
        activeAddress.province,
        activeAddress.postalCode,
      ]
        .map((p) => (typeof p === "string" ? p.trim() : typeof p === "number" ? String(p) : ""))
        .filter(Boolean)
        .join(", ")
    : "";

  // Calculations (must be at top level before early returns for React Hook rules)
  const subtotal = Number(viewModel?.amounts?.subtotal || 0);
  const shipping = Number(viewModel?.amounts?.shipping || 0);

  // Dynamic store discount from groups & safeAppliedStoreCoupons
  const calculatedStoreDiscount = useMemo(() => {
    return safeGroups.reduce((sum, group) => {
      if (!group) return sum;
      const storeKey = String(group.storeId || "");
      const appliedVoucher =
        safeAppliedStoreCoupons[storeKey] ||
        (group.key && safeAppliedStoreCoupons[group.key]) ||
        (group.storeSlug && safeAppliedStoreCoupons[`slug:${group.storeSlug}`]) ||
        (group.storeId && safeAppliedStoreCoupons[`id:${group.storeId}`]) ||
        null;
      if (!appliedVoucher) return sum;

      const groupItems = Array.isArray(group.items) ? group.items : [];
      const groupSubtotal = groupItems.reduce(
        (acc, it) => acc + (Number(it?.unitPrice) || 0) * (Number(it?.quantity) || 1),
        0
      );

      const discountType = String(appliedVoucher.discountType || "").toLowerCase();
      const val = Number(appliedVoucher.discountValue ?? appliedVoucher.amount ?? 0);
      let disc = 0;
      if (discountType === "percent" || discountType === "percentage") {
        disc = Math.round((groupSubtotal * val) / 100);
        const maxDiscount = Number(appliedVoucher.maxDiscount);
        if (Number.isFinite(maxDiscount) && maxDiscount > 0) {
          disc = Math.min(disc, maxDiscount);
        }
      } else {
        disc = Number(
          appliedVoucher.discountAmount ??
            appliedVoucher.discountValue ??
            appliedVoucher.amount ??
            0
        );
      }
      return sum + Math.min(groupSubtotal, Math.max(0, disc));
    }, 0);
  }, [safeGroups, safeAppliedStoreCoupons]);

  // Dynamic platform discount
  const calculatedPlatformDiscount = useMemo(() => {
    if (!appliedPlatformCoupon) return Number(totalPlatformDiscount || 0);
    const discountType = String(appliedPlatformCoupon.discountType || "").toLowerCase();
    const val = Number(appliedPlatformCoupon.discountValue ?? appliedPlatformCoupon.amount ?? 0);
    let disc = 0;
    if (discountType === "percent" || discountType === "percentage") {
      disc = Math.round((subtotal * val) / 100);
      const maxDiscount = Number(appliedPlatformCoupon.maxDiscount);
      if (Number.isFinite(maxDiscount) && maxDiscount > 0) {
        disc = Math.min(disc, maxDiscount);
      }
    } else {
      disc = Number(
        appliedPlatformCoupon.discountAmount ??
          appliedPlatformCoupon.discountValue ??
          appliedPlatformCoupon.amount ??
          0
      );
    }
    return Math.min(subtotal, Math.max(0, disc));
  }, [appliedPlatformCoupon, subtotal, totalPlatformDiscount]);

  const totalStoreDiscount = calculatedStoreDiscount;
  const platformDiscount = Math.max(
    calculatedPlatformDiscount,
    Number(totalPlatformDiscount || 0)
  );
  const totalDiscount = Math.max(
    totalStoreDiscount + platformDiscount,
    Number(viewModel?.amounts?.discount || 0)
  );
  const grandTotal = Math.max(0, subtotal + shipping - totalDiscount);

  const busy = Boolean(status?.submitting || status?.cartSyncing);

  // Early returns (MUST come AFTER all hooks are called)
  if (status?.loading) {
    return (
      <main className="co26-page">
        <div className="co26-skeleton">
          <i />
          <i />
          <i />
          <i />
        </div>
      </main>
    );
  }

  if (status?.redirectUrl) {
    return (
      <CheckoutPaymentRedirectScreen
        redirectUrl={status.redirectUrl}
        orderInfo={status.createdOrder}
        grandTotal={grandTotal}
        formatMoney={formatMoney}
        isIndo={isIndo}
        duitkuMethod={form?.duitkuPaymentMethod}
        duitkuMethods={form?.duitkuPaymentMethods}
      />
    );
  }

  if (!status?.hasItems) {
    return (
      <main className="co26-page">
        <div className="co26-empty">
          <ShoppingBag className="text-slate-500 mb-2" size={48} />
          <h1 className="text-xl font-black text-slate-100">{T.emptyTitle}</h1>
          <p className="text-sm text-slate-400 mt-1">{T.emptyDesc}</p>
          <Link to="/cart" className="co26-btn-secondary mt-4 inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            <span>{T.backToCart}</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="co26-shopee-page">
      {/* Top Header */}
      <header className="co26-shopee-top-header">
        <button
          type="button"
          onClick={onBackToCart}
          className="co26-shopee-back-btn"
          title={T.backToCart}
          aria-label={T.backToCart}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="co26-shopee-header-title">{T.checkoutTitle}</h1>
      </header>

      <div className="co26-shopee-shell">
        {/* Error / Warning Alert */}
        {(status?.error || viewModel?.previewError) && (
          <div className="co26-shopee-alert" role="alert">
            <AlertTriangle className="text-[#fe6f05] shrink-0" size={18} />
            <div className="text-xs sm:text-sm">
              <strong className="block font-bold">{T.attention}</strong>
              <p>{status?.error || viewModel?.previewError}</p>
            </div>
          </div>
        )}

        {/* 1. Delivery Address Card (Shopee Style - Images 1, 3, 4, 5) */}
        <section
          className="co26-shopee-address-box cursor-pointer hover:bg-slate-800/90 transition"
          onClick={() => setIsAddressModalOpen(true)}
          role="button"
          tabIndex={0}
        >
          <div className="co26-shopee-address-border-stripe" />
          <div className="co26-shopee-address-inner">
            <div className="flex items-start gap-3">
              <MapPin className="co26-shopee-address-icon text-[#fe6f05] shrink-0 mt-0.5" size={20} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wide">
                    {T.deliveryAddress}
                  </h2>
                  {viewModel?.needsShippingAddress === false && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {isIndo ? "⚡ Non-Fisik · Alamat Opsional" : "⚡ Digital/Service · Address Optional"}
                    </span>
                  )}
                </div>

                {activeAddress ? (
                  <div className="mt-1">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-100 flex-wrap">
                      <span>
                        {activeAddress.fullName ||
                          `${form?.firstName || ""} ${form?.lastName || ""}`.trim() ||
                          "Penerima"}
                      </span>
                      {(activeAddress.phoneNumber || form?.phone) && (
                        <span className="text-slate-400 font-normal">
                          ({activeAddress.phoneNumber || form?.phone})
                        </span>
                      )}
                      {activeAddress.isPrimary && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#fe6f05]/15 text-[#fe6f05] border border-[#fe6f05]/30">
                          {isIndo ? "Utama" : "Primary"}
                        </span>
                      )}
                      {activeAddress.markAs && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {activeAddress.markAs === "OFFICE"
                            ? isIndo
                              ? "Kantor"
                              : "Office"
                            : isIndo
                              ? "Rumah"
                              : "Home"}
                        </span>
                      )}
                    </div>
                    <p className="co26-shopee-address-desc text-xs sm:text-sm text-slate-300 mt-0.5 line-clamp-2">
                      {formattedAddressText}
                    </p>
                  </div>
                ) : viewModel?.needsShippingAddress === false ? (
                  <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
                    {isIndo
                      ? "Pesanan Anda berisi produk non-fisik (Digital/Layanan). Anda dapat melanjutkan checkout tanpa memilih alamat fisik."
                      : "Your order contains non-physical products (Digital/Service). Physical delivery address is optional."}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-[#fe6f05] font-semibold mt-1">
                    {T.noAddressChosen}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 self-center" />
            </div>
          </div>
        </section>

        {/* 2. Store Group Cards (Shopee Style - Images 1 & 4) */}
        <div className="space-y-3.5 mt-3.5">
          {safeGroups.map((group) => {
            if (!group) return null;
            const storeKey = String(group.storeId || "");
            const appliedVoucher =
              safeAppliedStoreCoupons[storeKey] ||
              (group.key && safeAppliedStoreCoupons[group.key]) ||
              (group.storeSlug && safeAppliedStoreCoupons[`slug:${group.storeSlug}`]) ||
              (group.storeId && safeAppliedStoreCoupons[`id:${group.storeId}`]) ||
              null;

            const groupItems = Array.isArray(group.items) ? group.items : [];
            const groupSubtotal = groupItems.reduce(
              (acc, it) => acc + (Number(it?.unitPrice) || 0) * (Number(it?.quantity) || 1),
              0
            );

            // Compute dynamic store saving
            let storeDiscountAmount = appliedVoucher?.discountAmount || 0;
            if (appliedVoucher) {
              const discountType = String(appliedVoucher.discountType || "").toLowerCase();
              const val = Number(appliedVoucher.discountValue ?? appliedVoucher.amount ?? 0);
              if (discountType === "percent" || discountType === "percentage") {
                storeDiscountAmount = Math.round((groupSubtotal * val) / 100);
                const maxDiscount = Number(appliedVoucher.maxDiscount);
                if (Number.isFinite(maxDiscount) && maxDiscount > 0) {
                  storeDiscountAmount = Math.min(storeDiscountAmount, maxDiscount);
                }
              } else {
                storeDiscountAmount = Number(
                  appliedVoucher.discountAmount ??
                    appliedVoucher.discountValue ??
                    appliedVoucher.amount ??
                    0
                );
              }
              storeDiscountAmount = Math.min(groupSubtotal, Math.max(0, storeDiscountAmount));
            }

            const currentSellerNote = safeSellerNotes[storeKey] || "";
            const currentShippingSelection =
              selectedStoreShipping?.[storeKey] ||
              group.defaultShippingOption || {
                courierCode: group.courierCode || "JNE",
                courierName: group.courierCode ? `${group.courierCode} Express` : "JNE Express",
                serviceCode: group.courierService || "REG",
                serviceName: group.courierService ? `Reguler (${group.courierService})` : "Reguler (REG)",
                shippingFee: Number(group.shipping ?? 10000),
                estimate: "2 - 3 Hari",
                estimateEn: "2 - 3 Business Days",
              };
            const packageWeight = Number(group.totalPackageWeightKg || currentShippingSelection?.totalWeight || 1);
            const totalWeightGrams = Number(group.totalPackageWeightGrams || (packageWeight * 1000));
            const groupShippingFee = Number(
              currentShippingSelection?.shippingFee ?? group.shipping ?? 10000
            );

            return (
              <article key={storeKey} className="co26-shopee-store-card">
                {/* Store Header */}
                <div className="co26-shopee-store-header">
                  <span className="co26-shopee-store-badge">STAR+</span>
                  <Link
                    to={group.storeSlug ? `/store/${group.storeSlug}` : "#"}
                    className="co26-shopee-store-name hover:text-[#fe6f05] transition"
                  >
                    <span>{group.storeName || "Store"}</span>
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  </Link>
                </div>

                {/* Products List in this Store */}
                <div className="co26-shopee-product-list">
                  {groupItems.map((item) => (
                    <div key={item?.lineId || item?.cartItemId || item?.productId || Math.random()} className="co26-shopee-product-item">
                      <div className="co26-shopee-product-thumb">
                        {item?.image ? (
                          <img
                            src={item.image}
                            alt={item.name || "Product"}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-slate-500 m-auto" />
                        )}
                      </div>

                      <div className="co26-shopee-product-info">
                        <h3 className="co26-shopee-product-title">{item?.name || "Product"}</h3>

                        {/* Product Type Badge */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {item?.productType === "service" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Briefcase size={10} />
                              <span>{isIndo ? "Layanan / Jasa" : "Service"}</span>
                              {item.serviceDeliveryType && (
                                <span className="opacity-75 font-normal">
                                  ({item.serviceDeliveryType === "onsite" ? "On-Site" : "Online"})
                                </span>
                              )}
                            </span>
                          ) : item?.productType === "digital" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                              <Download size={10} />
                              <span>{isIndo ? "Produk Digital" : "Digital"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              <Package size={10} />
                              <span>{isIndo ? "Fisik" : "Physical"}</span>
                            </span>
                          )}
                        </div>

                        {Array.isArray(item?.variantSelections) && item.variantSelections.length > 0 && (
                          <div className="co26-shopee-variant-pill">
                            {item.variantSelections
                              .map((s) =>
                                s && typeof s === "object"
                                  ? `${s.name || s.attributeName || "Opsi"}: ${s.value ?? s.valueName ?? ""}`
                                  : String(s || "")
                              )
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}

                        <div className="co26-shopee-product-price-row">
                          <span className="co26-shopee-product-price">
                            {formatMoney(item?.unitPrice || 0)}
                          </span>
                          <span className="co26-shopee-product-qty">x{item?.quantity || 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Voucher Toko Row */}
                <div
                  className="co26-shopee-row-interactive"
                  onClick={() => setVoucherModalStore(group)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[#fe6f05]" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">
                      {T.storeVoucher}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto text-xs text-slate-400">
                    {appliedVoucher ? (
                      <div className="flex items-center gap-1.5">
                        <span className="co26-shopee-voucher-badge">
                          {appliedVoucher.code}
                        </span>
                        <span className="text-[#fe6f05] font-bold">
                          -{formatMoney(storeDiscountAmount)}
                        </span>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span>{T.useVoucher}</span>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pesan untuk Penjual (Note to Seller) */}
                <div className="co26-shopee-row-note">
                  <div className="flex items-center gap-2 shrink-0">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-300">
                      {T.messageForSeller}
                    </span>
                  </div>
                  <input
                    type="text"
                    className="co26-shopee-note-input"
                    placeholder={T.messagePlaceholder}
                    value={currentSellerNote}
                    onChange={(e) => onSellerNoteChange?.(storeKey, e.target.value)}
                  />
                </div>

                {/* Opsi Pengiriman Adaptif per Toko */}
                {group.isStoreDigital ? (
                  <div className="co26-shopee-shipping-section">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
                      <span className="text-xs font-bold text-slate-300">
                        {isIndo ? "Akses Produk Digital" : "Digital Asset Delivery"}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {isIndo ? "⚡ Akses Instan" : "⚡ Instant"}
                      </span>
                    </div>

                    <div className="co26-shopee-shipping-box bg-slate-800/40 border-slate-700/60">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <Download className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <strong className="text-xs sm:text-sm text-cyan-300 font-bold block">
                              {isIndo ? "Akses Berkas Digital Langsung" : "Direct Digital Access"}
                            </strong>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {isIndo
                                ? "Tautan download dan kunci lisensi tersedia otomatis setelah pembayaran lunas."
                                : "Download link and access instructions will be available immediately after payment."}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-emerald-400 block">
                            {isIndo ? "Bebas Ongkir" : "Free"}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Rp 0
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : group.isStoreService ? (
                  <div className="co26-shopee-shipping-section">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
                      <span className="text-xs font-bold text-slate-300">
                        {isIndo ? "Metode Pemenuhan Layanan" : "Service Fulfillment"}
                      </span>
                      <span className="text-xs font-bold text-amber-400">
                        {isIndo ? "🛠️ Tanpa Kurir Fisik" : "🛠️ No Courier Needed"}
                      </span>
                    </div>

                    <div className="co26-shopee-shipping-box bg-slate-800/40 border-slate-700/60">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <Briefcase className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <strong className="text-xs sm:text-sm text-amber-300 font-bold block">
                              {isIndo ? "Koordinasi Langsung via WhatsApp Toko" : "Direct WhatsApp Coordination"}
                            </strong>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {isIndo
                                ? "Penyedia jasa akan mengonfirmasi jadwal & instruksi brief melalui chat setelah pembayaran lunas."
                                : "Service provider will coordinate schedule and brief instructions via chat after payment."}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-emerald-400 block">
                            {isIndo ? "Bebas Ongkir" : "Free"}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Rp 0
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="co26-shopee-shipping-section">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">
                          {T.shippingOption}
                        </span>
                        {(group.hasDigitalItems || group.hasServiceItems) && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            {isIndo ? "Khusus Barang Fisik" : "Physical Goods Only"}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShippingModalStore(group)}
                        className="text-xs font-bold text-[#fe6f05] hover:underline flex items-center gap-1 transition"
                      >
                        <span>{T.change}</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <div
                      className="co26-shopee-shipping-box cursor-pointer hover:border-[#fe6f05]/50 transition"
                      onClick={() => setShippingModalStore(group)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <Truck className="w-4 h-4 text-[#fe6f05] shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#034c85]/40 text-blue-200 border border-[#034c85]">
                                {currentShippingSelection?.courierName || currentShippingSelection?.courierCode || "JNE"}
                              </span>
                              <strong className="text-xs sm:text-sm text-slate-100 font-bold truncate">
                                {currentShippingSelection?.serviceName || currentShippingSelection?.serviceCode || "Reguler (REG)"}
                              </strong>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                              <span>
                                {isIndo
                                  ? (currentShippingSelection?.estimate ? `Estimasi: ${currentShippingSelection.estimate}` : T.shippingEstimate)
                                  : (currentShippingSelection?.estimateEn ? `Est: ${currentShippingSelection.estimateEn}` : T.shippingEstimate)}
                              </span>
                              <span>•</span>
                              <span className="text-slate-300 font-medium">
                                ⚖ {packageWeight} kg
                              </span>
                            </div>
                            {(group.hasDigitalItems || group.hasServiceItems) && (
                              <p className="text-[10px] text-blue-300/80 mt-1">
                                {isIndo
                                  ? "📦 Berat paket dihitung hanya dari produk fisik toko ini. Produk digital & jasa bebas ongkir."
                                  : "📦 Package weight only calculates physical products. Digital & services are freight-free."}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-100 block">
                            {groupShippingFee > 0 ? formatMoney(groupShippingFee) : T.freeShipping}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {T.shippingAuto}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Store Subtotal Footer */}
                <div className="co26-shopee-store-footer">
                  <span className="text-xs text-slate-400">
                    {typeof T?.totalProductCount === "function"
                      ? T.totalProductCount(groupItems.length)
                      : `Total ${groupItems.length} Produk:`}
                  </span>
                  <strong className="text-sm font-bold text-[#fe6f05]">
                    {formatMoney(Math.max(0, groupSubtotal + groupShippingFee - storeDiscountAmount))}
                  </strong>
                </div>
              </article>
            );
          })}
        </div>

        {/* 3. Global Platform Voucher Row (Shopee Style - Images 3 & 5) */}
        <section
          className="co26-shopee-platform-voucher cursor-pointer hover:bg-slate-800/90 transition mt-3.5"
          onClick={() => setIsPlatformVoucherModalOpen(true)}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[#fe6f05]" />
            <span className="text-xs sm:text-sm font-bold text-slate-200">
              {T.platformVoucher}
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto text-xs text-slate-400">
            {appliedPlatformCoupon ? (
              <div className="flex items-center gap-2">
                <span className="co26-shopee-voucher-badge">
                  {appliedPlatformCoupon.code}
                </span>
                <span className="text-[#fe6f05] font-bold">
                  -{formatMoney(platformDiscount)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePlatformCoupon?.();
                  }}
                  className="co26-shopee-remove-icon-btn"
                  aria-label="Remove platform voucher"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span>{T.usePlatformVoucher}</span>
                <ChevronRight size={14} className="text-slate-400" />
              </div>
            )}
          </div>
        </section>

        {/* 4. Payment Method Section (Shopee Style - Images 3 & 5) */}
        <section id="checkout-payment-section" className="co26-shopee-card mt-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#fe6f05]" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-200">
                {T.paymentMethod}
              </h2>
            </div>
            {!form?.duitkuPaymentMethod && form?.paymentOptionId === "duitku" && (
              <span className="text-[11px] font-semibold text-[#fe6f05] bg-[#fe6f05]/10 border border-[#fe6f05]/30 px-2.5 py-0.5 rounded-full">
                {isIndo ? "Pilih saluran pembayaran" : "Choose channel"}
              </span>
            )}
          </div>

          <div className="space-y-2 mt-3">
            {form?.paymentOptions?.map((opt) => {
              const isSelected = form?.paymentOptionId === opt.id;
              return (
                <div
                  key={opt.id}
                  className={`co26-shopee-payment-option ${isSelected ? "is-selected" : ""}`}
                  onClick={() => form?.setPaymentOptionId?.(opt.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3">
                    <span className={`co26-radio-dot ${isSelected ? "is-checked" : ""}`}>
                      {isSelected && <span className="co26-radio-inner" />}
                    </span>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-100 block">
                        {opt.id === "duitku" ? "Duitku POP (Instant VA, E-Wallet, QRIS)" : opt.title}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* If Duitku selected, display channel options */}
            {form?.paymentOptionId === "duitku" && Array.isArray(form?.duitkuPaymentMethods) && (
              <div
                className={`co26-shopee-channel-box mt-3 p-3 rounded-xl bg-slate-900/60 border transition-all duration-200 ${
                  !form?.duitkuPaymentMethod &&
                  status?.error &&
                  (status.error.includes("saluran pembayaran") || status.error.includes("payment channel"))
                    ? "border-[#fe6f05] ring-2 ring-[#fe6f05]/40"
                    : "border-slate-700/60"
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-bold text-slate-300">
                    {T.chooseChannel}:
                  </p>
                  <span className="text-[11px] font-medium text-slate-400">
                    {form?.duitkuPaymentMethod
                      ? form.duitkuPaymentMethods.find((m) => m.code === form.duitkuPaymentMethod)?.label || ""
                      : (isIndo ? "Belum ada yang dipilih" : "None selected")}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {form.duitkuPaymentMethods.map((method) => {
                    const isMethodSelected = form?.duitkuPaymentMethod === method.code;
                    const brand = DUITKU_CHANNEL_BRANDS[method.code] || {
                      mark: method.code,
                      tone: "default",
                    };

                    return (
                      <button
                        key={method.code}
                        type="button"
                        onClick={() => form?.setDuitkuPaymentMethod?.(method.code)}
                        className={`co26-shopee-channel-btn ${isMethodSelected ? "is-selected" : ""}`}
                      >
                        <span className={`co26-duitku-tag tone-${brand.tone}`}>
                          {brand.mark}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {method.label}
                        </span>
                        {isMethodSelected && (
                          <Check size={14} className="text-[#fe6f05] ml-auto shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 5. Rincian Pembayaran (Payment Details Summary - Images 3 & 5) */}
        <section className="co26-shopee-card mt-3.5 mb-24">
          <h2 className="text-xs sm:text-sm font-bold text-slate-200 pb-2.5 border-b border-slate-700/50">
            {T.orderSummary}
          </h2>

          <div className="space-y-2 mt-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between text-slate-300">
              <span>{T.orderSubtotal}</span>
              <span className="font-semibold">{formatMoney(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span>{T.shippingSubtotal}</span>
              <span className="font-semibold">{formatMoney(shipping)}</span>
            </div>

            {totalStoreDiscount > 0 && (
              <div className="flex items-center justify-between text-[#fe6f05]">
                <span>{T.storeDiscount}</span>
                <span className="font-bold">-{formatMoney(totalStoreDiscount)}</span>
              </div>
            )}

            {platformDiscount > 0 && (
              <div className="flex items-center justify-between text-[#fe6f05]">
                <span>{T.platformDiscount}</span>
                <span className="font-bold">-{formatMoney(platformDiscount)}</span>
              </div>
            )}

            <div className="h-[1px] bg-slate-700/50 my-2" />

            <div className="flex items-center justify-between text-slate-100 font-bold text-sm sm:text-base">
              <span>{T.totalPayment}</span>
              <span className="text-[#fe6f05] font-black">{formatMoney(grandTotal)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* 6. Sticky Checkout Bottom Bar (Shopee Style - Images 1, 3, 4, 5) */}
      <div className="co26-shopee-bottom-bar">
        <div className="co26-shopee-bottom-bar-inner">
          <div className="co26-shopee-bottom-total-box">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-slate-300 font-semibold">Total:</span>
              <strong className="text-base sm:text-lg font-black text-[#fe6f05]">
                {formatMoney(grandTotal)}
              </strong>
            </div>
            {totalDiscount > 0 && (
              <span className="co26-shopee-bottom-savings text-[11px] text-slate-400">
                {T.savedHint} {formatMoney(totalDiscount)}
              </span>
            )}
          </div>

          <div className="flex flex-col items-end">
            <button
              type="button"
              className="co26-shopee-btn-submit"
              onClick={onSubmit}
              disabled={busy || status?.submitDisabled}
              title={
                status?.submitMessage ||
                (status?.submitDisabled
                  ? isIndo
                    ? "Lengkapi saluran pembayaran dan alamat pengiriman untuk memesan"
                    : "Complete payment channel and delivery address to place order"
                  : "")
              }
            >
              {busy ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span>{T.placingOrder}</span>
                </div>
              ) : (
                <span>{T.placeOrder}</span>
              )}
            </button>
            {status?.submitDisabled && status?.submitMessage && !busy && (
              <span className="text-[11px] text-amber-400 font-medium mt-1 max-w-[220px] text-right line-clamp-1">
                {status.submitMessage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Address Selection Modal ("Pilih Alamat" - Image 2) */}
      <CheckoutAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={safeSavedAddresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={onSelectAddress}
        onSaveNewAddress={onSaveNewAddress}
        onUpdateAddress={onUpdateAddress}
        isIndo={isIndo}
      />

      {/* Store Voucher Modal */}
      {voucherModalStore && (
        <StoreCartVoucherModal
          isOpen={Boolean(voucherModalStore)}
          onClose={() => setVoucherModalStore(null)}
          store={voucherModalStore}
          storeSubtotal={(Array.isArray(voucherModalStore?.items) ? voucherModalStore.items : []).reduce(
            (acc, it) => acc + (Number(it?.unitPrice) || 0) * (Number(it?.quantity) || 1),
            0
          )}
          appliedCoupon={
            (voucherModalStore?.key && safeAppliedStoreCoupons[voucherModalStore.key]) ||
            safeAppliedStoreCoupons[String(voucherModalStore?.storeId || "")] ||
            (voucherModalStore?.storeSlug &&
              safeAppliedStoreCoupons[`slug:${voucherModalStore.storeSlug}`]) ||
            (voucherModalStore?.storeId &&
              safeAppliedStoreCoupons[`id:${voucherModalStore.storeId}`]) ||
            null
          }
          onApplyCoupon={(couponData) => {
            onApplyStoreCoupon?.(voucherModalStore, couponData);
            setVoucherModalStore(null);
          }}
          onRemoveCoupon={() => {
            onRemoveStoreCoupon?.(voucherModalStore);
            setVoucherModalStore(null);
          }}
          isIndo={isIndo}
          formatMoney={formatMoney}
        />
      )}

      {/* Platform Voucher Modal */}
      <StoreCartPlatformVoucherModal
        isOpen={isPlatformVoucherModalOpen}
        onClose={() => setIsPlatformVoucherModalOpen(false)}
        cartSubtotal={subtotal}
        appliedCoupon={appliedPlatformCoupon}
        onApplyCoupon={(couponData) => {
          onApplyPlatformCoupon?.(couponData);
          setIsPlatformVoucherModalOpen(false);
        }}
        onRemoveCoupon={() => {
          onRemovePlatformCoupon?.();
          setIsPlatformVoucherModalOpen(false);
        }}
        isIndo={isIndo}
        formatMoney={formatMoney}
      />

      {/* Shipping Option Modal */}
      {shippingModalStore && (
        <CheckoutShippingModal
          isOpen={Boolean(shippingModalStore)}
          onClose={() => setShippingModalStore(null)}
          store={shippingModalStore}
          destination={{
            city: activeAddress?.city || form?.shipping?.city,
            province: activeAddress?.province || form?.shipping?.province,
            district: activeAddress?.district || form?.shipping?.district,
            lat: activeAddress?.lat ?? activeAddress?.latitude ?? form?.shipping?.lat ?? form?.shipping?.latitude,
            lng: activeAddress?.lng ?? activeAddress?.longitude ?? form?.shipping?.lng ?? form?.shipping?.longitude,
          }}
          selectedShippingOption={
            selectedStoreShipping?.[String(shippingModalStore?.storeId)] ||
            shippingModalStore?.defaultShippingOption
          }
          availableShippingRates={shippingModalStore?.availableShippingRates}
          packageWeightKg={shippingModalStore?.totalPackageWeightKg}
          totalWeightGrams={shippingModalStore?.totalPackageWeightGrams}
          onSelectShipping={(chosen) => {
            onSelectStoreShipping?.(shippingModalStore?.storeId, chosen);
          }}
          isIndo={isIndo}
          formatMoney={formatMoney}
        />
      )}
    </main>
  );
}
