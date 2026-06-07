import Goal from '../models/Goal.js';
import { success, error, paginated } from '../utils/response.js';

export const createGoal = async (req, res, next) => {
  try {
    const goal = await Goal.create({ ...req.body, user: req.user.id });
    return success(res, { goal }, 'Goal created', 201);
  } catch (err) {
    next(err);
  }
};

export const getGoals = async (req, res, next) => {
  try {
    const { isCompleted } = req.query;
    const filter = { user: req.user.id };
    if (isCompleted !== undefined) filter.isCompleted = isCompleted === 'true';
    const goals = await Goal.find(filter).sort({ createdAt: -1 }).lean();
    return success(res, { goals });
  } catch (err) {
    next(err);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!goal) return error(res, 'Goal not found', 404);

    if (goal.savedAmount >= goal.targetAmount && !goal.isCompleted) {
      goal.isCompleted = true;
      goal.completedAt = new Date();
      await goal.save();
    }

    return success(res, { goal }, 'Goal updated');
  } catch (err) {
    next(err);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!goal) return error(res, 'Goal not found', 404);
    return success(res, {}, 'Goal deleted');
  } catch (err) {
    next(err);
  }
};
