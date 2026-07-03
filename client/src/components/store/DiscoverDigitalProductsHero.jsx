import { ArrowRight, CloudDownload, FileText, Monitor, ShoppingBag, Smartphone, Zap, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./discover-digital-products-hero.css";

const digitalProductCards = [
  { id: 1, title: "Mobile Apps", rating: "4.9", icon: Smartphone, tone: "phone" },
  { id: 2, title: "Software & Tools", rating: "4.8", icon: Monitor, tone: "software", featured: true },
  { id: 3, title: "Cloud Storage", rating: "4.7", icon: CloudDownload, tone: "cloud" },
  { id: 4, title: "E-Books & Guides", rating: "4.8", icon: FileText, tone: "ebook" },
  { id: 5, title: "Shopping Bags", rating: "4.9", icon: ShoppingBag, tone: "bag" },
];

export default function DiscoverDigitalProductsHero() {
  const { t } = useTranslation();

  // Split heading to color the last two words with accent color
  const headingText = t("home.heading1", "Shop Online with Ease");
  const words = headingText.split(" ");
  let firstPart = headingText;
  let lastTwo = "";
  if (words.length >= 2) {
    lastTwo = words.splice(-2).join(" ");
    firstPart = words.join(" ");
  }

  return (
    <section 
      aria-labelledby="storefront-discover-heading" 
      className="tp-discover-hero w-full overflow-hidden"
    >
      <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center p-8 sm:p-12 lg:p-16">
        
        {/* Left Column: Text Content */}
        <div className="tp-discover-hero__content space-y-6">
          <div className="tp-discover-hero__eyebrow inline-flex items-center gap-2.5 rounded-full px-4 py-2">
            <Zap className="h-4 w-4 text-[var(--tp-accent)]" aria-hidden="true" />
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--tp-accent)]">
              {t("home.eyebrow", "DISCOVER YOUR FAVORITE PRODUCTS")}
            </p>
          </div>
          
          <h2 id="storefront-discover-heading" className="tp-discover-hero__title max-w-2xl text-4xl font-black leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
            {firstPart} <br className="hidden lg:block" />
            <span className="text-[var(--tp-accent)] whitespace-nowrap">{lastTwo}</span>
          </h2>
          
          <p className="tp-discover-hero__desc max-w-xl text-base font-medium leading-relaxed sm:text-lg">
            {t("home.description", "Explore a wide range of quality products from trusted sellers. Enjoy exclusive deals, fast delivery, and a seamless shopping experience.")}
          </p>
          
          <div className="pt-4">
            <Link
              to="/shop"
              className="tp-discover-hero__cta group relative inline-flex h-14 items-center gap-3 overflow-hidden px-10 text-base font-black transition-all hover:-translate-y-1"
            >
              <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-700 ease-out group-hover:translate-x-full" />
              <span className="relative z-10">{t("home.startShopping", "Start Shopping")}</span>
              <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        
        {/* Right Column: Visual Cluster */}
        <div className="tp-discover-hero__visual relative h-[450px] lg:h-[520px] w-full">
          
          <div className="tp-discover-hero__cluster absolute inset-0 mx-auto w-full max-w-[500px]">
            {digitalProductCards.map((card) => (
              <div 
                key={card.id} 
                className={`tp-digital-card tp-digital-card--${card.tone} ${card.featured ? "tp-digital-card--featured" : ""}`}
              >
                <div className="tp-digital-card__icon-wrapper">
                  <card.icon className="tp-digital-card__icon" aria-hidden="true" />
                </div>
                <div className="tp-digital-card__info">
                  <p className="tp-digital-card__title">{card.title}</p>
                  <div className="tp-digital-card__rating">
                    <span>{card.rating}</span>
                    <Star className="h-3 w-3 fill-current text-[var(--tp-accent)]" />
                  </div>
                </div>
              </div>
            ))}
            
            {/* Bottom Info Chip */}
            <div className="tp-discover-hero__chip">
              <div className="tp-discover-hero__chip-icon">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="tp-discover-hero__chip-text">
                <p className="font-black text-[var(--tp-primary)] uppercase text-[10px] tracking-wider dark:text-blue-400">Instant Access</p>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Get your digital products <strong>immediately</strong></p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
