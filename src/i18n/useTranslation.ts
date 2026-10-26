import { useAppSelector } from '@app/hooks';
import { selectPreferences } from '@features/profile/profile.selectors';
import { translate } from './catalog';

export function useTranslation() {
  const locale = useAppSelector(selectPreferences).language;
  return {
    locale,
    t: (message: string, values?: Record<string, string>) => translate(locale, message, values),
  };
}
