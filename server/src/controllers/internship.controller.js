import InternshipConfig from '../models/InternshipConfig.js';
import { success, error } from '../utils/response.js';

// ── Save / Update Internship Config ───────────────────────────────────────────
export const upsertInternship = async (req, res, next) => {
  try {
    const { companyName, role, startDate, endDate } = req.body;

    const config = await InternshipConfig.findOneAndUpdate(
      { user: req.user.id },
      { user: req.user.id, companyName, role, startDate: new Date(startDate), endDate: new Date(endDate) },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return success(res, { config }, 'Internship config saved');
  } catch (err) {
    next(err);
  }
};

// ── Get Internship Config ──────────────────────────────────────────────────────
export const getInternship = async (req, res, next) => {
  try {
    const config = await InternshipConfig.findOne({ user: req.user.id });
    return success(res, { config: config || null });
  } catch (err) {
    next(err);
  }
};
