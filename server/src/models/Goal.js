import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: 80,
    },
    description: { type: String, trim: true, maxlength: 300 },
    targetAmount: { type: Number, required: true, min: 1 },
    savedAmount: { type: Number, default: 0, min: 0 },
    type: {
      type: String,
      enum: ['savings', 'emergency', 'investment', 'purchase', 'travel', 'other'],
      default: 'savings',
    },
    deadline: { type: Date },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    color: { type: String, default: '#059669' },
  },
  { timestamps: true }
);

goalSchema.index({ user: 1, isCompleted: 1 });

goalSchema.virtual('progressPercent').get(function () {
  return Math.min(100, Math.round((this.savedAmount / this.targetAmount) * 100));
});

goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

export default mongoose.model('Goal', goalSchema);
