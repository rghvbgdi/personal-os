import mongoose from 'mongoose';

const subTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
});

const todoTaskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 2000, default: '' },
    priority: { type: String, enum: ['p1', 'p2', 'p3', 'p4'], default: 'p3' },
    status: { type: String, enum: ['todo', 'inprogress', 'blocked', 'done'], default: 'todo' },
    category: {
      type: String,
      enum: ['code-review', 'feature', 'bug-fix', 'meeting-prep', 'documentation', 'learning', 'admin', 'other',
             'assignment', 'revision', 'practice', 'reading'],
      default: 'other',
    },
    segment: { type: String, enum: ['work', 'student'], required: true, default: 'work' },
    dueDate: { type: Date, default: null },
    dueTime: { type: String, default: null }, // HH:MM
    projectTag: { type: String, trim: true, default: '' },
    subject: { type: String, default: '' }, // student only
    type: { type: String, default: '' },    // student only
    resourceUrl: { type: String, default: '' },
    effortEstimate: { type: String, enum: ['30min', '1hr', '2hr', 'half-day', 'full-day', ''], default: '' },
    subTasks: { type: [subTaskSchema], default: [] },
    tags: { type: [String], default: [] },
    notes: { type: String, default: '' },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String, default: null },
    reminder: {
      enabled: { type: Boolean, default: false },
      minutesBefore: { type: Number, default: 30 },
      triggerTime: { type: Date, default: null },
      isDelivered: { type: Boolean, default: false },
    },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

todoTaskSchema.index({ user: 1, dueDate: 1 });
todoTaskSchema.index({ user: 1, status: 1 });
todoTaskSchema.index({ user: 1, segment: 1 });
todoTaskSchema.index({ user: 1, isCompleted: 1 });

export default mongoose.model('TodoTask', todoTaskSchema);
