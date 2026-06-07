import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 120,
    },
    content: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    isPinned: { type: Boolean, default: false },
    color: { type: String, default: null },
    linkedTopic: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementTopic', default: null },
  },
  { timestamps: true }
);

noteSchema.index({ user: 1, updatedAt: -1 });
noteSchema.index({ user: 1, isPinned: 1 });

export default mongoose.model('Note', noteSchema);
