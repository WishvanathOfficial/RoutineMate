import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import Button from '@components/Button/Button';
import { selectPreferences, selectProfileError, selectProfileStatus } from './profile.selectors';
import { fetchProfileThunk, updatePreferencesThunk } from './profile.thunks';
import styles from './profile.module.scss';
import { translate, type Locale } from '../../i18n/catalog';
import { useTranslation } from '../../i18n/useTranslation';

export default function LanguageSettingsPage() {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(selectPreferences);
  const profileStatus = useAppSelector(selectProfileStatus);
  const profileError = useAppSelector(selectProfileError);
  const { t } = useTranslation();
  const [locale, setLocale] = useState<Locale>(preferences.language);
  const [units, setUnits] = useState<'metric' | 'imperial'>(preferences.units);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profileStatus === 'idle') dispatch(fetchProfileThunk());
  }, [profileStatus, dispatch]);

  useEffect(() => {
    setLocale(preferences.language);
    setUnits(preferences.units);
  }, [preferences.language, preferences.units]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    const result = await dispatch(
      updatePreferencesThunk({ ...preferences, language: locale, units }),
    );
    setSaving(false);
    if (updatePreferencesThunk.fulfilled.match(result)) {
      setMessage(translate(locale, 'Preferences saved'));
    } else {
      setMessage(result.payload ?? 'Unable to save preferences. Please try again.');
    }
  };

  return (
    <div className={styles.languagePage}>
      <div className={styles.pageHeader}>
        <h2>{t('Language & regional settings')}</h2>
        <p>{t('Choose your interface language and preferred measurement units.')}</p>
      </div>
      {profileStatus === 'loading' && <p role="status">{t('Loading preferences…')}</p>}
      {profileStatus === 'failed' && (
        <div className={styles.errorMessage} role="alert">
          <span>{profileError ?? t('Unable to load preferences.')}</span>
          <button type="button" onClick={() => dispatch(fetchProfileThunk())}>
            {t('Retry')}
          </button>
        </div>
      )}
      <section className={styles.section}>
        <div className={styles.languageField}>
          <label htmlFor="profile-language">{t('Language')}</label>
          <select
            id="profile-language"
            value={locale}
            disabled={profileStatus !== 'succeeded' || saving}
            onChange={(event) => setLocale(event.target.value as Locale)}
          >
            <option value="en">{t('English')}</option>
            <option value="es">{t('Español')}</option>
            <option value="hi">{t('हिन्दी')}</option>
          </select>
        </div>
        <div className={styles.languageField}>
          <label htmlFor="profile-units">{t('Units')}</label>
          <select
            id="profile-units"
            value={units}
            disabled={profileStatus !== 'succeeded' || saving}
            onChange={(event) => setUnits(event.target.value as typeof units)}
          >
            <option value="metric">{t('Metric')}</option>
            <option value="imperial">{t('Imperial')}</option>
          </select>
        </div>
        <Button
          type="button"
          disabled={saving || profileStatus !== 'succeeded'}
          onClick={() => void save()}
        >
          {saving ? t('Saving…') : t('Save preferences')}
        </Button>
        {message && (
          <p
            className={
              message === t('Preferences saved') ? styles.successMessage : styles.errorMessage
            }
            role={message === t('Preferences saved') ? 'status' : 'alert'}
          >
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
