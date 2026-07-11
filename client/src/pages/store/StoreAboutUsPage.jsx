import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  Handshake,
  Lightbulb,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getStoreCustomization,
  getStoreSettings,
} from "../../api/public/storeCustomizationPublic.ts";
import {
  UiEmptyState,
  UiErrorState,
} from "../../components/primitives/state/index.js";
import { resolveAssetUrl } from "../../lib/assetUrl.js";

const DEFAULT_ABOUT_US_DISABLED = {
  pageHeader: {
    enabled: false,
    backgroundImageDataUrl: "",
    pageTitle: "",
  },
  topContentLeft: {
    enabled: false,
    topTitle: "",
    topDescription: "",
    boxOne: {
      title: "",
      subtitle: "",
      description: "",
    },
    boxTwo: {
      title: "",
      subtitle: "",
      description: "",
    },
    boxThree: {
      title: "",
      subtitle: "",
      description: "",
    },
  },
  topContentRight: {
    enabled: false,
    imageDataUrl: "",
  },
  contentSection: {
    enabled: false,
    firstParagraph: "",
    secondParagraph: "",
    contentImageDataUrl: "",
  },
  ourTeam: {
    enabled: false,
    title: "",
    description: "",
    members: Array.from({ length: 6 }, () => ({
      imageDataUrl: "",
      title: "",
      subTitle: "",
    })),
  },
};

const BRAND_BLUE = "#034c85";
const BRAND_ORANGE = "#fe6f05";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const toBool = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
};

const toImageDataUrl = (...values) => {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return resolveAssetUrl(normalized);
  }
  return "";
};

const hasText = (value) => String(value ?? "").trim().length > 0;

const hasAboutUsBoxContent = (item) =>
  hasText(item?.title) || hasText(item?.subtitle) || hasText(item?.description);

const isPlaceholderTeamTitle = (value) => /^name\s+\d+$/i.test(String(value ?? "").trim());

const isPlaceholderTeamSubtitle = (value) => /^role\s+\d+$/i.test(String(value ?? "").trim());

const getStoreLang = (i18n) => {
  const activeLanguage = String(i18n?.language || "").toLowerCase();
  const storedLanguage =
    typeof window !== "undefined" ? String(localStorage.getItem("store_language") || "") : "";
  const normalizedStored = storedLanguage.toLowerCase();
  return activeLanguage.startsWith("id") || normalizedStored === "indonesia" ? "id" : "en";
};

const normalizeAboutUs = (raw) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const pageHeader = source.pageHeader && typeof source.pageHeader === "object" ? source.pageHeader : {};
  const topContentLeft =
    source.topContentLeft && typeof source.topContentLeft === "object"
      ? source.topContentLeft
      : {};
  const topContentRight =
    source.topContentRight && typeof source.topContentRight === "object"
      ? source.topContentRight
      : {};
  const contentSection =
    source.contentSection && typeof source.contentSection === "object"
      ? source.contentSection
      : {};
  const ourTeam = source.ourTeam && typeof source.ourTeam === "object" ? source.ourTeam : {};
  const boxOne =
    topContentLeft.boxOne && typeof topContentLeft.boxOne === "object" ? topContentLeft.boxOne : {};
  const boxTwo =
    topContentLeft.boxTwo && typeof topContentLeft.boxTwo === "object" ? topContentLeft.boxTwo : {};
  const boxThree =
    topContentLeft.boxThree && typeof topContentLeft.boxThree === "object"
      ? topContentLeft.boxThree
      : {};
  const members = Array.isArray(ourTeam.members) ? ourTeam.members : [];

  return {
    pageHeader: {
      enabled: toBool(pageHeader.enabled, DEFAULT_ABOUT_US_DISABLED.pageHeader.enabled),
      backgroundImageDataUrl: toImageDataUrl(
        pageHeader.backgroundImageDataUrl,
        pageHeader.backgroundImage,
        pageHeader.imageDataUrl,
        pageHeader.image
      ),
      pageTitle: toText(pageHeader.pageTitle, DEFAULT_ABOUT_US_DISABLED.pageHeader.pageTitle),
    },
    topContentLeft: {
      enabled: toBool(topContentLeft.enabled, DEFAULT_ABOUT_US_DISABLED.topContentLeft.enabled),
      topTitle: toText(topContentLeft.topTitle, DEFAULT_ABOUT_US_DISABLED.topContentLeft.topTitle),
      topDescription: toText(
        topContentLeft.topDescription,
        DEFAULT_ABOUT_US_DISABLED.topContentLeft.topDescription
      ),
      boxOne: {
        title: toText(boxOne.title, DEFAULT_ABOUT_US_DISABLED.topContentLeft.boxOne.title),
        subtitle: toText(boxOne.subtitle, DEFAULT_ABOUT_US_DISABLED.topContentLeft.boxOne.subtitle),
        description: toText(
          boxOne.description,
          DEFAULT_ABOUT_US_DISABLED.topContentLeft.boxOne.description
        ),
      },
      boxTwo: {
        title: toText(boxTwo.title, DEFAULT_ABOUT_US_DISABLED.topContentLeft.boxTwo.title),
        subtitle: toText(boxTwo.subtitle, DEFAULT_ABOUT_US_DISABLED.topContentLeft.boxTwo.subtitle),
        description: toText(
          boxTwo.description,
          DEFAULT_ABOUT_US_DISABLED.topContentLeft.boxTwo.description
        ),
      },
      boxThree: {
        title: toText(boxThree.title, DEFAULT_ABOUT_US_DISABLED.topContentLeft.boxThree.title),
        subtitle: toText(
          boxThree.subtitle,
          DEFAULT_ABOUT_US_DISABLED.topContentLeft.boxThree.subtitle
        ),
        description: toText(
          boxThree.description,
          DEFAULT_ABOUT_US_DISABLED.topContentLeft.boxThree.description
        ),
      },
    },
    topContentRight: {
      enabled: toBool(topContentRight.enabled, DEFAULT_ABOUT_US_DISABLED.topContentRight.enabled),
      imageDataUrl: toImageDataUrl(topContentRight.imageDataUrl, topContentRight.image),
    },
    contentSection: {
      enabled: toBool(contentSection.enabled, DEFAULT_ABOUT_US_DISABLED.contentSection.enabled),
      firstParagraph: toText(
        contentSection.firstParagraph,
        DEFAULT_ABOUT_US_DISABLED.contentSection.firstParagraph
      ),
      secondParagraph: toText(
        contentSection.secondParagraph,
        DEFAULT_ABOUT_US_DISABLED.contentSection.secondParagraph
      ),
      contentImageDataUrl: toImageDataUrl(
        contentSection.contentImageDataUrl,
        contentSection.imageDataUrl,
        contentSection.image
      ),
    },
    ourTeam: {
      enabled: toBool(ourTeam.enabled, DEFAULT_ABOUT_US_DISABLED.ourTeam.enabled),
      title: toText(ourTeam.title, DEFAULT_ABOUT_US_DISABLED.ourTeam.title),
      description: toText(ourTeam.description, DEFAULT_ABOUT_US_DISABLED.ourTeam.description),
      members: DEFAULT_ABOUT_US_DISABLED.ourTeam.members.map((fallback, index) => {
        const member = members[index] && typeof members[index] === "object" ? members[index] : {};
        return {
          imageDataUrl: toImageDataUrl(member.imageDataUrl, member.image),
          title: toText(member.title, fallback.title),
          subTitle: toText(member.subTitle ?? member.subtitle, fallback.subTitle),
        };
      }),
    },
  };
};

const buildDisplayOurTeamMember = (member) => {
  const title = isPlaceholderTeamTitle(member?.title) ? "" : toText(member?.title, "");
  const subTitle = isPlaceholderTeamSubtitle(member?.subTitle)
    ? ""
    : toText(member?.subTitle, "");
  return {
    imageDataUrl: toImageDataUrl(member?.imageDataUrl, member?.image),
    title,
    subTitle,
  };
};

const hasDisplayOurTeamMemberContent = (member) =>
  hasText(member?.imageDataUrl) || hasText(member?.title) || hasText(member?.subTitle);

const boxIcons = [BookOpenCheck, GraduationCap, Rocket];
const missionIcons = [Handshake, Target, Lightbulb, Sparkles, BookOpenCheck, Rocket];

function AboutUsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
      <div className="h-[430px] animate-pulse rounded-[2rem] bg-slate-200 sm:h-[500px]" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`about-skeleton-stat-${index}`} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`about-skeleton-team-${index}`} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

function BrandMark({ logoUrl, isIndonesian }) {
  return (
    <div className="relative min-h-[310px] overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl shadow-[#034c85]/15 dark:border-white/10 dark:bg-slate-900">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[#fe6f05]" />
      <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-[#fe6f05]/15" />
      <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[#034c85]/15" />
      <div className="relative flex h-full min-h-[310px] flex-col justify-between p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
            {logoUrl ? (
              <img src={logoUrl} alt="TP Preneurs" className="h-11 w-auto max-w-[180px] object-contain" />
            ) : (
              <span className="text-lg font-black text-[#034c85] dark:text-white">TP Preneurs</span>
            )}
          </div>
          <span className="rounded-full border border-[#fe6f05]/25 bg-[#fe6f05]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#fe6f05]">
            EdTech
          </span>
        </div>
        <div className="py-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fe6f05] text-white shadow-lg shadow-[#fe6f05]/25">
            <Lightbulb className="h-7 w-7" />
          </div>
          <p className="mt-5 max-w-sm text-3xl font-black leading-tight text-[#034c85] dark:text-white">
            {isIndonesian
              ? "Media pembelajaran digital yang siap bertumbuh."
              : "Digital learning media built to grow."}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
            {isIndonesian
              ? "Dari teori, kolaborasi, hingga peluang pasar EdTech."
              : "From theory and collaboration to real EdTech opportunities."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(isIndonesian
            ? [
                ["Pembelajaran", "Teori"],
                ["Digital", "Media"],
                ["Kampus", "Pasar"],
                ["Dampak", "Pertumbuhan"],
              ]
            : [
                ["Learning", "Theory"],
                ["Digital", "Media"],
                ["Campus", "Market"],
                ["Impact", "Growth"],
              ]
          ).map(([title, subtitle]) => (
            <div key={`${title}-${subtitle}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-lg font-black text-[#034c85] dark:text-white">{title}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StoreAboutUsPage() {
  const { i18n } = useTranslation();
  const lang = getStoreLang(i18n);
  const isIndonesian = lang === "id";
  const aboutUsQuery = useQuery({
    queryKey: ["store-customization", "about-us", lang],
    queryFn: () => getStoreCustomization({ lang, include: "about-us,home" }),
    staleTime: 60_000,
  });
  const storeSettingsQuery = useQuery({
    queryKey: ["store-settings", "about-us-branding"],
    queryFn: getStoreSettings,
    staleTime: 60_000,
  });

  const customization = aboutUsQuery.data?.customization;
  const aboutUsRaw = customization?.aboutUs;
  const aboutUs = useMemo(() => normalizeAboutUs(aboutUsRaw), [aboutUsRaw]);
  const headerLogoUrl = toImageDataUrl(
    storeSettingsQuery.data?.data?.storeSettings?.branding?.clientLogoUrl,
    customization?.home?.header?.headerLogoUrl,
    customization?.home?.header?.logoDataUrl
  );
  const topContentLeftBoxes = useMemo(
    () =>
      [aboutUs.topContentLeft.boxOne, aboutUs.topContentLeft.boxTwo, aboutUs.topContentLeft.boxThree].filter(
        hasAboutUsBoxContent
      ),
    [aboutUs.topContentLeft.boxOne, aboutUs.topContentLeft.boxTwo, aboutUs.topContentLeft.boxThree]
  );
  const hasTopContentLeftContent =
    hasText(aboutUs.topContentLeft.topTitle) ||
    hasText(aboutUs.topContentLeft.topDescription) ||
    topContentLeftBoxes.length > 0;
  const shouldRenderTopContentLeft =
    aboutUs.topContentLeft.enabled && hasTopContentLeftContent;
  const shouldRenderTopContentRight = aboutUs.topContentRight.enabled;
  const contentParagraphs = [aboutUs.contentSection.firstParagraph, aboutUs.contentSection.secondParagraph].filter(
    hasText
  );
  const hasContentSectionContent =
    contentParagraphs.length > 0 || hasText(aboutUs.contentSection.contentImageDataUrl);
  const shouldRenderContentSection =
    aboutUs.contentSection.enabled && hasContentSectionContent;
  const displayOurTeamMembers = useMemo(
    () =>
      (Array.isArray(aboutUs.ourTeam.members) ? aboutUs.ourTeam.members : [])
        .map(buildDisplayOurTeamMember)
        .filter(hasDisplayOurTeamMemberContent),
    [aboutUs.ourTeam.members]
  );
  const hasOurTeamText =
    hasText(aboutUs.ourTeam.title) || hasText(aboutUs.ourTeam.description);
  const shouldRenderOurTeam =
    aboutUs.ourTeam.enabled && (hasOurTeamText || displayOurTeamMembers.length > 0);

  if (aboutUsQuery.isLoading) {
    return <AboutUsSkeleton />;
  }

  if (aboutUsQuery.isError) {
    const errorMessage =
      aboutUsQuery.error?.response?.data?.message ||
      aboutUsQuery.error?.message ||
      "Failed to load About Us.";
    return (
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
        <UiErrorState
          title="Failed to load About Us content."
          message={errorMessage}
          onRetry={() => aboutUsQuery.refetch()}
        />
      </div>
    );
  }

  if (!aboutUsRaw) {
    return (
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
        <UiEmptyState
          title="About Us content is not configured yet."
          description="Please check back later."
        />
      </div>
    );
  }

  const hasTopContent = shouldRenderTopContentLeft || shouldRenderTopContentRight;
  const hasAnyEnabledBlock =
    aboutUs.pageHeader.enabled ||
    hasTopContent ||
    aboutUs.contentSection.enabled ||
    shouldRenderOurTeam;

  if (!hasAnyEnabledBlock) {
    return (
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
        <UiEmptyState
          title="About Us content is not configured yet."
          description="All About Us blocks are currently disabled."
        />
      </div>
    );
  }

  return (
    <div
      className="bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"
      style={{
        "--about-brand-blue": BRAND_BLUE,
        "--about-brand-orange": BRAND_ORANGE,
      }}
    >
      <section
        className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(254,111,5,0.16),transparent_28%),linear-gradient(135deg,#f8fbff_0%,#eef6ff_48%,#fff7ed_100%)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(254,111,5,0.18),transparent_28%),linear-gradient(135deg,#061423_0%,#071d33_48%,#1c120b_100%)]"
        style={
          aboutUs.pageHeader.enabled && aboutUs.pageHeader.backgroundImageDataUrl
            ? {
                backgroundImage: `linear-gradient(135deg, rgba(3,76,133,0.88), rgba(3,76,133,0.58)), url(${aboutUs.pageHeader.backgroundImageDataUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-3 py-10 sm:px-4 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-6 lg:py-16">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#034c85]/15 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-wide text-[#034c85] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white">
              <Sparkles className="h-4 w-4 text-[#fe6f05]" />
              {isIndonesian ? "Ekosistem Edupreneur" : "Edupreneur Ecosystem"}
            </span>
            {aboutUs.pageHeader.enabled && hasText(aboutUs.pageHeader.pageTitle) ? (
              <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#034c85] sm:text-5xl lg:text-6xl dark:text-white">
                {aboutUs.pageHeader.pageTitle}
              </h1>
            ) : null}
            {shouldRenderTopContentLeft && hasText(aboutUs.topContentLeft.topTitle) ? (
              <p className="mt-5 max-w-3xl text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl dark:text-slate-100">
                {aboutUs.topContentLeft.topTitle}
              </p>
            ) : null}
            {shouldRenderTopContentLeft && hasText(aboutUs.topContentLeft.topDescription) ? (
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg dark:text-slate-300">
                {aboutUs.topContentLeft.topDescription}
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-[#034c85] px-5 py-3 text-sm font-black !text-white shadow-lg shadow-[#034c85]/20 transition hover:bg-[#023c69]"
              >
                {isIndonesian ? "Jelajahi Produk" : "Explore Products"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact-us"
                className="inline-flex items-center gap-2 rounded-full border border-[#034c85]/20 bg-white px-5 py-3 text-sm font-black text-[#034c85] transition hover:border-[#fe6f05]/35 hover:text-[#fe6f05] dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                {isIndonesian ? "Hubungi Kami" : "Contact Us"}
              </Link>
            </div>
          </div>

          {shouldRenderTopContentRight && aboutUs.topContentRight.imageDataUrl ? (
            <div className="relative min-h-[310px] overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl shadow-[#034c85]/15 dark:border-white/10 dark:bg-slate-900">
              <img
                src={aboutUs.topContentRight.imageDataUrl}
                alt={aboutUs.pageHeader.pageTitle || "About TP Preneurs"}
                className="h-full min-h-[310px] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#034c85]/90 to-transparent p-6">
                <p className="max-w-sm text-sm font-semibold leading-6 text-white">
                  {isIndonesian
                    ? "Karya pembelajaran digital yang lahir dari kolaborasi mahasiswa dan kebutuhan industri."
                    : "Digital learning work shaped by student collaboration and industry needs."}
                </p>
              </div>
            </div>
          ) : (
            <BrandMark logoUrl={headerLogoUrl} isIndonesian={isIndonesian} />
          )}
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-12 px-3 py-12 sm:px-4 lg:px-6">
        {shouldRenderTopContentLeft && topContentLeftBoxes.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-3">
            {topContentLeftBoxes.map((item, index) => {
              const Icon = boxIcons[index] || Sparkles;
              return (
                <article
                  key={`about-top-box-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#fe6f05]/35 hover:shadow-xl hover:shadow-[#034c85]/10 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#034c85]/10 text-[#034c85] dark:bg-white/10 dark:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  {hasText(item.title) ? (
                    <h2 className="text-xl font-black text-slate-950 dark:text-white">{item.title}</h2>
                  ) : null}
                  {hasText(item.subtitle) ? (
                    <p className="mt-2 text-sm font-bold uppercase tracking-wide text-[#fe6f05]">
                      {item.subtitle}
                    </p>
                  ) : null}
                  {hasText(item.description) ? (
                    <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {item.description}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </section>
        ) : null}

        {shouldRenderContentSection ? (
          <section className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-stretch">
            {aboutUs.contentSection.contentImageDataUrl ? (
              <img
                src={aboutUs.contentSection.contentImageDataUrl}
                alt={isIndonesian ? "Visi TP Preneurs" : "TP Preneurs vision"}
                className="min-h-[280px] w-full rounded-[1.75rem] object-cover shadow-xl shadow-[#034c85]/10"
              />
            ) : (
              <div className="flex min-h-[280px] flex-col justify-between rounded-[1.75rem] bg-[#034c85] p-7 text-white shadow-xl shadow-[#034c85]/20">
                <Target className="h-10 w-10 text-[#fe6f05]" />
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">
                    {isIndonesian ? "Visi" : "Vision"}
                  </p>
                  <p className="mt-3 text-3xl font-black leading-tight">
                    {isIndonesian ? "Inovasi yang bernilai guna" : "Innovation with practical value"}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#fe6f05]/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#fe6f05]">
                <Target className="h-4 w-4" />
                {isIndonesian ? "Visi & Misi" : "Vision & Mission"}
              </span>
              <div className="mt-6 space-y-5 text-base leading-8 text-slate-700 dark:text-slate-300">
                {contentParagraphs.map((paragraph, index) => (
                  <p
                    key={`about-content-paragraph-${index}`}
                    className={index === 0 ? "text-xl font-extrabold leading-9 text-[#034c85] dark:text-white" : ""}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {shouldRenderOurTeam ? (
          <section className="space-y-6">
            {hasOurTeamText ? (
              <div className="max-w-3xl">
                {hasText(aboutUs.ourTeam.title) ? (
                  <h2 className="text-3xl font-black text-[#034c85] sm:text-4xl dark:text-white">
                    {aboutUs.ourTeam.title}
                  </h2>
                ) : null}
                {hasText(aboutUs.ourTeam.description) ? (
                  <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
                    {aboutUs.ourTeam.description}
                  </p>
                ) : null}
              </div>
            ) : null}
            {displayOurTeamMembers.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {displayOurTeamMembers.map((member, index) => {
                  const Icon = missionIcons[index] || Sparkles;
                  return (
                    <article
                      key={`about-team-${index}`}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
                    >
                      {member.imageDataUrl ? (
                        <img
                          src={member.imageDataUrl}
                          alt={member.title}
                          className="mb-4 h-36 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fe6f05]/10 text-[#fe6f05]">
                          <Icon className="h-5 w-5" />
                        </div>
                      )}
                      {hasText(member.title) ? (
                        <h3 className="text-base font-black text-slate-950 dark:text-white">
                          {member.title}
                        </h3>
                      ) : null}
                      {hasText(member.subTitle) ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {member.subTitle}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
