// server/src/utils/role.ts
export const normalizeRoleServer = (s?: string) =>
  (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-"); // <-- spasi ATAU underscore menjadi dash

export const normalizeCanonicalRole = (input?: unknown) => {
  const raw = String(input ?? "").toLowerCase().trim();
  if (!raw) return "";

  const compact = raw.replace(/[^a-z0-9]+/g, "");
  const snake = raw.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

  if (compact === "superadmin" || snake === "super_admin") return "super_admin";
  if (compact === "administrator" || snake === "admin") return "admin";
  if (compact === "staf" || compact === "staff" || snake === "staff") return "staff";
  if (compact === "customer" || compact === "client" || snake === "user") return "user";

  return snake;
};

export const isAdminWorkspaceRole = (s?: unknown) =>
  ["staff", "admin", "super_admin"].includes(normalizeCanonicalRole(s));

export const isAdminLike = (s?: string) => {
  const r = normalizeRoleServer(s);
  return r === "admin" || r === "super-admin";
};
