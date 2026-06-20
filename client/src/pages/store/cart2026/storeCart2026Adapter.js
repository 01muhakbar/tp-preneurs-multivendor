const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" rx="24" fill="#eef5fb"/><path d="M52 64h76l-8 69H60z" fill="#fff" stroke="#7fa7c7" stroke-width="6"/><path d="M70 69c0-25 40-25 40 0" fill="none" stroke="#034c85" stroke-width="7" stroke-linecap="round"/><path d="M73 102c10 9 24 9 34 0" fill="none" stroke="#fe6f05" stroke-width="6" stroke-linecap="round"/></svg>`);

const array = (value) => (Array.isArray(value) ? value : []);
const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");
const numberOr = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function normalizeSelections(value) {
  return array(value).map((selection) => ({
    ...selection,
    attributeName: first(selection?.attributeName, selection?.name, selection?.label, "Option"),
    value: first(selection?.value, selection?.valueName, selection?.option, ""),
  }));
}

function normalizeItem(item, index) {
  const product = item?.product && typeof item.product === "object" ? item.product : {};
  const store = first(item?.store, product?.store, {}) || {};
  const productId = first(item?.productId, item?.id, product?.id, null);
  const variantKey = first(item?.variantKey, item?.variant?.key, null);
  const quantity = Math.max(1, numberOr(first(item?.quantity, item?.qty, item?.count), 1));
  const unitPrice = Math.max(0, numberOr(first(item?.price, item?.unitPrice, item?.variantSalePrice, item?.variantPrice), 0));
  const storeId = first(item?.storeId, store?.id, product?.storeId, null);
  const storeName = first(item?.storeName, store?.name, product?.storeName, "Marketplace Store");

  return {
    raw: item,
    cartItemId: first(item?.cartItemId, item?.CartItem?.id, null),
    lineId: first(item?.lineId, `${productId || "product"}:${variantKey || `base-${index}`}`),
    productId,
    storeId,
    storeName,
    storeSlug: first(item?.storeSlug, store?.slug, product?.storeSlug, null),
    storeCategory: first(item?.storeCategory, store?.categoryName, item?.category?.name, product?.category?.name, "Products"),
    storeVerified: first(item?.storeVerified, store?.verified, store?.isVerified, false) === true,
    name: first(item?.name, item?.productName, product?.name, "Product"),
    badge: first(item?.badge, item?.category?.name, product?.category?.name, "Store favorite"),
    image: first(item?.variantImage, item?.image, item?.imageUrl, item?.thumbnail, item?.productImage, product?.imageUrl, FALLBACK_PRODUCT_IMAGE),
    variantKey,
    variantLabel: first(item?.variantLabel, item?.variant?.label, null),
    variantSelections: normalizeSelections(item?.variantSelections),
    variantSku: first(item?.variantSku, item?.sku, null),
    variantBarcode: first(item?.variantBarcode, item?.barcode, null),
    variantPrice: first(item?.variantPrice, null),
    variantSalePrice: first(item?.variantSalePrice, null),
    quantity,
    stock: first(item?.stock, item?.availableStock, null),
    unitPrice,
    lineTotal: unitPrice * quantity,
  };
}

export function createStoreCart2026ViewModel({ cartItems, cart } = {}) {
  const items = array(cartItems).map(normalizeItem);
  const groupsByStore = new Map();

  items.forEach((item) => {
    const key = item.storeId != null ? `id:${item.storeId}` : `name:${String(item.storeName).toLowerCase()}`;
    if (!groupsByStore.has(key)) {
      groupsByStore.set(key, {
        key,
        storeId: item.storeId,
        storeName: item.storeName,
        storeSlug: item.storeSlug,
        category: item.storeCategory,
        verified: item.storeVerified,
        items: [],
      });
    }
    groupsByStore.get(key).items.push(item);
  });

  const calculatedSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const providedSubtotal = first(cart?.subtotal, cart?.subtotalAmount, cart?.estimatedSubtotal, null);
  const subtotal = providedSubtotal === null ? calculatedSubtotal : numberOr(providedSubtotal, calculatedSubtotal);

  return {
    groups: Array.from(groupsByStore.values()),
    items,
    lineCount: items.length,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    estimatedTotal: subtotal,
    discount: numberOr(first(cart?.discount, cart?.discountAmount, 0), 0),
    isEmpty: items.length === 0,
  };
}

export { FALLBACK_PRODUCT_IMAGE };
