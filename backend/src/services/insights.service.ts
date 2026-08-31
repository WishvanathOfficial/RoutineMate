import { Insight, Routine } from '../models';
function week() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}
export async function get(userId: string) {
  let row = await Insight.findOne({ where: { userId, weekOf: week() } });
  if (!row) {
    const count = await Routine.count({ where: { userId, status: 'active' } });
    row = await Insight.create({
      userId,
      weekOf: week(),
      summaryText: count
        ? `You are tracking ${count} active routines this week.`
        : 'Add a routine to start building a weekly insight.',
      suggestions: count
        ? [
            'Keep your strongest routine at the same reminder time.',
            'Try pairing a difficult habit with an existing strong habit.',
          ]
        : ['Create your first routine.'],
      provider: 'deterministic',
      promptVersion: 'v1',
      fallback: true,
      viewedAt: null,
      feedback: null,
    });
  }
  return row;
}
export async function feedback(userId: string, id: string, value: string) {
  const row = await Insight.findOne({ where: { id, userId } });
  if (!row) throw new Error('Insight not found');
  row.feedback = value;
  row.viewedAt = row.viewedAt ?? new Date();
  await row.save();
  return row;
}
