import {
  hasSeller2026Permission,
  hasSeller2026PermissionSource,
  normalizeSeller2026Permissions,
} from "../../api/seller2026/permissions.ts";

export const getSeller2026PagePermissions = (sellerContext) => {
  const permissions = normalizeSeller2026Permissions(sellerContext);
  const sourceAvailable = hasSeller2026PermissionSource(sellerContext);

  return {
    permissions,
    sourceAvailable,
    can(permission) {
      return !sourceAvailable || hasSeller2026Permission(permissions, permission);
    },
  };
};
