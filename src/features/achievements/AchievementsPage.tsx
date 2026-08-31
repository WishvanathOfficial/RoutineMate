import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import {
  selectAllAchievements,
  selectAchievementsStatus,
  selectUserXp,
} from './achievements.selectors';
import { fetchAchievementsThunk } from './achievements.thunks';
import { formatUnlockedDate } from './achievements.types';
import styles from './achievements.module.scss';

export default function AchievementsPage() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAchievementsStatus);
  const achievements = useAppSelector(selectAllAchievements);
  const xp = useAppSelector(selectUserXp);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchAchievementsThunk());
  }, [status, dispatch]);

  return (
    <div>
      <div className={styles.header}>
        <h2>Achievements</h2>
        <p>Badges and rewards for staying consistent.</p>
      </div>

      {status === 'loading' && !xp && <p>Loading achievements…</p>}

      {xp && (
        <div className={styles.levelCard}>
          <div>
            <p className={styles.levelLabel}>Current Level</p>
            <p className={styles.levelValue}>
              Level {xp.level} <span>· {xp.totalPoints} XP</span>
            </p>
          </div>
          <div className={styles.levelBarWrap}>
            <div className={styles.levelTrack}>
              <div className={styles.levelFill} style={{ width: `${xp.levelProgressPercent}%` }} />
            </div>
            <p className={styles.levelHint}>
              {xp.xpToNextLevel} XP to Level {xp.level + 1}
            </p>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {achievements.map((achievement) =>
          achievement.unlockedAt ? (
            <div key={achievement.id} className={styles.badgeCard}>
              <div className={styles.badgeIcon}>{achievement.icon}</div>
              <p className={styles.badgeTitle}>{achievement.title}</p>
              <p className={styles.badgeMeta}>
                Unlocked {formatUnlockedDate(achievement.unlockedAt)}
              </p>
            </div>
          ) : (
            <div key={achievement.id} className={styles.badgeCardLocked}>
              <div className={styles.badgeIconLocked}>
                <i className="fa-solid fa-lock" aria-hidden="true" />
              </div>
              <p className={styles.badgeTitleLocked}>{achievement.title}</p>
              <p className={styles.badgeMeta}>{achievement.progressLabel}</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
