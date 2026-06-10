export type Seller2026Permission =
  | "STORE_DASHBOARD_VIEW"
  | "STORE_PROFILE_READ"
  | "STORE_PROFILE_UPDATE"
  | "STORE_PAYMENT_PROFILE_READ"
  | "STORE_PAYMENT_PROFILE_SUBMIT"
  | "CATALOG_PRODUCT_READ"
  | "CATALOG_PRODUCT_CREATE"
  | "CATALOG_PRODUCT_UPDATE"
  | "CATALOG_PRODUCT_DELETE"
  | "CATALOG_PRODUCT_SUBMIT"
  | "CATALOG_CATEGORY_READ"
  | "CATALOG_CATEGORY_CREATE"
  | "CATALOG_CATEGORY_UPDATE"
  | "CATALOG_CATEGORY_STATUS_MANAGE"
  | "CATALOG_CATEGORY_DELETE"
  | "CATALOG_ATTRIBUTE_READ"
  | "CATALOG_ATTRIBUTE_CREATE"
  | "CATALOG_ATTRIBUTE_UPDATE"
  | "CATALOG_ATTRIBUTE_STATUS_MANAGE"
  | "CATALOG_ATTRIBUTE_DELETE"
  | "CATALOG_ATTRIBUTE_VALUE_CREATE"
  | "CATALOG_ATTRIBUTE_VALUE_UPDATE"
  | "CATALOG_ATTRIBUTE_VALUE_STATUS_MANAGE"
  | "COUPON_READ"
  | "COUPON_CREATE"
  | "COUPON_UPDATE"
  | "COUPON_DELETE"
  | "COUPON_STATUS_MANAGE"
  | "ORDER_READ"
  | "ORDER_FULFILLMENT_UPDATE"
  | "PAYMENT_REVIEW_READ"
  | "TEAM_READ"
  | "TEAM_INVITE"
  | "TEAM_ROLE_UPDATE"
  | "TEAM_REMOVE"
  | "TEAM_AUDIT_READ"
  | "NOTIFICATION_READ";

export const SELLER_2026_PREVIEW_PERMISSIONS: Seller2026Permission[] = [
  "STORE_DASHBOARD_VIEW",
  "STORE_PROFILE_READ",
  "STORE_PROFILE_UPDATE",
  "STORE_PAYMENT_PROFILE_READ",
  "STORE_PAYMENT_PROFILE_SUBMIT",
  "CATALOG_PRODUCT_READ",
  "CATALOG_PRODUCT_CREATE",
  "CATALOG_PRODUCT_UPDATE",
  "CATALOG_PRODUCT_DELETE",
  "CATALOG_PRODUCT_SUBMIT",
  "CATALOG_CATEGORY_READ",
  "CATALOG_CATEGORY_CREATE",
  "CATALOG_CATEGORY_UPDATE",
  "CATALOG_CATEGORY_STATUS_MANAGE",
  "CATALOG_CATEGORY_DELETE",
  "CATALOG_ATTRIBUTE_READ",
  "CATALOG_ATTRIBUTE_CREATE",
  "CATALOG_ATTRIBUTE_UPDATE",
  "CATALOG_ATTRIBUTE_STATUS_MANAGE",
  "CATALOG_ATTRIBUTE_DELETE",
  "CATALOG_ATTRIBUTE_VALUE_CREATE",
  "CATALOG_ATTRIBUTE_VALUE_UPDATE",
  "CATALOG_ATTRIBUTE_VALUE_STATUS_MANAGE",
  "COUPON_READ",
  "COUPON_CREATE",
  "COUPON_UPDATE",
  "COUPON_DELETE",
  "COUPON_STATUS_MANAGE",
  "ORDER_READ",
  "ORDER_FULFILLMENT_UPDATE",
  "PAYMENT_REVIEW_READ",
  "TEAM_READ",
  "TEAM_INVITE",
  "TEAM_ROLE_UPDATE",
  "TEAM_REMOVE",
  "TEAM_AUDIT_READ",
  "NOTIFICATION_READ",
];

const PERMISSION_ALIASES: Partial<Record<Seller2026Permission, string[]>> = {
  STORE_DASHBOARD_VIEW: ["DASHBOARD_VIEW", "STORE_VIEW"],
  STORE_PROFILE_READ: ["STORE_VIEW"],
  STORE_PROFILE_UPDATE: ["STORE_EDIT"],
  STORE_PAYMENT_PROFILE_READ: ["PAYMENT_PROFILE_VIEW"],
  STORE_PAYMENT_PROFILE_SUBMIT: ["PAYMENT_PROFILE_EDIT"],
  CATALOG_PRODUCT_READ: ["PRODUCT_VIEW"],
  CATALOG_PRODUCT_CREATE: ["PRODUCT_CREATE"],
  CATALOG_PRODUCT_UPDATE: ["PRODUCT_UPDATE", "PRODUCT_EDIT"],
  CATALOG_PRODUCT_DELETE: ["PRODUCT_DELETE", "PRODUCT_ARCHIVE"],
  CATALOG_PRODUCT_SUBMIT: ["PRODUCT_SUBMIT_REVIEW", "PRODUCT_EDIT", "PRODUCT_PUBLISH"],
  CATALOG_CATEGORY_READ: ["CATEGORY_VIEW", "PRODUCT_VIEW"],
  CATALOG_CATEGORY_CREATE: ["CATEGORY_MANAGE"],
  CATALOG_CATEGORY_UPDATE: ["CATEGORY_MANAGE"],
  CATALOG_CATEGORY_STATUS_MANAGE: ["CATEGORY_MANAGE"],
  CATALOG_CATEGORY_DELETE: ["CATEGORY_MANAGE"],
  CATALOG_ATTRIBUTE_READ: ["ATTRIBUTE_VIEW", "PRODUCT_VIEW"],
  CATALOG_ATTRIBUTE_CREATE: ["ATTRIBUTE_MANAGE"],
  CATALOG_ATTRIBUTE_UPDATE: ["ATTRIBUTE_MANAGE"],
  CATALOG_ATTRIBUTE_STATUS_MANAGE: ["ATTRIBUTE_MANAGE"],
  CATALOG_ATTRIBUTE_DELETE: ["ATTRIBUTE_MANAGE"],
  CATALOG_ATTRIBUTE_VALUE_CREATE: ["ATTRIBUTE_MANAGE"],
  CATALOG_ATTRIBUTE_VALUE_UPDATE: ["ATTRIBUTE_MANAGE"],
  CATALOG_ATTRIBUTE_VALUE_STATUS_MANAGE: ["ATTRIBUTE_MANAGE"],
  COUPON_READ: ["COUPON_VIEW"],
  COUPON_CREATE: ["COUPON_CREATE"],
  COUPON_UPDATE: ["COUPON_EDIT"],
  COUPON_DELETE: ["COUPON_DELETE", "COUPON_STATUS_MANAGE"],
  COUPON_STATUS_MANAGE: ["COUPON_STATUS_MANAGE"],
  ORDER_READ: ["ORDER_VIEW"],
  ORDER_FULFILLMENT_UPDATE: ["ORDER_FULFILLMENT_MANAGE"],
  PAYMENT_REVIEW_READ: ["PAYMENT_STATUS_VIEW"],
  TEAM_READ: ["STORE_MEMBERS_MANAGE", "STORE_ROLES_MANAGE"],
  TEAM_INVITE: ["STORE_MEMBERS_MANAGE"],
  TEAM_ROLE_UPDATE: ["STORE_ROLES_MANAGE", "STORE_MEMBERS_MANAGE"],
  TEAM_REMOVE: ["STORE_MEMBERS_MANAGE"],
  TEAM_AUDIT_READ: ["AUDIT_LOG_VIEW"],
  NOTIFICATION_READ: ["ORDER_VIEW", "PAYMENT_STATUS_VIEW", "STORE_VIEW"],
};

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const readPermissionArray = (value: unknown): unknown[] | null => {
  if (Array.isArray(value)) return value;

  const record = object(value);
  if (Array.isArray(record.permissions)) return record.permissions;
  if (Array.isArray(record.permissionKeys)) return record.permissionKeys;

  const access = object(record.access);
  if (Array.isArray(access.permissions)) return access.permissions;
  if (Array.isArray(access.permissionKeys)) return access.permissionKeys;

  const role = object(record.role);
  if (Array.isArray(role.permissions)) return role.permissions;
  if (Array.isArray(role.permissionKeys)) return role.permissionKeys;

  const member = object(record.member);
  if (Array.isArray(member.permissions)) return member.permissions;
  if (Array.isArray(member.permissionKeys)) return member.permissionKeys;

  const user = object(record.currentUser || record.user);
  if (Array.isArray(user.permissions)) return user.permissions;
  if (Array.isArray(user.permissionKeys)) return user.permissionKeys;

  return null;
};

export function hasSeller2026PermissionSource(input: unknown) {
  return readPermissionArray(input) !== null;
}

export function normalizeSeller2026Permissions(input: unknown): Set<string> {
  const permissions = readPermissionArray(input);
  if (!permissions) return new Set();
  return new Set(permissions.map(String).map((permission) => permission.trim()).filter(Boolean));
}

export function hasSeller2026Permission(
  permissions: Set<string> | string[] | undefined,
  permission: Seller2026Permission
) {
  if (!permissions) return false;
  const has = (candidate: string) =>
    permissions instanceof Set ? permissions.has(candidate) : permissions.includes(candidate);
  return has(permission) || (PERMISSION_ALIASES[permission] || []).some(has);
}

export function hasAnySeller2026Permission(
  permissions: Set<string> | string[] | undefined,
  required: Seller2026Permission[]
) {
  return required.some((permission) => hasSeller2026Permission(permissions, permission));
}

export function canUseSeller2026Action({
  permissions,
  permission,
  mutationEnabled,
}: {
  permissions: Set<string> | string[] | undefined;
  permission: Seller2026Permission;
  mutationEnabled: boolean;
}) {
  return hasSeller2026Permission(permissions, permission) && mutationEnabled;
}
