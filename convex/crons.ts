import { cronJobs } from 'convex/server';
import { components, internal } from './_generated/api';
import { internalMutation } from './_generated/server';

const crons = cronJobs();

// ---------------------------------------------------------------------------
// Mood reminders -- daily at 2pm UTC (9am EST / 7am PST)
// ---------------------------------------------------------------------------
crons.cron(
  'send mood reminders',
  '0 14 * * *',
  internal.notifications.sendMoodReminders,
  {}
);

// ---------------------------------------------------------------------------
// Daily digests -- daily at 1pm UTC (8am EST / 6am PST)
// ---------------------------------------------------------------------------
crons.cron(
  'send daily digests',
  '0 13 * * *',
  internal.notifications.sendDailyDigests,
  {}
);

// ---------------------------------------------------------------------------
// Weekly digests -- every Monday at 1pm UTC (8am EST / 6am PST)
// ---------------------------------------------------------------------------
crons.cron(
  'send weekly digests',
  '0 13 * * 1',
  internal.notifications.sendWeeklyDigests,
  {}
);

// ---------------------------------------------------------------------------
// Resend component cleanup -- hourly, removes finalized emails older than 7 days
// ---------------------------------------------------------------------------
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const cleanupResend = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupOldEmails, {
      olderThan: ONE_WEEK_MS,
    });
    await ctx.scheduler.runAfter(
      0,
      components.resend.lib.cleanupAbandonedEmails,
      { olderThan: 4 * ONE_WEEK_MS }
    );
  },
});

crons.interval(
  'cleanup old resend emails',
  { hours: 1 },
  internal.crons.cleanupResend
);

export default crons;
