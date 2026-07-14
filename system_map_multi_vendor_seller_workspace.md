# TP Preneurs Multivendor — Seller Workspace System Map

Generated: 2026-06-17  
Source archive: `tp-preneurs-multivendor-main(5).zip`  
Updated from: uploaded `system_map_multi_vendor_seller_workspace.md` + static extraction of latest code archive  
Focus: **Multi-Vendor Seller Workspace** only. This file is intended to give an AI agent enough context to reason about architecture, features, route/API boundaries, lifecycle, and implementation guardrails before modifying or designing Seller Workspace surfaces.

> Important validation note: this map is based on static extraction and code reading from the uploaded ZIP. I did not run `pnpm install`, `pnpm build`, database migrations, or browser smoke tests in this update because the archive does not include installed workspace dependencies. Existing repo reports mention previous smoke/build outcomes, but any new work should re-run targeted validation.

---

## 1. Executive Summary

The Seller Workspace is a store-scoped, multi-vendor operator area mounted at:

```txt
/seller/stores/:storeSlug
```

It is rendered by `client/src/layouts/SellerLayout.jsx`, which resolves the seller session, selected store, canonical slug, role permissions, theme/sidebar state, language chip, and seller notifications before rendering nested route pages.

The current codebase has **three Seller UI generations** that must not be confused:

| Layer | Location | Role | Status |
|---|---|---|---|
| Legacy seller pages | `client/src/pages/seller/*.jsx` | Original production fallback pages. | Still mounted behind feature-flag fallbacks for several routes. |
| Seller 2026 preview/mock workspace | `client/src/features/seller2026/*`, `/seller-2026`, `/seller-2026-preview/:storeSlug` | Design/slicing preview surface and live-adapter preview experiments. | Keep separate from canonical production workspace. |
| Seller 2026 live production pages | `client/src/pages/seller2026/Seller2026Live*.jsx`, `client/src/hooks/seller2026/*`, `client/src/api/seller2026/*`, `client/src/features/sellerWorkspace2026/*` | Current modernized production experience under `/seller/stores/:storeSlug`. | Active via flags or directly mounted for some routes. |

Backend Seller APIs are mounted under `/api/seller` in `server/src/app.ts`, use Express + Sequelize models, and enforce store-scope through `requireSellerStoreAccess()` and `resolveSellerAccess()`.

Latest code delta from `tp-preneurs-multivendor-main(5).zip`:

- Seller order detail is now 2026-live mounted behind the Orders production flag through `Seller2026LiveSuborderDetailPage`; legacy `SellerOrderDetailPage` remains as fallback only.
- Seller context/store profile now expose shipping setup readiness (`shippingSetupStatus`, `shippingSetupMeta`, `isShippingReady`, `missingShippingFields`) and the seller profile update lane can patch `shippingSetup`.
- Fulfillment actions synchronize both compatibility suborder status and canonical shipment/tracking-event state when shipment feature flags allow mutation.
- Preview/mock Seller 2026 routes now include deeper nested routes for product edit/detail, taxonomy, order detail, payment review/profile, member lifecycle, and notifications.

The strongest architectural invariant is:

```txt
Seller Workspace is store-scoped. Admin Workspace remains source of truth for approvals/governance. Storefront remains the buyer/public surface. Do not bypass these boundaries.
```

---

## 2. Repository / Runtime Architecture

### 2.1 Monorepo Layout

| Area | Path | Notes |
|---|---|---|
| Root workspace | `package.json`, `pnpm-workspace.yaml` | Workspaces: `server`, `client`, `packages/*`. |
| Client | `client/` | React 19.1.1, Vite 7.1.2, React Router 7.8.2, React Query 5.85.6, Axios 1.11, Tailwind 4/PostCSS, Recharts 3.1.2, framer-motion, sonner/react-toastify, lucide-react. |
| Server | `server/` | Express 4.21, TypeScript, Sequelize 6, MySQL2, cookie/JWT auth, Multer upload handling, Nodemailer, Stripe, file upload static serving. |
| Shared schemas | `packages/schemas/` | Shared validation/contracts package, built before server. |
| Reports / planning | `reports/`, `CODEx_REPORTS/` | Historical implementation/audit notes. Treat as context, not source of truth when code differs. |
| Existing system map | `system_map.md` in repo root | Broad previous map; this generated file narrows and refreshes Seller Workspace context. |

### 2.2 Primary Runtime Flow

```txt
Browser
  -> Vite dev server at localhost:5173
  -> /api proxy to Express server, default localhost:3001
  -> Express app mounts public, seller, storefront, and admin APIs
  -> Sequelize models persist to MySQL
```

Client API baseline:

- `client/src/api/axios.ts` creates Axios instance with `baseURL: "/api"`, `withCredentials: true`, JSON headers, and optional `Authorization: Bearer <authToken>` from `localStorage`.
- Vite proxy forwards `/api` and `/uploads` to the backend in development.
- Most Seller Workspace 2026 live pages use React Query hooks in `client/src/hooks/seller2026/*`.

Server API baseline:

- `server/src/app.ts` mounts seller routers under `/api/seller` before protected admin routes.
- `authFromCookie` is applied globally before API routers.
- Seller route guards use `requireAuth` + `requireSellerStoreAccess()`.
- Admin routes are protected under `/api/admin` with `requireAuth`, then `requireAdmin`, `requireStaffOrAdmin`, or `requireSuperAdmin` depending route.

---

## 3. Seller Workspace Entry, Session, and Context Resolution

### 3.1 Entry Point

`client/src/App.jsx` mounts:

```jsx
<Route path="/seller/stores/:storeSlug" element={<SellerLayout />}>...</Route>
```

`SellerLayout` does the following:

1. Reads `storeSlug` from URL.
2. Uses `useSellerAuth()` from `client/src/auth/authDomainHooks.js`.
3. Determines if URL param is legacy numeric store ID via `isLegacySellerStoreIdParam()`.
4. Fetches context using either:
   - `getSellerWorkspaceContext(storeId)` -> `/api/seller/stores/:storeId/context`
   - `getSellerWorkspaceContextBySlug(storeSlug)` -> `/api/seller/stores/slug/:storeSlug/context`
5. Resolves canonical store slug from API response.
6. Redirects old numeric/stale slug route to canonical slug route.
7. Provides outlet context:

```js
{
  sellerContext,
  workspaceStoreId,
  workspaceStoreSlug,
  refetchSellerContext
}
```

All Seller 2026 live pages consume this through `useSellerWorkspaceRoute()` in `client/src/utils/sellerWorkspaceRoute.js`.

### 3.2 Access States

`SellerLayout` handles these states:

| State | Behavior |
|---|---|
| Missing/blank `storeSlug` | Renders `Invalid Store`. |
| Context loading | Renders loading shell. |
| Canonical slug mismatch | `<Navigate replace>` to canonical path. |
| `401` | Renders `Seller Session Required`, points to `/auth/login`. |
| `403` | Renders `Access Forbidden`; if admin session, points back to `/admin`; if seller session, offers account switch. |
| `404` | Renders `Store Not Found`. |
| Other errors | Renders `Workspace Unavailable` with retry. |

### 3.3 Backend Access Resolution

Files:

- `server/src/middleware/requireSellerStoreAccess.ts`
- `server/src/services/seller/resolveSellerAccess.ts`
- `server/src/services/seller/permissionMap.ts`

Resolution rules:

1. A seller request must have a valid authenticated user.
2. Store must exist.
3. If authenticated user owns the store, access mode becomes `OWNER_BRIDGE` and role is `STORE_OWNER`.
4. Owner bridge lazily ensures owner membership through `ensureOwnerStoreMembership()` when possible.
5. Non-owner users need an `ACTIVE` `StoreMember` row with an active `StoreRole`.
6. Missing membership/role returns `403 SELLER_FORBIDDEN`.
7. `requireSellerStoreAccess(requiredPermissions)` rejects missing permissions with `403 SELLER_PERMISSION_DENIED`.

Access context shape:

```ts
{
  storeId,
  store: {
    id, ownerUserId, name, slug, status, logoUrl, imageUrl,
    shippingSetupStatus, shippingSetupMeta, isShippingReady,
    missingShippingFields, shippingSetupSummary
  },
  accessMode: "OWNER_BRIDGE" | "MEMBER",
  roleCode,
  permissionKeys,
  membershipStatus: "VIRTUAL_OWNER" | "ACTIVE_MEMBER",
  isOwner,
  memberId,
  storeRoleId
}
```

---

## 4. Canonical Route Map

Defined in `client/src/App.jsx`, nested below `SellerLayout`.

| Area | Canonical Route | Current Production Component | Flag/Fallback Notes |
|---|---|---|---|
| Dashboard | `/seller/stores/:storeSlug` | `Seller2026LiveDashboardPage` | Uses `isSeller2026DashboardProductionEnabled()`, else `SellerWorkspaceHome`. |
| Dashboard | `/seller/stores/:storeSlug/dashboard` | `Seller2026LiveDashboardPage` | Same as index. |
| Store Profile | `/seller/stores/:storeSlug/store-profile` | `Seller2026LiveStorefrontPage` | Uses `isSeller2026StoreProfileProductionEnabled()`, else `SellerStoreProfilePage`. |
| Microsite Preview | `/seller/stores/:storeSlug/microsite-preview` | `Seller2026LiveStorefrontPage` | Always live page. |
| Analytics | `/seller/stores/:storeSlug/analytics` | `Seller2026LiveAnalyticsPage` | Uses `isSeller2026AnalyticsProductionEnabled()`, else `SellerAnalyticsPage`. |
| Products | `/seller/stores/:storeSlug/catalog/products` | `Seller2026LiveProductsPage` | Uses `isSeller2026CatalogProductionEnabled()`, else `SellerCatalogPage`. |
| Categories | `/seller/stores/:storeSlug/catalog/categories` | `Seller2026LiveCategoriesPage` | Uses `isSeller2026CategoriesProductionEnabled()`, else `SellerCategoriesPage`. |
| Attributes | `/seller/stores/:storeSlug/catalog/attributes` | `Seller2026LiveAttributesPage` | Uses `isSeller2026AttributesProductionEnabled()`, else `SellerAttributesPage`. |
| Attribute Values | `/seller/stores/:storeSlug/catalog/attributes/:attributeId/values` | `Seller2026LiveAttributeValuesPage` | Uses `isSeller2026AttributeValuesProductionEnabled()`, else `SellerAttributeValuesPage`. |
| Product Create | `/seller/stores/:storeSlug/catalog/products/new` | `Seller2026LiveProductEditorPage mode="create"` | Uses `isSeller2026AuthoringProductionEnabled()`, else `SellerProductAuthoringPage`. |
| Product Edit | `/seller/stores/:storeSlug/catalog/products/:productId/edit` | `Seller2026LiveProductEditorPage mode="edit"` | Uses `isSeller2026AuthoringProductionEnabled()`, else `SellerProductEditPage`. |
| Product Detail | `/seller/stores/:storeSlug/catalog/products/:productId` | `Seller2026LiveProductDetailPage` | Uses `isSeller2026ProductDetailProductionEnabled()`, else `SellerProductDetailPage`. |
| Coupons | `/seller/stores/:storeSlug/catalog/coupons` | `Seller2026LiveCouponsPage` | Currently always mounted live in `App.jsx`; the `isSeller2026CouponsProductionEnabled()` helper exists but is not used here. |
| Orders | `/seller/stores/:storeSlug/orders` | `Seller2026LiveOrdersPage` | Uses `isSeller2026OrdersProductionEnabled()`, else `SellerOrdersPage`. |
| Order Detail | `/seller/stores/:storeSlug/orders/:suborderId` | `Seller2026LiveSuborderDetailPage` | Uses `isSeller2026OrdersProductionEnabled()`, else `SellerOrderDetailPage`. The live page consumes `useSeller2026SuborderDetail()` and `SellerSuborderDetail2026PageView`. |
| Payment Review | `/seller/stores/:storeSlug/payment-review` | `Seller2026LivePaymentReviewPage` | Uses `isSeller2026PaymentReviewProductionEnabled()`, else `SellerPaymentReviewPage`. |
| Payment Profile | `/seller/stores/:storeSlug/payment-profile` | `Seller2026LivePaymentProfilePage` | Uses `isSeller2026PaymentProfileProductionEnabled()`, else `SellerPaymentProfilePage`. |
| Team | `/seller/stores/:storeSlug/team` | `Seller2026LiveTeamPage` | Uses `isSeller2026TeamProductionEnabled()`, else `SellerTeamPage`. |
| Team Audit | `/seller/stores/:storeSlug/team/audit` | `Seller2026LiveTeamAuditPage` | Uses `isSeller2026TeamAuditProductionEnabled()`, else `SellerTeamAuditPage`. |
| Member Lifecycle | `/seller/stores/:storeSlug/team/:memberId` | `Seller2026LiveMemberDetailPage` | Uses `isSeller2026TeamProductionEnabled()`, else `SellerMemberLifecyclePage`. |
| Notifications | `/seller/stores/:storeSlug/notifications` | `Seller2026LiveNotificationsPage` | Uses `isSeller2026NotificationsProductionEnabled()`, else `SellerWorkspaceHome`. |

### 4.1 Legacy Redirects

Legacy routes are still mounted and should not be deleted without link/smoke validation.

| Legacy Route | Canonical Target |
|---|---|
| `/seller/stores/:storeSlug/profile` | `/seller/stores/:storeSlug/store-profile` |
| `/seller/stores/:storeSlug/catalog` | `/seller/stores/:storeSlug/catalog/products` |
| `/seller/stores/:storeSlug/catalog/new` | `/seller/stores/:storeSlug/catalog/products/new` |
| `/seller/stores/:storeSlug/catalog/:productId` | `/seller/stores/:storeSlug/catalog/products/:productId` |
| `/seller/stores/:storeSlug/catalog/:productId/edit` | `/seller/stores/:storeSlug/catalog/products/:productId/edit` |
| `/seller/stores/:storeSlug/coupons` | `/seller/stores/:storeSlug/catalog/coupons` |

Account legacy handoff:

| Legacy Account Route | Handoff Behavior |
|---|---|
| `/user/store-payment-profile` | `AccountLegacySellerRoutePage lane="paymentProfile"`; chooses accessible store with `PAYMENT_PROFILE_VIEW`, then redirects to seller payment profile. |
| `/user/store-payment-review` | `AccountLegacySellerRoutePage lane="paymentReview"`; chooses accessible store with `ORDER_VIEW` + `PAYMENT_STATUS_VIEW`, then redirects to seller payment review. |

### 4.2 Route Builder

Use `client/src/utils/sellerWorkspaceRoute.js` for all seller links.

Important helpers:

- `buildSellerWorkspacePath(storeSlug, suffix)`
- `createSellerWorkspaceRoutes(storeSlug)`
- `resolveSellerPaymentProfileRoute({ storeSlug })`
- `resolveSellerPaymentReviewRoute({ storeSlug })`
- `replaceSellerWorkspaceStorePath(pathname, storeSlug)`
- `useSellerWorkspaceRoute()`

Do not hard-code seller routes in new components unless there is a strong reason.

---

## 5. Preview / Slicing Routes

Defined in `client/src/routes/seller2026RouteConfig.jsx`. These routes are useful for design and slicing, but they are not the canonical production Seller Workspace unless explicitly requested.

### 5.1 `/seller-2026` mock workspace

Uses `RawSeller2026Workspace` from `client/src/features/seller2026/Seller2026Workspace.jsx`. The current mock route family includes:

```txt
/seller-2026
/seller-2026/dashboard
/seller-2026/storefront
/seller-2026/catalog/products
/seller-2026/catalog/products/new
/seller-2026/catalog/products/:productId
/seller-2026/catalog/products/:productId/edit
/seller-2026/catalog/categories
/seller-2026/catalog/attributes
/seller-2026/catalog/attributes/:attributeId/values
/seller-2026/catalog/coupons
/seller-2026/orders
/seller-2026/orders/:suborderId
/seller-2026/payment-review
/seller-2026/payment-profile
/seller-2026/team
/seller-2026/team/invitations
/seller-2026/team/audit
/seller-2026/team/:memberId
/seller-2026/notifications
```

The mock route decides the rendered section through props such as `section`, `productEditorMode`, `catalogView`, `operationsView`, and `teamView`. It can be used as a design reference, but production route work should not be implemented here unless the user asks for mock/preview slicing.

### 5.2 `/seller-2026-preview/:storeSlug` live-adapter preview

Uses preview pages that may call some live APIs through `client/src/features/sellerWorkspace2026/hooks/*` and adapters. Routes include:

```txt
/seller-2026-preview/:storeSlug
/seller-2026-preview/:storeSlug/store-profile
/seller-2026-preview/:storeSlug/catalog/products
/seller-2026-preview/:storeSlug/catalog/products/new
/seller-2026-preview/:storeSlug/catalog/products/:productId
/seller-2026-preview/:storeSlug/orders
/seller-2026-preview/:storeSlug/payment-center
/seller-2026-preview/:storeSlug/coupons
/seller-2026-preview/:storeSlug/team
/seller-2026-preview/:storeSlug/analytics-sync
```

Rule: treat preview routes as design/reference surfaces. Production changes should target `/seller/stores/:storeSlug` unless the user explicitly asks for preview/slicing files.

---

## 6. Layout / Navigation / Shell

Primary file: `client/src/layouts/SellerLayout.jsx`.

### 6.1 Shell Responsibilities

| Responsibility | Implementation |
|---|---|
| Store context | React Query context fetch by slug or legacy store ID. |
| Canonical slug | Redirects if API slug differs from URL. |
| Sidebar state | `seller_sidebar_collapsed` in local storage. |
| Theme state | `seller_theme` in local storage, values `light` / `dark`. |
| Header language chip | `seller_language` in local storage; options `US English`, `ID Indonesia`. |
| Notifications | Unread polling every 15s; list fetched when notification menu is open. |
| Notification navigation | `resolveSellerNotificationRoute()` maps action meta to canonical seller routes. |
| Profile menu | Dashboard, Edit Profile, Log Out. |
| Error shells | Session required, forbidden, store not found, unavailable. |

### 6.2 Sidebar Sections and Permission Gates

Sidebar sections are filtered by `sellerContext.access.permissionKeys`.

| Section | Item | Route Helper | Required Backend Permission |
|---|---|---|---|
| General | Overview | `home()` | `STORE_VIEW` |
| General | Store Profile | `storeProfile()` | `STORE_VIEW` |
| General | Shipping Setup | `shippingSetup()` -> store profile hash | `STORE_VIEW` |
| Catalog | Products | `catalog()` | `PRODUCT_VIEW` |
| Catalog | Categories | `categories()` | `CATEGORY_VIEW` |
| Catalog | Attributes | `attributes()` | `ATTRIBUTE_VIEW` |
| Catalog | Coupons | `coupons()` | `PRODUCT_VIEW` in sidebar, while coupon page itself uses `COUPON_READ`. This mismatch is a notable cleanup candidate. |
| Operations | Orders | `orders()` | `ORDER_VIEW` |
| Finance | Payment Review | `paymentReview()` | `ORDER_VIEW` + `PAYMENT_STATUS_VIEW` |
| Finance | Payment Setup | `paymentProfile()` | `PAYMENT_PROFILE_VIEW` |
| Workspace | Team | `team()` | `STORE_MEMBERS_MANAGE` |
| Workspace | Team Audit | `teamAudit()` | `AUDIT_LOG_VIEW` |

---

## 7. Feature Flags and Mutation Flags

### 7.1 Production Feature Flags

File: `client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js`.

Global gate:

```txt
VITE_SELLER_WORKSPACE_2026_ENABLED
```

Domain gates:

```txt
VITE_SELLER_WORKSPACE_2026_DASHBOARD_ENABLED
VITE_SELLER_WORKSPACE_2026_STORE_PROFILE_ENABLED
VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED
VITE_SELLER_WORKSPACE_2026_PRODUCT_DETAIL_ENABLED
VITE_SELLER_WORKSPACE_2026_AUTHORING_ENABLED
VITE_SELLER_WORKSPACE_2026_CATEGORIES_ENABLED
VITE_SELLER_WORKSPACE_2026_ATTRIBUTES_ENABLED
VITE_SELLER_WORKSPACE_2026_ATTRIBUTE_VALUES_ENABLED
VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED
VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED
VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED
VITE_SELLER_WORKSPACE_2026_TEAM_AUDIT_ENABLED
VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED
VITE_SELLER_WORKSPACE_2026_PAYMENT_PROFILE_ENABLED
VITE_SELLER_WORKSPACE_2026_PAYMENT_REVIEW_ENABLED
VITE_SELLER_WORKSPACE_2026_NOTIFICATIONS_ENABLED
VITE_SELLER_WORKSPACE_2026_ANALYTICS_ENABLED
VITE_SELLER_WORKSPACE_2026_ANALYTICS_SYNC_ENABLED
```

Important env observations:

- `client/.env.development` enables the global flag plus dashboard, store profile, catalog, product detail, authoring, categories, attributes, attribute values, orders, payment review/profile, team, and team audit. It does **not** list coupons, notifications, analytics, or analytics sync.
- `client/.env.example` lists the core production adoption flags up to attribute values; root `.env.example` still contains a smaller set with defaults set to `false`.
- `teamAuditEnabled` is true when either `VITE_SELLER_WORKSPACE_2026_TEAM_AUDIT_ENABLED` or `VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED` is true.
- Payment profile/review production helpers also honor `VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED`.
- `App.jsx` currently ignores the coupon production helper and mounts `Seller2026LiveCouponsPage` directly for `/catalog/coupons`.

### 7.2 Mutation Flags

File: `client/src/api/seller2026/mutation-flags.ts`.

Current flags:

```ts
{
  storefront: false,
  storeProfileUpdate: true,
  productDraftSave: true,
  productSubmitReview: true,
  products: false,
  catalog: false,
  coupons: true,
  orders: true,
  payments: true,
  team: false,
  notifications: true,
}
```

Interpretation:

- Store profile update, product draft save, product submit review, coupons, order fulfillment, payment review, and notifications have enabled client mutation lanes.
- Broad product lifecycle (`products`), catalog-wide mutations (`catalog`), storefront mutation, and team mutations are still globally disabled in this flag file, although some hooks expose team mutation wrappers guarded elsewhere.
- Always check both client mutation flags and backend permission/governance before enabling UI actions.

---

## 8. Permission Model

### 8.1 Backend Seller Roles

File: `server/src/services/seller/permissionMap.ts`.

| Role | Description | Permission Summary |
|---|---|---|
| `STORE_OWNER` | Highest store-level authority. | Full seller permissions including ownership transfer. |
| `STORE_ADMIN` | Full operator except ownership transfer. | Most store, product, catalog, coupon, order, finance, storefront, audit permissions. |
| `CATALOG_MANAGER` | Catalog, media, variants, inventory. | Product/category/attribute/inventory permissions. |
| `MARKETING_MANAGER` | Promotions and marketing-facing store data. | Store view, product view, category view, coupon permissions, storefront view. |
| `ORDER_MANAGER` | Order visibility and fulfillment. | Store view, product/inventory view, order view, fulfillment, payment status view. |
| `FINANCE_VIEWER` | Payment and finance oversight. | Store view, order view, payment profile view, payment status view, audit log view. |
| `CONTENT_MANAGER` | Store profile/storefront content. | Store view/edit and storefront view/edit. |

### 8.2 Backend Permission Keys

Canonical keys include:

```txt
STORE_VIEW, STORE_EDIT, STORE_MEMBERS_MANAGE, STORE_ROLES_MANAGE,
STORE_OWNERSHIP_TRANSFER,
PRODUCT_VIEW, PRODUCT_CREATE, PRODUCT_EDIT, PRODUCT_PUBLISH,
PRODUCT_ARCHIVE, PRODUCT_MEDIA_MANAGE, PRODUCT_VARIANT_MANAGE,
CATEGORY_VIEW, CATEGORY_MANAGE,
ATTRIBUTE_VIEW, ATTRIBUTE_MANAGE,
COUPON_VIEW, COUPON_CREATE, COUPON_EDIT, COUPON_STATUS_MANAGE,
INVENTORY_VIEW, INVENTORY_MANAGE,
ORDER_VIEW, ORDER_FULFILLMENT_MANAGE,
PAYMENT_PROFILE_VIEW, PAYMENT_PROFILE_EDIT, PAYMENT_STATUS_VIEW,
STOREFRONT_VIEW, STOREFRONT_EDIT,
AUDIT_LOG_VIEW
```

### 8.3 Seller 2026 Permission Aliases

File: `client/src/api/seller2026/permissions.ts`.

The 2026 UI uses semantic permissions such as:

```txt
STORE_DASHBOARD_VIEW, STORE_PROFILE_READ, STORE_PROFILE_UPDATE,
STORE_PAYMENT_PROFILE_READ, STORE_PAYMENT_PROFILE_SUBMIT,
CATALOG_PRODUCT_READ, CATALOG_PRODUCT_CREATE, CATALOG_PRODUCT_UPDATE,
CATALOG_PRODUCT_DELETE, CATALOG_PRODUCT_SUBMIT,
CATALOG_CATEGORY_READ, CATALOG_CATEGORY_CREATE, CATALOG_CATEGORY_UPDATE,
CATALOG_CATEGORY_STATUS_MANAGE, CATALOG_CATEGORY_DELETE,
CATALOG_ATTRIBUTE_READ, CATALOG_ATTRIBUTE_CREATE, CATALOG_ATTRIBUTE_UPDATE,
CATALOG_ATTRIBUTE_STATUS_MANAGE, CATALOG_ATTRIBUTE_DELETE,
CATALOG_ATTRIBUTE_VALUE_CREATE, CATALOG_ATTRIBUTE_VALUE_UPDATE,
CATALOG_ATTRIBUTE_VALUE_STATUS_MANAGE,
COUPON_READ, COUPON_CREATE, COUPON_UPDATE, COUPON_DELETE,
COUPON_STATUS_MANAGE,
ORDER_READ, ORDER_FULFILLMENT_UPDATE,
PAYMENT_REVIEW_READ,
TEAM_READ, TEAM_INVITE, TEAM_ROLE_UPDATE, TEAM_REMOVE, TEAM_AUDIT_READ,
NOTIFICATION_READ
```

These map back to backend permission keys through `PERMISSION_ALIASES`. Example:

| 2026 Permission | Backend Alias |
|---|---|
| `STORE_DASHBOARD_VIEW` | `DASHBOARD_VIEW` or `STORE_VIEW` |
| `STORE_PROFILE_READ` | `STORE_VIEW` |
| `STORE_PROFILE_UPDATE` | `STORE_EDIT` |
| `STORE_PAYMENT_PROFILE_READ` | `PAYMENT_PROFILE_VIEW` |
| `STORE_PAYMENT_PROFILE_SUBMIT` | `PAYMENT_PROFILE_EDIT` |
| `CATALOG_PRODUCT_CREATE` | `PRODUCT_CREATE` |
| `CATALOG_PRODUCT_UPDATE` | `PRODUCT_UPDATE` or `PRODUCT_EDIT` |
| `CATALOG_PRODUCT_DELETE` | `PRODUCT_DELETE` or `PRODUCT_ARCHIVE` |
| `CATALOG_PRODUCT_SUBMIT` | `PRODUCT_SUBMIT_REVIEW` or `PRODUCT_EDIT` or `PRODUCT_PUBLISH` |
| `CATALOG_CATEGORY_READ` | `CATEGORY_VIEW` or `PRODUCT_VIEW` |
| `CATALOG_CATEGORY_*` mutate/status/delete | `CATEGORY_MANAGE` |
| `CATALOG_ATTRIBUTE_READ` | `ATTRIBUTE_VIEW` or `PRODUCT_VIEW` |
| `CATALOG_ATTRIBUTE_*` mutate/status/delete/value | `ATTRIBUTE_MANAGE` |
| `COUPON_READ` | `COUPON_VIEW` |
| `COUPON_CREATE` | `COUPON_CREATE` |
| `COUPON_UPDATE` | `COUPON_EDIT` |
| `COUPON_DELETE` | `COUPON_DELETE` or `COUPON_STATUS_MANAGE` |
| `COUPON_STATUS_MANAGE` | `COUPON_STATUS_MANAGE` |
| `ORDER_READ` | `ORDER_VIEW` |
| `ORDER_FULFILLMENT_UPDATE` | `ORDER_FULFILLMENT_MANAGE` |
| `PAYMENT_REVIEW_READ` | `PAYMENT_STATUS_VIEW` |
| `TEAM_READ` | `STORE_MEMBERS_MANAGE` or `STORE_ROLES_MANAGE` |
| `TEAM_INVITE`, `TEAM_REMOVE` | `STORE_MEMBERS_MANAGE` |
| `TEAM_ROLE_UPDATE` | `STORE_ROLES_MANAGE` or `STORE_MEMBERS_MANAGE` |
| `TEAM_AUDIT_READ` | `AUDIT_LOG_VIEW` |
| `NOTIFICATION_READ` | `ORDER_VIEW` or `PAYMENT_STATUS_VIEW` or `STORE_VIEW` |

Page helper:

- `client/src/pages/seller2026/seller2026PagePermissions.js`
- If permission source exists in context, `can(permission)` checks aliases.
- If permission source is missing, `can(permission)` returns true to avoid preview deadlock. In production live routes, context should be present.

---

## 9. Frontend Domain Map

### 9.1 High-Level Domain Files

| Domain | Live Page(s) | Hook(s) | API Module(s) | Adapter/Mutation Module(s) |
|---|---|---|---|---|
| Dashboard | `Seller2026LiveDashboardPage.jsx` | `useSeller2026Dashboard.ts` | `sellerWorkspace.ts`, `sellerOrders.ts` | `seller2026/dashboard.adapter.ts` |
| Store Profile / Storefront | `Seller2026LiveStorefrontPage.jsx` | `useSeller2026Storefront.ts`, `useSeller2026StoreProfile.ts` | `sellerStoreProfile.ts`, `sellerWorkspace.ts` | `storefront.adapter.ts`, `storefront.mutations.ts`, `storeProfile.adapter.ts` |
| Products List | `Seller2026LiveProductsPage.jsx` | `useSeller2026Products.ts` | `sellerProducts.ts` | `products.adapter.ts`, `product-readiness.ts` |
| Product Detail | `Seller2026LiveProductDetailPage.jsx` | `useSeller2026ProductDetail.ts` | `sellerProducts.ts` | `products.adapter.ts`, `productDetail.adapter.ts` |
| Product Editor | `Seller2026LiveProductEditorPage.jsx` | `useSeller2026ProductEditor.ts`, `useSeller2026SaveProductDraft.ts`, `useSeller2026SubmitProductReview.ts` | `sellerProducts.ts` | `productEditor.adapter.ts`, `products.mutations.ts` |
| Categories | `Seller2026LiveCategoriesPage.jsx` | `useSeller2026Categories.ts` | `sellerCategories.ts` | `categories.adapter.ts` |
| Attributes | `Seller2026LiveAttributesPage.jsx` | `useSeller2026Attributes.ts` | `sellerAttributes.ts` | `attributes.adapter.ts` |
| Attribute Values | `Seller2026LiveAttributeValuesPage.jsx` | `useSeller2026AttributeValues.ts` | `sellerAttributes.ts` | `attributeValues.adapter.ts` |
| Coupons | `Seller2026LiveCouponsPage.jsx` | `useSeller2026Coupons.ts` | `sellerCoupons.ts` | `coupons.mutations.ts`, coupon drawer component |
| Orders | `Seller2026LiveOrdersPage.jsx` | `useSeller2026Orders.ts` | `sellerOrders.ts` | `orders.adapter.ts`, `orders.mutations.ts` |
| Suborder Detail | `Seller2026LiveSuborderDetailPage.jsx`, `SellerSuborderDetail2026PageView.jsx` | `useSeller2026SuborderDetail.ts` | `sellerOrders.ts` | `orders-payments.adapter.ts`, `sellerSuborderDetail2026Adapter.js`, `orders.mutations.ts` |
| Payment Review | `Seller2026LivePaymentReviewPage.jsx` | `useSeller2026PaymentReview.ts` | `sellerPayments.ts` | `paymentReview.adapter.ts`, `payments.mutations.ts` |
| Payment Profile | `Seller2026LivePaymentProfilePage.jsx` | `useSeller2026PaymentProfile.ts` | `sellerPaymentProfile.ts` | `paymentProfile.adapter.ts`, `payment-profile.mutations.ts` |
| Team | `Seller2026LiveTeamPage.jsx`, `Seller2026LiveMemberDetailPage.jsx` | `useSeller2026Team.ts`, `useSeller2026MemberDetail.ts`, `useSeller2026TeamMutations.ts` | `sellerTeam.ts` | `team.adapter.ts`, `team.hierarchy.ts` |
| Team Audit | `Seller2026LiveTeamAuditPage.jsx` | `useSeller2026TeamAudit.ts` | `sellerTeamAudit.ts`, `sellerTeam.ts` | `teamAudit.adapter.ts` |
| Notifications | `Seller2026LiveNotificationsPage.jsx` | `useSeller2026Notifications.ts`, `useSeller2026NotificationMutations.ts` | `sellerNotifications.ts` | `notifications.adapter.ts`, `notifications.mutations.ts` |
| Analytics | `Seller2026LiveAnalyticsPage.jsx` | `features/sellerWorkspace2026/hooks/useSellerWorkspace2026Analytics.js` | `sellerWorkspace.ts` | `sellerWorkspace2026AnalyticsAdapter.js` |

### 9.2 Reusable Seller 2026 UI Components

Important shared components:

- `client/src/features/seller2026/components/Seller2026PageHeader.jsx`
- `Seller2026ActionBar.jsx`
- `Seller2026DataTable.jsx`
- `Seller2026EmptyState.jsx`
- `Seller2026ErrorState.jsx`
- `Seller2026LoadingSkeleton.jsx`
- `Seller2026PermissionNotice.jsx`
- `Seller2026ReadinessPanel.jsx`
- `Seller2026Shell.jsx`
- `Seller2026StatCard.jsx`
- `Seller2026StatusBadge.jsx`

Seller Workspace 2026 CSS/slicing components:

- `client/src/features/sellerWorkspace2026/SellerWorkspace2026.css`
- `Seller2026Coupons.css`, `Seller2026Orders.css`, `Seller2026PaymentProfile.css`, `Seller2026PaymentReview.css`, `Seller2026Team.css`, `Seller2026TeamAudit.css`
- `client/src/features/sellerWorkspace2026/components/Seller2026Shell.jsx`
- `Seller2026FallbackBanner.jsx`
- `Seller2026StatusPill.jsx`
- Drawer components for attribute, attribute value, coupon, order detail, payment proof, payment profile editor, team member, audit event.

---

## 10. Backend Seller API Map

All routes below are mounted under `/api/seller`.

### 10.1 Workspace / Context

File: `server/src/routes/seller.workspace.ts`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/stores` | List accessible seller stores for current user. |
| `GET` | `/stores/:storeId/context` | Resolve store context by numeric ID. |
| `GET` | `/stores/slug/:storeSlug/context` | Resolve store context by slug. |
| `GET` | `/stores/:storeId/workspace-readiness` | Readiness checklist and next steps. |
| `GET` | `/stores/:storeId/finance-summary` | Payment profile readiness, payment review counts, paid suborder summary. |
| `GET` | `/stores/:storeId/analytics-summary` | Revenue/order/product analytics summary. |

### 10.2 Store Profile

File: `server/src/routes/seller.storeProfile.ts`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/stores/:storeId/profile` | Legacy profile read alias. |
| `GET` | `/stores/:storeId/store-profile` | Canonical profile read. |
| `PATCH` | `/stores/:storeId/profile` | Legacy profile update alias. |
| `PATCH` | `/stores/:storeId/store-profile` | Canonical profile update. |

### 10.3 Products

File: `server/src/routes/seller.products.ts`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/stores/:storeId/products/authoring/meta` | Categories/meta/governance for editor. |
| `POST` | `/stores/:storeId/products/drafts` | Create draft product. |
| `PATCH` | `/stores/:storeId/products/:productId/draft` | Update draft product. |
| `PATCH` | `/stores/:storeId/products/:productId/published` | Update published flag where allowed. |
| `POST` | `/stores/:storeId/products/:productId/submit-review` | Submit/resubmit draft to admin review. |
| `POST` | `/stores/:storeId/products/:productId/duplicate` | Duplicate product. |
| `DELETE` | `/stores/:storeId/products/:productId` | Delete/archive product subject to review lock. |
| `POST` | `/stores/:storeId/products/import` | Import products. |
| `POST` | `/stores/:storeId/products/bulk-submission` | Bulk submit/resubmit. |
| `POST` | `/stores/:storeId/products/export` | Export scoped product selection. |
| `GET` | `/stores/:storeId/products` | List products. |
| `GET` | `/stores/:storeId/products/:productId` | Product detail. |

### 10.4 Categories

File: `server/src/routes/seller.categories.ts`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/stores/:storeId/categories` | List categories. |
| `POST` | `/stores/:storeId/categories` | Create category. |
| `PUT` | `/stores/:storeId/categories/:categoryId` | Update category. |
| `PATCH` | `/stores/:storeId/categories/:categoryId/publish` | Change publish status. |

### 10.5 Attributes / Attribute Values

File: `server/src/routes/seller.attributes.ts`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/stores/:storeId/attributes` | List store/global attributes. |
| `GET` | `/stores/:storeId/attributes/:attributeId/values` | List values. |
| `GET` | `/stores/:storeId/attributes/export` | Export. |
| `POST` | `/stores/:storeId/attributes/import` | Import. |
| `POST` | `/stores/:storeId/attributes` | Create attribute. |
| `PATCH` | `/stores/:storeId/attributes/:attributeId` | Update attribute. |
| `PATCH` | `/stores/:storeId/attributes/:attributeId/published` | Publish/unpublish attribute. |
| `POST` | `/stores/:storeId/attributes/bulk` | Bulk actions. |
| `DELETE` | `/stores/:storeId/attributes/:attributeId` | Delete/archive attribute. |
| `POST` | `/stores/:storeId/attributes/:attributeId/values` | Create value. |
| `PATCH` | `/stores/:storeId/attributes/values/:valueId` | Update value. |
| `DELETE` | `/stores/:storeId/attributes/values/:valueId` | Delete value. |

### 10.6 Coupons

File: `server/src/routes/seller.coupons.ts`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/stores/:storeId/coupons` | List store-scoped coupons. |
| `POST` | `/stores/:storeId/coupons` | Create coupon. |
| `PATCH` | `/stores/:storeId/coupons/:couponId` | Update/status coupon. |
| `DELETE` | `/stores/:storeId/coupons/:couponId` | Delete/archive coupon. |

### 10.7 Orders / Fulfillment

File: `server/src/routes/seller.orders.ts`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/stores/:storeId/suborders` | List seller-owned suborders. |
| `GET` | `/stores/:storeId/suborders/:suborderId` | Read seller-owned suborder detail. |
| `POST` | `/stores/:storeId/suborders/bulk-delete` | Bulk delete/hide lane. |
| `PATCH` | `/stores/:storeId/suborders/:suborderId/fulfillment` | Update fulfillment/shipment state. |

### 10.8 Payments / Payment Review

File: `server/src/routes/seller.payments.ts`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/suborders` | Legacy seller payment/suborder read lane. |
| `GET` | `/stores/:storeId/payment-review/suborders` | Store-scoped payment proof review rows. |
| `PATCH` | `/payments/:paymentId/review` | Legacy payment review. |
| `PATCH` | `/stores/:storeId/payments/:paymentId/review` | Store-scoped payment approve/reject. |

### 10.9 Payment Profile / Payment Setup

File: `server/src/routes/seller.paymentProfiles.ts`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/stores/:storeId/payment-profile` | Read active payment profile + open request state. |
| `PUT` | `/stores/:storeId/payment-profile/request` | Save draft payment setup request. |
| `POST` | `/stores/:storeId/payment-profile/request/submit` | Submit request for admin review. |

### 10.10 Team / Membership / Audit

File: `server/src/routes/seller.team.ts`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/invitations` | Current user store invitations. |
| `POST` | `/invitations/:memberId/accept` | Accept invitation. |
| `POST` | `/invitations/:memberId/decline` | Decline invitation. |
| `GET` | `/stores/:storeId/team/audit` | Team audit events. |
| `GET` | `/stores/:storeId/team` | Team summary. |
| `POST` | `/stores/:storeId/members/invite` | Invite member. |
| `POST` | `/stores/:storeId/members/:memberId/reinvite` | Re-invite member. |
| `POST` | `/stores/:storeId/members` | Attach/create member. |
| `PATCH` | `/stores/:storeId/members/:memberId/role` | Change role. |
| `PATCH` | `/stores/:storeId/members/:memberId/remove` | Remove member. |
| `PATCH` | `/stores/:storeId/members/:memberId/status` | Enable/disable member. |
| `GET` | `/stores/:storeId/members/:memberId/lifecycle` | Member lifecycle detail. |

### 10.11 Notifications

File: `server/src/routes/seller.notifications.ts`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/stores/:storeId/notifications` | List notifications. |
| `GET` | `/stores/:storeId/notifications/unread-count` | Read unread count. |
| `PATCH` | `/stores/:storeId/notifications/read-all` | Mark all read. |
| `PATCH` | `/stores/:storeId/notifications/:id/read` | Mark one read. |

---

## 11. Data / Entity Map

Primary seller-relevant Sequelize models live in `server/src/models/*`.

| Entity | Model | Seller Role in System | Key Notes |
|---|---|---|---|
| Store | `Store.ts` | Seller workspace tenant/scope. | `ownerUserId`, `activeStorePaymentProfileId`, `slug`, `status`, seller/public profile fields, and JSON `shippingSetup` used by readiness + shipment origin fallback. |
| Store Role | `StoreRole.ts` | Role record for members. | Codes mirror `SYSTEM_SELLER_ROLES`; system roles are seeded. |
| Store Member | `StoreMember.ts` | User membership in store. | Status: `INVITED`, `ACTIVE`, `DISABLED`, `REMOVED`; tracks invited/disabled/removed timestamps and actors. |
| Store Audit Log | `StoreAuditLog.ts` | Team/member audit trail. | Records actor, target user/member, action, before/after state. |
| Store Application | `StoreApplication.ts` | User-to-seller onboarding approval flow. | Admin review approves/rejects/revision-requests. |
| Product | `Product.ts` | Store-owned catalog item. | `storeId`, draft/active/inactive status, `published`, seller submission fields, media, SEO termasuk `productType`/`digitalAssetUrl` metadata, variations, wholesale. |
| Product Category | `ProductCategory.ts` | Product-category join. | Used for multiple category assignments. |
| Category | `Category.ts` | Catalog taxonomy. | Existing table name is `Categories`; `published`, parent hierarchy. |
| Attribute | `Attribute.ts` | Product attributes/variant inputs. | Scope `global` or `store`, creator role, status active/archived. |
| Coupon | `Coupon.ts` | Promotion entity. | `scopeType` `PLATFORM` or `STORE`; seller list should be store-scoped. |
| Order | `Order.ts` | Parent buyer order. | Parent aggregate; Seller should not mutate outside allowed child/suborder lifecycle. |
| Suborder | `Suborder.ts` | Store-specific order slice. | `storeId`, amounts, QRIS payment status, compatibility fulfillment status, applied coupon attribution fields. |
| Shipment | `Shipment.ts` | Canonical shipment state for a suborder. | Unique `suborderId`; statuses include `WAITING_PAYMENT`, `READY_TO_FULFILL`, `PACKED`, `SHIPPED`, `FAILED_DELIVERY`, `RETURNED`, `DELIVERED`, `CANCELLED`; stores courier/tracking/shipping snapshots. |
| Tracking Event | `TrackingEvent.ts` | Shipment timeline/audit read model. | `shipmentId`, `eventType`, labels/descriptions, actor/source metadata. Seller fulfillment mutations append events. |
| Suborder Item | `SuborderItem.ts` | Items within store suborder. | Belongs to suborder and product. |
| Payment | `Payment.ts` | QRIS payment record. | Store-scoped, status `CREATED`, `PENDING_CONFIRMATION`, `PAID`, `FAILED`, `EXPIRED`, `REJECTED`. |
| Payment Proof | `PaymentProof.ts` | Buyer-uploaded payment proof. | Review status `PENDING`, `APPROVED`, `REJECTED`; seller/admin review metadata. |
| Payment Status Log | `PaymentStatusLog.ts` | Audit trail of payment status changes. | Records actor and trace metadata. |
| Store Payment Profile | `StorePaymentProfile.ts` | Active QRIS checkout/payment snapshot. | Admin-verified/activated; status `ACTIVE`, `SUPERSEDED`, `INACTIVE`; provider `MANUAL_QRIS`. |
| Store Payment Profile Request | `StorePaymentProfileRequest.ts` | Seller draft/submitted payment setup request. | Status includes draft/submitted/revision/review outcomes; admin promotes into active snapshot. |
| Notification | `Notification.ts` | Notification records. | Generic table with `type`, `title`, `isRead`, JSON `meta`. Seller notification routing is meta-driven. |

---

## 12. Domain Lifecycles and Boundaries

### 12.1 Store Access Lifecycle

```txt
User owns store OR is StoreMember ACTIVE
  -> resolveSellerAccess()
  -> returns roleCode + permissionKeys
  -> SellerLayout renders accessible navigation
  -> page-level 2026 permission helpers gate UI actions
  -> backend revalidates permission on every protected route
```

Important boundary:

- Frontend permission checks improve UX only.
- Backend `requireSellerStoreAccess()` is authoritative.

### 12.2 Store Profile / Public Storefront Sync

Files:

- Frontend: `Seller2026LiveStorefrontPage.jsx`, `useSeller2026Storefront.ts`, `useSeller2026StoreProfile.ts`
- Seller API: `sellerStoreProfile.ts`, `server/src/routes/seller.storeProfile.ts`
- Public APIs: `server/src/routes/store.customization.ts`, `server/src/routes/store.ts`

Flow:

```txt
Seller opens Store Profile
  -> GET /api/seller/stores/:storeId/store-profile
  -> optionally GET public identity/rich-about by slug for preview/sync state
  -> seller edits allowed profile fields if STORE_EDIT / STORE_PROFILE_UPDATE
  -> PATCH /api/seller/stores/:storeId/store-profile
  -> Storefront public surfaces read store identity from public store/customization APIs
```

Guardrails:

- Store profile is tenant-scoped.
- Admin may still govern store status/application/payment profile readiness.
- Public storefront should only show active/visible approved data.

### 12.3 Shipping Setup / Fulfillment Readiness Lifecycle

Files:

- Backend readiness service: `server/src/services/sellerShippingSetup.service.ts`
- Store profile contract: `server/src/services/storeProfileGovernance.ts`
- Seller profile route: `server/src/routes/seller.storeProfile.ts`
- Seller workspace context/readiness: `server/src/routes/seller.workspace.ts`

Seller-owned shipping setup lives in `Store.shippingSetup` and is patched through the seller store profile endpoint. It is intentionally separate from admin-owned core identity fields (`name`, `slug`, `status`).

Required shipping origin fields:

```txt
originContactName, originPhone, originAddressLine1, originCity,
originProvince, originPostalCode, originCountry
```

Patchable shipping fields:

```txt
shippingEnabled, originContactName, originPhone, originAddressLine1,
originAddressLine2, originDistrict, originCity, originProvince,
originPostalCode, originCountry, pickupNotes
```

Flow:

```txt
Seller opens Store Profile or Dashboard
  -> context/readiness computes buildStoreShippingSetupReadiness(store)
  -> missing fields and fallback fields are exposed to SellerLayout/sidebar/readiness panels
Seller edits shipping setup from Store Profile
  -> PATCH /api/seller/stores/:storeId/store-profile with shippingSetup
  -> sellerStoreProfilePatchSchema validates nested shipping setup
  -> mergeSellerShippingSetupPatch() preserves existing values and applies patch
  -> readiness/status metadata recalculates from Store.shippingSetup + store profile fallbacks
Fulfillment later uses shipping origin context
  -> shipment/order read models can use store shipping setup as operational origin metadata
```

Guardrails:

- `shippingSetup` is seller-owned metadata, but Store status/public availability still follows Admin/storefront governance.
- Missing shipping fields do not grant seller permission to bypass payment, product, or admin approval gates.
- `SellerLayout` links Shipping Setup to `store-profile#shipping-setup` rather than a separate route.

### 12.4 Product Draft / Review / Publish Lifecycle

Files:

- Frontend: `Seller2026LiveProductsPage.jsx`, `Seller2026LiveProductEditorPage.jsx`, `Seller2026LiveProductDetailPage.jsx`
- APIs: `client/src/api/sellerProducts.ts`, `client/src/api/seller2026/products.mutations.ts`
- Backend: `server/src/routes/seller.products.ts`

Core statuses:

```txt
Product.status: draft | inactive | active
Product.published: boolean
Product.sellerSubmissionStatus: none | submitted | needs_revision
```

Governance from backend:

- `canCreateDraft` -> `PRODUCT_CREATE`
- `canEditDrafts` -> `PRODUCT_EDIT`
- `canSubmitDrafts` -> `PRODUCT_EDIT`
- `canPublishProducts` -> `PRODUCT_PUBLISH`
- A draft can be submitted only when product exists, status is `draft`, and submission status is `none` or `needs_revision`.
- Submitted products are locked for seller edits until admin resolves review.
- `needs_revision` requires seller changes and resubmission.
- Seller can publish only when backend governance permits and admin approval flow has made product eligible.

Typical flow:

```txt
Create Draft
  -> POST /api/seller/stores/:storeId/products/drafts
Edit Draft
  -> PATCH /api/seller/stores/:storeId/products/:productId/draft
Submit Review
  -> POST /api/seller/stores/:storeId/products/:productId/submit-review
Admin Review
  -> Admin product route approves, publishes, or requests revision
Storefront Visibility
  -> public product APIs show only products meeting publish/visibility rules
```

AI guardrails:

- Never make Seller UI directly bypass admin review/publish gate.
- Do not treat `Product.status = active` alone as storefront-visible; also check `published` and visibility governance returned by backend/adapter.
- Product detail/editor adapters normalize DTOs; use them instead of re-mapping API data in page JSX.

### 12.5 Categories and Attributes Lifecycle

Files:

- Frontend: `Seller2026LiveCategoriesPage.jsx`, `Seller2026LiveAttributesPage.jsx`, `Seller2026LiveAttributeValuesPage.jsx`
- APIs: `sellerCategories.ts`, `sellerAttributes.ts`
- Backend: `seller.categories.ts`, `seller.attributes.ts`

Permission expectations:

| Feature | Read | Mutate |
|---|---|---|
| Categories | `CATEGORY_VIEW` / `CATALOG_CATEGORY_READ` | `CATEGORY_MANAGE` |
| Attributes | `ATTRIBUTE_VIEW` / `CATALOG_ATTRIBUTE_READ` | `ATTRIBUTE_MANAGE` |
| Attribute Values | Attribute read + value aliases | `ATTRIBUTE_MANAGE` |

Guardrails:

- Attribute scope can be `global` or `store`; be careful not to allow seller mutation of admin/global assets unless backend already permits it.
- Category table name is historically `Categories`, while many newer tables are snake_case. Avoid making assumptions in raw SQL.

### 12.6 Coupon Lifecycle

Files:

- Frontend: `Seller2026LiveCouponsPage.jsx`, `Seller2026CouponDrawer.jsx`
- Hooks/API: `useSeller2026Coupons.ts`, `sellerCoupons.ts`, `seller2026/coupons.mutations.ts`
- Backend: `server/src/routes/seller.coupons.ts`, public `store.coupons.ts`, admin `admin.coupons.ts`

Coupon model:

```txt
Coupon.scopeType: PLATFORM | STORE
Coupon.storeId: nullable
Coupon.active: boolean
Coupon.discountType: percent | fixed
Coupon.startsAt / expiresAt
```

Seller lane should operate on store-scoped coupons only.

Mutation status:

- `client/src/api/seller2026/mutation-flags.ts` has `coupons: true`.
- Hook exposes create/update/status/archive lanes and invalidates seller coupon query keys.

Guardrails:

- Platform coupons are Admin/Platform owned.
- Storefront quote/validate path (`/api/store/coupons`) must preserve attribution and conflict rules.
- Sidebar currently gates coupon navigation with `PRODUCT_VIEW`, but page permission uses coupon permissions. This is a mismatch worth cleaning carefully.

### 12.7 Order / Fulfillment Lifecycle

Files:

- List page: `Seller2026LiveOrdersPage.jsx`, order drawer components, `useSeller2026Orders.ts`
- Detail page: `Seller2026LiveSuborderDetailPage.jsx`, `SellerSuborderDetail2026PageView.jsx`, `sellerSuborderDetail2026Adapter.js`, `useSeller2026SuborderDetail.ts`
- Backend route: `server/src/routes/seller.orders.ts`
- Shipment services/read models: `shipmentMutation.service.ts`, `orderShippingReadModel.service.ts`, `Shipment.ts`, `TrackingEvent.ts`

Suborder status domains:

```txt
paymentStatus:
  UNPAID | PARTIALLY_PAID | PENDING_CONFIRMATION | PAID | FAILED | EXPIRED | CANCELLED

fulfillmentStatus:
  UNFULFILLED | PROCESSING | SHIPPED | DELIVERED | CANCELLED
```

Fulfillment actions in backend:

| Action | Allowed From | Next Fulfillment | Shipment Status |
|---|---|---|---|
| `MARK_PROCESSING` | `UNFULFILLED` | `PROCESSING` | `PACKED` |
| `MARK_SHIPPED` | `PROCESSING` | `SHIPPED` | `SHIPPED` |
| `MARK_DELIVERED` | `SHIPPED` | `DELIVERED` | `DELIVERED` |
| `MARK_FAILED_DELIVERY` | `SHIPPED` | `SHIPPED` | `FAILED_DELIVERY` |
| `MARK_RETURNED` | `SHIPPED` | `SHIPPED` | `RETURNED` |
| `CANCEL_SHIPMENT` | `UNFULFILLED`, `PROCESSING` | `CANCELLED` | `CANCELLED` |

Critical rules:

- Seller reads and mutates **suborders**, not parent `Order` directly.
- Fulfillment mutation checks payment/order blockers before updating.
- Payment must be settled according to backend rules before certain transitions.
- Shipment MVP flags may block mutation with `SHIPMENT_MUTATION_DISABLED`; defaults are enabled outside production unless env says otherwise.
- When shipment mutation is open, `applySellerShipmentFulfillment()` updates/creates `Shipment`, appends `TrackingEvent`, returns a compatibility fulfillment status, then server updates the `Suborder.fulfillmentStatus`.
- `MARK_SHIPPED` can sync shipping fee/courier/tracking fields when provided.
- Parent order sync is handled server-side through `recalculateParentOrderFulfillmentStatus()`, and buyer notifications can be created when parent status changes.

### 12.8 Payment Review Lifecycle

Files:

- Frontend: `Seller2026LivePaymentReviewPage.jsx`, `Seller2026PaymentProofDrawer.jsx`, `useSeller2026PaymentReview.ts`
- Client API: `sellerPayments.ts`, `seller2026/payments.mutations.ts`
- Backend: `server/src/routes/seller.payments.ts`

View permissions:

```txt
ORDER_VIEW + PAYMENT_STATUS_VIEW
```

Mutation roles:

```txt
STORE_OWNER or STORE_ADMIN only
```

Review flow:

```txt
Buyer uploads proof
  -> Payment.status = PENDING_CONFIRMATION
  -> PaymentProof.reviewStatus = PENDING
Seller reviews store-scoped payment
  -> PATCH /api/seller/stores/:storeId/payments/:paymentId/review
Approve
  -> Payment.status = PAID
  -> Suborder.paymentStatus = PAID
  -> Suborder.fulfillmentStatus = UNFULFILLED
  -> PaymentProof.reviewStatus = APPROVED
  -> PaymentStatusLog actorType = SELLER
Reject
  -> Payment.status = REJECTED
  -> Suborder.paymentStatus = UNPAID
  -> PaymentProof.reviewStatus = REJECTED
  -> PaymentStatusLog actorType = SELLER
```

Guardrails:

- Payment review only works while `Payment.status = PENDING_CONFIRMATION`.
- A proof is required.
- A proof already reviewed cannot be reviewed again.
- Backend verifies payment belongs to the active store scope.

### 12.9 Payment Profile / QRIS Setup Lifecycle

Files:

- Frontend: `Seller2026LivePaymentProfilePage.jsx`, `Seller2026PaymentProfileEditor.jsx`, `useSeller2026PaymentProfile.ts`
- Client API: `sellerPaymentProfile.ts`, `seller2026/payment-profile.mutations.ts`
- Backend: `server/src/routes/seller.paymentProfiles.ts`
- Admin review: `server/src/routes/admin.storePaymentProfiles.ts`

Seller flow:

```txt
Read current setup
  -> GET /api/seller/stores/:storeId/payment-profile
Save draft request
  -> PUT /api/seller/stores/:storeId/payment-profile/request
Submit request
  -> POST /api/seller/stores/:storeId/payment-profile/request/submit
Admin reviews/promotes
  -> /api/admin/stores/:storeId/payment-profile/review
Active snapshot is updated by Admin approval
  -> Store.activeStorePaymentProfileId points to active StorePaymentProfile
```

Guardrails:

- Seller can save/submit requests with `PAYMENT_PROFILE_EDIT`.
- Seller cannot activate or verify payment profile.
- If latest request is under admin review, backend returns `PAYMENT_PROFILE_REVIEW_LOCKED`.
- Submit validates required QRIS setup fields and may return `PAYMENT_PROFILE_INCOMPLETE`.

### 12.10 Team / Invitation / Audit Lifecycle

Files:

- Frontend: `Seller2026LiveTeamPage.jsx`, `Seller2026LiveMemberDetailPage.jsx`, `Seller2026LiveTeamAuditPage.jsx`
- Hooks: `useSeller2026Team.ts`, `useSeller2026MemberDetail.ts`, `useSeller2026TeamMutations.ts`, `useSeller2026TeamAudit.ts`
- Backend: `server/src/routes/seller.team.ts`, `server/src/services/seller/teamAudit.ts`, `server/src/services/seller/teamMutations.ts`

Member statuses:

```txt
INVITED | ACTIVE | DISABLED | REMOVED
```

Team actions include:

- invite
- accept/decline invitation
- reinvite
- attach existing user/member
- change role
- disable/reactivate
- remove
- view lifecycle
- view audit log

Important hierarchy logic:

- `client/src/api/seller2026/team.hierarchy.ts` contains role rank/current-user/owner protections and disabled reasons for role/removal actions.
- Backend remains authoritative and records audit events.

Guardrails:

- Do not let users remove themselves or demote/remove protected owners unless backend explicitly supports it.
- Team mutation flag is currently `team: false`; be careful when exposing mutation UI.
- Team audit route should be treated as immutable/read-only unless dedicated export endpoint is added.

### 12.11 Notifications Lifecycle

Files:

- Layout: `SellerLayout.jsx`
- Page: `Seller2026LiveNotificationsPage.jsx`
- Hook/API: `useSeller2026Notifications.ts`, `useSeller2026NotificationMutations.ts`, `sellerNotifications.ts`
- Backend: `server/src/routes/seller.notifications.ts`

Flow:

```txt
SellerLayout polls unread count every 15 seconds
  -> GET /api/seller/stores/:storeId/notifications/unread-count
When menu opens
  -> GET /api/seller/stores/:storeId/notifications?limit=8
Click notification
  -> mark read if unread
  -> route resolver maps meta.actionCode/meta.route to canonical seller route
Mark all read
  -> PATCH /api/seller/stores/:storeId/notifications/read-all
```

Known action route mappings:

| Action | Route |
|---|---|
| `SELLER_PRODUCT_REVIEW_REQUIRED`, `SELLER_PRODUCT_NEEDS_REVISION` | product edit |
| `SELLER_PRODUCT_UPDATED`, `SELLER_STOCK_ALERT` | product detail |
| `SELLER_SUBORDER_CREATED`, `SELLER_PAYMENT_FAILED` | order detail |
| `SELLER_PAYMENT_REVIEW_REQUIRED` | payment review |
| `SELLER_PAYMENT_PROFILE_REQUIRED` | payment profile |
| `SELLER_COUPON_UPDATED` | coupons |
| `SELLER_TEAM_AUDIT` | team audit |
| `SELLER_TEAM_MEMBER_UPDATED` | member lifecycle |
| `SELLER_STORE_PROFILE_UPDATED` | store profile |
| `SELLER_WORKSPACE_UPDATE` | dashboard/home |

Guardrail:

- Direct `meta.route` is accepted only if it starts with the canonical seller base and is not external or `/seller-2026`.

### 12.12 Dashboard / Analytics Lifecycle

Files:

- Dashboard live page/hook: `Seller2026LiveDashboardPage.jsx`, `useSeller2026Dashboard.ts`
- Analytics page: `Seller2026LiveAnalyticsPage.jsx`
- APIs: `sellerWorkspace.ts`, `sellerOrders.ts`, `sellerNotifications.ts`

Dashboard queries:

- Finance summary: `/api/seller/stores/:storeId/finance-summary`
- Readiness: `/api/seller/stores/:storeId/workspace-readiness`
- Analytics summary: `/api/seller/stores/:storeId/analytics-summary`
- Recent suborders: `/api/seller/stores/:storeId/suborders`

Guardrails:

- Dashboard aggregates are read-model summaries; do not mutate from dashboard except via explicit linked domain pages.
- Standalone analytics route is flag-gated and historically marked as needing additional validation. Verify before using it as a source for new production requirements.

---

## 13. Admin and Storefront Boundary Map

Seller Workspace overlaps with Admin and Storefront, but it is not the authority for every lifecycle.

| Domain | Seller Workspace | Admin Workspace | Storefront / Public |
|---|---|---|---|
| Store Application | Seller starts only after approved/access exists. | Admin approves/rejects/revision-requests applications. | Not public until active. |
| Store Profile | Seller edits allowed identity/contact/content fields. | Admin can govern store profile/status. | Public identity and microsite display. |
| Payment Profile | Seller drafts/submits QRIS request. | Admin reviews, verifies, promotes/activates. | Checkout uses active store payment profile. |
| Product | Seller creates/edits draft and submits review. | Admin review/revision/publish governance. | Only visible products should be shown. |
| Categories/Attributes | Seller manages allowed store catalog metadata. | Admin/global taxonomy remains governance surface. | Product display/variant selection consumes metadata. |
| Orders/Suborders | Seller reads suborders and updates fulfillment. | Admin sees parent orders/aggregate operations. | Buyer order tracking sees status. |
| Payment Proof | Seller may approve/reject for allowed roles. | Admin payment audit remains higher-level governance. | Buyer uploads/sees status. |
| Coupons | Seller manages store coupons. | Admin/platform coupons and governance. | Quote/validate/apply with attribution. |
| Team | Seller owner/admin manages members. | Admin may have operational backfill/governance scripts. | Not public. |
| Notifications | Seller notification drawer/page. | Admin/user notification sources may exist. | Buyer/user notification surfaces are separate. |

Related Admin APIs:

- `/api/admin/products` including review/revision/publish paths.
- `/api/admin/orders`
- `/api/admin/payments/audit`
- `/api/admin/stores/payment-profiles` and `/:storeId/payment-profile/review`
- `/api/admin/store/profiles`
- `/api/admin/store-applications`
- `/api/admin/coupons`

Related Storefront/Public APIs:

- `/api/store/categories`
- `/api/store/products`
- `/api/store/products/:id`
- `/api/store/orders`, `/api/store/orders/:ref`
- `/api/store/coupons`, `/api/store/coupons/quote`, `/api/store/coupons/validate`
- `/api/store/customization/identity/:slug`
- `/api/store/customization/microsites/:slug/rich-about`
- `/api/products` for product activity/public product routes.

---

## 14. Feature Status Matrix

| Feature | Current Status from Code | Notes / Guardrails |
|---|---|---|
| Seller shell/layout | Active | `SellerLayout.jsx`; resolves context, canonical slug, sidebar, notifications. |
| Dashboard | Live 2026 flag-gated | Uses readiness, finance, analytics, recent suborders. |
| Store profile / storefront | Live 2026 flag-gated | Store profile update mutation enabled; seller can patch seller-owned profile/contact/address fields plus nested `shippingSetup`; public identity queries used in store profile/storefront hooks. |
| Microsite preview | Always live page | Mounted directly to `Seller2026LiveStorefrontPage`. |
| Product list | Live 2026 flag-gated | Read list + authoring meta. |
| Product create/edit | Live 2026 flag-gated | Draft save and submit review enabled. Rich product lifecycle still needs backend governance checks. |
| Product detail | Live 2026 flag-gated | Read-only detail with edit/submit flow links. |
| Categories | Live 2026 flag-gated | Create/update/visibility flows exist in hook/page. |
| Attributes | Live 2026 flag-gated | Create/update/status/import/export flows exist. |
| Attribute values | Live 2026 flag-gated | Create/update values. |
| Coupons | Live 2026 direct-mounted | Create/update/status/archive hook exists; route is not flag-gated in `App.jsx`. |
| Orders | Live 2026 flag-gated | Fulfillment mutation enabled. |
| Order detail | Live 2026 flag-gated | `Seller2026LiveSuborderDetailPage` is mounted when Orders 2026 flag is enabled; legacy `SellerOrderDetailPage` remains fallback. |
| Payment review | Live 2026 flag-gated | Approve/reject enabled for owner/admin roles only. |
| Payment profile | Live 2026 flag-gated | Save draft/submit request enabled; admin activation remains external. |
| Team | Live 2026 flag-gated | Team mutation flag says false; avoid exposing unsafe mutation controls. |
| Team audit | Live 2026 flag-gated | Read/audit route active. |
| Notifications | Live 2026 flag-gated for page; layout always uses seller notification APIs after context | Mark read/all read enabled. |
| Analytics | Flag-gated | Treat as needing verification before production expansion. |
| Preview/slicing surfaces | Separate | Do not confuse with canonical routes. |

---

## 15. Known Inconsistencies / Cleanup Candidates

1. **Coupons route flag mismatch remains**  
   `isSeller2026CouponsProductionEnabled()` exists, but `/seller/stores/:storeSlug/catalog/coupons` is still mounted directly to `Seller2026LiveCouponsPage` in `App.jsx`.

2. **Sidebar coupon permission mismatch remains**  
   Sidebar shows Coupons when `PRODUCT_VIEW` exists, but page logic uses `COUPON_READ`/coupon permissions. This can hide coupons from marketing-focused roles or show coupon links to roles without coupon read, depending role map and alias behavior.

3. **Team mutations need careful review**  
   Team mutation wrappers exist, but global mutation flag has `team: false`. UI should not expose role/status/remove operations unless the specific feature decision is made and backend smoke is run.

4. **Order detail 2026 live route is now mounted, but still depends on Orders flag**  
   `/orders/:suborderId` uses `Seller2026LiveSuborderDetailPage` only when `isSeller2026OrdersProductionEnabled()` is true. Keep legacy fallback intact until the Orders domain is fully verified.

5. **Preview vs production confusion risk**  
   There are multiple `Seller2026Shell`, adapter, and page families. Before editing, identify whether the requested route is canonical `/seller/stores/:storeSlug`, mock `/seller-2026`, or live-adapter preview `/seller-2026-preview/:storeSlug`.

6. **Historical reports may be stale**  
   `reports/`, `CODEx_REPORTS/`, and root `system_map*.md` files include many prior statuses. Code should be treated as source of truth when reports conflict.

7. **Shipment rollout flags can change mutation behavior**  
   `ENABLE_MULTISTORE_SHIPMENT_MVP` and `ENABLE_MULTISTORE_SHIPMENT_MUTATION` affect whether seller fulfillment writes canonical shipment state. Production defaults can differ from local development defaults.

---

## 16. AI Implementation Guardrails

Use these rules before modifying Seller Workspace:

1. **Always identify the route family first.**  
   For production route work, edit `client/src/pages/seller2026/Seller2026Live*.jsx`, `client/src/hooks/seller2026/*`, `client/src/api/seller2026/*`, and the relevant CSS/components. Avoid changing `/seller-2026` mock surfaces unless requested.

2. **Use existing route helpers.**  
   New links should use `createSellerWorkspaceRoutes()` / `useSellerWorkspaceRoute()`.

3. **Do not trust frontend permissions alone.**  
   Page-level checks are UX. Backend `requireSellerStoreAccess()` is the authority.

4. **Respect Admin source-of-truth boundaries.**  
   Seller should not directly approve its own product publishing, activate payment profile, or bypass Admin application/payment governance.

5. **Keep Storefront public rules separate.**  
   Seller-created or edited objects should not automatically become public unless the existing publish/visibility contracts allow it.

6. **Prefer adapters over inline mapping.**  
   Use `client/src/api/seller2026/*.adapter.ts` to normalize DTOs. Do not duplicate mapping logic in page JSX.

7. **Keep query keys consistent.**  
   React Query invalidation spans both `seller2026` and older `seller` query keys in several hooks. When adding mutations, invalidate all affected old/new keys.

8. **Check mutation flags before enabling buttons.**  
   `mutation-flags.ts` is a documented rollout gate. UI can render disabled states with explanations.

9. **Preserve legacy redirects.**  
   They support old links and notification routes. Remove only after end-to-end redirect and notification smoke passes.

10. **Avoid broad backend changes for UI-only slicing.**  
   The codebase intentionally adopted many 2026 surfaces via frontend adapters first. Backend/schema changes require separate governance and tests.

---

## 17. Recommended Validation Commands

Because this update was static analysis only and dependencies were not installed from the archive, run targeted checks after changes:

```bash
# Install if needed
pnpm install

# Client typecheck/build
pnpm -F client exec tsc -b
pnpm -F client build

# Server build
pnpm -F server build

# Full workspace build
pnpm build
```

Relevant smoke scripts found in package files:

```bash
# Seller/store/order/payment related backend smoke scripts
pnpm -F server smoke:seller-order-ownership
pnpm -F server smoke:order-payment
pnpm -F server smoke:coupon-scope
pnpm -F server smoke:checkout-coupons
pnpm -F server smoke:store-readiness
pnpm -F server smoke:store-application
pnpm -F server smoke:admin-store-payment-profiles
pnpm -F server smoke:seller-notifications

# Frontend/public release QA scripts
pnpm qa:public-release
pnpm qa:e2e:truth
pnpm qa:auth:frontend
```

Historical Seller 2026 smoke runner referenced in repo root `system_map.md`:

```bash
pnpm exec tsx scripts/seller2026-auth-fixture-live-smoke.ts
```

Verify this script exists/current before using it; if missing or moved, search `scripts/` and `tools/qa/` for seller 2026 smoke tooling. The uploaded archive contains no `node_modules`, so install dependencies before running these commands.

---

## 18. Important Files Index

### Client Routing / Shell

```txt
client/src/App.jsx
client/src/layouts/SellerLayout.jsx
client/src/utils/sellerWorkspaceRoute.js
client/src/routes/seller2026RouteConfig.jsx
client/src/auth/authDomainHooks.js
client/src/api/axios.ts
client/vite.config.ts
```

### Production Seller 2026 Pages

```txt
client/src/pages/seller2026/Seller2026LiveDashboardPage.jsx
client/src/pages/seller2026/Seller2026LiveStorefrontPage.jsx
client/src/pages/seller2026/Seller2026LiveProductsPage.jsx
client/src/pages/seller2026/Seller2026LiveProductDetailPage.jsx
client/src/pages/seller2026/Seller2026LiveProductEditorPage.jsx
client/src/pages/seller2026/Seller2026LiveCategoriesPage.jsx
client/src/pages/seller2026/Seller2026LiveAttributesPage.jsx
client/src/pages/seller2026/Seller2026LiveAttributeValuesPage.jsx
client/src/pages/seller2026/Seller2026LiveCouponsPage.jsx
client/src/pages/seller2026/Seller2026LiveOrdersPage.jsx
client/src/pages/seller2026/Seller2026LiveSuborderDetailPage.jsx
client/src/pages/seller2026/Seller2026LivePaymentReviewPage.jsx
client/src/pages/seller2026/Seller2026LivePaymentProfilePage.jsx
client/src/pages/seller2026/Seller2026LiveTeamPage.jsx
client/src/pages/seller2026/Seller2026LiveMemberDetailPage.jsx
client/src/pages/seller2026/Seller2026LiveTeamAuditPage.jsx
client/src/pages/seller2026/Seller2026LiveNotificationsPage.jsx
client/src/pages/seller2026/Seller2026LiveAnalyticsPage.jsx
client/src/pages/seller2026/seller2026PagePermissions.js
```

### Client Seller APIs

```txt
client/src/api/sellerWorkspace.ts
client/src/api/sellerStoreProfile.ts
client/src/api/sellerProducts.ts
client/src/api/sellerCategories.ts
client/src/api/sellerAttributes.ts
client/src/api/sellerCoupons.ts
client/src/api/sellerOrders.ts
client/src/api/sellerPayments.ts
client/src/api/sellerPaymentProfile.ts
client/src/api/sellerTeam.ts
client/src/api/sellerTeamAudit.ts
client/src/api/sellerInvitations.ts
client/src/api/sellerNotifications.ts
client/src/api/seller2026/*.ts
```

### Client Seller Hooks

```txt
client/src/hooks/seller2026/useSeller2026Dashboard.ts
client/src/hooks/seller2026/useSeller2026Storefront.ts
client/src/hooks/seller2026/useSeller2026StoreProfile.ts
client/src/hooks/seller2026/useSeller2026UpdateStoreProfile.ts
client/src/hooks/seller2026/useSeller2026Products.ts
client/src/hooks/seller2026/useSeller2026ProductDetail.ts
client/src/hooks/seller2026/useSeller2026ProductEditor.ts
client/src/hooks/seller2026/useSeller2026SaveProductDraft.ts
client/src/hooks/seller2026/useSeller2026SubmitProductReview.ts
client/src/hooks/seller2026/useSeller2026Categories.ts
client/src/hooks/seller2026/useSeller2026Attributes.ts
client/src/hooks/seller2026/useSeller2026AttributeValues.ts
client/src/hooks/seller2026/useSeller2026Coupons.ts
client/src/hooks/seller2026/useSeller2026Orders.ts
client/src/hooks/seller2026/useSeller2026SuborderDetail.ts
client/src/hooks/seller2026/useSeller2026PaymentReview.ts
client/src/hooks/seller2026/useSeller2026PaymentProfile.ts
client/src/hooks/seller2026/useSeller2026Team.ts
client/src/hooks/seller2026/useSeller2026MemberDetail.ts
client/src/hooks/seller2026/useSeller2026TeamAudit.ts
client/src/hooks/seller2026/useSeller2026TeamMutations.ts
client/src/hooks/seller2026/useSeller2026Notifications.ts
client/src/hooks/seller2026/useSeller2026NotificationMutations.ts
```

### Server Seller Routes / Services

```txt
server/src/app.ts
server/src/middleware/requireSellerStoreAccess.ts
server/src/services/seller/permissionMap.ts
server/src/services/seller/resolveSellerAccess.ts
server/src/services/seller/storeRoles.ts
server/src/services/seller/backfillOwnerMembers.ts
server/src/services/seller/teamAudit.ts
server/src/services/seller/teamMutations.ts
server/src/services/sellerShippingSetup.service.ts
server/src/services/shipmentMutation.service.ts
server/src/services/orderShippingReadModel.service.ts
server/src/routes/seller.workspace.ts
server/src/routes/seller.storeProfile.ts
server/src/routes/seller.products.ts
server/src/routes/seller.categories.ts
server/src/routes/seller.attributes.ts
server/src/routes/seller.coupons.ts
server/src/routes/seller.orders.ts
server/src/routes/seller.payments.ts
server/src/routes/seller.paymentProfiles.ts
server/src/routes/seller.team.ts
server/src/routes/seller.notifications.ts
```

### Server Related Admin / Storefront Routes

```txt
server/src/routes/admin.products.ts
server/src/routes/admin.orders.ts
server/src/routes/admin.payments.audit.ts
server/src/routes/admin.storePaymentProfiles.ts
server/src/routes/admin.storeProfiles.ts
server/src/routes/admin.storeApplications.ts
server/src/routes/admin.coupons.ts
server/src/routes/store.ts
server/src/routes/store.coupons.ts
server/src/routes/store.customization.ts
server/src/routes/stores.ts
server/src/routes/user.storeApplications.ts
server/src/models/Shipment.ts
server/src/models/TrackingEvent.ts
```

---

## 19. Glossary

| Term | Meaning |
|---|---|
| Seller Workspace | Store-scoped operator area under `/seller/stores/:storeSlug`. |
| Store Scope | Every seller operation must be limited to one store through `storeId`/`storeSlug`. |
| Owner Bridge | Access mode where store owner is granted `STORE_OWNER` permissions, with lazy membership backfill. |
| Store Member | Non-owner user attached to a store through `StoreMember` and `StoreRole`. |
| Legacy Seller Page | Original `client/src/pages/seller/*.jsx` surface. |
| Seller 2026 Live Page | Modernized production page under `client/src/pages/seller2026/Seller2026Live*.jsx`. |
| Preview Route | `/seller-2026` or `/seller-2026-preview/:storeSlug`; design/reference surface, not canonical production. |
| Product Submission Status | Seller review status: `none`, `submitted`, `needs_revision`. |
| Payment Profile Request | Seller-submitted QRIS setup request awaiting admin review/promotion. |
| Active Payment Profile | Admin-approved QRIS setup snapshot used for checkout/payment. |
| Suborder | Store-specific child of a parent buyer order. Seller operations should primarily target suborders. |
| Shipment | Canonical delivery/shipment state tied one-to-one to a suborder. Seller fulfillment can sync this state when shipment mutation flags allow it. |
| Tracking Event | Timeline entry for shipment transitions, written by seller/admin/system shipment mutations. |
| Shipping Setup | Store-owned JSON metadata for fulfillment origin/contact readiness, editable through Seller Store Profile. |
| Store Coupon | Coupon with `scopeType = STORE` and store ID. |
| Platform Coupon | Admin/platform coupon, should not be treated as seller-owned. |

---

## 20. Best Next Steps for Future AI Work

When asked to implement a new Seller Workspace UI/feature:

1. Confirm the exact URL and whether it is canonical production or preview.
2. Locate current live page + hook + adapter + API module from the domain map.
3. Check `SellerLayout` sidebar permission and page-level permission alias.
4. Check backend route guard and mutation governance.
5. Make the smallest change that respects store scope and Admin/Storefront boundaries.
6. Update this `system_map.md` when adding routes, API behavior, lifecycle, or known guardrails.
7. Run targeted TypeScript/build/smoke checks and document the result.
