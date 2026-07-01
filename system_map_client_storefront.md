# system_map_client_storefront.md — Client / Storefront

**Project:** `tp-preneurs-multivendor-main`  
**Area fokus:** Client / Storefront  
**Sumber analisis:** ekstraksi langsung `tp-preneurs-multivendor-main(9).zip` + pembaruan atas `system_map_client_storefront(39).md`  
**Tanggal pembaruan:** 2026-06-27  
**Tujuan dokumen:** memberi konteks utuh kepada AI/engineer tentang arsitektur, fitur, route, API, state, dan alur aplikasi Client / Storefront agar pengembangan berikutnya tetap sinkron dengan sistem aktual di codebase.

---

## 1. Ringkasan Update dari Analisis Repo 2026-06-27

Repo yang dianalisis adalah zip terbaru `tp-preneurs-multivendor-main(9).zip`. Hasil ekstraksi memperlihatkan monorepo `tp-preneurs-multivendor-main` dengan package `client`, `server`, dan `packages/*`. Zip memuat **2.268 entry** dan hasil ekstraksi berisi **±2.051 file**. Area Client / Storefront yang relevan pada audit ini mencakup **46 file** di `client/src/pages/store`, **47 file** di `client/src/pages/account`, **92 file** di `client/src/api`, **13 file** di `client/src/components/store`, **20 file** di `client/src/components/kachabazar-demo`, dan **64 file** route di `server/src/routes`.

Dokumen `system_map_client_storefront.md` yang berada di dalam repo ternyata masih identik dengan file input lama dan masih bertanggal 2026-06-20. Karena itu, pembaruan ini mempertahankan fondasi arsitektur lama yang masih valid, lalu menambahkan koreksi dari codebase aktual.

Perubahan/koreksi penting hasil audit terbaru:

1. **Route utama Client / Storefront tetap sama dan sudah diverifikasi dari `client/src/App.jsx`.** `/shop` dan `/search` tetap merender `StoreSearchPage` yang re-export ke `StoreShopPage2026`; `/product/:slug` tetap re-export ke `StoreProductDetailPage2026`; `/cart` memakai `StoreCartPage` + `StoreCart2026View`; `/checkout` tetap domain-critical di `Checkout.jsx` dengan presentasi `Checkout2026View`.
2. **Account Notifications sudah benar-benar memakai UI 2026.** `AccountNotificationsPage.jsx` sekarang memakai `notifications2026/AccountNotifications2026View.jsx` dan `notifications2026/accountNotifications2026Adapter.js`, bukan hanya list sederhana.
3. **Notification action sekarang lebih lengkap.** Halaman `/user/notifications` mendukung filter, unread-only toggle, mark one read, mark all read, delete notification, dan clear all melalui `userNotifications.ts`.
4. **Header notification preview aktif.** `StoreHeaderKacha.jsx` memakai `NotificationPreviewDropdown.jsx`, query unread count `["account", "notifications", "unread-count"]`, dan preview list `["account", "notifications", "preview", { limit: 5 }]`. Guest diarahkan ke `/auth/login`; account user bisa membuka dropdown tanpa meninggalkan halaman.
5. **Order detail punya invoice print layer.** `AccountOrderDetail2026View.jsx` memakai `invoice/accountOrderInvoiceAdapter.js` dan `invoice/AccountOrderInvoicePrint.jsx` untuk model invoice dan print-friendly hidden invoice view.
6. **Payment page 2026 memiliki action nyata.** `/user/my-orders/:id/payment` mendukung copy amount/reference, view QR, save QR image, submit payment proof via `/upload` + `/payments/:paymentId/proof`, dan cancel payment via `/payments/:paymentId/cancel`, tetapi action tetap dibatasi oleh `proofActionability` dan `cancelability` dari backend.
7. **Theme global sudah memakai token brand di `client/src/index.css`.** Token utama adalah `--tp-primary: #034c85` dan `--tp-accent: #fe6f05`; dark mode memakai `.dark` root override dan helper untuk shell `storefront`, `account`, dan `store-microsite`.
8. **`ThemeProvider` aktual memakai meta color `#07111f` untuk dark dan `#034c85` untuk light.** Storage tetap `tp_storefront_theme`, dengan pilihan `light`, `dark`, dan `system`.
9. **`StoreLayout.jsx` saat ini mengirim `brandingLogoUrl` ke `StoreHeaderKacha`, bukan seluruh `storeSettings`.** `storeSettings` tetap disediakan ke child route lewat `<Outlet context={{ storeSettings }} />`.
10. **Server mount map tetap tervalidasi.** Stripe webhook tetap dipasang pada `/api/store` sebelum `express.json()`, lalu route publik, auth, cart, checkout, orders, payments, seller, store, stores, customization, settings, dan user store applications dipasang sesuai `server/src/app.ts`.
11. **Public notifications punya compatibility endpoint.** Selain `/user/notifications/*`, `server/src/routes/public.ts` juga masih menyediakan `/notifications/*` yang dilindungi auth. Client aktif tetap memakai `/user/notifications/*`.
12. **Folder `.tmp/`, `_archive/`, artefak slicing/demo, dan file screenshot sementara tetap tidak boleh dianggap route aktif** kecuali task eksplisit meminta migrasi dari artefak tersebut.

Kesimpulan audit: dokumen 2026-06-20 masih valid sebagai fondasi, tetapi perlu disegarkan pada area notifications 2026, invoice print, payment proof/cancel UX, token theme aktual, dan catatan implementasi header notification preview.

## 2. Prinsip Umum Client / Storefront

Client / Storefront adalah aplikasi publik dan buyer-facing dalam sistem marketplace multi-vendor. Secara fisik ia berada di package `client` dan berbagi runtime dengan Admin Workspace dan Multi-Vendor Seller Workspace.

Prinsip pengembangan:

1. **Storefront bukan aplikasi fisik terpisah.** Storefront berada di `client/src` bersama admin/seller, dipisahkan oleh route, layout, guard, API boundary, dan auth scope.
2. **Backend adalah source of truth.** Frontend hanya membuat read-model defensif untuk rendering; jangan membuat kebenaran bisnis final di client.
3. **Guest browsing harus aman.** Guest boleh membuka home/shop/search/product/microsite/static pages dan memakai guest cart/wishlist lokal; checkout/account membutuhkan account session.
4. **Checkout multi-store wajib backend-driven.** Preview `/checkout/preview` harus dijadikan gate sebelum `/checkout/create-multi-store`.
5. **Route legacy harus dijaga.** `/category/*`, `/account/*`, beberapa seller/admin redirect, dan file compatibility jangan dihapus tanpa audit global.
6. **Storefront mengonsumsi output Admin dan Seller.** Admin mengatur customization/settings/coupons/payment profiles/store applications; Seller mengatur catalog/store profile/payment profile/orders; Storefront membaca hasilnya.
7. **UI baru harus dark-ready.** Root app sudah memakai `ThemeProvider`; komponen baru wajib mempertimbangkan class `dark:*` atau CSS dark equivalent.
8. **Bahasa UI aktif mayoritas Inggris.** Pertahankan copy fitur Storefront dalam bahasa Inggris, kecuali format regional seperti Rupiah/Indonesia address memang dibutuhkan.

---

## 3. Stack, Workspace, dan Runtime

### 3.1 Monorepo

Root `package.json` memakai workspace:

```text
server
client
packages/*
```

Script root penting:

```bash
pnpm dev
pnpm dev:client
pnpm dev:server
pnpm build
pnpm qa:mvf
pnpm qa:mvf:visibility
pnpm qa:staging:core
pnpm qa:public-release
pnpm qa:e2e:truth
pnpm qa:e2e:shipment-reconciliation
pnpm qa:shipping:release
pnpm qa:auth:frontend
pnpm qa:admin:public-auth
pnpm qa:admin:staff
pnpm qa:ui
```

### 3.2 Frontend stack

Package: `client`

Teknologi utama:

```text
React 19.1.1
React DOM 19.1.1
Vite 7.1.2
TypeScript ~5.8.3
React Router DOM 7.8.2
TanStack React Query 5.85.6
Zustand 5.0.8
Axios 1.11.0
Zod 4.1.5
@ecommerce/schemas local package
Tailwind CSS v4 tooling
lucide-react, react-icons, framer-motion, recharts, sonner, react-hot-toast,
html2canvas, jspdf, dayjs, react-hook-form, react-dropzone, tailwind-merge, clsx
```

Script client:

```bash
pnpm -F client dev
pnpm -F client build
pnpm -F client build:analyze
pnpm -F client lint
pnpm -F client preview
```

### 3.3 Backend stack relevan

Package: `server`

Teknologi utama:

```text
Express 4.21.2
TypeScript 5.6.3
Sequelize 6.37.3
MySQL2
Stripe 21.0.1
cookie-parser, cors, jsonwebtoken, bcrypt/bcryptjs, multer, nodemailer
```

Smoke script server yang penting untuk Storefront:

```bash
pnpm -F server smoke:product-visibility
pnpm -F server smoke:store-readiness
pnpm -F server smoke:order-payment
pnpm -F server smoke:checkout-coupons
pnpm -F server smoke:checkout-variants
pnpm -F server smoke:shipment-regression
pnpm -F server smoke:client-registration-otp
pnpm -F server smoke:user-change-password
pnpm -F server smoke:store-customization-right-box
pnpm -F server smoke:store-customization-seo
pnpm -F server smoke:store-customization-checkout
pnpm -F server smoke:store-customization-about-us
pnpm -F server smoke:store-customization-contact-us
pnpm -F server smoke:store-customization-dashboard-setting
pnpm -F server smoke:store-customization-faq
pnpm -F server smoke:store-customization-offers
pnpm -F server smoke:store-customization-our-team
pnpm -F server smoke:store-settings
pnpm -F server smoke:store-application
pnpm -F server smoke:store-application-activation
pnpm -F server smoke:profile-image-sync
```

---

## 4. Vite, Entry Point, dan Root Providers

### 4.1 `client/vite.config.ts`

Konfigurasi penting:

- Alias `@` → `client/src`.
- Dev server default `5173`, `strictPort: false`.
- Proxy:
  - `/api` → `http://${VITE_PROXY_API_HOST || localhost}:${VITE_PROXY_API_PORT || 3001}`
  - `/uploads` → backend yang sama.
- Manual chunks:
  - `vendor-react`
  - `vendor-router`
  - `vendor-query`
  - `vendor-ui`
  - `vendor-utils`
  - `vendor-misc`
- Mode `analyze` mengaktifkan `rollup-plugin-visualizer` dengan output `dist/stats.html`.

Implikasi:

- Client API harus memakai path relatif `/api` melalui axios `baseURL`.
- Asset upload backend bisa dipanggil via `/uploads/...` atau URL yang dinormalisasi utility.
- Jangan mengubah proxy atau API prefix tanpa cek `server/src/app.ts`.

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

Catatan penting:

- `ThemeProvider` membungkus seluruh client shell.
- `MutationCache` global toast dibatasi hanya untuk Admin dan Seller workspace. Storefront cart/checkout/order tidak sebaiknya bergantung pada toast global tersebut.
- `ReactQueryDevtools` ada sebagai dependency tetapi tidak aktif di `main.jsx`.

### 4.3 `client/src/App.jsx`

`App.jsx` adalah pusat routing seluruh workspace:

- Membungkus route dengan `AuthProvider`.
- Menjalankan `ScrollToTopOnRouteChange`.
- Menjalankan `SeoCustomizationBridge`.
- Menggunakan `Suspense` fallback `Loading...`.
- Memuat route Storefront, Account, Microsite, Seller, dan Admin.

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

DOM behavior aktual:

- Toggle class `dark` di `document.documentElement`.
- Set `data-theme` sesuai resolved theme.
- Set `data-theme-preference` sesuai preferensi user.
- Set `style.colorScheme` sesuai resolved theme.
- Update `<meta name="theme-color">` ke `#07111f` untuk dark dan `#034c85` untuk light.

Token global aktif berada di `client/src/index.css`:

```text
--tp-primary: #034c85;
--tp-primary-strong: #013d70;
--tp-primary-soft: #eaf3fb;
--tp-primary-rgb: 3 76 133;

--tp-accent: #fe6f05;
--tp-accent-strong: #d95b00;
--tp-accent-soft: #fff3e8;
--tp-accent-rgb: 254 111 5;
```

Dark mode override:

```text
.dark {
  --tp-bg: #07111f;
  --tp-surface: #0d1b2c;
  --tp-surface-soft: #13253a;
  --tp-border: #263a51;
  --tp-text: #e7f1ff;
  --tp-muted: #9dafc6;
}
```

Guardrail:

- Jangan membuat `ThemeProvider` kedua.
- Jangan hardcode warna lama seperti emerald/green untuk primary action baru.
- Komponen Storefront/Account/Microsite baru wajib memakai token `--tp-*`, class Tailwind `dark:*`, atau CSS dark override yang konsisten.

### 5.2 `client/src/components/store/ThemeToggle.jsx`

Variant UI:

```text
icon
menu
segmented
```

Tempat pemakaian aktif:

- `StoreHeaderKacha.jsx` sebagai icon toggle di header.
- `MobileMenuDrawer.jsx`.
- `AccountLayout.jsx`.
- `HeaderActions.jsx` untuk header action variant lama/kompatibilitas.

Guardrail:

- Jangan membuat local theme context/store baru.
- Gunakan `useTheme()` dari `ThemeProvider`.
- Komponen Storefront baru harus mendukung dark mode jika berada dalam shell publik/account.

---

## 6. Struktur Folder Storefront Aktif

### 6.1 Halaman Storefront

Folder utama:

```text
client/src/pages/store
```

File aktif/penting:

```text
Checkout.jsx
CheckoutSuccess.jsx                     // legacy/compatibility
KachaBazarDemoHomePage.jsx
StoreAboutUsPage.jsx
StoreCartPage.jsx
StoreCategoryPage.jsx                   // file ada, route category redirect
StoreCheckoutSuccessPage.jsx
StoreContactUsPage.jsx
StoreFaqPage.jsx
StoreForgotPasswordPage.jsx
StoreHomePage.jsx                       // file ada, index route tidak memakainya
StoreLoginPage.jsx
StoreMicrositePage.jsx
StoreMicrositeProductDetailPage.jsx
StoreOffersPage.jsx
StoreOrderTracking2026View.jsx
StoreOrderTrackingPage.jsx
StorePrivacyPolicyPage.jsx
StoreProductDetailPage.jsx              // re-export ke StoreProductDetailPage2026
StoreProductDetailPage2026.jsx
StoreRegisterPage.jsx
StoreResetPasswordPage.jsx
StoreSearchPage.jsx                     // re-export ke StoreShopPage2026
StoreShopPage2026.jsx
StoreTermsAndConditionsPage.jsx
StoreWishlistPage2026.jsx
cart2026/StoreCart2026View.jsx
cart2026/storeCart2026Adapter.js
checkout2026/Checkout2026View.jsx
checkout2026/checkout2026Adapter.js
forgotPassword2026/StoreForgotPassword2026View.jsx
login2026/StoreLogin2026View.jsx
register2026/StoreRegister2026View.jsx
```

Catatan:

- Route index `/` memakai `KachaBazarDemoHomePage`, bukan `StoreHomePage.jsx`.
- `/shop` dan `/search` memakai `StoreShopPage2026` melalui `StoreSearchPage.jsx`.
- `/product/:slug` memakai `StoreProductDetailPage2026` melalui re-export.
- `/cart` memakai container `StoreCartPage.jsx` + view/adapter `cart2026`.
- `/checkout` masih memakai container besar `Checkout.jsx`, tetapi presentasi memakai `Checkout2026View`.
- `/auth/reset-password` belum memakai folder 2026 khusus; jangan asumsi semua auth page sudah 2026.

### 6.2 Account pages aktif

Folder:

```text
client/src/pages/account
```

Container aktif:

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

View/adapter 2026 penting:

```text
AccountDashboard2026View.jsx
AccountOrders2026View.jsx
AccountOrderDetail2026View.jsx
AccountOrderPayment2026View.jsx
AccountMyAccount2026View.jsx
AccountShippingAddress2026View.jsx
AccountUpdateProfile2026View.jsx
AccountChangePassword2026View.jsx
account*2026Adapter.js
components/StoreApplicationWizard2026.jsx
components/StoreApplicationReview2026.jsx
```

Tambahan penting dari audit 2026-06-27:

```text
notifications2026/AccountNotifications2026View.jsx
notifications2026/accountNotifications2026Adapter.js
notifications2026/account-notifications-2026.css
invoice/AccountOrderInvoicePrint.jsx
invoice/accountOrderInvoiceAdapter.js
invoice/account-order-invoice.css
```

Catatan:

- Banyak `*Page.jsx` adalah container/data layer yang mengirim props ke view 2026.
- `/user/notifications` sekarang punya view/adapter 2026 terpisah.
- `/user/my-orders/:id` sekarang menyiapkan model invoice print di view 2026.
- Saat redesign account, cari container, view, adapter, CSS, dan subfolder fitur terkait (`notifications2026`, `invoice`, `components`).

### 6.3 Layout dan shell

```text
client/src/components/Layout/StoreLayout.jsx
client/src/components/Layout/MobileMenuDrawer.jsx
client/src/layouts/AccountLayout.jsx
client/src/components/store/ThemeToggle.jsx
client/src/components/store/StoreCartDrawer2026.jsx
client/src/components/store/StoreMicrositeShell.jsx
client/src/components/store/SearchProductCard.jsx
client/src/components/store/ProductSellerInfoCard.jsx
client/src/components/store/VariantQuickAddModal.jsx
client/src/components/store/NotificationPreviewDropdown.jsx
client/src/components/kachabazar-demo/StoreHeaderKacha.jsx
client/src/components/kachabazar-demo/StoreFooterKacha.jsx
client/src/components/kachabazar-demo/FloatingCartWidget.jsx
client/src/components/kachabazar-demo/ProductCardKacha.jsx
```

### 6.4 API modules Storefront

Top-level modules:

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

Public/compatibility boundary:

```text
client/src/api/public/store.types.ts
client/src/api/public/storeCheckout.ts
client/src/api/public/storeCoupons.ts
client/src/api/public/storeCustomizationPublic.ts
client/src/api/public/storeOrders.ts
client/src/api/public/storeProducts.ts
client/src/api/public/storePublicIdentity.ts
```

Guardrail:

- Banyak Storefront page mengimpor dari `client/src/api/public/*`.
- Jangan mengganti satu boundary import tanpa global search.
- `client/src/api/store.service.ts` masih ada sebagai compatibility export lama.

### 6.5 State, hooks, utilities

```text
client/src/auth/AuthContext.jsx
client/src/auth/authDomainHooks.js
client/src/auth/authEvents.ts
client/src/auth/authSessionNotice.js
client/src/auth/loginRedirectState.ts
client/src/auth/useBuyerCartSessionSync.js
client/src/components/AccountGuard.jsx
client/src/store/cart.store.ts
client/src/hooks/useCart.ts
client/src/storefront.jsx
client/src/utils/cartSync.ts
client/src/utils/guestCart.ts
client/src/utils/storefrontWishlist.js
client/src/utils/storefrontCatalog.ts
client/src/utils/productImage.js
client/src/utils/publicProductVariations.js
client/src/utils/storeAssets.ts
client/src/utils/format.js
client/src/utils/formatCurrency.js
client/src/utils/groupedPaymentReadModel.ts
client/src/utils/splitOperationalTruth.ts
client/src/utils/orderContract.ts
client/src/utils/orderTruth.js
client/src/utils/orderVariantPresentation.js
client/src/utils/variantCheckoutErrors.js
client/src/utils/sanitizeRichTextHtml.js
```

---

## 7. Route Map Client / Storefront

### 7.1 Demo route

| Route | Komponen | Catatan |
|---|---|---|
| `/demo/kachabazar` | `KachaBazarDemoHomePage` | Dev-only; production build redirect ke `/`. |

### 7.2 Vendor public microsite routes di luar `StoreLayout`

| Route | Komponen | Fungsi |
|---|---|---|
| `/store/:slug` | `StoreMicrositePage` | Public vendor/store microsite. |
| `/store/:slug/products/:productSlug` | `StoreMicrositeProductDetailPage` | Product detail dalam konteks store. |

Implikasi:

- Microsite tidak berada di bawah `StoreLayout` global.
- Microsite memakai shell sendiri `StoreMicrositeShell`.
- Jangan mengandalkan Outlet context `StoreLayout` di route `/store/:slug`.

### 7.3 Public Storefront routes di dalam `StoreLayout`

Root layout:

```jsx
<Route path="/" element={<StoreLayout />}>
```

| Route | Komponen | Fungsi |
|---|---|---|
| `/` | `KachaBazarDemoHomePage` | Home publik marketplace/KachaBazar-style. |
| `/shop` | `StoreSearchPage` → `StoreShopPage2026` | Shop/listing 2026. |
| `/search` | `StoreSearchPage` → `StoreShopPage2026` | Search/filter/sort/pagination produk. |
| `/wishlist` | `StoreWishlistPage2026` | Wishlist lokal Storefront. |
| `/category` | `LegacyStoreCategoryRedirect` | Redirect ke `/shop`. |
| `/category/:slug` | `LegacyStoreCategoryRedirect` | Redirect ke `/search?category=:slug&page=1`. |
| `/product/:slug` | `StoreProductDetailPage` → `StoreProductDetailPage2026` | Detail produk global storefront. |
| `/cart` | `StoreCartPage` + `StoreCart2026View` | Cart page dan checkout preflight. |
| `/checkout` | `Checkout.jsx` + `Checkout2026View` | Checkout multi-store authenticated. |
| `/order/:ref` | `StoreOrderTrackingPage` | Public order tracking by reference. |
| `/checkout/success` | `StoreCheckoutSuccessPage` + `AccountGuard` | Success/readback compatibility. |
| `/about-us` | `StoreAboutUsPage` | Static/customized about page. |
| `/privacy-policy` | `StorePrivacyPolicyPage` | Privacy policy. |
| `/faq` / `/faqs` | `StoreFaqPage` | FAQ. |
| `/terms` / `/terms-and-conditions` | `StoreTermsAndConditionsPage` | Terms. |
| `/contact-us` | `StoreContactUsPage` | Contact page. |
| `/offers` | `StoreOffersPage` | Offers/promotions page. |
| `/about` | redirect | Redirect ke `/about-us`. |
| `/contact` | redirect | Redirect ke `/contact-us`. |
| `/my-orders` | redirect | Redirect ke `/user/my-orders`. |

### 7.4 Auth routes Storefront

| Route | Komponen | Catatan |
|---|---|---|
| `/auth/login` | `StoreLoginPage` + `StoreLogin2026View` | Buyer/account login, merge guest cart/pending add. |
| `/auth/register` | `StoreRegisterPage` + `StoreRegister2026View` | Registration + OTP flow. |
| `/auth/forgot-password` | `StoreForgotPasswordPage` + `StoreForgotPassword2026View` | Request reset link, honeypot/cooldown. |
| `/auth/reset-password` | `StoreResetPasswordPage` | Confirm reset password; legacy visual form. |

Catatan:

- `AuthProvider.login()` adalah admin login only.
- Buyer login di `StoreLoginPage` memanggil `api.post('/auth/login')` langsung.
- Jika role login termasuk `admin`, `staff`, `super_admin`, atau `superadmin`, Storefront login mengarahkan ke `/admin`.

### 7.5 Account routes Storefront

Semua route berikut berada di bawah `AccountGuard` dan `AccountLayout`:

| Route | Komponen | Fungsi |
|---|---|---|
| `/user` | redirect | Redirect ke `/user/dashboard`. |
| `/user/dashboard` | `AccountDashboardPage` | Dashboard buyer/account 2026. |
| `/user/my-orders` | `AccountOrdersPage` | List order buyer 2026. |
| `/user/my-orders/:id` | `AccountOrderDetailPage` | Detail order buyer 2026. |
| `/user/my-orders/:id/payment` | `AccountOrderPaymentPage` | Payment instruction/proof/cancel 2026. |
| `/user/notifications` | `AccountNotificationsPage` | Notifications list/filter/read. |
| `/user/my-reviews` | `AccountMyReviewPage` | Review produk/order. |
| `/user/my-account` | `AccountMyAccountPage` | Account overview 2026. |
| `/user/shipping-address` | `AccountShippingAddressPage` | Address book 2026. |
| `/user/store-payment-profile` | `AccountLegacySellerRoutePage` | Legacy bridge ke seller payment profile lane. |
| `/user/store-payment-review` | `AccountLegacySellerRoutePage` | Legacy bridge ke seller payment review lane. |
| `/user/store-invitations` | `AccountStoreInvitationsPage` | Seller/store invitations. |
| `/user/store-application` | `AccountStoreApplicationPage` | Buyer-to-seller application. |
| `/user/update-profile` | `AccountProfilePage` | Update profile buyer. |
| `/user/change-password` | `AccountChangePasswordPage` | Change password 2026. |

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

## 8. Storefront Layout, Header, Footer, Drawer

### 8.1 `StoreLayout.jsx`

Tanggung jawab:

1. Load public store settings:
   - query key `['store-settings', 'public']`
   - API `getStoreSettings()` → `/store/settings`
2. Load customization home/footer:
   - query key `['store-customization', 'store-layout', 'en']`
   - API `getStoreCustomization({ lang: 'en', include: 'home' })`
3. Normalisasi settings:
   - `payments`
   - `socialLogin`
   - `analytics`
   - `chat`
   - `branding`
4. Render shell:
   - `StoreHeaderKacha`
   - `<Outlet context={{ storeSettings }} />`
   - `StoreFooterKacha` kecuali checkout route
   - `FloatingCartWidget` kecuali cart/checkout
   - mobile bottom nav
   - `MobileMenuDrawer`
   - `StoreCartDrawer2026` kecuali route cart
5. Inject script jika enabled:
   - Google Analytics: `store-ga-script`, `store-ga-inline`
   - Tawk chat: `store-tawk-script`

Behavior penting:

- Script injection diblok saat `import.meta.env.MODE === 'test'` atau `window.__QA_MVF__`.
- Saat route berubah, mobile menu dan cart drawer ditutup.
- Event global `cart-drawer:open` membuka cart drawer.
- Saat drawer terbuka, body scroll dikunci dan tombol `Escape` menutup drawer.
- Shell memakai class dark-ready: `dark:bg-slate-950 dark:text-slate-100`.

### 8.2 `StoreHeaderKacha.jsx`

Fitur aktif:

- Sticky header dengan palette token `#034c85` dan `#fe6f05`.
- Logo dari `brandingLogoUrl` yang dikirim `StoreLayout`; fallback logo TP Preneurs bila tidak tersedia.
- Search global:
  - input kosong → navigate `/shop`
  - input berisi keyword → navigate `/search?q=<keyword>&page=1`
- Navigation utama:
  - `Shop` → `/shop`
  - `Offers` → `/offers`
  - `About Us` → `/about-us`
  - `Contact Us` → `/contact-us`
- Category dropdown dari `useCategories({ parentsOnly: true })`, dibatasi 8 kategori awal untuk header.
- Header actions:
  - `ThemeToggle`
  - wishlist badge → `/wishlist`
  - cart badge → open cart drawer
  - notification icon → dropdown preview jika account session aktif, atau `/auth/login` jika guest
  - account avatar/icon → `/user/my-account` atau `/auth/login`
  - logout action untuk account session

Notification behavior aktual:

```text
fetchUserUnreadNotificationCount()
NotificationPreviewDropdown({ open, onNavigate, onClose })
queryKey preview: ["account", "notifications", "preview", { limit: 5 }]
queryKey unread: ["account", "notifications", "unread-count"]
```

`NotificationPreviewDropdown.jsx` memakai adapter yang sama dengan halaman notifications 2026, mendukung mark read dan mark all read, lalu meng-invalidasi query `["account", "notifications"]` dan `["user", "notifications"]`.

Guardrail:

- Header notification hanya boleh membuka data jika `isAccountSession` benar.
- Jangan membuat notification state lokal yang tidak sinkron dengan `userNotifications.ts`.
- Semua navigasi header harus tetap mempertahankan route publik aktif: `/shop`, `/offers`, `/about-us`, `/contact-us`, `/wishlist`, `/cart`, `/user/*`.

### 8.3 Mobile bottom nav

`StoreLayout` memiliki nav mobile fixed bawah:

```text
Menu
Home
Cart
Profile
```

Warna utama nav memakai `#034c85`; active/hover memakai `#fe6f05`.

### 8.4 `MobileMenuDrawer.jsx`

Fungsi:

- Mobile navigation drawer.
- Menyediakan segmented `ThemeToggle`.
- Ditutup otomatis saat route berubah oleh `StoreLayout`.

### 8.5 `AccountLayout.jsx`

Fungsi:

- Layout dashboard buyer.
- Sidebar account menu.
- Load dashboard-setting customization:
  - query key `['store-customization', 'dashboard-setting', 'en']`
  - include `dashboardSetting`
- Menyediakan segmented `ThemeToggle`.
- Logout membersihkan account session dan reset cart ke guest.

Nav item saat audit:

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

- Route `/user/store-application` aktif, tetapi tidak masuk sidebar nav default.
- Akses store application biasanya via dashboard/onboarding CTA atau direct link.

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
- 5xx atau network error dilog ke console.

Auth form endpoint yang dikecualikan:

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
- Cookie/session dan bearer token compatibility bisa berjalan bersamaan.
- Protected buyer flow harus redirect ke `/auth/login`, bukan admin login.

### 9.2 Server route mount relevan

Di `server/src/app.ts`:

```text
/api/store                         // stripe webhook raw-body mounted before json + store router
/api                               // health + public router
/api/auth
/api/products                      // product activity route
/api/cart
/api/checkout
/api/orders
/api/payments
/api/seller                        // multiple seller route modules
/api/store
/api/stores
/api/store/coupons
/api/store/customization
/api/store/settings
/api/user                          // store application router
/uploads
```

Catatan:

- `/api/store` dipakai untuk `stripeWebhookRouter` sebelum `express.json()`.
- `/api` public router juga memuat profile/address/notifications/upload dan compatibility catalog.
- `/uploads` melayani beberapa kandidat folder upload dengan no-cache headers.

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
| GET | `/store/categories` | Ambil kategori publik. |
| GET | `/store/products` | Product listing publik. |
| GET | `/store/products/:id` | Product detail publik by slug/id. |

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

Hook di `storefront.jsx`:

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
| GET | `/store/settings` | Public settings Storefront. |
| GET | `/store/customization` | Customization by `lang` dan `include`. |
| GET | `/store/customization/header` | Header customization. |
| GET | `/store/customization/identity` | Default public identity. |
| GET | `/store/customization/identity/:slug` | Identity publik per vendor/store. |
| GET | `/store/customization/microsites/:slug/rich-about` | Rich about microsite. |

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
| GET | `/store/coupons` | List public coupon eligible. |
| POST | `/store/coupons/quote` | Quote/validasi coupon terhadap subtotal/shipping/scope. |
| POST | `/store/coupons/validate` | Legacy/compatibility validation. |

Guardrail:

- Coupon frontend bukan final truth; backend harus revalidate saat checkout.
- Multi-store checkout memakai coupon per store group.
- Store group coupon harus `scopeType === 'STORE'`.
- Order/platform coupon di multi-store harus ditolak UI jika tidak sesuai contract.

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
| GET | `/cart` | Ambil remote cart authenticated. |
| POST | `/cart/add` | Tambah item ke remote cart. |
| PUT | `/cart/items/by-id/:itemId` | Update qty remote cart item by cart item id. |
| DELETE | `/cart/items/by-id/:itemId` | Hapus remote cart item by cart item id. |

Legacy server endpoint masih tersedia:

```text
PUT /cart/items/:productId
DELETE /cart/remove/:itemId
```

Snapshot add-to-cart harus menjaga variant:

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
| POST | `/checkout/preview` | Preview checkout multi-store. |
| POST | `/checkout/create-multi-store` | Create order multi-store. |

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

`previewCheckoutByStore` payload:

```text
cartId?
shippingAddressId?
```

Backend `/checkout` memakai `requireAuth`, rate limit, schema validation, checkout idempotency key, dan serialize preview group dari cart user.

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
| GET | `/store/my/orders` | List order buyer/account. |
| GET | `/store/orders/my/:id` | Detail order buyer/account. |
| GET | `/store/orders/:ref` | Public tracking by ref/invoice. |
| GET | `/orders/:orderId/checkout-payment` | Grouped payment/order read model. |
| GET | `/payments/:paymentId` | Payment detail. |
| POST | `/payments/:paymentId/proof` | Submit proof payment. |
| POST | `/payments/:paymentId/cancel` | Cancel payment/order jika contract mengizinkan. |
| GET | `/store/orders/:ref/stripe/session` | Verify Stripe checkout session compatibility. |
| POST | `/store/orders/:ref/stripe/session` | Create Stripe checkout session compatibility. |

Guardrail:

- UI action harus mengikuti `availableActions`, `proofActionability`, `cancelability`, dan read model backend.
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
| Profile image/review/proof upload | `POST /upload` |
| Change password | `POST /user/change-password` |
| Addresses | `GET /user/addresses`, `GET /user/addresses/default`, `POST /user/addresses`, `PUT /user/addresses/:id`, `DELETE /user/addresses/:id` |
| Notifications | `GET /user/notifications`, `GET /user/notifications/unread-count`, `POST/PATCH /user/notifications/:id/read`, `POST/PATCH /user/notifications/read-all`, `DELETE /user/notifications/:id`, `DELETE /user/notifications` |

### 10.8 Auth/register/reset

Client module:

```text
client/src/api/storeAuth.ts
client/src/pages/store/StoreLoginPage.jsx
client/src/pages/store/StoreRegisterPage.jsx
client/src/pages/store/StoreForgotPasswordPage.jsx
client/src/pages/store/StoreResetPasswordPage.jsx
```

Endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/auth/login` | Buyer/account login; dipanggil langsung di `StoreLoginPage`. |
| POST | `/auth/register` | Register account. |
| POST | `/auth/register/resend-otp` | Resend OTP. |
| POST | `/auth/register/verify-otp` | Verify OTP. |
| POST | `/auth/forgot-password` | Request password reset. |
| POST | `/auth/reset-password` | Confirm reset password. |

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
| GET | `/user/store-applications/current` | Current application. |
| GET | `/user/store-applications/:applicationId` | Detail application. |
| POST | `/user/store-applications/draft` | Create draft. |
| PATCH | `/user/store-applications/:applicationId/draft` | Update draft. |
| POST | `/user/store-applications/:applicationId/submit` | Submit. |
| POST | `/user/store-applications/:applicationId/resubmit` | Resubmit after revision/rejection. |
| POST | `/user/store-applications/:applicationId/cancel` | Cancel. |

Endpoint seller invitation/account bridge:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/seller/invitations` | List invitations untuk account user. |
| POST | `/seller/invitations/:memberId/accept` | Accept invitation. |
| POST | `/seller/invitations/:memberId/decline` | Decline invitation. |
| GET | `/seller/stores` | List store access milik user. |

### 10.10 Reviews

Endpoint Storefront:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/store/my/reviews/need` | Products/orders eligible for review. |
| GET | `/store/my/reviews` | My review list. |
| POST | `/store/reviews` | Create review. |
| PATCH | `/store/reviews/:id` | Update review. |
| PUT | `/store/reviews/product/:productId` | Compatibility create/update review by product. |
| POST | `/upload` | Upload image review/profile/payment proof. |

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
account  // route lain: Storefront dan buyer/account
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
login(email, password)       // admin login only
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

- `useSellerAuth()` menganggap authenticated non-admin sebagai seller/session compatibility.
- Seller workspace access nyata tetap dicek via seller workspace APIs dan membership.
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

Checkout `/checkout` tidak dibungkus `AccountGuard`, tetapi page checkout sendiri:

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
- `cart_remote_ok` di sessionStorage menjadi sinyal remote mode.
- `pending_cart_add` menyimpan add-to-cart yang gagal 401 agar bisa dilanjutkan setelah login.

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
- Jangan merge berdasarkan `productId` saja.

### 12.4 Cart session sync saat login

File:

```text
client/src/auth/useBuyerCartSessionSync.js
```

Fungsi:

- Sinkronisasi guest cart ke remote cart setelah account user terdeteksi.
- Menggunakan marker seperti `cartSync:lastSyncedUserId` agar tidak merge berulang.
- Logout/non-user mengembalikan mode ke guest.

### 12.5 Variant caveat

Produk varian harus diperlakukan sebagai cart line unik berdasarkan:

```text
productId + variantKey / variantSelections
```

Untuk add-to-cart Storefront:

```ts
useCart().add(productId, qty, snapshot)
```

Jangan:

- Memanggil `useCartStore` raw untuk add/update varian tanpa memastikan `lineId`.
- Menggabungkan item hanya berdasarkan `productId`.
- Update/delete remote varian tanpa `cartItemId` bila target ambigu.

---

## 13. Wishlist Architecture

### 13.1 Local wishlist utility

File:

```text
client/src/utils/storefrontWishlist.js
```

Storage/event:

```text
STOREFRONT_WISHLIST_KEY = 'tp_storefront_wishlist_v1'
WISHLIST_CHANGED_EVENT = 'tp-storefront-wishlist-changed'
```

Function/hook:

```text
readWishlistItems()
writeWishlistItems(items)
clearWishlistItems()
isWishlistItem(productIdOrSlug)
removeWishlistItem(productIdOrSlug)
addWishlistItem(product)
toggleWishlistItem(product)
useStorefrontWishlist()
```

Catatan:

- Wishlist belum menggunakan backend API dan belum account-synced.
- Product snapshot disimpan lokal: `id`, `productId`, `slug`, `name`, `category`, `price`, `originalPrice`, `imageUrl`, `rating`, `reviewCount`, `storeSlug` bila tersedia.
- Header badge membaca count dari hook wishlist.

### 13.2 `/wishlist`

Komponen:

```text
client/src/pages/store/StoreWishlistPage2026.jsx
```

Fitur:

- Membaca local wishlist.
- Filter/search/category/price di sisi client.
- Grid/list view.
- Remove item dan clear wishlist.
- Add to cart via `useCart`.
- Product link menuju detail produk.

Guardrail:

- Karena wishlist local-only, jangan menjanjikan sinkronisasi lintas perangkat sebelum backend API tersedia.
- Bila ingin account-backed wishlist, buat kontrak API backend dan migrasi localStorage secara eksplisit.

---

## 14. Catalog, Home, Shop/Search, Product Flow

### 14.1 Home `/`

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

### 14.2 Shop/Search `/shop` dan `/search`

Komponen aktif:

```text
client/src/pages/store/StoreSearchPage.jsx
client/src/pages/store/StoreShopPage2026.jsx
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
newest
price_asc
price_desc
highest_rated
```

Fitur:

- Shop hero/search.
- Category filter.
- Rating filter.
- Price min/max.
- Grid/list view.
- Mobile filter drawer.
- Pagination.
- Loading/error/empty state.
- Wishlist toggle via `useStorefrontWishlist`.
- Variant-aware quick add: product dengan variasi membuka `VariantQuickAddModal`.

Guardrail:

- `/shop` adalah route listing default baru.
- Header search kosong mengarah ke `/shop`.
- `/search` tetap dipakai untuk query/filter link dan legacy redirect.

### 14.3 Product detail `/product/:slug`

Komponen aktif:

```text
client/src/pages/store/StoreProductDetailPage.jsx
client/src/pages/store/StoreProductDetailPage2026.jsx
```

Data/query:

```text
useProduct(slug)
getStoreCustomization({ lang: 'en', include: 'productSlugPage' })
useProducts(...) untuk related products
```

Variant flow:

- Normalisasi via `normalizePublicProductVariationState`.
- Build pilihan via `buildPublicProductVariationGroups`.
- Resolve selected variant via `resolvePublicSelectedVariant`.
- Variant terpilih memengaruhi image, price, sale price, stock, SKU/barcode, purchasability.
- Add-to-cart membawa snapshot varian lengkap.

Purchasability:

- Utamakan backend `purchaseState.isPurchasable` jika tersedia.
- Tetap cek selected variant dan stock.
- Invalid/out of stock message memakai `variantCheckoutErrors.js`.

Seller/store info:

- `ProductSellerInfoCard` menampilkan vendor/store bila backend menyediakan `sellerInfo`.
- Visit store mengarah ke microsite jika `storeSlug`/href tersedia.

---

## 15. Vendor Microsite Flow

### 15.1 Store microsite `/store/:slug`

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
- Category/product shelf/listing scoped ke store.
- Search di microsite.
- Rich about content.
- Link ke `/store/:slug/products/:productSlug`.

### 15.2 Microsite product detail `/store/:slug/products/:productSlug`

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

- Microsite berada di luar `StoreLayout`.
- Link produk dari microsite sebaiknya mempertahankan konteks store.
- Store identity/readiness harus tetap dari backend.

---

## 16. Cart Page dan Drawer Flow

### 16.1 Cart page `/cart`

Komponen:

```text
client/src/pages/store/StoreCartPage.jsx
client/src/pages/store/cart2026/StoreCart2026View.jsx
client/src/pages/store/cart2026/storeCart2026Adapter.js
```

Fungsi:

- Menampilkan item guest/remote cart.
- Update qty/remove item.
- Menampilkan detail variant line via `getOrderItemVariantLines`.
- Checkout preflight via backend preview.
- Recovery action untuk invalid variant/item menuju product detail.

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

Enabled ketika:

```text
hasHydrated && hasItems && !isLoading && hasCheckoutAuthHint
```

Guardrail:

- Cart preflight hanya warning/early validation; final checkout harus re-preview.
- Jika invalid item dari preview berisi variant issue, UI harus bantu reselect variant.
- Jangan menghitung final total order dari cart page.

### 16.2 Cart drawer

Komponen:

```text
client/src/components/store/StoreCartDrawer2026.jsx
client/src/components/store/store-cart-drawer-2026.css
```

Pemanggil:

- `StoreLayout` render drawer kecuali route `/cart`.
- Header action `onCartClick` membuka drawer.
- Event global `cart-drawer:open` membuka drawer.
- `FloatingCartWidget` juga dapat memicu event drawer.

Fitur drawer:

- List item ringkas.
- Qty update/remove.
- Subtotal/discount/shipping placeholder.
- CTA view cart/checkout.
- Dark-ready styling.

---

## 17. Checkout Flow

### 17.1 Halaman checkout

Komponen:

```text
client/src/pages/store/Checkout.jsx
client/src/pages/store/checkout2026/Checkout2026View.jsx
client/src/pages/store/checkout2026/checkout2026Adapter.js
```

`Checkout.jsx` besar dan domain-critical. Refactor harus bertahap.

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

### 17.2 Checkout customization

Query:

```text
['store-customization', 'checkout', 'en']
getStoreCustomization({ lang: 'en', include: 'checkout' })
```

Fallback copy tersedia melalui normalizer internal Checkout.

### 17.3 Checkout preview

Query:

```text
['checkout-preview-by-store', checkoutPreviewSignature]
previewCheckoutByStore({})
```

Preview dipakai untuk:

- `checkoutMode`: `SINGLE_STORE` atau `MULTI_STORE`.
- Group per store.
- Store/payment readiness.
- Invalid item count/details.
- Summary amount.
- Shipping/payment warnings.
- Coupon state baseline.

### 17.4 Coupon behavior

Single-store:

- Order-level field boleh dipakai.
- Quote via `/store/coupons/quote` dengan subtotal/shipping/storeId/storeSlug.
- Coupon meta disimpan sebagai `appliedCouponMeta`.

Multi-store:

- Order-level coupon ditolak.
- Coupon diterapkan per group store.
- Quote harus menghasilkan `scopeType === 'STORE'`.
- Submit payload memakai `groupCoupons: [{ storeId, couponCode }]`.

### 17.5 Create checkout order

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

## 18. Order, Payment, dan Tracking Flow

### 18.1 Account order list

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

- Refetch interval 15 detik jika ada order belum final atau ada visible `paymentEntry`.

### 18.2 Account order detail

Komponen:

```text
client/src/pages/account/AccountOrderDetailPage.jsx
client/src/pages/account/AccountOrderDetail2026View.jsx
client/src/pages/account/accountOrderDetail2026Adapter.js
client/src/pages/account/invoice/AccountOrderInvoicePrint.jsx
client/src/pages/account/invoice/accountOrderInvoiceAdapter.js
client/src/pages/account/invoice/account-order-invoice.css
```

Query:

```text
['account', 'orders', id]
['account', 'orders', 'grouped', id]
```

Polling:

- Order detail polling 15 detik sampai `isOrderContractFinal(order.contract)` benar.
- Grouped order polling 15 detik jika `isSplitOperationallyFinal(group)` belum final.

Action utama:

- `onPrint` membuka browser print.
- `onInvoice` membuka URL invoice bila tersedia, atau fallback ke `window.print()`.
- `onTrack` membuka URL/path tracking bila tersedia, atau scroll ke timeline.
- `onCopy` memakai clipboard untuk order code/tracking/reference.
- `onContactSupport` ke contact page dengan topic order.

Invoice layer aktual:

- `AccountOrderDetail2026View` membangun `invoiceData` memakai `buildAccountOrderInvoiceModel({ order, groupedOrder, user })`.
- `AccountOrderInvoicePrint` dirender sebagai print-friendly invoice companion.
- CSS invoice berada di `invoice/account-order-invoice.css` dan perlu dijaga saat mengubah struktur order detail.

Guardrail:

- Invoice harus memakai raw order/grouped order backend, bukan model ringkas yang kehilangan store split/payment detail.
- Print/download invoice tidak boleh memodifikasi order state.
- Jangan menghapus grouped payment query karena order detail membutuhkan split operational truth.

### 18.3 Account payment page

Komponen:

```text
client/src/pages/account/AccountOrderPaymentPage.jsx
client/src/pages/account/AccountOrderPayment2026View.jsx
client/src/pages/account/accountOrderPayment2026Adapter.js
client/src/pages/account/account-order-payment-2026.css
```

API:

```text
fetchOrderCheckoutPayment(orderId)
fetchPaymentDetail(paymentId)
submitPaymentProof(paymentId, payload)
cancelPaymentTransaction(paymentId)
uploadPaymentProofImage(file)
```

Endpoint aktif:

```text
GET /orders/:orderId/checkout-payment
GET /payments/:paymentId
POST /payments/:paymentId/proof
POST /payments/:paymentId/cancel
POST /upload
```

Fungsi aktual:

- Menampilkan grouped payment read model per store.
- Menampilkan QRIS/payment instruction per store destination.
- Copy exact amount dan reference menggunakan clipboard fallback.
- View full QR dan save/download QR image bila `qrImageUrl` tersedia.
- Upload payment proof image via `/upload`.
- Submit proof payload:
  - `proofImageUrl`
  - `senderName`
  - `senderBankOrWallet`
  - `transferAmount`
  - `transferTime`
  - `note`
- Cancel payment transaction bila backend contract mengizinkan.
- Invalidate/refetch query setelah mutation sukses.

Guardrail:

- Tombol proof hanya boleh muncul bila `proofActionability.canStartProof` benar.
- Tombol cancel hanya boleh muncul bila `cancelability.canCancel` benar.
- Jangan mengizinkan submit proof/cancel hanya dari string status frontend.
- QRIS destination harus mengikuti store payment masing-masing, terutama pada checkout multi-store.

### 18.4 Public order tracking `/order/:ref`

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

### 18.5 Checkout success `/checkout/success`

Komponen:

```text
client/src/pages/store/StoreCheckoutSuccessPage.jsx
```

Catatan:

- Dilindungi `AccountGuard`.
- QRIS checkout normal lebih sering mengarah ke `/user/my-orders/:id/payment`.
- Success page tetap penting untuk Stripe/session compatibility atau readback order success.

---

## 19. Account Area Flow

### 19.1 Dashboard

Komponen:

```text
AccountDashboardPage.jsx
AccountDashboard2026View.jsx
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
- Seller workspace access jika user sudah punya store.

### 19.2 My account

Komponen:

```text
AccountMyAccountPage.jsx
AccountMyAccount2026View.jsx
accountMyAccount2026Adapter.js
```

Fungsi:

- Account overview/profile snapshot.
- CTA update profile/address/password/orders/support.

### 19.3 Update profile

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

### 19.4 Shipping addresses

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

### 19.5 Change password

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

### 19.6 Store invitations

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

### 19.7 Store application

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

- Workflow harus mengikuti backend flags `canEdit`, `canSubmit`, `canResubmit`, `canCancel`.
- Setelah approved/activation, dashboard dan store application harus sinkron dengan Seller Workspace access.
- Jangan bypass Admin review dengan membuat store langsung dari client.

### 19.8 Notifications

Komponen:

```text
AccountNotificationsPage.jsx
notifications2026/AccountNotifications2026View.jsx
notifications2026/accountNotifications2026Adapter.js
notifications2026/account-notifications-2026.css
NotificationPreviewDropdown.jsx
notification-preview-dropdown-2026.css
```

API module aktif:

```text
GET /user/notifications
GET /user/notifications/unread-count
POST /user/notifications/:id/read
POST /user/notifications/read-all
DELETE /user/notifications/:id
DELETE /user/notifications
```

Compatibility backend juga menyediakan endpoint protected tanpa prefix `/user`:

```text
GET /notifications
GET /notifications/unread-count
POST/PATCH /notifications/:id/read
POST/PATCH /notifications/read-all
DELETE /notifications/:id
DELETE /notifications
```

Query key utama:

```text
["account", "notifications", { limit: 20, offset: 0 }]
["account", "notifications", "unread-count"]
["account", "notifications", "preview", { limit: 5 }]
```

Fitur halaman `/user/notifications`:

- Normalisasi payload melalui `unwrapNotifications`.
- Build view model melalui `buildNotificationsViewModel`.
- Filter berdasarkan kategori dari `NOTIFICATION_FILTERS`.
- Toggle unread-only.
- Mark single notification as read.
- Mark all notifications as read.
- Delete individual notification.
- Clear all notifications.
- Open notification akan mark read terlebih dahulu lalu navigate ke `item.route` atau `item.actionUrl`.

Fitur header preview:

- Dibuka dari `StoreHeaderKacha.jsx` jika account session aktif.
- Menampilkan 5 notifikasi terbaru.
- Mendukung mark read / mark all read dan navigasi cepat.
- Meng-invalidasi query notification agar badge/header/page sinkron.

Guardrail:

- Delete/clear adalah action destruktif; UI harus menampilkan affordance jelas dan state disabled saat mutation pending.
- Jangan menampilkan notification preview untuk guest.
- Jangan membuat endpoint baru jika `userNotifications.ts` sudah mencakup action yang dibutuhkan.

### 19.9 Reviews

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

## 20. Static Pages, Customization, dan SEO

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

SEO bridge:

```text
client/src/components/SeoCustomizationBridge.jsx
client/src/utils/seoSettings.js
```

Sanitization:

```text
client/src/utils/sanitizeRichTextHtml.js
```

Sanitizer menghapus script/style/iframe/object/embed, inline event handlers, `javascript:` URL, dan memaksa anchor safe attributes.

Guardrail:

- Rich text dari Admin customization harus disanitasi sebelum render.
- Static page tetap harus render fallback saat customization kosong/error.

---

## 21. Shared Types dan Contract Penting

File:

```text
client/src/api/store.types.ts
```

### 21.1 `StoreCategory`

```text
id
name
slug
code
image
parentId / parent_id
published
```

### 21.2 `StoreProduct`

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

### 21.3 `StorefrontProductSellerInfo`

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

### 21.4 `StoreCoupon`

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

### 21.5 `StoreCheckoutPreviewResponse`

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

### 21.6 `PublicStoreIdentity`

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

### 21.7 `PublicStoreSettings`

```text
payments
socialLogin
analytics
chat
branding
```

Branding sekarang mencakup beberapa URL logo/hero termasuk:

```text
clientLogoUrl
adminLogoUrl
sellerLogoUrl
adminLoginHeroUrl
adminForgotPasswordHeroUrl
adminCreateAccountHeroUrl
workspaceBrandName
```

---

## 22. Source of Truth dan Read Model Rules

### 22.1 Backend source of truth

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

### 22.2 Frontend read model utilities

Utility seperti:

```text
splitOperationalTruth
groupedPaymentReadModel
orderContract
orderTruth
storeOnboardingPresentation
variantCheckoutErrors
storefrontCatalog
publicProductVariations
storefrontWishlist
notificationViewModel
reviewViewModel
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

## 23. Sinkronisasi dengan Admin Workspace

Admin Workspace memengaruhi Storefront lewat domain:

| Admin domain | Dampak Storefront |
|---|---|
| Store Customization | Home, header/footer, static pages, checkout copy, dashboard labels, SEO. |
| Store Settings | Payment/social login/analytics/chat/branding settings. |
| Product/Catalog | Produk, kategori, atribut/varian, stock, purchase state. |
| Coupons | Public offers dan checkout coupon eligibility. |
| Store Applications | Buyer-to-seller onboarding status dan approval. |
| Payment Profiles | Checkout QRIS/payment availability per store. |
| Shipping/Order Ops | Checkout readiness, tracking, order lifecycle. |
| Payment Audit | Payment state/review truth yang muncul ke buyer. |

Arahan:

- Cek apakah data Storefront berasal dari Admin customization/settings sebelum hardcode UI copy.
- Admin fallback boleh ada, tetapi bukan alasan mengabaikan data real.
- Bila mengubah contract DTO, cek Admin/Seller/Storefront via global search.

---

## 24. Sinkronisasi dengan Seller Workspace

Seller Workspace memengaruhi Storefront lewat domain:

| Seller domain | Dampak Storefront |
|---|---|
| Store Profile / Storefront / Microsite | `/store/:slug`, seller card di product detail. |
| Catalog Products | Product listing/detail/search/cart/checkout. |
| Categories / Attributes / Attribute Values | Filter, variant, product metadata. |
| Coupons | Store-scoped promotions dan group coupon checkout. |
| Orders | Fulfillment/tracking status. |
| Payment Profile | Payment available/tidak available di checkout. |
| Team/Permissions | Tidak langsung ke Storefront, tetapi menentukan siapa yang mengubah data seller. |

Arahan:

- Storefront harus membaca output seller/admin/backend, bukan menulis langsung ke domain seller kecuali invitation/application flow.
- Public microsite harus menghormati status/visibility/readiness store dari backend.
- Buyer dashboard boleh menampilkan bridge ke seller workspace jika `/seller/stores` menunjukkan akses.

---

## 25. QA dan Validation Checklist

### 25.1 Build/check dasar

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

Jika menyentuh auth frontend:

```bash
pnpm qa:auth:frontend
pnpm -F server smoke:client-registration-otp
pnpm -F server smoke:user-change-password
pnpm -F server smoke:auth-forgot-password
```

### 25.2 Smoke route Storefront minimal

```text
/
/demo/kachabazar       // dev only
/shop
/search
/wishlist
/product/:slug
/cart
/checkout
/order/:ref
/checkout/success      // protected account guard
/auth/login
/auth/register
/auth/forgot-password
/auth/reset-password
/user/dashboard
/user/my-orders
/user/my-orders/:id
/user/my-orders/:id/payment
/user/notifications
/user/my-reviews
/user/my-account
/user/update-profile
/user/shipping-address
/user/change-password
/user/store-invitations
/user/store-application
/store/:slug
/store/:slug/products/:productSlug
```

### 25.3 Manual/Playwright scenarios

1. Home render tanpa console error.
2. Header search kosong menuju `/shop`; search keyword menuju `/search?q=...&page=1`.
3. Header/wishlist/cart badge bekerja di light dan dark mode.
4. `/shop` dan `/search` filter/sort/pagination mengubah query param dan data query.
5. Wishlist add/remove/clear bertahan setelah reload via localStorage.
6. Product detail bisa select variant dan add to cart.
7. Guest cart bertahan setelah reload.
8. Login buyer memicu merge guest cart/pending add.
9. Cart page menampilkan preflight warning bila backend menolak item.
10. Invalid variant cart line bisa recovery/reselect.
11. Checkout authenticated memanggil preview sebelum create order.
12. Multi-store cart menghasilkan group per store.
13. Store coupon hanya valid di group store terkait.
14. Order payment page mengikuti available actions backend.
15. Upload proof/cancel payment hanya muncul jika actionability mengizinkan.
16. Public tracking `/order/:ref` tidak membutuhkan login.
17. Microsite `/store/:slug` tidak bergantung pada `StoreLayout`.
18. Static pages tetap render saat customization kosong/error.
19. Analytics/chat tidak inject script saat test/QA mode.
20. Theme `light/dark/system` persist di `tp_storefront_theme` dan mengubah class `dark`.
21. Store application draft/submit/resubmit/cancel mengikuti backend workflow flags.
22. User notifications read/read-all tidak mematahkan unread count.

### 25.4 Regresi yang wajib dihindari

- Mengubah `/category` tanpa menjaga redirect ke `/shop`.
- Mengubah `/category/:slug` tanpa menjaga redirect ke `/search?category=:slug&page=1`.
- Mematahkan `/store/:slug` karena diasumsikan berada di `StoreLayout`.
- Menghitung final total checkout di client tanpa backend preview.
- Menampilkan upload/cancel payment tanpa available action/actionability backend.
- Membuang `variantKey`, `variantSelections`, atau `cartItemId` saat cart/checkout.
- Menggunakan admin auth flow untuk buyer login.
- Membuat theme provider/store kedua.
- Menghapus wrapper `client/src/api/public/*.ts` tanpa mengganti semua import.
- Menganggap wishlist sudah backend-synced padahal masih local-only.
- Menggunakan folder `.tmp/` atau `_archive/` sebagai sumber route aktif.

---

## 26. Known Caveats / Technical Debt

1. **`StoreHomePage.jsx` ada tetapi route index memakai `KachaBazarDemoHomePage`.** Perlakukan sebagai legacy/alternative sampai route map diubah sadar.
2. **`StoreCategoryPage.jsx` ada tetapi category route redirect.** `/category` → `/shop`, `/category/:slug` → `/search?category=:slug&page=1`.
3. **`StoreSearchPage.jsx` hanya re-export ke `StoreShopPage2026`.** Redesign search/listing harus lihat `StoreShopPage2026.jsx` dan `store-shop-2026.css`.
4. **`StoreProductDetailPage.jsx` hanya re-export ke `StoreProductDetailPage2026`.** Redesign product harus lihat file 2026.
5. **`Checkout.jsx` sangat besar.** Refactor harus bertahap: extract hook/read-model/component kecil dan smoke setiap langkah.
6. **Cart variant matching sensitif.** Jangan merge item hanya berdasarkan productId.
7. **Wishlist masih local-only.** Belum ada endpoint backend wishlist/account sync.
8. **API public wrapper dan top-level module harus sinkron.** Banyak import Storefront memakai `client/src/api/public/*`.
9. **Order/payment truth multi-sumber.** Pertahankan helper defensif untuk backward compatibility.
10. **Coupon domain masih perlu backend contract untuk pembatasan lanjutan.** Usage limit/max discount/product/category restriction/redemption ledger/global uniqueness harus dipastikan backend sebelum UI final.
11. **Auth scope admin/account rawan tertukar.** Buyer/account login tidak boleh memakai `AuthProvider.login()`.
12. **Account 2026 view tersebar antara container, adapter, CSS.** Saat redesign, cari `*2026View`, `*2026Adapter`, dan CSS terkait.
13. **Theme dark mode belum otomatis membuat semua legacy UI sempurna.** Komponen baru wajib dark-ready; komponen lama mungkin masih perlu audit class.
14. **Sidebar AccountLayout belum memasukkan Store Application sebagai nav item.** Route ada, akses via dashboard/direct link.
15. **Folder `.tmp/` dan `_archive/` berisi artefak lama/slicing.** Jangan jadikan active source kecuali task khusus.

---

## 27. File/Fungsi Prioritas Saat Modifikasi Storefront

### 27.1 Routing/layout/theme

```text
client/src/main.jsx
client/src/App.jsx
client/src/theme/ThemeProvider.jsx
client/src/components/store/ThemeToggle.jsx
client/src/components/Layout/StoreLayout.jsx
client/src/components/Layout/MobileMenuDrawer.jsx
client/src/layouts/AccountLayout.jsx
client/src/components/kachabazar-demo/StoreHeaderKacha.jsx
client/src/components/kachabazar-demo/StoreFooterKacha.jsx
```

### 27.2 Home/shop/search/product/wishlist

```text
client/src/pages/store/KachaBazarDemoHomePage.jsx
client/src/pages/store/StoreSearchPage.jsx
client/src/pages/store/StoreShopPage2026.jsx
client/src/pages/store/StoreProductDetailPage.jsx
client/src/pages/store/StoreProductDetailPage2026.jsx
client/src/pages/store/StoreWishlistPage2026.jsx
client/src/storefront.jsx
client/src/api/storeProducts.ts
client/src/api/public/storeProducts.ts
client/src/api/store.types.ts
client/src/utils/storefrontCatalog.ts
client/src/utils/storefrontWishlist.js
client/src/utils/productImage.js
client/src/utils/publicProductVariations.js
client/src/components/store/SearchProductCard.jsx
client/src/components/store/VariantQuickAddModal.jsx
client/src/components/kachabazar-demo/ProductCardKacha.jsx
```

### 27.3 Microsite

```text
client/src/pages/store/StoreMicrositePage.jsx
client/src/pages/store/StoreMicrositeProductDetailPage.jsx
client/src/components/store/StoreMicrositeShell.jsx
client/src/api/storePublicIdentity.ts
client/src/api/storeCustomizationPublic.ts
```

### 27.4 Cart/checkout

```text
client/src/pages/store/StoreCartPage.jsx
client/src/pages/store/cart2026/StoreCart2026View.jsx
client/src/pages/store/cart2026/storeCart2026Adapter.js
client/src/components/store/StoreCartDrawer2026.jsx
client/src/pages/store/Checkout.jsx
client/src/pages/store/checkout2026/Checkout2026View.jsx
client/src/pages/store/checkout2026/checkout2026Adapter.js
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

### 27.5 Order/payment/tracking

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

### 27.6 Account/auth/profile/address

```text
client/src/auth/AuthContext.jsx
client/src/auth/authDomainHooks.js
client/src/components/AccountGuard.jsx
client/src/pages/store/StoreLoginPage.jsx
client/src/pages/store/login2026/StoreLogin2026View.jsx
client/src/pages/store/StoreRegisterPage.jsx
client/src/pages/store/register2026/StoreRegister2026View.jsx
client/src/pages/store/StoreForgotPasswordPage.jsx
client/src/pages/store/forgotPassword2026/StoreForgotPassword2026View.jsx
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
client/src/api/userNotifications.ts
```

### 27.7 Store application / seller bridge

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

### 27.8 Customization/static pages

```text
client/src/api/storeCustomizationPublic.ts
client/src/pages/store/StoreAboutUsPage.jsx
client/src/pages/store/StoreContactUsPage.jsx
client/src/pages/store/StoreFaqPage.jsx
client/src/pages/store/StoreOffersPage.jsx
client/src/pages/store/StorePrivacyPolicyPage.jsx
client/src/pages/store/StoreTermsAndConditionsPage.jsx
client/src/components/SeoCustomizationBridge.jsx
client/src/utils/sanitizeRichTextHtml.js
```

---

## 28. Acceptance Criteria untuk Perubahan Storefront

Setiap task Storefront dianggap aman bila memenuhi kriteria berikut:

1. Route terdampak render tanpa crash.
2. Tidak ada console error baru di route utama.
3. Query key React Query stabil dan tidak menyebabkan refetch loop.
4. Loading, empty, error, dan updating state tersedia untuk data async penting.
5. 401 pada account protected flow mengarah ke `/auth/login`.
6. Guest cart dan remote cart tetap kompatibel.
7. Wishlist localStorage tetap aman bila fitur wishlist disentuh.
8. Variant product tidak kehilangan pilihan saat add cart/checkout.
9. Cart line update/remove memakai target aman (`cartItemId` untuk remote varian jika ada).
10. Checkout memakai `/checkout/preview` sebelum create order.
11. Coupon divalidasi backend via quote dan revalidated di create checkout.
12. Order/payment actions mengikuti backend `availableActions`, `proofActionability`, `cancelability`, atau contract.
13. Microsite route tetap tidak bergantung pada `StoreLayout`.
14. Static/customized rich HTML tetap disanitasi.
15. Theme dark/light/system tetap memakai `ThemeProvider` global.
16. `pnpm -F client build` lulus.
17. Jika menyentuh API contract, `pnpm -F server build` juga lulus.
18. Jika menyentuh checkout/order/payment/coupon/variant, jalankan smoke terkait.
19. Dokumentasi/report diperbarui bila perubahan besar.

---

## 29. Prompt Konteks Singkat untuk AI Berikutnya

Gunakan konteks berikut saat meminta AI/Codex/Gemini mengerjakan Storefront:

```text
Anda bekerja pada repo tp-preneurs-multivendor-main, fokus Client / Storefront. Storefront berada di client/src dan berbagi aplikasi dengan Admin Workspace dan Seller Workspace. Root app memakai React + Vite + React Router + React Query + Zustand, dibungkus ThemeProvider untuk light/dark/system theme. Route publik utama ada di client/src/App.jsx di bawah StoreLayout. Home aktif adalah KachaBazarDemoHomePage. Route /shop dan /search sama-sama memakai StoreSearchPage yang re-export ke StoreShopPage2026. Route /wishlist memakai StoreWishlistPage2026 dan localStorage key tp_storefront_wishlist_v1. Product detail /product/:slug memakai StoreProductDetailPage2026. Cart /cart memakai StoreCart2026View dan cart drawer global memakai StoreCartDrawer2026. Checkout /checkout tetap di Checkout.jsx tetapi presentasi memakai Checkout2026View. Account dashboard/order/payment/profile/address/change-password banyak memakai Account*2026View + account*2026Adapter. Account notifications sudah memakai notifications2026/AccountNotifications2026View dan adapter khusus; header memakai NotificationPreviewDropdown untuk preview 5 item dan unread badge. Order detail /user/my-orders/:id memakai invoice/AccountOrderInvoicePrint + accountOrderInvoiceAdapter untuk print invoice. Payment page /user/my-orders/:id/payment memiliki action copy/reference, view/save QR, submit proof, dan cancel payment yang wajib mengikuti proofActionability/cancelability backend. Vendor microsite /store/:slug berada di luar StoreLayout.

Backend adalah source of truth untuk catalog purchasability, stock, variant availability, coupon validity, checkout totals, payment profile readiness, order/payment/shipment lifecycle, available actions, store readiness, dan store application workflow. Jangan menghitung final checkout/order/payment state sendiri di client. Gunakan API modules di client/src/api dan wrapper client/src/api/public bila file sekitar memakainya. Gunakan AuthContext/useAccountAuth untuk account session dan useCart untuk cart. Cart store aktual adalah client/src/store/cart.store.ts; pertahankan variant fields seperti variantKey, variantSelections, variantSku, variantBarcode, cartItemId, dan lineId. Wishlist saat ini local-only, jangan menjanjikan backend sync. Jangan menghapus route/file legacy tanpa audit karena ada redirect/compatibility layer.

Setiap perubahan Storefront harus sinkron dengan Admin customization/settings/coupons/payment profiles/store applications dan Seller catalog/store profile/payment/order data. Jalankan minimal pnpm -F client build dan smoke route /, /shop, /search, /wishlist, /product/:slug, /cart, /checkout, /user/my-orders, /user/my-orders/:id/payment, /order/:ref, /store/:slug. Jika menyentuh API backend, jalankan pnpm -F server build dan smoke terkait.
```

---

## 30. Catatan Audit Teknis 2026-06-27

Bagian ini merangkum area yang berubah atau lebih jelas setelah membaca `tp-preneurs-multivendor-main(9).zip`.

### 30.1 File dan folder yang diverifikasi

```text
client/src/App.jsx
client/src/main.jsx
client/src/index.css
client/src/theme/ThemeProvider.jsx
client/src/components/Layout/StoreLayout.jsx
client/src/components/kachabazar-demo/StoreHeaderKacha.jsx
client/src/components/store/NotificationPreviewDropdown.jsx
client/src/pages/account/AccountNotificationsPage.jsx
client/src/pages/account/notifications2026/*
client/src/pages/account/AccountOrderDetailPage.jsx
client/src/pages/account/AccountOrderDetail2026View.jsx
client/src/pages/account/invoice/*
client/src/pages/account/AccountOrderPaymentPage.jsx
client/src/pages/account/AccountOrderPayment2026View.jsx
client/src/api/userNotifications.ts
client/src/api/orderPayments.ts
server/src/app.ts
server/src/routes/public.ts
server/src/routes/store.ts
server/src/routes/cartRoutes.ts
server/src/routes/checkout.ts
server/src/routes/orders.ts
server/src/routes/payments.ts
server/src/routes/user.storeApplications.ts
```

### 30.2 Perbedaan utama terhadap dokumen 2026-06-20

1. Jumlah file account aktif bertambah menjadi 47 karena ada subfolder `notifications2026` dan `invoice`.
2. Section notifications lama perlu dikoreksi: delete dan clear all sudah benar-benar dipakai oleh UI account page, bukan hanya tersedia di API.
3. Header notification sekarang bukan link langsung semata; ada dropdown preview yang memakai shared adapter.
4. Order detail sekarang mempunyai print invoice companion yang harus ikut dipertimbangkan saat redesign.
5. Theme meta color aktual berbeda dari dokumen lama: dark `#07111f`, light `#034c85`.
6. `StoreLayout` tidak meneruskan seluruh `storeSettings` ke header; header menerima `brandingLogoUrl`, sedangkan child route memperoleh `storeSettings` melalui outlet context.

### 30.3 Rekomendasi prioritas update berikutnya

- Jika membuat mockup/slicing halaman `/user/notifications`, gunakan struktur `notifications2026` dan jangan modifikasi langsung ke CSS lama `AccountNotificationsPage.css` kecuali memang diperlukan untuk kompatibilitas.
- Jika membuat mockup/slicing order detail, audit juga invoice print output dengan browser print preview.
- Jika membuat mockup/slicing payment page, uji minimal: copy amount, copy reference, view QR, save QR, upload proof image, submit proof, dan cancel payment.
- Jika membuat mockup header, uji notification dropdown di guest, account session tanpa unread, dan account session dengan unread.
- Jika membuat dark mode cleanup, gunakan token `--tp-*` dan cek shell `storefront-shell`, `account-shell`, dan `store-microsite-shell`.

## 31. Kesimpulan Arsitektur

Client / Storefront dalam repo ini adalah marketplace multi-vendor dengan enam lapisan besar:

1. **Public discovery layer:** home, shop/search, category redirect, product detail, offers, static pages.
2. **Wishlist/local preference layer:** wishlist localStorage dan event sync antar komponen.
3. **Vendor microsite layer:** public store page dan store-scoped product detail.
4. **Buyer transaction layer:** guest/remote cart, cart drawer/page, checkout preview/create, coupon, payment, order tracking.
5. **Buyer account layer:** dashboard, orders, payment proof/cancel, reviews, notifications, addresses, profile, change password.
6. **Buyer-to-seller bridge layer:** store application, seller invitations, seller workspace access summary.

Fondasi pengembangan berikutnya harus menjaga Storefront sebagai consumer disiplin terhadap data Admin/Seller/backend. Fokus utama adalah source of truth backend, compatibility route lama, variant-safe cart, wishlist local-only yang jelas, checkout multi-store backend-driven, payment/order action yang mengikuti contract, dan UI 2026 yang konsisten dengan theme light/dark/system serta palette brand `#034c85` dan `#fe6f05`.