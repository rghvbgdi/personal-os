import mongoose from 'mongoose';

const sleepLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sleepTime: { type: Date, required: true },
    wakeTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    quality: { type: Number, min: 1, max: 5, required: true },
    notes: { type: String, maxlength: 500, default: '' },
    date: { type: Date, required: true }, // The calendar date this sleep belongs to (wake date)
  },
  { timestamps: true }
);

sleepLogSchema.index({ user: 1, date: -1 });

export default mongoose.model('SleepLog', sleepLogSchema);
