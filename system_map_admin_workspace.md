# system_map_admin_workspace.md — Admin Workspace TP PRENEURS Multivendor

> Fondasi sistem untuk membantu AI memahami arsitektur, fitur, alur, route, model data, dan guardrail pengembangan **Admin Workspace** pada codebase `tp-preneurs-multivendor-main`.
>
> Sumber analisis: arsip terbaru `tp-preneurs-multivendor-main(12).zip`, diekstrak ke `/mnt/data/tp_admin_extract/tp-preneurs-multivendor-main`. File referensi lintas area `system_map_client _storefront.md` di dalam ZIP juga dicek untuk menjaga sinkronisasi Admin → Storefront.
>
> Tanggal update: 17 Juni 2026. Metode: static code analysis dari ZIP terbaru; build/test tidak dijalankan pada sesi ini.

---

## 0. Validasi Ulang ZIP Terbaru — 17 Juni 2026

Update ini dibuat dari ekstraksi ulang `tp-preneurs-multivendor-main(12).zip`. File `system_map_admin_workspace.md` yang terdapat di ZIP identik dengan file upload, tetapi metadata sebelumnya masih mengarah ke arsip lama `(2).zip`. Karena itu, dokumen ini disegarkan agar menjadi fondasi Admin Workspace terbaru yang konsisten dengan struktur codebase saat ini.

Temuan validasi terbaru:

| Area | Status dari ZIP terbaru | Catatan update |
|---|---|---|
| Root workspace | `server`, `client`, `packages/*` | Tetap monorepo PNPM workspace. |
| Frontend route source | `client/src/App.jsx` | Protected Admin Workspace tetap berada di `<Route path="/admin" element={<AdminGuard />}>` dan `<AdminLayout />`. |
| Layout aktif | `client/src/components/layouts/AdminLayout.jsx` | Layout aktif masih memakai Sidebar, Navbar, Search Palette, theme, dan collapse state. |
| Navigation source | `client/src/components/Layout/adminNavigation.jsx` | Menu canonical tetap memakai `/admin/catalog/...`, `/admin/store/...`, dan `/admin/international/...`. |
| RBAC client | `client/src/constants/permissions.js` | Role minimum tetap `staff`, `admin`, `super_admin`. |
| Backend mount source | `server/src/app.ts` | Semua `/api/admin` tetap melewati `requireAuth`, lalu middleware role per domain. |
| API adapter utama | `client/src/lib/adminApi.js` | Masih menjadi adapter dominan untuk products, categories, orders, customers, coupons, attributes, settings, languages, currencies, customization, dan store settings. |
| Cross-area storefront map | `system_map_client _storefront.md` | Storefront map menegaskan Admin mengatur customization/settings/coupons/store profile/payment profile yang dikonsumsi Storefront. |

Delta penting dibanding dokumen lama:

1. Metadata sumber analisis diperbarui dari ZIP lama `(2).zip` menjadi ZIP terbaru `(12).zip`.
2. Jumlah file service backend hasil scan terbaru adalah `45`, bukan `57`.
3. Permission route yang sebelumnya ditulis generik untuk beberapa settings page diperjelas: `payment-review`, `store-settings`, `payment-profiles`, dan `settings` berada di guard `SETTINGS_MANAGE` pada `App.jsx`.
4. QA section diperluas dengan smoke script yang ditemukan di `package.json` terbaru, termasuk admin public auth, admin staff, store customization, store payment profile, store application, product SEO, product variation validation, auth/session, dan shipment/order-payment.

Guardrail tambahan dari sinkronisasi Storefront:

- Jangan mengubah kontrak Admin `Store Customization`, `Store Settings`, `Coupons`, `Store Profile`, dan `Store Payment Profiles` tanpa mengecek dampaknya ke Client / Storefront.
- Storefront adalah consumer data Admin/Seller; Admin Workspace tetap source pengaturan platform/public store untuk banyak tampilan storefront.
- Bila mengubah admin coupon/payment/store readiness, jalankan smoke checkout/storefront yang relevan karena efeknya muncul pada public catalog, offers, checkout, dan store microsite.

---

## 1. Ringkasan Mental Model

Project ini adalah aplikasi **multi-vendor ecommerce** dengan tiga area besar:

1. **Storefront / customer-facing app** untuk pembeli.
2. **Seller Workspace** untuk vendor/toko mengelola toko, produk, order, pembayaran, dan tim.
3. **Admin Workspace** untuk pengelola platform mengelola katalog global, order, customer, staff, store governance, payment audit, konfigurasi toko, bahasa, mata uang, dan aplikasi toko.

Dokumen ini hanya memetakan **Admin Workspace**.

Admin Workspace menggunakan pola:

- **Frontend**: React 19 + Vite + React Router 7 + TanStack Query + axios.
- **Backend**: Express + TypeScript + Sequelize + MySQL.
- **Auth**: cookie-based session dengan cookie terpisah untuk admin dan storefront.
- **RBAC**: role `staff`, `admin`, `super_admin` dengan permission client-side untuk UX dan middleware backend untuk enforcement.
- **Route canonical frontend**: `/admin/...`, khusus katalog menggunakan `/admin/catalog/...`.
- **API backend canonical**: `/api/admin/...`.

Rule paling penting untuk AI/codegen:

- Jangan menambahkan halaman admin baru di route legacy seperti `/admin/products`; gunakan canonical `/admin/catalog/products`.
- Jangan memakai file legacy/duplikat sebagai sumber kebenaran tanpa verifikasi.
- Jangan bypass adapter API yang sudah ada di `client/src/lib/adminApi.js` dan `client/src/api/admin*.ts`.
- Jangan mengandalkan permission client-side saja; backend role middleware tetap sumber enforcement.

---

## 2. Stack, Runtime, dan Workspace

### 2.1 Monorepo

Root `package.json` mendefinisikan workspaces:

```json
[
  "server",
  "client",
  "packages/*"
]
```

Script penting di root:

| Script | Fungsi |
|---|---|
| `pnpm dev` / `pnpm dev:all` | menjalankan semua workspace secara paralel |
| `pnpm dev:server` | menjalankan backend dev |
| `pnpm dev:client` | menjalankan frontend dev |
| `pnpm build` | build server lalu client |
| `pnpm start` | menjalankan server |
| `pnpm db:sync` | sync database server |
| `pnpm seed:super` | seed super admin |
| `pnpm qa:admin:public-auth` | smoke test auth publik admin |
| `pnpm qa:admin:staff` | smoke test staff workflow |
| `pnpm qa:admin:staff-approval` | smoke test staff approval workflow |

### 2.2 Client

Lokasi: `client/`

Stack utama:

- React `^19.1.1`
- React Router DOM `^7.8.2`
- Vite `^7.1.2`
- TypeScript + JavaScript campuran
- TanStack Query `^5.85.6`
- axios
- zod
- React Hook Form
- lucide-react
- framer-motion
- recharts
- sonner / react-hot-toast / react-toastify
- html2canvas + jsPDF untuk export/print tertentu

Dev server default: Vite di port `5173`.

Proxy Vite:

- `/api` diarahkan ke backend default `http://localhost:3001`
- `/uploads` diarahkan ke backend default `http://localhost:3001`
- Host/port proxy bisa diganti melalui `VITE_PROXY_API_HOST` dan `VITE_PROXY_API_PORT`.
- Vite config juga memiliki manual vendor chunks: `vendor-react`, `vendor-router`, `vendor-query`, `vendor-ui`, `vendor-utils`, dan `vendor-misc`.

### 2.3 Server

Lokasi: `server/`

Stack utama:

- Express `^4.21.2`
- TypeScript
- Sequelize `^6.37.x`
- MySQL / mysql2
- cookie-parser
- jsonwebtoken
- bcrypt / bcryptjs
- multer
- nodemailer
- stripe

Runtime script server:

| Script | Fungsi |
|---|---|
| `pnpm --filter server dev` | `tsx watch src/server.ts` |
| `pnpm --filter server build` | build schema package + TypeScript server |
| `pnpm --filter server start` | `tsx src/server.ts` |
| `pnpm --filter server db:sync` | import models lalu sync DB |

Database config berada di `server/src/config/database.ts`.

Mode environment:

- Menggunakan `DATABASE_URL` bila tersedia.
- Alternatif memakai `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`.
- Default database development: `ecommerce_dev`.

### 2.4 Environment penting

Berdasarkan `.env.example`, variabel penting:

| Variable | Fungsi |
|---|---|
| `PORT=3001` | port backend |
| `AUTH_COOKIE_NAME=token` | cookie auth dasar |
| `COOKIE_SECURE=false` | dev cookie secure mode |
| `UPLOAD_DIR=uploads` | direktori upload |
| `VITE_API_BASE_URL=/api` | base URL client API |
| `VITE_SERVER_ORIGIN=http://localhost:3001` | origin server untuk asset/upload |
| `SUPER_ADMIN_EMAIL` | seed super admin |
| `SUPER_ADMIN_PASSWORD` | seed super admin |

---

## 3. Struktur Repo yang Relevan untuk Admin Workspace

```txt
tp-preneurs-multivendor-main/
├─ client/
│  ├─ src/
│  │  ├─ App.jsx                         # route tree frontend utama
│  │  ├─ api/
│  │  │  ├─ axios.ts                     # axios instance modern
│  │  │  ├─ index.ts                     # service export
│  │  │  └─ admin*.ts                    # API admin terpisah per domain tertentu
│  │  ├─ auth/
│  │  │  └─ AuthContext.jsx              # auth context account/admin
│  │  ├─ components/
│  │  │  ├─ AdminGuard.jsx               # guard route admin
│  │  │  ├─ RequirePerm.jsx              # guard permission frontend
│  │  │  ├─ layouts/AdminLayout.jsx      # layout admin AKTIF
│  │  │  ├─ Layout/Sidebar.jsx           # sidebar admin
│  │  │  ├─ Layout/Navbar.jsx            # navbar admin
│  │  │  ├─ Layout/adminNavigation.jsx   # definisi menu admin
│  │  │  └─ admin/                       # komponen admin domain-specific
│  │  ├─ constants/permissions.js        # permission map client-side
│  │  ├─ lib/adminApi.js                 # adapter API admin utama
│  │  ├─ pages/
│  │  │  ├─ Dashboard.jsx                # dashboard admin yang aktif dipakai App.jsx
│  │  │  └─ admin/                       # halaman admin
│  │  └─ utils/
│  └─ package.json
│
├─ server/
│  ├─ src/
│  │  ├─ app.ts                          # mount Express routes utama
│  │  ├─ middleware/
│  │  │  ├─ requireAuth.ts               # resolve auth user/session
│  │  │  └─ requireRole.ts               # role middleware
│  │  ├─ models/                         # Sequelize models + associations
│  │  ├─ routes/
│  │  │  ├─ auth.ts                      # storefront + admin auth
│  │  │  └─ admin*.ts                    # route admin per domain
│  │  ├─ services/                       # domain services
│  │  └─ utils/rbac.ts                   # role/rank helper
│  └─ package.json
│
└─ packages/
   └─ schemas/                           # shared schemas/contracts
```

Jumlah file yang ditemukan pada area admin:

| Area | Estimasi file relevan |
|---|---:|
| `client/src/pages/admin/*` | 38 |
| `client/src/components/admin/*` | 22 |
| `client/src/api/admin*.ts` | 11 |
| `server/src/routes/admin*.ts` | 29 |
| `server/src/models/*` | 33 |
| `server/src/services/*` | 45 |

---

## 4. Frontend Admin Workspace

### 4.1 Entry Point Routing

File sumber kebenaran route frontend: `client/src/App.jsx`.

Admin Workspace dimulai dari:

```jsx
<Route path="/admin" element={<AdminGuard />}>
  <Route element={<AdminLayout />}>
    ...admin routes...
  </Route>
</Route>
```

Public admin auth routes berada di luar protected layout:

| Route | Page |
|---|---|
| `/admin/login` | `AdminLoginPage` |
| `/admin/create-account` | `AdminCreateAccountPage` |
| `/admin/verify-account` | `AdminVerifyAccountPage` |
| `/admin/resend-verification` | `AdminResendVerificationPage` |
| `/admin/forgot-password` | `AdminForgotPasswordPage` |
| `/admin/reset-password` | `AdminResetPasswordPage` |
| `/admin/forbidden` | `AdminForbiddenPage` |

### 4.2 Canonical Protected Routes

| Route | Page/Component | Permission |
|---|---|---|
| `/admin` | `Dashboard` | `DASHBOARD_VIEW` |
| `/admin/dashboard` | `Dashboard` | `DASHBOARD_VIEW` |
| `/admin/catalog/products` | `AdminProductsPage` | `PRODUCTS_VIEW` |
| `/admin/catalog/products/new` | `AdminProductForm` | `PRODUCTS_CREATE` |
| `/admin/catalog/products/:id` | `AdminProductDetailPage` | `PRODUCTS_VIEW` |
| `/admin/catalog/products/:id/edit` | `AdminProductEditPage` | `PRODUCTS_UPDATE` |
| `/admin/orders` | `AdminOrdersPage` | `ORDERS_VIEW` |
| `/admin/orders/:invoiceNo` | `AdminOrderDetail` | `ORDERS_VIEW` |
| `/admin/notifications` | `AdminNotificationsPage` | `DASHBOARD_VIEW` |
| `/admin/customers` | `Customers` | `CUSTOMERS_VIEW` |
| `/admin/customers/:id` | `AdminCustomerDetailPage` | implicit customer detail access |
| `/admin/customer-orders/:id` | `AdminCustomerOrdersPage` | implicit customer order access |
| `/admin/catalog/categories` | `AdminCategoriesPage` | `CATEGORIES_CRUD` |
| `/admin/catalog/categories/id/:id` | `AdminSubCategoriesPage` | `CATEGORIES_CRUD` |
| `/admin/catalog/categories/:code` | `AdminSubCategoriesPage` | `CATEGORIES_CRUD` |
| `/admin/catalog/coupons` | `AdminCouponsPage` | `COUPONS_CRUD` |
| `/admin/catalog/attributes` | `AdminAttributesPage` | `ATTRIBUTES_CRUD` |
| `/admin/catalog/attributes/:attributeId/values` | `AdminAttributeValuesPage` | `ATTRIBUTES_CRUD` |
| `/admin/all-accounts` | `AdminStaffPage` | `STAFF_MANAGE` |
| `/admin/international/languages` | `LanguagesPage` | `SETTINGS_MANAGE` |
| `/admin/international/currencies` | `CurrenciesPage` | `SETTINGS_MANAGE` |
| `/admin/online-store/store-profile` | `AdminStoreProfilePage` | `SETTINGS_MANAGE` |
| `/admin/online-store/store-payment` | `AdminStorePaymentPage` | `SETTINGS_MANAGE` |
| `/admin/online-store/payment-review` | `AdminStorePaymentReviewPage` | `SETTINGS_MANAGE` |
| `/admin/online-store/payment-audit` | `AdminPaymentAuditPage` | `DASHBOARD_VIEW` |
| `/admin/online-store/payment-audit/:orderId` | `AdminPaymentAuditDetailPage` | `DASHBOARD_VIEW` |
| `/admin/online-store/shipping-reconciliation` | `AdminShippingReconciliationPage` | `DASHBOARD_VIEW` |
| `/admin/store/customization` | `StoreCustomizationPage` | `SETTINGS_MANAGE` |
| `/admin/customization` | `StoreCustomizationPage` | `SETTINGS_MANAGE` |
| `/admin/store/store-settings` | `StoreSettingsPage` | `SETTINGS_MANAGE` |
| `/admin/store/payment-profiles` | `AdminStorePaymentProfilesPage` | `SETTINGS_MANAGE` |
| `/admin/store/applications` | `AdminStoreApplicationsPage` | `STORE_APPLICATIONS_REVIEW` |
| `/admin/store/applications/:applicationId` | `AdminStoreApplicationDetailPage` | `STORE_APPLICATIONS_REVIEW` |
| `/admin/settings` | `Settings` | `SETTINGS_MANAGE` |
| `/admin/profile` | `AdminProfilePage` | authenticated admin |

### 4.3 Legacy Redirects

App masih menyimpan redirect dari route lama agar link lama tidak broken.

| Legacy Route | Redirect To |
|---|---|
| `/admin/products` | `/admin/catalog/products` |
| `/admin/products/new` | `/admin/catalog/products/new` |
| `/admin/products/:id` | `/admin/catalog/products/:id` |
| `/admin/categories` | `/admin/catalog/categories` |
| `/admin/categories/id/:id` | `/admin/catalog/categories/id/:id` |
| `/admin/categories/:code` | `/admin/catalog/categories/:code` |
| `/admin/attributes` | `/admin/catalog/attributes` |
| `/admin/coupons` | `/admin/catalog/coupons` |
| `/admin/languages` | `/admin/international/languages` |
| `/admin/currencies` | `/admin/international/currencies` |
| `/admin/store-customization` | `/admin/store/customization` |
| `/admin/online-store/store-settings` | `/admin/store/store-settings` |
| `/admin/store-settings` | `/admin/store/store-settings` |
| `/admin/online-store/store-applications` | `/admin/store/applications` |
| `/admin/staff` | `/admin/all-accounts` |
| `/admin/our-staff` | `/admin/all-accounts` |

AI/codegen harus menghasilkan link ke route canonical, bukan legacy route.

---

## 5. Layout, Navigasi, Search Palette, dan Theme

### 5.1 Admin Layout Aktif

File aktif: `client/src/components/layouts/AdminLayout.jsx`.

Tugas layout:

- Render `Sidebar`.
- Render `Navbar`.
- Render `AdminSearchPalette`.
- Render nested route via `<Outlet />`.
- Simpan theme admin ke `localStorage` key `admin_theme`.
- Simpan state sidebar collapse ke `localStorage` key `admin_sidebar_collapsed`.
- Mendukung shortcut `Ctrl/Cmd + K` untuk search palette.

Catatan penting:

- Ada file `client/src/layouts/AdminLayout.jsx`, tetapi **bukan layout aktif** untuk route tree saat ini.
- Jangan menjadikan file legacy tersebut sebagai dasar redesign kecuali sudah diverifikasi ulang dari `App.jsx`.

### 5.2 Sidebar

File: `client/src/components/Layout/Sidebar.jsx`.

Karakteristik:

- Mengambil menu dari `getAllowedAdminNavigation(user)`.
- Menentukan active state dengan `matchesRoute`.
- Brand: `TP PRENEURS`.
- Workspace label: `Admin Workspace`.
- Mendukung collapse.
- Memiliki group collapsible seperti `International` dan `Online Store`.
- Logout menggunakan `useAuth().logout`, membersihkan query admin, lalu navigasi ke `/admin/login`.

### 5.3 Navbar

File: `client/src/components/Layout/Navbar.jsx`.

Tugas utama:

- Menentukan page title dari pathname.
- Menampilkan tombol route search, kecuali pada route coupons tertentu.
- Menampilkan language selector dari `fetchAdminLanguages()`.
- Menyimpan bahasa admin ke `localStorage` key `adminLanguage`.
- Theme toggle.
- Notification entry.
- Profile menu.

### 5.4 Navigation Source

File: `client/src/components/Layout/adminNavigation.jsx`.

Menu utama:

| Section | Items |
|---|---|
| General | Dashboard |
| Catalog | Products, Categories, Attributes, Coupons, Campaigns disabled |
| Sales | Customers, Orders |
| Workspace | All Accounts, Settings, International, Online Store |

Submenu Workspace:

- International
  - Languages
  - Currencies
- Online Store
  - View Store
  - Store Customization
  - Store Profile
  - Store Settings
  - Store Payment
  - Payment Audit
  - Shipping Reconciliation
  - Store Applications

Navigation difilter dengan `can(user, perm)`. Search palette memakai flattened allowed navigation yang sama.

---

## 6. Auth dan RBAC

### 6.1 Admin Guard Frontend

File: `client/src/components/AdminGuard.jsx`.

Alur:

1. Memanggil `useAdminAuth()`.
2. Memvalidasi session lewat `/api/auth/admin/me`.
3. Jika tidak authenticated atau error session, redirect ke `/admin/login`.
4. Hanya role berikut yang dianggap admin-capable:
   - `admin`
   - `super_admin`
   - `superadmin`
   - `staff`
5. Non-admin role diarahkan ke `/admin/login`.

### 6.2 Auth Context

File: `client/src/auth/AuthContext.jsx`.

Ciri penting:

- Auth scope dipisah antara `account` dan `admin` berdasarkan prefix pathname `/admin`.
- Session hint localStorage:
  - `adminSessionHint`
  - `accountSessionHint`
  - legacy `authSessionHint`
- Admin login memakai `adminLoginRequest` ke `/api/auth/admin/login`.
- Backend tetap cookie-based. LocalStorage token/hint bukan sumber kebenaran auth.
- Admin logout memanggil `/api/auth/admin/logout`, clear admin state, clear query cache.

### 6.3 Admin Auth Backend

File utama: `server/src/routes/auth.ts`.

Endpoint admin auth:

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/api/auth/admin/login` | login admin/staff/super admin |
| `GET` | `/api/auth/admin/me` | session admin current user |
| `POST` | `/api/auth/admin/logout` | logout admin |
| `POST` | `/api/auth/admin/register` | self-signup staff/admin publik |
| `POST` | `/api/auth/admin/register/resend-verification` | resend verification |
| `GET` | `/api/auth/admin/verify-email` | verify email |
| `POST` | `/api/auth/admin/forgot-password` | request reset password |
| `POST` | `/api/auth/admin/reset-password` | confirm reset password |

Login admin melakukan validasi:

- Email/password benar.
- Role harus `staff`, `admin`, `super_admin`, atau `superadmin`.
- Status:
  - `pending_verification` => `VERIFICATION_REQUIRED`
  - `pending_approval` => `APPROVAL_REQUIRED`
  - `inactive` => `ACCOUNT_INACTIVE`
  - `active` => issue scoped admin cookie

Storefront login memblokir role admin dengan code `ADMIN_WORKSPACE_LOGIN_REQUIRED`.

### 6.4 Auth Middleware Backend

File: `server/src/middleware/requireAuth.ts`.

Ciri penting:

- Untuk request admin `/api/admin`, middleware mengutamakan admin cookie:
  - `ADMIN_AUTH_COOKIE_NAME`, atau
  - `${AUTH_COOKIE_NAME}_admin`
- Untuk storefront menggunakan `AUTH_COOKIE_NAME` atau default `token`.
- User di-resolve lewat token valid dan dilampirkan ke request.

### 6.5 Role dan Permission

File sumber backend:

- `server/src/middleware/requireRole.ts`
- `server/src/utils/rbac.ts`

Role rank:

| Role | Rank | Makna |
|---|---:|---|
| `staff` | 1 | akses operasional dasar |
| `admin` | 2 | akses pengelolaan katalog/settings tertentu |
| `super_admin` | 3 | akses tertinggi, termasuk staff management |

Helper/middleware penting:

- `requireStaffOrAdmin`
- `requireAdmin`
- `requireSuperAdmin`

File sumber client permission: `client/src/constants/permissions.js`.

| Permission | Minimal Role |
|---|---|
| `DASHBOARD_VIEW` | staff |
| `ORDERS_VIEW` | staff |
| `ORDERS_UPDATE_STATUS` | staff |
| `PRODUCTS_VIEW` | staff |
| `CUSTOMERS_VIEW` | staff |
| `PRODUCTS_CREATE` | admin |
| `PRODUCTS_UPDATE` | admin |
| `PRODUCTS_DELETE` | admin |
| `STORE_APPLICATIONS_REVIEW` | admin |
| `CATEGORIES_CRUD` | admin |
| `COUPONS_CRUD` | admin |
| `ATTRIBUTES_CRUD` | admin |
| `CUSTOMERS_UPDATE` | admin |
| `STAFF_MANAGE` | super_admin |
| `SETTINGS_MANAGE` | super_admin |

Guardrail:

- `RequirePerm` di frontend hanya UX guard.
- Backend middleware tetap enforcement utama.
- File `server/src/middleware/requireAdmin.ts` memiliki nama menyesatkan dan berisi error-handler style code, bukan sumber kebenaran RBAC.

---

## 7. API Layer Frontend

### 7.1 Axios Modern

Gunakan `client/src/api/axios.ts` dan service/API adapter yang sudah ada.

Catatan penting:

- `client/src/lib/http.ts` ditandai deprecated: “Do not use. Use client/src/api/axios.ts + services instead.”
- Jangan membuat raw fetch/axios baru di halaman jika adapter domain sudah tersedia.

### 7.2 Adapter Admin Utama

File: `client/src/lib/adminApi.js`.

Domain yang dicakup:

#### Products

- `fetchAdminProducts`
- `fetchAdminProduct`
- `createAdminProduct`
- `updateAdminProduct`
- `updateAdminProductPublished`
- `approveAdminProductReview`
- `duplicateAdminProduct`
- `requestAdminProductRevision`
- `toggleAdminProductPublish`
- `deleteAdminProduct`
- `bulkAdminProducts`
- `exportAdminProducts`
- `importAdminProducts`
- `uploadAdminImage`

#### Categories

- `fetchAdminCategories`
- `fetchAdminCategory`
- `createAdminCategory`
- `updateAdminCategory`
- `deleteAdminCategory`
- `bulkAdminCategories`
- `exportAdminCategories`
- `importAdminCategories`

#### Orders

- `fetchAdminOrders`
- `fetchAdminOrder`
- `fetchAdminOrderByInvoice`
- `updateAdminOrderStatus`
- `bulkDeleteAdminOrders`
- `correctAdminShipmentException`
- `fetchAdminShippingReconciliationReport`

#### Customers

- `fetchAdminCustomers`
- `fetchAdminCustomer`
- `updateAdminCustomer`
- `exportAdminCustomers`
- `importAdminCustomers`
- `fetchAdminCustomerOrders`

#### Coupons

- `fetchAdminCoupons`
- `fetchAdminCouponMeta`
- `exportAdminCoupons`
- `importAdminCoupons`
- `bulkAdminCoupons`
- `createAdminCoupon`
- `updateAdminCoupon`
- `deleteAdminCoupon`

#### Attributes

- `fetchAdminAttributes`
- `fetchAdminAttributeValues`
- `createAdminAttributeValue`
- `updateAdminAttributeValue`
- `deleteAdminAttributeValue`
- `bulkDeleteAdminAttributeValues`
- `createAdminAttribute`
- `updateAdminAttribute`
- `deleteAdminAttribute`
- `bulkAdminAttributes`
- `exportAdminAttributes`
- `importAdminAttributes`

#### Settings, Languages, Currencies, Customization

- `fetchAdminSettings`
- `updateAdminSettings`
- `fetchAdminLanguages`
- `createAdminLanguage`
- `updateAdminLanguage`
- `deleteAdminLanguage`
- `bulkDeleteAdminLanguages`
- `fetchAdminCurrencies`
- `createAdminCurrency`
- `updateAdminCurrency`
- `deleteAdminCurrency`
- `bulkDeleteAdminCurrencies`
- `fetchAdminStoreCustomization`
- `updateAdminStoreCustomization`
- `fetchAdminStoreSettings`
- `updateAdminStoreSettings`
- `uploadAdminBrandingLogo`
- `uploadAdminStoreHeaderLogo`

### 7.3 Adapter Admin Tambahan

| File | Domain |
|---|---|
| `client/src/api/adminPublicAuth.ts` | register/verify/resend/forgot/reset password admin public auth |
| `client/src/api/adminStaff.ts` | staff CRUD dan approval |
| `client/src/api/adminStoreApplications.ts` | list/detail/approve/revision/reject store application |
| `client/src/api/adminStoreProfile.ts` | list/update store profile |
| `client/src/api/adminPaymentAudit.ts` | payment audit list/detail |
| `client/src/api/adminNotifications.ts` | notification list/unread/preferences/read/delete |
| `client/src/api/adminProfile.ts` | admin profile/me update/upload |
| `client/src/api/adminCustomers.ts` | thin customer helper |
| `client/src/api/adminOrders.ts` | thin order helper |
| `client/src/api/adminProducts.ts` | thin product helper |
| `client/src/api/adminDashboard.ts` | dashboard helper |

### 7.4 Envelope Response

Banyak endpoint admin memakai envelope yang bervariasi:

- `{ data: ... }`
- `{ success: true, data: ... }`
- `{ data: { items, meta } }`
- response langsung array/object pada helper tertentu

Karena itu, gunakan adapter existing yang sudah melakukan normalisasi response.

---

## 8. Backend Admin Route Mount Map

File sumber: `server/src/app.ts`.

Sebelum route admin, server memasang:

```ts
app.use('/api/admin', requireAuth)
```

Lalu domain route admin dipasang dengan role middleware masing-masing.

| Mount | Middleware | Route Module |
|---|---|---|
| `/api/admin/catalog` | `requireAdmin` | `admin.catalog` |
| `/api/admin/stats` | `requireStaffOrAdmin` | `admin.stats` |
| `/api/admin/analytics` | `requireStaffOrAdmin` | `admin.analytics` |
| `/api/admin/products` | `requireStaffOrAdmin` | `admin.products` |
| `/api/admin/orders` | `requireStaffOrAdmin` | `admin.orders` |
| `/api/admin/customers` | `requireStaffOrAdmin` | `admin.customers` |
| `/api/admin/notifications` | `requireStaffOrAdmin` | `admin.notifications` |
| `/api/admin/payments/audit` | `requireStaffOrAdmin` | `admin.payments.audit` |
| `/api/admin/categories` | `requireAdmin` | `admin.categories` |
| `/api/admin/coupons` | `requireAdmin` | `admin.coupons` |
| `/api/admin/attributes` | `requireAdmin` | `admin.attributes` |
| `/api/admin/settings` | `requireAdmin` | `admin.settings` |
| `/api/admin/languages` | `requireAdmin` | `admin.languages` |
| `/api/admin/currencies` | `requireAdmin` | `admin.currencies` |
| `/api/admin/store/customization` | `requireAdmin` | `admin.storeCustomization` |
| `/api/admin` | `requireAdmin` | `admin.storeProfiles` |
| `/api/admin/store/settings` | `requireAdmin` | `admin.storeSettings` |
| `/api/admin/stores` | `requireAdmin` | `admin.storePaymentProfiles` |
| `/api/admin` | `requireAdmin` | `admin.storeApplications` |
| `/api/admin` | `requireAdmin` | `admin.attributeValues` |
| `/api/admin` | `requireAdmin` | `admin.productAttributes` |
| `/api/admin/staff` | `requireSuperAdmin` | `admin.staff` |
| `/api/admin` | `requireStaffOrAdmin` | `admin.uploads` |

Catatan:

- `server/src/routes/admin.index.ts` dan `server/src/routes/admin.ts` ada, tetapi bukan mount source aktif di `server/src/app.ts` saat analisis ini.
- Gunakan `app.ts` sebagai sumber kebenaran route aktif.

---

## 9. Endpoint Inventory Admin Backend

### 9.1 Analytics dan Stats

`server/src/routes/admin.analytics.ts`, mounted `/api/admin/analytics`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/overview` | analytics overview |
| `GET` | `/summary` | analytics summary |
| `GET` | `/sales` | sales analytics |
| `GET` | `/weekly-sales` | weekly sales chart |
| `GET` | `/best-selling` | best-selling products |
| `GET` | `/recent-orders` | recent orders |

`server/src/routes/admin.stats.ts`, mounted `/api/admin/stats`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/` | stats default |
| `GET` | `/overview` | overview dashboard |
| `GET` | `/statistics` | statistic summary |
| `GET` | `/weekly` | weekly trend |
| `GET` | `/best-sellers` | best sellers |

Dashboard aktif di `client/src/pages/Dashboard.jsx` lebih banyak memakai `/api/admin/stats/*` melalui `analytics.service.js`.

### 9.2 Products

`server/src/routes/admin.products.ts`, mounted `/api/admin/products`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/` | list/search/filter produk |
| `GET` | `/export` | export produk |
| `POST` | `/import` | import produk |
| `POST` | `/bulk` | bulk action produk |
| `POST` | `/:id/duplicate` | duplicate produk |
| `GET` | `/:id` | detail produk |
| `POST` | `/` | create produk |
| `PATCH` | `/:id` | update produk |
| `PATCH` | `/:id/revision-request` | request seller revision |
| `PATCH` | `/:id/published` | toggle publish |
| `DELETE` | `/:id` | delete produk |

`server/src/routes/admin.catalog.ts`, mounted `/api/admin/catalog`, juga memiliki product CRUD legacy:

| Method | Path |
|---|---|
| `GET` | `/products` |
| `POST` | `/products` |
| `GET` | `/products/:id` |
| `PUT` | `/products/:id` |
| `DELETE` | `/products/:id` |

Gunakan `/api/admin/products` untuk workflow admin modern kecuali ada alasan kompatibilitas khusus.

### 9.3 Product Attributes Link

`server/src/routes/admin.productAttributes.ts`, mounted `/api/admin`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/products/:id/attributes` | ambil attribute mapping produk |
| `PUT` | `/products/:id/attributes` | update attribute mapping produk |

### 9.4 Categories

`server/src/routes/admin.categories.ts`, mounted `/api/admin/categories`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/` | list kategori |
| `POST` | `/` | create kategori |
| `GET` | `/export` | export kategori |
| `POST` | `/import` | import kategori |
| `GET` | `/:id` | detail kategori |
| `PATCH` | `/:id` | update kategori |
| `PATCH` | `/:id/publish` | toggle publish |
| `DELETE` | `/:id` | delete kategori |
| `POST` | `/bulk` | bulk delete/publish/unpublish |

### 9.5 Attributes dan Values

`server/src/routes/admin.attributes.ts`, mounted `/api/admin/attributes`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/` | list attributes |
| `GET` | `/export` | export attributes |
| `POST` | `/import` | import attributes |
| `POST` | `/bulk` | bulk action attributes |
| `POST` | `/` | create attribute |
| `PATCH` | `/:id` | update attribute |
| `DELETE` | `/:id` | delete attribute |

`server/src/routes/admin.attributeValues.ts`, mounted `/api/admin`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/attributes/:id/values` | list values by attribute |
| `POST` | `/attributes/:id/values` | create value |
| `PATCH` | `/attribute-values/:id` | update value |
| `POST` | `/attribute-values/bulk-delete` | bulk delete values |
| `DELETE` | `/attribute-values/:id` | delete value |

### 9.6 Coupons

`server/src/routes/admin.coupons.ts`, mounted `/api/admin/coupons`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/meta` | metadata coupon, termasuk stores |
| `GET` | `/` | list coupon |
| `GET` | `/export` | export coupon |
| `POST` | `/` | create coupon |
| `POST` | `/import` | import coupon |
| `PATCH` | `/:id` | update coupon |
| `POST` | `/bulk` | bulk activate/deactivate/delete |
| `DELETE` | `/:id` | delete coupon |

### 9.7 Orders dan Shipping Reconciliation

`server/src/routes/admin.orders.ts`, mounted `/api/admin/orders`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/` | list order |
| `GET` | `/export` | export order |
| `GET` | `/export.csv` | export order CSV |
| `GET` | `/by-invoice/:invoiceNo` | detail order by invoice number |
| `GET` | `/shipping-reconciliation/report` | report shipment reconciliation |
| `GET` | `/:id` | detail order by id |
| `PATCH` | `/:id/suborders/:suborderId/shipment-correction` | koreksi shipment exception |
| `PATCH` | `/:id/status` | update parent order status |
| `POST` | `/bulk-delete` | bulk delete order |

### 9.8 Payment Audit

`server/src/routes/admin.payments.audit.ts`, mounted `/api/admin/payments/audit`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/` | payment audit list |
| `GET` | `/:orderId` | payment audit detail |

### 9.9 Customers

`server/src/routes/admin.customers.ts`, mounted `/api/admin/customers`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/` | list customer |
| `GET` | `/export` | export customer |
| `POST` | `/import` | import customer |
| `GET` | `/:id` | detail customer |
| `POST` | `/` | create customer |
| `PUT` | `/:id` | update customer |
| `DELETE` | `/:id` | delete customer |

### 9.10 Staff / All Accounts

`server/src/routes/admin.staff.ts`, mounted `/api/admin/staff` dengan `requireSuperAdmin`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/` | list staff/account |
| `GET` | `/:id` | detail staff/account |
| `POST` | `/` | create staff/account |
| `PATCH` | `/:id` | update staff/account |
| `POST` | `/:id/approve` | approve pending staff self-signup |
| `DELETE` | `/:id` | delete/deactivate staff/account |

### 9.11 Languages dan Currencies

`server/src/routes/admin.languages.ts`, mounted `/api/admin/languages`:

| Method | Path |
|---|---|
| `GET` | `/` |
| `POST` | `/` |
| `PUT` | `/:id` |
| `DELETE` | `/:id` |
| `POST` | `/bulk-delete` |

`server/src/routes/admin.currencies.ts`, mounted `/api/admin/currencies`:

| Method | Path |
|---|---|
| `GET` | `/` |
| `POST` | `/` |
| `PUT` | `/:id` |
| `DELETE` | `/:id` |
| `POST` | `/bulk-delete` |

### 9.12 Settings dan Store Settings

`server/src/routes/admin.settings.ts`, mounted `/api/admin/settings`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/` | get admin settings |
| `PUT` | `/` | update admin settings |

`server/src/routes/admin.storeSettings.ts`, mounted `/api/admin/store/settings`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/` | get store settings contract |
| `PUT` | `/` | update store settings |
| `POST` | `/branding/:target/logo` | upload logo/branding target |

### 9.13 Store Customization

`server/src/routes/admin.storeCustomization.ts`, mounted `/api/admin/store/customization`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/header` | get header config |
| `PUT` | `/header` | update header config |
| `POST` | `/header/logo` | upload header logo |
| `GET` | `/` | get full customization |
| `PUT` | `/` | update full customization |
| `PUT` | `/microsites/rich-about` | update rich about microsite |

### 9.14 Store Profiles

`server/src/routes/admin.storeProfiles.ts`, mounted `/api/admin`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/store/profiles` | list store profile |
| `PATCH` | `/store/profiles/:storeId` | update admin-owned profile fields |

### 9.15 Store Payment Profiles

`server/src/routes/admin.storePaymentProfiles.ts`, mounted `/api/admin/stores`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/payment-profiles` | list store payment profiles/review state |
| `PATCH` | `/:storeId/identity` | update identity fields |
| `PATCH` | `/:storeId/payment-profile/review` | approve/reject/revision payment profile |

### 9.16 Store Applications

`server/src/routes/admin.storeApplications.ts`, mounted `/api/admin`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/store-applications` | list store applications |
| `GET` | `/store-applications/:applicationId` | detail application |
| `PATCH` | `/store-applications/:applicationId/approve` | approve application |
| `PATCH` | `/store-applications/:applicationId/revision-request` | request revision |
| `PATCH` | `/store-applications/:applicationId/reject` | reject application |

### 9.17 Notifications

`server/src/routes/admin.notifications.ts`, mounted `/api/admin/notifications`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/stream` | notification stream |
| `GET` | `/` | list notifications |
| `GET` | `/unread-count` | unread count |
| `GET` | `/preferences` | get preferences |
| `PUT` | `/preferences` | update preferences |
| `PATCH` | `/read-all` | mark all read |
| `DELETE` | `/` | clear notifications |
| `DELETE` | `/:id` | delete notification |
| `PATCH` | `/:id/read` | mark one read |

### 9.18 Admin Profile / Uploads

`server/src/routes/admin.uploads.ts`, mounted `/api/admin`:

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/me` | current admin profile |
| `PUT` | `/me` | update current admin profile |
| `POST` | `/uploads` | generic admin upload |

---

## 10. Feature Domain Map

### 10.1 Dashboard

Frontend aktif:

- `client/src/pages/Dashboard.jsx`

Bukan halaman aktif utama:

- `client/src/pages/admin/AdminDashboardPage.jsx` ada, tetapi route aktif di `App.jsx` memakai `Dashboard.jsx`.

Data source:

- `client/src/api/index.ts`
- `analyticsService`
- `orderService`
- `/api/admin/stats/overview`
- `/api/admin/stats/weekly`
- `/api/admin/stats/best-sellers`
- `/api/admin/orders`

AI guardrail:

- Saat mengubah dashboard, cek `App.jsx`; jangan langsung edit `AdminDashboardPage.jsx` tanpa memastikan page itu benar-benar dirender.

### 10.2 Products

Frontend:

- `client/src/pages/admin/Products.jsx`
- `client/src/pages/admin/ProductForm.jsx`
- `client/src/pages/admin/AdminProductDetailPage.jsx`
- `client/src/pages/admin/AdminProductEditPage.jsx`
- `client/src/components/admin/ProductPreviewDrawer.jsx`
- `client/src/utils/adminProductVariations.js`
- `client/src/services/adapters/productAdapter.js`

Backend:

- `server/src/routes/admin.products.ts`
- `server/src/routes/admin.productAttributes.ts`
- `server/src/models/Product.ts`
- `server/src/models/ProductCategory.ts`
- `server/src/models/Category.ts`
- product-related services/contracts di `server/src/services/`

Kapabilitas:

- List/search/filter produk.
- Create/update/delete.
- Duplicate produk.
- Publish/unpublish.
- Import/export.
- Bulk actions.
- Product variation validation.
- SEO/tag/media normalization.
- Product attribute mapping.
- Seller submission/revision workflow.

Workflow seller review pada produk memakai field:

- `sellerSubmissionStatus`
- `sellerSubmittedAt`
- `sellerSubmittedByUserId`
- `sellerRevisionRequestedAt`
- `sellerRevisionRequestedByUserId`
- `sellerRevisionNote`

Admin action penting:

- `PATCH /api/admin/products/:id/published`
- `PATCH /api/admin/products/:id/revision-request`
- `POST /api/admin/products/:id/duplicate`

### 10.3 Categories

Frontend:

- `client/src/pages/admin/AdminCategoriesPage.jsx`
- `client/src/pages/admin/AdminSubCategoriesPage.jsx`

Backend:

- `server/src/routes/admin.categories.ts`
- `server/src/models/Category.ts`
- `server/src/models/ProductCategory.ts`

Karakteristik:

- Hierarchical category dengan `parentId`.
- Detail bisa diakses via id atau code dari frontend canonical route.
- Backend mencegah parent cycle pada update kategori.
- Export/import tersedia.
- Bulk actions: delete, publish, unpublish.

### 10.4 Attributes dan Attribute Values

Frontend:

- `client/src/pages/admin/AdminAttributesPage.jsx`
- `client/src/pages/admin/AdminAttributeValuesPage.jsx`
- `client/src/components/admin/attributes/AttributePage.jsx`
- `client/src/components/admin/attributes/AttributeValuesPage.jsx`

Backend:

- `server/src/routes/admin.attributes.ts`
- `server/src/routes/admin.attributeValues.ts`
- `server/src/routes/admin.productAttributes.ts`

Karakteristik:

- Attribute CRUD.
- Attribute value CRUD.
- Bulk delete values.
- Export/import attributes.
- Attribute dapat memiliki scope/platform/store tergantung model/contract.
- Product attribute mapping tersedia melalui `/api/admin/products/:id/attributes`.

### 10.5 Coupons

Frontend:

- `client/src/pages/admin/AdminCouponsPage.jsx`

Backend:

- `server/src/routes/admin.coupons.ts`
- `server/src/models/Coupon.ts`
- shared coupon governance contract.

Karakteristik:

- Platform coupon dan store-scoped coupon.
- `scopeType = PLATFORM | STORE`.
- Store-scoped coupon wajib memiliki `storeId` valid.
- `GET /api/admin/coupons/meta` menyediakan metadata, termasuk daftar stores.
- Import menerima JSON array atau object dengan `items`.
- Bulk action: `activate`, `deactivate`, `delete`.

### 10.6 Orders

Frontend:

- `client/src/pages/admin/AdminOrdersPage.jsx`
- `client/src/pages/admin/AdminOrderDetail.jsx`
- `client/src/pages/admin/AdminShippingReconciliationPage.jsx`

Backend:

- `server/src/routes/admin.orders.ts`
- `server/src/models/Order.ts`
- `server/src/models/OrderItem.ts`
- `server/src/models/Suborder.ts`
- `server/src/models/SuborderItem.ts`
- `server/src/models/Payment.ts`
- `server/src/models/Shipment.ts`
- order/shipment services.

Karakteristik:

- Parent order memiliki invoice, customer, shipping snapshot, payment summary, status.
- Suborder merepresentasikan order split per store/vendor.
- List/detail order menyertakan payment status meta, shipping read model, suborder shipment summary, dan lifecycle contract.
- Detail bisa diambil by id atau invoice number.
- Status update melakukan eligibility inspection.
- Delivered parent order mensyaratkan seluruh active suborder delivered.
- Status update membuat user notification.
- Shipment exception correction memakai operational audit.
- Bulk delete memvalidasi deletion eligibility dan cascade delete.

### 10.7 Payment Audit

Frontend:

- `client/src/pages/admin/AdminPaymentAuditPage.jsx`
- `client/src/pages/admin/AdminPaymentAuditDetailPage.jsx`

Backend:

- `server/src/routes/admin.payments.audit.ts`
- `server/src/models/Payment.ts`
- `server/src/models/PaymentProof.ts`
- `server/src/models/PaymentStatusLog.ts`
- `server/src/models/Suborder.ts`
- `server/src/models/Shipment.ts`
- `server/src/models/TrackingEvent.ts`

Karakteristik:

- Audit list dan detail berbasis order.
- Memuat Order/Suborder/Payment/PaymentProof/PaymentStatusLog/Shipment/TrackingEvent.
- Dapat mengeksekusi expiry handling untuk overdue payments.
- Membangun grouped payment/read model dan split operational truth.

### 10.8 Customers

Frontend:

- `client/src/pages/admin/Customers.jsx`
- `client/src/pages/admin/AdminCustomerDetailPage.jsx`
- `client/src/pages/admin/AdminCustomerOrdersPage.jsx`

Backend:

- `server/src/routes/admin.customers.ts`
- `server/src/models/User.ts`
- order relations.

Kapabilitas:

- List/search/filter customer.
- Detail customer.
- Update customer.
- Export/import.
- Delete customer.
- Customer order history.

### 10.9 Staff / All Accounts

Frontend:

- `client/src/pages/admin/AdminStaffPage.jsx`

Backend:

- `server/src/routes/admin.staff.ts`
- `server/src/models/User.ts`

Akses:

- Frontend permission: `STAFF_MANAGE`.
- Backend middleware: `requireSuperAdmin`.

Role yang dikelola:

- `staff`
- `admin`
- `super_admin`
- `seller`

Seller role presets dalam layar yang sama:

- `CATALOG_MANAGER`
- `ORDER_MANAGER`
- `FINANCE_VIEWER`
- `CONTENT_MANAGER`

Policy penting:

- Staff image upload ke `uploads/staff`.
- Format image: JPG/PNG/WEBP.
- Max size: 2 MB.
- Password minimal 8 karakter dengan minimal 1 huruf dan 1 angka.
- Tidak boleh self-deactivate.
- Tidak boleh self-delete.
- Tidak boleh self-demote dari super admin.
- Pending self-signup staff dapat diapprove via `POST /api/admin/staff/:id/approve`.

### 10.10 International: Languages dan Currencies

Frontend:

- `client/src/pages/admin/LanguagesPage.jsx`
- `client/src/pages/admin/CurrenciesPage.jsx`

Backend:

- `server/src/routes/admin.languages.ts`
- `server/src/routes/admin.currencies.ts`
- `server/src/models/Language.ts`
- `server/src/models/Currency.ts`

Karakteristik:

- CRUD language dan currency.
- Bulk delete.
- Navbar mengambil languages dari `fetchAdminLanguages()`.
- Selected admin language disimpan di localStorage `adminLanguage`.

### 10.11 Settings dan Branding

Frontend:

- `client/src/pages/admin/Settings.jsx`
- `client/src/pages/admin/StoreSettings.jsx`

Backend:

- `server/src/routes/admin.settings.ts`
- `server/src/routes/admin.storeSettings.ts`

Karakteristik:

- `Settings.jsx` mengelola common/admin branding, termasuk admin logo dan admin auth hero images.
- `StoreSettings.jsx` mengelola store settings dan branding target.
- Branding upload target:
  - `client`
  - `admin`
  - `seller`
  - `admin-login-hero`
  - `admin-forgot-password-hero`
  - `admin-create-account-hero`

### 10.12 Store Customization

Frontend:

- `client/src/pages/admin/StoreCustomizationPage.jsx`

Backend:

- `server/src/routes/admin.storeCustomization.ts`

Karakteristik:

- Language-scoped customization.
- Memastikan table/config `store_customizations` tersedia.
- Header config:
  - `GET /api/admin/store/customization/header`
  - `PUT /api/admin/store/customization/header`
  - `POST /api/admin/store/customization/header/logo`
- Full customization:
  - `GET /api/admin/store/customization`
  - `PUT /api/admin/store/customization`
- Microsite rich-about:
  - `PUT /api/admin/store/customization/microsites/rich-about`
  - Wajib `storeSlug`.
  - Konten disimpan di `storeMicrosites[storeSlug].richAbout`.
- WhatsApp link divalidasi.

### 10.13 Store Profiles

Frontend:

- `client/src/pages/admin/AdminStoreProfilePage.jsx`

Backend:

- `server/src/routes/admin.storeProfiles.ts`
- `server/src/models/Store.ts`

Karakteristik:

- Admin melihat list store profile.
- API mengembalikan snapshot toko, public identity, owner, dan field governance admin-owned.
- Admin dapat patch admin-owned profile/operational visibility fields.

### 10.14 Store Payment Profiles

Frontend:

- `client/src/pages/admin/AdminStorePaymentProfilesPage.jsx`
- halaman lama terkait payment review juga ada di area online store.

Backend:

- `server/src/routes/admin.storePaymentProfiles.ts`
- `server/src/models/StorePaymentProfile.ts`
- `server/src/models/StorePaymentProfileRequest.ts`

Workflow:

| State | Makna |
|---|---|
| Tidak ada request | waiting seller |
| `SUBMITTED` | pending admin review |
| `NEEDS_REVISION` | waiting seller revision |
| active ready | approved snapshot |

Review action:

- Approve pending seller request:
  - promotes immutable snapshot.
  - supersedes old active profile.
  - updates `Store.activeStorePaymentProfileId`.
  - marks request as `PROMOTED`.
- Reject/revision pending request:
  - sets `NEEDS_REVISION`.
- Jika tidak ada pending request, action dapat update verification status active profile sesuai logic route.

### 10.15 Store Applications

Frontend:

- `client/src/pages/admin/AdminStoreApplicationsPage.jsx`
- `client/src/pages/admin/AdminStoreApplicationDetailPage.jsx`

Backend:

- `server/src/routes/admin.storeApplications.ts`
- `server/src/models/StoreApplication.ts`
- store provisioning services.

Status application:

- `draft`
- `submitted`
- `under_review`
- `revision_requested`
- `approved`
- `rejected`
- `cancelled`

Detail serialization mencakup:

- applicant
- reviewer
- owner identity snapshot
- store information snapshot
- operational address snapshot
- payout/payment snapshot
- compliance snapshot
- completeness
- admin action governance
- identity matching

Approval:

- Hanya dari status reviewable.
- Set approved/reviewed metadata.
- Memanggil `provisionApprovedStoreApplication(application)` untuk membuat seller store boundary dan owner membership.

Revision/reject:

- Memakai transition guard.
- Menyimpan catatan admin.

### 10.16 Notifications

Frontend:

- `client/src/pages/admin/AdminNotificationsPage.jsx`
- notification dropdown di Navbar.

Backend:

- `server/src/routes/admin.notifications.ts`
- `server/src/models/Notification.ts`

Kapabilitas:

- List notification.
- Unread count.
- Preferences.
- Mark one read.
- Mark all read.
- Delete one.
- Clear all.
- Stream endpoint.

### 10.17 Admin Profile dan Uploads

Frontend:

- `client/src/pages/admin/AdminProfilePage.jsx`
- `client/src/api/adminProfile.ts`

Backend:

- `server/src/routes/admin.uploads.ts`

Kapabilitas:

- Current admin profile.
- Update profile.
- Upload image/file generic admin.

---

## 11. Model Data dan Relasi Penting

### 11.1 Model Ringkas

| Model | Field/Peran Penting |
|---|---|
| `User` | `id`, `name`, `email`, `phoneNumber`, `avatarUrl`, `password`, `role`, `sellerRoleCode`, `permissionKeys`, `status`, `isPublished`, timestamps |
| `Store` | `ownerUserId`, `activeStorePaymentProfileId`, `name`, `slug`, `status`, `description`, `logoUrl`, `bannerUrl`, `email`, `phone`, social links, address, `shippingSetup` |
| `StoreRole` | `code`, `name`, `description`, `isSystem`, `isActive` |
| `StoreMember` | `storeId`, `userId`, `storeRoleId`, `status`, invited/accepted/disabled/removed audit fields |
| `StoreAuditLog` | `storeId`, `actorUserId`, `targetUserId`, `targetMemberId`, `action`, `beforeState`, `afterState` |
| `StoreApplication` | `applicantUserId`, `status`, `currentStep`, owner/store/address/payout/compliance snapshots, submitted/reviewed fields, notes, metadata |
| `StorePaymentProfile` | `storeId`, `providerCode`, `paymentType`, `version`, `snapshotStatus`, account/merchant/qris fields, `isActive`, `verificationStatus`, `sourceRequestId` |
| `StorePaymentProfileRequest` | `storeId`, `basedOnProfileId`, `requestStatus`, payment fields, seller note, admin review note, submitted/reviewed/promoted fields |
| `Product` | name/slug/sku/barcode/price/stock/weight/dimensions/description/salePrice/tags/seo/variations/wholesale/media, `userId`, `storeId`, `categoryId`, `defaultCategoryId`, `status`, `isPublished`, seller review fields |
| `ProductCategory` | join `productId`, `categoryId` |
| `Category` | `code`, `name`, `description`, `icon`, `published`, `parentId` |
| `Attribute` | `name`, `displayName`, `published`, `scope`, `storeId`, `createdByRole`, `createdByUserId`, `status` |
| `Coupon` | `code`, `campaignName`, `discountType`, `amount`, `minSpend`, `active`, `bannerImageUrl`, `scopeType`, `storeId`, `startsAt`, `expiresAt` |
| `Order` | `invoiceNo`, `userId`, `checkoutMode`, subtotal/shipping/serviceFee/total, `paymentStatus`, customer/shipping snapshots, payment method, coupon/discount, `status` |
| `OrderItem` | `orderId`, `productId`, `quantity`, `price`, variant snapshots |
| `Suborder` | `orderId`, `suborderNumber`, `storeId`, `storePaymentProfileId`, applied coupon, totals, payment method/status, fulfillment status, `expiresAt`, `paidAt` |
| `SuborderItem` | `suborderId`, `productId`, `storeId`, product snapshot, qty, total price |
| `Payment` | `suborderId`, `storeId`, `storePaymentProfileId`, channel/type/reference/amount/QR/status/expires/paid |
| `PaymentProof` | `paymentId`, `uploadedByUserId`, proof image, sender/bank/transfer fields, review status/reviewer |
| `PaymentStatusLog` | `paymentId`, old/new status, actor type/id, note |
| `Shipment` | `orderId`, `suborderId`, `storeId`, `sellerUserId`, status, courier, tracking, estimate, shipping snapshots |
| `TrackingEvent` | `shipmentId`, event type/label/description, occurredAt, source, actor, metadata |
| `ProductReview` | review/rating terkait produk |
| `Cart` / `CartItem` | customer cart |
| `Currency` | currency config |
| `Language` | language config |
| `Notification` | user/admin notification |
| `UserAddress` | customer address |
| `UserRegistrationVerification` | registration verification token/OTP |

### 11.2 Relasi Kunci

| Relasi | Makna |
|---|---|
| `Store belongsTo User as owner` | satu toko memiliki owner user |
| `User hasOne Store` | owner user bisa punya store utama |
| `Store hasMany Product` | produk terikat store/vendor |
| `Product belongsTo Store` | produk memiliki boundary vendor |
| `Product belongsTo User` | pembuat/pemilik user |
| `Product belongsTo Category as default/category` | kategori utama produk |
| `Product belongsToMany Category through ProductCategory` | multi-category produk |
| `Category hasMany children / belongsTo parent` | hierarchical category |
| `Order belongsTo User as customer` | order dimiliki customer |
| `Order hasMany OrderItem` | item order global |
| `Order hasMany Suborder` | split order per store |
| `Suborder belongsTo Store` | suborder milik store/vendor |
| `Suborder hasMany SuborderItem` | item per vendor |
| `Suborder hasMany Payment` | payment per suborder/store |
| `Payment hasMany PaymentProof` | proof upload untuk pembayaran |
| `Payment hasMany PaymentStatusLog` | log transisi status payment |
| `Order/Suborder has Shipment` | shipment dapat ditautkan ke parent/suborder |
| `Shipment hasMany TrackingEvent` | tracking event shipment |
| `Coupon belongsTo Store` | coupon store-scoped opsional |
| `Store hasMany Coupon` | store bisa punya coupon |
| `Store hasMany StorePaymentProfile` | versioned payment profile |
| `StorePaymentProfile hasMany StorePaymentProfileRequest` | request perubahan profile |
| `StoreApplication belongsTo applicant/reviewer User` | onboarding store |
| `StoreMember belongsTo Store/User/StoreRole` | team membership seller |
| `StoreAuditLog belongsTo Store/actor/target` | audit log seller workspace |

---

## 12. Alur Sistem Utama

### 12.1 Admin Login Flow

```txt
Admin membuka /admin/login
  -> frontend call POST /api/auth/admin/login
  -> backend validasi email/password
  -> backend pastikan role admin-capable
  -> backend cek status account
  -> jika active, issue admin cookie
  -> frontend redirect ke /admin/dashboard atau intended route
  -> AdminGuard memvalidasi /api/auth/admin/me
  -> AdminLayout dirender
```

Failure state penting:

- Account belum verifikasi email: `VERIFICATION_REQUIRED`.
- Account menunggu approval: `APPROVAL_REQUIRED`.
- Account inactive: `ACCOUNT_INACTIVE`.
- Role bukan admin/staff/super admin: login admin ditolak.

### 12.2 Staff Self-Signup Approval Flow

```txt
User membuka /admin/create-account
  -> POST /api/auth/admin/register
  -> account dibuat pending_verification/pending_approval sesuai flow
  -> user verifikasi email via /admin/verify-account
  -> super_admin membuka /admin/all-accounts
  -> POST /api/admin/staff/:id/approve
  -> account menjadi active
  -> email aktivasi dapat dikirim
```

### 12.3 Product Management Flow

```txt
Admin membuka /admin/catalog/products
  -> fetchAdminProducts -> GET /api/admin/products
  -> Create: /admin/catalog/products/new -> POST /api/admin/products
  -> Detail: /admin/catalog/products/:id -> GET /api/admin/products/:id
  -> Edit: /admin/catalog/products/:id/edit -> PATCH /api/admin/products/:id
  -> Publish toggle -> PATCH /api/admin/products/:id/published
  -> Revision request -> PATCH /api/admin/products/:id/revision-request
  -> Duplicate -> POST /api/admin/products/:id/duplicate
```

Product route backend melakukan normalisasi payload, validasi variasi/attribute, media/SEO/tags, kategori, store assignment, dan status visibility.

### 12.4 Category Management Flow

```txt
Admin membuka /admin/catalog/categories
  -> GET /api/admin/categories
  -> Create/update/delete via adminApi
  -> Publish/unpublish via PATCH /api/admin/categories/:id/publish
  -> Bulk action via POST /api/admin/categories/bulk
```

Backend menjaga hierarchical category agar parent cycle tidak terjadi.

### 12.5 Coupon Management Flow

```txt
Admin membuka /admin/catalog/coupons
  -> GET /api/admin/coupons/meta untuk store/scope metadata
  -> GET /api/admin/coupons untuk list
  -> POST /api/admin/coupons untuk create
  -> PATCH /api/admin/coupons/:id untuk update
  -> POST /api/admin/coupons/bulk untuk activate/deactivate/delete
```

Store coupon wajib memiliki `storeId`. Platform coupon tidak wajib store.

### 12.6 Order Status Flow

```txt
Admin membuka /admin/orders
  -> GET /api/admin/orders
  -> detail by invoice: GET /api/admin/orders/by-invoice/:invoiceNo
  -> update status: PATCH /api/admin/orders/:id/status
      -> backend cek lifecycle eligibility
      -> backend cek suborder readiness untuk status tertentu
      -> backend update order
      -> backend buat notification user
```

Guard penting:

- Parent order final seperti delivered/complete tidak dapat dibatalkan sembarangan.
- Delivered parent membutuhkan semua active suborder delivered.
- Shipment correction ada di `PATCH /api/admin/orders/:id/suborders/:suborderId/shipment-correction`.

### 12.7 Payment Audit Flow

```txt
Admin membuka /admin/online-store/payment-audit
  -> GET /api/admin/payments/audit
  -> detail: GET /api/admin/payments/audit/:orderId
  -> backend load order/suborder/payment/proof/log/shipment/tracking
  -> backend bisa expire overdue payments
  -> UI menampilkan grouped operational truth
```

### 12.8 Store Application Approval Flow

```txt
Seller/user mengirim store application
  -> Admin membuka /admin/store/applications
  -> GET /api/admin/store-applications
  -> Detail: GET /api/admin/store-applications/:applicationId
  -> Approve: PATCH /api/admin/store-applications/:applicationId/approve
      -> backend validasi transition
      -> set approved/reviewed metadata
      -> provisionApprovedStoreApplication(application)
      -> create store boundary + owner membership
  -> Revision request atau reject memakai endpoint masing-masing
```

### 12.9 Store Payment Profile Review Flow

```txt
Seller mengajukan/ubah payment profile
  -> Admin membuka /admin/store/payment-profiles
  -> GET /api/admin/stores/payment-profiles
  -> Admin review via PATCH /api/admin/stores/:storeId/payment-profile/review
      -> approve: promote request menjadi immutable active snapshot
      -> revision/reject: set request status NEEDS_REVISION
      -> update Store.activeStorePaymentProfileId saat approve
```

### 12.10 Store Customization Flow

```txt
Admin membuka /admin/store/customization
  -> GET /api/admin/store/customization?language=...
  -> PUT /api/admin/store/customization untuk update full config
  -> GET/PUT /api/admin/store/customization/header untuk header
  -> POST /api/admin/store/customization/header/logo untuk upload logo
  -> PUT /api/admin/store/customization/microsites/rich-about untuk rich about per storeSlug
```

---

## 13. Guardrails untuk AI / Codegen

### 13.1 Route Guardrails

1. Gunakan route frontend canonical:
   - Products: `/admin/catalog/products`
   - Categories: `/admin/catalog/categories`
   - Attributes: `/admin/catalog/attributes`
   - Coupons: `/admin/catalog/coupons`
   - Staff: `/admin/all-accounts`
   - Store applications: `/admin/store/applications`
2. Jangan buat link baru ke legacy route kecuali tujuannya redirect compatibility.
3. Backend API tetap `/api/admin/...`, bukan `/admin/...`.
4. Untuk detail order, UI route memakai invoice number: `/admin/orders/:invoiceNo` dan API mendukung `/api/admin/orders/by-invoice/:invoiceNo`.

### 13.2 File Guardrails

| Jangan jadikan sumber utama | Alasan |
|---|---|
| `client/src/layouts/AdminLayout.jsx` | layout aktif adalah `client/src/components/layouts/AdminLayout.jsx` |
| `server/src/routes/admin.index.ts` | bukan mount aktif utama di `app.ts` |
| `server/src/routes/admin.ts` | aggregator/legacy, bukan sumber mount aktif utama |
| `server/src/middleware/requireAdmin.ts` | nama misleading, bukan RBAC source of truth |
| `client/src/lib/http.ts` | deprecated, gunakan `client/src/api/axios.ts` dan adapter/service |
| `client/src/pages/admin/AdminDashboardPage.jsx` | file ada, tetapi route aktif memakai `client/src/pages/Dashboard.jsx` |

### 13.3 Auth Guardrails

1. Admin auth bersifat cookie-based.
2. LocalStorage token/session hint hanya hint/client state, bukan sumber kebenaran security.
3. Storefront login memblokir admin roles.
4. Admin login memblokir non-admin roles.
5. Client permission guard tidak menggantikan backend middleware.

### 13.4 API Guardrails

1. Pakai adapter existing:
   - `client/src/lib/adminApi.js`
   - `client/src/api/admin*.ts`
2. Jangan membuat envelope parsing ad-hoc di page baru bila helper sudah ada.
3. Pastikan query invalidation TanStack Query mengikuti key yang sudah dipakai halaman terkait.
4. Jangan mengubah endpoint backend tanpa update adapter frontend dan QA script terkait.

### 13.5 Multi-Vendor Guardrails

1. Produk harus mempertahankan `storeId` boundary.
2. Order dapat terpecah menjadi `Suborder` per store.
3. Payment profile bersifat versioned snapshot; jangan overwrite active profile secara sembrono.
4. Store application approval harus melalui provisioning service agar membership owner dibuat benar.
5. Coupon dapat platform-scoped atau store-scoped; store coupon perlu validasi `storeId`.

### 13.6 UI/UX Guardrails Admin 2026

Saat melakukan redesign/slicing Admin Workspace:

- Pertahankan `AdminLayout` aktif, sidebar, navbar, search palette, theme toggle.
- Jangan hardcode role; gunakan `can(user, perm)` dan `RequirePerm`.
- Pertahankan route canonical dan breadcrumb/page title dari pathname.
- Untuk table/list besar, pertahankan filter/search/pagination dari adapter lama.
- Gunakan empty/error/loading states yang jelas.
- Jangan menghapus action administratif penting seperti import/export/bulk/publish/revision kecuali memang diganti dengan UX baru yang tetap memanggil API sama.
- Semua label fitur admin sebaiknya konsisten dalam bahasa Inggris jika halaman sebelumnya sudah menggunakan English feature labels.

---

## 14. QA dan Validasi yang Disarankan

Setelah perubahan Admin Workspace, jalankan sesuai scope:

### 14.1 Build dan lint

```bash
pnpm -F server build
pnpm -F client build
pnpm -F client lint
```

### 14.2 Auth dan Admin Public Auth

```bash
pnpm -F server smoke:admin-public-auth
pnpm qa:admin:public-auth
pnpm qa:admin:public-auth:live
```

### 14.3 Staff Workflow

```bash
pnpm qa:admin:staff
pnpm qa:admin:staff-approval
```

### 14.4 Domain Admin Penting

```bash
pnpm -F server smoke:admin-attributes-domain
pnpm -F server smoke:admin-product-variation-validation
pnpm -F server smoke:admin-product-seo
pnpm -F server smoke:admin-store-payment-profiles
pnpm -F server smoke:admin-store-application
```

### 14.5 Order, Payment, Shipping

```bash
pnpm -F server smoke:order-payment
pnpm -F server smoke:shipment-regression
pnpm qa:e2e:shipment-reconciliation
pnpm qa:e2e:truth
```

### 14.6 Release Smoke

```bash
pnpm qa:staging:core
pnpm qa:public-release
```

### 14.7 Smoke tambahan yang terdeteksi di ZIP terbaru

Script berikut ada pada `server/package.json` dan root `package.json`; pilih sesuai domain perubahan:

```bash
pnpm -F server smoke:admin-seller-admin-login-block
pnpm -F server smoke:auth-session-invalidation
pnpm -F server smoke:auth-rate-limit
pnpm -F server smoke:profile-image-sync
pnpm -F server smoke:store-customization-right-box
pnpm -F server smoke:store-customization-about-us
pnpm -F server smoke:store-customization-checkout
pnpm -F server smoke:store-customization-contact-us
pnpm -F server smoke:store-customization-dashboard-setting
pnpm -F server smoke:store-customization-faq
pnpm -F server smoke:store-customization-offers
pnpm -F server smoke:store-customization-our-team
pnpm -F server smoke:store-customization-seo
pnpm -F server smoke:currencies-delete
pnpm -F server smoke:store-settings
pnpm -F server smoke:coupon-scope
pnpm -F server smoke:checkout-coupons
pnpm -F server smoke:checkout-variants
pnpm -F server smoke:seller-order-ownership
pnpm -F server smoke:store-application-activation
pnpm -F client build
pnpm qa:auth:frontend
pnpm qa:admin:public-auth
pnpm qa:admin:public-auth:live
pnpm qa:admin:staff
pnpm qa:admin:staff-approval
pnpm qa:shipping:release
pnpm qa:ui
```

Catatan: pilih subset smoke yang paling dekat dengan perubahan. Untuk perubahan Admin yang memengaruhi Storefront, minimal jalankan `pnpm -F client build`, route smoke Admin terkait, dan smoke public/storefront terkait.

---

## 15. Prompt Internal untuk AI Saat Mengembangkan Admin Workspace

Gunakan konteks berikut setiap kali meminta AI melakukan desain, slicing, refactor, atau implementasi Admin Workspace:

```txt
Kamu bekerja pada monorepo tp-preneurs-multivendor-main.
Fokus area adalah Admin Workspace.
Frontend route source of truth adalah client/src/App.jsx.
Protected Admin Workspace memakai client/src/components/layouts/AdminLayout.jsx, bukan client/src/layouts/AdminLayout.jsx.
Route canonical frontend berada di /admin/... dan katalog berada di /admin/catalog/...
Backend API berada di /api/admin/...
Auth admin memakai cookie-based session dan divalidasi melalui /api/auth/admin/me.
RBAC backend memakai requireStaffOrAdmin, requireAdmin, requireSuperAdmin dari requireRole/rbac.
Permission frontend berasal dari client/src/constants/permissions.js dan navigation dari client/src/components/Layout/adminNavigation.jsx.
Gunakan adapter API existing di client/src/lib/adminApi.js dan client/src/api/admin*.ts.
Jangan menggunakan client/src/lib/http.ts karena deprecated.
Jangan menganggap server/src/routes/admin.index.ts atau server/src/routes/admin.ts sebagai mount aktif utama; cek server/src/app.ts.
Jangan memakai server/src/middleware/requireAdmin.ts sebagai RBAC source of truth.
Pertahankan multi-vendor boundaries: Product.storeId, Order -> Suborder per store, StorePaymentProfile versioned snapshot, StoreApplication provisioning, Coupon scope PLATFORM/STORE.
Untuk domain yang dikonsumsi Storefront (Store Customization, Store Settings, Coupons, Store Profile, Store Payment Profiles), cek dampak ke system_map_client _storefront.md dan route public/client sebelum mengubah kontrak.
Setiap perubahan UI harus tetap mempertahankan loading/error/empty states, pagination/filter/search, mutation states, toast/feedback, query invalidation, dan permission guard.
```

---

## 16. Checklist Implementasi Halaman Admin Baru

Saat membuat atau mengubah halaman Admin Workspace:

1. Pastikan route ditambahkan di `client/src/App.jsx` pada protected admin route.
2. Pastikan menu ditambahkan di `client/src/components/Layout/adminNavigation.jsx` bila perlu muncul di sidebar/search palette.
3. Pastikan permission dipakai melalui `RequirePerm` dan `can(user, perm)`.
4. Gunakan adapter existing atau tambahkan adapter baru di `client/src/api/admin*.ts` / `client/src/lib/adminApi.js`.
5. Tambahkan backend route di `server/src/routes/admin*.ts` dan mount di `server/src/app.ts` dengan middleware role tepat.
6. Pastikan model/association Sequelize sudah benar bila domain data baru.
7. Normalisasi response envelope agar konsisten di adapter.
8. Tambahkan loading, error, empty, success, dan destructive-confirmation state.
9. Tambahkan query invalidation setelah mutation.
10. Validasi build client dan server.
11. Jalankan smoke test yang paling dekat dengan domain perubahan.

---

## 17. Kesimpulan

Admin Workspace pada codebase ini sudah memiliki fondasi multi-domain yang cukup lengkap:

- Auth admin terpisah dari storefront.
- RBAC bertingkat `staff` / `admin` / `super_admin`.
- Frontend route canonical yang sudah diarahkan ke `/admin/catalog/...` untuk katalog.
- Backend API modular per domain di `/api/admin/...`.
- Domain admin mencakup dashboard, produk, kategori, attribute, coupon, order, payment audit, customer, staff, language/currency, store customization, store settings, store profile, store payment profile, store applications, notification, dan profile.
- Multi-vendor truth berada pada `Store`, `Product.storeId`, `Order -> Suborder`, `StorePaymentProfile`, `StoreApplication`, dan coupon scope.

Dokumen ini harus dijadikan konteks awal untuk AI sebelum melakukan desain visual, slicing UI, refactor, atau penambahan fitur pada Admin Workspace. Versi ini sudah disegarkan berdasarkan ZIP terbaru `(12)` pada 17 Juni 2026.
