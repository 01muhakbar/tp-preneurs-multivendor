import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enStorefront from './locales/en/storefront.json';
import idStorefront from './locales/id/storefront.json';

// Get language from localStorage, mapped to standard codes
const getStoredLanguage = () => {
  if (typeof window === "undefined") return 'en';
  const lang = localStorage.getItem('store_language');
  if (lang === 'Indonesia') return 'id';
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        storefront: enStorefront
      },
      id: {
        storefront: idStorefront
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
