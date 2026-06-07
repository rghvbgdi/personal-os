import Note from '../models/Note.js';
import { success, error } from '../utils/response.js';

export const createNote = async (req, res, next) => {
  try {
    const note = await Note.create({ ...req.body, user: req.user.id });
    return success(res, { note }, 'Note created', 201);
  } catch (err) {
    next(err);
  }
};

export const getNotes = async (req, res, next) => {
  try {
    const { search, tags } = req.query;
    const filter = { user: req.user.id };
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
    if (tags) filter.tags = { $in: tags.split(',') };

    const notes = await Note.find(filter).sort({ isPinned: -1, updatedAt: -1 }).lean();
    return success(res, { notes });
  } catch (err) {
    next(err);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!note) return error(res, 'Note not found', 404);
    return success(res, { note }, 'Note updated');
  } catch (err) {
    next(err);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!note) return error(res, 'Note not found', 404);
    return success(res, {}, 'Note deleted');
  } catch (err) {
    next(err);
  }
};
