import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Mail,
  MapPin,
  PhoneCall,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { getStoreCustomization } from "../../api/public/storeCustomizationPublic.ts";
import { UiEmptyState, UiErrorState } from "../../components/primitives/state/index.js";

const BRAND_BLUE = "#034c85";
const BRAND_ORANGE = "#fe6f05";

const getStoreLang = (i18n) => {
  const activeLanguage = String(i18n?.language || "").toLowerCase();
  const storedLanguage =
    typeof window !== "undefined" ? String(localStorage.getItem("store_language") || "") : "";
  const normalizedStored = storedLanguage.toLowerCase();
  return activeLanguage.startsWith("id") || normalizedStored === "indonesia" ? "id" : "en";
};

const DEFAULT_CONTACT_US_DISABLED = {
  pageHeader: {
    enabled: false,
    backgroundImageDataUrl: "",
    pageTitle: "",
  },
  emailBox: {
    enabled: false,
    title: "",
    email: "",
    text: "",
  },
  callBox: {
    enabled: false,
    title: "",
    phone: "",
    text: "",
  },
  addressBox: {
    enabled: false,
    title: "",
    address: "",
  },
  middleLeftColumn: {
    enabled: false,
    imageDataUrl: "",
  },
  contactForm: {
    enabled: false,
    title: "",
    description: "",
  },
};

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
    if (normalized) return normalized;
  }
  return "";
};

const hasText = (value) => String(value ?? "").trim().length > 0;

const isDisplayEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());

const toTelHref = (value) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  const digits = normalized.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
};

const isKachabazarJargon = (value) => {
  const normalized = String(value ?? "").toLowerCase();
  return (
    normalized.includes("kachabazar") ||
    normalized.includes("process-centric total linkage") ||
    normalized.includes("clicks-and-mortar ministerate") ||
    normalized.includes("plagiarized strategic users") ||
    normalized.includes("boho one, bridge street west")
  );
};

const normalizeContactUs = (raw, isIndonesian = false) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const pageHeader =
    source.pageHeader && typeof source.pageHeader === "object" ? source.pageHeader : {};
  const emailBox = source.emailBox && typeof source.emailBox === "object" ? source.emailBox : {};
  const callBox = source.callBox && typeof source.callBox === "object" ? source.callBox : {};
  const addressBox =
    source.addressBox && typeof source.addressBox === "object" ? source.addressBox : {};
  const middleLeftColumn =
    source.middleLeftColumn && typeof source.middleLeftColumn === "object"
      ? source.middleLeftColumn
      : {};
  const contactForm =
    source.contactForm && typeof source.contactForm === "object" ? source.contactForm : {};

  // Clean email
  let cleanEmail = toText(emailBox.email, DEFAULT_CONTACT_US_DISABLED.emailBox.email);
  if (cleanEmail.toLowerCase().includes("kachabazar.com")) {
    cleanEmail = "support@tppreneurs.com";
  }
  let cleanEmailText = toText(emailBox.text, DEFAULT_CONTACT_US_DISABLED.emailBox.text);
  if (isKachabazarJargon(cleanEmailText)) {
    cleanEmailText = isIndonesian ? "Respon cepat 1x24 jam" : "Fast response within 24h";
  }

  // Clean phone
  let cleanPhone = toText(callBox.phone, DEFAULT_CONTACT_US_DISABLED.callBox.phone);
  if (cleanPhone === "029-00124667") {
    cleanPhone = "+62 811-444-2026";
  }
  let cleanCallText = toText(callBox.text, DEFAULT_CONTACT_US_DISABLED.callBox.text);
  if (isKachabazarJargon(cleanCallText)) {
    cleanCallText = isIndonesian ? "Senin - Jumat, 09:00 - 17:00 WITA" : "Mon - Fri, 09:00 - 17:00 WITA";
  }

  // Clean address
  let cleanAddress = toText(addressBox.address, DEFAULT_CONTACT_US_DISABLED.addressBox.address);
  if (isKachabazarJargon(cleanAddress)) {
    cleanAddress = "Jl. Tamalate No.1, Bonto Makkio, Kec. Rappocini, Kota Makassar, Sulawesi Selatan 90222";
  }

  // Clean form copy
  let cleanFormTitle = toText(contactForm.title, DEFAULT_CONTACT_US_DISABLED.contactForm.title);
  if (isKachabazarJargon(cleanFormTitle) || cleanFormTitle === "For any support just send your query") {
    cleanFormTitle = isIndonesian ? "Kirim Pesan" : "Send a Message";
  }
  let cleanFormDescription = toText(
    contactForm.description,
    DEFAULT_CONTACT_US_DISABLED.contactForm.description
  );
  if (isKachabazarJargon(cleanFormDescription)) {
    cleanFormDescription = isIndonesian
      ? "Silakan kirimkan pertanyaan atau pesan Anda. Tim kami akan segera merespons."
      : "Have questions or need assistance? Send us a message and we'll reply shortly.";
  }

  return {
    pageHeader: {
      enabled: toBool(pageHeader.enabled, DEFAULT_CONTACT_US_DISABLED.pageHeader.enabled),
      backgroundImageDataUrl: toImageDataUrl(
        pageHeader.backgroundImageDataUrl,
        pageHeader.backgroundImage,
        pageHeader.imageDataUrl,
        pageHeader.image
      ),
      pageTitle: toText(
        pageHeader.pageTitle,
        isIndonesian ? "Hubungi Kami" : "Contact Us"
      ),
    },
    emailBox: {
      enabled: toBool(emailBox.enabled, DEFAULT_CONTACT_US_DISABLED.emailBox.enabled),
      title: toText(emailBox.title, isIndonesian ? "Email" : "Email Us"),
      email: cleanEmail,
      text: cleanEmailText,
    },
    callBox: {
      enabled: toBool(callBox.enabled, DEFAULT_CONTACT_US_DISABLED.callBox.enabled),
      title: toText(callBox.title, isIndonesian ? "Telepon" : "Call Us"),
      phone: cleanPhone,
      text: cleanCallText,
    },
    addressBox: {
      enabled: toBool(addressBox.enabled, DEFAULT_CONTACT_US_DISABLED.addressBox.enabled),
      title: toText(addressBox.title, isIndonesian ? "Lokasi" : "Location"),
      address: cleanAddress,
    },
    middleLeftColumn: {
      enabled: toBool(
        middleLeftColumn.enabled,
        DEFAULT_CONTACT_US_DISABLED.middleLeftColumn.enabled
      ),
      imageDataUrl: toImageDataUrl(
        middleLeftColumn.imageDataUrl,
        middleLeftColumn.image
      ),
    },
    contactForm: {
      enabled: toBool(contactForm.enabled, DEFAULT_CONTACT_US_DISABLED.contactForm.enabled),
      title: cleanFormTitle,
      description: cleanFormDescription,
    },
  };
};

function ContactUsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-44 sm:h-52 w-full animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`contact-skeleton-card-${index}`}
            className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="hidden lg:block lg:col-span-5 h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="lg:col-span-7 h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function StoreContactUsPage() {
  const { i18n } = useTranslation();
  const lang = getStoreLang(i18n);
  const isIndonesian = lang === "id";

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactQuery = useQuery({
    queryKey: ["store-customization", "contact-us", lang],
    queryFn: () => getStoreCustomization({ lang, include: "contactUs" }),
    staleTime: 60_000,
  });

  const contactUsRaw = contactQuery.data?.customization?.contactUs;
  const contactUs = useMemo(
    () => normalizeContactUs(contactUsRaw, isIndonesian),
    [contactUsRaw, isIndonesian]
  );

  const cards = useMemo(
    () => [
      contactUs.emailBox.enabled &&
      (hasText(contactUs.emailBox.title) ||
        hasText(contactUs.emailBox.email) ||
        hasText(contactUs.emailBox.text))
        ? {
            key: "email",
            title: contactUs.emailBox.title,
            primary: hasText(contactUs.emailBox.email) ? contactUs.emailBox.email : "",
            text: contactUs.emailBox.text,
            href: isDisplayEmail(contactUs.emailBox.email)
              ? `mailto:${contactUs.emailBox.email}`
              : "",
            actionLabel: isIndonesian ? "Kirim Email" : "Send Email",
            Icon: Mail,
          }
        : null,
      contactUs.callBox.enabled &&
      (hasText(contactUs.callBox.title) ||
        hasText(contactUs.callBox.phone) ||
        hasText(contactUs.callBox.text))
        ? {
            key: "call",
            title: contactUs.callBox.title,
            primary: hasText(contactUs.callBox.phone) ? contactUs.callBox.phone : "",
            text: contactUs.callBox.text,
            href: toTelHref(contactUs.callBox.phone),
            actionLabel: isIndonesian ? "Hubungi Sekarang" : "Call Now",
            Icon: PhoneCall,
          }
        : null,
      contactUs.addressBox.enabled &&
      (hasText(contactUs.addressBox.title) || hasText(contactUs.addressBox.address))
        ? {
            key: "address",
            title: contactUs.addressBox.title,
            primary: contactUs.addressBox.address,
            text: "",
            href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              contactUs.addressBox.address
            )}`,
            actionLabel: isIndonesian ? "Buka di Google Maps" : "View on Google Maps",
            Icon: MapPin,
          }
        : null,
    ].filter(Boolean),
    [
      contactUs.addressBox.address,
      contactUs.addressBox.enabled,
      contactUs.addressBox.title,
      contactUs.callBox.enabled,
      contactUs.callBox.phone,
      contactUs.callBox.text,
      contactUs.callBox.title,
      contactUs.emailBox.email,
      contactUs.emailBox.enabled,
      contactUs.emailBox.text,
      contactUs.emailBox.title,
      isIndonesian,
    ]
  );

  const hasAnyEnabledSection =
    contactUs.pageHeader.enabled ||
    cards.length > 0 ||
    (contactUs.middleLeftColumn.enabled && hasText(contactUs.middleLeftColumn.imageDataUrl)) ||
    contactUs.contactForm.enabled;

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !email || !message) {
      setFormError(
        isIndonesian
          ? "Mohon lengkapi semua kolom yang wajib diisi."
          : "Please complete all required fields."
      );
      return;
    }
    if (!isEmailValid) {
      setFormError(
        isIndonesian
          ? "Format email yang dimasukkan tidak valid."
          : "Please enter a valid email address."
      );
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setForm({ name: "", email: "", message: "" });
      setFormSuccess(
        isIndonesian
          ? "Terima kasih! Pesan Anda telah kami terima dengan baik."
          : "Thank you! We have received your message."
      );
    }, 600);
  };

  if (contactQuery.isLoading) return <ContactUsSkeleton />;

  if (contactQuery.isError) {
    const errorMessage =
      contactQuery.error?.response?.data?.message ||
      contactQuery.error?.message ||
      (isIndonesian ? "Gagal memuat halaman kontak." : "Failed to load contact page.");
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <UiErrorState
          title={isIndonesian ? "Gagal Memuat Kontak" : "Failed to load Contact Us"}
          message={errorMessage}
          onRetry={() => contactQuery.refetch()}
        />
      </div>
    );
  }

  if (!contactUsRaw) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <UiEmptyState
          title={isIndonesian ? "Konten kontak belum dikonfigurasi." : "Contact content is not configured yet."}
          description={isIndonesian ? "Silakan periksa kembali nanti." : "Please check back later."}
        />
      </div>
    );
  }

  if (!hasAnyEnabledSection) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <UiEmptyState
          title={isIndonesian ? "Halaman kontak sedang dinonaktifkan." : "Contact page is disabled."}
          description={isIndonesian ? "Semua blok kontak saat ini dimatikan oleh admin." : "All contact blocks are currently disabled."}
        />
      </div>
    );
  }

  const hasHeroBackground = Boolean(contactUs.pageHeader.backgroundImageDataUrl);
  const showMiddleLeftImage =
    contactUs.middleLeftColumn.enabled && Boolean(contactUs.middleLeftColumn.imageDataUrl);
  const showContactForm = contactUs.contactForm.enabled;
  const hasContactFormHeading =
    hasText(contactUs.contactForm.title) || hasText(contactUs.contactForm.description);

  return (
    <div
      className="min-h-screen bg-slate-50/60 pb-16 text-slate-900 dark:bg-[#07121e] dark:text-slate-100"
      style={{
        "--brand-blue": BRAND_BLUE,
        "--brand-orange": BRAND_ORANGE,
      }}
    >
      {/* 1. HERO HEADER */}
      {contactUs.pageHeader.enabled ? (
        <section
          className="relative overflow-hidden border-b border-slate-200/80 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#034c85]/15 via-transparent to-transparent dark:border-white/10 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-[#034c85]/30 dark:via-[#07121e] dark:to-[#07121e]"
          style={
            hasHeroBackground
              ? {
                  backgroundImage: `linear-gradient(135deg, rgba(3,76,133,0.92), rgba(7,18,30,0.85)), url(${contactUs.pageHeader.backgroundImageDataUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {/* Subtle Decorative Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-[#fe6f05]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-[#034c85]/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#034c85]/20 bg-white/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#034c85] shadow-xs backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-orange-300">
              <Sparkles className="h-3.5 w-3.5 text-[#fe6f05]" />
              <span>{isIndonesian ? "Pusat Bantuan & Kontak" : "Support & Help Center"}</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
              {contactUs.pageHeader.pageTitle}
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
              {isIndonesian
                ? "Hubungi tim kami untuk konsultasi, kerja sama, dan bantuan layanan TP Preneurs."
                : "Reach out to our team for questions, partnerships, or customer assistance."}
            </p>
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-7xl space-y-10 px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        {/* 2. CONTACT INFO CARDS */}
        {cards.length > 0 ? (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.Icon;
              return (
                <article
                  key={card.key}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#fe6f05]/40 hover:shadow-xl hover:shadow-[#034c85]/10 dark:border-white/10 dark:bg-slate-900/70"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#034c85]/10 text-[#034c85] transition-colors duration-300 group-hover:bg-[#fe6f05]/15 group-hover:text-[#fe6f05] dark:bg-white/10 dark:text-orange-400">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#fe6f05]">
                        {card.title}
                      </span>
                    </div>

                    <div>
                      {hasText(card.primary) ? (
                        card.href ? (
                          <a
                            href={card.href}
                            target={card.key === "address" ? "_blank" : undefined}
                            rel={card.key === "address" ? "noopener noreferrer" : undefined}
                            className="text-base font-bold text-slate-900 transition-colors hover:text-[#fe6f05] dark:text-white dark:hover:text-[#fe6f05]"
                          >
                            {card.primary}
                          </a>
                        ) : (
                          <p className="text-base font-bold text-slate-900 dark:text-white">
                            {card.primary}
                          </p>
                        )
                      ) : null}

                      {hasText(card.text) ? (
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {card.text}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {card.href ? (
                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5">
                      <a
                        href={card.href}
                        target={card.key === "address" ? "_blank" : undefined}
                        rel={card.key === "address" ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#034c85] transition-colors hover:text-[#fe6f05] dark:text-slate-300 dark:hover:text-[#fe6f05]"
                      >
                        <span>{card.actionLabel}</span>
                        {card.key === "address" ? (
                          <ExternalLink className="h-3.5 w-3.5" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </a>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        ) : null}

        {/* 3. CONTACT FORM & MIDDLE LEFT IMAGE */}
        {showMiddleLeftImage || showContactForm ? (
          <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 lg:p-10 dark:border-white/10 dark:bg-slate-900/70">
            <div
              className={`grid gap-8 lg:gap-12 items-center ${
                showMiddleLeftImage && showContactForm
                  ? "lg:grid-cols-12"
                  : "max-w-2xl mx-auto"
              }`}
            >
              {/* Optional Middle Left Column Graphic */}
              {showMiddleLeftImage ? (
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-md dark:border-white/10 dark:bg-slate-800">
                    <img
                      src={contactUs.middleLeftColumn.imageDataUrl}
                      alt={isIndonesian ? "Kontak TP Preneurs" : "Contact TP Preneurs"}
                      className="h-full max-h-[460px] w-full object-cover"
                    />
                  </div>
                </div>
              ) : null}

              {/* Contact Form Block */}
              {showContactForm ? (
                <div
                  className={
                    showMiddleLeftImage ? "lg:col-span-7 space-y-6" : "w-full space-y-6"
                  }
                >
                  {hasContactFormHeading ? (
                    <div>
                      {hasText(contactUs.contactForm.title) ? (
                        <h2 className="text-2xl font-extrabold tracking-tight text-[#034c85] sm:text-3xl dark:text-white">
                          {contactUs.contactForm.title}
                        </h2>
                      ) : null}
                      {hasText(contactUs.contactForm.description) ? (
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {contactUs.contactForm.description}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {isIndonesian ? "Nama Lengkap" : "Your Name"}{" "}
                        <span className="text-[#fe6f05]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isIndonesian ? "Masukkan nama Anda" : "Enter your name"}
                        value={form.name}
                        onChange={(event) => onChange("name", event.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#fe6f05] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:border-[#fe6f05] dark:focus:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {isIndonesian ? "Alamat Email" : "Your Email"}{" "}
                        <span className="text-[#fe6f05]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder={isIndonesian ? "contoh@email.com" : "example@email.com"}
                        value={form.email}
                        onChange={(event) => onChange("email", event.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#fe6f05] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:border-[#fe6f05] dark:focus:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {isIndonesian ? "Pesan atau Pertanyaan" : "Message"}{" "}
                        <span className="text-[#fe6f05]">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder={
                          isIndonesian
                            ? "Tuliskan pesan atau pertanyaan Anda di sini..."
                            : "Write your message or inquiry here..."
                        }
                        value={form.message}
                        onChange={(event) => onChange("message", event.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#fe6f05] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034c85]/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:border-[#fe6f05] dark:focus:bg-slate-800"
                      />
                    </div>

                    {formError ? (
                      <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                        <span>{formError}</span>
                      </div>
                    ) : null}

                    {formSuccess ? (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{formSuccess}</span>
                      </div>
                    ) : null}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#034c85] px-7 text-sm font-bold text-white shadow-md shadow-[#034c85]/20 transition-all hover:bg-[#023964] hover:shadow-lg hover:shadow-[#fe6f05]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                            <span>{isIndonesian ? "Mengirimkan..." : "Sending..."}</span>
                          </>
                        ) : (
                          <>
                            <span>{isIndonesian ? "Kirim Pesan" : "Send Message"}</span>
                            <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-orange-300" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
