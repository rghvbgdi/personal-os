import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import CalendarEvent from '../models/CalendarEvent.js';
import TodoTask from '../models/TodoTask.js';
import { success, error } from '../utils/response.js';
import { env } from '../config/env.js';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  env.VAPID_EMAIL,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY,
);

// ── Subscribe ──────────────────────────────────────────────────────────────────
export const subscribe = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) return error(res, 'Invalid subscription object', 400);

    await PushSubscription.findOneAndUpdate(
      { user: req.user.id },
      { user: req.user.id, subscription },
      { upsert: true, new: true }
    );

    return success(res, {}, 'Subscribed to push notifications');
  } catch (err) {
    next(err);
  }
};

// ── Get VAPID Public Key ───────────────────────────────────────────────────────
export const getVapidKey = async (req, res, next) => {
  try {
    return success(res, { publicKey: env.VAPID_PUBLIC_KEY });
  } catch (err) {
    next(err);
  }
};

// ── Send Test Notification ─────────────────────────────────────────────────────
export const sendTest = async (req, res, next) => {
  try {
    const sub = await PushSubscription.findOne({ user: req.user.id });
    if (!sub) return error(res, 'No push subscription found. Enable notifications first.', 404);

    await webpush.sendNotification(sub.subscription, JSON.stringify({
      title: '🔔 Personal OS',
      body: 'Notifications are working!',
      url: '/',
    }));

    return success(res, {}, 'Test notification sent');
  } catch (err) {
    next(err);
  }
};

// ── Get Pending Reminders ──────────────────────────────────────────────────────
export const getPending = async (req, res, next) => {
  try {
    const events = await CalendarEvent.find({
      user: req.user.id,
      'reminders.isDelivered': false,
      'reminders.triggerTime': { $gte: new Date() },
    });

    const tasks = await TodoTask.find({
      user: req.user.id,
      'reminder.enabled': true,
      'reminder.isDelivered': false,
      'reminder.triggerTime': { $gte: new Date() },
    });

    return success(res, { events, tasks });
  } catch (err) {
    next(err);
  }
};

// ── Send Push (used internally by cron job) ────────────────────────────────────
export const sendPushToUser = async (userId, payload) => {
  const sub = await PushSubscription.findOne({ user: userId });
  if (!sub) return false;

  try {
    await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
    return true;
  } catch (err) {
    // Subscription expired or invalid — clean it up
    if (err.statusCode === 410 || err.statusCode === 404) {
      await PushSubscription.findOneAndDelete({ user: userId });
    }
    return false;
  }
};
