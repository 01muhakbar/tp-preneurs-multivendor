// server/src/middleware/authFromCookie.ts
import type { Request, Response, NextFunction } from "express";
import { resolveAuthenticatedUserFromToken } from "../services/authSession.service.js";

const getStorefrontCookieName = () => process.env.AUTH_COOKIE_NAME || "token";
const getSellerCookieName = () =>
  process.env.SELLER_AUTH_COOKIE_NAME || `${getStorefrontCookieName()}_seller`;
const getAdminCookieName = () =>
  process.env.ADMIN_AUTH_COOKIE_NAME || `${getStorefrontCookieName()}_admin`;

const resolveAuthSourceForRequest = (req: Request) => {
  const originalUrl = String(req.originalUrl || "");
  const baseUrl = String(req.baseUrl || "");
  const isSellerRequest =
    originalUrl.startsWith("/api/seller") || baseUrl.startsWith("/api/seller");
  const isAdminRequest =
    originalUrl.startsWith("/api/admin") || baseUrl.startsWith("/api/admin");
  if (isSellerRequest) {
    return { cookieName: getSellerCookieName(), allowBearerFallback: false };
  }
  if (isAdminRequest) {
    return { cookieName: getAdminCookieName(), allowBearerFallback: false };
  }
  return { cookieName: getStorefrontCookieName(), allowBearerFallback: true };
};

export default async function authFromCookie(req: Request, _res: Response, next: NextFunction) {
  try {
    const authSource = resolveAuthSourceForRequest(req);
    const token =
      (req as any).cookies?.[authSource.cookieName] ||
      (authSource.allowBearerFallback && req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined);

    (req as any).user = null;

    if (token) {
      const session = await resolveAuthenticatedUserFromToken(token);
      (req as any).user = session?.authUser ?? null;
    }
  } catch {
    (req as any).user = null;
  }
  next();
}
