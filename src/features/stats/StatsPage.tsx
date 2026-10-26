import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectAllRoutines } from '@features/routines/routines.selectors';
import { toastShown } from '@features/ui/ui.slice';
import { moodEmoji } from '@features/journal/journal.types';
import ChartCanvas from './components/ChartCanvas';
import { fetchStatsThunk } from './stats.thunks';
import { selectStatsStatus, selectStatsSummary } from './stats.selectors';
import { buildStatsCsv, downloadTextFile, exportStatsAsPdf } from './stats.export';
import styles from './stats.module.scss';
import { httpClient } from '@api/httpClient';
import { unwrap } from '@api/apiResponse';

// Shared muted axis/legend color that stays legible on both the light card
// background and the dark-mode slate-800 card background.
const CHART_TEXT_COLOR = '#94a3b8';
const CHART_GRID_COLOR = 'rgba(148, 163, 184, 0.15)';

interface InsightPayload {
  id: string;
  summaryText: string;
  suggestions: string[];
  fallback: boolean;
}

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
  const [insight, setInsight] = useState<InsightPayload | null>(null);
  const [insightStatus, setInsightStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading');
  const [insightError, setInsightError] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>(
    'idle',
  );

  const loadInsight = useCallback(async () => {
    setInsightStatus('loading');
    setInsightError(null);
    try {
      const response = await httpClient.get('/api/insights');
      setInsight(unwrap<InsightPayload>(response));
      setInsightStatus('succeeded');
    } catch {
      setInsightError('Unable to load your insight. Please try again.');
      setInsightStatus('failed');
    }
  }, []);

  useEffect(() => {
    void loadInsight();
  }, [loadInsight]);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchStatsThunk());
  }, [status, dispatch]);

  if (!summary) {
    if (status === 'failed') {
      return (
        <div className={styles.loadState} role="alert">
          <p>Unable to load your stats. Please try again.</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => dispatch(fetchStatsThunk())}
          >
            Try again
          </button>
        </div>
      );
    }
    return <p className={styles.loadState}>Loading stats…</p>;
  }

  const handleExportCsv = () => {
    const csv = buildStatsCsv(summary, routines);
    const today = new Date().toISOString().slice(0, 10);
    downloadTextFile(`routinemate-stats-${today}.csv`, `\ufeff${csv}`, 'text/csv;charset=utf-8;');
    dispatch(toastShown('Stats exported as CSV'));
  };

  const handleExportPdf = () => {
    const opened = exportStatsAsPdf(summary, routines);
    dispatch(
      toastShown(
        opened
          ? 'Opening the print dialog. Choose "Save as PDF" to download.'
          : 'Please allow pop-ups for this site to export as PDF',
      ),
    );
  };

  const handleInsightFeedback = async () => {
    if (!insight) return;
    setFeedbackStatus('saving');
    try {
      await httpClient.post(`/api/insights/${insight.id}/feedback`, { feedback: 'helpful' });
      setFeedbackStatus('saved');
    } catch {
      setFeedbackStatus('failed');
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2>Stats &amp; Insights</h2>
          <p>Visualize your progress and activity across every routine.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.exportButton} onClick={handleExportCsv}>
            <i className="fa-solid fa-file-csv" aria-hidden="true" /> Export CSV
          </button>
          <button type="button" className={styles.exportButton} onClick={handleExportPdf}>
            <i className="fa-solid fa-file-pdf" aria-hidden="true" /> Export PDF
          </button>
        </div>
      </div>

      {(insight || insightStatus === 'loading' || insightError) && (
        <section className={styles.insightCard} aria-labelledby="stats-insight-heading">
          <div className={styles.insightHeader}>
            <h3 id="stats-insight-heading">
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
              AI Insights
              {insight?.fallback && <span className={styles.insightBadge}>BASIC</span>}
            </h3>
            <button
              type="button"
              className={styles.insightRefresh}
              onClick={() => void loadInsight()}
              disabled={insightStatus === 'loading'}
            >
              <i className="fa-solid fa-arrow-rotate-right" aria-hidden="true" />
              {insightStatus === 'loading' ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          {insightError ? (
            <p className={styles.insightError} role="alert">
              {insightError}
            </p>
          ) : insight ? (
            <>
              <p className={styles.insightSummary}>{insight.summaryText}</p>
              <div className={styles.insightSuggestions}>
                {insight.suggestions.map((suggestion) => (
                  <span className={styles.insightSuggestion} key={suggestion}>
                    <i className="fa-regular fa-lightbulb" aria-hidden="true" />
                    {suggestion}
                  </span>
                ))}
              </div>
              <div className={styles.insightFooter}>
                <button
                  type="button"
                  className={styles.feedbackButton}
                  onClick={() => void handleInsightFeedback()}
                  disabled={feedbackStatus === 'saving' || feedbackStatus === 'saved'}
                >
                  {feedbackStatus === 'saved'
                    ? 'Thanks for your feedback'
                    : feedbackStatus === 'saving'
                      ? 'Saving…'
                      : 'Helpful'}
                </button>
                {feedbackStatus === 'failed' && (
                  <span className={styles.insightError} role="alert">
                    Feedback could not be saved. Please try again.
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className={styles.insightSummary}>Loading your latest insight…</p>
          )}
        </section>
      )}

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

      <div className={styles.chartCard} style={{ marginBottom: 24 }}>
        <div className={styles.chartCardHeader}>
          <h3>Mood vs. Habit Completion</h3>
          <span className={styles.chartCardHint}>Last 30 days</span>
        </div>
        {summary.moodCorrelation.length === 0 ? (
          <p className={styles.emptyChartState}>
            Log a mood in your Journal on a few different days to see how it relates to your habit
            completion.
          </p>
        ) : (
          <>
            <p className={styles.moodInsight}>
              {summary.moodInsight ??
                'Log a few more low- and high-mood days to see a comparison here.'}
            </p>
            <ChartCanvas
              config={{
                type: 'bar',
                data: {
                  labels: summary.moodCorrelation.map(
                    (point) => `${moodEmoji(point.mood)} (${point.entryCount})`,
                  ),
                  datasets: [
                    {
                      label: 'Avg. completion %',
                      data: summary.moodCorrelation.map((point) => point.avgCompletionPercentage),
                      backgroundColor: '#38bdf8',
                      borderRadius: 6,
                      maxBarThickness: 48,
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
          </>
        )}
      </div>

      <div className={styles.chartGridEven}>
        <div className={styles.chartCard}>
          <h3>Current Streaks by Habit</h3>
          {summary.routineStats.length === 0 ? (
            <p className={styles.emptyChartState}>Create an active routine to build a streak.</p>
          ) : (
            <ChartCanvas
              config={{
                type: 'bar',
                data: {
                  labels: summary.routineStats.map((routine) => `${routine.emoji} ${routine.name}`),
                  datasets: [
                    {
                      label: 'Current streak (days)',
                      data: summary.routineStats.map((routine) => routine.currentStreak),
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
              height={Math.max(140, summary.routineStats.length * 42)}
            />
          )}
        </div>

        <div className={styles.chartCard}>
          <h3>Per-Habit Consistency</h3>
          <p className={styles.consistencyHint}>
            Completion over scheduled days in the last 30 days
          </p>
          {summary.routineStats.length === 0 ? (
            <p className={styles.emptyChartState}>
              Create an active routine to see its consistency.
            </p>
          ) : (
            summary.routineStats.map((routine) => {
              const rate = routine.consistency;
              const isConsistent = rate >= 70;
              return (
                <div key={routine.routineId}>
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
