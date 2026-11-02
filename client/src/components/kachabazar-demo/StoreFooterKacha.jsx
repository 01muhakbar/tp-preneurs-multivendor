import {
  Facebook,
  Headphones,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Twitter,
  Youtube,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { CANONICAL_CLIENT_LOGO_URL, getCachedClientLogoUrl } from "../../lib/branding.js";
import { useTranslation } from "react-i18next";

const INDO_TRANSLATIONS = {
  "Company": "Perusahaan",
  "About Us": "Tentang Kami",
  "Contact Us": "Hubungi Kami",
  "Careers": "Karir",
  "Latest News": "Berita Terbaru",
  "Categories": "Kategori",
  "Products": "Katalog Produk",
  "Offers": "Promo & Penawaran",
  "Wishlist": "Favorit / Wishlist",
  "Fish & Meat": "Ikan & Daging",
  "Soft Drink": "Minuman Ringan",
  "Milk & Dairy": "Susu & Olahan",
  "Beauty & Health": "Kecantikan & Kesehatan",
  "Electronics": "Elektronik",
  "Fashion": "Fashion",
  "Grocery": "Kebutuhan Pokok",
  "Home & Living": "Rumah & Tempat Tinggal",
  "Beauty": "Kecantikan",
  "Sports": "Olahraga",
  "Books": "Buku",
  "Kids & Toys": "Anak & Mainan",
  "Health": "Kesehatan",
  "Automotive": "Otomotif",
  "Office": "Kantor",
  "Gift Ideas": "Ide Hadiah",
  "My Account": "Akun Saya",
  "Dashboard": "Dasbor",
  "My Orders": "Pesanan Saya",
  "Recent Orders": "Pesanan Terakhir",
  "Update Profile": "Perbarui Profil"
};

const tLabel = (label, isIndo) => {
  if (!isIndo) return label;
  return INDO_TRANSLATIONS[label] || label;
};

const sanitizeFooterDummyInfo = (field, fallback) => {
  const str = String(field || "").trim();
  if (
    !str ||
    str.includes("Lake Hestertown") ||
    str.includes("Andre Plain") ||
    str.includes("02.356.1666") ||
    str.includes("ccruidk@test.com") ||
    str.includes("6599887766") ||
    str.includes("565555")
  ) {
    return fallback;
  }
  return str;
};

const getDefaultFooter = (isIndo) => ({
  block1: {
    enabled: true,
    title: isIndo ? "Perusahaan" : "Company",
    links: [
      { label: isIndo ? "Tentang Kami" : "About Us", href: "/about-us" },
      { label: isIndo ? "Hubungi Kami" : "Contact Us", href: "/contact-us" },
      { label: isIndo ? "Katalog Produk" : "Products", href: "/shop" },
      { label: isIndo ? "Promo & Penawaran" : "Offers", href: "/offers" },
    ],
  },
  block2: {
    enabled: true,
    title: isIndo ? "Kategori" : "Categories",
    links: [
      { label: isIndo ? "Elektronik" : "Electronics", href: "/search?category=electronics" },
      { label: isIndo ? "Fashion" : "Fashion", href: "/search?category=fashion" },
      { label: isIndo ? "Buku" : "Books", href: "/search?category=books" },
      { label: isIndo ? "Kantor" : "Office", href: "/search?category=office" },
    ],
  },
  block3: {
    enabled: true,
    title: isIndo ? "Akun Saya" : "My Account",
    links: [
      { label: isIndo ? "Dasbor" : "Dashboard", href: "/user/dashboard" },
      { label: isIndo ? "Pesanan Saya" : "My Orders", href: "/user/my-orders" },
      { label: isIndo ? "Favorit / Wishlist" : "Wishlist", href: "/wishlist" },
      { label: isIndo ? "Perbarui Profil" : "Update Profile", href: "/user/update-profile" },
    ],
  },
  block4: {
    enabled: true,
    footerLogoDataUrl: "",
    address: "Kampus UNM Tidung, Jl. Tamalate 1, Makassar",
    phone: "+62 821-8866-824",
    email: "tppreneurs@gmail.com",
  },
  socialLinks: {
    enabled: true,
    facebook: "https://www.facebook.com/",
    twitter: "https://twitter.com/",
    instagram: "https://www.instagram.com/",
    youtube: "https://www.youtube.com/",
    whatsapp: "https://wa.me/628218866824",
  },
  paymentMethod: {
    enabled: true,
    imageDataUrl: "",
  },
  bottomContact: {
    enabled: true,
    contactNumber: "+62 821-8866-824",
  },
});

const SOCIAL_LINKS = [
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "twitter", label: "Twitter", Icon: Twitter },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "youtube", label: "YouTube", Icon: Youtube },
  { key: "pinterest", label: "Pinterest", Icon: Share2 },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
];

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

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeFooterLinks = (rawLinks, fallbackLinks, isIndo) => {
  const source = Array.isArray(rawLinks) && rawLinks.length > 0 ? rawLinks : fallbackLinks;
  return source
    .map((item, index) => {
      const sourceItem = isPlainObject(item) ? item : {};
      const fallbackItem = fallbackLinks[index] || { label: "", href: "" };
      let label = toText(sourceItem.label, fallbackItem.label);
      let href = toText(sourceItem.href, fallbackItem.href);

      // Clean dead '#' links and duplicate dashboard links
      if (href === "#") {
        href = fallbackItem.href !== "#" ? fallbackItem.href : "/shop";
      }
      if (index === 2 && href === "/user/dashboard" && fallbackItem.href === "/wishlist") {
        href = "/wishlist";
        label = isIndo ? "Favorit / Wishlist" : "Wishlist";
      }

      return {
        label: tLabel(label, isIndo),
        href,
      };
    })
    .filter((item) => item.label && item.href && item.href !== "#");
};

const normalizeFooterConfig = (rawFooter, isIndo) => {
  const DEFAULT_FOOTER = getDefaultFooter(isIndo);
  const source = isPlainObject(rawFooter) ? rawFooter : {};
  const block1 = isPlainObject(source.block1) ? source.block1 : {};
  const block2 = isPlainObject(source.block2) ? source.block2 : {};
  const block3 = isPlainObject(source.block3) ? source.block3 : {};
  const block4 = isPlainObject(source.block4) ? source.block4 : {};
  const socialLinks = isPlainObject(source.socialLinks) ? source.socialLinks : {};
  const paymentMethod = isPlainObject(source.paymentMethod) ? source.paymentMethod : {};
  const bottomContact = isPlainObject(source.bottomContact) ? source.bottomContact : {};

  return {
    block1: {
      enabled: toBool(block1.enabled, DEFAULT_FOOTER.block1.enabled),
      title: tLabel(toText(block1.title, DEFAULT_FOOTER.block1.title), isIndo),
      links: normalizeFooterLinks(block1.links, DEFAULT_FOOTER.block1.links, isIndo),
    },
    block2: {
      enabled: toBool(block2.enabled, DEFAULT_FOOTER.block2.enabled),
      title: tLabel(toText(block2.title, DEFAULT_FOOTER.block2.title), isIndo),
      links: normalizeFooterLinks(block2.links, DEFAULT_FOOTER.block2.links, isIndo),
    },
    block3: {
      enabled: toBool(block3.enabled, DEFAULT_FOOTER.block3.enabled),
      title: tLabel(toText(block3.title, DEFAULT_FOOTER.block3.title), isIndo),
      links: normalizeFooterLinks(block3.links, DEFAULT_FOOTER.block3.links, isIndo),
    },
    block4: {
      enabled: toBool(block4.enabled, DEFAULT_FOOTER.block4.enabled),
      footerLogoDataUrl: toText(block4.footerLogoDataUrl),
      address: sanitizeFooterDummyInfo(toText(block4.address), DEFAULT_FOOTER.block4.address),
      phone: sanitizeFooterDummyInfo(toText(block4.phone), DEFAULT_FOOTER.block4.phone),
      email: sanitizeFooterDummyInfo(toText(block4.email), DEFAULT_FOOTER.block4.email),
    },
    socialLinks: {
      ...DEFAULT_FOOTER.socialLinks,
      ...socialLinks,
      enabled: toBool(socialLinks.enabled, DEFAULT_FOOTER.socialLinks.enabled),
    },
    paymentMethod: {
      ...DEFAULT_FOOTER.paymentMethod,
      ...paymentMethod,
      enabled: toBool(paymentMethod.enabled, DEFAULT_FOOTER.paymentMethod.enabled),
      imageDataUrl: toText(paymentMethod.imageDataUrl),
    },
    bottomContact: {
      enabled: toBool(bottomContact.enabled, DEFAULT_FOOTER.bottomContact.enabled),
      contactNumber: sanitizeFooterDummyInfo(
        toText(bottomContact.contactNumber),
        DEFAULT_FOOTER.bottomContact.contactNumber
      ),
    },
  };
};

const isInternalHref = (href) => /^\/(?!\/)/.test(String(href || "").trim());

function FooterLink({ href, children }) {
  const className =
    "text-sm font-semibold text-[#31486e] transition hover:text-[#fe6f05] dark:text-slate-300 dark:hover:text-orange-400";

  if (isInternalHref(href)) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

function FooterLinkBlock({ title, links }) {
  if (!links.length) return null;

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#034c85] dark:text-sky-300 flex items-center gap-1.5">
        <span>{title}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#fe6f05] inline-block" />
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={`${link.label}-${link.href}`}>
            <FooterLink href={link.href}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FallbackBrand({ brandingName }) {
  return (
    <Link
      to="/"
      className="flex h-[42px] min-w-[138px] items-center gap-2.5 sm:h-[48px] sm:min-w-[164px]"
      aria-label={`${brandingName} home`}
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#034c85] to-[#023157] shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor">
          <path
            d="M9 18h6m-4 4h2m-5-8.5a6 6 0 1 1 8 0c-.8 1-1.5 2-1.5 3.5h-5c0-1.5-.7-2.5-1.5-3.5Z"
            stroke="#fe6f05"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="leading-none">
        <p className="text-[20px] font-black tracking-tight text-[#034c85] dark:text-white">
          TP <span className="text-[#fe6f05]">PRENEURS</span>
        </p>
      </div>
    </Link>
  );
}

export default function StoreFooterKacha({
  footerConfig,
  brandingLogoUrl = "",
  brandingName = "TP Preneurs",
}) {
  const [imgError, setImgError] = useState(false);
  const { i18n } = useTranslation();
  const isIndo = i18n.language === "id" || i18n.language === "id-ID" || i18n.language?.startsWith("id") || (typeof window !== "undefined" && localStorage.getItem("store_language") === "Indonesia");
  const footer = normalizeFooterConfig(footerConfig, isIndo);
  const DEFAULT_FOOTER = getDefaultFooter(isIndo);

  const canonicalUrl = resolveAssetUrl(getCachedClientLogoUrl() || CANONICAL_CLIENT_LOGO_URL);
  const configuredLogo = resolveAssetUrl(footer.block4.footerLogoDataUrl) || resolveAssetUrl(brandingLogoUrl);
  const primarySrc = configuredLogo || canonicalUrl;
  const footerLogoSrc = !imgError ? primarySrc : (primarySrc !== canonicalUrl ? canonicalUrl : null);

  const paymentMethodSrc = resolveAssetUrl(footer.paymentMethod.imageDataUrl);
  const socialItems = SOCIAL_LINKS.filter(({ key }) => footer.socialLinks[key]);

  return (
    <footer className="bg-transparent px-4 pb-6 pt-0 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1232px] overflow-hidden rounded-[28px] border border-[#034c85]/10 bg-white shadow-[0_18px_42px_rgba(3,76,133,0.07)] dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-10 border-b border-[#034c85]/10 px-6 py-8 dark:border-slate-800 md:grid-cols-2 xl:grid-cols-[1.35fr_0.75fr_0.8fr_1.3fr] xl:px-10">
          {footer.block4.enabled ? (
            <section className="space-y-4">
              {footerLogoSrc ? (
                <Link
                  to="/"
                  className="flex h-[44px] w-auto max-w-[190px] items-center sm:h-[50px] sm:max-w-[240px]"
                  aria-label={`${brandingName} home`}
                >
                  <img
                    src={footerLogoSrc}
                    alt={`${brandingName} footer logo`}
                    onError={() => {
                      if (!imgError && primarySrc !== canonicalUrl) {
                        setImgError(true);
                      } else {
                        setImgError(true);
                      }
                    }}
                    className="h-full w-auto max-w-full object-contain object-left"
                  />
                </Link>
              ) : (
                <FallbackBrand brandingName={brandingName} />
              )}
              <div className="space-y-2.5 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                {footer.block4.address ? (
                  <p className="flex items-start gap-2.5">
                    <MapPin className="mt-1 h-4.5 w-4.5 shrink-0 text-[#034c85] dark:text-sky-400" />
                    <span>{footer.block4.address}</span>
                  </p>
                ) : null}
                {footer.block4.phone ? (
                  <p className="flex items-center gap-2.5">
                    <Phone className="h-4.5 w-4.5 shrink-0 text-[#034c85] dark:text-sky-400" />
                    <a
                      href="https://wa.me/628218866824"
                      target="_blank"
                      rel="noreferrer"
                      className="transition hover:text-[#fe6f05]"
                    >
                      {footer.block4.phone}
                    </a>
                  </p>
                ) : null}
                {footer.block4.email ? (
                  <p className="flex items-center gap-2.5">
                    <Mail className="h-4.5 w-4.5 shrink-0 text-[#034c85] dark:text-sky-400" />
                    <a
                      href={`mailto:${footer.block4.email}`}
                      className="transition hover:text-[#fe6f05]"
                    >
                      {footer.block4.email}
                    </a>
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {footer.block1.enabled ? (
            <FooterLinkBlock title={footer.block1.title} links={footer.block1.links} />
          ) : null}
          {footer.block3.enabled ? (
            <FooterLinkBlock title={footer.block3.title} links={footer.block3.links} />
          ) : null}

          <section className="space-y-6">
            {footer.socialLinks.enabled && socialItems.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#034c85] dark:text-sky-300 flex items-center gap-1.5">
                  <span>{isIndo ? "Ikuti Kami" : "Follow Us"}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#fe6f05] inline-block" />
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {socialItems.map(({ key, label, Icon }) => (
                    <a
                      key={key}
                      href={footer.socialLinks[key]}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#034c85]/15 bg-white text-[#034c85] transition-all hover:scale-105 hover:border-[#fe6f05] hover:bg-[#fe6f05] hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-[#fe6f05]"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {footer.bottomContact.enabled && footer.bottomContact.contactNumber ? (
              <a
                href={
                  footer.bottomContact.contactNumber.includes("wa.me")
                    ? footer.bottomContact.contactNumber
                    : `https://wa.me/${footer.bottomContact.contactNumber.replace(/[^0-9]/g, "") || "628218866824"}`
                }
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3.5 rounded-2xl border border-[#034c85]/15 bg-slate-50/80 p-3 transition hover:border-[#fe6f05]/40 hover:bg-[#fe6f05]/5 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-[#fe6f05]/40"
              >
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#034c85] text-white shadow-md shadow-[#034c85]/20 transition-colors group-hover:bg-[#fe6f05]">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#fe6f05]">
                    {isIndo ? "Butuh Bantuan?" : "Need Help?"}
                  </p>
                  <p className="text-base font-extrabold text-[#034c85] transition-colors group-hover:text-[#fe6f05] dark:text-sky-300">
                    {footer.bottomContact.contactNumber}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {isIndo ? "Chat WhatsApp 24/7" : "WhatsApp Chat 24/7"}
                  </p>
                </div>
              </a>
            ) : null}

            {footer.paymentMethod.enabled && paymentMethodSrc ? (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#034c85] dark:text-sky-300">
                  {isIndo ? "Metode Pembayaran" : "Payment Methods"}
                </h3>
                <img
                  src={paymentMethodSrc}
                  alt={isIndo ? "Metode pembayaran" : "Payment methods"}
                  className="max-h-8 max-w-full rounded-lg object-contain object-left"
                  loading="lazy"
                />
              </div>
            ) : null}
          </section>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm md:flex-row md:items-center md:justify-between xl:px-10">
          <p>© 2026 TP Preneurs. {isIndo ? "Hak cipta dilindungi." : "All rights reserved."}</p>
          <div className="flex flex-wrap gap-4 md:gap-6">
            <Link to="/privacy-policy" className="transition hover:text-[#fe6f05]">
              {isIndo ? "Kebijakan Privasi" : "Privacy Policy"}
            </Link>
            <Link to="/terms-and-conditions" className="transition hover:text-[#fe6f05]">
              {isIndo ? "Syarat & Ketentuan" : "Terms & Conditions"}
            </Link>
            <Link to="/refund-policy" className="transition hover:text-[#fe6f05]">
              {isIndo ? "Kebijakan Pengembalian" : "Refund Policy"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
