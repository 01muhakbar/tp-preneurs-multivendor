import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { FALLBACK_PRODUCT_IMAGE } from "./storeCart2026Adapter.js";
import "./store-cart-2026.css";

function formatVariant(item) {
  const selectionText = (item.variantSelections || [])
    .map((selection) => `${selection.attributeName || "Varian"}: ${selection.value}`)
    .filter(Boolean);
  return [item.variantLabel, ...selectionText].filter(Boolean);
}

function EmptyCart({ onContinueShopping, isIndo }) {
  return (
    <div className="sc26-shopee-empty">
      <div className="sc26-shopee-empty__icon">
        <ShoppingBag className="w-12 h-12 text-slate-500" />
      </div>
      <h2 className="sc26-shopee-empty__title">
        {isIndo ? "Keranjang Anda Kosong" : "Your Cart is Empty"}
      </h2>
      <p className="sc26-shopee-empty__desc">
        {isIndo
          ? "Mari temukan produk & karya edupreneur kampus pilihan Anda!"
          : "Discover campus innovations and add them to your cart!"}
      </p>
      <button
        type="button"
        onClick={onContinueShopping}
        className="sc26-shopee-btn-primary"
      >
        <span>{isIndo ? "Mulai Belanja" : "Start Shopping"}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="sc26-shopee-skeleton">
      <div className="sc26-shopee-skeleton__head" />
      <div className="sc26-shopee-skeleton__card" />
      <div className="sc26-shopee-skeleton__card" />
    </div>
  );
}

export default function StoreCart2026View({
  viewModel,
  isIndo,
  status,
  formatMoney,
  selectedLineIds = new Set(),
  selectedCount = 0,
  selectedSubtotal = 0,
  totalStoreDiscount = 0,
  selectedFinalTotal = null,
  appliedStoreCoupons = {},
  onOpenStoreVoucher,
  onRemoveStoreVoucher,
  isEditMode = false,
  onToggleEditMode,
  onToggleSelect,
  onToggleStore,
  onToggleAll,
  onBatchRemove,
  onBatchWishlist,
  getInvalidItem,
  canReselect,
  onIncrease,
  onDecrease,
  onRemove,
  onReselect,
  onRetry,
  onReviewIssues,
  onCheckout,
  onContinueShopping,
}) {
  const navigate = useNavigate();
  const allSelected =
    viewModel.items.length > 0 && selectedLineIds.size === viewModel.items.length;

  if (status.loading) {
    return (
      <main className="sc26-shopee-page">
        <div className="sc26-shopee-container">
          <CartSkeleton />
        </div>
      </main>
    );
  }

  if (status.fatalError) {
    return (
      <main className="sc26-shopee-page">
        <div className="sc26-shopee-container">
          <div className="sc26-shopee-empty sc26-shopee-empty--error">
            <AlertTriangle className="w-12 h-12 text-[#fe6f05]" />
            <h2>{isIndo ? "Gagal memuat keranjang" : "Failed to load cart"}</h2>
            <p>{status.errorMessage}</p>
            <button
              type="button"
              onClick={onRetry}
              className="sc26-shopee-btn-primary"
            >
              {isIndo ? "Coba Lagi" : "Try Again"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (viewModel.isEmpty) {
    return (
      <main className="sc26-shopee-page">
        <div className="sc26-shopee-container">
          <EmptyCart onContinueShopping={onContinueShopping} isIndo={isIndo} />
        </div>
      </main>
    );
  }

  return (
    <main className="sc26-shopee-page">
      <div className="sc26-shopee-container">
        {/* Top Shopee Header Bar */}
        <header className="sc26-shopee-header">
          <div className="sc26-shopee-header__left">
            <button
              type="button"
              className="sc26-shopee-header__back"
              onClick={() => navigate(-1)}
              aria-label={isIndo ? "Kembali" : "Back"}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="sc26-shopee-header__title">
              {isIndo ? "Keranjang Saya" : "My Cart"}
              <span className="sc26-shopee-header__count">({viewModel.itemCount})</span>
            </h1>
          </div>

          <button
            type="button"
            className="sc26-shopee-header__edit-btn"
            onClick={onToggleEditMode}
          >
            {isEditMode ? (isIndo ? "Selesai" : "Done") : (isIndo ? "Ubah" : "Edit")}
          </button>
        </header>

        {/* Inline Alerts */}
        {status.inlineError && (
          <div className="sc26-shopee-alert sc26-shopee-alert--error">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p>{status.errorMessage}</p>
            <button type="button" onClick={onRetry}>
              {isIndo ? "Coba Lagi" : "Retry"}
            </button>
          </div>
        )}

        {status.hasInvalidItems && (
          <div className="sc26-shopee-alert sc26-shopee-alert--warning">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p>{isIndo ? "Beberapa produk memerlukan penyesuaian sebelum checkout." : "Some cart items need attention before checkout."}</p>
            <button type="button" onClick={onReviewIssues}>
              {isIndo ? "Tinjau" : "Review"}
            </button>
          </div>
        )}

        {/* Store Groups */}
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
                  <label className="sc26-shopee-checkbox-label">
                    <input
                      type="checkbox"
                      checked={isStoreSelected}
                      onChange={() => onToggleStore(storeLineIds)}
                      className="sc26-shopee-checkbox"
                    />
                    <span className="sc26-shopee-checkbox-custom">
                      {isStoreSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </label>

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
                      className="sc26-shopee-store-name"
                      title={isIndo ? `Kunjungi Toko ${group.storeName}` : `Visit ${group.storeName}`}
                    >
                      <span>{group.storeName}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Items in Store */}
                <div className="sc26-shopee-items-list">
                  {group.items.map((item) => {
                    const isSelected = selectedLineIds.has(item.lineId);
                    const invalidItem = getInvalidItem(item);
                    const variantLines = formatVariant(item);

                    return (
                      <div
                        key={item.lineId}
                        className={`sc26-shopee-item-row ${invalidItem ? "is-invalid" : ""}`}
                        data-cart-page-invalid-item={invalidItem ? "true" : undefined}
                      >
                        {/* Item Checkbox */}
                        <label className="sc26-shopee-checkbox-label">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelect(item.lineId)}
                            className="sc26-shopee-checkbox"
                          />
                          <span className="sc26-shopee-checkbox-custom">
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </span>
                        </label>

                        {/* Product Thumbnail with Low Stock Tag */}
                        <div className="sc26-shopee-item-thumb-wrap">
                          <img
                            src={item.image}
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                            }}
                            alt={item.name}
                            className="sc26-shopee-item-thumb"
                          />
                          {item.stock !== null && item.stock !== undefined && item.stock <= 5 && item.stock > 0 && (
                            <span className="sc26-shopee-item-stock-tag">
                              {isIndo ? `Tersisa ${item.stock}` : `Only ${item.stock} left`}
                            </span>
                          )}
                        </div>

                        {/* Product Info & Stepper */}
                        <div className="sc26-shopee-item-details">
                          <Link
                            to={`/product/${item.productId}`}
                            className="sc26-shopee-item-title"
                          >
                            {item.name}
                          </Link>

                          {/* Variant Tag if exists */}
                          {variantLines.length > 0 && (
                            <div className="sc26-shopee-item-variants">
                              {variantLines.map((line, idx) => (
                                <span key={idx} className="sc26-shopee-variant-pill">
                                  {line}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Price & Quantity Stepper */}
                          <div className="sc26-shopee-item-bottom">
                            <span className="sc26-shopee-item-price">
                              {formatMoney(item.unitPrice)}
                            </span>

                            <div className="sc26-shopee-stepper">
                              <button
                                type="button"
                                className="sc26-shopee-step-btn"
                                onClick={() => onDecrease(item)}
                                disabled={item.quantity <= 1 || status.busy}
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="sc26-shopee-step-val">{item.quantity}</span>
                              <button
                                type="button"
                                className="sc26-shopee-step-btn"
                                onClick={() => onIncrease(item)}
                                disabled={
                                  (item.stock !== null &&
                                    item.stock !== undefined &&
                                    item.quantity >= item.stock) ||
                                  status.busy
                                }
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              className="sc26-shopee-item-trash"
                              onClick={() => onRemove(item)}
                              disabled={status.busy}
                              title={isIndo ? "Hapus" : "Remove"}
                              aria-label={isIndo ? "Hapus" : "Remove"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Invalid Item Alert Banner */}
                          {invalidItem && (
                            <div className="sc26-shopee-item-invalid-box">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span className="flex-1">{invalidItem.message}</span>
                              {canReselect(item, invalidItem) && (
                                <button
                                  type="button"
                                  onClick={() => onReselect(item, invalidItem)}
                                  className="sc26-shopee-btn-reselect"
                                >
                                  {isIndo ? "Pilih Ulang" : "Reselect"}
                                </button>
                              )}
                            </div>
                          )}
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
                        ? `Hemat ${formatMoney(appliedStoreCoupons[group.key].discountAmount)}`
                        : `Saved ${formatMoney(appliedStoreCoupons[group.key].discountAmount)}`}
                    </span>
                    <div className="sc26-shopee-voucher-actions ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        className="sc26-shopee-voucher-change-btn"
                        onClick={() => onOpenStoreVoucher?.(group)}
                      >
                        {isIndo ? "Ubah" : "Change"}
                      </button>
                      <button
                        type="button"
                        className="sc26-shopee-voucher-remove-btn"
                        onClick={() => onRemoveStoreVoucher?.(group.key)}
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
                    onClick={() => onOpenStoreVoucher?.(group)}
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

        {/* Shopee Sticky Bottom Bar */}
        <div className="sc26-shopee-sticky-bar">
          {/* Top row: Voucher code reminder */}
          <div className="sc26-shopee-sticky-voucher">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#fe6f05]" />
              <span>{isIndo ? "Voucher Diskon Toko" : "Store Discount Voucher"}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              {totalStoreDiscount > 0 ? (
                <span className="text-[#fe6f05] font-semibold">
                  {isIndo
                    ? `-Hemat ${formatMoney(totalStoreDiscount)}`
                    : `-Saved ${formatMoney(totalStoreDiscount)}`}
                </span>
              ) : (
                <span>{isIndo ? "Pilih voucher di toko" : "Select voucher in store"}</span>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="sc26-shopee-sticky-action-row">
            <label className="sc26-shopee-select-all">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="sc26-shopee-checkbox"
              />
              <span className="sc26-shopee-checkbox-custom">
                {allSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </span>
              <span className="sc26-shopee-select-all-text">
                {isIndo ? "Semua" : "All"}
              </span>
            </label>

            {!isEditMode ? (
              <>
                <div className="sc26-shopee-sticky-total-box">
                  <div className="sc26-shopee-total-row">
                    <span className="sc26-shopee-total-label">{isIndo ? "Total:" : "Total:"}</span>
                    <strong className="sc26-shopee-total-amount">
                      {formatMoney(selectedFinalTotal ?? selectedSubtotal)}
                    </strong>
                  </div>
                  {totalStoreDiscount > 0 && (
                    <span className="sc26-shopee-savings-hint">
                      {isIndo
                        ? `Hemat ${formatMoney(totalStoreDiscount)}`
                        : `Saved ${formatMoney(totalStoreDiscount)}`}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="sc26-shopee-btn-checkout"
                  onClick={onCheckout}
                  disabled={selectedCount === 0 || !status.canCheckout}
                >
                  <span>{isIndo ? `Checkout (${selectedCount})` : `Checkout (${selectedCount})`}</span>
                </button>
              </>
            ) : (
              <div className="sc26-shopee-sticky-edit-actions">
                <button
                  type="button"
                  className="sc26-shopee-btn-wishlist"
                  onClick={onBatchWishlist}
                  disabled={selectedCount === 0}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>{isIndo ? "Favoritkan" : "Wishlist"}</span>
                </button>

                <button
                  type="button"
                  className="sc26-shopee-btn-delete"
                  onClick={onBatchRemove}
                  disabled={selectedCount === 0}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isIndo ? `Hapus (${selectedCount})` : `Delete (${selectedCount})`}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
