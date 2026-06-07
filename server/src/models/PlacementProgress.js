import mongoose from 'mongoose';

const STATUSES = ['todo', 'solving', 'done', 'revise'];

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionId: { type: String, required: true },
    status: { type: String, enum: STATUSES, default: 'todo' },
    confidence: { type: Number, min: 1, max: 5, default: null },
    notes: { type: String, trim: true, maxlength: 1000 },
    solvedAt: { type: Date },
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, questionId: 1 }, { unique: true });

export default mongoose.model('PlacementProgress', progressSchema);
export { STATUSES };
