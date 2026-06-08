import mongoose from 'mongoose';

const dailyReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true }, // The date this review is for (midnight UTC)
    intention: { type: String, maxlength: 500, default: '' },  // "What's your #1 goal today?"
    accomplishments: { type: String, maxlength: 2000, default: '' },
    improvements: { type: String, maxlength: 2000, default: '' },
    dayRating: { type: Number, min: 1, max: 5, default: null },
  },
  { timestamps: true }
);

// One review per user per day
dailyReviewSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyReview', dailyReviewSchema);
