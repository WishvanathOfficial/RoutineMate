import { useAppSelector } from '@app/hooks';
import { translate, type Locale } from './catalog';

export function useTranslation() {
  const locale = useAppSelector((state): Locale => state.profile?.preferences.language ?? 'en');
  return {
    locale,
    t: (message: string, values?: Record<string, string>) => translate(locale, message, values),
  };
}
