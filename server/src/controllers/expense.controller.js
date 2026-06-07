import Expense from '../models/Expense.js';
import { success, paginated, error } from '../utils/response.js';

export const createExpense = async (req, res, next) => {
  try {
    const expenseData = { ...req.body, user: req.user.id };
    const expense = await Expense.create(expenseData);

    if (expense.isRecurring && expense.recurringFrequency) {
      // Generate the future occurrences immediately so they reflect in analytics
      const totalOccurrences = expense.recurringOccurrences || 12; // default to 1 year projection
      const generatedExpenses = [];
      let currentDate = new Date(expense.date || Date.now());

      for (let i = 1; i < totalOccurrences; i++) {
        if (expense.recurringFrequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (expense.recurringFrequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (expense.recurringFrequency === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }

        generatedExpenses.push({
          ...expenseData,
          date: new Date(currentDate),
          parentRecurringId: expense._id,
          isRecurring: true,
          recurringOccurrencesLeft: totalOccurrences - i - 1,
        });
      }

      if (generatedExpenses.length > 0) {
        await Expense.insertMany(generatedExpenses);
      }
    }

    return success(res, { expense }, 'Expense added', 201);
  } catch (err) {
    next(err);
  }
};

export const getExpenses = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, category, type, paymentMethod,
      startDate, endDate, search, sortBy = 'date', sortOrder = 'desc',
    } = req.query;

    const filter = { user: req.user.id };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort(sort).skip(skip).limit(Number(limit)).lean(),
      Expense.countDocuments(filter),
    ]);

    return paginated(res, expenses, {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

export const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user.id });
    if (!expense) return error(res, 'Expense not found', 404);
    return success(res, { expense });
  } catch (err) {
    next(err);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) return error(res, 'Expense not found', 404);
    return success(res, { expense }, 'Expense updated');
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!expense) return error(res, 'Expense not found', 404);
    return success(res, {}, 'Expense deleted');
  } catch (err) {
    next(err);
  }
};

export const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [categoryBreakdown, dailyTrend, paymentBreakdown, summary] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.user._id || new (await import('mongoose')).default.Types.ObjectId(req.user.id), type: 'expense', date: { $gte: start, $lte: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id || new (await import('mongoose')).default.Types.ObjectId(req.user.id), date: { $gte: start, $lte: end } } },
        { $group: {
          _id: { day: { $dayOfMonth: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        }},
        { $sort: { '_id.day': 1 } },
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id || new (await import('mongoose')).default.Types.ObjectId(req.user.id), type: 'expense', date: { $gte: start, $lte: end } } },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id || new (await import('mongoose')).default.Types.ObjectId(req.user.id), date: { $gte: start, $lte: end } } },
        { $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avg: { $avg: '$amount' },
        }},
      ]),
    ]);

    return success(res, { categoryBreakdown, dailyTrend, paymentBreakdown, summary });
  } catch (err) {
    next(err);
  }
};

export const getAnalyticsRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    let groupFormat = "%Y-%m-%d"; // Group by Day
    if (diffDays > 60) groupFormat = "%Y-%m"; // Group by Month
    if (diffDays > 730) groupFormat = "%Y"; // Group by Year

    const mongoose = (await import('mongoose')).default;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [categoryBreakdown, trend, paymentBreakdown, summary] = await Promise.all([
      Expense.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: start, $lte: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: start, $lte: end } } },
        { $group: {
          _id: { period: { $dateToString: { format: groupFormat, date: '$date' } }, type: '$type' },
          total: { $sum: '$amount' },
        }},
        { $sort: { '_id.period': 1 } },
      ]),
      Expense.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: start, $lte: end } } },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: start, $lte: end } } },
        { $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avg: { $avg: '$amount' },
        }},
      ]),
    ]);

    return success(res, { categoryBreakdown, trend, paymentBreakdown, summary });
  } catch (err) {
    next(err);
  }
};

export const getYearlyAnalytics = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const mongoose = (await import('mongoose')).default;

    const monthlyTrend = await Expense.aggregate([
      { $match: {
        user: new mongoose.Types.ObjectId(req.user.id),
        date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) },
      }},
      { $group: {
        _id: { month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      }},
      { $sort: { '_id.month': 1 } },
    ]);

    return success(res, { monthlyTrend, year: Number(year) });
  } catch (err) {
    next(err);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    
    let startOfCurrent, endOfCurrent, startOfLast, endOfLast;
    
    if (req.query.startDate && req.query.endDate) {
      startOfCurrent = new Date(req.query.startDate);
      endOfCurrent = new Date(req.query.endDate);
      const diff = endOfCurrent.getTime() - startOfCurrent.getTime();
      startOfLast = new Date(startOfCurrent.getTime() - diff);
      endOfLast = new Date(startOfCurrent.getTime() - 1);
    } else {
      startOfCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
      endOfCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      startOfLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endOfLast = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    const [currentMonth, lastMonth, recentExpenses, topCategories] = await Promise.all([
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startOfCurrent, $lte: endOfCurrent } } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startOfLast, $lte: endOfLast } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),
      Expense.find({ user: userId, date: { $lte: now } }).sort({ date: -1 }).limit(10).lean(),
      Expense.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: startOfCurrent, $lte: endOfCurrent } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const toMap = (arr) => arr.reduce((acc, { _id, total, count }) => {
      acc[_id] = { total, count };
      return acc;
    }, {});

    return success(res, {
      currentMonth: toMap(currentMonth),
      lastMonth: toMap(lastMonth),
      recentExpenses,
      topCategories,
    });
  } catch (err) {
    next(err);
  }
};
