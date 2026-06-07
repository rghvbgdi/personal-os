import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
      maxlength: 80,
    },
    icon: { type: String, default: '✅' },
    color: { type: String, default: '#059669' },
    frequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily',
    },
    targetDays: { type: Number, default: 7 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalCompletions: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    completedDates: [{ type: Date }],
    lastCompletedAt: { type: Date },
  },
  { timestamps: true }
);

habitSchema.index({ user: 1, isActive: 1 });

export default mongoose.model('HabitLog', habitSchema);
