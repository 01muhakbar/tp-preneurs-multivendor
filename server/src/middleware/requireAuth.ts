// server/src/middleware/requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import { resolveAuthenticatedUserFromToken } from "../services/authSession.service.js";

const getStorefrontCookieName = () => process.env.AUTH_COOKIE_NAME || "token";
const getSellerCookieName = () =>
  process.env.SELLER_AUTH_COOKIE_NAME || `${getStorefrontCookieName()}_seller`;
const getAdminCookieName = () =>
  process.env.ADMIN_AUTH_COOKIE_NAME || `${getStorefrontCookieName()}_admin`;

const isSellerRequest = (req: Request) => {
  const originalUrl = String(req.originalUrl || "");
  const baseUrl = String(req.baseUrl || "");
  return originalUrl.startsWith("/api/seller") || baseUrl.startsWith("/api/seller");
};

const isAdminRequest = (req: Request) => {
  const originalUrl = String(req.originalUrl || "");
  const baseUrl = String(req.baseUrl || "");
  return originalUrl.startsWith("/api/admin") || baseUrl.startsWith("/api/admin");
};

const resolveCookieNamesForRequest = (req: Request) => {
  const originalUrl = String(req.originalUrl || "");
  const baseUrl = String(req.baseUrl || "");

  if (originalUrl.startsWith("/api/seller/invitations") || baseUrl.startsWith("/api/seller/invitations")) {
    return [getStorefrontCookieName(), getSellerCookieName()];
  }

  if (isSellerRequest(req)) {
    return [getSellerCookieName()];
  }
  if (isAdminRequest(req)) {
    return [getAdminCookieName(), getStorefrontCookieName()];
  }
  return [getStorefrontCookieName()];
};

export default async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if ((req as any).user) {
    return next();
  }

  const token =
    resolveCookieNamesForRequest(req)
      .map((cookieName) => (req as any).cookies?.[cookieName])
      .find((cookieValue) => typeof cookieValue === "string" && cookieValue.trim()) || null;
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const session = await resolveAuthenticatedUserFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    (req as any).user = session.authUser;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}
