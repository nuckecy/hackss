import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';
import fr from './locales/fr.json';

export type SupportedLocale = 'en' | 'es' | 'de' | 'fr';
export type TranslationKey = string;

const translations: Record<SupportedLocale, typeof en> = {
  en,
  es,
  de,
  fr,
};

let currentLocale: SupportedLocale = 'en';

export function setLocale(locale: SupportedLocale): void {
  currentLocale = locale;
}

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export function t(key: TranslationKey): string {
  const keys = key.split('.');
  let value: any = translations[currentLocale];

  for (const k of keys) {
    value = value?.[k];
  }

  // Fallback to key if translation missing
  return value ?? key;
}

// Helper for translations with parameters
export function tp(key: TranslationKey, params: Record<string, string>): string {
  let translated = t(key);

  // Replace {param} with values
  Object.keys(params).forEach(param => {
    translated = translated.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
  });

  return translated;
}

// Helper for pluralization (future enhancement)
export function tn(key: TranslationKey, count: number): string {
  // For now, just return singular
  return t(key);
}
