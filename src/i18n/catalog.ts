export const catalogs = {
  en: { language: 'Language', units: 'Units', saved: 'Preferences saved' },
  hi: { language: 'भाषा', units: 'इकाइयाँ', saved: 'प्राथमिकताएँ सहेजी गईं' },
  es: { language: 'Idioma', units: 'Unidades', saved: 'Preferencias guardadas' },
} as const;
export type Locale = keyof typeof catalogs;
export function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}
