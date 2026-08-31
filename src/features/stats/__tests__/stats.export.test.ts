import { buildStatsCsv, buildStatsReportHtml, exportStatsAsPdf } from '../stats.export';
import { jsPDF } from 'jspdf';
import type { StatsSummary } from '../stats.types';

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }));

const summary: StatsSummary = {
  totalCheckIns: 12,
  completionRate: 75,
  bestStreak: 5,
  activeRoutines: 3,
  weekly: [{ day: 'Mon', percentage: 80 }],
  categoryBreakdown: [{ category: 'Health', count: 4 }],
  trend30Day: [60, 75],
  timeOfDay: [{ label: 'Morning', percentage: 90 }],
  moodCorrelation: [],
  moodInsight: null,
};

const routines = [
  { id: 'routine-1', name: 'Morning walk', emoji: '🚶', streak: 4, longestStreak: 8 },
] as never[];

describe('stats exports', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds a complete CSV with every stats section', () => {
    const csv = buildStatsCsv(summary, routines);

    expect(csv).toContain("This Week's Completion");
    expect(csv).toContain('Last 30 Days Trend');
    expect(csv).toContain('Day 2,75');
    expect(csv).toContain('Morning walk');
  });

  it('builds a branded PDF-ready report with the trend section', () => {
    const html = buildStatsReportHtml(summary, routines);

    expect(html).toContain('RoutineMate');
    expect(html).toContain('background:#eef2ff');
    expect(html).toContain('Last 30 Days Trend');
    expect(html).toContain('Day 2');
  });

  it('generates and saves a PDF without opening a popup', () => {
    const save = jest.fn();
    (jsPDF as unknown as jest.Mock).mockImplementation(() => ({
      internal: {
        pageSize: {
          getWidth: () => 595,
          getHeight: () => 842,
        },
      },
      addPage: jest.fn(),
      rect: jest.fn(),
      setFillColor: jest.fn(),
      setDrawColor: jest.fn(),
      setTextColor: jest.fn(),
      setFont: jest.fn(),
      setFontSize: jest.fn(),
      text: jest.fn(),
      save,
    }));

    expect(exportStatsAsPdf(summary, routines)).toBe(true);
    expect(save).toHaveBeenCalledWith(expect.stringMatching(/^routinemate-stats-.*\.pdf$/));
  });
});
