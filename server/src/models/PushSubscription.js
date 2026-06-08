import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscription: {
      endpoint: { type: String, required: true },
      keys: {
        auth: { type: String, required: true },
        p256dh: { type: String, required: true },
      },
    },
  },
  { timestamps: true }
);

// One subscription per user (upsert by user)
pushSubscriptionSchema.index({ user: 1 }, { unique: true });

export default mongoose.model('PushSubscription', pushSubscriptionSchema);
