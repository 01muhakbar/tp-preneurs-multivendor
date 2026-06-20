const asArray = (value) => (Array.isArray(value) ? value : []);

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const normalizeSelections = (value) =>
  asArray(value).map((selection) => ({
    ...selection,
    name: firstDefined(selection?.name, selection?.attributeName, selection?.label, "Option"),
    value: firstDefined(selection?.value, selection?.valueName, selection?.option, ""),
  }));

const normalizeItem = (item, group = null) => {
  const quantity = Math.max(1, Number(firstDefined(item?.qty, item?.quantity, 1)) || 1);
  const unitPrice = firstDefined(item?.price, item?.unitPrice, item?.salePrice, null);
  const lineTotal = firstDefined(item?.lineTotal, item?.totalAmount, item?.subtotal, null);
  const variantSelections = normalizeSelections(item?.variantSelections);

  return {
    raw: item,
    lineId: firstDefined(item?.lineId, item?.cartItemId, `${group?.storeId || "store"}-${item?.productId || item?.id || "item"}-${item?.variantKey || "base"}`),
    cartItemId: firstDefined(item?.cartItemId, null),
    productId: firstDefined(item?.productId, item?.id, null),
    storeId: firstDefined(item?.storeId, group?.storeId, null),
    variantKey: firstDefined(item?.variantKey, null),
    variantSelections,
    variantLabel: firstDefined(item?.variantLabel, item?.variantName, null),
    name: firstDefined(item?.productName, item?.name, "Product"),
    image: firstDefined(item?.image, item?.imageUrl, item?.thumbnail, null),
    quantity,
    unitPrice,
    lineTotal,
    stock: firstDefined(item?.stock, null),
    subtitle: firstDefined(item?.variantLabel, item?.variantName, item?.category?.name, null),
  };
};

const normalizeGroup = (group, index) => ({
  raw: group,
  storeId: firstDefined(group?.storeId, group?.store?.id, `store-${index + 1}`),
  storeSlug: firstDefined(group?.storeSlug, group?.store?.slug, null),
  storeName: firstDefined(group?.storeName, group?.store?.name, `Store ${index + 1}`),
  badge: firstDefined(group?.storeBadge, group?.badge, "Verified store"),
  shippingNote: firstDefined(group?.shippingNote, group?.deliveryNote, group?.warning, null),
  paymentReady: group?.paymentAvailable === true || group?.paymentReady === true,
  paymentStatus: firstDefined(
    group?.paymentProfileStatus,
    group?.paymentAvailabilityMeta?.status,
    group?.paymentStatus,
    null
  ),
  subtotal: firstDefined(group?.subtotalAmount, group?.subtotal, null),
  shipping: firstDefined(group?.shippingAmount, group?.shipping, null),
  total: firstDefined(group?.totalAmount, group?.total, null),
  couponState: firstDefined(group?.couponState, group?.coupon, null),
  items: asArray(group?.items).map((item) => normalizeItem(item, group)),
});

const findInvalidItem = (invalidItems, item) =>
  invalidItems.find((invalid) => {
    if (invalid?.cartItemId && item?.cartItemId) {
      return String(invalid.cartItemId) === String(item.cartItemId);
    }
    if (String(invalid?.productId || "") !== String(item?.productId || "")) return false;
    if (invalid?.variantKey && item?.variantKey) {
      return String(invalid.variantKey) === String(item.variantKey);
    }
    return true;
  }) || null;

export function createCheckout2026ViewModel({ preview, cartItems, couponCode } = {}) {
  const source = preview && typeof preview === "object" ? preview : {};
  const rawGroups = firstDefined(source.groups, source.storeGroups, source.groupedItems, []);
  const invalidItems = asArray(source.invalidItems);
  const groups = asArray(rawGroups).map(normalizeGroup);
  const normalizedCartItems = asArray(cartItems).map((item) => normalizeItem(item));
  const summary = source.summary && typeof source.summary === "object" ? source.summary : {};

  groups.forEach((group) => {
    group.items = group.items.map((item) => ({
      ...item,
      invalidItem: findInvalidItem(invalidItems, item),
    }));
  });

  return {
    checkoutMode: firstDefined(source.checkoutMode, "SINGLE_STORE"),
    previewReady: source.previewReady === true,
    previewLoading: source.previewLoading === true,
    previewError: source.previewError || null,
    paymentReady: source.paymentReady === true,
    couponCode: String(couponCode || ""),
    couponState: firstDefined(source.couponState, null),
    invalidItems,
    groups,
    cartItems: normalizedCartItems,
    itemCount: firstDefined(summary.totalItems, source.totalItems, normalizedCartItems.reduce((sum, item) => sum + item.quantity, 0)),
    amounts: {
      subtotal: firstDefined(summary.subtotalAmount, summary.subtotal, source.subtotalAmount, null),
      shipping: firstDefined(summary.shippingAmount, summary.shipping, source.shippingAmount, null),
      discount: firstDefined(summary.discountAmount, summary.discount, source.discountAmount, null),
      tax: firstDefined(summary.taxAmount, summary.tax, source.taxAmount, null),
      total: firstDefined(summary.grandTotal, summary.total, source.grandTotal, null),
    },
  };
}

