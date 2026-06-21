import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import { success } from '../utils/response.js';
import mongoose from 'mongoose';

export const getOrCreateBudget = async (req, res, next) => {
  try {
    const { month = 0, year = new Date().getFullYear() } = req.query;
    const m = Number(month); // 0 = yearly, 1-12 = monthly
    const y = Number(year);

    let budget = await Budget.findOne({ user: req.user.id, month: m, year: y });
    if (!budget) {
      budget = await Budget.create({ user: req.user.id, month: m, year: y });
    }

    // Date range: month=0 means full year
    const start = m === 0 ? new Date(y, 0, 1) : new Date(y, m - 1, 1);
    const end   = m === 0 ? new Date(y, 11, 31, 23, 59, 59) : new Date(y, m, 0, 23, 59, 59);

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
      { user: req.user.id, month: Number(month), year: Number(year) },
      { totalBudget, categories },
      { new: true, upsert: true, runValidators: true }
    );
    return success(res, { budget }, 'Budget saved');
  } catch (err) {
    next(err);
  }
};
