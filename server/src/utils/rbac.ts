// server/src/utils/rbac.ts
import type { Request, Response, NextFunction } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { normalizeCanonicalRole } from "./role.js";

export type Role = "staff" | "admin" | "super_admin";

const ROLE_RANK: Record<Role, number> = {
  staff: 1,
  admin: 2,
  super_admin: 3,
};

function getRole(req: Request) {
  const role = normalizeCanonicalRole((req as any).user?.role);
  return (ROLE_RANK as any)[role] ? (role as Role) : null;
}

export function hasRole(userRole: unknown, requiredRole: Role) {
  const role = normalizeCanonicalRole(userRole) as Role;
  const userRank = ROLE_RANK[role] || 0;
  const requiredRank = ROLE_RANK[requiredRole] || 0;
  return userRank >= requiredRank;
}

export function requireMinRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      const rawRole = normalizeCanonicalRole((req as any).user?.role);
      const role = getRole(req);
      if (!rawRole) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!role) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (!hasRole(role, minRole)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return next();
    });
  };
}

export const requireStaffOrAdmin = requireMinRole("staff");
export const requireAdmin = requireMinRole("admin");
export const requireSuperAdmin = requireMinRole("super_admin");
