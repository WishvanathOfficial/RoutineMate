import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectAllRoutines } from '@features/routines/routines.selectors';
import ChartCanvas from './components/ChartCanvas';
import { fetchStatsThunk } from './stats.thunks';
import { selectStatsStatus, selectStatsSummary } from './stats.selectors';
import styles from './stats.module.scss';

// Shared muted axis/legend color that stays legible on both the light card
// background and the dark-mode slate-800 card background.
const CHART_TEXT_COLOR = '#94a3b8';
const CHART_GRID_COLOR = 'rgba(148, 163, 184, 0.15)';

interface SummaryCard {
  key: 'totalCheckIns' | 'completionRate' | 'bestStreak' | 'activeRoutines';
  label: string;
  icon: string;
  tint: 'brand' | 'emerald' | 'amber' | 'rose';
  suffix?: string;
}

const SUMMARY_CARDS: SummaryCard[] = [
  {
    key: 'totalCheckIns',
    label: 'Total Check-ins',
    icon: 'fa-solid fa-check-double',
    tint: 'brand',
  },
  {
    key: 'completionRate',
    label: 'Completion Rate',
    icon: 'fa-solid fa-chart-line',
    tint: 'emerald',
    suffix: '%',
  },
  {
    key: 'bestStreak',
    label: 'Best Streak',
    icon: 'fa-solid fa-fire',
    tint: 'amber',
    suffix: ' days',
  },
  { key: 'activeRoutines', label: 'Active Routines', icon: 'fa-solid fa-list-check', tint: 'rose' },
];

export default function StatsPage() {
  const dispatch = useAppDispatch();
  const summary = useAppSelector(selectStatsSummary);
  const status = useAppSelector(selectStatsStatus);
  const routines = useAppSelector(selectAllRoutines);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchStatsThunk());
  }, [status, dispatch]);

  if (!summary) {
    return <p>Loading stats…</p>;
  }

  return (
    <div>
      <div className={styles.header}>
        <h2>Stats &amp; Insights</h2>
        <p>Visualize your progress and activity across every routine.</p>
      </div>

      <div className={styles.statGrid}>
        {SUMMARY_CARDS.map((card) => (
          <div className={styles.statCard} key={card.key}>
            <span className={`${styles.statIcon} ${styles[card.tint]}`}>
              <i className={card.icon} aria-hidden="true" />
            </span>
            <p>{card.label}</p>
            <p>
              {summary[card.key]}
              {card.suffix ?? ''}
            </p>
          </div>
        ))}
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.chartCard}>
          <h3>This Week&apos;s Completion</h3>
          <ChartCanvas
            config={{
              type: 'bar',
              data: {
                labels: summary.weekly.map((point) => point.day),
                datasets: [
                  {
                    label: 'Completion %',
                    data: summary.weekly.map((point) => point.percentage),
                    backgroundColor: '#4F46E5',
                    borderRadius: 6,
                    maxBarThickness: 36,
                  },
                ],
              },
              options: {
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: CHART_TEXT_COLOR },
                    grid: { color: CHART_GRID_COLOR },
                  },
                  x: { ticks: { color: CHART_TEXT_COLOR }, grid: { display: false } },
                },
              },
            }}
          />
        </div>
        <div className={styles.chartCard}>
          <h3>By Category</h3>
          <ChartCanvas
            config={{
              type: 'doughnut',
              data: {
                labels: summary.categoryBreakdown.map((point) => point.category),
                datasets: [
                  {
                    data: summary.categoryBreakdown.map((point) => point.count),
                    backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#38bdf8'],
                  },
                ],
              },
              options: {
                plugins: { legend: { position: 'bottom', labels: { color: CHART_TEXT_COLOR } } },
              },
            }}
          />
        </div>
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <h3>Last 30 Days Trend</h3>
            <span className={styles.chartCardHint}>Daily completion %</span>
          </div>
          <ChartCanvas
            config={{
              type: 'line',
              data: {
                labels: summary.trend30Day.map((_, i) => `Day ${i + 1}`),
                datasets: [
                  {
                    label: 'Completion %',
                    data: summary.trend30Day,
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79,70,229,0.12)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 0,
                  },
                ],
              },
              options: {
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: CHART_TEXT_COLOR },
                    grid: { color: CHART_GRID_COLOR },
                  },
                  x: { ticks: { display: false }, grid: { display: false } },
                },
              },
            }}
          />
        </div>
        <div className={styles.chartCard}>
          <h3>Activity by Time of Day</h3>
          <ChartCanvas
            config={{
              type: 'bar',
              data: {
                labels: summary.timeOfDay.map((point) => point.label),
                datasets: [
                  {
                    data: summary.timeOfDay.map((point) => point.percentage),
                    backgroundColor: ['#4F46E5', '#38bdf8', '#F59E0B', '#64748b'],
                    borderRadius: 6,
                    maxBarThickness: 28,
                  },
                ],
              },
              options: {
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    beginAtZero: true,
                    ticks: { color: CHART_TEXT_COLOR },
                    grid: { color: CHART_GRID_COLOR },
                  },
                  y: { ticks: { color: CHART_TEXT_COLOR }, grid: { display: false } },
                },
              },
            }}
          />
        </div>
      </div>

      <div className={styles.chartGridEven}>
        <div className={styles.chartCard}>
          <h3>Current Streaks by Habit</h3>
          <ChartCanvas
            config={{
              type: 'bar',
              data: {
                labels: routines.map((routine) => `${routine.emoji} ${routine.name}`),
                datasets: [
                  {
                    label: 'Current streak (days)',
                    data: routines.map((routine) => routine.streak),
                    backgroundColor: '#10B981',
                    borderRadius: 6,
                    maxBarThickness: 28,
                  },
                ],
              },
              options: {
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    beginAtZero: true,
                    ticks: { color: CHART_TEXT_COLOR },
                    grid: { color: CHART_GRID_COLOR },
                    title: { display: true, text: 'Days', color: CHART_TEXT_COLOR },
                  },
                  y: { ticks: { color: CHART_TEXT_COLOR }, grid: { display: false } },
                },
              },
            }}
            height={Math.max(140, routines.length * 42)}
          />
        </div>

        <div className={styles.chartCard}>
          <h3>Per-Habit Consistency</h3>
          {routines.map((routine) => {
            const rate = Math.min(100, 40 + routine.streak * 3);
            const isConsistent = rate >= 70;
            return (
              <div key={routine.id}>
                <div className={styles.consistencyRow}>
                  <span>
                    {routine.emoji} {routine.name}
                  </span>
                  <span className={styles.consistencyValue}>{rate}%</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${isConsistent ? styles.consistent : styles.inconsistent}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
