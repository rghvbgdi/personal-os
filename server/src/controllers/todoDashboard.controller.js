import TodoTask from '../models/TodoTask.js';
import CalendarEvent from '../models/CalendarEvent.js';
import SleepLog from '../models/SleepLog.js';
import PomodoroSession from '../models/PomodoroSession.js';
import InternshipConfig from '../models/InternshipConfig.js';
import { success } from '../utils/response.js';
import { startOfDay, endOfDay } from '../utils/dateHelpers.js';

// ── Today's Aggregated Dashboard ──────────────────────────────────────────────
export const getTodayDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Tasks due today
    const [tasksToday, nextEvent, sleepLast, focusSessions, internship] = await Promise.all([
      TodoTask.find({
        user: req.user.id,
        dueDate: { $gte: todayStart, $lte: todayEnd },
        isCompleted: false,
      }).sort({ priority: 1 }).limit(5),

      CalendarEvent.findOne({
        user: req.user.id,
        date: { $gte: todayStart, $lte: todayEnd },
        startTime: { $gte: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` },
      }).sort({ startTime: 1 }),

      SleepLog.findOne({
        user: req.user.id,
        date: { $gte: startOfDay(new Date(now.getTime() - 86400000)), $lte: todayStart },
      }).sort({ date: -1 }),

      PomodoroSession.find({
        user: req.user.id,
        type: 'focus',
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),

      InternshipConfig.findOne({ user: req.user.id }),
    ]);

    const focusMinutes = focusSessions.reduce((a, s) => a + (s.duration || 0), 0);

    // Internship day counter
    let internshipDay = null;
    let internshipTotal = null;
    if (internship) {
      const start = new Date(internship.startDate);
      const end   = new Date(internship.endDate);
      internshipDay   = Math.ceil((now - start) / 86400000);
      internshipTotal = Math.ceil((end - start) / 86400000);
    }

    return success(res, {
      tasksToday,
      tasksDueCount: tasksToday.length,
      nextEvent: nextEvent || null,
      sleepLast: sleepLast ? { durationMinutes: sleepLast.durationMinutes, quality: sleepLast.quality } : null,
      focusMinutes,
      internship: internship ? {
        companyName: internship.companyName,
        role: internship.role,
        day: internshipDay,
        total: internshipTotal,
      } : null,
    });
  } catch (err) {
    next(err);
  }
};
