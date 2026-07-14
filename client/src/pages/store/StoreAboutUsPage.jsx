import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  BookOpenCheck,
  GraduationCap,
  Rocket,
  Sparkles,
} from "lucide-react";
import { getStoreCustomization } from "../../api/public/storeCustomizationPublic.ts";
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
const normalizeSignatureText = (value) =>
  toText(value, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.。]+$/g, "")
    .trim();

const defaultMissionMembers = [
  {
    title: "Collaborative Creation Space",
    subTitle: "Providing a platform for students to develop creative ideas into tangible educational products.",
  },
  {
    title: "Educational Quality First",
    subTitle: "Ensuring every product prioritizes learning effectiveness and targeted technology use.",
  },
  {
    title: "Edupreneurial Spirit",
    subTitle: "Helping students manage, package, and market their work professionally.",
  },
  {
    title: "Learning Solutions",
    subTitle: "Providing accessible interactive media that answers contemporary education challenges.",
  },
  {
    title: "Ruang Kolaborasi Cipta Karya",
    subTitle:
      "Menyediakan wadah bagi mahasiswa untuk mengembangkan ide kreatif menjadi produk pembelajaran yang nyata dan aplikatif",
  },
  {
    title: "Mengutamakan Kualitas Edukasi",
    subTitle:
      "Memastikan setiap produk dirancang dengan mengutamakan efektivitas belajar dan pemanfaatan teknologi tepat sasaran.",
  },
  {
    title: "Membangun Jiwa Edupreneurship",
    subTitle:
      "Menumbuhkan pola pikir wirausaha agar mahasiswa mampu mengelola, mengemas, dan memasarkan karya secara profesional.",
  },
  {
    title: "Menghadirkan Solusi Belajar",
    subTitle:
      "Memberikan akses mudah terhadap media belajar interaktif yang mampu menjawab tantangan pendidikan masa kini.",
  },
];
const defaultMissionMemberSignatures = new Set(
  defaultMissionMembers.map((member) =>
    `${normalizeSignatureText(member.title)}::${normalizeSignatureText(member.subTitle)}`
  )
);
const defaultMissionMemberTitles = new Set(
  defaultMissionMembers.map((member) => normalizeSignatureText(member.title))
);
const defaultTeamTitles = new Set([
  normalizeSignatureText("Mission in Action"),
  normalizeSignatureText("Misi Kami"),
]);
const defaultTeamDescriptions = new Set([
  normalizeSignatureText("Four operating commitments that keep TP Preneurs relevant, useful, and ready to grow."),
  normalizeSignatureText("Empat fokus yang menjaga TP Preneurs tetap relevan, berdampak, dan siap bertumbuh."),
]);
const getMemberSignature = (member) =>
  `${normalizeSignatureText(member?.title)}::${normalizeSignatureText(member?.subTitle ?? member?.subtitle)}`;
const isDefaultMissionMember = (member) =>
  defaultMissionMemberSignatures.has(getMemberSignature(member)) ||
  defaultMissionMemberTitles.has(normalizeSignatureText(member?.title));
const isDefaultTeamTitle = (value) => defaultTeamTitles.has(normalizeSignatureText(value));
const isDefaultTeamDescription = (value) =>
  defaultTeamDescriptions.has(normalizeSignatureText(value));

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

export default function StoreAboutUsPage() {
  const { i18n } = useTranslation();
  const lang = getStoreLang(i18n);
  const isIndonesian = lang === "id";
  const aboutUsQuery = useQuery({
    queryKey: ["store-customization", "about-us", lang],
    queryFn: () => getStoreCustomization({ lang, include: "about-us" }),
    staleTime: 60_000,
  });

  const customization = aboutUsQuery.data?.customization;
  const aboutUsRaw = customization?.aboutUs;
  const aboutUs = useMemo(() => normalizeAboutUs(aboutUsRaw), [aboutUsRaw]);
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
  const shouldRenderTopContentRight =
    aboutUs.topContentRight.enabled && hasText(aboutUs.topContentRight.imageDataUrl);
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
  const displayOurTeamTitle = aboutUs.ourTeam.title;
  const displayOurTeamDescription = aboutUs.ourTeam.description;
  const hasOurTeamText =
    hasText(displayOurTeamTitle) || hasText(displayOurTeamDescription);
  const shouldRenderOurTeam =
    aboutUs.ourTeam.enabled && (hasOurTeamText || displayOurTeamMembers.length > 0);
  const hasPageHeaderContent =
    hasText(aboutUs.pageHeader.pageTitle) || hasText(aboutUs.pageHeader.backgroundImageDataUrl);
  const shouldRenderPageHeader = aboutUs.pageHeader.enabled && hasPageHeaderContent;
  const hasTopContent = shouldRenderTopContentLeft || shouldRenderTopContentRight;
  const shouldRenderHero = shouldRenderPageHeader || hasTopContent;

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

  const hasAnyEnabledBlock =
    shouldRenderHero ||
    shouldRenderContentSection ||
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
      {shouldRenderHero ? (
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
          <div
            className={`mx-auto grid max-w-7xl gap-10 px-3 py-10 sm:px-4 sm:py-14 lg:px-6 lg:py-16 ${
              shouldRenderTopContentRight ? "lg:grid-cols-[1.05fr_0.95fr]" : ""
            }`}
          >
            {(shouldRenderPageHeader && hasText(aboutUs.pageHeader.pageTitle)) ||
            shouldRenderTopContentLeft ? (
              <div className="flex flex-col justify-center">
                {shouldRenderPageHeader && hasText(aboutUs.pageHeader.pageTitle) ? (
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
              </div>
            ) : null}

            {shouldRenderTopContentRight ? (
              <div className="relative aspect-[13/8] min-h-[310px] self-center overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl shadow-[#034c85]/15 dark:border-white/10 dark:bg-slate-900">
                <img
                  src={aboutUs.topContentRight.imageDataUrl}
                  alt={aboutUs.pageHeader.pageTitle || "About TP Preneurs"}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

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
          <section
            className={`grid gap-8 lg:items-stretch ${
              aboutUs.contentSection.contentImageDataUrl
                ? "lg:grid-cols-[0.88fr_1.12fr]"
                : "max-w-4xl"
            }`}
          >
            {aboutUs.contentSection.contentImageDataUrl ? (
              <div className="relative aspect-[7/4] min-h-[280px] self-start overflow-hidden rounded-[1.75rem] shadow-xl shadow-[#034c85]/10">
                <img
                  src={aboutUs.contentSection.contentImageDataUrl}
                  alt={isIndonesian ? "Visi TP Preneurs" : "TP Preneurs vision"}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            ) : null}

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8">
              <div className="space-y-5 text-base leading-8 text-slate-700 dark:text-slate-300">
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
                {hasText(displayOurTeamTitle) ? (
                  <h2 className="text-3xl font-black text-[#034c85] sm:text-4xl dark:text-white">
                    {displayOurTeamTitle}
                  </h2>
                ) : null}
                {hasText(displayOurTeamDescription) ? (
                  <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
                    {displayOurTeamDescription}
                  </p>
                ) : null}
              </div>
            ) : null}
            {displayOurTeamMembers.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayOurTeamMembers.map((member, index) => {
                  return (
                    <article
                      key={`about-team-${index}`}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#fe6f05]/45 hover:shadow-2xl hover:shadow-[#034c85]/15 focus-within:-translate-y-1 focus-within:border-[#fe6f05]/45 dark:border-white/10 dark:bg-white/5"
                    >
                      {member.imageDataUrl ? (
                        <div className="relative m-4 mb-0 aspect-[4/3] overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-[#eaf5ff] via-white to-[#fff1e7] dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                          <img
                            src={member.imageDataUrl}
                            alt={member.title || "TP Preneurs team member"}
                            className="h-full w-full object-contain object-center p-2 transition duration-500 group-hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 opacity-0 ring-2 ring-inset ring-[#fe6f05]/50 transition duration-300 group-hover:opacity-100" />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#034c85]/18 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                        </div>
                      ) : (
                        null
                      )}
                      <div className="p-5">
                        {hasText(member.title) ? (
                          <h3 className="text-base font-black text-slate-950 transition group-hover:text-[#034c85] dark:text-white">
                            {member.title}
                          </h3>
                        ) : null}
                        {hasText(member.subTitle) ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {member.subTitle}
                          </p>
                        ) : null}
                      </div>
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
