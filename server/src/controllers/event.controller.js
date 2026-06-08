import CalendarEvent from '../models/CalendarEvent.js';
import { success, error } from '../utils/response.js';

// ── Create Event ───────────────────────────────────────────────────────────────
export const createEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.create({ ...req.body, user: req.user.id });
    return success(res, { event }, 'Event created', 201);
  } catch (err) {
    next(err);
  }
};

// ── Get Events (by date range) ─────────────────────────────────────────────────
export const getEvents = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { user: req.user.id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate)   query.date.$lte = new Date(endDate);
    }

    const events = await CalendarEvent.find(query).sort({ date: 1, startTime: 1 });
    return success(res, { events });
  } catch (err) {
    next(err);
  }
};

// ── Get a single event ────────────────────────────────────────────────────────
export const getEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findOne({ _id: req.params.id, user: req.user.id });
    if (!event) return error(res, 'Event not found', 404);
    return success(res, { event });
  } catch (err) {
    next(err);
  }
};

// ── Update Event ───────────────────────────────────────────────────────────────
export const updateEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!event) return error(res, 'Event not found', 404);
    return success(res, { event }, 'Event updated');
  } catch (err) {
    next(err);
  }
};

// ── Delete Event ───────────────────────────────────────────────────────────────
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!event) return error(res, 'Event not found', 404);
    return success(res, {}, 'Event deleted');
  } catch (err) {
    next(err);
  }
};
