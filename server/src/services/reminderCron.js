import cron from 'node-cron';
import CalendarEvent from '../models/CalendarEvent.js';
import TodoTask from '../models/TodoTask.js';
import { sendPushToUser } from '../controllers/notification.controller.js';
import { logger } from '../utils/logger.js';

/**
 * Reminder Cron Job
 * Runs every 60 seconds.
 * Finds all undelivered reminders whose triggerTime has passed (or is within the next 60s).
 * Sends push notification and marks isDelivered = true.
 */
export function startReminderCron() {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const window = new Date(now.getTime() + 60000); // next 60 seconds

    try {
      // ── Calendar event reminders ─────────────────────────────────────────────
      const events = await CalendarEvent.find({
        reminders: {
          $elemMatch: {
            isDelivered: false,
            triggerTime: { $lte: window },
          },
        },
      });

      for (const event of events) {
        let modified = false;
        for (const reminder of event.reminders) {
          if (!reminder.isDelivered && reminder.triggerTime <= window) {
            const startStr = event.startTime ? ` at ${event.startTime}` : '';
            const locStr   = event.location  ? ` · ${event.location}` : '';
            await sendPushToUser(event.user, {
              title: `📅 ${event.title}`,
              body:  `Starts${startStr}${locStr}`,
              url:   '/todo/calendar',
            });
            reminder.isDelivered = true;
            reminder.deliveredAt = new Date();
            modified = true;
          }
        }
        if (modified) await event.save();
      }

      // ── Task reminders ────────────────────────────────────────────────────────
      const tasks = await TodoTask.find({
        'reminder.enabled': true,
        'reminder.isDelivered': false,
        'reminder.triggerTime': { $lte: window },
      });

      for (const task of tasks) {
        const dueStr = task.dueTime ? ` due at ${task.dueTime}` : '';
        await sendPushToUser(task.user, {
          title: `✅ ${task.title}`,
          body:  `Task${dueStr}`,
          url:   '/todo/tasks',
        });
        task.reminder.isDelivered = true;
        await task.save();
      }

      if (events.length || tasks.length) {
        logger.info(`[Cron] Sent ${events.length} event + ${tasks.length} task reminders`);
      }
    } catch (err) {
      logger.error(`[Cron] Reminder error: ${err.message}`);
    }
  });

  logger.info('[Cron] Reminder cron started (every 60s)');
}
