import { resolveAuthenticatedUserFromToken } from "../services/authSession.service.js";
const getStorefrontCookieName = () => process.env.AUTH_COOKIE_NAME || "token";
const getSellerCookieName = () => process.env.SELLER_AUTH_COOKIE_NAME || `${getStorefrontCookieName()}_seller`;
const getAdminCookieName = () => process.env.ADMIN_AUTH_COOKIE_NAME || `${getStorefrontCookieName()}_admin`;
const isSellerRequest = (req) => {
    const originalUrl = String(req.originalUrl || "");
    const baseUrl = String(req.baseUrl || "");
    return originalUrl.startsWith("/api/seller") || baseUrl.startsWith("/api/seller");
};
const isAdminRequest = (req) => {
    const originalUrl = String(req.originalUrl || "");
    const baseUrl = String(req.baseUrl || "");
    return originalUrl.startsWith("/api/admin") || baseUrl.startsWith("/api/admin");
};
const resolveCookieNamesForRequest = (req) => {
    const originalUrl = String(req.originalUrl || "");
    const baseUrl = String(req.baseUrl || "");
    if (originalUrl.startsWith("/api/seller/invitations") || baseUrl.startsWith("/api/seller/invitations")) {
        return [getStorefrontCookieName(), getSellerCookieName()];
    }
    if (isSellerRequest(req)) {
        return [getSellerCookieName(), getStorefrontCookieName()];
    }
    if (isAdminRequest(req)) {
        return [getAdminCookieName(), getStorefrontCookieName()];
    }
    return [getStorefrontCookieName(), getSellerCookieName()];
};
export default async function requireAuth(req, res, next) {
    if (req.user) {
        return next();
    }
    const token = resolveCookieNamesForRequest(req)
        .map((cookieName) => req.cookies?.[cookieName])
        .find((cookieValue) => typeof cookieValue === "string" && cookieValue.trim()) || null;
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
        const session = await resolveAuthenticatedUserFromToken(token);
        if (!session) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        req.user = session.authUser;
        return next();
    }
    catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
}
