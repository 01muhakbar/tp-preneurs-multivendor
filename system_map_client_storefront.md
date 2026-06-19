# system_map_client_storefront.md — Client / Storefront

**Project:** `tp-preneurs-multivendor-main`  
**Area fokus:** Client / Storefront  
**Sumber analisis:** ekstraksi langsung `tp-preneurs-multivendor-main(4).zip` + pembaruan atas `system_map_client _storefront(2).md`  
**Tanggal pembaruan:** 2026-06-17  
**Tujuan dokumen:** memberi konteks utuh kepada AI/engineer tentang arsitektur, fitur, route, API, state, dan alur aplikasi Client / Storefront agar pengembangan berikutnya tetap sinkron dengan sistem aktual di codebase.

---

## 1. Ringkasan Pembaruan dari Analisis Repo Aktual

Dokumen lama pada dasarnya sudah benar untuk fondasi Storefront, tetapi analisis repo terbaru menemukan beberapa hal yang perlu ditegaskan/dikoreksi:

1. **Root app sekarang dibungkus `ThemeProvider`.** Theme Storefront mendukung `light`, `dark`, dan `system` melalui `client/src/theme/ThemeProvider.jsx`, menyimpan preferensi di `localStorage` key `tp_storefront_theme`, dan men-toggle class `dark` pada `<html>`.
2. **File cart store aktual adalah `client/src/store/cart.store.ts`, bukan `cartStore.ts`.** Semua referensi baru sebaiknya memakai `useCartStore` dari file tersebut.
3. **Banyak halaman Account sudah memakai UI/adapter 2026.** Page container lama tetap menjadi route aktif, tetapi render-nya mengarah ke komponen seperti `AccountOrders2026View`, `AccountOrderDetail2026View`, `AccountDashboard2026View`, dan adapter `account*2026Adapter.js`.
4. **Storefront memakai wrapper API publik di `client/src/api/public/*.ts`.** File public tersebut re-export dari module top-level (`../storeProducts.ts`, `../storeCheckout.ts`, dst.) untuk compatibility boundary.
5. **Route `/demo/kachabazar` ada untuk demo dev-only.** Di production build route ini redirect ke `/`.
6. **Store application endpoint update draft aktual adalah `PATCH /user/store-applications/:applicationId/draft`.** Dokumen lama menyebut PATCH langsung ke `/:id`; yang benar di client/server terbaru memakai suffix `/draft`.
7. **Notifications user sudah mendukung delete/clear selain read/unread.** Endpoint `DELETE /user/notifications` dan `DELETE /user/notifications/:id` tersedia di public router dan dipakai module `userNotifications.ts`.
8. **Checkout tetap backend-driven.** Preview `/checkout/preview` dan create `/checkout/create-multi-store` masih menjadi source of truth untuk grouping, totals, invalid item, coupon, payment readiness, dan lifecycle awal order.
9. **Jangan jadikan folder `.tmp/`, `_archive/`, atau slicing/demo sebagai sumber aktif kecuali task memang meminta.** Repo berisi artefak historis dan demo yang dapat menyesatkan jika dianggap production route.

---

## 2. Prinsip Umum Client / Storefront

Client / Storefront adalah aplikasi publik dan buyer-facing dalam sistem marketplace multi-vendor. Secara fisik ia berada di package `client` dan berbagi codebase dengan Admin Workspace serta Seller Workspace.

Prinsip pengembangan:

1. **Storefront bukan aplikasi fisik terpisah.** Storefront berada di `client/src` bersama admin/seller, dipisahkan oleh route, layout, guard, API boundary, dan auth scope.
2. **Backend adalah source of truth.** Frontend hanya membuat read-model defensif untuk rendering. Jangan membuat kebenaran bisnis final di client untuk stock, variant, checkout, coupon, payment, order, shipment, atau available actions.
3. **Public catalog harus aman untuk guest.** Guest boleh browse, search, lihat produk, masuk cart lokal, dan tracking public order by reference. Checkout/account features wajib account-authenticated.
4. **Multi-vendor checkout wajib berbasis preview backend.** UI harus menampilkan group per store, payment readiness, invalid items, shipping, discount, dan coupon state dari response backend.
5. **Legacy route/file tidak boleh dihapus tanpa audit.** Ada redirect dan compatibility layer untuk route lama seperti `/category/:slug`, `/account/*`, dan beberapa route seller/admin.
6. **Storefront mengonsumsi output Admin dan Seller.** Admin mengatur customization/settings/coupon/store application; Seller mengelola catalog/store profile/payment profile/order fulfillment; Storefront membaca dan menampilkan hasilnya.
7. **Theme harus global dan konsisten.** Karena `ThemeProvider` ada di root, komponen baru harus mendukung class `dark:*` bila area terkait sudah dark-ready.

---

## 3. Stack, Workspace, dan Runtime

### 3.1 Monorepo

Root `package.json` memakai pnpm workspace:

```text
server
client
packages/*
```

Scripts root penting:

```bash
pnpm dev
pnpm dev:client
pnpm dev:server
pnpm build
pnpm qa:staging:core
pnpm qa:public-release
pnpm qa:e2e:truth
pnpm qa:e2e:shipment-reconciliation
```

### 3.2 Frontend stack

Package: `client`

Teknologi utama:

- React `19.1.1`
- React DOM `19.1.1`
- Vite `7.1.2`
- TypeScript `~5.8.3`
- React Router DOM `7.8.2`
- TanStack React Query `5.85.6`
- Zustand `5.0.8`
- Axios `1.11.0`
- Zod `4.1.5`
- Shared schema package: `@ecommerce/schemas`
- Tailwind CSS v4 tooling
- UI/support: `lucide-react`, `react-icons`, `framer-motion`, `recharts`, `sonner`, `react-hot-toast`, `html2canvas`, `jspdf`, `dayjs`, `react-hook-form`, `react-dropzone`, `tailwind-merge`

Scripts `client/package.json`:

```bash
pnpm -F client dev
pnpm -F client build
pnpm -F client build:analyze
pnpm -F client lint
pnpm -F client preview
```

### 3.3 Backend stack relevan untuk Storefront

Package: `server`

Teknologi utama:

- Express `4.21.2`
- TypeScript `5.6.3`
- Sequelize `6.37.3`
- MySQL2
- Stripe `21.0.1`
- Cookie parser, CORS, JWT, bcrypt, multer, nodemailer

Smoke scripts server yang relevan untuk Storefront:

```bash
pnpm -F server smoke:product-visibility
pnpm -F server smoke:store-readiness
pnpm -F server smoke:order-payment
pnpm -F server smoke:checkout-coupons
pnpm -F server smoke:checkout-variants
pnpm -F server smoke:shipment-regression
pnpm -F server smoke:client-registration-otp
pnpm -F server smoke:user-change-password
pnpm -F server smoke:store-customization-seo
pnpm -F server smoke:store-settings
pnpm -F server smoke:store-application
pnpm -F server smoke:store-application-activation
```

---

## 4. Vite dan Entry Point Aplikasi

### 4.1 `client/vite.config.ts`

Konfigurasi penting:

- Alias `@` → `client/src`.
- Dev server default port `5173`, `strictPort: false`.
- Proxy:
  - `/api` → `http://${VITE_PROXY_API_HOST || localhost}:${VITE_PROXY_API_PORT || 3001}`
  - `/uploads` → server backend yang sama
- Manual vendor chunks:
  - `vendor-react`
  - `vendor-router`
  - `vendor-query`
  - `vendor-ui`
  - `vendor-utils`
  - `vendor-misc`
- Mode `analyze` mengaktifkan `rollup-plugin-visualizer` output `dist/stats.html`.

Implikasi:

- Client API memakai path relatif `/api` melalui axios `baseURL`.
- Asset upload backend bisa diakses via `/uploads/...` atau URL absolut yang dinormalisasi utility.
- Jangan memindahkan proxy/API path tanpa cek route mount server.

### 4.2 `client/src/main.jsx`

Root provider aktual:

```jsx
<QueryClientProvider client={queryClient}>
  <ThemeProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <Toaster position="top-right" />
  </ThemeProvider>
</QueryClientProvider>
```

Catatan:

- `ThemeProvider` adalah pembungkus global Storefront/Admin/Seller client shell.
- Mutation toast global dibatasi ke admin/seller workspace berdasarkan pathname. Storefront cart/checkout/order tidak sebaiknya bergantung pada global mutation toast.
- `ReactQueryDevtools` tidak ditemukan aktif di `main.jsx` terbaru; jangan menambahnya ke production tanpa keputusan eksplisit.

### 4.3 `client/src/App.jsx`

`App.jsx` adalah pusat routing semua workspace:

- Membungkus route dengan `AuthProvider`.
- Menjalankan `ScrollToTopOnRouteChange`.
- Menjalankan `SeoCustomizationBridge`.
- Menggunakan `Suspense` fallback sederhana.
- Mengatur route Storefront, Account, Microsite, Seller, dan Admin.

---

## 5. Theme / Dark Mode Architecture

### 5.1 `client/src/theme/ThemeProvider.jsx`

State theme:

```text
theme: light | dark | system
resolvedTheme: light | dark
isDark: boolean
setTheme(nextTheme)
toggleTheme()
```

Storage:

```text
tp_storefront_theme
```

DOM behavior:

- Toggle class `dark` di `document.documentElement`.
- Set `data-theme` sesuai resolved theme.
- Set `data-theme-preference` sesuai preferensi user.
- Set `style.colorScheme`.
- Update `<meta name="theme-color">` ke `#020617` untuk dark dan `#f8fafc` untuk light.

### 5.2 `client/src/components/store/ThemeToggle.jsx`

Variant UI:

```text
icon       // tombol toggle light/dark cepat
menu       // dropdown Light/Dark/System
segmented  // segmented control Light/Dark/System
```

Tempat pemakaian aktif:

- `client/src/components/kachabazar-demo/HeaderActions.jsx`
- `client/src/components/Layout/MobileMenuDrawer.jsx`
- `client/src/layouts/AccountLayout.jsx`

Guardrail:

- Komponen Storefront baru harus mengandung class `dark:*` bila berada di shell yang sudah dark-ready.
- Jangan membuat local theme store baru. Gunakan `useTheme()` dari `ThemeProvider`.
- Jangan menyimpan theme di key berbeda tanpa migrasi.

---

## 6. Struktur Folder Storefront Aktif

### 6.1 Halaman Storefront

Folder:

```text
client/src/pages/store
```

File aktif/penting:

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
StoreOrderTracking2026View.jsx
StoreOrderTrackingPage.jsx
StorePrivacyPolicyPage.jsx
StoreProductDetailPage.jsx
StoreRegisterPage.jsx
StoreResetPasswordPage.jsx
StoreSearchPage.jsx
StoreTermsAndConditionsPage.jsx
store-order-tracking-2026.css
storeOrderTracking2026Adapter.js
```

Catatan:

- Route index `/` memakai `KachaBazarDemoHomePage`, bukan `StoreHomePage.jsx`.
- `StoreCategoryPage.jsx` masih ada, tetapi route category redirect ke search.
- `StoreOrderTrackingPage.jsx` memakai adapter/view 2026 untuk presentasi tracking.
- `CheckoutSuccess.jsx` tetap ada sebagai legacy/compatibility file, tetapi route aktif untuk `/checkout/success` memakai `StoreCheckoutSuccessPage.jsx`.

### 6.2 Account pages aktif

Folder:

```text
client/src/pages/account
```

Route container aktif:

```text
AccountDashboardPage.jsx
AccountOrdersPage.jsx
AccountOrderDetailPage.jsx
AccountOrderPaymentPage.jsx
AccountNotificationsPage.jsx
AccountMyReviewPage.jsx
AccountMyAccountPage.jsx
AccountShippingAddressPage.jsx
AccountStoreInvitationsPage.jsx
AccountStoreApplicationPage.jsx
AccountProfilePage.jsx
AccountChangePasswordPage.jsx
AccountLegacySellerRoutePage.jsx
```

UI/adaptor 2026 penting:

```text
AccountDashboard2026View.jsx
AccountOrders2026View.jsx
AccountOrderDetail2026View.jsx
AccountOrderPayment2026View.jsx
AccountMyAccount2026View.jsx
AccountShippingAddress2026View.jsx
AccountUpdateProfile2026View.jsx
AccountChangePassword2026View.jsx
accountDashboard2026Adapter.js
accountOrders2026Adapter.js
accountOrderDetail2026Adapter.js
accountOrderPayment2026Adapter.js
accountMyAccount2026Adapter.js
accountShippingAddress2026Adapter.js
accountUpdateProfile2026Adapter.js
accountChangePassword2026Adapter.js
```

Implikasi:

- Jangan menganggap nama `*Page.jsx` berarti UI lama. Banyak page adalah data/container yang meneruskan props ke 2026 view.
- Saat mengubah visual account, cek view 2026 dan adapter yang bersangkutan, bukan hanya page container.

### 6.3 Layout dan shell

```text
client/src/components/Layout/StoreLayout.jsx
client/src/components/Layout/MobileMenuDrawer.jsx
client/src/layouts/AccountLayout.jsx
client/src/components/store/ThemeToggle.jsx
client/src/components/store/StoreMicrositeShell.jsx
client/src/components/store/SearchProductCard.jsx
client/src/components/store/ProductSellerInfoCard.jsx
client/src/components/store/VariantQuickAddModal.jsx
client/src/components/kachabazar-demo/StoreHeaderKacha.jsx
client/src/components/kachabazar-demo/StoreFooterKacha.jsx
client/src/components/kachabazar-demo/FloatingCartWidget.jsx
```

### 6.4 API modules Storefront

Top-level:

```text
client/src/api/axios.ts
client/src/api/store.types.ts
client/src/api/storeProducts.ts
client/src/api/storeCheckout.ts
client/src/api/storeCoupons.ts
client/src/api/storeCustomizationPublic.ts
client/src/api/storeOrders.ts
client/src/api/storePublicIdentity.ts
client/src/api/storeAuth.ts
client/src/api/cartApi.ts
client/src/api/orderPayments.ts
client/src/api/userAddresses.ts
client/src/api/userMe.ts
client/src/api/userNotifications.ts
client/src/api/userPassword.ts
client/src/api/userStoreApplications.ts
client/src/api/userStoreInvitations.ts
client/src/api/sellerInvitations.ts
client/src/api/sellerWorkspace.ts
```

Compatibility/public boundary:

```text
client/src/api/public/store.types.ts
client/src/api/public/storeCheckout.ts
client/src/api/public/storeCoupons.ts
client/src/api/public/storeCustomizationPublic.ts
client/src/api/public/storeOrders.ts
client/src/api/public/storeProducts.ts
client/src/api/public/storePublicIdentity.ts
```

Catatan:

- `client/src/api/public/*.ts` adalah re-export. Banyak Storefront page mengimpor dari path public tersebut.
- `client/src/api/store.service.ts` masih ada sebagai compatibility export lama.
- Jangan mengubah hanya satu import boundary tanpa global search.

### 6.5 State, hooks, dan utilities Storefront

```text
client/src/auth/AuthContext.jsx
client/src/auth/authDomainHooks.js
client/src/auth/useBuyerCartSessionSync.js
client/src/components/AccountGuard.jsx
client/src/store/cart.store.ts
client/src/hooks/useCart.ts
client/src/storefront.jsx
client/src/utils/cartSync.ts
client/src/utils/guestCart.ts
client/src/utils/storefrontCatalog.ts
client/src/utils/productImage.js
client/src/utils/storeAssets.ts
client/src/utils/format.js
client/src/utils/formatCurrency.js
client/src/utils/groupedPaymentReadModel.ts
client/src/utils/splitOperationalTruth.ts
client/src/utils/orderContract.ts
client/src/utils/orderTruth.js
client/src/utils/orderVariantPresentation.js
client/src/utils/variantCheckoutErrors.js
```

---

## 7. Route Map Client / Storefront

### 7.1 Demo route

| Route | Komponen | Catatan |
|---|---|---|
| `/demo/kachabazar` | `KachaBazarDemoHomePage` | Dev-only. Jika production build, redirect ke `/`. |

### 7.2 Vendor public microsite routes di luar `StoreLayout`

| Route | Komponen | Fungsi |
|---|---|---|
| `/store/:slug` | `StoreMicrositePage` | Public vendor/store microsite |
| `/store/:slug/products/:productSlug` | `StoreMicrositeProductDetailPage` | Product detail dalam konteks store |

Implikasi:

- Microsite tidak memakai header/footer `StoreLayout` global.
- Microsite harus menyediakan shell sendiri melalui `StoreMicrositeShell`.
- Jangan mengandalkan outlet context `StoreLayout` pada route `/store/:slug`.

### 7.3 Public Storefront routes di dalam `StoreLayout`

Root layout:

```jsx
<Route path="/" element={<StoreLayout />}>
```

| Route | Komponen | Fungsi |
|---|---|---|
| `/` | `KachaBazarDemoHomePage` | Home publik marketplace/KachaBazar |
| `/search` | `StoreSearchPage` | Search/filter/sort/pagination produk |
| `/category` | `LegacyStoreCategoryRedirect` | Redirect ke `/search?page=1` |
| `/category/:slug` | `LegacyStoreCategoryRedirect` | Redirect ke `/search?category=:slug&page=1` |
| `/product/:slug` | `StoreProductDetailPage` | Detail produk global storefront |
| `/cart` | `StoreCartPage` | Cart page, drawer export, checkout preflight |
| `/checkout` | `Checkout.jsx` | Checkout multi-store authenticated |
| `/order/:ref` | `StoreOrderTrackingPage` | Public order tracking by reference |
| `/checkout/success` | `StoreCheckoutSuccessPage` + `AccountGuard` | Success/readback compatibility |
| `/about-us` | `StoreAboutUsPage` | Static/customized about page |
| `/privacy-policy` | `StorePrivacyPolicyPage` | Privacy policy |
| `/faq` / `/faqs` | `StoreFaqPage` | FAQ |
| `/terms` / `/terms-and-conditions` | `StoreTermsAndConditionsPage` | Terms |
| `/contact-us` | `StoreContactUsPage` | Contact page |
| `/offers` | `StoreOffersPage` | Offers/promotions page |
| `/about` | redirect | Redirect ke `/about-us` |
| `/contact` | redirect | Redirect ke `/contact-us` |
| `/my-orders` | redirect | Redirect ke `/user/my-orders` |

### 7.4 Auth routes Storefront

| Route | Komponen | Fungsi |
|---|---|---|
| `/auth/login` | `StoreLoginPage` | Account/buyer login |
| `/auth/register` | `StoreRegisterPage` | Account registration + OTP flow |
| `/auth/forgot-password` | `StoreForgotPasswordPage` | Forgot password |
| `/auth/reset-password` | `StoreResetPasswordPage` | Reset password |

Catatan:

- `AuthProvider.login()` adalah admin login. Buyer login di `StoreLoginPage` memanggil `/auth/login` langsung via `api.post`.
- Buyer login melakukan merge guest cart dan pending add sebelum refresh session/cart.
- Jika role login adalah admin/staff/super_admin, `StoreLoginPage` mengarahkan ke `/admin`.

### 7.5 Account routes Storefront

Semua route berikut berada di bawah `AccountGuard` dan `AccountLayout`:

| Route | Komponen | Fungsi |
|---|---|---|
| `/user` | redirect | Redirect ke `/user/dashboard` |
| `/user/dashboard` | `AccountDashboardPage` | Dashboard buyer/account dengan 2026 view |
| `/user/my-orders` | `AccountOrdersPage` | List order buyer dengan 2026 view |
| `/user/my-orders/:id` | `AccountOrderDetailPage` | Detail order buyer dengan grouped payment read model |
| `/user/my-orders/:id/payment` | `AccountOrderPaymentPage` | Payment instruction/proof/cancel |
| `/user/notifications` | `AccountNotificationsPage` | Notifikasi buyer |
| `/user/my-reviews` | `AccountMyReviewPage` | Review produk/order |
| `/user/my-account` | `AccountMyAccountPage` | Account overview |
| `/user/shipping-address` | `AccountShippingAddressPage` | Address book dengan 2026 view |
| `/user/store-payment-profile` | `AccountLegacySellerRoutePage` | Legacy placeholder/bridge ke seller lane |
| `/user/store-payment-review` | `AccountLegacySellerRoutePage` | Legacy placeholder/bridge ke seller lane |
| `/user/store-invitations` | `AccountStoreInvitationsPage` | Seller/store invitations |
| `/user/store-application` | `AccountStoreApplicationPage` | Pengajuan menjadi seller/store |
| `/user/update-profile` | `AccountProfilePage` | Update profil buyer |
| `/user/change-password` | `AccountChangePasswordPage` | Ganti password |

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

---

## 8. Layout Storefront

### 8.1 `StoreLayout.jsx`

Tanggung jawab:

1. Load public store settings:
   - query key `['store-settings', 'public']`
   - API `getStoreSettings()` → `/store/settings`
2. Load public customization home/footer:
   - query key `['store-customization', 'store-layout', 'en']`
   - API `getStoreCustomization({ lang: 'en', include: 'home' })`
3. Normalisasi public settings:
   - payments
   - social login
   - analytics
   - chat
   - branding
4. Render global shell:
   - `StoreHeaderKacha`
   - `<Outlet context={{ storeSettings }} />`
   - `StoreFooterKacha` kecuali checkout route
   - `FloatingCartWidget` kecuali cart/checkout
   - mobile bottom nav
   - `MobileMenuDrawer`
   - `StoreCartDrawer` kecuali route cart
5. Inject scripts jika enabled:
   - Google Analytics via `store-ga-script` dan `store-ga-inline`
   - Tawk chat via `store-tawk-script`

Guardrail:

- Script injection diblok saat `import.meta.env.MODE === 'test'` atau `window.__QA_MVF__`.
- Checkout route menyembunyikan footer untuk mengurangi distraksi.
- Shell memakai class dark-ready: `dark:bg-slate-950 dark:text-slate-100`.

### 8.2 `MobileMenuDrawer.jsx`

Fungsi:

- Mobile navigation drawer.
- Menyediakan appearance segmented `ThemeToggle`.
- Menutup drawer ketika route berubah melalui state di `StoreLayout`.

### 8.3 `AccountLayout.jsx`

Fungsi:

- Layout dashboard buyer.
- Sidebar account menu.
- Load dashboard setting customization:
  - query key `['store-customization', 'dashboard-setting', 'en']`
  - include `dashboardSetting`
- Menyediakan segmented `ThemeToggle`.
- Logout membersihkan account session dan reset cart ke guest.

Menu default:

```text
Dashboard
My Orders
Notifications
Store Invitations
My Review
My Account
Update Profile
Shipping Addresses
Change Password
```

Catatan:

- Route `/user/store-application` aktif di `App.jsx`, tetapi tidak muncul di array `navItems` sidebar AccountLayout saat analisis ini. Akses biasanya melalui dashboard/onboarding CTA atau direct route.
- Beberapa route 2026 menggunakan standalone surface sehingga `AccountLayout` tidak selalu memberi card wrapper putih.

---

## 9. API Base, Axios, dan Unauthorized Flow

### 9.1 `client/src/api/axios.ts`

Konfigurasi:

```ts
baseURL: '/api'
withCredentials: true
Content-Type: application/json
Accept: application/json
```

Request interceptor:

- Membaca `localStorage.authToken`.
- Jika ada, set `Authorization: Bearer <token>`.
- Jika tidak ada, hapus header Authorization.

Response interceptor:

- 401 memicu `triggerUnauthorized(...)` kecuali endpoint auth/me dan auth form tertentu.
- 5xx atau network/no status dilog ke console.

Auth form endpoint yang dikecualikan meliputi:

```text
/auth/login
/auth/admin/login
/auth/register
/auth/register/resend-otp
/auth/register/verify-otp
/auth/forgot-password
/auth/reset-password
/auth/admin/register
/auth/admin/register/resend-verification
/auth/admin/verify-email
/auth/admin/forgot-password
/auth/admin/reset-password
/auth/logout
/auth/admin/logout
```

Implikasi:

- Client API ditulis tanpa prefix `/api`, contoh `api.get('/store/products')`.
- Cookie/session dan bearer token bisa berjalan bersamaan.
- Protected account flow harus redirect ke buyer login `/auth/login`, bukan admin login.

### 9.2 Server route mount relevan

Di `server/src/app.ts`, route mount publik/protected yang relevan:

```text
/api
/api/auth
/api/cart
/api/checkout
/api/orders
/api/payments
/api/seller
/api/store
/api/stores
/api/store/coupons
/api/store/customization
/api/store/settings
/api/user
/uploads
```

Catatan:

- `stripeWebhookRouter` dimount di `/api/store` sebelum `express.json()` karena webhook butuh raw body.
- `/api` public router juga memuat endpoint user profile/address/notifications/upload serta legacy/public catalog route.
- `/uploads` disajikan dari beberapa kandidat folder upload dan disetel no-cache.

---

## 10. Public Store API Map

### 10.1 Catalog API

Client module:

```text
client/src/api/storeProducts.ts
client/src/api/public/storeProducts.ts
client/src/storefront.jsx
```

Endpoint aktif:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/store/categories` | Ambil kategori publik |
| GET | `/store/products` | Ambil product listing publik |
| GET | `/store/products/:id` | Ambil product detail publik by slug/id |

Parameter listing:

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

```text
useCategories({ parentsOnly })
useProducts(params)
useProduct(slug)
```

Query keys:

```text
['storefront', 'categories', parentsOnly ? 'parents-only' : 'all']
['storefront', 'products', search/q, category, minPrice, maxPrice, minRating, sort, page, limit, discounted]
['storefront', 'product', slug]
```

Normalizer:

```text
client/src/utils/storefrontCatalog.ts
```

### 10.2 Store settings dan customization

Client module:

```text
client/src/api/storeCustomizationPublic.ts
client/src/api/storePublicIdentity.ts
client/src/api/public/storeCustomizationPublic.ts
client/src/api/public/storePublicIdentity.ts
```

Endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/store/settings` | Public settings Storefront |
| GET | `/store/customization` | Customization by `lang` dan `include` |
| GET | `/store/customization/header` | Header customization |
| GET | `/store/customization/identity` | Default public identity |
| GET | `/store/customization/identity/:slug` | Identity publik per vendor/store |
| GET | `/store/customization/microsites/:slug/rich-about` | Rich about content microsite |

Include customization yang dipakai Storefront:

```text
home
checkout
dashboardSetting
productSlugPage
aboutUs
privacyPolicy
termsAndConditions
faqs
offers
contactUs
seoSettings
```

### 10.3 Coupon dan offers

Client module:

```text
client/src/api/storeCoupons.ts
client/src/api/public/storeCoupons.ts
```

Endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/store/coupons` | List public coupon eligible |
| POST | `/store/coupons/quote` | Quote/validasi coupon terhadap subtotal/shipping/scope |
| POST | `/store/coupons/validate` | Legacy/compatibility validation |

Guardrail:

- Coupon frontend tidak final; backend harus revalidate saat checkout.
- Multi-store checkout memakai coupon per store group.
- Store group coupon harus `scopeType === 'STORE'`.
- Order-level/platform coupon di multi-store harus ditolak oleh UI jika tidak sesuai contract.

### 10.4 Cart API

Client module:

```text
client/src/api/cartApi.ts
client/src/store/cart.store.ts
client/src/hooks/useCart.ts
client/src/utils/cartSync.ts
client/src/utils/guestCart.ts
```

Endpoint aktif:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/cart` | Ambil remote cart authenticated |
| POST | `/cart/add` | Tambah item ke remote cart |
| PUT | `/cart/items/by-id/:itemId` | Update qty remote cart item by cart item id |
| DELETE | `/cart/items/by-id/:itemId` | Hapus remote cart item by cart item id |

Legacy endpoint server masih ada:

```text
PUT /cart/items/:productId
DELETE /cart/remove/:itemId
```

Snapshot add-to-cart mendukung variant:

```text
variantKey
variantLabel
variantSelections
variantSku
variantBarcode
variantPrice
variantSalePrice
variantImage
stock
```

### 10.5 Checkout API

Client module:

```text
client/src/api/storeCheckout.ts
client/src/api/public/storeCheckout.ts
```

Endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/checkout/preview` | Preview checkout multi-store |
| POST | `/checkout/create-multi-store` | Create order multi-store |

`createMultiStoreCheckoutOrder` payload konseptual:

```text
cartId?
shippingAddressId?
checkoutRequestKey?
useDefaultShipping?
customer?
shippingDetails?
couponCode?
groupCoupons?
```

`previewCheckoutByStore` payload saat ini minimal/optional:

```text
cartId?
shippingAddressId?
```

Frontend checkout harus membaca preview untuk:

```text
grouping per store
payment profile readiness
QRIS/static payment data
invalid item/variant/stock state
totals/subtotal/shipping/discount
coupon eligibility
checkout mode SINGLE_STORE/MULTI_STORE
```

### 10.6 Orders dan payments

Client modules:

```text
client/src/api/storeOrders.ts
client/src/api/public/storeOrders.ts
client/src/api/orderPayments.ts
```

Endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/store/my/orders` | List order buyer/account |
| GET | `/store/orders/my/:id` | Detail order buyer/account |
| GET | `/store/orders/:ref` | Public tracking by ref/invoice |
| GET | `/orders/:orderId/checkout-payment` | Grouped payment/order read model |
| GET | `/payments/:paymentId` | Payment detail |
| POST | `/payments/:paymentId/proof` | Submit proof payment |
| POST | `/payments/:paymentId/cancel` | Cancel payment/order jika contract mengizinkan |
| GET | `/store/orders/:ref/stripe/session` | Verify Stripe checkout session compatibility |
| POST | `/store/orders/:ref/stripe/session` | Create Stripe checkout session compatibility |

Guardrail:

- UI action harus mengikuti `availableActions`, `proofActionability`, `cancelability`, `contract`, dan read model backend.
- Jangan menampilkan upload proof/cancel hanya berdasarkan string status sederhana.

### 10.7 Account, profile, notification, address

Client modules:

```text
client/src/api/userMe.ts
client/src/api/userPassword.ts
client/src/api/userAddresses.ts
client/src/api/userNotifications.ts
```

Endpoint:

| Area | Endpoint |
|---|---|
| Account session | `GET /auth/account/me` |
| Account logout | `POST /auth/logout` |
| Profile read/update | `GET /user/me`, `PUT /user/me`, `PUT /store/profile` |
| Profile image upload | `POST /upload` |
| Change password | `POST /user/change-password` |
| Addresses | `GET /user/addresses`, `GET /user/addresses/default`, `POST /user/addresses`, `PUT /user/addresses/:id`, `DELETE /user/addresses/:id` |
| Notifications | `GET /user/notifications`, `GET /user/notifications/unread-count`, `POST/PATCH /user/notifications/:id/read`, `POST/PATCH /user/notifications/read-all`, `DELETE /user/notifications/:id`, `DELETE /user/notifications` |

### 10.8 Auth/register/reset

Client module:

```text
client/src/api/storeAuth.ts
client/src/pages/store/StoreLoginPage.jsx
```

Endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/auth/login` | Buyer/account login |
| POST | `/auth/register` | Register account |
| POST | `/auth/register/resend-otp` | Resend registration OTP |
| POST | `/auth/register/verify-otp` | Verify registration OTP |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Confirm reset password |

Catatan:

- `StoreLoginPage` tidak memakai `storeAuth.ts` untuk login; ia langsung memanggil `api.post('/auth/login')` agar bisa mengatur cart merge/pending add.

### 10.9 Store application dan seller invitations

Client modules:

```text
client/src/api/userStoreApplications.ts
client/src/api/userStoreInvitations.ts
client/src/api/sellerInvitations.ts
client/src/api/sellerWorkspace.ts
```

Endpoint store application:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/user/store-applications/current` | Current application |
| GET | `/user/store-applications/:applicationId` | Detail application |
| POST | `/user/store-applications/draft` | Create draft |
| PATCH | `/user/store-applications/:applicationId/draft` | Update draft |
| POST | `/user/store-applications/:applicationId/submit` | Submit |
| POST | `/user/store-applications/:applicationId/resubmit` | Resubmit after revision/rejection |
| POST | `/user/store-applications/:applicationId/cancel` | Cancel |

Endpoint seller invitation/account bridge:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/seller/invitations` | List invitations untuk account user |
| POST | `/seller/invitations/:memberId/accept` | Accept invitation |
| POST | `/seller/invitations/:memberId/decline` | Decline invitation |
| GET | `/seller/stores` | List store access milik user untuk dashboard/onboarding bridge |

### 10.10 Reviews

Endpoint aktif di server Storefront:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/store/my/reviews/need` | Products/orders eligible for review |
| GET | `/store/my/reviews` | My review list |
| POST | `/store/reviews` | Create review |
| PATCH | `/store/reviews/:id` | Update review |
| PUT | `/store/reviews/product/:productId` | Compatibility create/update review by product |
| POST | `/upload` | Upload image review/profile/payment proof |

Schema terkait:

```text
packages/schemas/src/reviews.ts
```

---

## 11. Auth dan Session Model

### 11.1 `AuthProvider`

File:

```text
client/src/auth/AuthContext.jsx
```

Scope:

```text
admin    // pathname starts with /admin
account  // semua route lain, termasuk Storefront/Seller compatibility hooks
```

State:

```text
accountUser
accountRole
isAccountLoading
adminUser
adminRole
isAdminLoading
currentScope
```

Storage hints:

```text
accountSessionHint
adminSessionHint
authSessionHint        // legacy account hint
authToken              // account bearer token compatibility
adminAuthToken         // admin bearer token compatibility
```

Method penting:

```text
refreshSession(options, scope)
login(email, password)   // admin login only
logout(scope)
clearSession(scope)
```

Unauthorized behavior:

- Response interceptor memicu unauthorized bus.
- `AuthProvider` menyimpan pending auth notice.
- Session dibersihkan sesuai current scope.
- Account unauthorized mereset buyer cart session sync.

### 11.2 Domain hooks

File:

```text
client/src/auth/authDomainHooks.js
```

Hooks:

```text
useAdminAuth()
useSellerAuth()
useAccountAuth()
```

Catatan:

- `useSellerAuth()` saat ini memandang authenticated non-admin sebagai seller/session compatibility. Seller workspace akses nyata tetap dicek via seller workspace APIs dan membership.
- `useAccountAuth()` menganggap admin role bukan account session.

### 11.3 `AccountGuard`

File:

```text
client/src/components/AccountGuard.jsx
```

Fungsi:

- Melindungi `/user/*` dan `/checkout/success`.
- Jika loading, render `Checking session...`.
- Jika tidak ada account session, redirect ke `/auth/login` dengan `buildLoginRedirectState`.

### 11.4 Buyer checkout auth

Checkout `/checkout` tidak berada di bawah `AccountGuard`, tetapi page checkout sendiri:

- Membaca auth hint `authToken` atau `authSessionHint`.
- Jika hint ada tapi user tidak valid setelah loading, redirect ke `/auth/login` dengan notice checkout.
- Jika user valid, refresh remote cart.
- Guest cart bisa dibuat sebelum login, tetapi final checkout membutuhkan account session.

---

## 12. Cart Architecture

### 12.1 Zustand cart store

File aktif:

```text
client/src/store/cart.store.ts
```

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

Cart item shape:

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

Line id rule:

```text
${productId}:${variantKey || 'base'}
```

### 12.2 `useCart()`

File:

```text
client/src/hooks/useCart.ts
```

Return value:

```text
cart
items
hasVariantItems
count
subtotal
hasHydrated
mode
isGuest
isLoading
error
hasInitialized
refreshCart
add
update
remove
```

Mode behavior:

- Guest mode memakai `utils/guestCart.ts`.
- Remote mode memakai `/cart` endpoint.
- `cart_remote_ok` di sessionStorage membantu sinyal remote mode.
- `pending_cart_add` menyimpan add-to-cart yang gagal 401 dari remote mode agar bisa dilanjutkan setelah login.

### 12.3 Guest cart

File:

```text
client/src/utils/guestCart.ts
```

Fungsi utama:

```text
getGuestCart
setGuestCartItems
addGuestItemSnapshot
updateGuestItem
removeGuestItem
clearGuestCart
hasGuestCartStorage
```

Guardrail:

- Guest cart harus menyimpan variant snapshot lengkap.
- Jangan kembali ke merge berdasarkan `productId` saja.

### 12.4 Cart session sync saat login

File:

```text
client/src/auth/useBuyerCartSessionSync.js
```

Fungsi:

- Sinkronisasi guest cart ke remote cart setelah account user terdeteksi.
- Menggunakan marker seperti `cartSync:lastSyncedUserId` agar tidak merge berulang tanpa perlu.
- Logout/non-user mengembalikan mode ke guest.

### 12.5 Variant caveat

Produk varian harus diperlakukan sebagai cart line unik berdasarkan:

```text
productId + variantKey / variantSelections
```

Untuk add-to-cart Storefront, gunakan:

```ts
useCart().add(productId, qty, snapshot)
```

Jangan:

- Memanggil `useCartStore` raw untuk add/update varian tanpa memastikan `lineId`.
- Menggabungkan item hanya berdasarkan `productId`.
- Update/delete remote varian tanpa `cartItemId` bila target ambigu.

---

## 13. Catalog, Home, Search, dan Product Flow

### 13.1 Home `/`

Komponen aktif:

```text
client/src/pages/store/KachaBazarDemoHomePage.jsx
```

Data/query:

```text
useCategories({ parentsOnly: true })
useCategories({ parentsOnly: false })
useProducts(...popular/featured)
useProducts(...discounted)
getStoreCustomization({ lang, include: 'home' })
getStorePublicIdentity()
fetchStoreCoupons({ storeSlug? })
```

Query keys penting:

```text
['store-customization', 'home-page', lang]
['store-public-identity', 'primary']
['store-coupons', 'home-widget', publicStoreSlug || 'primary']
```

Section umum:

- Hero banners.
- Coupon panel.
- Promo/delivery banner.
- Featured categories.
- Popular product grid.
- Discounted products.
- Daily needs/feature strip.

Guardrail:

- Home memakai fallback KachaBazar-style jika customization kosong/error.
- Jangan mengganti index route ke `StoreHomePage.jsx` tanpa keputusan produk.

### 13.2 Search `/search`

Komponen:

```text
client/src/pages/store/StoreSearchPage.jsx
```

URL params:

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

Fitur:

- Query display.
- Category filter.
- Rating filter.
- Price min/max.
- Grid/list view.
- Mobile filter drawer.
- Pagination.
- Skeleton/loading/error/empty state.
- Updating badge/background refetch.

### 13.3 Product detail `/product/:slug`

Komponen:

```text
client/src/pages/store/StoreProductDetailPage.jsx
```

Data/query:

```text
useProduct(slug)
getStoreCustomization({ lang: 'en', include: 'productSlugPage' })
useProducts(...) untuk related products
```

Query key customization:

```text
['store-customization', 'product-slug-page', 'en']
```

Variant flow:

- Normalize public product variation state.
- Build selected options.
- Resolve selected variant via `resolvePublicSelectedVariant`.
- Selected variant memengaruhi image, price, sale price, stock, SKU/barcode, purchasability.
- Add-to-cart membawa snapshot varian lengkap.

Purchasability:

- Mengutamakan backend `purchaseState.isPurchasable` bila tersedia.
- Tetap cek selected variant dan stock.
- Jika variant invalid/out of stock, tampilkan message dari `variantCheckoutErrors.js`.

Seller/store info:

- `ProductSellerInfoCard` menampilkan data vendor/store bila backend menyediakan `sellerInfo`.
- Visit store mengarah ke microsite jika `storeSlug`/href tersedia.

---

## 14. Vendor Microsite Flow

### 14.1 Store microsite `/store/:slug`

Komponen:

```text
client/src/pages/store/StoreMicrositePage.jsx
client/src/components/store/StoreMicrositeShell.jsx
```

Data/query:

```text
getStorePublicIdentityBySlug(slug)
fetchStoreProducts({ storeSlug: slug, search, page, limit })
getStoreMicrositeRichAboutBySlug(slug, { lang: 'en' })
```

Query keys:

```text
['store-public-identity', 'slug', safeSlug]
['storefront', 'products', 'store-slug', safeSlug, activeSearchQuery]
['store-customization', 'microsite-rich-about', safeSlug, 'en']
```

Fitur:

- Store hero/profile identity.
- Category/product shelves/listing scoped ke store.
- Search di microsite.
- Rich about content.
- Link ke `/store/:slug/products/:productSlug`.

### 14.2 Microsite product detail `/store/:slug/products/:productSlug`

Komponen:

```text
client/src/pages/store/StoreMicrositeProductDetailPage.jsx
```

Data/query:

```text
getStorePublicIdentityBySlug(slug)
fetchStoreProductById(productSlug, { storeSlug: slug })
```

Query keys:

```text
['store-public-identity', 'slug', safeSlug]
['storefront', 'product', 'microsite', safeSlug, safeProductSlug]
```

Guardrail:

- Microsite di luar `StoreLayout`.
- Link produk dari microsite sebaiknya mempertahankan konteks store.
- Store identity/readiness harus tetap dari backend.

---

## 15. Cart Page Flow

Komponen:

```text
client/src/pages/store/StoreCartPage.jsx
```

Fungsi:

- Menampilkan item guest/remote cart.
- Update qty/remove item.
- Menampilkan detail variant line via `getOrderItemVariantLines`.
- Checkout preflight via backend preview.
- Recovery action untuk invalid variant/item menuju product detail dengan state recovery.
- Export `StoreCartDrawer` yang dipakai `StoreLayout`.

Preflight hook:

```text
useCartCheckoutPreflight(items, enabled)
```

Query:

```text
queryKey: ['cart-checkout-preflight', checkoutSignature]
queryFn: previewCheckoutByStore()
staleTime: 10_000
retry: false
```

Guardrail:

- Cart preflight hanya warning/early validation; final checkout harus re-preview.
- Jika invalid item dari preview berisi variant issue, UI harus bantu reselect variant.
- Jangan menghitung final total order dari cart page.

---

## 16. Checkout Flow

### 16.1 Halaman checkout

Komponen:

```text
client/src/pages/store/Checkout.jsx
```

Ukuran file besar dan domain-critical. Refactor harus bertahap.

Dependency utama:

```text
useAuth/useAccount session
useCart
useCartStore
previewCheckoutByStore
createMultiStoreCheckoutOrder
quoteStoreCoupon
getStoreCustomization({ include: 'checkout' })
Indonesian region utilities
createOrderSchema from @ecommerce/schemas
```

State domain utama:

```text
firstName / lastName / email / phone
shippingForm
useDefaultShipping
paymentOptionId
paymentMethod = 'QRIS'
couponCode / appliedCouponMeta / discount
groupCouponCodes / groupCouponStates
isSubmitting / submitLockRef
paymentRedirectUrl
fieldErrors
```

### 16.2 Checkout customization

Query:

```text
['store-customization', 'checkout', 'en']
getStoreCustomization({ lang: 'en', include: 'checkout' })
```

Fallback copy tersedia melalui normalizer internal Checkout.

### 16.3 Checkout preview

Query:

```text
['checkout-preview-by-store', checkoutPreviewSignature]
previewCheckoutByStore({})
```

Enabled ketika:

```text
hasHydrated
hasCartBootstrapInitialized
hasItems
!isCartLoading
!isRemoteSyncing
hasCheckoutAuthHint
Boolean(user)
```

Preview dipakai untuk:

- `checkoutMode`: `SINGLE_STORE` atau `MULTI_STORE`.
- Group per store.
- Store/payment readiness.
- Invalid item count/details.
- Summary amount.
- Shipping/payment warnings.
- Coupon state baseline.

### 16.4 Coupon behavior

Single-store:

- Order-level field boleh digunakan.
- Quote via `/store/coupons/quote` dengan subtotal, shipping, storeId/storeSlug.
- Coupon meta disimpan sebagai `appliedCouponMeta`.

Multi-store:

- Order-level coupon ditolak.
- Coupon diterapkan per group store.
- Quote harus menghasilkan `scopeType === 'STORE'`.
- Submit payload memakai `groupCoupons: [{ storeId, couponCode }]`.

### 16.5 Create checkout order

Submit payload konseptual:

```text
customer
couponCode?
groupCoupons?
useDefaultShipping
shippingDetails?
checkoutRequestKey
```

`checkoutRequestKey` dibuat dari signature:

```text
items sorted by lineId
couponCode
groupCoupons sorted by storeId
useDefaultShipping
shippingDetails
customer
```

Setelah sukses:

1. Resolve `orderId` dan public ref/invoice.
2. Build URL:
   ```text
   /user/my-orders/:orderId/payment?checkoutCreated=true&ref=:ref
   ```
3. Clear checkout request key.
4. Clear cart.
5. Invalidate `['account', 'orders', 'my']`.
6. Navigate ke payment page.

Error handling penting:

- 401 → buyer login.
- 409/invalid item → tampilkan pesan backend dan recovery jika tersedia.
- Preview mismatch → jangan submit.
- Payment readiness blocker → jangan submit.

---

## 17. Order, Payment, dan Tracking Flow

### 17.1 Account order list

Komponen:

```text
client/src/pages/account/AccountOrdersPage.jsx
client/src/pages/account/AccountOrders2026View.jsx
client/src/pages/account/accountOrders2026Adapter.js
```

Query:

```text
['account', 'orders', 'my', page]
fetchStoreMyOrders({ page })
```

Polling:

- Refetch interval 15 detik jika ada order yang belum final menurut `isOrderContractFinal` atau ada visible `paymentEntry`.

### 17.2 Account order detail

Komponen:

```text
client/src/pages/account/AccountOrderDetailPage.jsx
client/src/pages/account/AccountOrderDetail2026View.jsx
client/src/pages/account/accountOrderDetail2026Adapter.js
```

Query:

```text
['account', 'orders', id]                  // /store/orders/my/:id
['account', 'orders', 'grouped', id]       // /orders/:id/checkout-payment
```

Polling:

- Order detail polling 15 detik sampai order contract final.
- Grouped order polling 15 detik jika split operational truth belum final.

### 17.3 Account payment page

Komponen:

```text
client/src/pages/account/AccountOrderPaymentPage.jsx
client/src/pages/account/AccountOrderPayment2026View.jsx
client/src/pages/account/accountOrderPayment2026Adapter.js
```

API:

```text
fetchOrderCheckoutPayment(orderId)
fetchPaymentDetail(paymentId)
submitPaymentProof(paymentId, payload)
cancelPaymentTransaction(paymentId)
uploadPaymentProofImage(file)
```

Fungsi:

- Tampilkan grouped payment read model.
- Tampilkan QRIS/payment instruction.
- Upload proof bila `proofActionability.canStartProof` true.
- Cancel payment bila `cancelability.canCancel` true.
- Invalidate query setelah mutation.

### 17.4 Public order tracking `/order/:ref`

Komponen:

```text
client/src/pages/store/StoreOrderTrackingPage.jsx
client/src/pages/store/StoreOrderTracking2026View.jsx
client/src/pages/store/storeOrderTracking2026Adapter.js
```

API:

```text
GET /store/orders/:ref
```

Fitur:

- Public tracking by ref/invoice tanpa login.
- Timeline order/shipment.
- Shipment summary per suborder/store.
- Invoice/print/download behavior.
- Payment entry/CTA jika backend memberikan visibility target.

### 17.5 Checkout success `/checkout/success`

Komponen:

```text
client/src/pages/store/StoreCheckoutSuccessPage.jsx
```

Catatan:

- Dilindungi `AccountGuard`.
- QRIS checkout normal lebih sering mengarah ke `/user/my-orders/:id/payment`.
- Success page tetap penting untuk Stripe/session compatibility atau readback order success.

---

## 18. Account Area Flow

### 18.1 Dashboard

Komponen:

```text
client/src/pages/account/AccountDashboardPage.jsx
client/src/pages/account/AccountDashboard2026View.jsx
```

Query:

```text
['account', 'orders', 'my', 'dashboard']
['user', 'store-application', 'current']
['seller', 'workspace', 'stores']
['user', 'notifications', 'unread-count']
['seller', 'invitations']
['user', 'addresses']
```

Fungsi:

- Ringkasan order.
- Recent orders.
- Notification count.
- Address readiness.
- Buyer → seller onboarding bridge.
- Store application status/readiness.
- Seller workspace access if user already has stores.

### 18.2 My account

Komponen:

```text
AccountMyAccountPage.jsx
AccountMyAccount2026View.jsx
accountMyAccount2026Adapter.js
```

Fungsi:

- Account overview/profile snapshot.
- CTA menuju update profile, address, password, orders, support.

### 18.3 Update profile

Komponen:

```text
AccountProfilePage.jsx
AccountUpdateProfile2026View.jsx
accountUpdateProfile2026Adapter.js
```

API:

```text
GET /auth/account/me
GET /user/addresses/default
PUT /store/profile
POST /upload
```

Catatan:

- Profile update aktif di page ini memakai `PUT /store/profile` untuk compatibility account/customer profile.
- Upload image mengembalikan URL dari `/upload` lalu user perlu save untuk persist.

### 18.4 Shipping addresses

Komponen:

```text
AccountShippingAddressPage.jsx
AccountShippingAddress2026View.jsx
accountShippingAddress2026Adapter.js
```

API:

```text
GET /user/addresses
GET /user/addresses/default
POST /user/addresses
PUT /user/addresses/:id
DELETE /user/addresses/:id
```

Fitur:

- Saved address list.
- Default address.
- Region selector Indonesia.
- Edit via query param `id`.

### 18.5 Change password

Komponen:

```text
AccountChangePasswordPage.jsx
AccountChangePassword2026View.jsx
accountChangePassword2026Adapter.js
```

API:

```text
POST /user/change-password
```

Behavior:

- Validasi form di adapter.
- Setelah sukses, simpan pending auth notice, logout, dan redirect ke `/auth/login`.

### 18.6 Store invitations

Komponen:

```text
AccountStoreInvitationsPage.jsx
```

API:

```text
GET /seller/invitations
POST /seller/invitations/:memberId/accept
POST /seller/invitations/:memberId/decline
```

Fungsi:

- Account user bisa menerima/menolak undangan menjadi member seller workspace.
- Invitation state mendukung pending/expired/actionable.

### 18.7 Store application

Komponen:

```text
AccountStoreApplicationPage.jsx
StoreApplicationWizard2026.jsx
StoreApplicationReview2026.jsx
```

Application steps:

```text
owner_identity
store_information
operational_address
payout_payment
compliance
review
```

Status:

```text
draft
submitted
under_review
revision_requested
approved
rejected
cancelled
```

API:

```text
GET /user/store-applications/current
GET /user/store-applications/:applicationId
POST /user/store-applications/draft
PATCH /user/store-applications/:applicationId/draft
POST /user/store-applications/:applicationId/submit
POST /user/store-applications/:applicationId/resubmit
POST /user/store-applications/:applicationId/cancel
GET /seller/stores
```

Guardrail:

- Store application workflow harus mengikuti backend `workflow` flags: `canEdit`, `canSubmit`, `canResubmit`, `canCancel`.
- Setelah approved/activation, dashboard/store application harus sinkron dengan Seller Workspace access.
- Jangan bypass Admin review dengan membuat store langsung dari client.

### 18.8 Notifications

Komponen:

```text
AccountNotificationsPage.jsx
```

API:

```text
GET /user/notifications
GET /user/notifications/unread-count
POST /user/notifications/:id/read
POST /user/notifications/read-all
DELETE /user/notifications/:id
DELETE /user/notifications
```

### 18.9 Reviews

Komponen:

```text
AccountMyReviewPage.jsx
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

Guardrail:

- Eligibility review harus dari backend.
- Limit/shape review image mengikuti shared schema/backend.
- Jangan membuat UI review tanpa order eligibility check.

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

- Rich text privacy/terms/about/FAQ harus disanitasi sebelum render.
- Jangan render HTML baru dari admin customization tanpa sanitizer.

Fallback behavior:

- Jika customization kosong/error, page tetap render fallback copy/default section.
- Error state harus user-friendly dan tidak merusak `StoreLayout`.

---

## 20. Shared Types dan Contract Penting

File:

```text
client/src/api/store.types.ts
```

### 20.1 `StoreCategory`

Field penting:

```text
id
name
slug
code
image
parentId / parent_id
published
```

### 20.2 `StoreProduct`

Field penting:

```text
id
name
price
seo
slug
routeSlug
productHref
sku
imageUrl
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
stock
preOrder
preorderDays
weight
condition
variations
purchaseState
status
published
createdAt
updatedAt
```

### 20.3 `StorefrontProductSellerInfo`

Field penting:

```text
storeId
name
slug
logoUrl
shortDescription
status
operationalReadiness
productCount
ratingAverage
ratingCount
followerCount
responseRate
responseTimeLabel
joinedAt
canVisitStore
visitStoreHref
canChat
chatMode
chatHref
chatLabel
chatHelper
```

### 20.4 `StoreCoupon`

Field penting:

```text
id
code
campaignName
discountType
amount
minSpend
published
bannerImageUrl
scopeType
storeId
store
scopeLabel
applicabilityNote
status
isPubliclyRedeemable
startsAt
expiresAt
createdAt
updatedAt
```

### 20.5 `StoreCouponQuoteResponse`

Field penting:

```text
valid
reason
message
code
discount
discountType
discountValue
minSpend
scopeType
storeId
startsAt
expiresAt
subtotal
shipping
total
```

### 20.6 `StoreCheckoutPreviewResponse`

Field penting:

```text
success
data.checkoutMode
data.summary.totalItems
data.summary.subtotalAmount
data.summary.shippingAmount
data.summary.grandTotal
data.summary.invalidItemCount
data.groups
data.invalidItems
message
```

Group fields:

```text
storeId
storeName
storeSlug
subtotalAmount
shippingAmount
totalAmount
paymentAvailable
paymentMethod
paymentProfileStatus
paymentProfileStatusMeta
paymentAvailabilityMeta
merchantName
accountName
qrisImageUrl
qrisPayload
paymentInstruction
warning
items
```

### 20.7 `PublicStoreIdentity`

Field penting:

```text
name
slug
description
logoUrl
bannerUrl
email
phone
whatsapp
websiteUrl
instagramUrl
tiktokUrl
addressLine1
addressLine2
city
province
postalCode
country
summary
contract
createdAt
updatedAt
```

### 20.8 `PublicStoreSettings`

Field penting:

```text
payments
socialLogin
analytics
chat
branding
```

---

## 21. Source of Truth dan Read Model Rules

### 21.1 Backend source of truth

Domain berikut harus selalu mengikuti backend:

```text
stock
variant availability
purchaseState
public visibility
store readiness
coupon validity
coupon scope
checkout totals
shipping fee
payment profile readiness
payment lifecycle
order lifecycle
shipment/tracking lifecycle
available actions
store application workflow
seller invitation state
```

### 21.2 Frontend read model utilities

Utility seperti:

```text
splitOperationalTruth
groupedPaymentReadModel
orderContract
orderTruth
storeOnboardingPresentation
variantCheckoutErrors
storefrontCatalog
```

Boleh dipakai untuk:

- Normalisasi response lama/baru.
- Membuat UI tidak crash saat field optional/null.
- Presentasi label/status/tone.
- Mapping data ke view 2026.

Tidak boleh dipakai untuk:

- Menciptakan lifecycle baru.
- Mengizinkan action yang tidak diizinkan backend.
- Menghitung final total checkout/order/payment.
- Mengabaikan stock/variant/coupon/payment readiness backend.

---

## 22. Sinkronisasi dengan Admin Workspace

Admin Workspace memengaruhi Storefront lewat domain:

| Admin domain | Dampak Storefront |
|---|---|
| Store Customization | Home, header/footer, static pages, checkout copy, dashboard labels, SEO |
| Store Settings | Payment/social login/analytics/chat/branding settings |
| Product/Catalog | Produk, kategori, atribut/varian, stock, purchase state |
| Coupons | Public offers dan checkout coupon eligibility |
| Store Applications | Buyer-to-seller onboarding status dan approval |
| Payment Profiles | Checkout QRIS/payment availability per store |
| Shipping/Order Ops | Checkout readiness, tracking, order lifecycle |
| Payment Audit | Payment state/review truth yang muncul ke buyer |

Arahan:

- Cek apakah data Storefront berasal dari Admin customization/settings sebelum hardcode UI copy.
- Admin fallback boleh ada, tetapi bukan alasan mengabaikan data real.
- Bila mengubah contract DTO, cek Admin/Seller/Storefront global search.

---

## 23. Sinkronisasi dengan Seller Workspace

Seller Workspace memengaruhi Storefront lewat domain:

| Seller domain | Dampak Storefront |
|---|---|
| Store Profile / Storefront / Microsite | `/store/:slug`, seller card di product detail |
| Catalog Products | Product listing/detail/search/cart/checkout |
| Categories / Attributes / Attribute Values | Filter, variant, product metadata |
| Coupons | Store-scoped promotions dan group coupon checkout |
| Orders | Fulfillment/tracking status |
| Payment Profile | Payment available/tidak available di checkout |
| Team/Permissions | Tidak langsung ke Storefront, tetapi menentukan siapa yang mengubah data seller |

Arahan:

- Storefront harus membaca output seller/admin/backend, bukan menulis langsung ke domain seller kecuali invitation/application flow.
- Public microsite harus menghormati status/visibility/readiness store dari backend.
- Buyer account dashboard boleh menampilkan bridge ke seller workspace jika `/seller/stores` menunjukkan akses.

---

## 24. QA dan Validation Checklist

### 24.1 Build/check dasar

```bash
pnpm install
pnpm -F client build
pnpm -F server build
```

Jika menyentuh checkout/coupon/variant/order/payment:

```bash
pnpm -F server smoke:checkout-coupons
pnpm -F server smoke:checkout-variants
pnpm -F server smoke:order-payment
pnpm -F server smoke:shipment-regression
```

Jika menyentuh store application/onboarding:

```bash
pnpm -F server smoke:store-application
pnpm -F server smoke:store-application-activation
```

Jika menyentuh public visibility/catalog:

```bash
pnpm -F server smoke:product-visibility
pnpm -F server smoke:store-readiness
pnpm qa:mvf:visibility:frontend
```

### 24.2 Smoke route Storefront minimal

```text
/
/demo/kachabazar       // dev only
/search
/product/:slug
/cart
/checkout
/order/:ref
/auth/login
/auth/register
/user/dashboard
/user/my-orders
/user/my-orders/:id
/user/my-orders/:id/payment
/user/shipping-address
/user/store-application
/store/:slug
/store/:slug/products/:productSlug
```

### 24.3 Manual/Playwright scenarios

1. Home render tanpa console error.
2. Header/search/cart badge bekerja di light dan dark mode.
3. Search filter/sort/pagination mengubah query param dan data query.
4. Product detail bisa select variant dan add to cart.
5. Guest cart bertahan setelah reload.
6. Login buyer memicu merge guest cart/pending add.
7. Cart page menampilkan preflight warning bila backend menolak item.
8. Invalid variant cart line bisa recovery/reselect.
9. Checkout authenticated memanggil preview sebelum create order.
10. Multi-store cart menghasilkan group per store.
11. Store coupon hanya valid di group store terkait.
12. Order payment page mengikuti available actions backend.
13. Upload proof/cancel payment hanya muncul jika actionability mengizinkan.
14. Public tracking `/order/:ref` tidak membutuhkan login.
15. Microsite `/store/:slug` tidak bergantung pada `StoreLayout`.
16. Static pages tetap render saat customization kosong/error.
17. Analytics/chat tidak inject script saat test/QA mode.
18. Theme `light/dark/system` persist di `tp_storefront_theme` dan mengubah class `dark`.
19. Store application draft/submit/resubmit/cancel mengikuti backend workflow flags.
20. User notifications read/delete/clear tidak mematahkan unread count.

### 24.4 Regresi yang wajib dihindari

- Mengubah `/category/:slug` tanpa menjaga redirect ke search.
- Mematahkan `/store/:slug` karena diasumsikan berada di `StoreLayout`.
- Menghitung final total checkout di client tanpa backend preview.
- Menampilkan upload/cancel payment tanpa available action/actionability backend.
- Membuang `variantKey`, `variantSelections`, atau `cartItemId` saat cart/checkout.
- Menggunakan admin auth flow untuk buyer login.
- Membuat theme provider/store kedua.
- Menghapus wrapper `client/src/api/public/*.ts` tanpa mengganti semua import.
- Menggunakan folder `.tmp/` atau `_archive/` sebagai sumber route aktif.

---

## 25. Known Caveats / Technical Debt

1. **`StoreHomePage.jsx` ada tetapi route index memakai `KachaBazarDemoHomePage`.** Perlakukan sebagai legacy/alternative sampai route map diubah sadar.
2. **`StoreCategoryPage.jsx` ada tetapi category route redirect ke search.** Hindari dua UX category paralel tanpa keputusan produk.
3. **`Checkout.jsx` sangat besar.** Refactor harus bertahap: extract hook/read-model/component kecil dan smoke setiap langkah.
4. **Cart variant matching sensitif.** Jangan merge item hanya berdasarkan productId.
5. **API public wrapper dan top-level module harus sinkron.** Banyak import Storefront memakai `client/src/api/public/*`.
6. **Order/payment truth multi-sumber.** Pertahankan helper defensif untuk backward compatibility.
7. **Coupon domain masih perlu backend contract untuk pembatasan lanjutan.** Area seperti usage limit, max discount, product/category restriction, redemption ledger, dan global code uniqueness harus dipastikan di backend sebelum UI final.
8. **Auth scope admin/account rawan tertukar.** Buyer/account login tidak boleh memakai `AuthProvider.login()` karena method itu admin-oriented.
9. **Account 2026 view tersebar antara container, adapter, CSS.** Saat redesign account, cari `*2026View`, `*2026Adapter`, dan CSS terkait.
10. **Theme dark mode belum otomatis membuat semua legacy UI sempurna.** Komponen baru wajib dark-ready, tetapi komponen lama mungkin masih perlu audit class.
11. **Sidebar AccountLayout belum memasukkan Store Application sebagai nav item.** Route ada, tetapi akses UI bisa via dashboard/direct link.
12. **Folder `.tmp/` dan `_archive/` berisi artefak lama/slicing.** Jangan jadikan sebagai active source kecuali task khusus.

---

## 26. File/Fungsi Prioritas Saat Modifikasi Storefront

### 26.1 Routing/layout/theme

```text
client/src/main.jsx
client/src/App.jsx
client/src/theme/ThemeProvider.jsx
client/src/components/store/ThemeToggle.jsx
client/src/components/Layout/StoreLayout.jsx
client/src/components/Layout/MobileMenuDrawer.jsx
client/src/layouts/AccountLayout.jsx
```

### 26.2 Home/search/product

```text
client/src/pages/store/KachaBazarDemoHomePage.jsx
client/src/pages/store/StoreSearchPage.jsx
client/src/pages/store/StoreProductDetailPage.jsx
client/src/storefront.jsx
client/src/api/storeProducts.ts
client/src/api/public/storeProducts.ts
client/src/api/store.types.ts
client/src/utils/storefrontCatalog.ts
client/src/utils/productImage.js
```

### 26.3 Microsite

```text
client/src/pages/store/StoreMicrositePage.jsx
client/src/pages/store/StoreMicrositeProductDetailPage.jsx
client/src/components/store/StoreMicrositeShell.jsx
client/src/api/storePublicIdentity.ts
client/src/api/storeCustomizationPublic.ts
```

### 26.4 Cart/checkout

```text
client/src/pages/store/StoreCartPage.jsx
client/src/pages/store/Checkout.jsx
client/src/hooks/useCart.ts
client/src/store/cart.store.ts
client/src/auth/useBuyerCartSessionSync.js
client/src/utils/cartSync.ts
client/src/utils/guestCart.ts
client/src/api/cartApi.ts
client/src/api/storeCheckout.ts
client/src/api/storeCoupons.ts
client/src/utils/variantCheckoutErrors.js
client/src/utils/orderVariantPresentation.js
```

### 26.5 Order/payment/tracking

```text
client/src/pages/account/AccountOrdersPage.jsx
client/src/pages/account/AccountOrders2026View.jsx
client/src/pages/account/accountOrders2026Adapter.js
client/src/pages/account/AccountOrderDetailPage.jsx
client/src/pages/account/AccountOrderDetail2026View.jsx
client/src/pages/account/accountOrderDetail2026Adapter.js
client/src/pages/account/AccountOrderPaymentPage.jsx
client/src/pages/account/AccountOrderPayment2026View.jsx
client/src/pages/account/accountOrderPayment2026Adapter.js
client/src/pages/store/StoreOrderTrackingPage.jsx
client/src/pages/store/StoreOrderTracking2026View.jsx
client/src/pages/store/storeOrderTracking2026Adapter.js
client/src/api/storeOrders.ts
client/src/api/orderPayments.ts
client/src/utils/groupedPaymentReadModel.ts
client/src/utils/splitOperationalTruth.ts
client/src/utils/orderContract.ts
client/src/utils/orderTruth.js
```

### 26.6 Account/auth/profile/address

```text
client/src/auth/AuthContext.jsx
client/src/auth/authDomainHooks.js
client/src/components/AccountGuard.jsx
client/src/pages/store/StoreLoginPage.jsx
client/src/pages/store/StoreRegisterPage.jsx
client/src/pages/store/StoreForgotPasswordPage.jsx
client/src/pages/store/StoreResetPasswordPage.jsx
client/src/pages/account/AccountDashboardPage.jsx
client/src/pages/account/AccountMyAccountPage.jsx
client/src/pages/account/AccountProfilePage.jsx
client/src/pages/account/AccountShippingAddressPage.jsx
client/src/pages/account/AccountChangePasswordPage.jsx
client/src/api/storeAuth.ts
client/src/api/userMe.ts
client/src/api/userPassword.ts
client/src/api/userAddresses.ts
```

### 26.7 Store application / seller bridge

```text
client/src/pages/account/AccountStoreApplicationPage.jsx
client/src/pages/account/components/StoreApplicationWizard2026.jsx
client/src/pages/account/components/StoreApplicationReview2026.jsx
client/src/pages/account/AccountStoreInvitationsPage.jsx
client/src/api/userStoreApplications.ts
client/src/api/userStoreInvitations.ts
client/src/api/sellerInvitations.ts
client/src/api/sellerWorkspace.ts
client/src/utils/storeOnboardingPresentation.ts
client/src/utils/sellerWorkspaceRoute.js
```

### 26.8 Customization/static pages

```text
client/src/api/storeCustomizationPublic.ts
client/src/pages/store/StoreAboutUsPage.jsx
client/src/pages/store/StoreContactUsPage.jsx
client/src/pages/store/StoreFaqPage.jsx
client/src/pages/store/StoreOffersPage.jsx
client/src/pages/store/StorePrivacyPolicyPage.jsx
client/src/pages/store/StoreTermsAndConditionsPage.jsx
client/src/components/SeoCustomizationBridge.jsx
```

---

## 27. Acceptance Criteria untuk Perubahan Storefront

Setiap task Storefront dianggap aman bila memenuhi kriteria berikut:

1. Route terdampak render tanpa crash.
2. Tidak ada console error baru di route utama.
3. Query key React Query stabil dan tidak menyebabkan refetch loop.
4. Loading, empty, error, dan updating state tersedia untuk data async penting.
5. 401 pada account protected flow mengarah ke `/auth/login`.
6. Guest cart dan remote cart tetap kompatibel.
7. Variant product tidak kehilangan pilihan saat add cart/checkout.
8. Cart line update/remove memakai target aman (`cartItemId` untuk remote varian jika ada).
9. Checkout memakai `/checkout/preview` sebelum create order.
10. Coupon divalidasi backend via quote dan revalidated di create checkout.
11. Order/payment actions mengikuti backend `availableActions`, `proofActionability`, `cancelability`, atau contract.
12. Microsite route tetap tidak bergantung pada `StoreLayout`.
13. Static/customized rich HTML tetap disanitasi.
14. Theme dark/light/system tetap memakai `ThemeProvider` global.
15. `pnpm -F client build` lulus.
16. Jika menyentuh API contract, `pnpm -F server build` juga lulus.
17. Jika menyentuh checkout/order/payment/coupon/variant, jalankan smoke terkait.
18. Dokumentasi/report diperbarui bila perubahan besar.

---

## 28. Prompt Konteks Singkat untuk AI Berikutnya

Gunakan konteks berikut saat meminta AI/Codex mengerjakan Storefront:

```text
Anda bekerja pada repo tp-preneurs-multivendor-main, fokus Client / Storefront. Storefront berada di client/src dan berbagi aplikasi dengan Admin Workspace dan Seller Workspace. Root app memakai React + Vite + React Router + React Query + Zustand, dan dibungkus ThemeProvider untuk light/dark/system theme. Route publik utama ada di client/src/App.jsx di bawah StoreLayout. Home aktif adalah KachaBazarDemoHomePage, search di /search, product detail di /product/:slug, cart di /cart, checkout di /checkout, account dashboard di /user/*, dan vendor microsite di /store/:slug yang berada di luar StoreLayout.

Backend adalah source of truth untuk catalog purchasability, stock, variant availability, coupon validity, checkout totals, payment profile readiness, order/payment/shipment lifecycle, available actions, store readiness, dan store application workflow. Jangan menghitung final checkout/order/payment state sendiri di client. Gunakan API modules di client/src/api dan wrapper client/src/api/public bila file sekitar memakainya. Gunakan AuthContext/useAccountAuth untuk account session dan useCart untuk cart. Cart store aktual adalah client/src/store/cart.store.ts; pertahankan variant fields seperti variantKey, variantSelections, variantSku, variantBarcode, cartItemId, dan lineId. Jangan menghapus route/file legacy tanpa audit karena ada redirect/compatibility layer.

Banyak halaman Account memakai 2026 view + adapter: cari Account*2026View.jsx dan account*2026Adapter.js sebelum redesign. Setiap perubahan Storefront harus sinkron dengan Admin customization/settings/coupons/payment profiles/store applications dan Seller catalog/store profile/payment/order data. Jalankan minimal pnpm -F client build dan smoke route /, /search, /product/:slug, /cart, /checkout, /user/my-orders, /user/my-orders/:id/payment, /order/:ref, /store/:slug. Jika menyentuh API backend, jalankan pnpm -F server build dan smoke terkait.
```

---

## 29. Kesimpulan Arsitektur

Client / Storefront dalam repo ini adalah marketplace multi-vendor dengan lima lapisan besar:

1. **Public discovery layer:** home, search, category redirect, product detail, offers, static pages.
2. **Vendor microsite layer:** public store page dan store-scoped product detail.
3. **Buyer transaction layer:** guest/remote cart, checkout preview/create, coupon, payment, order tracking.
4. **Buyer account layer:** dashboard, orders, payment proof/cancel, reviews, notifications, addresses, profile, change password.
5. **Buyer-to-seller bridge layer:** store application, seller invitations, seller workspace access summary.

Fondasi pengembangan berikutnya harus menjaga Storefront sebagai consumer disiplin terhadap data Admin/Seller/backend. Fokus utama adalah menjaga source of truth, compatibility route lama, variant-safe cart, checkout multi-store yang backend-driven, payment/order action yang mengikuti contract, dan UI modern yang konsisten dengan theme light/dark/system.
