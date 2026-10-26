import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import {
  selectAllAchievements,
  selectAchievementsError,
  selectAchievementsStatus,
  selectUserXp,
} from './achievements.selectors';
import { fetchAchievementsThunk } from './achievements.thunks';
import { formatUnlockedDate } from './achievements.types';
import styles from './achievements.module.scss';

export default function AchievementsPage() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAchievementsStatus);
  const error = useAppSelector(selectAchievementsError);
  const achievements = useAppSelector(selectAllAchievements);
  const xp = useAppSelector(selectUserXp);
  const unlockedCount = achievements.filter((achievement) => achievement.unlockedAt).length;

  useEffect(() => {
    if (status === 'idle') dispatch(fetchAchievementsThunk());
  }, [status, dispatch]);

  return (
    <div>
      <div className={styles.header}>
        <h2>Achievements</h2>
        <p>Badges and rewards for staying consistent.</p>
      </div>

      {status === 'failed' && (
        <div className={styles.errorState} role="alert">
          <p>{error ?? 'Unable to load achievements. Please try again.'}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => dispatch(fetchAchievementsThunk())}
          >
            Try again
          </button>
        </div>
      )}

      {status === 'loading' && !xp && (
        <p className={styles.loadingState} role="status">
          Loading achievements…
        </p>
      )}

      {xp && (
        <div className={styles.levelCard}>
          <div>
            <p className={styles.levelLabel}>Current Level</p>
            <p className={styles.levelValue}>
              Level {xp.level} <span>· {xp.totalPoints} XP</span>
            </p>
          </div>
          <div className={styles.levelProgress}>
            <div
              className={styles.levelTrack}
              role="progressbar"
              aria-label={`Progress to level ${xp.level + 1}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={xp.levelProgressPercent}
            >
              <div className={styles.levelFill} style={{ width: `${xp.levelProgressPercent}%` }} />
            </div>
            <p className={styles.levelHint}>
              {xp.xpToNextLevel} XP to Level {xp.level + 1}
            </p>
          </div>
        </div>
      )}

      {achievements.length > 0 ? (
        <>
          <p className={styles.collectionSummary} aria-live="polite">
            {unlockedCount} of {achievements.length} badges unlocked
          </p>
          <div className={styles.grid}>
            {achievements.map((achievement) =>
              achievement.unlockedAt ? (
                <article key={achievement.id} className={styles.badgeCard}>
                  <div className={styles.badgeIcon} aria-hidden="true">
                    {achievement.icon}
                  </div>
                  <p className={styles.badgeTitle}>{achievement.title}</p>
                  <p className={styles.badgeMeta}>
                    Unlocked {formatUnlockedDate(achievement.unlockedAt)}
                  </p>
                </article>
              ) : (
                <article key={achievement.id} className={styles.badgeCardLocked}>
                  <div className={styles.badgeIconLocked} aria-hidden="true">
                    <i className="fa-solid fa-lock" />
                  </div>
                  <p className={styles.badgeTitleLocked}>{achievement.title}</p>
                  <p className={styles.badgeMeta}>
                    {achievement.progressLabel ?? 'Keep going to unlock this badge.'}
                  </p>
                </article>
              ),
            )}
          </div>
        </>
      ) : (
        status === 'succeeded' && (
          <p className={styles.emptyState}>No achievements are available yet. Check back soon.</p>
        )
      )}
    </div>
  );
}
