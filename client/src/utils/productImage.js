const isAbsoluteUrl = (value) => {
  const text = String(value || "").trim().toLowerCase();
  return (
    text.startsWith("http://") ||
    text.startsWith("https://") ||
    text.startsWith("data:") ||
    text.startsWith("blob:")
  );
};

const ensureLeadingSlash = (value) => {
  if (!value) return "";
  return value.startsWith("/") ? value : `/${value}`;
};

const normalizeUploadsPath = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (isAbsoluteUrl(raw)) return raw;
  if (raw.startsWith("/uploads/")) return raw;
  if (raw.startsWith("uploads/")) return ensureLeadingSlash(raw);
  if (raw.startsWith("/")) return raw;
  return `/uploads/${raw}`;
};

export const resolveProductImageUrl = (product) => {
  if (!product) return "";
  if (typeof product === "string") return normalizeUploadsPath(product);

  const candidates = [
    product.imageUrl,
    product.image_url,
    product.thumbnailUrl,
    product.thumbnail_url,
    product.image,
    product.thumbnail,
    product.mediaPreviewUrl,
    product.photo,
    product.url,
  ];
  for (const candidate of candidates) {
    if (candidate) return normalizeUploadsPath(candidate);
  }

  const promo = product.promoImagePath ?? product.promo_image_path ?? product.media?.promoImageUrl;
  if (promo) return normalizeUploadsPath(promo);

  const rawPaths =
    product.imagePaths ?? product.images ?? product.image_paths ?? product.imageUrls ?? product.media?.imageUrls ?? null;

  if (Array.isArray(rawPaths) && rawPaths.length > 0) {
    return normalizeUploadsPath(rawPaths[0]);
  }

  if (typeof rawPaths === "string" && rawPaths.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(rawPaths);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeUploadsPath(parsed[0]);
      }
    } catch {
      // ignore
    }
  }

  return "";
};

export const ensureProductImageUrl = (value) => normalizeUploadsPath(value);
