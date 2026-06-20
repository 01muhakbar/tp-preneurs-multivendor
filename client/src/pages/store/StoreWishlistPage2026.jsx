import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart.ts';
import { useProducts, ProductCard } from '../../storefront.jsx';
import {
  readWishlistItems,
  WISHLIST_CHANGED_EVENT,
  clearWishlistItems,
  removeWishlistItem
} from '../../utils/storefrontWishlist.js';
import { 
  Heart, HeartOff, Share2, ShoppingCart, Search, LayoutGrid, List, Filter, X,
  Trash2, Bell, ShieldCheck, Zap
} from 'lucide-react';
import './store-wishlist-2026.css';

const rupiah = (value) => {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getItemKey = (item) => item.id || item.productId || item.slug;
const getItemSlug = (item) => item.slug || item.id || item.productId;
const getItemImage = (item) => item.imageUrl || item.image || null;
const getItemCategory = (item) => item.category?.name || item.category || "Uncategorized";
const getItemPrice = (item) => Number(item.price || 0);
const getOriginalPrice = (item) => Number(item.originalPrice || item.price || 0);
const getDiscountPercent = (item) => {
  const price = getItemPrice(item);
  const original = getOriginalPrice(item);
  if (original > price && original > 0) {
    return Math.round(((original - price) / original) * 100);
  }
  return 0;
};
const getRating = (item) => Number(item.rating || 0) || 4.5;
const getReviewCount = (item) => Number(item.reviewCount || 0) || Math.floor(Math.random() * 100) + 10;

const normalizeProducts = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
};

const buildFallbackEmoji = (categoryName) => {
  const lower = String(categoryName || "").toLowerCase();
  if (lower.includes('fruit')) return '🍎';
  if (lower.includes('vegetable') || lower.includes('veg')) return '🥦';
  if (lower.includes('dairy') || lower.includes('milk')) return '🥛';
  if (lower.includes('bakery') || lower.includes('bread')) return '🥐';
  if (lower.includes('meat')) return '🥩';
  if (lower.includes('fish') || lower.includes('seafood')) return '🐟';
  if (lower.includes('drink') || lower.includes('beverage')) return '🧃';
  return '📦';
};

function Stars({ rating, count }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  return (
    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
      <div className="flex text-amber-500">
        {[...Array(5)].map((_, i) => (
          <span key={i}>
            {i < fullStars ? "★" : i === fullStars && hasHalf ? "★" : "☆"}
          </span>
        ))}
      </div>
      <span className="text-[var(--tp-primary)] font-bold dark:text-sky-400">{rating.toFixed(1)}</span>
      <span>({count})</span>
    </div>
  );
}

function StatCard({ icon: Icon, title, value }) {
  return (
    <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white p-3 px-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[var(--tp-primary)] dark:bg-slate-800 dark:text-sky-400">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</div>
        <div className="text-sm font-bold text-slate-950 dark:text-white">{value}</div>
      </div>
    </div>
  );
}

function WishlistHero({ itemsCount, totalValue, onShare, onMoveAll }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400">
          <Heart className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">My Wishlist</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Your favorite items, saved for later</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatCard icon={LayoutGrid} title="Saved Items" value={`${itemsCount} Items`} />
        <StatCard icon={Zap} title="Total Value" value={rupiah(totalValue)} />
        <button 
          onClick={onShare}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
        <button 
          onClick={onMoveAll}
          disabled={itemsCount === 0}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--tp-accent)] px-6 text-sm font-bold text-white shadow-md transition hover:bg-[#e66404] disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Move All to Cart</span>
        </button>
      </div>
    </div>
  );
}

function CategoryTabs({ categories, activeCategory, onSelect }) {
  return (
    <div className="wishlist-2026-hide-scroll flex w-full overflow-x-auto rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <button
        onClick={() => onSelect('all')}
        className={`shrink-0 rounded-full px-5 py-2 text-sm font-bold transition ${
          activeCategory === 'all' 
            ? 'bg-[var(--tp-primary)] text-white dark:bg-sky-600' 
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
      >
        All Items
      </button>
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => onSelect(cat.name)}
          className={`shrink-0 rounded-full px-5 py-2 text-sm font-bold transition ${
            activeCategory === cat.name 
              ? 'bg-[var(--tp-primary)] text-white dark:bg-sky-600' 
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          {cat.name} ({cat.count})
        </button>
      ))}
    </div>
  );
}

function WishlistFilters({ query, onQueryChange, minPrice, onMinChange, maxPrice, onMaxChange, categories, activeCategory, onSelectCategory, onClear }) {
  return (
    <div className="flex w-full flex-col gap-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-950 dark:text-white">Filters</h3>
        <button onClick={onClear} className="text-xs font-semibold text-[var(--tp-primary)] hover:underline dark:text-sky-400">Clear All</button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search wishlist..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm font-semibold text-slate-900 focus:border-[var(--tp-primary)] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-sky-500"
        />
      </div>

      <div>
        <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Categories</h4>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" name="wl-cat" checked={activeCategory === 'all'} onChange={() => onSelectCategory('all')} className="h-4 w-4 text-[var(--tp-primary)] dark:bg-slate-800" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label key={cat.name} className="flex cursor-pointer items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input type="radio" name="wl-cat" checked={activeCategory === cat.name} onChange={() => onSelectCategory(cat.name)} className="h-4 w-4 text-[var(--tp-primary)] dark:bg-slate-800" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
              </div>
              <span className="text-xs text-slate-400">({cat.count})</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Price Range</h4>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Rp Min" value={minPrice} onChange={(e) => onMinChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          <span className="text-slate-400">-</span>
          <input type="number" placeholder="Rp Max" value={maxPrice} onChange={(e) => onMaxChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        </div>
      </div>
    </div>
  );
}

function WishlistProductCard({ item, viewMode, onRemove, onAddToCart }) {
  const isGrid = viewMode === 'grid';
  const discount = getDiscountPercent(item);
  const isAdding = false; // We can add local state if needed
  
  return (
    <div className={`group relative flex rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[var(--tp-primary)]/30 hover:shadow-md dark:border-white/10 dark:bg-slate-900 ${isGrid ? 'flex-col' : 'items-center gap-4'}`}>
      <button 
        onClick={() => onRemove(getItemKey(item))}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-rose-500 opacity-0 shadow-sm backdrop-blur-sm transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 dark:bg-slate-900/80 dark:hover:bg-slate-800"
      >
        <Heart className="h-4 w-4 fill-rose-500" />
      </button>

      {discount > 0 && (
        <div className="absolute left-3 top-3 z-10 rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-black text-white">
          -{discount}%
        </div>
      )}

      <Link to={`/product/${getItemSlug(item)}`} className={`block overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950 ${isGrid ? 'aspect-square w-full' : 'h-24 w-24 shrink-0'}`}>
        {getItemImage(item) ? (
          <img src={getItemImage(item)} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl opacity-50">{buildFallbackEmoji(getItemCategory(item))}</div>
        )}
      </Link>

      <div className={`flex flex-1 flex-col ${isGrid ? 'mt-3' : ''}`}>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {getItemCategory(item)}
        </div>
        <Link to={`/product/${getItemSlug(item)}`} className="wishlist-2026-line-clamp-2 mt-1 text-sm font-bold text-slate-950 transition hover:text-[var(--tp-primary)] dark:text-white dark:hover:text-sky-400">
          {item.name}
        </Link>
        <div className="mt-1">
          <Stars rating={getRating(item)} count={getReviewCount(item)} />
        </div>
        
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <div className="text-base font-black text-slate-950 dark:text-white">{rupiah(getItemPrice(item))}</div>
            {discount > 0 && (
              <div className="text-xs font-semibold text-slate-400 line-through">{rupiah(getOriginalPrice(item))}</div>
            )}
          </div>
        </div>
        
        <div className={`flex items-center gap-2 ${isGrid ? 'mt-3' : 'ml-auto'}`}>
          <button 
            onClick={() => onRemove(getItemKey(item))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:hover:border-rose-900/50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onAddToCart(item)}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--tp-accent)] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#e66404]"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyWishlist() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[32px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-950 dark:text-slate-700">
        <HeartOff className="h-10 w-10" />
      </div>
      <h2 className="mt-6 text-2xl font-black text-slate-950 dark:text-white">Your wishlist is empty</h2>
      <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Start adding items you love to your wishlist.</p>
      <Link 
        to="/shop" 
        className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[var(--tp-primary)] px-8 text-sm font-bold !text-white shadow-md transition hover:bg-[#023b69] dark:bg-sky-600 dark:hover:bg-sky-700"
      >
        Browse Products
      </Link>
    </div>
  );
}

function BenefitStrip() {
  const benefits = [
    { icon: ShieldCheck, title: "Never lose track", desc: "Your wishlist is saved to your account" },
    { icon: Bell, title: "Price drop alerts", desc: "We'll notify you when prices go down" },
    { icon: ShoppingCart, title: "Easy to buy", desc: "Add items to cart with one click" },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {benefits.map((b, i) => (
        <div key={i} className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-[var(--tp-primary)] dark:bg-slate-950 dark:text-sky-400">
            <b.icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-950 dark:text-white">{b.title}</div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{b.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StoreWishlistPage2026() {
  const cart = useCart();
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const { data: recData } = useProducts({
    page: 1, limit: 8, sort: 'featured', enabled: items.length === 0
  });
  const recommendations = normalizeProducts(recData);

  useEffect(() => {
    const load = () => setItems(readWishlistItems());
    load();
    window.addEventListener(WISHLIST_CHANGED_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(WISHLIST_CHANGED_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, []);

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 3000);
  };

  const handleRemove = (key) => {
    removeWishlistItem(key);
  };

  const handleAddToCart = async (item) => {
    await cart.add(item.productId || item.id, 1, {
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl || item.image,
      stock: item.stock,
      slug: item.slug,
      storeId: item.storeId,
      storeSlug: item.storeSlug,
      category: item.category,
      variantKey: item.variantKey,
      variantLabel: item.variantLabel,
      variantSelections: item.variantSelections,
      variantSku: item.variantSku,
      variantBarcode: item.variantBarcode
    });
    showAlert("Product added to cart.");
  };

  const handleMoveAllToCart = async () => {
    for (const item of items) {
      await cart.add(item.productId || item.id, 1, {
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl || item.image,
        stock: item.stock,
        slug: item.slug,
        storeId: item.storeId,
        storeSlug: item.storeSlug,
        category: item.category,
        variantKey: item.variantKey,
        variantLabel: item.variantLabel,
        variantSelections: item.variantSelections,
        variantSku: item.variantSku,
        variantBarcode: item.variantBarcode
      });
    }
    clearWishlistItems();
    showAlert("All items moved to cart.");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Wishlist',
          url: window.location.href,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showAlert("Wishlist link copied.");
    }
  };

  const categories = useMemo(() => {
    const map = {};
    items.forEach(it => {
      const cat = getItemCategory(it);
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(it => {
      if (activeCategory !== 'all' && getItemCategory(it) !== activeCategory) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!it.name?.toLowerCase().includes(q) && !getItemCategory(it).toLowerCase().includes(q)) return false;
      }
      const price = getItemPrice(it);
      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;
      return true;
    }).sort((a, b) => {
      if (sort === 'price_asc') return getItemPrice(a) - getItemPrice(b);
      if (sort === 'price_desc') return getItemPrice(b) - getItemPrice(a);
      if (sort === 'rating_desc') return getRating(b) - getRating(a);
      if (sort === 'name_asc') return (a.name || "").localeCompare(b.name || "");
      // recent is default by addedAt descending. items are naturally prepended, so their original order is recent first.
      return 0;
    });
  }, [items, activeCategory, query, minPrice, maxPrice, sort]);

  const totalValue = items.reduce((acc, it) => acc + getItemPrice(it), 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <nav className="mb-6 flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-[var(--tp-primary)] dark:hover:text-sky-400">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/user/my-account" className="hover:text-[var(--tp-primary)] dark:hover:text-sky-400">My Account</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 dark:text-white">Wishlist</span>
        </nav>

        {alertMsg && (
          <div className="mb-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            {alertMsg}
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col gap-10">
            <EmptyWishlist />
            {recommendations.length > 0 && (
              <div>
                <h3 className="mb-6 text-xl font-black text-slate-950 dark:text-white">Recommended For You</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {recommendations.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <WishlistHero 
              itemsCount={items.length} 
              totalValue={totalValue} 
              onShare={handleShare} 
              onMoveAll={handleMoveAllToCart} 
            />

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              
              <div className="hidden w-72 shrink-0 lg:block lg:sticky lg:top-24">
                <WishlistFilters 
                  query={query} onQueryChange={setQuery}
                  minPrice={minPrice} onMinChange={setMinPrice}
                  maxPrice={maxPrice} onMaxChange={setMaxPrice}
                  categories={categories} activeCategory={activeCategory} onSelectCategory={setActiveCategory}
                  onClear={() => { setQuery(''); setMinPrice(''); setMaxPrice(''); setActiveCategory('all'); }}
                />
              </div>

              {/* Mobile Filter Drawer */}
              {showMobileFilter && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                  <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowMobileFilter(false)} />
                  <div className="absolute bottom-0 left-0 right-0 rounded-t-[32px] bg-white p-6 shadow-xl dark:bg-slate-900">
                    <div className="mb-6 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Filters</h3>
                      <button onClick={() => setShowMobileFilter(false)} className="rounded-full bg-slate-100 p-2 dark:bg-slate-800"><X className="h-5 w-5 text-slate-500" /></button>
                    </div>
                    <WishlistFilters 
                      query={query} onQueryChange={setQuery}
                      minPrice={minPrice} onMinChange={setMinPrice}
                      maxPrice={maxPrice} onMaxChange={setMaxPrice}
                      categories={categories} activeCategory={activeCategory} onSelectCategory={setActiveCategory}
                      onClear={() => { setQuery(''); setMinPrice(''); setMaxPrice(''); setActiveCategory('all'); }}
                    />
                    <button onClick={() => setShowMobileFilter(false)} className="mt-6 w-full rounded-full bg-[var(--tp-primary)] h-12 text-sm font-bold text-white">Apply Filters</button>
                  </div>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CategoryTabs categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory} />
                  
                  <div className="flex shrink-0 items-center gap-3">
                    <button onClick={() => setShowMobileFilter(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 lg:hidden dark:bg-slate-900 dark:border-white/10 dark:text-slate-300">
                      <Filter className="h-4 w-4" />
                    </button>
                    
                    <div className="relative shrink-0">
                      <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 appearance-none rounded-full border border-slate-200 bg-white pl-4 pr-10 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-[var(--tp-primary)] dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
                        <option value="recent">Recently Added</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="rating_desc">Highest Rated</option>
                        <option value="name_asc">Name: A to Z</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</div>
                    </div>

                    <div className="flex shrink-0 items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-900">
                      <button onClick={() => setViewMode('grid')} className={`flex h-8 w-8 items-center justify-center rounded-full transition ${viewMode === 'grid' ? 'bg-slate-100 text-[var(--tp-primary)] dark:bg-slate-800 dark:text-sky-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button onClick={() => setViewMode('list')} className={`flex h-8 w-8 items-center justify-center rounded-full transition ${viewMode === 'list' ? 'bg-slate-100 text-[var(--tp-primary)] dark:bg-slate-800 dark:text-sky-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="rounded-[24px] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <p className="font-bold text-slate-500">No items match your filters.</p>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {filteredItems.map(item => (
                      <WishlistProductCard 
                        key={getItemKey(item)} 
                        item={item} 
                        viewMode={viewMode} 
                        onRemove={handleRemove}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                )}
                
                <div className="mt-10">
                  <BenefitStrip />
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
