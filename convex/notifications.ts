'use node';

import { components, internal } from './_generated/api';
import { internalAction } from './_generated/server';
import { Resend } from '@convex-dev/resend';

// ---------------------------------------------------------------------------
// Resend component instance
// ---------------------------------------------------------------------------
export const resend = new Resend(components.resend, {
  testMode: false,
});

// From address -- domain must be verified in Resend dashboard
const FROM_ADDRESS = 'Sentio <notifications@sentio.sh>';

// App base URL for deep links in emails
const APP_URL = process.env.VITE_APP_URL ?? 'https://sentio.sh';

// ---------------------------------------------------------------------------
// Email HTML builders
// ---------------------------------------------------------------------------

function buildReminderEmailHtml(displayName: string): string {
  const firstName = displayName.split(' ')[0] || 'there';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mood Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#8b5cf6,#6366f1);padding:32px 24px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">&#127793;</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">Time to check in</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.5;">
                Hey ${firstName}, how are you feeling today?
              </p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.5;">
                Taking a moment to log your mood helps you spot patterns and build
                self-awareness over time. It only takes a few seconds.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                      Log My Mood
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                You're receiving this because you enabled mood reminders in Sentio.
                <br>You can turn this off in Settings &gt; Notifications.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const MOOD_EMOJI: Record<string, string> = {
  happy: '&#128522;',
  excited: '&#129321;',
  calm: '&#128524;',
  neutral: '&#128528;',
  tired: '&#128564;',
  stressed: '&#128553;',
  sad: '&#128546;',
  angry: '&#128545;',
  anxious: '&#128552;',
};

function buildDigestEmailHtml(
  displayName: string,
  period: 'daily' | 'weekly',
  summary: {
    totalEntries: number;
    moodCounts: Record<string, number>;
    mostCommonMood: string | null;
    daysWithEntries: number;
    streak: number;
  }
): string {
  const firstName = displayName.split(' ')[0] || 'there';
  const periodLabel = period === 'daily' ? 'yesterday' : 'this past week';
  const days = period === 'daily' ? 1 : 7;

  // Build mood breakdown rows
  const sortedMoods = Object.entries(summary.moodCounts).sort(
    ([, a], [, b]) => b - a
  );
  const moodRows = sortedMoods
    .slice(0, 5)
    .map(
      ([mood, count]) =>
        `<tr>
          <td style="padding:6px 12px;color:#374151;font-size:14px;">${MOOD_EMOJI[mood] || ''} ${mood.charAt(0).toUpperCase() + mood.slice(1)}</td>
          <td style="padding:6px 12px;color:#6b7280;font-size:14px;text-align:right;">${count} time${count === 1 ? '' : 's'}</td>
        </tr>`
    )
    .join('');

  const noDataMessage =
    summary.totalEntries === 0
      ? `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;">You didn't log any moods ${periodLabel}. Try to check in at least once a day to build your streak!</p>`
      : '';

  const streakSection =
    summary.streak > 0
      ? `<div style="background-color:#f0fdf4;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center;">
           <div style="font-size:28px;margin-bottom:4px;">&#128293;</div>
           <p style="margin:0;color:#166534;font-size:16px;font-weight:600;">${summary.streak}-day streak!</p>
           <p style="margin:4px 0 0;color:#15803d;font-size:13px;">Keep it going!</p>
         </div>`
      : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Mood ${period === 'daily' ? 'Daily' : 'Weekly'} Digest</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#8b5cf6,#6366f1);padding:32px 24px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">&#128202;</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">Your ${period === 'daily' ? 'Daily' : 'Weekly'} Mood Digest</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.5;">
                Hey ${firstName}, here's your mood summary for ${periodLabel}.
              </p>
              ${noDataMessage}
              ${streakSection}
              ${
                summary.totalEntries > 0
                  ? `
              <div style="background-color:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px;">
                <h2 style="margin:0 0 12px;color:#374151;font-size:15px;font-weight:600;">Mood Breakdown</h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${moodRows}
                </table>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="50%" style="padding-right:8px;">
                    <div style="background-color:#f9fafb;border-radius:8px;padding:16px;text-align:center;">
                      <p style="margin:0;color:#6b7280;font-size:12px;">Entries</p>
                      <p style="margin:4px 0 0;color:#374151;font-size:20px;font-weight:600;">${summary.totalEntries}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding-left:8px;">
                    <div style="background-color:#f9fafb;border-radius:8px;padding:16px;text-align:center;">
                      <p style="margin:0;color:#6b7280;font-size:12px;">Days Active</p>
                      <p style="margin:4px 0 0;color:#374151;font-size:20px;font-weight:600;">${summary.daysWithEntries}/${days}</p>
                    </div>
                  </td>
                </tr>
              </table>`
                  : ''
              }
              ${
                summary.mostCommonMood
                  ? `<p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.5;">
                       Your most frequent mood was <strong style="color:#374151;">${MOOD_EMOJI[summary.mostCommonMood] || ''} ${summary.mostCommonMood}</strong>.
                     </p>`
                  : ''
              }
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                      View Full Insights
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                You're receiving this because you opted into ${period} mood digests in Sentio.
                <br>You can change this in Settings &gt; Notifications.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Actions: orchestrate the send pipeline
// ---------------------------------------------------------------------------

/**
 * Send mood reminders to all opted-in users who haven't logged today.
 * Scheduled daily by cron.
 */
export const sendMoodReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(
      internal.notificationHelpers.getUsersWithRemindersEnabled
    );

    let sent = 0;
    let skipped = 0;

    for (const user of users) {
      // Skip if they already logged today
      const hasLogged: boolean = await ctx.runQuery(
        internal.notificationHelpers.hasUserLoggedMoodToday,
        { userId: user._id }
      );
      if (hasLogged) {
        skipped++;
        continue;
      }

      // Skip if we already sent a reminder today
      const lastSent = user.notificationPrefs?.lastReminderSentAt;
      if (lastSent) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if (lastSent >= today.getTime()) {
          skipped++;
          continue;
        }
      }

      // Send the reminder email via the Resend component
      await resend.sendEmail(ctx, {
        from: FROM_ADDRESS,
        to: user.email!,
        subject: 'How are you feeling today?',
        html: buildReminderEmailHtml(user.displayName),
      });

      // Mark reminder as sent
      await ctx.runMutation(internal.notificationHelpers.markReminderSent, {
        userId: user._id,
      });

      sent++;
    }

    console.log(
      `[MoodReminders] Sent: ${sent}, Skipped: ${skipped}, Total eligible: ${users.length}`
    );
  },
});

/**
 * Send daily digest emails to all opted-in users.
 * Scheduled daily by cron.
 */
export const sendDailyDigests = internalAction({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(
      internal.notificationHelpers.getUsersWithDailyDigest
    );

    let sent = 0;

    for (const user of users) {
      // Skip if we already sent a digest today
      const lastSent = user.notificationPrefs?.lastDigestSentAt;
      if (lastSent) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if (lastSent >= today.getTime()) continue;
      }

      // Fetch mood summary for last 1 day
      const summary = await ctx.runQuery(
        internal.notificationHelpers.getUserMoodSummary,
        { userId: user._id, days: 1 }
      );

      await resend.sendEmail(ctx, {
        from: FROM_ADDRESS,
        to: user.email!,
        subject: 'Your Daily Mood Summary',
        html: buildDigestEmailHtml(user.displayName, 'daily', summary),
      });

      await ctx.runMutation(internal.notificationHelpers.markDigestSent, {
        userId: user._id,
      });

      sent++;
    }

    console.log(`[DailyDigest] Sent: ${sent}, Total eligible: ${users.length}`);
  },
});

/**
 * Send weekly digest emails to all opted-in users.
 * Scheduled weekly (Monday) by cron.
 */
export const sendWeeklyDigests = internalAction({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(
      internal.notificationHelpers.getUsersWithWeeklyDigest
    );

    let sent = 0;

    for (const user of users) {
      // Skip if we already sent a digest in the last 6 days (prevent double-sends)
      const lastSent = user.notificationPrefs?.lastDigestSentAt;
      if (lastSent) {
        const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;
        if (lastSent >= sixDaysAgo) continue;
      }

      // Fetch mood summary for last 7 days
      const summary = await ctx.runQuery(
        internal.notificationHelpers.getUserMoodSummary,
        { userId: user._id, days: 7 }
      );

      await resend.sendEmail(ctx, {
        from: FROM_ADDRESS,
        to: user.email!,
        subject: 'Your Weekly Mood Summary',
        html: buildDigestEmailHtml(user.displayName, 'weekly', summary),
      });

      await ctx.runMutation(internal.notificationHelpers.markDigestSent, {
        userId: user._id,
      });

      sent++;
    }

    console.log(
      `[WeeklyDigest] Sent: ${sent}, Total eligible: ${users.length}`
    );
  },
});
