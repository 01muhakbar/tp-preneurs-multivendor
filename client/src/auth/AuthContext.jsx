import { createContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  accountLogout as accountLogoutRequest,
  accountMe as accountMeRequest,
  adminLogin as adminLoginRequest,
  adminLogout as adminLogoutRequest,
  adminMe as adminMeRequest,
  sellerLogout as sellerLogoutRequest,
  sellerMe as sellerMeRequest,
} from "../api/auth.service.js";
import { api } from "../api/axios.ts";
import { onUnauthorized } from "./authEvents.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useBuyerCartSessionSync } from "./useBuyerCartSessionSync.js";
import {
  DEFAULT_SESSION_EXPIRED_NOTICE,
  resolveUnauthorizedNotice,
  storePendingAuthNotice,
} from "./authSessionNotice.js";

export const AuthContext = createContext(null);

const ADMIN_ROUTE_PREFIX = "/admin";
const SELLER_ROUTE_PREFIX = "/seller";
const AUTH_ENTRY_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/admin/login",
  "/admin/create-account",
  "/admin/forgot-password",
  "/admin/reset-password",
  "/admin/verify-account",
  "/admin/resend-verification",
  "/seller/login",
  "/seller/create-account",
  "/seller/verify-email",
  "/seller/forgot-password",
];
const ACCOUNT_SESSION_KEY = "accountSessionHint";
const SELLER_SESSION_KEY = "sellerSessionHint";
const ADMIN_SESSION_KEY = "adminSessionHint";
const LEGACY_ACCOUNT_SESSION_KEY = "authSessionHint";

const getScopeStorageKey = (scope) => {
  if (scope === "admin") return ADMIN_SESSION_KEY;
  if (scope === "seller") return SELLER_SESSION_KEY;
  return ACCOUNT_SESSION_KEY;
};

const readAuthHint = (scope) => {
  try {
    const keys = [getScopeStorageKey(scope)];
    if (scope === "account" && !keys.includes(LEGACY_ACCOUNT_SESSION_KEY)) {
      keys.push(LEGACY_ACCOUNT_SESSION_KEY);
    }
    return keys.some((key) => localStorage.getItem(key) === "true");
  } catch {
    return false;
  }
};

const writeAuthHint = (scope, value) => {
  try {
    const key = getScopeStorageKey(scope);
    if (value) {
      localStorage.setItem(key, "true");
      if (scope === "account") {
        localStorage.setItem(LEGACY_ACCOUNT_SESSION_KEY, "true");
      }
    } else {
      localStorage.removeItem(key);
      if (scope === "account") {
        localStorage.removeItem(LEGACY_ACCOUNT_SESSION_KEY);
      }
    }
  } catch {
    // ignore storage errors
  }
};

const normalizeAuthUser = (response) =>
  response?.data?.user ??
  response?.user ??
  response?.data ??
  (response && response.id ? response : null);

const normalizeRole = (role) => {
  const raw = String(role || "").trim().toLowerCase();
  if (!raw) return null;
  const compact = raw.replace(/[^a-z0-9]+/g, "");
  if (compact === "superadmin") return "super_admin";
  if (compact === "administrator" || compact === "admin") return "admin";
  if (compact === "staf" || compact === "staff") return "staff";
  return raw.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || null;
};

export function AuthProvider({ children }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const currentScope = location.pathname.startsWith(ADMIN_ROUTE_PREFIX)
    ? "admin"
    : location.pathname.startsWith(SELLER_ROUTE_PREFIX)
      ? "seller"
      : "account";

  const [accountUser, setAccountUser] = useState(null);
  const [accountRole, setAccountRole] = useState(null);
  const [isAccountLoading, setIsAccountLoading] = useState(true);

  const [sellerUser, setSellerUser] = useState(null);
  const [sellerRole, setSellerRole] = useState(null);
  const [isSellerLoading, setIsSellerLoading] = useState(true);

  const [adminUser, setAdminUser] = useState(null);
  const [adminRole, setAdminRole] = useState(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const { resetBuyerCartSessionSync } = useBuyerCartSessionSync({
    user: accountUser,
    role: accountRole,
    isLoading: isAccountLoading,
  });

  const currentUser =
    currentScope === "admin" ? adminUser : currentScope === "seller" ? sellerUser : accountUser;
  const currentRole =
    currentScope === "admin" ? adminRole : currentScope === "seller" ? sellerRole : accountRole;
  const currentLoading =
    currentScope === "admin"
      ? isAdminLoading
      : currentScope === "seller"
        ? isSellerLoading
        : isAccountLoading;

  const clearSession = (scope = currentScope) => {
    if (scope === "admin") {
      setAdminUser(null);
      setAdminRole(null);
      setIsAdminLoading(false);
      writeAuthHint("admin", false);
      try {
        localStorage.removeItem("adminAuthToken");
      } catch {
        // ignore storage errors
      }
      return;
    }

    if (scope === "seller") {
      setSellerUser(null);
      setSellerRole(null);
      setIsSellerLoading(false);
      writeAuthHint("seller", false);
      try {
        localStorage.removeItem("sellerAuthToken");
      } catch {
        // ignore storage errors
      }
      return;
    }

    setAccountUser(null);
    setAccountRole(null);
    setIsAccountLoading(false);
    writeAuthHint("account", false);
    try {
      localStorage.removeItem("authToken");
    } catch {
      // ignore storage errors
    }
    delete api.defaults.headers.common.Authorization;
  };

  const refreshSession = async (options = {}, scope = currentScope) => {
    const markExpiredOnUnauthorized = options?.markExpiredOnUnauthorized === true;

    if (scope === "admin") {
      setIsAdminLoading(true);
    } else if (scope === "seller") {
      setIsSellerLoading(true);
    } else {
      setIsAccountLoading(true);
    }

    try {
      const response =
        scope === "admin"
          ? await adminMeRequest()
          : scope === "seller"
            ? await sellerMeRequest()
            : await accountMeRequest();
      const nextUser = normalizeAuthUser(response);
      if (!nextUser) {
        if (markExpiredOnUnauthorized) {
          storePendingAuthNotice(DEFAULT_SESSION_EXPIRED_NOTICE);
        }
        clearSession(scope);
        return;
      }

      const nextRole = normalizeRole(nextUser?.role);
      if (scope === "admin") {
        setAdminUser(nextUser);
        setAdminRole(nextRole);
      } else if (scope === "seller") {
        setSellerUser(nextUser);
        setSellerRole(nextRole);
      } else {
        setAccountUser(nextUser);
        setAccountRole(nextRole);
      }
      writeAuthHint(scope, true);

      if (import.meta.env.DEV) {
        console.log("[auth] refreshSession user", { scope, user: nextUser });
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        if (markExpiredOnUnauthorized) {
          storePendingAuthNotice(
            resolveUnauthorizedNotice({
              status,
              code: error?.response?.data?.code,
              message: error?.response?.data?.message,
            })
          );
        }
        clearSession(scope);
        return;
      }
      if (import.meta.env.DEV) {
        console.info("[auth] refreshSession skipped", error);
      }
    } finally {
      if (scope === "admin") {
        setIsAdminLoading(false);
      } else if (scope === "seller") {
        setIsSellerLoading(false);
      } else {
        setIsAccountLoading(false);
      }
    }
  };

  const login = async (email, password) => {
    if (!email || !password) {
      return { ok: false, message: "Email and password are required." };
    }

    setIsAdminLoading(true);
    try {
      const response = await adminLoginRequest({ email, password });
      const nextUser = response?.user || response?.data?.user || null;
      const nextRole = normalizeRole(nextUser?.role || response?.role || response?.data?.role);
      const token = response?.token || response?.data?.token || null;

      if (token) {
        try {
          localStorage.setItem("adminAuthToken", token);
        } catch {
          // ignore storage errors
        }
      }

      if (nextUser) {
        setAdminUser(nextUser);
        setAdminRole(nextRole);
        writeAuthHint("admin", true);
        setIsAdminLoading(false);
      } else {
        await refreshSession({}, "admin");
      }

      queryClient.invalidateQueries({ queryKey: ["admin", "me"], exact: true });
      return { ok: true };
    } catch (error) {
      clearSession("admin");
      return {
        ok: false,
        status: error?.response?.status || null,
        code: error?.response?.data?.code || "",
        message: error?.response?.data?.message || "Login failed.",
        data: error?.response?.data?.data || null,
      };
    }
  };

  const logout = async (scope = currentScope) => {
    try {
      if (scope === "admin") {
        await adminLogoutRequest();
      } else if (scope === "seller") {
        await sellerLogoutRequest();
      } else {
        await accountLogoutRequest();
      }
    } catch {
      // ignore logout errors
    } finally {
      clearSession(scope);
      if (scope === "admin") {
        queryClient.removeQueries({ queryKey: ["admin", "me"], exact: true });
      } else if (scope === "seller") {
        queryClient.removeQueries({ queryKey: ["seller"] });
      } else {
        queryClient.removeQueries({ queryKey: ["account"] });
        queryClient.removeQueries({ queryKey: ["cart"] });
        queryClient.removeQueries({ queryKey: ["orders"] });
      }
    }
  };

  useEffect(() => {
    const hasToken = (() => {
      try {
        return Boolean(
          localStorage.getItem(
            currentScope === "admin"
              ? "adminAuthToken"
              : currentScope === "seller"
                ? "sellerAuthToken"
                : "authToken"
          )
        );
      } catch {
        return false;
      }
    })();

    const shouldProbe =
      hasToken ||
      readAuthHint(currentScope) ||
      (currentScope === "seller" && location.pathname.startsWith("/seller/stores")) ||
      (currentScope === "account" &&
        (location.pathname === "/checkout/success" || location.pathname.startsWith("/user/")));
    const shouldMarkExpiredOnUnauthorized = !AUTH_ENTRY_PATHS.some(
      (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
    if (shouldProbe) {
      refreshSession({ markExpiredOnUnauthorized: shouldMarkExpiredOnUnauthorized }, currentScope);
    } else if (currentScope === "admin") {
      setIsAdminLoading(false);
    } else if (currentScope === "seller") {
      setIsSellerLoading(false);
    } else {
      setIsAccountLoading(false);
    }

    const unsubscribe = onUnauthorized((payload) => {
      storePendingAuthNotice(resolveUnauthorizedNotice(payload));
      clearSession(currentScope);
      if (currentScope === "account") {
        resetBuyerCartSessionSync();
      }
    });

    return unsubscribe;
  }, [currentScope, resetBuyerCartSessionSync]);

  const value = useMemo(
    () => ({
      user: currentUser,
      role: currentRole,
      isAuthenticated: Boolean(currentUser),
      isLoading: currentLoading,
      login,
      logout,
      refreshSession,
      scope: currentScope,
    }),
    [currentUser, currentRole, currentLoading, currentScope]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
