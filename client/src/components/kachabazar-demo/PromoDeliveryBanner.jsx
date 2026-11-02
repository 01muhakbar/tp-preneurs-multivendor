import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Rocket, CheckCircle2, Award } from "lucide-react";
import { resolveAssetUrl } from "../../lib/assetUrl.js";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const isExternalLink = (value) => /^https?:\/\//i.test(toText(value));

const isLegacyGroceryValue = (value) => {
  const str = toText(value).toLowerCase();
  return (
    str === "100% natural quality organic product" ||
    str.includes("see our latest discounted products from here") ||
    str.includes("category=breakfast")
  );
};

export default function PromoDeliveryBanner({
  subTitle = "",
  title = "",
  description = "",
  buttonName = "",
  buttonLink = "",
  imageDataUrl = "",
  isIndo = true,
}) {
  const rawSubTitle = toText(subTitle);
  const eyebrow = isLegacyGroceryValue(rawSubTitle) || !rawSubTitle
    ? (isIndo ? "Koleksi Eksklusif TP Preneurs" : "TP Preneurs Exclusive Collection")
    : rawSubTitle;

  const rawTitle = toText(title);
  const headline = isLegacyGroceryValue(rawTitle) || !rawTitle
    ? (isIndo ? "Karya Inovatif Mahasiswa & Edupreneur" : "Innovative Student & Edupreneur Creations")
    : rawTitle;

  const rawDesc = toText(description);
  const cleanedDesc = isLegacyGroceryValue(rawDesc)
    ? (isIndo ? "Dukung karya technopreneur muda dengan produk kreatif dan solusi terbaik." : "Empower young technopreneurs with curated creative and learning products.")
    : rawDesc;

  const rawBtn = toText(buttonName);
  const ctaLabel = isLegacyGroceryValue(rawBtn) || !rawBtn
    ? (isIndo ? "Jelajahi Produk" : "Explore Products")
    : rawBtn;

  const rawLink = toText(buttonLink);
  const ctaLink = isLegacyGroceryValue(rawLink) || !rawLink ? "/shop" : rawLink;

  const showCta = Boolean(ctaLabel) && Boolean(ctaLink);
  const ctaIsExternal = isExternalLink(ctaLink);
  const customImageSrc = resolveAssetUrl(imageDataUrl);

  return (
    <section
      aria-label="TP Preneurs Promotion"
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#034c85] via-[#023e6f] to-[#012d52] p-5 sm:p-8 lg:p-10 shadow-[0_20px_50px_-20px_rgba(3,76,133,0.4)] border border-[#034c85]/40 text-white"
    >
      {/* Background Ambient Glows in #034c85 and #fe6f05 */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#fe6f05]/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-[#034c85]/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Left Column: Concise Text Content */}
        <div className="flex flex-col justify-center space-y-4 lg:col-span-7">
          {eyebrow ? (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#fe6f05] shadow-[0_0_8px_#fe6f05]" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
                {eyebrow}
              </p>
            </div>
          ) : null}

          <h3 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-4xl text-white">
            {headline}
          </h3>

          {cleanedDesc ? (
            <p className="text-sm font-medium leading-relaxed text-blue-100/90 sm:text-base max-w-xl">
              {cleanedDesc}
            </p>
          ) : null}

          {showCta ? (
            <div className="pt-2">
              {ctaIsExternal ? (
                <a
                  href={ctaLink}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#fe6f05] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(254,111,5,0.35)] transition-all duration-300 hover:bg-[#e56202] hover:shadow-[0_12px_28px_rgba(254,111,5,0.5)] active:scale-95"
                >
                  <span>{ctaLabel}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              ) : (
                <Link
                  to={ctaLink}
                  className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#fe6f05] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(254,111,5,0.35)] transition-all duration-300 hover:bg-[#e56202] hover:shadow-[0_12px_28px_rgba(254,111,5,0.5)] active:scale-95"
                >
                  <span>{ctaLabel}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          ) : null}
        </div>

        {/* Right Column: Visual Showcase */}
        <div className="relative flex items-center justify-center lg:col-span-5">
          {customImageSrc ? (
            <div className="group relative w-full overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-2xl backdrop-blur-sm max-h-[260px]">
              <img
                src={customImageSrc}
                alt={headline}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          ) : (
            /* Branded TP Preneurs Innovation Showcase Graphic */
            <div className="relative w-full max-w-[420px] rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fe6f05] text-white shadow-md">
                    <Rocket className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-white">TP Preneurs</p>
                    <p className="text-[10px] text-blue-200">Technopreneur Hub</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fe6f05]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#fe6f05]">
                  <Sparkles className="h-3 w-3" />
                  Inovasi
                </span>
              </div>

              {/* Floating Highlight Elements */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm transition-all hover:bg-white/15">
                  <div className="flex items-center gap-2 text-orange-300">
                    <CheckCircle2 className="h-4 w-4 text-[#fe6f05]" />
                    <span className="text-xs font-bold text-white">Karya Asli</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-tight text-blue-100/80">Kreativitas & riset mahasiswa</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm transition-all hover:bg-white/15">
                  <div className="flex items-center gap-2 text-orange-300">
                    <Award className="h-4 w-4 text-[#fe6f05]" />
                    <span className="text-xs font-bold text-white">Terverifikasi</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-tight text-blue-100/80">Kualitas & siap bersaing</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-[#012d52]/60 px-3.5 py-2 border border-white/10">
                <span className="text-xs font-semibold text-blue-100">Ekosistem Kewirausahaan Mahasiswa</span>
                <span className="h-2 w-2 rounded-full bg-[#fe6f05] shadow-[0_0_6px_#fe6f05]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
