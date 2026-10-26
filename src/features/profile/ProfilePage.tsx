import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import {
  isAppInstalled,
  isInstallAvailable,
  promptInstall,
  subscribeToInstallAvailability,
} from '@app/pwaInstall';
import { selectCurrentUser } from '@features/auth/auth.selectors';
import {
  selectAllRoutines,
  selectBestStreak,
  selectRoutinesStatus,
} from '@features/routines/routines.selectors';
import { fetchRoutinesThunk } from '@features/routines/routines.thunks';
import { fetchStatsThunk } from '@features/stats/stats.thunks';
import { selectStatsStatus, selectStatsSummary } from '@features/stats/stats.selectors';
import { selectTheme } from '@features/ui/ui.selectors';
import { themeToggled, toastShown } from '@features/ui/ui.slice';
import {
  selectAchievementsStatus,
  selectUserXp,
} from '@features/achievements/achievements.selectors';
import { fetchAchievementsThunk } from '@features/achievements/achievements.thunks';
import { selectPreferences, selectProfileError, selectProfileStatus } from './profile.selectors';
import {
  deleteAccountThunk,
  fetchProfileThunk,
  updateAccountThunk,
  updatePreferencesThunk,
} from './profile.thunks';
import Button from '@components/Button/Button';
import Switch from '@components/Switch/Switch';
import styles from './profile.module.scss';
import { httpClient } from '@api/httpClient';
import { unwrap } from '@api/apiResponse';
import Modal from '@components/Modal/Modal';
import { useTranslation } from '../../i18n/useTranslation';

interface BillingSubscription {
  plan: 'free' | 'pro';
  status: string;
  renewsAt: string | null;
}

function formatBillingStatus(status: string): string {
  return status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const routines = useAppSelector(selectAllRoutines);
  const routinesStatus = useAppSelector(selectRoutinesStatus);
  const bestStreak = useAppSelector(selectBestStreak);
  const statsSummary = useAppSelector(selectStatsSummary);
  const statsStatus = useAppSelector(selectStatsStatus);
  const theme = useAppSelector(selectTheme);
  const preferences = useAppSelector(selectPreferences);
  const profileStatus = useAppSelector(selectProfileStatus);
  const profileError = useAppSelector(selectProfileError);
  const xp = useAppSelector(selectUserXp);
  const achievementsStatus = useAppSelector(selectAchievementsStatus);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [installAvailable, setInstallAvailable] = useState(isInstallAvailable());
  const [installed, setInstalled] = useState(isAppInstalled());
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [billingRequest, setBillingRequest] = useState(0);
  const [billingStatus, setBillingStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading');
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingActionPending, setBillingActionPending] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [preferenceSaving, setPreferenceSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (profileStatus === 'idle') dispatch(fetchProfileThunk());
  }, [profileStatus, dispatch]);
  useEffect(() => {
    if (routinesStatus === 'idle') dispatch(fetchRoutinesThunk());
  }, [routinesStatus, dispatch]);
  useEffect(() => {
    if (statsStatus === 'idle') dispatch(fetchStatsThunk());
  }, [statsStatus, dispatch]);
  useEffect(() => {
    let active = true;
    setBillingStatus('loading');
    void httpClient
      .get('/api/billing/subscription')
      .then(unwrap<BillingSubscription>)
      .then((result) => {
        if (!active) return;
        setSubscription(result);
        setBillingStatus('succeeded');
        setBillingError(null);
      })
      .catch(() => {
        if (!active) return;
        setBillingStatus('failed');
        setBillingError('Unable to load billing details.');
      });
    return () => {
      active = false;
    };
  }, [billingRequest]);
  const billingAction = async (path: string) => {
    setBillingActionPending(true);
    try {
      const result = await httpClient
        .post(`/api/billing/${path}`)
        .then(unwrap<{ url: string | null; status: string }>);
      if (result.url) window.location.assign(result.url);
      else
        dispatch(
          toastShown(
            result.status === 'configuration_required'
              ? 'Billing is not configured yet.'
              : 'Billing action started.',
          ),
        );
    } catch {
      dispatch(toastShown('Unable to start this billing action. Please try again.'));
    } finally {
      setBillingActionPending(false);
    }
  };

  // MVP-2 §3.1 "Levels shown on the profile" — Achievements page already
  // fetches this same slice; re-fetching here (guarded by `idle`) means the
  // level card renders correctly whether Profile or Achievements is visited
  // first.
  useEffect(() => {
    if (achievementsStatus === 'idle') dispatch(fetchAchievementsThunk());
  }, [achievementsStatus, dispatch]);

  // Keeps the form in sync once the fetch-on-load above (or a save) resolves
  // with the authoritative name/email from auth.slice.
  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  const handleSaveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountSaving(true);
    const result = await dispatch(updateAccountThunk({ name, email }));
    setAccountSaving(false);
    if (updateAccountThunk.fulfilled.match(result)) {
      dispatch(toastShown('Account details saved'));
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to save account details.'));
    }
  };

  const togglePreference = async (
    key: 'pushRemindersEnabled' | 'dailyDigestEnabled' | 'weeklyEmailEnabled',
  ) => {
    if (preferenceSaving) return;
    setPreferenceSaving(true);
    const result = await dispatch(
      updatePreferencesThunk({ ...preferences, [key]: !preferences[key] }),
    );
    setPreferenceSaving(false);
    if (updatePreferencesThunk.fulfilled.match(result)) {
      dispatch(toastShown('Preference saved'));
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to save preferences.'));
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    const result = await dispatch(deleteAccountThunk());
    setDeletingAccount(false);
    if (deleteAccountThunk.fulfilled.match(result)) {
      setDeleteDialogOpen(false);
      dispatch(toastShown('Account deleted'));
      navigate('/');
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to delete account.'));
    }
  };

  // `beforeinstallprompt` (captured by src/app/pwaInstall.ts as early as
  // possible — see main.tsx) can arrive well after this page first mounts,
  // so this subscribes rather than reading the flag once.
  useEffect(
    () =>
      subscribeToInstallAvailability(() => {
        setInstallAvailable(isInstallAvailable());
        setInstalled(isAppInstalled());
      }),
    [],
  );

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      dispatch(toastShown('Installed! Find RoutineMate on your home screen 🎉'));
    } else if (outcome === 'dismissed') {
      dispatch(toastShown('Install dismissed — you can try again anytime.'));
    } else {
      dispatch(
        toastShown(
          installed
            ? 'RoutineMate is already installed.'
            : "This browser hasn't offered an install prompt yet — try again after using the app a bit more.",
        ),
      );
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
      <h2 style={{ marginBottom: 24 }}>{t('Profile & Settings')}</h2>
      {profileStatus === 'failed' && (
        <div className={styles.errorMessage} role="alert">
          <span>{profileError ?? 'Unable to load your profile settings.'}</span>
          <button type="button" onClick={() => dispatch(fetchProfileThunk())}>
            Retry
          </button>
        </div>
      )}
      <section className={styles.section} aria-labelledby="billing-heading">
        <div className={styles.billingHeader}>
          <div>
            <h3 id="billing-heading">{t('Billing & plan')}</h3>
            <p className={styles.billingSubtitle}>Manage your RoutineMate subscription.</p>
          </div>
          <i className="fa-regular fa-credit-card" aria-hidden="true" />
        </div>
        {billingStatus === 'loading' ? (
          <p className={styles.billingState} role="status">
            <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
            Loading your plan…
          </p>
        ) : billingStatus === 'failed' ? (
          <div className={`${styles.errorMessage} ${styles.billingError}`} role="alert">
            <span>{billingError}</span>
            <button type="button" onClick={() => setBillingRequest((request) => request + 1)}>
              Retry
            </button>
          </div>
        ) : subscription ? (
          <div className={styles.billingBody}>
            <div className={styles.planIdentity}>
              <span
                className={`${styles.planIcon} ${subscription.plan === 'pro' ? styles.proPlanIcon : ''}`}
                aria-hidden="true"
              >
                <i
                  className={
                    subscription.plan === 'pro' ? 'fa-solid fa-crown' : 'fa-solid fa-seedling'
                  }
                />
              </span>
              <div>
                <p className={styles.planEyebrow}>CURRENT PLAN</p>
                <div className={styles.planNameRow}>
                  <h4>{subscription.plan === 'pro' ? 'RoutineMate Pro' : 'RoutineMate Free'}</h4>
                  {subscription.plan === 'pro' && (
                    <span className={`${styles.planStatus} ${styles.proStatus}`}>PRO</span>
                  )}
                </div>
                <p className={styles.planDescription}>
                  {subscription.plan === 'pro'
                    ? 'Your account has access to the Pro plan.'
                    : 'Your core routines, streaks, and basic stats stay free.'}
                </p>
              </div>
            </div>
            <div className={styles.billingDetails}>
              <span
                className={`${styles.planStatus} ${
                  subscription.status === 'active'
                    ? styles.activeStatus
                    : ['past_due', 'unpaid', 'incomplete'].includes(subscription.status)
                      ? styles.attentionStatus
                      : styles.neutralStatus
                }`}
              >
                <span className={styles.statusDot} />
                {formatBillingStatus(subscription.status)}
              </span>
              {subscription.plan === 'pro' && subscription.renewsAt && (
                <p className={styles.renewalDate}>
                  {subscription.status === 'canceled' ? 'Access through' : 'Next billing date'}
                  <strong>
                    {new Date(subscription.renewsAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                </p>
              )}
              {subscription.plan === 'pro' ? (
                <button
                  type="button"
                  className={styles.billingPrimaryButton}
                  onClick={() => void billingAction('portal')}
                  disabled={billingActionPending}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                  {billingActionPending ? 'Opening…' : 'Manage plan'}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.billingPrimaryButton}
                  onClick={() => void billingAction('checkout')}
                  disabled={billingActionPending}
                >
                  <i className="fa-solid fa-sparkles" aria-hidden="true" />
                  {billingActionPending ? 'Opening…' : 'Explore Pro'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`${styles.errorMessage} ${styles.billingError}`} role="alert">
            <span>Billing information is unavailable.</span>
            <button type="button" onClick={() => setBillingRequest((request) => request + 1)}>
              Retry
            </button>
          </div>
        )}
        {billingStatus === 'succeeded' && (
          <div className={styles.billingFooter}>
            <i className="fa-regular fa-circle-info" aria-hidden="true" />
            <p>Plan and billing details are shown here when available.</p>
          </div>
        )}
      </section>
      <div className={styles.grid}>
        <div className={styles.profileCard}>
          <div className={`${styles.avatar} gradient-bg`}>{initials || 'JD'}</div>
          <p style={{ fontWeight: 600 }}>{user?.name}</p>
          <p className={styles.mutedText} style={{ fontSize: 13 }}>
            {user?.email}
          </p>
          {user?.createdAt && (
            <p className={styles.memberSince}>
              Member since{' '}
              {new Date(user.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </p>
          )}
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
              <p>{statsSummary ? `${statsSummary.completionRate}%` : '—'}</p>
              <p>Consistency</p>
            </div>
          </div>

          {xp && (
            <div className={styles.levelCard}>
              <p className={styles.levelLabel}>
                Level {xp.level} <span>· {xp.totalPoints} XP</span>
              </p>
              <div className={styles.levelTrack}>
                <div
                  className={styles.levelFill}
                  style={{ width: `${xp.levelProgressPercent}%` }}
                />
              </div>
              <p className={styles.levelHint}>
                {xp.xpToNextLevel} XP to Level {xp.level + 1}
              </p>
              <Link className={styles.textLink} to="/achievements">
                View achievements
              </Link>
            </div>
          )}
        </div>

        <div>
          <form className={styles.section} onSubmit={handleSaveAccount}>
            <h3 style={{ marginBottom: 16 }}>{t('Account')}</h3>
            <div className={styles.fieldRow}>
              <div>
                <label htmlFor="profile-name">Full name</label>
                <input
                  id="profile-name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={accountSaving || profileStatus === 'loading'}>
              {accountSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>

          <div className={styles.section}>
            <h3 style={{ marginBottom: 8 }}>{t('Preferences')}</h3>
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
                disabled={preferenceSaving || profileStatus !== 'succeeded'}
              />
            </div>
            <div className={styles.preferenceRow}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Daily digest email</p>
                <p className={styles.mutedText} style={{ fontSize: 12 }}>
                  Summary of today&apos;s habits at 8:00 PM
                </p>
              </div>
              <Switch
                aria-label="Toggle daily digest email"
                checked={preferences.dailyDigestEnabled}
                onChange={() => togglePreference('dailyDigestEnabled')}
                disabled={preferenceSaving || profileStatus !== 'succeeded'}
              />
            </div>
            <div className={styles.preferenceRow}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>
                  Weekly email summary
                  <span className={styles.newBadge}>NEW</span>
                </p>
                <p className={styles.mutedText} style={{ fontSize: 12 }}>
                  &quot;Your week in review&quot; every Monday
                </p>
              </div>
              <Switch
                aria-label="Toggle weekly email summary"
                checked={preferences.weeklyEmailEnabled}
                onChange={() => togglePreference('weeklyEmailEnabled')}
                disabled={preferenceSaving || profileStatus !== 'succeeded'}
              />
            </div>
            <div className={styles.preferenceRow}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>
                  Language &amp; units
                  <span className={styles.newBadge}>NEW</span>
                </p>
                <p className={styles.mutedText} style={{ fontSize: 12 }}>
                  Interface language and measurement units
                </p>
              </div>
              <Link className={styles.installButton} to="/settings/language">
                {preferences.language.toUpperCase()} ·{' '}
                {preferences.units === 'metric' ? 'Metric' : 'Imperial'}
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.preferenceRow}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>
                  Install RoutineMate
                  <span className={styles.newBadge}>NEW</span>
                </p>
                <p className={styles.mutedText} style={{ fontSize: 12 }}>
                  Add to your home screen, works offline
                </p>
              </div>
              <button
                type="button"
                className={styles.installButton}
                onClick={handleInstall}
                disabled={installed}
                title={
                  installed
                    ? 'Already installed'
                    : !installAvailable
                      ? "Your browser hasn't offered an install prompt yet"
                      : undefined
                }
              >
                <i
                  className={installed ? 'fa-solid fa-check' : 'fa-solid fa-download'}
                  aria-hidden="true"
                />{' '}
                {installed ? 'Installed' : 'Install'}
              </button>
            </div>
          </div>

          <div className={styles.dangerZone}>
            <h3>{t('Danger Zone')}</h3>
            <p>Deleting your account removes all routines and history permanently.</p>
            <Button variant="danger" onClick={() => setDeleteDialogOpen(true)}>
              Delete Account
            </Button>
          </div>
        </div>
      </div>
      <Modal
        isOpen={deleteDialogOpen}
        title="Delete account?"
        onClose={() => {
          if (!deletingAccount) setDeleteDialogOpen(false);
        }}
      >
        <p className={styles.deleteConfirmation}>
          This permanently removes your account, routines, and history. This action cannot be
          undone.
        </p>
        <div className={styles.dialogActions}>
          <Button
            type="button"
            variant="secondary"
            disabled={deletingAccount}
            onClick={() => setDeleteDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deletingAccount}
            onClick={() => void handleDeleteAccount()}
          >
            {deletingAccount ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
