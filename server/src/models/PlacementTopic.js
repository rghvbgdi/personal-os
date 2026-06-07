import mongoose from 'mongoose';

const SUBJECTS = ['dsa', 'oops', 'dbms', 'cn', 'os', 'system-design', 'projects'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const MASTERY_LEVELS = ['not-started', 'learning', 'practicing', 'confident', 'mastered'];

const placementTopicSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, enum: SUBJECTS, required: true },
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
      maxlength: 100,
    },
    difficulty: { type: String, enum: DIFFICULTIES, default: 'medium' },
    mastery: { type: String, enum: MASTERY_LEVELS, default: 'not-started' },
    notes: { type: String, trim: true, maxlength: 5000 },
    tags: [{ type: String, trim: true }],
    isFavorite: { type: Boolean, default: false },
    isRevisionDue: { type: Boolean, default: false },
    lastRevisedAt: { type: Date },
    revisionCount: { type: Number, default: 0 },
    timeSpentMinutes: { type: Number, default: 0 },
    sourceUrl: { type: String },
    sheet: {
      type: String,
      enum: ['striver', 'blind75', 'neetcode', 'custom', null],
      default: null,
    },
    sheetOrder: { type: Number },
    isSolved: { type: Boolean, default: false },
    solvedAt: { type: Date },
    mistakeNotes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

placementTopicSchema.index({ user: 1, subject: 1 });
placementTopicSchema.index({ user: 1, mastery: 1 });
placementTopicSchema.index({ user: 1, isFavorite: 1 });

export default mongoose.model('PlacementTopic', placementTopicSchema);
export { SUBJECTS, DIFFICULTIES, MASTERY_LEVELS };
