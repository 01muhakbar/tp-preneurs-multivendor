import type { Request, Response } from "express";
import { sequelize, User } from "../../models/index.js";

type UserColumnSupport = {
  checked: boolean;
  hasPhone: boolean;
  hasAddress: boolean;
  hasAvatarUrl: boolean;
};

const userColumns: UserColumnSupport = {
  checked: false,
  hasPhone: false,
  hasAddress: false,
  hasAvatarUrl: false,
};

const getAuthUserId = (req: Request) => {
  const userId = Number((req as any)?.user?.id);
  return Number.isFinite(userId) && userId > 0 ? userId : 0;
};

const toText = (value: unknown) => String(value ?? "").trim();

const toNullableText = (value: unknown) => {
  const text = toText(value);
  return text || null;
};

const ensureUserColumns = async () => {
  if (userColumns.checked) return userColumns;
  try {
    const table = await sequelize.getQueryInterface().describeTable("users");
    userColumns.hasPhone =
      Object.prototype.hasOwnProperty.call(table, "phone") ||
      Object.prototype.hasOwnProperty.call(table, "phone_number") ||
      Object.prototype.hasOwnProperty.call(table, "phoneNumber");
    userColumns.hasAddress = Object.prototype.hasOwnProperty.call(table, "address");
    userColumns.hasAvatarUrl =
      Object.prototype.hasOwnProperty.call(table, "avatar_url") ||
      Object.prototype.hasOwnProperty.call(table, "avatarUrl");
  } catch {
    userColumns.hasPhone = false;
    userColumns.hasAddress = false;
    userColumns.hasAvatarUrl = false;
  } finally {
    userColumns.checked = true;
  }
  return userColumns;
};

const getUserPayload = (user: any, support: UserColumnSupport) => {
  const payload: Record<string, unknown> = {
    id: Number(user?.get?.("id") ?? user?.id ?? 0),
    name: toText(user?.get?.("name") ?? user?.name ?? ""),
    email: toText(user?.get?.("email") ?? user?.email ?? ""),
    phone: support.hasPhone
      ? toNullableText(
          user?.get?.("phoneNumber") ??
            user?.get?.("phone") ??
            user?.phoneNumber ??
            user?.phone ??
            null
        )
      : null,
    avatarUrl: support.hasAvatarUrl
      ? toNullableText(user?.get?.("avatarUrl") ?? user?.avatarUrl ?? null)
      : null,
  };
  if (support.hasAddress) {
    payload.address = toNullableText(user?.get?.("address") ?? user?.address ?? null);
  }
  return payload;
};

const findUserMe = async (userId: number, support: UserColumnSupport) => {
  const attrs = ["id", "name", "email"];
  if (support.hasPhone) attrs.push("phoneNumber");
  if (support.hasAddress) attrs.push("address");
  if (support.hasAvatarUrl) attrs.push("avatarUrl");
  return User.findByPk(userId, { attributes: attrs as any[] });
};

export const getUserMe = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const support = await ensureUserColumns();
    const user = await findUserMe(userId, support);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      data: getUserPayload(user, support),
    });
  } catch (error) {
    console.error("[user/me][GET] failed:", error);
    return res.status(500).json({ success: false, message: "Failed to load profile" });
  }
};

export const updateUserMe = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const name = toText(req.body?.name);
    if (!name && !req.body?.email && req.body?.phone === undefined && req.body?.phoneNumber === undefined && req.body?.avatarUrl === undefined && req.body?.avatar === undefined) {
      return res.status(400).json({ success: false, message: "No updates provided" });
    }

    const support = await ensureUserColumns();
    const user = await findUserMe(userId, support);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "email")) {
      const email = toText(req.body?.email);
      if (email) updates.email = email;
    }
    if (
      support.hasPhone &&
      (Object.prototype.hasOwnProperty.call(req.body || {}, "phone") ||
        Object.prototype.hasOwnProperty.call(req.body || {}, "phoneNumber"))
    ) {
      const phoneVal = Object.prototype.hasOwnProperty.call(req.body || {}, "phone")
        ? req.body?.phone
        : req.body?.phoneNumber;
      updates.phoneNumber = toNullableText(phoneVal);
    }
    if (
      support.hasAvatarUrl &&
      (Object.prototype.hasOwnProperty.call(req.body || {}, "avatarUrl") ||
        Object.prototype.hasOwnProperty.call(req.body || {}, "avatar"))
    ) {
      updates.avatarUrl = toNullableText(
        Object.prototype.hasOwnProperty.call(req.body || {}, "avatarUrl")
          ? req.body?.avatarUrl
          : req.body?.avatar
      );
    }
    await user.update(updates as any);

    const refreshed = await findUserMe(userId, support);
    if (!refreshed) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      data: getUserPayload(refreshed, support),
    });
  } catch (error: any) {
    if (error?.name === "SequelizeUniqueConstraintError") {
      const errString =
        JSON.stringify(error?.fields || {}) +
        " " +
        JSON.stringify(error?.errors || []) +
        " " +
        String(error?.message || "") +
        " " +
        String(error?.parent?.message || "") +
        " " +
        String(error?.original?.message || "");
      if (/phone|mobile/i.test(errString)) {
        return res.status(409).json({ success: false, message: "Phone number already in use." });
      }
      return res.status(409).json({ success: false, message: "Email already in use." });
    }
    console.error("[user/me][PUT] failed:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};
