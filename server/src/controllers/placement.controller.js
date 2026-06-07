import PlacementTopic from '../models/PlacementTopic.js';
import { success, error, paginated } from '../utils/response.js';
import mongoose from 'mongoose';

export const createTopic = async (req, res, next) => {
  try {
    const topic = await PlacementTopic.create({ ...req.body, user: req.user.id });
    return success(res, { topic }, 'Topic created', 201);
  } catch (err) {
    next(err);
  }
};

export const getTopics = async (req, res, next) => {
  try {
    const { subject, mastery, isFavorite, sheet, search, page = 1, limit = 50 } = req.query;
    const filter = { user: req.user.id };
    if (subject) filter.subject = subject;
    if (mastery) filter.mastery = mastery;
    if (isFavorite !== undefined) filter.isFavorite = isFavorite === 'true';
    if (sheet) filter.sheet = sheet;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [topics, total] = await Promise.all([
      PlacementTopic.find(filter).sort({ sheetOrder: 1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      PlacementTopic.countDocuments(filter),
    ]);

    return paginated(res, topics, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

export const updateTopic = async (req, res, next) => {
  try {
    const topic = await PlacementTopic.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!topic) return error(res, 'Topic not found', 404);
    return success(res, { topic }, 'Topic updated');
  } catch (err) {
    next(err);
  }
};

export const deleteTopic = async (req, res, next) => {
  try {
    const topic = await PlacementTopic.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!topic) return error(res, 'Topic not found', 404);
    return success(res, {}, 'Topic deleted');
  } catch (err) {
    next(err);
  }
};

export const getPlacementStats = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const stats = await PlacementTopic.aggregate([
      { $match: { user: userId } },
      { $group: {
        _id: { subject: '$subject', mastery: '$mastery' },
        count: { $sum: 1 },
      }},
    ]);

    const subjectStats = await PlacementTopic.aggregate([
      { $match: { user: userId } },
      { $group: {
        _id: '$subject',
        total: { $sum: 1 },
        solved: { $sum: { $cond: ['$isSolved', 1, 0] } },
        mastered: { $sum: { $cond: [{ $eq: ['$mastery', 'mastered'] }, 1, 0] } },
      }},
    ]);

    return success(res, { stats, subjectStats });
  } catch (err) {
    next(err);
  }
};

export const markRevision = async (req, res, next) => {
  try {
    const topic = await PlacementTopic.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        $inc: { revisionCount: 1 },
        lastRevisedAt: new Date(),
        isRevisionDue: false,
      },
      { new: true }
    );
    if (!topic) return error(res, 'Topic not found', 404);
    return success(res, { topic }, 'Revision marked');
  } catch (err) {
    next(err);
  }
};
