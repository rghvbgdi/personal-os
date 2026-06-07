import PomodoroSession from '../models/PomodoroSession.js';
import { success } from '../utils/response.js';
import mongoose from 'mongoose';

export const logSession = async (req, res, next) => {
  try {
    const session = await PomodoroSession.create({ ...req.body, user: req.user.id });
    return success(res, { session }, 'Session logged', 201);
  } catch (err) {
    next(err);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const sessions = await PomodoroSession.find({ user: req.user.id })
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();
    return success(res, { sessions });
  } catch (err) {
    next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

    const [todayStats, weekStats, allTimeStats] = await Promise.all([
      PomodoroSession.aggregate([
        { $match: { user: userId, type: 'focus', wasCompleted: true, completedAt: { $gte: startOfDay } } },
        { $group: { _id: null, sessions: { $sum: 1 }, totalMinutes: { $sum: '$duration' } } },
      ]),
      PomodoroSession.aggregate([
        { $match: { user: userId, type: 'focus', wasCompleted: true, completedAt: { $gte: startOfWeek } } },
        { $group: { _id: null, sessions: { $sum: 1 }, totalMinutes: { $sum: '$duration' } } },
      ]),
      PomodoroSession.aggregate([
        { $match: { user: userId, type: 'focus', wasCompleted: true } },
        { $group: { _id: null, sessions: { $sum: 1 }, totalMinutes: { $sum: '$duration' } } },
      ]),
    ]);

    return success(res, {
      today: todayStats[0] || { sessions: 0, totalMinutes: 0 },
      week: weekStats[0] || { sessions: 0, totalMinutes: 0 },
      allTime: allTimeStats[0] || { sessions: 0, totalMinutes: 0 },
    });
  } catch (err) {
    next(err);
  }
};
