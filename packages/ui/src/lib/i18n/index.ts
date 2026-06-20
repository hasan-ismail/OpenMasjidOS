/**
 * i18next setup. English is the only complete locale for now, but every string
 * goes through here so the UI is translation- and RTL-ready (CLAUDE.md §4, §14).
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
