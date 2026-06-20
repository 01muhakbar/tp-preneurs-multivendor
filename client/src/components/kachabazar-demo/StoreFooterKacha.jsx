import {
  Facebook,
  Headphones,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";
import { Link } from "react-router-dom";
import { resolveAssetUrl } from "../../lib/assetUrl.js";

const DEFAULT_FOOTER = {
  block1: {
    enabled: true,
    title: "Company",
    links: [
      { label: "About Us", href: "/about-us" },
      { label: "Contact Us", href: "/contact-us" },
      { label: "Careers", href: "#" },
      { label: "Latest News", href: "#" },
    ],
  },
  block2: {
    enabled: true,
    title: "Categories",
    links: [
      { label: "Fish & Meat", href: "/search?category=fish-meat&page=1" },
      { label: "Soft Drink", href: "/search?category=drinks&page=1" },
      { label: "Milk & Dairy", href: "/search?category=milk-dairy&page=1" },
      { label: "Beauty & Health", href: "/search?category=beauty-health&page=1" },
    ],
  },
  block3: {
    enabled: true,
    title: "My Account",
    links: [
      { label: "Dashboard", href: "/user/dashboard" },
      { label: "My Orders", href: "/user/my-orders" },
      { label: "Recent Orders", href: "/user/dashboard" },
      { label: "Update Profile", href: "/user/update-profile" },
    ],
  },
  block4: {
    enabled: true,
    footerLogoDataUrl: "",
    address: "987 Andre Plain Suite High Street 838, Lake Hestertown, USA",
    phone: "02.356.1666",
    email: "cruide@test.com",
  },
  socialLinks: {
    enabled: true,
    facebook: "https://www.facebook.com/",
    twitter: "https://twitter.com/",
    instagram: "https://www.instagram.com/",
    youtube: "https://www.youtube.com/",
    linkedin: "https://www.linkedin.com/",
    whatsapp: "https://web.whatsapp.com/",
  },
  bottomContact: {
    enabled: true,
    contactNumber: "+65 9988 7766",
  },
};

const SOCIAL_LINKS = [
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "twitter", label: "X", Icon: Twitter },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "youtube", label: "YouTube", Icon: Youtube },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
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

const normalizeFooterLinks = (rawLinks, fallbackLinks) => {
  const source = Array.isArray(rawLinks) ? rawLinks : fallbackLinks;
  return source
    .map((item, index) => {
      const sourceItem = isPlainObject(item) ? item : {};
      const fallbackItem = fallbackLinks[index] || { label: "", href: "" };
      return {
        label: toText(sourceItem.label, fallbackItem.label),
        href: toText(sourceItem.href, fallbackItem.href),
      };
    })
    .filter((item) => item.label && item.href);
};

const normalizeFooterConfig = (rawFooter) => {
  const source = isPlainObject(rawFooter) ? rawFooter : {};
  const block1 = isPlainObject(source.block1) ? source.block1 : {};
  const block2 = isPlainObject(source.block2) ? source.block2 : {};
  const block3 = isPlainObject(source.block3) ? source.block3 : {};
  const block4 = isPlainObject(source.block4) ? source.block4 : {};
  const socialLinks = isPlainObject(source.socialLinks) ? source.socialLinks : {};
  const bottomContact = isPlainObject(source.bottomContact) ? source.bottomContact : {};

  return {
    block1: {
      enabled: toBool(block1.enabled, DEFAULT_FOOTER.block1.enabled),
      title: toText(block1.title, DEFAULT_FOOTER.block1.title),
      links: normalizeFooterLinks(block1.links, DEFAULT_FOOTER.block1.links),
    },
    block2: {
      enabled: toBool(block2.enabled, DEFAULT_FOOTER.block2.enabled),
      title: toText(block2.title, DEFAULT_FOOTER.block2.title),
      links: normalizeFooterLinks(block2.links, DEFAULT_FOOTER.block2.links),
    },
    block3: {
      enabled: toBool(block3.enabled, DEFAULT_FOOTER.block3.enabled),
      title: toText(block3.title, DEFAULT_FOOTER.block3.title),
      links: normalizeFooterLinks(block3.links, DEFAULT_FOOTER.block3.links),
    },
    block4: {
      enabled: toBool(block4.enabled, DEFAULT_FOOTER.block4.enabled),
      footerLogoDataUrl: toText(block4.footerLogoDataUrl),
      address: toText(block4.address, DEFAULT_FOOTER.block4.address),
      phone: toText(block4.phone, DEFAULT_FOOTER.block4.phone),
      email: toText(block4.email, DEFAULT_FOOTER.block4.email),
    },
    socialLinks: {
      ...DEFAULT_FOOTER.socialLinks,
      ...socialLinks,
      enabled: toBool(socialLinks.enabled, DEFAULT_FOOTER.socialLinks.enabled),
    },
    bottomContact: {
      enabled: toBool(bottomContact.enabled, DEFAULT_FOOTER.bottomContact.enabled),
      contactNumber: toText(
        bottomContact.contactNumber,
        DEFAULT_FOOTER.bottomContact.contactNumber
      ),
    },
  };
};

const isInternalHref = (href) => /^\/(?!\/)/.test(String(href || "").trim());

function FooterLink({ href, children }) {
  const className =
    "text-sm font-semibold text-[#31486e] transition hover:text-[var(--tp-accent)] dark:text-slate-300 dark:hover:text-orange-300";

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
    <section className="space-y-5">
      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tp-primary)] dark:text-sky-300">
        {title}
      </h3>
      <ul className="space-y-3">
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
      <div className="relative h-11 w-[52px] shrink-0">
        <div className="absolute left-0 top-1.5 h-8 w-9 rounded-r-[15px] rounded-tl-lg bg-[var(--tp-primary)]" />
        <div className="absolute left-6 top-0 h-11 w-4 rounded-full bg-[var(--tp-primary)]" />
        <div className="absolute right-0 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-[var(--tp-accent)]">
          <div className="h-4 w-4 rounded-full bg-white" />
        </div>
      </div>
      <div className="leading-none">
        <p className="text-[21px] font-black tracking-tight text-[var(--tp-primary)] dark:text-white">
          TP <span className="text-[var(--tp-accent)]">Preneurs</span>
        </p>
        <p className="mt-1 text-[8px] font-black uppercase tracking-[0.16em] text-[var(--tp-primary)] dark:text-sky-300">
          The Preneurs Power Hub
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
  const footer = normalizeFooterConfig(footerConfig);
  const footerLogoSrc =
    resolveAssetUrl(brandingLogoUrl) || resolveAssetUrl(footer.block4.footerLogoDataUrl);
  const socialItems = SOCIAL_LINKS.filter(({ key }) => footer.socialLinks[key]);

  return (
    <footer className="bg-[#f7fbff] px-4 pb-6 pt-0 dark:bg-slate-950 sm:px-6">
      <div className="mx-auto max-w-[1540px] overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_18px_42px_rgba(var(--tp-primary-rgb)/0.10)] dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-10 border-b border-[#dbe6f3] px-6 py-8 dark:border-slate-800 md:grid-cols-2 xl:grid-cols-[1.35fr_0.7fr_0.7fr_0.8fr_1.35fr] xl:px-10">
          {footer.block4.enabled ? (
            <section className="space-y-5">
              {footerLogoSrc ? (
                <Link
                  to="/"
                  className="flex h-[42px] w-[138px] items-center sm:h-[48px] sm:w-[164px]"
                  aria-label={`${brandingName} home`}
                >
                  <img
                    src={footerLogoSrc}
                    alt={`${brandingName} footer logo`}
                    className="h-full w-full object-contain object-left"
                  />
                </Link>
              ) : (
                <FallbackBrand brandingName={brandingName} />
              )}
              <div className="space-y-3 text-sm font-medium leading-6 text-[#31486e] dark:text-slate-300">
                {footer.block4.address ? (
                  <p className="flex gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--tp-primary)] dark:text-sky-300" />
                    <span>{footer.block4.address}</span>
                  </p>
                ) : null}
                {footer.block4.phone ? (
                  <p className="flex items-center gap-3">
                    <Phone className="h-5 w-5 shrink-0 text-[var(--tp-primary)] dark:text-sky-300" />
                    <span>{footer.block4.phone}</span>
                  </p>
                ) : null}
                {footer.block4.email ? (
                  <p className="flex items-center gap-3">
                    <Mail className="h-5 w-5 shrink-0 text-[var(--tp-primary)] dark:text-sky-300" />
                    <span>{footer.block4.email}</span>
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {footer.block1.enabled ? (
            <FooterLinkBlock title={footer.block1.title} links={footer.block1.links} />
          ) : null}
          {footer.block2.enabled ? (
            <FooterLinkBlock title={footer.block2.title} links={footer.block2.links} />
          ) : null}
          {footer.block3.enabled ? (
            <FooterLinkBlock title={footer.block3.title} links={footer.block3.links} />
          ) : null}

          <section className="space-y-8">
            {footer.socialLinks.enabled && socialItems.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[var(--tp-primary)] dark:text-sky-300">
                  Follow Us
                </h3>
                <div className="flex flex-wrap gap-3">
                  {socialItems.map(({ key, label, Icon }) => (
                    <a
                      key={key}
                      href={footer.socialLinks[key]}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#b9cbe1] bg-white text-[var(--tp-primary)] transition hover:border-[var(--tp-accent)] hover:bg-[var(--tp-accent)] hover:text-white dark:border-slate-700 dark:bg-slate-950 dark:text-sky-300"
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {footer.bottomContact.enabled && footer.bottomContact.contactNumber ? (
              <div className="flex items-center gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#b9cbe1] text-[var(--tp-primary)] dark:border-slate-700 dark:text-sky-300">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-black text-[var(--tp-primary)] dark:text-white">
                    Need help?{" "}
                    <a href={`tel:${footer.bottomContact.contactNumber.replace(/\s+/g, "")}`}>
                      {footer.bottomContact.contactNumber}
                    </a>
                  </p>
                  <p className="text-sm font-semibold text-[#31486e] dark:text-slate-300">
                    We're available <span className="text-[var(--tp-accent)]">24/7</span>
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5 text-sm font-semibold text-[#557099] dark:text-slate-400 md:flex-row md:items-center md:justify-between xl:px-10">
          <p>© 2026 TP Preneurs. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 md:gap-8">
            <Link to="/privacy-policy" className="transition hover:text-[var(--tp-accent)]">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="transition hover:text-[var(--tp-accent)]">
              Terms & Conditions
            </Link>
            <Link to="/refund-policy" className="transition hover:text-[var(--tp-accent)]">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
