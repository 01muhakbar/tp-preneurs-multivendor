# system_map.md — Client / Storefront

**Project:** `tp-preneurs-multivendor-main`  
**Area fokus:** Client / Storefront  
**Sumber analisis:** ekstraksi `tp-preneurs-multivendor-main.zip`  
**Tanggal pemetaan:** 2026-06-12  
**Tujuan dokumen:** memberi konteks utuh kepada AI/engineer tentang arsitektur, fitur, route, API, state, dan alur aplikasi Client / Storefront agar pengembangan berikutnya tetap sinkron dengan sistem yang sudah ada.

---

## 1. Prinsip Umum Storefront

Client / Storefront adalah aplikasi publik dan buyer-facing dalam sistem multi-vendor. Aplikasi ini berjalan di dalam package `client`, berbasis React + Vite, dan tetap berbagi codebase dengan Admin Workspace dan Seller Workspace.

Prinsip penting:

1. **Storefront bukan aplikasi terpisah secara fisik.** Storefront berada di `client/src`, satu bundle dengan admin/seller route, tetapi dipisahkan lewat route, layout, guard, dan API module.
2. **Backend adalah source of truth untuk checkout, order, payment, stock, readiness, dan lifecycle.** Frontend boleh melakukan normalisasi/read-model, tetapi tidak boleh menciptakan kebenaran bisnis final sendiri.
3. **Public catalog dan public microsite harus tetap aman untuk guest.** Cart guest boleh berjalan lokal, tetapi checkout wajib account-authenticated.
4. **Multi-vendor checkout wajib berbasis preview backend.** Frontend menampilkan grouping per store, payment availability, coupon validity, shipping, dan invalid item dari response backend.
5. **Jangan menghapus route/page legacy tanpa audit.** Ada beberapa file/route lama yang masih dipertahankan untuk compatibility atau redirect.
6. **Semua perubahan Storefront harus mempertimbangkan sinkronisasi dengan Admin Workspace dan Seller Workspace.** Admin mengatur customization/settings/coupon/store/profile; Seller mengelola catalog/store/payment; Storefront mengonsumsi hasilnya.

---

## 2. Stack dan Runtime

### 2.1 Frontend stack

Package: `client`

Teknologi utama:

- React `19.1.1`
- Vite `7.1.2`
- TypeScript `~5.8.3`
- React Router DOM `7.8.2`
- TanStack React Query `5.85.6`
- Zustand `5.0.8`
- Axios `1.11.0`
- Zod `4.1.5`
- Shared schema package: `@ecommerce/schemas`
- Tailwind CSS v4 tooling
- UI/support libraries: `lucide-react`, `react-icons`, `framer-motion`, `recharts`, `sonner`, `react-hot-toast`, `html2canvas`, `jspdf`

Scripts penting `client/package.json`:

```bash
pnpm -F client dev
pnpm -F client build
pnpm -F client build:analyze
pnpm -F client preview
```

### 2.2 Vite configuration

File: `client/vite.config.ts`

Konfigurasi penting:

- Alias `@` mengarah ke `client/src`.
- Dev server default pada port `5173`.
- Proxy:
  - `/api` → `http://localhost:${VITE_PROXY_API_PORT || 3001}`
  - `/uploads` → server backend yang sama
- Manual vendor chunks:
  - `vendor-react`
  - `vendor-router`
  - `vendor-query`
  - `vendor-ui`
  - `vendor-utils`
  - `vendor-misc`

Implikasi untuk AI:

- Gunakan import alias `@/...` hanya jika pola file sekitar sudah menggunakannya.
- Public asset dari backend biasanya lewat `/uploads/...` atau URL absolut yang dinormalisasi utility.
- Jangan memindahkan proxy/API base path tanpa memeriksa server route mount.

---

## 3. Entry Point Aplikasi

### 3.1 `client/src/main.jsx`

Root aplikasi membungkus React app dengan:

- `BrowserRouter`
- `QueryClientProvider`
- `ReactQueryDevtools`
- global toast provider (`Toaster`)

Mutation toast global difokuskan untuk admin/seller workspace mutation success. Storefront tidak boleh terlalu bergantung pada global mutation toast karena checkout/cart/order punya UX status sendiri.

### 3.2 `client/src/App.jsx`

`App.jsx` adalah pusat routing seluruh frontend. Untuk Storefront, komponen penting:

- `AuthProvider`
- `SeoCustomizationBridge`
- `Suspense` fallback
- `StoreLayout`
- public store pages
- `AccountGuard`
- `AccountLayout`

`AuthProvider` membungkus semua route sehingga public, account, admin, dan seller bisa menggunakan konteks auth yang sama tetapi dengan scope berbeda.

---

## 4. Struktur Folder Storefront

### 4.1 Folder halaman Storefront

Folder utama:

```text
client/src/pages/store
```

File penting:

```text
Checkout.jsx
CheckoutSuccess.jsx
KachaBazarDemoHomePage.jsx
StoreAboutUsPage.jsx
StoreCartPage.jsx
StoreCategoryPage.jsx
StoreCheckoutSuccessPage.jsx
StoreContactUsPage.jsx
StoreFaqPage.jsx
StoreForgotPasswordPage.jsx
StoreHomePage.jsx
StoreLoginPage.jsx
StoreMicrositePage.jsx
StoreMicrositeProductDetailPage.jsx
StoreOffersPage.jsx
StoreOrderTrackingPage.jsx
StorePrivacyPolicyPage.jsx
StoreProductDetailPage.jsx
StoreRegisterPage.jsx
StoreResetPasswordPage.jsx
StoreSearchPage.jsx
StoreTermsAndConditionsPage.jsx
```

Catatan penting:

- Route index `/` saat ini memakai `KachaBazarDemoHomePage`, bukan `StoreHomePage.jsx`.
- `StoreCategoryPage.jsx` masih ada, tetapi route `/category` dan `/category/:slug` sekarang diarahkan ke `/search`.
- Microsite vendor memakai route `/store/:slug` dan `/store/:slug/products/:productSlug`, dan berada di luar `StoreLayout` global.

### 4.2 Layout dan shell

Folder:

```text
client/src/components/Layout
client/src/layouts
client/src/components/store
client/src/components/kachabazar-demo
```

Komponen penting:

```text
client/src/components/Layout/StoreLayout.jsx
client/src/components/Layout/MobileMenuDrawer.jsx
client/src/layouts/AccountLayout.jsx
client/src/components/store/StoreMicrositeShell.jsx
client/src/components/store/SearchProductCard.jsx
client/src/components/store/ProductSellerInfoCard.jsx
client/src/components/store/VariantQuickAddModal.jsx
client/src/components/kachabazar-demo/StoreHeaderKacha.jsx
client/src/components/kachabazar-demo/StoreFooterKacha.jsx
client/src/components/kachabazar-demo/FloatingCartWidget.jsx
```

### 4.3 API modules Storefront

Folder/fungsi utama:

```text
client/src/api/axios.ts
client/src/api/store.types.ts
client/src/api/store.service.ts
client/src/api/storeProducts.ts
client/src/api/storeCheckout.ts
client/src/api/storeCoupons.ts
client/src/api/storeCustomizationPublic.ts
client/src/api/storeOrders.ts
client/src/api/storePublicIdentity.ts
client/src/api/cartApi.ts
client/src/api/userAddresses.ts
client/src/api/userNotifications.ts
client/src/api/userStoreApplications.ts
client/src/api/userReviews.ts
client/src/api/public/*.ts
```

Catatan:

- `client/src/api/public/*.ts` banyak berperan sebagai wrapper/re-export untuk compatibility.
- Jangan mengubah hanya wrapper tanpa memastikan module top-level tetap sinkron.
- `client/src/api/store.service.ts` juga berfungsi sebagai compatibility export lama.

### 4.4 State dan hooks Storefront

File/folder penting:

```text
client/src/auth/AuthContext.jsx
client/src/components/AccountGuard.jsx
client/src/store/cartStore.ts
client/src/hooks/useCart.ts
client/src/hooks/useBuyerCartSessionSync.ts
client/src/storefront.jsx
client/src/utils/cartSync.ts
client/src/utils/guestCart.js
client/src/utils/storeAssets.ts
client/src/utils/formatCurrency.js
```

---

## 5. Route Map Client / Storefront

### 5.1 Public Storefront routes di dalam `StoreLayout`

Root layout:

```jsx
<Route path="/" element={<StoreLayout />}>
```

Route aktif:

| Route | Komponen | Fungsi |
|---|---|---|
| `/` | `KachaBazarDemoHomePage` | Home publik gaya marketplace/KachaBazar |
| `/search` | `StoreSearchPage` | Search, filter, sort, pagination produk |
| `/category` | `LegacyStoreCategoryRedirect` | Redirect ke `/search?page=1` |
| `/category/:slug` | `LegacyStoreCategoryRedirect` | Redirect ke `/search?category=:slug&page=1` |
| `/product/:slug` | `StoreProductDetailPage` | Detail produk global storefront |
| `/cart` | `StoreCartPage` | Cart page dan checkout preflight |
| `/checkout` | `Checkout.jsx` | Multi-store checkout authenticated |
| `/order/:ref` | `StoreOrderTrackingPage` | Tracking order publik berdasarkan reference |
| `/checkout/success` | `StoreCheckoutSuccessPage` + `AccountGuard` | Checkout success/order readback authenticated |
| `/about-us` | `StoreAboutUsPage` | Static/customized about page |
| `/privacy-policy` | `StorePrivacyPolicyPage` | Privacy policy |
| `/faq`, `/faqs` | `StoreFaqPage` | FAQ |
| `/terms`, `/terms-and-conditions` | `StoreTermsAndConditionsPage` | Terms |
| `/contact-us` | `StoreContactUsPage` | Contact page |
| `/offers` | `StoreOffersPage` | Offers/promotions page |
| `/about` | redirect | Redirect ke `/about-us` |
| `/contact` | redirect | Redirect ke `/contact-us` |
| `/my-orders` | redirect | Redirect ke `/user/my-orders` |

### 5.2 Auth routes Storefront

| Route | Komponen | Fungsi |
|---|---|---|
| `/auth/login` | `StoreLoginPage` | Account/buyer login |
| `/auth/register` | `StoreRegisterPage` | Account registration |
| `/auth/forgot-password` | `StoreForgotPasswordPage` | Forgot password |
| `/auth/reset-password` | `StoreResetPasswordPage` | Reset password |

Catatan penting:

- `AuthProvider.login()` berorientasi admin login. Buyer/account login page melakukan API call sendiri lalu refresh account session.
- Jangan memakai admin login method untuk buyer login.

### 5.3 Account routes Storefront

Semua route berikut berada di bawah `AccountGuard` dan `AccountLayout`:

| Route | Komponen | Fungsi |
|---|---|---|
| `/user/dashboard` | `AccountDashboardPage` | Dashboard buyer/account |
| `/user/my-orders` | `AccountOrdersPage` | List order buyer |
| `/user/my-orders/:id` | `AccountOrderDetailPage` | Detail order buyer |
| `/user/my-orders/:id/payment` | `AccountOrderPaymentPage` | Payment instruction/proof/cancel |
| `/user/notifications` | `AccountNotificationsPage` | Notifikasi buyer |
| `/user/my-reviews` | `AccountMyReviewPage` | Review produk/order |
| `/user/my-account` | `AccountMyAccountPage` | Account overview |
| `/user/shipping-address` | `AccountShippingAddressPage` | Address book |
| `/user/store-invitations` | `AccountStoreInvitationsPage` | Invitation ke seller workspace |
| `/user/store-application` | `AccountStoreApplicationPage` | Pengajuan menjadi seller/store |
| `/user/update-profile` | `AccountProfilePage` | Update profil buyer |
| `/user/change-password` | `AccountChangePasswordPage` | Ganti password |
| `/user/store-payment-profile` | `AccountLegacySellerRoutePage` | Legacy placeholder/bridge |
| `/user/store-payment-review` | `AccountLegacySellerRoutePage` | Legacy placeholder/bridge |

Legacy redirects:

| Legacy route | Target |
|---|---|
| `/account` | `/user/dashboard` |
| `/account/dashboard` | `/user/dashboard` |
| `/account/orders` | `/user/my-orders` |
| `/account/orders/:id` | `/user/my-orders/:id` |
| `/account/my-review` | `/user/my-reviews` |
| `/account/profile` | `/user/update-profile` |
| `/account/store-invitations` | `/user/store-invitations` |

### 5.4 Vendor public microsite routes

Microsite routes berada di luar `StoreLayout` global:

| Route | Komponen | Fungsi |
|---|---|---|
| `/store/:slug` | `StoreMicrositePage` | Public vendor/store microsite |
| `/store/:slug/products/:productSlug` | `StoreMicrositeProductDetailPage` | Detail produk dalam konteks store tertentu |

Implikasi:

- Microsite harus menyediakan shell sendiri melalui `StoreMicrositeShell`.
- Jangan mengandalkan header/footer dari `StoreLayout` untuk microsite.
- Data microsite berbasis `storeSlug`, identity publik, rich-about, dan produk yang difilter per store.

---

## 6. Layout Storefront

### 6.1 `StoreLayout.jsx`

`StoreLayout` adalah layout utama untuk public Storefront global.

Tanggung jawab:

1. Load public store settings:
   - query key `['store-settings', 'public']`
   - API: `getStoreSettings()`
2. Load public customization:
   - query key `['store-customization', 'store-layout', 'en']`
   - API: `getStoreCustomization({ lang: 'en', include: 'home' })`
3. Normalisasi settings:
   - payments
   - social login
   - analytics
   - chat
   - branding
4. Render:
   - `StoreHeaderKacha`
   - `<Outlet context={{ storeSettings }}>`
   - `StoreFooterKacha` kecuali route checkout
   - `FloatingCartWidget` kecuali cart/checkout
   - mobile bottom nav
   - `MobileMenuDrawer`
   - `StoreCartDrawer` kecuali halaman cart
5. Inject script analytics/chat:
   - Google Analytics bila enabled dan ada key
   - Tawk chat bila enabled dan ada property/widget ID

Guardrail:

- Script injection harus tetap diblok di test/QA mode seperti pola saat ini (`import.meta.env.MODE === 'test'` atau `window.__QA_MVF__`).
- Jangan meletakkan checkout dalam layout yang menampilkan distraksi berlebih; layout saat ini menyembunyikan footer pada checkout.

---

## 7. API Base dan Interceptor

### 7.1 Axios client

File: `client/src/api/axios.ts`

Konfigurasi:

- `baseURL: '/api'`
- `withCredentials: true`
- default JSON headers
- request interceptor membaca `localStorage.authToken` dan menambahkan `Authorization: Bearer <token>` bila ada
- response interceptor:
  - memicu unauthorized bus untuk 401 di luar endpoint auth/form tertentu
  - logging untuk 5xx atau network/no status

Implikasi:

- API path di client ditulis tanpa `/api`, contoh `api.get('/store/products')`.
- Cookie/session dan bearer token sama-sama didukung.
- Untuk route account yang butuh auth, handle 401 harus mengarah ke login buyer, bukan admin.

### 7.2 Backend route mount relevan

Server mount utama di `server/src/app.ts`:

```text
/api
/api/auth
/api/cart
/api/checkout
/api/orders
/api/payments
/api/store
/api/stores
/api/store/coupons
/api/store/customization
/api/store/settings
/api/user
/uploads
```

Storefront client mengonsumsi route publik dan protected dari mount di atas.

---

## 8. Public Store API Map

### 8.1 Catalog

Client modules:

```text
client/src/api/storeProducts.ts
client/src/storefront.jsx
```

Endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/store/categories` | Ambil kategori publik |
| GET | `/store/products` | Ambil list produk publik dengan filter/search/sort/pagination |
| GET | `/store/products/:id` | Ambil detail produk publik |

Parameter umum produk:

```text
search / q
category
storeSlug
minPrice
maxPrice
minRating
sort
page
limit
discounted
```

Hooks di `storefront.jsx`:

- `useCategories({ parentsOnly })`
- `useProducts(params)`
- `useProduct(slug)`

Query key penting:

```text
['storefront', 'categories', parentsOnly ? 'parents-only' : 'all']
['storefront', 'products', {...filters}]
['storefront', 'product', slug]
```

### 8.2 Store settings dan customization

Client modules:

```text
client/src/api/storeCustomizationPublic.ts
client/src/api/storePublicIdentity.ts
```

Endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/store/settings` | Public settings untuk Storefront |
| GET | `/store/customization` | Customization by language/include |
| GET | `/store/customization/header` | Header customization |
| GET | `/store/customization/identity` | Default public identity |
| GET | `/store/customization/identity/:slug` | Identity publik per vendor/store |
| GET | `/store/customization/microsites/:slug/rich-about` | Rich about content vendor microsite |

### 8.3 Coupon dan offers

Client module:

```text
client/src/api/storeCoupons.ts
```

Endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/store/coupons` | List coupon publik yang eligible |
| POST | `/store/coupons/quote` | Quote/validasi coupon terhadap subtotal/shipping/scope |
| POST | `/store/coupons/validate` | Validasi coupon legacy/compatibility |

Guardrail coupon:

- Public coupon harus mengikuti status aktif, time window, dan store readiness dari backend.
- Multi-store checkout hanya boleh memakai store-group coupon pada group store terkait.
- Platform/order-level coupon tidak boleh dipaksa masuk ke group store multi-vendor.
- Frontend tidak boleh menganggap coupon valid hanya karena terlihat di UI; checkout backend tetap harus revalidate.

### 8.4 Cart

Client modules:

```text
client/src/api/cartApi.ts
client/src/store/cartStore.ts
client/src/hooks/useCart.ts
client/src/utils/cartSync.ts
client/src/utils/guestCart.js
```

Endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/cart` | Ambil remote cart authenticated |
| POST | `/cart/add` | Tambah item ke remote cart |
| PUT | `/cart/items/by-id/:itemId` | Update qty remote cart item |
| DELETE | `/cart/items/by-id/:itemId` | Hapus remote cart item |

Legacy endpoint yang masih ada di backend:

```text
PUT /cart/items/:productId
DELETE /cart/remove/:itemId
```

Guardrail cart:

- Gunakan `useCart()` untuk storefront UI, bukan langsung memodifikasi Zustand raw bila variant penting.
- Variant harus dibawa melalui `variantKey`, `variantSelections`, `variantLabel`, `variantSku`, `variantBarcode`, dan `lineId`.
- Hindari merge cart hanya berdasarkan `productId` karena produk dengan variant berbeda bisa memiliki line berbeda.

### 8.5 Checkout

Client module:

```text
client/src/api/storeCheckout.ts
```

Endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/checkout/preview` | Preview checkout multi-store, grouping, totals, readiness |
| POST | `/checkout/create-multi-store` | Create order multi-store |

Frontend checkout harus memakai preview backend sebagai source of truth untuk:

- grouping per store
- payment profile readiness
- QRIS/payment availability
- invalid item/stock/variant state
- totals/subtotal/shipping/discount
- coupon eligibility
- final readiness sebelum create order

### 8.6 Orders dan payments

Client modules:

```text
client/src/api/storeOrders.ts
client/src/api/orderPayments.ts
```

Endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/store/my/orders` | List order milik account |
| GET | `/store/orders/my/:id` | Detail order account |
| GET | `/store/orders/:ref` | Public order tracking by reference |
| GET | `/orders/:orderId/checkout-payment` | Read grouped checkout payment state |
| GET | `/payments/:paymentId` | Detail payment |
| POST | `/payments/:paymentId/proof` | Upload proof payment |
| POST | `/payments/:paymentId/cancel` | Cancel payment/order sesuai contract |
| GET/POST | `/store/orders/:ref/stripe/session` | Stripe session compatibility |

Guardrail order/payment:

- Pakai backend `contract`, `operationalTruth`, `statusMeta`, `availableActions`, dan payment read model bila tersedia.
- Utility frontend seperti `splitOperationalTruth`, `splitOrderAggregateTruth`, `groupedPaymentReadModel`, dan `orderContract` adalah defensive selector/read model, bukan sumber kebenaran lifecycle final.

### 8.7 Account, notifications, addresses, reviews, store application

Endpoint utama:

| Area | Endpoint |
|---|---|
| Account session | `/auth/account/me` |
| Register/login/reset | `/auth/register`, `/auth/register/verify-otp`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/logout` |
| Profile | `/user/me`, `/store/profile`, `/upload` |
| Address | `/user/addresses`, `/user/addresses/default`, `/user/addresses/:id` |
| Notifications | `/user/notifications`, `/user/notifications/unread-count`, `/user/notifications/:id/read`, `/user/notifications/read-all` |
| Reviews | `/store/my/reviews`, `/store/my/reviews/need`, `/store/reviews`, `/store/reviews/:id`, `/store/reviews/product/:productId` |
| Store applications | `/user/store-applications/current`, `/user/store-applications/draft`, `/user/store-applications/:id`, `/submit`, `/resubmit`, `/cancel` |
| Seller invitations | `/seller/invitations`, `/seller/invitations/:memberId/accept`, `/seller/invitations/:memberId/decline` |

---

## 9. Auth dan Session Model

### 9.1 `AuthProvider`

File: `client/src/auth/AuthContext.jsx`

Auth model memisahkan scope:

- `admin`
- `account`
- seller compatibility via `useSellerAuth()`

Scope aktif ditentukan dari pathname, terutama `/admin` untuk admin. Selain itu dianggap account/customer context.

State penting:

```text
accountUser
accountRole
adminUser
adminRole
loading
currentScope
```

Storage/session hints penting:

```text
accountSessionHint
adminSessionHint
authSessionHint        // legacy
```

Unauthorized behavior:

- Unauthorized event menyimpan pending auth notice.
- Session dibersihkan sesuai scope.
- Cart remote sync direset ke guest bila account logout/unauthorized.

### 9.2 `AccountGuard`

Fungsi:

- Melindungi route `/user/*` dan `/checkout/success`.
- Redirect unauthenticated user ke `/auth/login`.
- Membawa redirect state/notice agar user kembali ke flow yang benar.

### 9.3 Buyer checkout auth

Checkout boleh dimulai dari guest cart, tetapi halaman `/checkout` membutuhkan account session. Bila ada auth hint tetapi session belum valid, checkout akan mencoba refresh/validasi session. Bila gagal, user diarahkan ke login buyer.

---

## 10. Cart Architecture

### 10.1 Zustand cart store

File: `client/src/store/cartStore.ts`

Persist key:

```text
kb_cart_v1
```

Legacy key:

```text
cart
```

State utama:

```text
items
totalQty
subtotal
mode: 'guest' | 'remote'
isRemoteSyncing
hasHydrated
```

Cart item shape penting:

```text
lineId
cartItemId
productId
name
price
imageUrl
qty
stock
variantKey
variantLabel
variantSelections
variantSku
variantBarcode
```

### 10.2 Guest vs remote mode

File: `client/src/hooks/useCart.ts`

Behavior:

- Guest mode memakai local storage helper `guestCart`.
- Remote mode memakai `/cart` endpoint.
- Remote mode aktif bila user/session/auth hint dianggap valid.
- Saat login, `useBuyerCartSessionSync` melakukan merge guest cart ke remote cart.
- Jika remote add gagal 401, pending add dapat disimpan dan user diarahkan ke `/auth/login`.

### 10.3 Cart sync login

File: `client/src/hooks/useBuyerCartSessionSync.ts`

Fungsi:

- Setelah login, guest cart di-merge ke remote cart.
- Remote cart kemudian di-refresh dan disimpan ke Zustand.
- Session marker seperti `cartSync:lastSyncedUserId` dipakai agar sync tidak berulang tanpa perlu.
- Logout/non-user mengembalikan mode ke guest.

### 10.4 Variant caveat

Ada potensi bahaya bila memakai method raw yang mencocokkan item hanya berdasarkan `productId`. Untuk produk varian, line harus diperlakukan unik berdasarkan kombinasi:

```text
productId + variantKey / variantSelections
```

Arahan AI:

- Untuk UI add-to-cart Storefront, gunakan `useCart().add(...)` dengan snapshot variant lengkap.
- Jangan mengubah cart reducer menjadi product-only merge tanpa audit variant.

---

## 11. Catalog dan Search Flow

### 11.1 Home page `/`

Komponen aktif:

```text
client/src/pages/store/KachaBazarDemoHomePage.jsx
```

Data utama:

- categories via `useCategories`
- products via `useProducts`
- coupons via `fetchStoreCoupons`
- home customization via `getStoreCustomization({ include: 'home' })`
- public identity via `getStorePublicIdentity`

Section umum:

- hero banners
- coupon panel
- promo delivery banner
- featured categories
- popular products grid
- discounted products
- daily needs section
- feature strip

Guardrail:

- Home page memakai fallback/default KachaBazar-style. Bila Admin customization belum lengkap, UI tetap harus tampil.
- Jangan mengganti route index ke `StoreHomePage.jsx` tanpa audit, karena route aktif sekarang adalah `KachaBazarDemoHomePage`.

### 11.2 Search page `/search`

Komponen:

```text
client/src/pages/store/StoreSearchPage.jsx
```

URL params yang dibaca:

```text
q / query / search
category
minPrice
maxPrice
minRating
sort
page
limit
```

Sort options:

```text
featured
price_asc
price_desc
highest_rated
newest
```

Fitur UI:

- search query display
- category chips/filter
- rating filter
- min/max price
- grid/list view
- mobile filter drawer
- pagination
- skeleton/loading/error/empty state
- updating badge saat background refetch

Data:

- categories dengan `parentsOnly`
- products dengan `useProducts(filters)`

### 11.3 Product detail `/product/:slug`

Komponen:

```text
client/src/pages/store/StoreProductDetailPage.jsx
```

Data utama:

- product detail via `useProduct(slug)`
- related products via `useProducts(...)`, difilter client berdasarkan kategori dan excluding current product
- customization include product page/right box
- SEO meta tags dari `product.seo`

Variant flow:

- Normalize public product variation state.
- Build variation groups.
- Resolve selected variant.
- Selected variant bisa memengaruhi image, price, stock, purchasability.
- Add-to-cart membawa variant snapshot lengkap.

Add-to-cart snapshot penting:

```text
variantKey
variantLabel
variantSelections
variantSku
variantBarcode
price
salePrice
imageUrl
stock
```

Purchasability:

- Mengacu pada backend `purchaseState.isPurchasable` bila tersedia.
- Tetap cek selected variant dan stock.
- Jangan hanya cek status UI lokal.

Seller/store info:

- Komponen `ProductSellerInfoCard` menampilkan info vendor/store jika backend menyediakan seller info.
- Tombol visit store mengarah ke microsite store bila `storeSlug`/href tersedia.

---

## 12. Vendor Microsite Flow

### 12.1 Store microsite `/store/:slug`

Komponen:

```text
client/src/pages/store/StoreMicrositePage.jsx
client/src/components/store/StoreMicrositeShell.jsx
```

Data utama:

- `getStorePublicIdentityBySlug(slug)`
- `fetchStoreProducts({ storeSlug: slug })`
- `getStoreMicrositeRichAboutBySlug(slug)`

Fitur:

- store hero/profile identity
- category rail
- product shelves/listing khusus store
- rich about content
- link ke product detail microsite

### 12.2 Microsite product detail `/store/:slug/products/:productSlug`

Komponen:

```text
client/src/pages/store/StoreMicrositeProductDetailPage.jsx
```

Data:

- product by slug/id plus `storeSlug`
- store identity by slug

Guardrail:

- Microsite berada di luar `StoreLayout`, jadi jangan memakai assumption layout global.
- Link produk dari microsite sebaiknya mempertahankan konteks store bila seller/store attribution penting.

---

## 13. Checkout Flow

### 13.1 Halaman checkout

Komponen:

```text
client/src/pages/store/Checkout.jsx
```

Ukuran file besar dan menjadi pusat flow multi-store checkout. Jangan refactor besar tanpa rencana bertahap.

Dependency utama:

- `useAuth`
- `useCart`
- `useCartStore`
- `previewCheckoutByStore`
- `createMultiStoreCheckoutOrder`
- `quoteStoreCoupon`
- default address utilities
- Indonesian region utilities
- shared `createOrderSchema`

State domain utama:

```text
shippingForm
useDefaultShipping
paymentOptionId
paymentMethod = 'QRIS'
couponCode/groupCoupons
fieldErrors
submitLock/checkoutRequestKey
```

### 13.2 Checkout preview

Query key:

```text
['checkout-preview-by-store', checkoutPreviewSignature]
```

API:

```text
POST /checkout/preview
```

Enabled ketika:

- cart sudah hydrated
- cart punya item
- tidak sedang remote syncing
- user/auth hint valid
- checkout sudah initialized

Preview response dipakai untuk:

- group per store
- readiness per store
- payment profile availability
- QRIS payload/image/instruction
- shipping/totals/discount
- invalid/changed cart items
- coupon validation result

### 13.3 Coupon behavior di checkout

Single-store mode:

- boleh quote coupon order/store sesuai scope yang dikembalikan backend
- coupon harus dikonfirmasi via `/store/coupons/quote`

Multi-store mode:

- coupon diterapkan per group store.
- hanya coupon `scopeType === 'STORE'` yang valid untuk group store.
- platform/order-level coupon harus ditolak di UI multi-store bila tidak sesuai backend contract.

### 13.4 Create checkout order

API:

```text
POST /checkout/create-multi-store
```

Payload konseptual:

```text
customer
shippingDetails
useDefaultShipping
couponCode
groupCoupons
items/cart-derived payload
checkoutRequestKey
```

`checkoutRequestKey` dibuat dari item, coupon, shipping, dan customer untuk mengurangi risiko double submit/idempotency conflict.

Setelah sukses:

- cart dibersihkan
- query account orders di-invalidate
- user diarahkan ke `/user/my-orders/:orderId/payment?checkoutCreated=true&ref=...`

Error penting:

- 401 → redirect login buyer
- 409 → idempotency/invalid item/groups/checkout recovery handling
- invalid stock/variant/readiness → tampilkan sesuai response backend, jangan dipaksa lanjut

---

## 14. Cart Page Flow

Komponen:

```text
client/src/pages/store/StoreCartPage.jsx
```

Fungsi:

- Menampilkan cart item guest/remote.
- Update qty/remove item.
- Menampilkan variant line detail.
- Memanggil checkout preflight agar user tahu apakah cart siap checkout.
- Navigasi ke `/checkout` bila valid.

Preflight query:

```text
['cart-checkout-preflight', checkoutSignature]
```

API:

```text
POST /checkout/preview
```

Guardrail:

- Cart page boleh memberi warning berdasarkan preview, tetapi final checkout tetap harus re-preview.
- Jangan menjadikan preflight sebagai final order total.

---

## 15. Order, Payment, dan Tracking Flow

### 15.1 Account orders

Halaman:

```text
client/src/pages/account/AccountOrdersPage.jsx
client/src/pages/account/AccountOrderDetailPage.jsx
client/src/pages/account/AccountOrderPaymentPage.jsx
```

API utama:

```text
GET /store/my/orders
GET /store/orders/my/:id
GET /orders/:orderId/checkout-payment
POST /payments/:paymentId/proof
POST /payments/:paymentId/cancel
```

### 15.2 Payment page

`AccountOrderPaymentPage` menangani:

- grouped payment read model
- QRIS/payment instruction
- upload proof
- cancel payment bila available action mengizinkan
- query invalidation setelah mutation

Guardrail:

- Action button harus mengikuti backend available actions.
- Jangan menampilkan cancel/upload proof hanya dari status string sederhana.

### 15.3 Public order tracking

Route:

```text
/order/:ref
```

Komponen:

```text
client/src/pages/store/StoreOrderTrackingPage.jsx
```

API:

```text
GET /store/orders/:ref
```

Fitur:

- tracking berdasarkan reference
- invoice/print/download behavior
- timeline shipment/order
- read model defensif dari order truth utilities

### 15.4 Checkout success

Route:

```text
/checkout/success
```

Komponen:

```text
client/src/pages/store/StoreCheckoutSuccessPage.jsx
```

Catatan:

- Route ini dilindungi `AccountGuard`.
- Normal checkout QRIS saat ini lebih sering mengarah ke account payment page, bukan success page langsung.
- Success page tetap penting untuk compatibility Stripe/session atau readback order success.

---

## 16. Account Area Flow

### 16.1 `AccountLayout`

File:

```text
client/src/layouts/AccountLayout.jsx
```

Fungsi:

- Layout dashboard buyer.
- Sidebar menu berdasarkan customization dashboard/settings.
- Logout membersihkan auth dan reset cart ke guest.

Menu penting:

```text
Dashboard
My Orders
Notifications
Store Invitations
My Review
My Account
Shipping Address
Update Profile
Change Password
Store Application
```

### 16.2 Account dashboard

Komponen:

```text
client/src/pages/account/AccountDashboardPage.jsx
```

Data:

- order summary dari `/store/my/orders`
- current user store application
- seller workspace stores
- customization/dashboard copy

Fungsi domain:

- Menjadi bridge buyer → seller onboarding.
- Menampilkan status pengajuan store/application bila ada.

### 16.3 Store application

Komponen:

```text
client/src/pages/account/AccountStoreApplicationPage.jsx
```

API:

```text
GET /user/store-applications/current
POST /user/store-applications/draft
PATCH /user/store-applications/:id
POST /user/store-applications/:id/submit
POST /user/store-applications/:id/resubmit
POST /user/store-applications/:id/cancel
```

Fungsi:

- User buyer dapat mengajukan diri menjadi seller/store.
- Status aplikasi harus sinkron dengan Admin Store Applications dan Seller Workspace.

### 16.4 Store invitations

Komponen:

```text
client/src/pages/account/AccountStoreInvitationsPage.jsx
```

API:

```text
GET /seller/invitations
POST /seller/invitations/:memberId/accept
POST /seller/invitations/:memberId/decline
```

Fungsi:

- Buyer/account dapat menerima undangan menjadi member seller workspace.

---

## 17. Review Flow

Halaman:

```text
client/src/pages/account/AccountMyReviewPage.jsx
```

API:

```text
GET /store/my/reviews/need
GET /store/my/reviews
POST /store/reviews
PATCH /store/reviews/:id
PUT /store/reviews/product/:productId
POST /upload
```

Schema:

```text
packages/schemas/src/reviews.ts
```

Guardrail:

- Review image limit mengikuti schema/shared backend contract.
- Review need/list harus berbasis order yang memang eligible menurut backend.
- Jangan membuat UI yang membolehkan review produk tanpa eligibility check.

---

## 18. Shared Types dan Contract Penting

File:

```text
client/src/api/store.types.ts
```

Tipe penting:

### 18.1 `StoreCategory`

Field umum:

```text
id
name
slug
code
image
parentId
published
```

### 18.2 `StoreProduct`

Field umum:

```text
id
name
slug
routeSlug
productHref
sku
price
originalPrice
salePrice
discountPercent
ratingAvg
reviewCount
unit
categoryId
category
storeId
storeSlug
store
status
stock
preOrder
preorderDays
weight
condition
variations
purchaseState
published timestamps
seo
```

### 18.3 `StorefrontProductSellerInfo`

Field umum:

```text
storeId
name
slug
logoUrl
shortDescription
status
operationalReadiness
productCount
rating
follower
responseRate
responseTime
joinedAt
canVisitStore
visitStoreHref
canChat
chatMode
chatHref
label
helper
```

### 18.4 `StoreCoupon`

Field umum:

```text
id
code
campaignName
discountType
amount
minSpend
scopeType: PLATFORM | STORE
store summary
status meta
isPubliclyRedeemable
startsAt
expiresAt
```

### 18.5 `StoreCheckoutPreviewGroup`

Konsep field:

```text
store
items
subtotal
shipping
discount
total
paymentAvailable
paymentMethod
paymentProfile
merchant/account/qris details
warnings/errors
```

Guardrail:

- Bila backend menambahkan field baru di DTO, normalizer harus dibuat backward-compatible.
- Jangan menghapus field yang dipakai Admin/Seller/Storefront tanpa global search.

---

## 19. Static Pages dan Customization

Halaman static/customized:

```text
StoreAboutUsPage.jsx
StoreContactUsPage.jsx
StoreFaqPage.jsx
StoreOffersPage.jsx
StorePrivacyPolicyPage.jsx
StoreTermsAndConditionsPage.jsx
```

Sumber data:

```text
GET /store/customization?lang=en&include=...
```

Sanitization:

- Privacy/terms rich text memakai sanitizer seperti `sanitizeRichTextHtml`.
- Jangan render rich HTML baru tanpa sanitization.

Fallback behavior:

- Jika customization kosong, page tetap harus render fallback copy/default section.
- Error state harus user-friendly dan tidak crash seluruh StoreLayout.

---

## 20. Sinkronisasi dengan Admin Workspace

Admin Workspace memengaruhi Storefront lewat domain berikut:

| Admin domain | Dampak Storefront |
|---|---|
| Store Customization | Home, header/footer, static pages, dashboard labels/copy |
| Store Settings | Payment/social login/analytics/chat/branding settings |
| Product/Catalog | Produk, kategori, atribut/varian, stock, purchasability |
| Coupons | Public offers, checkout coupon eligibility |
| Store Applications | Buyer-to-seller onboarding status |
| Payment Profiles | Checkout QRIS/payment availability per store |
| Shipping/Order Ops | Checkout readiness, tracking, order lifecycle |

Arahan:

- Saat mengubah Storefront, cek apakah Admin mengatur data sumbernya.
- Jangan hardcode data yang seharusnya datang dari Admin customization/settings.
- Public page harus punya fallback, tetapi fallback bukan berarti mengabaikan Admin data.

---

## 21. Sinkronisasi dengan Seller Workspace

Seller Workspace memengaruhi Storefront lewat domain berikut:

| Seller domain | Dampak Storefront |
|---|---|
| Store Profile / Microsite | `/store/:slug`, seller card di product detail |
| Catalog Products | Product listing/detail/search/cart/checkout |
| Categories / Attributes / Attribute Values | Filter, variant, product metadata |
| Coupons | Store-scoped promotion dan group coupon checkout |
| Orders | Order fulfillment/tracking status |
| Payment Profile | Checkout payment available/tidak available |
| Team/permissions | Tidak langsung ke Storefront, tetapi memengaruhi siapa yang bisa mengubah data seller |

Arahan:

- Storefront harus membaca output seller/admin, bukan menulis langsung ke domain seller kecuali invitation/application flow.
- Public microsite harus menghormati store status/visibility/readiness dari backend.

---

## 22. Source of Truth dan Read Model Rules

### 22.1 Backend source of truth

Domain berikut harus selalu mengikuti backend:

```text
stock
variant availability
purchaseState
coupon validity
checkout totals
shipping fee
payment profile readiness
order lifecycle
payment lifecycle
shipment/tracking lifecycle
available actions
store/public visibility
```

### 22.2 Frontend read-model utilities

Utility seperti:

```text
splitOperationalTruth
splitOrderAggregateTruth
groupedPaymentReadModel
orderContract
```

Berfungsi untuk:

- menormalisasi response lama/baru
- menjaga UI tidak crash
- membantu rendering status/action

Bukan untuk:

- membuat lifecycle baru
- mengizinkan action yang tidak diberikan backend
- mengubah final payment/order state di client

---

## 23. QA dan Validation Checklist

Perintah dasar:

```bash
pnpm install
pnpm -F client build
pnpm -F server build
```

Smoke route Storefront minimal:

```text
/
/search
/product/:slug
/cart
/checkout
/order/:ref
/auth/login
/auth/register
/user/dashboard
/user/my-orders
/store/:slug
/store/:slug/products/:productSlug
```

Validasi manual/Playwright yang disarankan:

1. Home page render tanpa console error.
2. Search filter/sort/pagination mengubah query param dan query result.
3. Product detail bisa select variant dan add to cart.
4. Guest cart bertahan setelah reload.
5. Login buyer memicu cart merge remote.
6. Cart page menampilkan checkout preflight warning bila backend menolak item.
7. Checkout authenticated memanggil preview sebelum create order.
8. Multi-store cart menghasilkan group per store.
9. Store coupon hanya valid di group store terkait.
10. Order payment page menampilkan QRIS/payment action sesuai backend.
11. Public tracking `/order/:ref` tidak membutuhkan login.
12. Microsite `/store/:slug` tidak bergantung pada `StoreLayout`.
13. Static pages tetap render saat customization kosong/error.
14. Analytics/chat tidak inject script saat test/QA mode.

Regresi yang wajib dihindari:

- Mengubah `/category/:slug` tanpa menjaga redirect/search compatibility.
- Mematahkan `/store/:slug` karena diasumsikan berada di `StoreLayout`.
- Menghitung final total checkout di client tanpa backend preview.
- Menampilkan upload/cancel payment tanpa available action backend.
- Membuang `variantKey`/`variantSelections` saat add cart atau checkout.
- Menjadikan buyer login memakai admin auth flow.

---

## 24. Known Caveats / Technical Debt

1. **`StoreHomePage.jsx` ada tetapi route index memakai `KachaBazarDemoHomePage`.** Perlakukan `StoreHomePage` sebagai legacy/alternative sampai route map diubah secara sadar.
2. **`StoreCategoryPage.jsx` ada tetapi category route redirect ke search.** Jangan mengembangkan dua kategori UX paralel tanpa keputusan produk.
3. **Checkout file sangat besar.** Refactor harus bertahap: extract hook/read-model/component kecil dengan test/smoke setiap langkah.
4. **Cart variant matching sensitif.** Jangan merge item hanya berdasarkan productId.
5. **API wrapper public dan top-level harus sinkron.** Hindari perubahan yang hanya memperbaiki satu import path.
6. **Order/payment truth multi-sumber.** Banyak helper defensif ada karena kontrak backend berevolusi. Pertahankan backward compatibility.
7. **Coupon masih punya backlog domain.** Report lama menyebut area seperti usage limit, max discount, product/category restrictions, redemption ledger, dan global code uniqueness sebagai gap yang perlu backend contract sebelum UI final.
8. **Auth scope admin/account rawan tertukar.** Buyer/account flow tidak boleh memakai admin login method.

---

## 25. Prompt Konteks Singkat untuk AI Berikutnya

Gunakan konteks berikut saat meminta AI/Codex mengerjakan Storefront:

```text
Anda bekerja pada repo tp-preneurs-multivendor-main, fokus Client / Storefront. Storefront berada di client/src dan berbagi aplikasi dengan Admin Workspace dan Seller Workspace. Route publik utama ada di client/src/App.jsx di bawah StoreLayout. Home aktif adalah KachaBazarDemoHomePage, search di /search, product detail di /product/:slug, cart di /cart, checkout di /checkout, account dashboard di /user/*, dan vendor microsite di /store/:slug yang berada di luar StoreLayout.

Backend adalah source of truth untuk catalog purchasability, stock, variant availability, coupon validity, checkout totals, payment profile readiness, order/payment/shipment lifecycle, dan available actions. Jangan menghitung final checkout/order/payment state sendiri di client. Gunakan React Query, API modules di client/src/api, AuthContext untuk account session, useCart untuk cart, dan pertahankan variant fields seperti variantKey/variantSelections. Jangan menghapus route atau file legacy tanpa audit karena ada redirect/compatibility layer.

Setiap perubahan Storefront harus dicek sinkron dengan Admin customization/settings/coupons/payment profiles dan Seller catalog/store profile/payment/order data. Jalankan minimal pnpm -F client build dan smoke route /, /search, /product/:slug, /cart, /checkout, /user/my-orders, /order/:ref, /store/:slug.
```

---

## 26. File/Fungsi Prioritas Saat Modifikasi Storefront

Saat melakukan task Storefront, baca file sesuai domain:

### Routing/layout

```text
client/src/App.jsx
client/src/components/Layout/StoreLayout.jsx
client/src/layouts/AccountLayout.jsx
```

### Home/search/product

```text
client/src/pages/store/KachaBazarDemoHomePage.jsx
client/src/pages/store/StoreSearchPage.jsx
client/src/pages/store/StoreProductDetailPage.jsx
client/src/storefront.jsx
client/src/api/storeProducts.ts
client/src/api/store.types.ts
```

### Microsite

```text
client/src/pages/store/StoreMicrositePage.jsx
client/src/pages/store/StoreMicrositeProductDetailPage.jsx
client/src/components/store/StoreMicrositeShell.jsx
client/src/api/storePublicIdentity.ts
```

### Cart/checkout

```text
client/src/pages/store/StoreCartPage.jsx
client/src/pages/store/Checkout.jsx
client/src/hooks/useCart.ts
client/src/store/cartStore.ts
client/src/utils/cartSync.ts
client/src/api/cartApi.ts
client/src/api/storeCheckout.ts
```

### Order/payment/tracking

```text
client/src/pages/account/AccountOrdersPage.jsx
client/src/pages/account/AccountOrderDetailPage.jsx
client/src/pages/account/AccountOrderPaymentPage.jsx
client/src/pages/store/StoreOrderTrackingPage.jsx
client/src/pages/store/StoreCheckoutSuccessPage.jsx
client/src/api/storeOrders.ts
client/src/api/orderPayments.ts
client/src/utils/groupedPaymentReadModel.ts
client/src/utils/splitOperationalTruth.ts
client/src/utils/orderContract.ts
```

### Account/auth

```text
client/src/auth/AuthContext.jsx
client/src/components/AccountGuard.jsx
client/src/pages/store/StoreLoginPage.jsx
client/src/pages/store/StoreRegisterPage.jsx
client/src/pages/account/AccountDashboardPage.jsx
client/src/pages/account/AccountProfilePage.jsx
client/src/pages/account/AccountShippingAddressPage.jsx
client/src/pages/account/AccountStoreApplicationPage.jsx
```

### Customization/static pages

```text
client/src/api/storeCustomizationPublic.ts
client/src/pages/store/StoreAboutUsPage.jsx
client/src/pages/store/StoreContactUsPage.jsx
client/src/pages/store/StoreFaqPage.jsx
client/src/pages/store/StoreOffersPage.jsx
client/src/pages/store/StorePrivacyPolicyPage.jsx
client/src/pages/store/StoreTermsAndConditionsPage.jsx
```

---

## 27. Acceptance Criteria untuk Perubahan Storefront

Setiap task Storefront dianggap aman bila memenuhi kriteria berikut:

1. Route yang terdampak tetap render tanpa crash.
2. Tidak ada console error baru pada route utama.
3. Query key React Query tetap stabil dan tidak menyebabkan refetch loop.
4. Loading, empty, error, dan updating state tersedia untuk data async penting.
5. API error 401 pada protected account flow mengarah ke buyer login.
6. Guest cart dan remote cart tetap kompatibel.
7. Variant product tidak kehilangan pilihan saat add cart/checkout.
8. Checkout tetap memakai `/checkout/preview` sebelum create order.
9. Coupon tetap divalidasi backend.
10. Order/payment actions mengikuti backend `availableActions`/contract.
11. Microsite route tetap tidak bergantung pada `StoreLayout`.
12. `pnpm -F client build` lulus.
13. Bila menyentuh API contract, `pnpm -F server build` juga lulus.
14. Update dokumentasi/report bila perubahan besar.

---

## 28. Kesimpulan Arsitektur

Client / Storefront dalam repo ini sudah berkembang menjadi marketplace multi-vendor dengan empat lapisan besar:

1. **Public discovery layer:** home, search, category redirect, product detail, offers, static pages.
2. **Vendor microsite layer:** public store page dan store-scoped product detail.
3. **Buyer transaction layer:** guest/remote cart, authenticated checkout, coupon, payment, order tracking.
4. **Buyer account layer:** dashboard, orders, payment proof, reviews, notifications, addresses, profile, store application, store invitations.

Fondasi pengembangan berikutnya harus menjaga Storefront sebagai consumer yang disiplin terhadap data Admin/Seller/backend, bukan membuat state bisnis paralel di frontend. Fokus utama saat mengembangkan adalah menjaga sinkronisasi source of truth, compatibility route lama, dan pengalaman checkout multi-store yang aman.
