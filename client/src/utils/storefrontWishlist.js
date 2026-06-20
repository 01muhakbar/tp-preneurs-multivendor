import { useState, useEffect } from 'react';

export const STOREFRONT_WISHLIST_KEY = 'tp_storefront_wishlist_v1';
export const WISHLIST_CHANGED_EVENT = 'tp-storefront-wishlist-changed';

export function readWishlistItems() {
  try {
    const raw = localStorage.getItem(STOREFRONT_WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to read wishlist from localStorage", error);
    return [];
  }
}

export function writeWishlistItems(items) {
  try {
    localStorage.setItem(STOREFRONT_WISHLIST_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(WISHLIST_CHANGED_EVENT));
  } catch (error) {
    console.error("Failed to write wishlist to localStorage", error);
  }
}

export function clearWishlistItems() {
  writeWishlistItems([]);
}

export function isWishlistItem(productIdOrSlug) {
  const items = readWishlistItems();
  return items.some(
    (item) => item.productId === productIdOrSlug || item.slug === productIdOrSlug || item.id === productIdOrSlug
  );
}

export function removeWishlistItem(productIdOrSlug) {
  const items = readWishlistItems();
  const filtered = items.filter(
    (item) => item.productId !== productIdOrSlug && item.slug !== productIdOrSlug && item.id !== productIdOrSlug
  );
  writeWishlistItems(filtered);
}

export function addWishlistItem(product) {
  const items = readWishlistItems();
  const identifier = product.productId || product.id || product.slug;
  if (isWishlistItem(identifier)) {
    return;
  }
  
  const newItem = {
    id: product.id,
    productId: product.productId || product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    price: product.price,
    originalPrice: product.originalPrice || product.price,
    imageUrl: product.imageUrl || product.image,
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: product.stock,
    storeId: product.storeId,
    storeSlug: product.storeSlug,
    variantKey: product.variantKey,
    variantLabel: product.variantLabel,
    variantSelections: product.variantSelections,
    variantSku: product.variantSku,
    variantBarcode: product.variantBarcode,
    addedAt: new Date().toISOString()
  };
  
  writeWishlistItems([newItem, ...items]);
}

export function toggleWishlistItem(product) {
  const identifier = product.productId || product.id || product.slug;
  if (isWishlistItem(identifier)) {
    removeWishlistItem(identifier);
    return false;
  } else {
    addWishlistItem(product);
    return true;
  }
}

export function useStorefrontWishlist() {
  const [items, setItems] = useState(readWishlistItems());

  useEffect(() => {
    const handleSync = () => setItems(readWishlistItems());
    window.addEventListener(WISHLIST_CHANGED_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(WISHLIST_CHANGED_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const checkIsWishlisted = (idOrSlug) => {
    if (!idOrSlug) return false;
    return items.some(it => String(it.productId) === String(idOrSlug) || String(it.slug) === String(idOrSlug) || String(it.id) === String(idOrSlug));
  };

  return {
    items,
    count: items.length,
    isWishlisted: checkIsWishlisted,
    toggle: toggleWishlistItem,
    add: addWishlistItem,
    remove: removeWishlistItem,
    clear: clearWishlistItems
  };
}
