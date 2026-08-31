import { useState } from 'react';
import { httpClient } from '@api/httpClient';
import { catalogs, type Locale } from '../../i18n/catalog';
export default function LanguageSettingsPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [message, setMessage] = useState('');
  const save = async () => {
    await httpClient.put('/api/profile/preferences', { language: locale, units });
    localStorage.setItem('routinemate-locale', locale);
    setMessage(catalogs[locale].saved);
  };
  return (
    <div>
      <h2>{catalogs[locale].language}</h2>
      <label>
        Language{' '}
        <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="es">Español</option>
        </select>
      </label>
      <label>
        {' '}
        {catalogs[locale].units}{' '}
        <select value={units} onChange={(e) => setUnits(e.target.value as typeof units)}>
          <option value="metric">Metric</option>
          <option value="imperial">Imperial</option>
        </select>
      </label>
      <button type="button" onClick={() => void save()}>
        Save
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
