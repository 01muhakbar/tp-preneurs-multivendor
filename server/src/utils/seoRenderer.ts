import fs from "fs";
import path from "path";
import { Request, Response, NextFunction } from "express";
import { sequelize, Product } from "../models/index.js";
import { getRuntimePublicOrigin } from "../config/deploymentOrigin.js";

const resolveAssetAbsoluteUrl = (req: Request, assetUrl: string | null | undefined): string => {
  if (!assetUrl) return "";
  if (assetUrl.startsWith("http://") || assetUrl.startsWith("https://") || assetUrl.startsWith("data:")) {
    return assetUrl;
  }
  const origin = getRuntimePublicOrigin() || `https://${req.hostname}`;
  const leadingSlash = assetUrl.startsWith("/") ? "" : "/";
  return `${origin}${leadingSlash}${assetUrl}`;
};

export const seoRenderer = (clientDistDir: string) => {
  const indexHtmlPath = path.join(clientDistDir, "index.html");

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!fs.existsSync(indexHtmlPath)) {
        return next();
      }

      let html = await fs.promises.readFile(indexHtmlPath, "utf8");

      let metaTitle = "TP PRENEURS | Marketplace Multivendor";
      let metaDescription = "Temukan dan jual produk berkualitas di TP PRENEURS, platform marketplace multivendor andalan Anda.";
      let metaImage = resolveAssetAbsoluteUrl(req, "/tp-logo.png"); // Default fallback
      let url = resolveAssetAbsoluteUrl(req, req.originalUrl);

      // 1. Check if it's a product page
      const productMatch = req.path.match(/^\/product\/([^/]+)$/);
      if (productMatch && productMatch[1]) {
        const slug = productMatch[1];
        const product = await Product.findOne({ where: { slug, status: "active", isPublished: true } });
        if (product) {
          metaTitle = `${product.name} - TP PRENEURS`;
          metaDescription = product.description ? product.description.slice(0, 155) + "..." : metaDescription;
          if (product.promoImagePath) {
            metaImage = resolveAssetAbsoluteUrl(req, product.promoImagePath);
          } else if (product.imagePaths && product.imagePaths.length > 0) {
            metaImage = resolveAssetAbsoluteUrl(req, product.imagePaths[0]);
          }
        }
      } else {
        // 2. Fetch Store Customization for Default SEO Settings
        try {
          const rows = await sequelize.query(
            "SELECT publishedData FROM store_customizations WHERE lang = 'en' LIMIT 1",
            { type: "SELECT" }
          ) as any[];
          
          if (rows.length > 0 && rows[0].publishedData) {
            const parsed = JSON.parse(rows[0].publishedData);
            const seo = parsed.seoSettings || parsed.seo || {};
            
            if (seo.metaTitle) metaTitle = seo.metaTitle;
            if (seo.metaDescription) metaDescription = seo.metaDescription;
            if (seo.metaImageDataUrl) {
              metaImage = resolveAssetAbsoluteUrl(req, seo.metaImageDataUrl);
            }
          }
        } catch (e) {
          console.error("[seoRenderer] Failed to fetch store_customizations:", e);
        }
      }

      // 3. Inject Meta Tags into HTML
      const ogTags = `
        <meta property="og:title" content="${metaTitle.replace(/"/g, '&quot;')}" />
        <meta property="og:description" content="${metaDescription.replace(/"/g, '&quot;')}" />
        <meta property="og:image" content="${metaImage}" />
        <meta property="og:url" content="${url}" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${metaTitle.replace(/"/g, '&quot;')}" />
        <meta name="twitter:description" content="${metaDescription.replace(/"/g, '&quot;')}" />
        <meta name="twitter:image" content="${metaImage}" />
        <title>${metaTitle.replace(/"/g, '&quot;')}</title>
        <meta name="description" content="${metaDescription.replace(/"/g, '&quot;')}" />
      `;

      // Prevent duplicate title tags
      html = html.replace(/<title>.*?<\/title>/i, "");
      
      // Inject our tags right before </head>
      html = html.replace("</head>", `${ogTags}</head>`);
      
      res.send(html);
    } catch (error) {
      console.error("[seoRenderer] Error rendering HTML:", error);
      res.sendFile(indexHtmlPath);
    }
  };
};
