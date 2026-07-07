import { useAuth } from "./useAuth.js";

const normalizeRole = (role) => {
  const raw = String(role || "").trim().toLowerCase();
  if (!raw) return "";
  const compact = raw.replace(/[^a-z0-9]+/g, "");
  if (compact === "superadmin") return "super_admin";
  if (compact === "administrator" || compact === "admin") return "admin";
  if (compact === "staf" || compact === "staff") return "staff";
  return raw.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
};
const toRole = (auth) => normalizeRole(auth?.role ?? auth?.user?.role);
const isAdminRoleValue = (role) =>
  ["admin", "super_admin", "staff"].includes(normalizeRole(role));

export function useAdminAuth() {
  const auth = useAuth() || {};
  const role = toRole(auth);
  const isAdminRole = isAdminRoleValue(role);

  return {
    user: auth.user ?? null,
    role: auth.role ?? null,
    isLoading: Boolean(auth.isLoading),
    isAuthenticated: Boolean(auth.isAuthenticated),
    isAdminRole,
    login: auth.login,
    logout: auth.logout,
    refreshSession: auth.refreshSession,
  };
}

export function useSellerAuth() {
  const auth = useAuth() || {};
  const role = toRole(auth);
  const isAdminRole = isAdminRoleValue(role);
  const isAuthenticated = Boolean(auth.isAuthenticated);
  const isSellerSession = isAuthenticated && !isAdminRole;

  return {
    user: auth.user ?? null,
    role: auth.role ?? null,
    isLoading: Boolean(auth.isLoading),
    isAuthenticated,
    isAdminSession: isAuthenticated && isAdminRole,
    isSellerSession,
    isStoreSession: isSellerSession,
    refreshSession: auth.refreshSession,
    logout: auth.logout,
  };
}

export function useAccountAuth() {
  const auth = useAuth() || {};
  const role = toRole(auth);
  const isAdminRole = isAdminRoleValue(role);

  return {
    user: auth.user ?? null,
    role: auth.role ?? null,
    isLoading: Boolean(auth.isLoading),
    isAuthenticated: Boolean(auth.isAuthenticated),
    isAccountSession: Boolean(auth.isAuthenticated) && !isAdminRole,
    login: auth.login,
    logout: auth.logout,
    refreshSession: auth.refreshSession,
  };
}
