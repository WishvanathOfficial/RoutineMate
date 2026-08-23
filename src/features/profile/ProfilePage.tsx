import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectCurrentUser } from '@features/auth/auth.selectors';
import { selectAllRoutines, selectBestStreak } from '@features/routines/routines.selectors';
import { selectTheme } from '@features/ui/ui.selectors';
import { themeToggled, toastShown } from '@features/ui/ui.slice';
import { selectPreferences, selectProfileStatus } from './profile.selectors';
import {
  deleteAccountThunk,
  fetchProfileThunk,
  updateAccountThunk,
  updatePreferencesThunk,
} from './profile.thunks';
import Button from '@components/Button/Button';
import Switch from '@components/Switch/Switch';
import styles from './profile.module.scss';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const routines = useAppSelector(selectAllRoutines);
  const bestStreak = useAppSelector(selectBestStreak);
  const theme = useAppSelector(selectTheme);
  const preferences = useAppSelector(selectPreferences);
  const profileStatus = useAppSelector(selectProfileStatus);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  useEffect(() => {
    if (profileStatus === 'idle') dispatch(fetchProfileThunk());
  }, [profileStatus, dispatch]);

  // Keeps the form in sync once the fetch-on-load above (or a save) resolves
  // with the authoritative name/email from auth.slice.
  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  const handleSaveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await dispatch(updateAccountThunk({ name, email }));
    if (updateAccountThunk.fulfilled.match(result)) {
      dispatch(toastShown('Account details saved'));
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to save account details.'));
    }
  };

  const togglePreference = async (key: 'pushRemindersEnabled' | 'dailyDigestEnabled') => {
    const result = await dispatch(
      updatePreferencesThunk({ ...preferences, [key]: !preferences[key] }),
    );
    if (!updatePreferencesThunk.fulfilled.match(result)) {
      dispatch(toastShown(result.payload ?? 'Failed to save preferences.'));
    }
  };

  const handleDeleteAccount = async () => {
    const result = await dispatch(deleteAccountThunk());
    if (deleteAccountThunk.fulfilled.match(result)) {
      dispatch(toastShown('Account deleted'));
      navigate('/');
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to delete account.'));
    }
  };

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Profile &amp; Settings</h2>
      <div className={styles.grid}>
        <div className={styles.profileCard}>
          <div className={`${styles.avatar} gradient-bg`}>{initials || 'JD'}</div>
          <p style={{ fontWeight: 600 }}>{user?.name}</p>
          <p className={styles.mutedText} style={{ fontSize: 13 }}>
            {user?.email}
          </p>
          <div className={styles.statsRow}>
            <div>
              <p>{routines.length}</p>
              <p>Routines</p>
            </div>
            <div>
              <p>{bestStreak}</p>
              <p>Best streak</p>
            </div>
            <div>
              <p>83%</p>
              <p>Consistency</p>
            </div>
          </div>
        </div>

        <div>
          <form className={styles.section} onSubmit={handleSaveAccount}>
            <h3 style={{ marginBottom: 16 }}>Account</h3>
            <div className={styles.fieldRow}>
              <div>
                <label htmlFor="profile-name">Full name</label>
                <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>

          <div className={styles.section}>
            <h3 style={{ marginBottom: 8 }}>Preferences</h3>
            <div className={styles.preferenceRow}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Dark mode</p>
                <p className={styles.mutedText} style={{ fontSize: 12 }}>
                  Switch between light and dark theme
                </p>
              </div>
              <Switch
                aria-label="Toggle dark mode"
                checked={theme === 'dark'}
                onChange={() => dispatch(themeToggled())}
              />
            </div>
            <div className={styles.preferenceRow}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Push reminders</p>
                <p className={styles.mutedText} style={{ fontSize: 12 }}>
                  Get notified at each habit&apos;s reminder time
                </p>
              </div>
              <Switch
                aria-label="Toggle push reminders"
                checked={preferences.pushRemindersEnabled}
                onChange={() => togglePreference('pushRemindersEnabled')}
              />
            </div>
            <div className={styles.preferenceRow}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Daily digest email</p>
                <p className={styles.mutedText} style={{ fontSize: 12 }}>
                  Summary of today&apos;s habits each morning
                </p>
              </div>
              <Switch
                aria-label="Toggle daily digest email"
                checked={preferences.dailyDigestEnabled}
                onChange={() => togglePreference('dailyDigestEnabled')}
              />
            </div>
          </div>

          <div className={styles.dangerZone}>
            <h3>Danger Zone</h3>
            <p>Deleting your account removes all routines and history permanently.</p>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
