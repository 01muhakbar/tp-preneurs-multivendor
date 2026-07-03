import { Facebook, Headphones, Instagram, Linkedin, Mail, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";

const linkGroups = [
  {
    title: "Shop",
    links: [["All Categories", "/shop"], ["Offers", "/offers"], ["Wishlist", "/wishlist"]],
  },
  {
    title: "Company",
    links: [["About Us", "/about-us"], ["Contact Us", "/contact-us"]],
  },
  {
    title: "My Account",
    links: [["My Orders", "/user/my-orders"], ["Wishlist", "/wishlist"], ["My Account", "/user/my-account"]],
  },
];

const socialIcons = [
  ["facebook", Facebook, "Facebook"],
  ["twitter", Twitter, "X"],
  ["instagram", Instagram, "Instagram"],
  ["youtube", Youtube, "YouTube"],
  ["linkedin", Linkedin, "LinkedIn"],
];

export default function ShopCompactFooter2026({ footerConfig, brandingLogoUrl, brandingName = "TP PRENEURS" }) {
  const logo = resolveAssetUrl(brandingLogoUrl) || resolveAssetUrl(footerConfig?.block4?.footerLogoDataUrl);
  const phone = String(footerConfig?.bottomContact?.contactNumber || footerConfig?.block4?.phone || "+65 9988 7766");
  const email = String(footerConfig?.block4?.email || "support@tppreneurs.com");
  const socials = footerConfig?.socialLinks || {};

  return (
    <footer className="tp-shop-footer">
      <div className="tp-shop-footer__inner">
        <section className="tp-shop-footer__brand">
          <Link to="/" aria-label={`${brandingName} home`}>
            {logo ? <img src={logo} alt={brandingName} /> : <strong>TP<span>PRENEURS</span></strong>}
          </Link>
          <p>Your trusted local marketplace for quality products and everyday essentials.</p>
          <div className="tp-shop-footer__socials">
            {socialIcons.map(([key, Icon, label]) => {
              const href = socials[key];
              return href ? (
                <a key={key} href={href} target="_blank" rel="noreferrer" aria-label={label}><Icon /></a>
              ) : null;
            })}
          </div>
        </section>

        {linkGroups.map((group) => (
          <section className="tp-shop-footer__links" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map(([label, href]) => <Link key={`${label}-${href}`} to={href}>{label}</Link>)}
          </section>
        ))}

        <section className="tp-shop-footer__help">
          <h2>Need Help?</h2>
          <a href={`tel:${phone.replace(/\s+/g, "")}`}><Headphones /> <span><strong>{phone}</strong><small>We're available 24/7</small></span></a>
          <a href={`mailto:${email}`}><Mail /> <span>{email}</span></a>
        </section>
      </div>
      <div className="tp-shop-footer__bottom">
        <p>© 2026 TP Preneurs. All rights reserved.</p>
        <nav aria-label="Legal links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-and-conditions">Terms & Conditions</Link>
        </nav>
      </div>
    </footer>
  );
}
