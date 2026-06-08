import SleepLog from '../models/SleepLog.js';
import { success, error } from '../utils/response.js';
import { startOfDay } from '../utils/dateHelpers.js';
import { format, subDays } from 'date-fns';

// ── Log Sleep ─────────────────────────────────────────────────────────────────
export const logSleep = async (req, res, next) => {
  try {
    const { sleepTime, wakeTime, quality, notes } = req.body;

    const sleepDate = new Date(sleepTime);
    const wakeDate  = new Date(wakeTime);
    const durationMinutes = Math.round((wakeDate - sleepDate) / 60000);

    if (durationMinutes <= 0) return error(res, 'Wake time must be after sleep time', 400);

    // Date = calendar date of wake-up
    const date = startOfDay(wakeDate);

    // Upsert: one log per day per user
    const log = await SleepLog.findOneAndUpdate(
      { user: req.user.id, date },
      { user: req.user.id, sleepTime: sleepDate, wakeTime: wakeDate, durationMinutes, quality, notes: notes || '', date },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return success(res, { log }, 'Sleep logged', 201);
  } catch (err) {
    next(err);
  }
};

// ── Get Sleep Logs ────────────────────────────────────────────────────────────
export const getSleepLogs = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = subDays(new Date(), Number(days));

    const logs = await SleepLog.find({
      user: req.user.id,
      date: { $gte: startOfDay(since) },
    }).sort({ date: -1 });

    return success(res, { logs });
  } catch (err) {
    next(err);
  }
};

// ── Sleep Insights ─────────────────────────────────────────────────────────────
export const getSleepInsights = async (req, res, next) => {
  try {
    const since = subDays(new Date(), 30);
    const logs = await SleepLog.find({
      user: req.user.id,
      date: { $gte: startOfDay(since) },
    }).sort({ date: -1 });

    if (logs.length === 0) {
      return success(res, { insights: [], stats: {} });
    }

    // Average duration
    const avgMinutes = Math.round(logs.reduce((a, l) => a + l.durationMinutes, 0) / logs.length);

    // Last 7 days average
    const last7 = logs.slice(0, 7);
    const avg7 = last7.length > 0
      ? Math.round(last7.reduce((a, l) => a + l.durationMinutes, 0) / last7.length)
      : 0;

    // Best day of week
    const byDay = {};
    logs.forEach((l) => {
      const day = new Date(l.date).getDay(); // 0=Sun
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(l.durationMinutes);
    });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let bestDay = null, bestAvg = 0;
    Object.entries(byDay).forEach(([day, mins]) => {
      const avg = mins.reduce((a, b) => a + b, 0) / mins.length;
      if (avg > bestAvg) { bestAvg = avg; bestDay = dayNames[day]; }
    });

    // Under 6h count in last 7 days
    const under6 = last7.filter((l) => l.durationMinutes < 360).length;

    // Weekday vs weekend avg
    const weekdayLogs = logs.filter((l) => {
      const d = new Date(l.date).getDay();
      return d >= 1 && d <= 5;
    });
    const weekdayAvg = weekdayLogs.length > 0
      ? Math.round(weekdayLogs.reduce((a, l) => a + l.durationMinutes, 0) / weekdayLogs.length)
      : 0;

    const fmtHM = (mins) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

    const insights = [];
    if (bestDay) insights.push(`You sleep best on ${bestDay}s (avg ${fmtHM(bestAvg)})`);
    if (weekdayAvg > 0) insights.push(`Weekday average: ${fmtHM(weekdayAvg)}`);
    if (under6 > 0) insights.push(`You had ${under6} night${under6 > 1 ? 's' : ''} under 6 hours this week`);

    return success(res, {
      insights,
      stats: {
        avgMinutes,
        avg7Minutes: avg7,
        totalLogs: logs.length,
        last7: last7.map((l) => ({
          date: l.date,
          durationMinutes: l.durationMinutes,
          quality: l.quality,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};
