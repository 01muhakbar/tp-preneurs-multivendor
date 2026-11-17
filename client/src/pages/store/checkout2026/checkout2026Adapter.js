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
  const rawProductType = String(firstDefined(item?.productType, item?.raw?.productType, "physical")).toLowerCase();
  const productType = ["physical", "digital", "service"].includes(rawProductType) ? rawProductType : "physical";
  const isPhysical = productType === "physical";
  const isDigital = productType === "digital";
  const isService = productType === "service";
  const isWeightless = isDigital || isService;

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
    weight: isWeightless ? 0 : firstDefined(item?.weight, item?.raw?.weight, 1000),
    lineWeight: isWeightless ? 0 : firstDefined(item?.lineWeight, item?.raw?.lineWeight, 1000),
    productType,
    isPhysical,
    isDigital,
    isService,
    isWeightless,
    serviceDeliveryType: firstDefined(item?.serviceDeliveryType, item?.raw?.serviceDeliveryType, "online"),
    serviceDuration: firstDefined(item?.serviceDuration, item?.raw?.serviceDuration, ""),
    serviceInstructions: firstDefined(item?.serviceInstructions, item?.raw?.serviceInstructions, ""),
    serviceContactWhatsapp: firstDefined(item?.serviceContactWhatsapp, item?.raw?.serviceContactWhatsapp, ""),
    digitalInstructions: firstDefined(item?.digitalInstructions, item?.raw?.digitalInstructions, ""),
  };
};

const normalizeGroup = (group, index) => {
  const items = asArray(group?.items).map((item) => normalizeItem(item, group));
  const hasPhysicalItems = items.some((it) => it.productType === "physical");
  const hasDigitalItems = items.some((it) => it.productType === "digital");
  const hasServiceItems = items.some((it) => it.productType === "service");
  const isStoreDigital = items.length > 0 && items.every((it) => it.productType === "digital");
  const isStoreService = items.length > 0 && items.every((it) => it.productType === "service");
  const isStoreNonPhysical = items.length > 0 && !hasPhysicalItems;

  return {
    raw: group,
    storeId: firstDefined(group?.storeId, group?.store?.id, `store-${index + 1}`),
    storeSlug: firstDefined(group?.storeSlug, group?.store?.slug, null),
    storeName: firstDefined(group?.storeName, group?.store?.name, `Store ${index + 1}`),
    city: firstDefined(group?.city, group?.store?.city, "Kota Makassar"),
    province: firstDefined(group?.province, group?.store?.province, "Sulawesi Selatan"),
    district: firstDefined(group?.district, group?.store?.district, "Rappocini"),
    lat: firstDefined(group?.lat, group?.store?.lat, null),
    lng: firstDefined(group?.lng, group?.store?.lng, null),
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
    courierCode: firstDefined(group?.courierCode, isStoreService ? "SERVICE" : isStoreDigital ? "DIGITAL" : "JNE"),
    courierService: firstDefined(group?.courierService, isStoreService ? "DIRECT" : isStoreDigital ? "INSTANT" : "REG"),
    totalPackageWeightKg: isStoreNonPhysical ? 0 : firstDefined(group?.totalPackageWeightKg, 1),
    totalPackageWeightGrams: isStoreNonPhysical ? 0 : firstDefined(group?.totalPackageWeightGrams, 1000),
    hasPhysicalItems,
    hasDigitalItems,
    hasServiceItems,
    isStoreDigital,
    isStoreService,
    isStoreNonPhysical,
    availableShippingRates: asArray(group?.availableShippingRates),
    defaultShippingOption: firstDefined(group?.defaultShippingOption, null),
    items,
  };
};

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

  const hasGroupsOrItems = groups.length > 0 || normalizedCartItems.length > 0;
  const allItems = groups.flatMap((g) => g.items).concat(normalizedCartItems);
  const hasPhysicalProducts = groups.some((group) => group.hasPhysicalItems) || allItems.some((it) => it.productType === "physical");
  const hasOnsiteServices = groups.some((group) =>
    group.items.some((it) => it.isService && it.serviceDeliveryType === "onsite")
  ) || allItems.some((it) => it.isService && it.serviceDeliveryType === "onsite");
  const hasDigitalProducts = groups.some((group) => group.hasDigitalItems) || allItems.some((it) => it.isDigital);
  const hasServiceProducts = groups.some((group) => group.hasServiceItems) || allItems.some((it) => it.isService);
  const needsShippingAddress = hasPhysicalProducts || hasOnsiteServices;

  return {
    checkoutMode: firstDefined(source.checkoutMode, "SINGLE_STORE"),
    previewReady: source.previewReady === true || hasGroupsOrItems,
    previewLoading: source.previewLoading === true,
    previewError: source.previewError || null,
    paymentReady: source.paymentReady === true,
    couponCode: String(couponCode || ""),
    couponState: firstDefined(source.couponState, null),
    invalidItems,
    groups,
    cartItems: normalizedCartItems,
    hasPhysicalProducts,
    hasOnsiteServices,
    hasDigitalProducts,
    hasServiceProducts,
    needsShippingAddress,
    itemCount: firstDefined(summary.totalItems, source.totalItems, normalizedCartItems.reduce((sum, item) => sum + item.quantity, 0)),
    amounts: {
      subtotal: firstDefined(summary.subtotalAmount, summary.subtotal, source.subtotalAmount, 0),
      shipping: firstDefined(summary.shippingAmount, summary.shipping, source.shippingAmount, 0),
      discount: firstDefined(summary.discountAmount, summary.discount, source.discountAmount, 0),
      tax: firstDefined(summary.taxAmount, summary.tax, source.taxAmount, 0),
      total: firstDefined(summary.grandTotal, summary.total, source.grandTotal, 0),
    },
  };
}

