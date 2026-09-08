import fs from "fs";
import path from "path";
import { Request, Response, NextFunction } from "express";
import { sequelize, Product } from "../models/index.js";
import { getRuntimePublicOrigin } from "../config/deploymentOrigin.js";
import { isMissingUploadAsset } from "./uploadAsset.js";

const DEFAULT_TITLE = "TP PRENEURS | Marketplace Multivendor";
const DEFAULT_DESCRIPTION =
  "Temukan dan jual produk berkualitas di TP PRENEURS, platform marketplace multivendor andalan Anda.";
const DEFAULT_IMAGE_PATH = "/og-image.png";
const DEFAULT_FAVICON_PATH = "/favicon.png";

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);
const isCrawlerUnsafeAsset = (value: string) => /^(data:|blob:)/i.test(value);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const toText = (value: unknown, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const stripExistingSeoTags = (html: string) =>
  html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\s+[^>]*name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+[^>]*name=["']keywords["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+[^>]*name=["']robots["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+[^>]*property=["']og:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+[^>]*name=["']twitter:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<link\s+[^>]*rel=["']icon["'][^>]*>\s*/gi, "")
    .replace(/<link\s+[^>]*rel=["']apple-touch-icon["'][^>]*>\s*/gi, "");

const resolveAssetAbsoluteUrl = (req: Request, assetUrl: string | null | undefined): string => {
  const asset = String(assetUrl || "").trim();
  if (!asset) return "";
  if (isCrawlerUnsafeAsset(asset)) {
    return "";
  }
  if (isMissingUploadAsset(asset)) {
    return "";
  }
  if (isHttpUrl(asset)) {
    return asset;
  }
  const origin = getRuntimePublicOrigin() || `https://${req.hostname}`;
  const leadingSlash = asset.startsWith("/") ? "" : "/";
  return `${origin}${leadingSlash}${asset}`;
};

const resolveSeoAssetAbsoluteUrl = (
  req: Request,
  assetUrl: string | null | undefined,
  fallbackPath: string
) =>
  resolveAssetAbsoluteUrl(req, assetUrl) ||
  resolveAssetAbsoluteUrl(req, fallbackPath);

const resolveCanonicalUrl = (req: Request, rawUrl: unknown) => {
  const configured = toText(rawUrl);
  const fallbackPath = req.originalUrl || "/";
  const target = configured || fallbackPath;
  return resolveAssetAbsoluteUrl(req, target) || resolveAssetAbsoluteUrl(req, fallbackPath);
};

const isPrivateRoute = (pathname: string) =>
  [
    "/admin",
    "/seller",
    "/user",
    "/cart",
    "/checkout",
    "/wishlist",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const parseCustomizationSeo = (publishedData: unknown): Record<string, any> => {
  if (!publishedData) return {};
  try {
    const parsed =
      typeof publishedData === "string"
        ? JSON.parse(publishedData)
        : publishedData;
    return parsed?.seoSettings || parsed?.seo || {};
  } catch {
    return {};
  }
};

const loadPublishedSeoSettings = async (): Promise<Record<string, any>> => {
  try {
    const rows = (await sequelize.query(
      "SELECT lang, publishedData FROM store_customizations WHERE lang IN ('en', 'id') ORDER BY CASE WHEN lang = 'en' THEN 0 WHEN lang = 'id' THEN 1 ELSE 2 END LIMIT 2",
      { type: "SELECT" }
    )) as any[];

    for (const row of rows) {
      const seo = parseCustomizationSeo(row?.publishedData);
      if (Object.keys(seo).length > 0) {
        return seo;
      }
    }
  } catch (e) {
    console.error("[seoRenderer] Failed to fetch store_customizations:", e);
  }
  return {};
};

export const seoRenderer = (clientDistDir: string) => {
  const indexHtmlPath = path.join(clientDistDir, "index.html");

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!fs.existsSync(indexHtmlPath)) {
        return next();
      }

      let html = stripExistingSeoTags(await fs.promises.readFile(indexHtmlPath, "utf8"));

      let metaTitle = DEFAULT_TITLE;
      let metaDescription = DEFAULT_DESCRIPTION;
      let metaImage = resolveSeoAssetAbsoluteUrl(req, DEFAULT_IMAGE_PATH, DEFAULT_IMAGE_PATH);
      let favicon = resolveSeoAssetAbsoluteUrl(req, DEFAULT_FAVICON_PATH, DEFAULT_FAVICON_PATH);
      let canonicalUrl = resolveCanonicalUrl(req, req.originalUrl);
      let metaKeywords = "";
      const robots = isPrivateRoute(req.path)
        ? "noindex,nofollow,noarchive"
        : "index,follow";

      const productMatch = req.path.match(/^\/product\/([^/]+)$/);
      if (productMatch && productMatch[1]) {
        const slug = productMatch[1];
        const product = await Product.findOne({ where: { slug, status: "active", isPublished: true } });
        if (product) {
          metaTitle = `${product.name} - TP PRENEURS`;
          metaDescription = product.description ? product.description.slice(0, 155) + "..." : metaDescription;
          if (product.promoImagePath) {
            metaImage = resolveSeoAssetAbsoluteUrl(req, product.promoImagePath, DEFAULT_IMAGE_PATH);
          } else if (product.imagePaths && product.imagePaths.length > 0) {
            metaImage = resolveSeoAssetAbsoluteUrl(req, product.imagePaths[0], DEFAULT_IMAGE_PATH);
          }
        }
      } else {
        const seo = await loadPublishedSeoSettings();
        metaTitle = toText(seo?.metaTitle, metaTitle);
        metaDescription = toText(seo?.metaDescription, metaDescription);
        metaKeywords = toText(seo?.metaKeywords);
        canonicalUrl = resolveCanonicalUrl(req, seo?.metaUrl || req.originalUrl);
        metaImage = resolveSeoAssetAbsoluteUrl(req, seo?.metaImageDataUrl, DEFAULT_IMAGE_PATH);
        favicon = resolveSeoAssetAbsoluteUrl(req, seo?.faviconDataUrl, DEFAULT_FAVICON_PATH);
      }

      const ogTags = `
        <title>${escapeHtml(metaTitle)}</title>
        <meta name="description" content="${escapeHtml(metaDescription)}" />
        ${metaKeywords ? `<meta name="keywords" content="${escapeHtml(metaKeywords)}" />` : ""}
        <meta name="robots" content="${robots}" />
        <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
        <link rel="icon" type="image/png" href="${escapeHtml(favicon)}" />
        <link rel="apple-touch-icon" href="${escapeHtml(resolveSeoAssetAbsoluteUrl(req, "/apple-touch-icon.png", DEFAULT_FAVICON_PATH))}" />
        <meta property="og:title" content="${escapeHtml(metaTitle)}" />
        <meta property="og:description" content="${escapeHtml(metaDescription)}" />
        <meta property="og:image" content="${escapeHtml(metaImage)}" />
        <meta property="og:image:secure_url" content="${escapeHtml(metaImage)}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapeHtml(metaTitle)}" />
        <meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
        <meta name="twitter:image" content="${escapeHtml(metaImage)}" />
      `;

      html = html.replace("</head>", `${ogTags}</head>`);
      
      res.send(html);
    } catch (error) {
      console.error("[seoRenderer] Error rendering HTML:", error);
      res.sendFile(indexHtmlPath);
    }
  };
};
