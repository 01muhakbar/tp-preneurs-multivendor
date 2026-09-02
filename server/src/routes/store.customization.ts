import { Router } from "express";
import { QueryTypes } from "sequelize";
import { sequelize } from "../models/index.js";
import { Store } from "../models/index.js";
import {
  PUBLIC_STORE_IDENTITY_ATTRIBUTES,
  buildPublicOperationalPaymentProfileInclude,
  serializePublicStoreIdentityPayload,
} from "../services/sharedContracts/publicStoreIdentity.js";
import {
  buildEffectiveStoreMicrositeRichAboutPayload,
  buildPublicStoreCustomizationHeaderSettings,
  normalizeStoreCustomizationRichAboutPayload,
  parseStoredCustomization,
  sanitizeStoreCustomization,
} from "../services/sharedContracts/storeCustomizationSanitizer.js";
import { buildPublicOffersCustomization } from "../services/offersReadModel.js";

const router = Router();

type CustomizationRow = {
  id: number;
  lang: string;
  data: string | null;
  draftData: string | null;
  publishedData: string | null;
  hasUnpublishedChanges: number | boolean | null;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
  draftUpdatedBy: number | null;
  publishedBy: number | null;
  createdAt: string;
  updatedAt: string;
};

const normalizeLang = (value: unknown) => {
  const normalized = String(value || "en")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  return normalized || "en";
};

const parseIncludeSet = (value: unknown) => {
  const rawValues = Array.isArray(value) ? value : [value];
  const tokens = rawValues
    .flatMap((item) => String(item ?? "").split(","))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return new Set(tokens);
};

const ensureStoreCustomizationsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS store_customizations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      lang VARCHAR(16) NOT NULL,
      data LONGTEXT NULL,
      draftData LONGTEXT NULL,
      publishedData LONGTEXT NULL,
      hasUnpublishedChanges TINYINT(1) NOT NULL DEFAULT 0,
      draftUpdatedAt DATETIME NULL,
      publishedAt DATETIME NULL,
      draftUpdatedBy INT UNSIGNED NULL,
      publishedBy INT UNSIGNED NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_store_customizations_lang (lang)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const ensureColumn = async (columnName: string, definition: string) => {
    const rows = (await sequelize.query(
      `
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'store_customizations'
          AND COLUMN_NAME = :columnName
        LIMIT 1
      `,
      { type: QueryTypes.SELECT, replacements: { columnName } }
    )) as Array<{ COLUMN_NAME?: string }>;

    if (rows.length > 0) return;
    await sequelize.query(`ALTER TABLE store_customizations ADD COLUMN ${definition}`);
  };

  await ensureColumn("draftData", "draftData LONGTEXT NULL AFTER data");
  await ensureColumn("publishedData", "publishedData LONGTEXT NULL AFTER draftData");
  await ensureColumn(
    "hasUnpublishedChanges",
    "hasUnpublishedChanges TINYINT(1) NOT NULL DEFAULT 0 AFTER publishedData"
  );
  await ensureColumn("draftUpdatedAt", "draftUpdatedAt DATETIME NULL AFTER hasUnpublishedChanges");
  await ensureColumn("publishedAt", "publishedAt DATETIME NULL AFTER draftUpdatedAt");
  await ensureColumn("draftUpdatedBy", "draftUpdatedBy INT UNSIGNED NULL AFTER publishedAt");
  await ensureColumn("publishedBy", "publishedBy INT UNSIGNED NULL AFTER draftUpdatedBy");

  await sequelize.query(`
    UPDATE store_customizations
    SET
      draftData = CASE
        WHEN draftData IS NULL THEN data
        ELSE draftData
      END,
      publishedData = CASE
        WHEN publishedData IS NULL THEN data
        ELSE publishedData
      END,
      draftUpdatedAt = CASE
        WHEN draftUpdatedAt IS NULL THEN updatedAt
        ELSE draftUpdatedAt
      END,
      publishedAt = CASE
        WHEN publishedAt IS NULL AND data IS NOT NULL THEN updatedAt
        ELSE publishedAt
      END
    WHERE draftData IS NULL
       OR publishedData IS NULL
       OR draftUpdatedAt IS NULL
       OR (publishedAt IS NULL AND data IS NOT NULL)
  `);
};

const getCustomizationRow = async (lang: string) => {
  const rows = (await sequelize.query(
    `
      SELECT
        id,
        lang,
        data,
        draftData,
        publishedData,
        hasUnpublishedChanges,
        draftUpdatedAt,
        publishedAt,
        draftUpdatedBy,
        publishedBy,
        createdAt,
        updatedAt
      FROM store_customizations
      WHERE lang = :lang
      LIMIT 1
    `,
    { type: QueryTypes.SELECT, replacements: { lang } }
  )) as CustomizationRow[];
  return rows[0] || null;
};

const parseRawCustomization = (raw: string | null) => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const getPublishedCustomizationRaw = (row: CustomizationRow | null) =>
  row ? row.publishedData ?? row.data : null;

const hasPublishedCustomization = (row: CustomizationRow | null) =>
  Boolean(getPublishedCustomizationRaw(row));

const getPublicUpdatedAt = (row: CustomizationRow | null) =>
  row?.publishedAt ?? row?.updatedAt ?? "";

const toText = (value: unknown) => String(value ?? "").trim();

const normalizeComparableText = (value: unknown) =>
  toText(value).toLowerCase().replace(/\s+/g, " ").replace(/\.+$/g, "").trim();

const legacyAboutUsTeamTitles = new Set([
  "mission in action",
  "misi kami",
]);

const legacyAboutUsTeamDescriptions = new Set([
  "four operating commitments that keep tp preneurs relevant, useful, and ready to grow",
  "empat fokus yang menjaga tp preneurs tetap relevan, berdampak, dan siap bertumbuh",
]);

const legacyAboutUsMemberTitles = new Set([
  "collaborative creation space",
  "educational quality first",
  "edupreneurial spirit",
  "learning solutions",
  "ruang kolaborasi cipta karya",
  "mengutamakan kualitas edukasi",
  "membangun jiwa edupreneurship",
  "menghadirkan solusi belajar",
]);

const isLegacyAboutUsMember = (member: any) =>
  legacyAboutUsMemberTitles.has(normalizeComparableText(member?.title));

const hasCustomAboutUsMember = (member: any) =>
  Boolean(
    (toText(member?.imageDataUrl ?? member?.image) ||
      toText(member?.title) ||
      toText(member?.subTitle ?? member?.subtitle)) &&
      !isLegacyAboutUsMember(member)
  );

const translateAboutUsTeamTextToIndonesian = (value: unknown) => {
  const normalized = normalizeComparableText(value);
  if (
    normalized ===
    "get to know the tp preneurs team who keep our work relevant, useful, and ready to grow"
  ) {
    return "Kenali tim TP Preneurs yang menjaga karya kami tetap relevan, bermanfaat, dan siap berkembang.";
  }
  if (normalized === "tp preneurs developer") {
    return "Pengembang TP Preneurs";
  }
  if (normalized === "our team") {
    return "Tim Kami";
  }
  return toText(value);
};

const translateAboutUsContentSectionTextToIndonesian = (
  value: unknown,
  field: "firstParagraph" | "secondParagraph"
) => {
  const normalized = normalizeComparableText(value);
  if (field === "firstParagraph") {
    if (
      normalized ===
        normalizeComparableText(
          "Our Vision is to become a center of innovation and entrepreneurship for Educational Technology students, producing high-quality, practical, and competitive digital learning media solutions for the community"
        ) ||
      normalized ===
        normalizeComparableText(
          "To become a center of innovation and entrepreneurship for Educational Technology students, producing high-quality, practical, and competitive digital learning media solutions for society"
        ) ||
      normalized ===
        normalizeComparableText(
          "Menjadi pusat inovasi dan kewirausahaan bagi mahasiswa Teknologi Pendidikan untuk menghasilkan solusi media pembelajaran digital yang berkualitas, bernilai guna, dan berdaya saing di masyarakat"
        )
    ) {
      return "Visi Kami adalah menjadi pusat inovasi dan kewirausahaan bagi mahasiswa Teknologi Pendidikan, menghasilkan solusi media pembelajaran digital yang berkualitas tinggi, praktis, dan berdaya saing untuk masyarakat.";
    }
  }
  if (field === "secondParagraph") {
    if (
      normalized ===
        normalizeComparableText(
          "Our mission focuses on collaborative creation, educational quality, edupreneurial growth, and accessible interactive learning solutions for contemporary education"
        ) ||
      normalized ===
        normalizeComparableText(
          "Misi kami berfokus pada ruang kolaborasi cipta karya, kualitas edukasi, jiwa edupreneurship, dan solusi belajar interaktif yang menjawab tantangan pendidikan masa kini"
        )
    ) {
      return "Misi kami berfokus pada kreasi kolaboratif, kualitas pendidikan, pertumbuhan edupreneurial, dan solusi pembelajaran interaktif yang mudah diakses untuk pendidikan masa kini.";
    }
  }
  return toText(value);
};


const hasSliderContent = (slide: unknown) => {
  if (!slide || typeof slide !== "object" || Array.isArray(slide)) return false;
  const source = slide as Record<string, unknown>;
  return Boolean(
    toText(source.imageDataUrl) ||
      toText(source.image) ||
      toText(source.title) ||
      toText(source.description) ||
      toText(source.subtitle) ||
      toText(source.buttonName) ||
      toText(source.cta)
  );
};

const mergeMainSliderMediaFallback = (
  localized: Record<string, any>,
  fallback: Record<string, any>
) => {
  const localizedSlides = Array.isArray(localized?.home?.mainSlider?.sliders)
    ? localized.home.mainSlider.sliders
    : [];
  const fallbackSlides = Array.isArray(fallback?.home?.mainSlider?.sliders)
    ? fallback.home.mainSlider.sliders
    : [];
  if (fallbackSlides.length === 0) return localized;

  const hasLocalizedSliderContent = localizedSlides.some(hasSliderContent);
  const nextSlides = fallbackSlides.map((fallbackSlide: any, index: number) => {
    const localizedSlide =
      localizedSlides[index] && typeof localizedSlides[index] === "object"
        ? localizedSlides[index]
        : {};
    const localizedImage = toText(
      localizedSlide.imageDataUrl ?? localizedSlide.image
    );

    if (localizedImage || hasSliderContent(localizedSlide)) {
      return {
        ...localizedSlide,
        imageDataUrl: localizedImage || toText(fallbackSlide?.imageDataUrl),
        imageFocus: toText(localizedSlide.imageFocus) || fallbackSlide?.imageFocus,
      };
    }

    return {
      ...localizedSlide,
      imageDataUrl: toText(fallbackSlide?.imageDataUrl),
      imageFocus: toText(fallbackSlide?.imageFocus) || localizedSlide.imageFocus,
    };
  });

  return {
    ...localized,
    home: {
      ...localized.home,
      mainSlider: {
        ...localized.home?.mainSlider,
        sliders: nextSlides,
        options: hasLocalizedSliderContent
          ? localized.home?.mainSlider?.options
          : fallback.home?.mainSlider?.options || localized.home?.mainSlider?.options,
      },
    },
  };
};

const mergeAboutUsMediaFallback = (
  localized: Record<string, any>,
  fallback: Record<string, any>
) => {
  const localizedAboutUs =
    localized?.aboutUs && typeof localized.aboutUs === "object"
      ? localized.aboutUs
      : {};
  const fallbackAboutUs =
    fallback?.aboutUs && typeof fallback.aboutUs === "object"
      ? fallback.aboutUs
      : {};
  const localizedMembers = Array.isArray(localizedAboutUs?.ourTeam?.members)
    ? localizedAboutUs.ourTeam.members
    : [];
  const fallbackMembers = Array.isArray(fallbackAboutUs?.ourTeam?.members)
    ? fallbackAboutUs.ourTeam.members
    : [];
  const localizedPageHeaderImage = toText(
    localizedAboutUs?.pageHeader?.backgroundImageDataUrl ??
      localizedAboutUs?.pageHeader?.backgroundImage
  );
  const fallbackPageHeaderImage = toText(
    fallbackAboutUs?.pageHeader?.backgroundImageDataUrl ??
      fallbackAboutUs?.pageHeader?.backgroundImage
  );
  const localizedTopRightImage = toText(
    localizedAboutUs?.topContentRight?.imageDataUrl ??
      localizedAboutUs?.topContentRight?.image
  );
  const fallbackTopRightImage = toText(
    fallbackAboutUs?.topContentRight?.imageDataUrl ??
      fallbackAboutUs?.topContentRight?.image
  );
  const localizedContentImage = toText(
    localizedAboutUs?.contentSection?.contentImageDataUrl ??
      localizedAboutUs?.contentSection?.imageDataUrl ??
      localizedAboutUs?.contentSection?.image
  );
  const fallbackContentImage = toText(
    fallbackAboutUs?.contentSection?.contentImageDataUrl ??
      fallbackAboutUs?.contentSection?.imageDataUrl ??
      fallbackAboutUs?.contentSection?.image
  );
  const fallbackHasCustomTeamMembers = fallbackMembers.some(hasCustomAboutUsMember);
  const localizedTeamTitle = toText(localizedAboutUs?.ourTeam?.title);
  const fallbackTeamTitle = toText(fallbackAboutUs?.ourTeam?.title);
  const localizedTeamDescription = toText(localizedAboutUs?.ourTeam?.description);
  const fallbackTeamDescription = toText(fallbackAboutUs?.ourTeam?.description);
  const normalizedLocalizedTeamTitle = normalizeComparableText(localizedTeamTitle);
  const nextTeamTitle =
    fallbackHasCustomTeamMembers &&
    legacyAboutUsTeamTitles.has(normalizedLocalizedTeamTitle)
      ? normalizedLocalizedTeamTitle === "misi kami"
        ? "Tim Kami"
        : fallbackTeamTitle || localizedTeamTitle
      : localizedTeamTitle;
  const nextTeamDescription =
    fallbackHasCustomTeamMembers &&
    (legacyAboutUsTeamDescriptions.has(normalizeComparableText(localizedTeamDescription)) ||
      normalizedLocalizedTeamTitle === "misi kami")
      ? normalizedLocalizedTeamTitle === "misi kami"
        ? "Kenali tim TP Preneurs yang menjaga karya kami tetap relevan, bermanfaat, dan siap berkembang."
        : fallbackTeamDescription || localizedTeamDescription
      : localizedTeamDescription;

  return {
    ...localized,
    aboutUs: {
      ...localizedAboutUs,
      pageHeader: {
        ...localizedAboutUs.pageHeader,
        backgroundImageDataUrl: localizedPageHeaderImage || fallbackPageHeaderImage,
      },
      topContentRight: {
        ...localizedAboutUs.topContentRight,
        imageDataUrl: localizedTopRightImage || fallbackTopRightImage,
      },
      contentSection: {
        ...localizedAboutUs.contentSection,
        firstParagraph: translateAboutUsContentSectionTextToIndonesian(
          localizedAboutUs?.contentSection?.firstParagraph ??
            fallbackAboutUs?.contentSection?.firstParagraph,
          "firstParagraph"
        ),
        secondParagraph: translateAboutUsContentSectionTextToIndonesian(
          localizedAboutUs?.contentSection?.secondParagraph ??
            fallbackAboutUs?.contentSection?.secondParagraph,
          "secondParagraph"
        ),
        contentImageDataUrl: localizedContentImage || fallbackContentImage,
      },
      ourTeam: {
        ...localizedAboutUs.ourTeam,
        title: nextTeamTitle,
        description: nextTeamDescription,
        members: localizedMembers
          .map((member: any, index: number) => {
            const fallbackMember = fallbackMembers[index];
            const localizedImage = toText(member?.imageDataUrl ?? member?.image);
            const fallbackImage = toText(
              fallbackMember?.imageDataUrl ?? fallbackMember?.image
            );
            const shouldUseFallbackMemberText =
              fallbackHasCustomTeamMembers &&
              isLegacyAboutUsMember(member) &&
              hasCustomAboutUsMember(fallbackMember);
            if (
              fallbackHasCustomTeamMembers &&
              isLegacyAboutUsMember(member) &&
              !hasCustomAboutUsMember(fallbackMember)
            ) {
              return { imageDataUrl: "", title: "", subTitle: "" };
            }
            return {
              ...member,
              imageDataUrl: localizedImage || fallbackImage,
              title: shouldUseFallbackMemberText
                ? toText(fallbackMember?.title) || toText(member?.title)
                : member?.title,
              subTitle: shouldUseFallbackMemberText
                ? translateAboutUsTeamTextToIndonesian(
                    fallbackMember?.subTitle ?? fallbackMember?.subtitle
                  ) || toText(member?.subTitle ?? member?.subtitle)
                : translateAboutUsTeamTextToIndonesian(member?.subTitle),
            };
          }),
      },
    },
  };
};

const mergeCustomizationMediaFallback = (
  localized: Record<string, any>,
  fallback: Record<string, any>
) => mergeAboutUsMediaFallback(mergeMainSliderMediaFallback(localized, fallback), fallback);

const normalizeSlug = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

const resolvePrimaryPublicStore = async () => {
  return Store.findOne({
    where: { status: "ACTIVE" } as any,
    attributes: [...PUBLIC_STORE_IDENTITY_ATTRIBUTES],
    include: [buildPublicOperationalPaymentProfileInclude()],
    order: [["id", "ASC"]],
  });
};

const resolvePublicStoreBySlug = async (slug: string) => {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return null;

  return Store.findOne({
    where: {
      slug: normalizedSlug,
      status: "ACTIVE",
    } as any,
    attributes: [...PUBLIC_STORE_IDENTITY_ATTRIBUTES],
    include: [buildPublicOperationalPaymentProfileInclude()],
  });
};

// GET /api/store/customization/header?lang=en
// Response contract: { success: true, data: { language, headerText, phoneNumber, whatsAppLink, headerLogoUrl, updatedAt, contract } }
router.get("/header", async (req, res, next) => {
  try {
    await ensureStoreCustomizationsTable();
    const lang = normalizeLang(req.query?.lang);
    const row = await getCustomizationRow(lang);
    const fallbackRow =
      (!row || !hasPublishedCustomization(row)) && lang !== "en"
        ? await getCustomizationRow("en")
        : null;
    const sourceRow = row || fallbackRow;
    const sanitized = sourceRow
      ? parseStoredCustomization(getPublishedCustomizationRaw(sourceRow))
      : sanitizeStoreCustomization({});

    return res.json({
      success: true,
      data: buildPublicStoreCustomizationHeaderSettings(
        lang,
        sanitized,
        null,
        getPublicUpdatedAt(sourceRow)
      ),
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/store/customization/identity
// Response contract: { success: true, data: { name, slug, description, logoUrl, bannerUrl, email, phone, whatsapp, websiteUrl, instagramUrl, tiktokUrl, addressLine1, addressLine2, city, province, postalCode, country, updatedAt, contract } }
router.get("/identity", async (_req, res, next) => {
  try {
    const store = await resolvePrimaryPublicStore();
    return res.json({
      success: true,
      data: await serializePublicStoreIdentityPayload(store),
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/store/customization/identity/:slug
// Response contract: { success: true, data: { name, slug, description, logoUrl, bannerUrl, email, phone, whatsapp, websiteUrl, instagramUrl, tiktokUrl, addressLine1, addressLine2, city, province, postalCode, country, updatedAt, contract } }
router.get("/identity/:slug", async (req, res, next) => {
  try {
    const normalizedSlug = normalizeSlug(req.params.slug);
    if (!normalizedSlug) {
      return res.status(400).json({
        success: false,
        message: "Invalid store slug.",
      });
    }

    const store = await resolvePublicStoreBySlug(normalizedSlug);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    return res.json({
      success: true,
      data: await serializePublicStoreIdentityPayload(store),
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/store/customization/microsites/:slug/rich-about?lang=en
// Response contract: { success: true, data: { storeSlug, lang, richAbout: { title, body, hasContent }, effective: { title, body, source }, updatedAt, contract } }
router.get("/microsites/:slug/rich-about", async (req, res, next) => {
  try {
    await ensureStoreCustomizationsTable();
    const normalizedSlug = normalizeSlug(req.params.slug);
    if (!normalizedSlug) {
      return res.status(400).json({
        success: false,
        message: "Invalid store slug.",
      });
    }

    const store = await resolvePublicStoreBySlug(normalizedSlug);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const lang = normalizeLang(req.query?.lang);
    const row = await getCustomizationRow(lang);
    const fallbackRow =
      (!row || !hasPublishedCustomization(row)) && lang !== "en"
        ? await getCustomizationRow("en")
        : null;
    const sourceRow = row || fallbackRow;
    const rawCustomization = parseRawCustomization(getPublishedCustomizationRaw(sourceRow));
    const micrositesSource =
      rawCustomization &&
      typeof rawCustomization === "object" &&
      !Array.isArray(rawCustomization) &&
      rawCustomization.storeMicrosites &&
      typeof rawCustomization.storeMicrosites === "object" &&
      !Array.isArray(rawCustomization.storeMicrosites)
        ? rawCustomization.storeMicrosites
        : {};
    const storeMicrositeSource =
      micrositesSource &&
      typeof micrositesSource === "object" &&
      !Array.isArray(micrositesSource) &&
      micrositesSource[normalizedSlug] &&
      typeof micrositesSource[normalizedSlug] === "object" &&
      !Array.isArray(micrositesSource[normalizedSlug])
        ? micrositesSource[normalizedSlug]
        : {};
    const richAbout = normalizeStoreCustomizationRichAboutPayload(
      (storeMicrositeSource as any).richAbout ?? (storeMicrositeSource as any).about
    );
    const effective = buildEffectiveStoreMicrositeRichAboutPayload(store, richAbout);

    return res.json({
      success: true,
      data: {
        storeSlug: normalizedSlug,
        lang,
        richAbout,
        effective,
        updatedAt:
          effective.source === "STORE_CUSTOMIZATION" && getPublicUpdatedAt(sourceRow)
            ? new Date(getPublicUpdatedAt(sourceRow)).toISOString()
            : effective.source === "STORE_DESCRIPTION_FALLBACK" && store?.updatedAt
              ? new Date(store.updatedAt).toISOString()
              : "",
        contract: {
          authoritativeSource: "STORE_CUSTOMIZATION",
          fallbackOrder: {
            body: ["storeMicrosites[slug].richAbout.body", "STORE.description"],
            title: ["storeMicrosites[slug].richAbout.title", "static:About This Store"],
          },
          notes: [
            "Store microsite rich about content is customization-owned.",
            "When rich about body is empty, the storefront falls back to the seller-owned Store.description field.",
          ],
        },
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/store/customization?lang=en (public read-only, whitelist response)
// Response contract: { success: true, data: { lang, customization } }
router.get("/", async (req, res, next) => {
  try {
    await ensureStoreCustomizationsTable();
    const lang = normalizeLang(req.query?.lang);
    const includeSet = parseIncludeSet(req.query?.include);
    const includeProvided = includeSet.size > 0;
    const includeAboutUs =
      !includeProvided ||
      includeSet.has("aboutus") ||
      includeSet.has("about-us") ||
      includeSet.has("about_us");
    const includeHome =
      !includeProvided ||
      includeSet.has("home") ||
      includeSet.has("homesettings") ||
      includeSet.has("home-settings") ||
      includeSet.has("home_settings");
    const includePolicy = !includeProvided || includeSet.has("policy");
    const includeFaq = !includeProvided || includeSet.has("faq") || includeSet.has("faqs");
    const includeOffers = !includeProvided || includeSet.has("offer") || includeSet.has("offers");
    const includeContactUs =
      !includeProvided ||
      includeSet.has("contactus") ||
      includeSet.has("contact-us") ||
      includeSet.has("contact_us");
    const includeCheckout = !includeProvided || includeSet.has("checkout");
    const includeSeoSettings =
      !includeProvided ||
      includeSet.has("seo") ||
      includeSet.has("seosettings") ||
      includeSet.has("seo-settings") ||
      includeSet.has("seo_settings");
    const includeDashboardSetting =
      !includeProvided ||
      includeSet.has("dashboardsetting") ||
      includeSet.has("dashboard-setting") ||
      includeSet.has("dashboard_setting");
    const includeProductSlugPage =
      !includeProvided ||
      includeSet.has("productslugpage") ||
      includeSet.has("product-slug-page") ||
      includeSet.has("product_slug_page");

    const row = await getCustomizationRow(lang);
    const rowHasPublishedCustomization = hasPublishedCustomization(row);
    const fallbackRow = lang !== "en" ? await getCustomizationRow("en") : null;
    const sourcePayload = rowHasPublishedCustomization
      ? parseStoredCustomization(getPublishedCustomizationRaw(row))
      : fallbackRow
        ? parseStoredCustomization(getPublishedCustomizationRaw(fallbackRow))
        : sanitizeStoreCustomization({});
    const sanitizedSource = sanitizeStoreCustomization(sourcePayload);
    const sanitized =
      fallbackRow
        ? mergeCustomizationMediaFallback(
            sanitizedSource,
            sanitizeStoreCustomization(
              parseStoredCustomization(getPublishedCustomizationRaw(fallbackRow))
            )
          )
        : sanitizedSource;
    const customization: Record<string, unknown> = {};

    if (includeHome) {
      customization.home = sanitized.home;
    }
    if (includeAboutUs) {
      customization.aboutUs = sanitized.aboutUs;
    }
    if (includePolicy) {
      customization.privacyPolicy = sanitized.privacyPolicy;
      customization.termsAndConditions = sanitized.termsAndConditions;
    }
    if (includeFaq) {
      customization.faqs = sanitized.faqs;
    }
    if (includeOffers) {
      customization.offers = await buildPublicOffersCustomization(sanitized.offers);
    }
    if (includeContactUs) {
      customization.contactUs = sanitized.contactUs;
    }
    if (includeCheckout) {
      customization.checkout = sanitized.checkout;
    }
    if (includeSeoSettings) {
      customization.seoSettings = sanitized.seoSettings;
    }
    if (includeDashboardSetting) {
      customization.dashboardSetting = sanitized.dashboardSetting;
    }
    if (includeProductSlugPage) {
      customization.productSlugPage = sanitized.productSlugPage;
    }

    return res.json({
      success: true,
      data: {
        lang,
        customization,
      },
      // Backward compatibility for existing consumers that still read top-level fields.
      lang,
      customization,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
