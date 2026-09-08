import fs from "fs";
import path from "path";

const uploadRoots = () =>
  Array.from(
    new Set([
      path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads"),
      path.resolve(process.cwd(), "uploads"),
      path.resolve(process.cwd(), "server/uploads"),
      path.resolve(process.cwd(), "public/uploads"),
      path.resolve(process.cwd(), "server/public/uploads"),
    ])
  );

export const getUploadAssetRelativePath = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  let pathname = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      pathname = new URL(raw).pathname;
    } catch {
      return null;
    }
  }

  const normalizedPath = pathname.replace(/\\/g, "/");
  const match = normalizedPath.match(/^\/?uploads\/(.+)$/i);
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

export const uploadAssetExists = (value: unknown) => {
  const relativePath = getUploadAssetRelativePath(value);
  if (!relativePath) return null;

  const normalizedRelativePath = path.normalize(relativePath);
  if (
    path.isAbsolute(normalizedRelativePath) ||
    normalizedRelativePath === ".." ||
    normalizedRelativePath.startsWith(`..${path.sep}`)
  ) {
    return false;
  }

  return uploadRoots().some((root) => {
    const candidate = path.resolve(root, normalizedRelativePath);
    const relation = path.relative(root, candidate);
    if (relation === ".." || relation.startsWith(`..${path.sep}`) || path.isAbsolute(relation)) {
      return false;
    }
    try {
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
};

export const isMissingUploadAsset = (value: unknown) => {
  const exists = uploadAssetExists(value);
  return exists === false;
};
