import { jsPDF } from 'jspdf';
import { moodEmoji } from '@features/journal/journal.types';
import type { Routine } from '@features/routines/routines.types';
import type { StatsSummary } from './stats.types';

function csvEscape(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvRow(values: (string | number)[]): string {
  return values.map(csvEscape).join(',');
}

export function buildStatsCsv(summary: StatsSummary, routines: Routine[]): string {
  const lines: string[] = [
    csvRow(['Metric', 'Value']),
    csvRow(['Total Check-ins', summary.totalCheckIns]),
    csvRow(['Completion Rate', `${summary.completionRate}%`]),
    csvRow(['Best Streak', `${summary.bestStreak} days`]),
    csvRow(['Active Routines', summary.activeRoutines]),
    '',
    "This Week's Completion",
    csvRow(['Day', 'Completion %']),
    ...summary.weekly.map((point) => csvRow([point.day, point.percentage])),
    '',
    'By Category',
    csvRow(['Category', 'Count']),
    ...summary.categoryBreakdown.map((point) => csvRow([point.category, point.count])),
    '',
    'Last 30 Days Trend',
    csvRow(['Day', 'Completion %']),
    ...summary.trend30Day.map((percentage, index) => csvRow([`Day ${index + 1}`, percentage])),
    '',
    'Activity by Time of Day',
    csvRow(['Time of Day', 'Percentage']),
    ...summary.timeOfDay.map((point) => csvRow([point.label, point.percentage])),
    '',
  ];

  if (summary.moodCorrelation.length > 0) {
    lines.push('Mood vs. Habit Completion', csvRow(['Mood', 'Entries', 'Avg Completion %']));
    summary.moodCorrelation.forEach((point) =>
      lines.push(
        csvRow([
          `${moodEmoji(point.mood)} (${point.mood})`,
          point.entryCount,
          point.avgCompletionPercentage,
        ]),
      ),
    );
    lines.push('');
  }

  lines.push(
    'Current Streaks by Habit',
    csvRow(['Habit', 'Current Streak (days)', 'Longest Streak (days)']),
  );
  routines.forEach((routine) =>
    lines.push(csvRow([`${routine.emoji} ${routine.name}`, routine.streak, routine.longestStreak])),
  );
  return lines.join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function escapeHtml(value: string | number): string {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function htmlTable(headers: string[], rows: (string | number)[][]): string {
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function buildStatsReportHtml(summary: StatsSummary, routines: Routine[]): string {
  const moodSection =
    summary.moodCorrelation.length > 0
      ? `<h2>Mood vs. Habit Completion</h2>${htmlTable(
          ['Mood', 'Entries', 'Avg Completion %'],
          summary.moodCorrelation.map((point) => [
            `${moodEmoji(point.mood)} (${point.mood})`,
            point.entryCount,
            point.avgCompletionPercentage,
          ]),
        )}`
      : '';
  return `<!doctype html><html><head><meta charset="utf-8"><title>RoutineMate Stats Report</title><style>
:root{color-scheme:light}*{box-sizing:border-box}body{font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1e293b;padding:32px;margin:0;line-height:1.45}.report-header{border-bottom:3px solid #4f46e5;padding-bottom:18px;margin-bottom:24px}.brand{color:#4f46e5;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}h1{margin:4px 0;font-family:Poppins,Inter,sans-serif;font-size:26px;line-height:1.2}h2{color:#334155;margin:28px 0 8px;font-size:16px;page-break-after:avoid}table{width:100%;border-collapse:collapse;margin-bottom:12px;page-break-inside:avoid}th,td{border:1px solid #cbd5e1;padding:8px 10px;text-align:left;font-size:12px}th{background:#eef2ff;color:#312e81;font-weight:700}.meta{color:#64748b;font-size:12px;margin:0}@media print{body{padding:0}}
</style></head><body><header class="report-header"><div class="brand">RoutineMate</div><h1>Stats &amp; Insights</h1><p class="meta">Generated ${escapeHtml(new Date().toLocaleString())}</p></header>
${htmlTable(
  ['Metric', 'Value'],
  [
    ['Total Check-ins', summary.totalCheckIns],
    ['Completion Rate', `${summary.completionRate}%`],
    ['Best Streak', `${summary.bestStreak} days`],
    ['Active Routines', summary.activeRoutines],
  ],
)}
<h2>This Week's Completion</h2>${htmlTable(
    ['Day', 'Completion %'],
    summary.weekly.map((point) => [point.day, point.percentage]),
  )}<h2>By Category</h2>${htmlTable(
    ['Category', 'Count'],
    summary.categoryBreakdown.map((point) => [point.category, point.count]),
  )}<h2>Last 30 Days Trend</h2>${htmlTable(
    ['Day', 'Completion %'],
    summary.trend30Day.map((percentage, index) => [`Day ${index + 1}`, percentage]),
  )}<h2>Activity by Time of Day</h2>${htmlTable(
    ['Time of Day', 'Percentage'],
    summary.timeOfDay.map((point) => [point.label, point.percentage]),
  )}${moodSection}<h2>Current Streaks by Habit</h2>${htmlTable(
    ['Habit', 'Current Streak (days)', 'Longest Streak (days)'],
    routines.map((routine) => [
      `${routine.emoji} ${routine.name}`,
      routine.streak,
      routine.longestStreak,
    ]),
  )}</body></html>`;
}

function addPdfTable(
  pdf: jsPDF,
  startY: number,
  headers: string[],
  rows: (string | number)[][],
): number {
  const margin = 40;
  const columnWidth = (pdf.internal.pageSize.getWidth() - margin * 2) / headers.length;
  const rowHeight = 20;
  let y = startY;
  const drawRow = (values: (string | number)[], header = false) => {
    if (y + rowHeight > pdf.internal.pageSize.getHeight() - 36) {
      pdf.addPage();
      y = 42;
    }
    pdf.setFillColor(header ? '#eef2ff' : '#ffffff');
    pdf.setDrawColor('#cbd5e1');
    pdf.setTextColor(header ? '#312e81' : '#1e293b');
    values.forEach((value, index) => {
      const x = margin + index * columnWidth;
      pdf.rect(x, y, columnWidth, rowHeight, header ? 'FD' : 'S');
      pdf.text(String(value), x + 8, y + 13, { maxWidth: columnWidth - 16 });
    });
    y += rowHeight;
  };
  drawRow(headers, true);
  rows.forEach((row) => drawRow(row));
  return y;
}

export function exportStatsAsPdf(summary: StatsSummary, routines: Routine[]): boolean {
  try {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;
    let y = 48;
    pdf.setFillColor('#4f46e5');
    pdf.rect(0, 0, pageWidth, 8, 'F');
    pdf.setTextColor('#4f46e5');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('ROUTINEMATE', margin, y);
    pdf.setTextColor('#1e293b');
    pdf.setFontSize(24);
    pdf.text('Stats & Insights', margin, y + 30);
    pdf.setTextColor('#64748b');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Generated ${new Date().toLocaleString()}`, margin, y + 48);
    y += 76;
    y = addPdfTable(
      pdf,
      y,
      ['Metric', 'Value'],
      [
        ['Total Check-ins', summary.totalCheckIns],
        ['Completion Rate', `${summary.completionRate}%`],
        ['Best Streak', `${summary.bestStreak} days`],
        ['Active Routines', summary.activeRoutines],
      ],
    );
    const addSection = (title: string, headers: string[], rows: (string | number)[][]) => {
      if (y + 48 > pdf.internal.pageSize.getHeight() - 36) {
        pdf.addPage();
        y = 42;
      }
      pdf.setTextColor('#334155');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(title, margin, y + 28);
      y = addPdfTable(pdf, y + 38, headers, rows) + 18;
    };
    addSection(
      "This Week's Completion",
      ['Day', 'Completion %'],
      summary.weekly.map((point) => [point.day, point.percentage]),
    );
    addSection(
      'By Category',
      ['Category', 'Count'],
      summary.categoryBreakdown.map((point) => [point.category, point.count]),
    );
    addSection(
      'Last 30 Days Trend',
      ['Day', 'Completion %'],
      summary.trend30Day.map((percentage, index) => [`Day ${index + 1}`, percentage]),
    );
    addSection(
      'Activity by Time of Day',
      ['Time of Day', 'Percentage'],
      summary.timeOfDay.map((point) => [point.label, point.percentage]),
    );
    if (summary.moodCorrelation.length > 0) {
      addSection(
        'Mood vs. Habit Completion',
        ['Mood', 'Entries', 'Avg Completion %'],
        summary.moodCorrelation.map((point) => [
          `${point.mood}/5`,
          point.entryCount,
          point.avgCompletionPercentage,
        ]),
      );
    }
    addSection(
      'Current Streaks by Habit',
      ['Habit', 'Current Streak', 'Longest Streak'],
      routines.map((routine) => [routine.name, routine.streak, routine.longestStreak]),
    );
    pdf.save(`routinemate-stats-${new Date().toISOString().slice(0, 10)}.pdf`);
    return true;
  } catch {
    return false;
  }
}
