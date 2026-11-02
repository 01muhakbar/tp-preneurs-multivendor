import React from "react";
import { ArrowRight, Sparkles, Smartphone, GraduationCap, Lightbulb, BookOpen, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./discover-digital-products-hero.css";

const QUICK_DELIVERY_BILINGUAL_MAP = {
  subTitle: {
    id: "PRODUK DIGITAL & INOVASI",
    en: "DIGITAL & INNOVATION PRODUCTS",
    aliases: [
      "produk digital & inovasi",
      "digital & innovation products",
      "karya digital & inovasi",
      "organic products and food",
      "fast and reliable delivery to your doorstep."
    ]
  },
  title: {
    id: "Belanja Online dengan Mudah",
    en: "Shop Online with Ease",
    aliases: [
      "belanja online dengan mudah",
      "shop online with ease",
      "belanja produk inovasi tp preneurs",
      "quick delivery to your home",
      "quick delivery",
      "100% natural quality organic product"
    ]
  },
  description: {
    id: "Akses langsung produk digital, media belajar interaktif, dan karya riset mahasiswa.",
    en: "Instant access to curated student digital creations, learning media, and research tools.",
    aliases: [
      "akses langsung produk digital, media belajar interaktif, dan karya riset mahasiswa.",
      "instant access to curated student digital creations, learning media, and research tools.",
      "instant access to curated student digital creations, interactive media, and research tools.",
      "same-day delivery in select cities with real-time tracking.",
      "choose your daily necessary product from our kachabazar shop and get some special offers. see our latest discounted products from here and get a special discount."
    ]
  },
  buttonName: {
    id: "Mulai Belanja",
    en: "Start Shopping",
    aliases: [
      "mulai belanja",
      "start shopping",
      "download app",
      "buy now",
      "learn more",
      "jelajahi produk"
    ]
  },
};

const resolveBilingualText = (field, rawValue, isIndo) => {
  const text = String(rawValue || "").trim();
  const targetLang = isIndo ? "id" : "en";
  const oppositeLang = isIndo ? "en" : "id";
  const mapping = QUICK_DELIVERY_BILINGUAL_MAP[field];

  if (!text) {
    return mapping ? mapping[targetLang] : text;
  }

  const current = text.toLowerCase();

  // Legacy grocery patterns
  if (
    current.includes("quick delivery to your home") ||
    current.includes("organic products and food") ||
    current.includes("choose your daily necessary product") ||
    current.includes("download app") ||
    current.includes("fast and reliable delivery")
  ) {
    return mapping ? mapping[targetLang] : text;
  }

  // Domain-specific keyword matching for robust bilingual switching
  if (field === "description") {
    if (
      current.includes("instant access") ||
      current.includes("student digital creations") ||
      current.includes("curated student") ||
      current.includes("learning media") ||
      current.includes("interactive media") ||
      current.includes("akses langsung") ||
      current.includes("media belajar") ||
      current.includes("karya riset")
    ) {
      return mapping ? mapping[targetLang] : text;
    }
  }

  if (field === "title") {
    if (
      current.includes("shop online") ||
      current.includes("belanja online") ||
      current.includes("belanja produk inovasi") ||
      current.includes("quick delivery")
    ) {
      return mapping ? mapping[targetLang] : text;
    }
  }

  if (field === "subTitle") {
    if (
      current.includes("digital & innovation") ||
      current.includes("produk digital") ||
      current.includes("karya digital") ||
      current.includes("organic products")
    ) {
      return mapping ? mapping[targetLang] : text;
    }
  }

  if (field === "buttonName") {
    if (
      current.includes("start shopping") ||
      current.includes("mulai belanja") ||
      current.includes("download app") ||
      current.includes("buy now") ||
      current.includes("learn more") ||
      current.includes("jelajahi produk") ||
      current.includes("shop now")
    ) {
      return mapping ? mapping[targetLang] : text;
    }
  }

  if (mapping) {
    const canonicalOpposite = mapping[oppositeLang].toLowerCase();
    const canonicalTarget = mapping[targetLang].toLowerCase();
    const isAlias = Array.isArray(mapping.aliases) && mapping.aliases.some((alias) => alias.toLowerCase() === current);

    if (current === canonicalOpposite || current === canonicalTarget || isAlias) {
      return mapping[targetLang];
    }
  }

  return text;
};

export default function DiscoverDigitalProductsHero({
  title,
  subTitle,
  description,
  buttonName,
  buttonLink = "/shop",
  imageDataUrl,
  isIndo: propIsIndo,
}) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || "id").toLowerCase();
  const isIndo = typeof propIsIndo === "boolean" ? propIsIndo : currentLang.startsWith("id");

  // Dynamic bilingual resolution for TP Preneurs
  const displayEyebrow = resolveBilingualText("subTitle", subTitle, isIndo);
  const displayTitle = resolveBilingualText("title", title, isIndo);
  const displayDescription = resolveBilingualText("description", description, isIndo);
  const displayButtonName = resolveBilingualText("buttonName", buttonName, isIndo);
  const displayLink = buttonLink || "/shop";

  // Split title to give accent color to the last 2 words
  const words = displayTitle.trim().split(" ");
  let firstPart = displayTitle;
  let highlightPart = "";
  if (words.length >= 2) {
    highlightPart = words.splice(-2).join(" ");
    firstPart = words.join(" ");
  }

  // Showcase pillars for TP Preneurs
  const digitalPillars = isIndo ? [
    { id: 1, title: "Aplikasi & Web", subtitle: "Siap pakai & inovatif", icon: Smartphone },
    { id: 2, title: "Media Belajar", subtitle: "Interaktif & edukatif", icon: GraduationCap, featured: true },
    { id: 3, title: "Riset & Solusi", subtitle: "Karya inovasi mahasiswa", icon: Lightbulb },
    { id: 4, title: "Modul & Panduan", subtitle: "Materi aplikatif", icon: BookOpen },
  ] : [
    { id: 1, title: "Apps & Web", subtitle: "Ready-to-use solutions", icon: Smartphone },
    { id: 2, title: "Learning Media", subtitle: "Interactive & educational", icon: GraduationCap, featured: true },
    { id: 3, title: "Research & Tools", subtitle: "Student innovative projects", icon: Lightbulb },
    { id: 4, title: "Guides & Modules", subtitle: "Practical courseware", icon: BookOpen },
  ];

  return (
    <section 
      aria-labelledby="tp-digital-showcase-heading"
      className="tp-showcase-hero relative w-full overflow-hidden rounded-3xl"
    >
      {/* Background Ambient Glows */}
      <div className="tp-showcase-hero__glow-blue pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-50" />
      <div className="tp-showcase-hero__glow-orange pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl opacity-35" />

      <div className="relative z-10 grid gap-8 lg:gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        
        {/* Left Column: Concise Content */}
        <div className="tp-showcase-hero__content flex flex-col items-start space-y-4 sm:space-y-5 text-left">
          
          {/* Eyebrow Badge */}
          <div className="tp-showcase-hero__eyebrow inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-[#fe6f05]" aria-hidden="true" />
            <span className="text-[#fe6f05] font-black text-[11px] sm:text-xs">
              {displayEyebrow}
            </span>
          </div>

          {/* Heading */}
          <h2 id="tp-digital-showcase-heading" className="tp-showcase-hero__title text-2xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl text-white">
            {firstPart} <span className="text-[#fe6f05] inline-block">{highlightPart}</span>
          </h2>

          {/* Concise Description */}
          <p className="tp-showcase-hero__desc text-sm sm:text-base font-medium leading-relaxed text-blue-100/90 max-w-xl">
            {displayDescription}
          </p>

          {/* Action Button & Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              to={displayLink}
              className="tp-showcase-hero__cta group relative inline-flex h-12 sm:h-13 items-center gap-2.5 overflow-hidden rounded-full px-7 sm:px-8 text-sm sm:text-base font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">{displayButtonName}</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Quick Micro-Trust Badge */}
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200/90">
              <ShieldCheck className="h-4 w-4 text-[#fe6f05]" />
              <span>{isIndo ? "Karya Terverifikasi & Akses Cepat" : "Verified Student Creations"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual */}
        <div className="tp-showcase-hero__visual w-full">
          {imageDataUrl ? (
            <div className="relative mx-auto max-w-md sm:max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-2xl backdrop-blur-sm p-2 transition-transform hover:scale-[1.01]">
              <img
                src={imageDataUrl}
                alt={displayTitle}
                className="h-auto max-h-[360px] w-full rounded-xl object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="tp-showcase-hero__grid-wrapper relative mx-auto w-full max-w-md lg:max-w-none">
              {/* Modern Responsive TP Preneurs Cards Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {digitalPillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.id}
                      className={`tp-showcase-card rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:translate-y-[-3px] ${
                        pillar.featured
                          ? "tp-showcase-card--featured"
                          : "border-white/10"
                      }`}
                    >
                      <div className="tp-showcase-card__icon-box mb-3 inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="tp-showcase-card__title text-xs sm:text-sm font-bold text-white">
                        {pillar.title}
                      </h3>
                      <p className="tp-showcase-card__subtitle text-[11px] sm:text-xs text-blue-200/80 mt-0.5 line-clamp-1">
                        {pillar.subtitle}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Badge Pill */}
              <div className="tp-showcase-hero__chip mt-3.5 inline-flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fe6f05]">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white">
                    {isIndo ? "Ekosistem Edupreneur & Inovasi" : "TP Preneurs Digital Hub"}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-orange-200">
                  {isIndo ? "Karya Kampus" : "Campus Creations"}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
