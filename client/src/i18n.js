import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enStorefront from './locales/en/storefront.json';
import idStorefront from './locales/id/storefront.json';
import enAdmin from './locales/en/admin.json';
import idAdmin from './locales/id/admin.json';
import enSeller from './locales/en/seller.json';
import idSeller from './locales/id/seller.json';

const normalizeLanguageCode = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "id" || normalized === "id-id" || normalized === "indonesia") return "id";
  return "en";
};

const readJsonStorage = (key) => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

// Get language from localStorage, mapped to standard codes
const getStoredLanguage = () => {
  if (typeof window === "undefined") return 'en';
  if (window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin/")) {
    return normalizeLanguageCode(readJsonStorage("adminLanguage")?.isoCode);
  }
  return normalizeLanguageCode(localStorage.getItem('store_language'));
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        storefront: enStorefront,
        admin: enAdmin,
        seller: enSeller
      },
      id: {
        storefront: idStorefront,
        admin: idAdmin,
        seller: idSeller
      }
    },
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    defaultNS: 'storefront',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
