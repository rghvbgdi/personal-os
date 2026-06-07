import HabitLog from '../models/HabitLog.js';
import { success, error } from '../utils/response.js';

export const createHabit = async (req, res, next) => {
  try {
    const habit = await HabitLog.create({ ...req.body, user: req.user.id });
    return success(res, { habit }, 'Habit created', 201);
  } catch (err) {
    next(err);
  }
};

export const getHabits = async (req, res, next) => {
  try {
    const habits = await HabitLog.find({ user: req.user.id, isActive: true }).sort({ createdAt: 1 }).lean();
    return success(res, { habits });
  } catch (err) {
    next(err);
  }
};

export const checkInHabit = async (req, res, next) => {
  try {
    const habit = await HabitLog.findOne({ _id: req.params.id, user: req.user.id });
    if (!habit) return error(res, 'Habit not found', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alreadyDone = habit.completedDates.some(
      (d) => new Date(d).setHours(0, 0, 0, 0) === today.getTime()
    );
    if (alreadyDone) return error(res, 'Already checked in today', 400);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const doneYesterday = habit.completedDates.some(
      (d) => new Date(d).setHours(0, 0, 0, 0) === yesterday.getTime()
    );

    habit.completedDates.push(today);
    habit.totalCompletions += 1;
    habit.lastCompletedAt = today;
    habit.currentStreak = doneYesterday ? habit.currentStreak + 1 : 1;
    if (habit.currentStreak > habit.longestStreak) habit.longestStreak = habit.currentStreak;

    await habit.save();
    return success(res, { habit }, 'Checked in!');
  } catch (err) {
    next(err);
  }
};

export const updateHabit = async (req, res, next) => {
  try {
    const habit = await HabitLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!habit) return error(res, 'Habit not found', 404);
    return success(res, { habit }, 'Habit updated');
  } catch (err) {
    next(err);
  }
};

export const deleteHabit = async (req, res, next) => {
  try {
    const habit = await HabitLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!habit) return error(res, 'Habit not found', 404);
    return success(res, {}, 'Habit deleted');
  } catch (err) {
    next(err);
  }
};
