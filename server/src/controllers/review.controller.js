import DailyReview from '../models/DailyReview.js';
import { success, error } from '../utils/response.js';
import { startOfDay } from '../utils/dateHelpers.js';

// ── Save / Update Review ───────────────────────────────────────────────────────
export const upsertReview = async (req, res, next) => {
  try {
    const { date, intention, accomplishments, improvements, dayRating } = req.body;
    const reviewDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());

    const review = await DailyReview.findOneAndUpdate(
      { user: req.user.id, date: reviewDate },
      { user: req.user.id, date: reviewDate, intention, accomplishments, improvements, dayRating },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return success(res, { review }, 'Review saved');
  } catch (err) {
    next(err);
  }
};

// ── Get Review by date ─────────────────────────────────────────────────────────
export const getReview = async (req, res, next) => {
  try {
    const { date } = req.query;
    const reviewDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());

    const review = await DailyReview.findOne({ user: req.user.id, date: reviewDate });
    return success(res, { review: review || null });
  } catch (err) {
    next(err);
  }
};
