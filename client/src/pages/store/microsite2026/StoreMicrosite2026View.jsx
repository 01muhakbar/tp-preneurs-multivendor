import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  CalendarDays,
  MessageCircleMore,
  Heart,
  Share,
  Search,
  ShoppingCart,
  PhoneCall,
  Mail,
  MapPin,
  ArrowUpDown,
  ShoppingBag,
  Layers3,
  CheckCircle2,
  ShieldCheck,
  Headset,
} from "lucide-react";
import SearchProductCard from "../../../components/store/SearchProductCard.jsx";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";

function MicrositeProductCard({ product, onWishlistToggle }) {
  // Use existing SearchProductCard but we can wrap or modify if needed
  return (
    <div className="relative group">
      <SearchProductCard product={product} variant="grid" />
      {/* SearchProductCard natively handles wishlist and add-to-cart using global hooks,
          but if we needed to pass explicit handlers, we could wrap it here.
          For now, SearchProductCard handles its own internal routing and cart/wishlist. */}
    </div>
  );
}

function StoreHero({
  store,
  onChat,
  onFollowToggle,
  isFollowed,
  onShare,
  onEmail,
  onCall,
}) {
  const logoSrc = resolveAssetUrl(store.logoUrl);
  const bannerSrc = resolveAssetUrl(store.bannerUrl);
  return (
    <div className="relative overflow-hidden rounded-[32px] text-white hero-gradient shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
      {bannerSrc ? (
        <img
          src={bannerSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay"
        />
      ) : null}
      <div className="absolute inset-0 opacity-20 bg-[url('/pattern-dots.svg')] bg-repeat"></div>
      
      {/* Accent Wave */}
      <svg className="hero-accent-wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
        <path fill="var(--ms-accent)" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,176C672,171,768,181,864,197.3C960,213,1056,235,1152,213.3C1248,192,1344,128,1392,96L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="shrink-0 flex items-center justify-center overflow-hidden rounded-2xl bg-white w-24 h-24 sm:w-28 sm:h-28 shadow-lg">
            {logoSrc ? (
              <img src={logoSrc} alt={store.name} className="w-full h-full object-contain p-2" />
            ) : (
              <ShoppingBag className="w-10 h-10 text-slate-300" />
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-7 items-center rounded-full border border-white/20 bg-white/10 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                Store
              </span>
              <span className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-wider ${store.isOperational ? 'border-orange-200 bg-orange-500 text-white' : 'border-white/20 bg-white/10 text-white'}`}>
                {store.operationalLabel}
              </span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {store.name}
              </h1>
              {store.handle && (
                <p className="mt-1 text-sm text-white/80">{store.handle}</p>
              )}
            </div>

            {store.description && (
              <p className="max-w-xl text-sm leading-relaxed text-white/90">
                {store.description}
              </p>
            )}

            {store.addressLabel && (
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{store.addressLabel}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onChat}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-600 transition"
              >
                <MessageCircleMore className="h-4 w-4" /> Chat
              </button>
              <button
                onClick={onFollowToggle}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition ${isFollowed ? 'bg-white/20 border-white/30 text-white' : 'bg-white text-[var(--ms-primary)] hover:bg-slate-50'}`}
              >
                <Heart className={`h-4 w-4 ${isFollowed ? 'fill-white' : ''}`} /> 
                {isFollowed ? 'Following' : 'Follow Store'}
              </button>
            </div>
          </div>
        </div>

        {/* Metrics & Sharing */}
        <div className="flex flex-col gap-4 self-stretch sm:self-auto sm:w-64">
          <div className="flex justify-end gap-2">
            <button
              onClick={onShare}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition"
              aria-label="Share Store"
            >
              <Share className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-auto">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70 flex items-center justify-between">
                Products <Package className="h-3 w-3" />
              </p>
              <p className="mt-1 text-xl font-bold text-white">{store.productCount}</p>
              <p className="mt-0.5 text-xs text-white/70">items</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70 flex items-center justify-between">
                Joined <CalendarDays className="h-3 w-3" />
              </p>
              <p className="mt-1 text-lg font-bold text-white">{store.joinedLabel}</p>
              <p className="mt-0.5 text-xs text-white/70">store age</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoreMicrosite2026View({
  vm,
  loading,
  productsLoading,
  error,
  activeTab,
  searchValue,
  sortValue,
  isFollowed,
  onRetry,
  onTabChange,
  onSearchChange,
  onSearchSubmit,
  onSortChange,
  onFollowToggle,
  onChat,
  onEmail,
  onCall,
  onShare,
}) {
  const { store, products, featuredProducts, richAboutHtml, notes, hasProducts } = vm;

  const tabsRef = useRef(null);
  
  if (loading) {
    return (
      <div className="store-microsite-2026 w-full mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="h-[400px] w-full rounded-[32px] store-microsite-2026-skeleton"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="store-microsite-2026 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <p className="text-slate-600">Failed to load the store.</p>
          <button onClick={onRetry} className="bg-[var(--ms-primary)] text-white px-6 py-2 rounded-full font-medium hover:opacity-90">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderEmptyProducts = (title = "No products yet", desc = "This store hasn't published any public products.") => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-[24px] border border-slate-200 bg-white">
      <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
        <ShoppingBag className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">{desc}</p>
      {searchValue && (
        <button 
          onClick={() => { onSearchChange(""); onSearchSubmit(new Event('submit')); }}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-semibold text-[var(--ms-primary)] hover:bg-slate-50"
        >
          Browse all products
        </button>
      )}
    </div>
  );

  return (
    <div className="store-microsite-2026">
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        
        <StoreHero 
          store={store} 
          onChat={onChat}
          onFollowToggle={onFollowToggle}
          isFollowed={isFollowed}
          onShare={onShare}
          onEmail={onEmail}
          onCall={onCall}
        />

        {/* Tabs */}
        <div className="sticky top-[72px] z-20 bg-[var(--ms-bg)]/90 backdrop-blur-md pt-2 pb-2 border-b border-slate-200">
          <div ref={tabsRef} className="flex gap-8 ms-tabs-scroll overflow-x-auto whitespace-nowrap">
            {[
              { id: "home", label: "Store Home" },
              { id: "products", label: "Products" },
              { id: "about", label: "About" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[var(--ms-accent)] text-[var(--ms-accent)]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          {/* Store Home Tab Content */}
          <div className={activeTab === 'home' ? 'block' : 'hidden'} id="home-section">
            <section className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-[var(--ms-accent)] mb-1">
                    <StarIcon />
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Top Picks</h2>
                  </div>
                  <p className="text-sm text-slate-500">Curated favorites from this store.</p>
                </div>
                <button
                  onClick={() => onTabChange('products')}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View All
                </button>
              </div>

              {productsLoading ? (
                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                   {[1,2,3,4].map(i => <div key={i} className="h-72 rounded-[28px] store-microsite-2026-skeleton"></div>)}
                 </div>
              ) : featuredProducts.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {featuredProducts.map(product => (
                    <MicrositeProductCard key={product.id || product.slug} product={product} />
                  ))}
                </div>
              ) : (
                renderEmptyProducts()
              )}
            </section>
          </div>

          {/* Products Tab Content */}
          <div className={activeTab === 'products' ? 'block' : 'hidden'} id="products-section">
            <section className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Products</h2>
                  <p className="text-sm text-slate-500 mt-1">Browse all products from this store.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <form onSubmit={onSearchSubmit}>
                      <input 
                        type="text"
                        placeholder="Search store..."
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ms-primary)] dark:bg-slate-900 dark:border-slate-700"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </form>
                  </div>
                  <div className="relative shrink-0">
                    <select 
                      value={sortValue}
                      onChange={(e) => onSortChange(e.target.value)}
                      className="h-10 pl-10 pr-8 rounded-full border border-slate-200 bg-white text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--ms-primary)] dark:bg-slate-800 dark:border-slate-700"
                    >
                      <option value="relevance">Sort</option>
                      <option value="newest">Newest</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {productsLoading ? (
                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                   {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-72 rounded-[28px] store-microsite-2026-skeleton"></div>)}
                 </div>
              ) : products.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {products.map(product => (
                    <MicrositeProductCard key={product.id || product.slug} product={product} />
                  ))}
                </div>
              ) : (
                renderEmptyProducts(
                  "No products found", 
                  searchValue ? `No results match your search for "${searchValue}".` : "This store hasn't added any products yet."
                )
              )}
            </section>
          </div>

          {/* About Tab Content */}
          <div className={activeTab === 'about' ? 'block' : 'hidden'} id="about-section">
             <section className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200 shadow-sm">
                <div className="mb-8">
                  <div className="flex items-center gap-3 text-[var(--ms-accent)] mb-1">
                    <div className="h-10 w-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                      <StoreIconSmall />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">About This Store</h2>
                  </div>
                  <p className="text-sm text-slate-500 ml-13">Short public information for this store.</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
                  <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-6 sm:p-8 dark:bg-slate-800/50 dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm dark:bg-slate-700">
                         <ShoppingBag className="w-6 h-6 text-[var(--ms-primary)]" />
                       </div>
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white">{store.name}</h3>
                    </div>
                    
                    {richAboutHtml ? (
                      <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: richAboutHtml }} />
                    ) : (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                        {store.description}
                      </p>
                    )}
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-8 w-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                        <Layers3 className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ms-primary)] dark:text-blue-400">Store Notes</h4>
                    </div>
                    
                    <ul className="space-y-4">
                      {notes.map((note, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                           <CheckCircle2 className="w-4 h-4 text-[var(--ms-primary)] shrink-0 mt-0.5" />
                           <span className="text-sm text-slate-600 dark:text-slate-400 leading-tight">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
             </section>
          </div>

        </div>

        {/* Feature Strip */}
        <div className="mt-12 bg-white rounded-[24px] p-6 sm:p-8 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:divide-slate-800">
          <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:px-4 first:pt-0">
            <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-[var(--ms-primary)] dark:border-slate-700 dark:text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">Secure payments</p>
              <p className="text-xs text-slate-500 mt-1">Safe & trusted checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:px-4">
            <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-[var(--ms-primary)] dark:border-slate-700 dark:text-blue-400">
              <StarIcon />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">Quality assured</p>
              <p className="text-xs text-slate-500 mt-1">Carefully selected products</p>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:px-4">
            <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-[var(--ms-primary)] dark:border-slate-700 dark:text-blue-400">
              <Headset className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">Support 24/7</p>
              <p className="text-xs text-slate-500 mt-1">We're here to help</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

function StarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function StoreIconSmall() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );
}
