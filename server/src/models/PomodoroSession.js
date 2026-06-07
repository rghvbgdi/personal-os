import mongoose from 'mongoose';

const pomodoroSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['focus', 'short-break', 'long-break'],
      default: 'focus',
    },
    duration: { type: Number, required: true },
    taskName: { type: String, trim: true, maxlength: 100 },
    subject: { type: String, default: null },
    completedAt: { type: Date, default: Date.now },
    wasCompleted: { type: Boolean, default: true },
  },
  { timestamps: true }
);

pomodoroSchema.index({ user: 1, completedAt: -1 });

export default mongoose.model('PomodoroSession', pomodoroSchema);
