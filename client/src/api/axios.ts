import axios, { AxiosHeaders } from "axios";
import { triggerUnauthorized } from "../auth/authEvents.ts";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const getCurrentBrowserPath = () => {
  if (typeof window === "undefined") return "";
  return String(window.location?.pathname || "");
};

const isScopedEndpointOutsideCurrentArea = (url: string) => {
  const currentPath = getCurrentBrowserPath();
  const isSellerEndpoint =
    url.startsWith("/seller") ||
    url.includes("/api/seller") ||
    url.startsWith("/auth/seller") ||
    url.includes("/api/auth/seller");
  if (isSellerEndpoint) {
    return !currentPath.startsWith("/seller");
  }

  const isAdminEndpoint =
    url.startsWith("/admin") ||
    url.includes("/api/admin") ||
    url.startsWith("/auth/admin") ||
    url.includes("/api/auth/admin");
  if (isAdminEndpoint) {
    return !currentPath.startsWith("/admin");
  }

  return false;
};

api.interceptors.request.use((config) => {
  const requestUrl = String(config.url || "");
  const usesScopedCookie =
    requestUrl.startsWith("/seller") ||
    requestUrl.startsWith("/auth/seller") ||
    requestUrl.startsWith("/auth/admin") ||
    requestUrl.startsWith("/admin");
  let token = null;
  if (!usesScopedCookie) {
    try {
      token = localStorage.getItem("authToken");
    } catch (_) {
      token = null;
    }
  }

  const headers = AxiosHeaders.from(config.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }
  config.headers = headers;

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || "";
    const isAuthMe =
      typeof url === "string" &&
      (url.includes("/auth/me") ||
        url.includes("/auth/account/me") ||
        url.includes("/auth/seller/me") ||
        url.includes("/auth/admin/me"));
    const isAuthFormEndpoint =
      typeof url === "string" &&
      [
        "/auth/login",
        "/auth/seller/login",
        "/auth/admin/login",
        "/auth/register",
        "/auth/register/resend-otp",
        "/auth/register/verify-otp",
        "/auth/forgot-password",
        "/auth/reset-password",
        "/auth/admin/register",
        "/auth/admin/register/resend-verification",
        "/auth/admin/verify-email",
        "/auth/admin/forgot-password",
        "/auth/admin/reset-password",
        "/auth/logout",
        "/auth/seller/logout",
        "/auth/admin/logout",
      ].some((path) => url.includes(path));
    const msg = err?.response?.data || err.message;
    if (
      status === 401 &&
      !isAuthMe &&
      !isAuthFormEndpoint &&
      !isScopedEndpointOutsideCurrentArea(String(url || ""))
    ) {
      triggerUnauthorized({
        status,
        code: err?.response?.data?.code,
        message: err?.response?.data?.message,
      });
    }
    // eslint-disable-next-line no-console
    if (!status || status >= 500) {
      console.error("[api error]", status, msg);
    }
    return Promise.reject(err);
  }
);
