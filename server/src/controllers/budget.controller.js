import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import { success, error } from '../utils/response.js';
import mongoose from 'mongoose';

export const getOrCreateBudget = async (req, res, next) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear(), startDate, endDate } = req.query;
    let budget = await Budget.findOne({ user: req.user.id, month: Number(month), year: Number(year) });
    if (!budget) {
      budget = await Budget.create({ user: req.user.id, month: Number(month), year: Number(year) });
    }

    const start = startDate ? new Date(startDate) : new Date(year, month - 1, 1);
    const end = endDate ? new Date(endDate) : new Date(year, month, 0, 23, 59, 59);

    const spending = await Expense.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id), type: 'expense', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const spendingMap = spending.reduce((acc, { _id, spent }) => ({ ...acc, [_id]: spent }), {});

    return success(res, { budget, spendingMap });
  } catch (err) {
    next(err);
  }
};

export const upsertBudget = async (req, res, next) => {
  try {
    const { month, year, totalBudget, categories } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { user: req.user.id, month, year },
      { totalBudget, categories },
      { new: true, upsert: true, runValidators: true }
    );
    return success(res, { budget }, 'Budget saved');
  } catch (err) {
    next(err);
  }
};
