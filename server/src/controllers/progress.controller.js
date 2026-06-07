import PlacementProgress from '../models/PlacementProgress.js';
import { success } from '../utils/response.js';
import mongoose from 'mongoose';

// Upsert progress for one question
export const upsertProgress = async (req, res, next) => {
  try {
    const { questionId, status, confidence, notes } = req.body;
    const update = { status, confidence: confidence || null, notes: notes || '' };
    if (status === 'done') update.solvedAt = new Date();

    const doc = await PlacementProgress.findOneAndUpdate(
      { user: req.user.id, questionId },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return success(res, { progress: doc });
  } catch (err) {
    next(err);
  }
};

// Get all progress for the current user
export const getProgress = async (req, res, next) => {
  try {
    const items = await PlacementProgress.find({ user: req.user.id }).lean();
    // Return as a map for O(1) lookup on frontend
    const map = {};
    items.forEach((p) => { map[p.questionId] = p; });
    return success(res, { map });
  } catch (err) {
    next(err);
  }
};

// Stats: counts by status
export const getProgressStats = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const stats = await PlacementProgress.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return success(res, { stats });
  } catch (err) {
    next(err);
  }
};
