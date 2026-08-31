/** Stable, non-sensitive event names for MVP3 product analytics. */
export const analyticsEvents = {
  friendInviteSent: 'friend_invite_sent',
  friendRequestAccepted: 'friend_request_accepted',
  challengeCreated: 'challenge_created',
  challengeJoined: 'challenge_joined',
  challengeCompleted: 'challenge_completed',
  bundleCompleted: 'routine_bundle_completed',
  focusSessionCompleted: 'focus_session_completed',
  calendarConnected: 'calendar_connected',
  insightViewed: 'insight_viewed',
  insightActioned: 'insight_actioned',
  billingCheckoutStarted: 'billing_checkout_started',
  subscriptionChanged: 'subscription_changed',
  feedbackSubmitted: 'feedback_submitted',
  feedbackVoted: 'feedback_voted',
  localeChanged: 'locale_changed',
} as const;

export type AnalyticsEvent = (typeof analyticsEvents)[keyof typeof analyticsEvents];
