import TodoTask from '../models/TodoTask.js';
import { success, error, paginated } from '../utils/response.js';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addDays } from '../utils/dateHelpers.js';

// ── Create Task ────────────────────────────────────────────────────────────────
export const createTask = async (req, res, next) => {
  try {
    const task = await TodoTask.create({ ...req.body, user: req.user.id });
    return success(res, { task }, 'Task created', 201);
  } catch (err) {
    next(err);
  }
};

// ── Get Tasks (with filtering) ─────────────────────────────────────────────────
export const getTasks = async (req, res, next) => {
  try {
    const {
      segment, status, priority, category,
      search, filter, page = 1, limit = 50,
    } = req.query;

    const query = { user: req.user.id };

    if (segment) query.segment = segment;
    if (status)  query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    // Date filters
    const now = new Date();
    if (filter === 'today') {
      query.dueDate = { $gte: startOfDay(now), $lte: endOfDay(now) };
    } else if (filter === 'week') {
      query.dueDate = { $gte: startOfWeek(now), $lte: endOfWeek(now) };
    } else if (filter === 'overdue') {
      query.dueDate = { $lt: startOfDay(now) };
      query.isCompleted = false;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { projectTag: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      TodoTask.find(query).sort({ dueDate: 1, priority: 1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      TodoTask.countDocuments(query),
    ]);

    return paginated(res, tasks, {
      total, page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

// ── Get Tasks Due Today ────────────────────────────────────────────────────────
export const getTasksToday = async (req, res, next) => {
  try {
    const now = new Date();
    const tasks = await TodoTask.find({
      user: req.user.id,
      dueDate: { $gte: startOfDay(now), $lte: endOfDay(now) },
      isCompleted: false,
    }).sort({ priority: 1, dueDate: 1 }).limit(10);
    return success(res, { tasks });
  } catch (err) {
    next(err);
  }
};

// ── Update Task ─────────────────────────────────────────────────────────────────
export const updateTask = async (req, res, next) => {
  try {
    const task = await TodoTask.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) return error(res, 'Task not found', 404);
    return success(res, { task }, 'Task updated');
  } catch (err) {
    next(err);
  }
};

// ── Toggle Complete ─────────────────────────────────────────────────────────────
export const toggleComplete = async (req, res, next) => {
  try {
    const task = await TodoTask.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return error(res, 'Task not found', 404);

    task.isCompleted = !task.isCompleted;
    task.status = task.isCompleted ? 'done' : 'todo';
    task.completedAt = task.isCompleted ? new Date() : null;
    await task.save();
    return success(res, { task }, task.isCompleted ? 'Task completed' : 'Task reopened');
  } catch (err) {
    next(err);
  }
};

// ── Delete Task ─────────────────────────────────────────────────────────────────
export const deleteTask = async (req, res, next) => {
  try {
    const task = await TodoTask.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return error(res, 'Task not found', 404);
    return success(res, {}, 'Task deleted');
  } catch (err) {
    next(err);
  }
};
