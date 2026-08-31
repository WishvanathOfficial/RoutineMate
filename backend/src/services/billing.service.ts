import crypto from 'crypto';
import { BillingEvent, Subscription } from '../models';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
export async function getSubscription(userId: string) {
  const [s] = await Subscription.findOrCreate({
    where: { userId },
    defaults: { userId, plan: 'free', status: 'active', stripeCustomerId: null, renewsAt: null },
  });
  return s;
}
export function hasPro(subscription: Subscription) {
  return subscription.plan === 'pro' && subscription.status === 'active';
}
export async function checkout(userId: string) {
  const subscription = await getSubscription(userId);
  if (hasPro(subscription)) return { status: 'active', url: null };
  if (!env.billing.stripeSecretKey) return { status: 'configuration_required', url: null };
  return { status: 'pending', url: `${env.corsOrigin}/profile?billing=checkout` };
}
export async function portal(userId: string) {
  await getSubscription(userId);
  if (!env.billing.stripeSecretKey) return { status: 'configuration_required', url: null };
  return { status: 'ready', url: `${env.corsOrigin}/profile?billing=portal` };
}
export async function handleWebhook(raw: string, signature: string | undefined) {
  if (!env.billing.webhookSecret) throw ApiError.internal('Billing webhook is not configured');
  const expected = crypto.createHmac('sha256', env.billing.webhookSecret).update(raw).digest('hex');
  if (!signature || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)))
    throw ApiError.badRequest('Invalid billing signature');
  const event = JSON.parse(raw) as {
    id: string;
    type: string;
    userId?: string;
    plan?: 'free' | 'pro';
    status?: string;
    renewsAt?: string;
  };
  const [record, created] = await BillingEvent.findOrCreate({
    where: { providerEventId: event.id },
    defaults: { providerEventId: event.id, type: event.type, processedAt: null },
  });
  if (!created && record.processedAt) return;
  if (event.userId) {
    const s = await getSubscription(event.userId);
    if (event.plan) s.plan = event.plan;
    if (event.status) s.status = event.status;
    if (event.renewsAt) s.renewsAt = new Date(event.renewsAt);
    await s.save();
  }
  record.processedAt = new Date();
  await record.save();
}
