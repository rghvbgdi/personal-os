import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  minutesBefore: { type: Number, required: true },
  triggerTime: { type: Date, required: true },
  isDelivered: { type: Boolean, default: false },
  deliveredAt: { type: Date, default: null },
});

const calendarEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 2000, default: '' },
    type: {
      type: String,
      enum: ['standup', '1on1', 'meeting', 'call', 'deadline', 'personal', 'other'],
      default: 'other',
    },
    date: { type: Date, required: true },
    startTime: { type: String, default: '' },   // HH:MM
    endTime: { type: String, default: '' },     // HH:MM
    location: { type: String, default: '' },
    attendees: { type: String, default: '' },
    color: { type: String, default: '#6c63ff' },
    reminders: { type: [reminderSchema], default: [] },
    repeat: { type: String, enum: ['none', 'daily', 'weekly', 'weekdays', 'custom'], default: 'none' },
    isAllDay: { type: Boolean, default: false },
  },
  { timestamps: true }
);

calendarEventSchema.index({ user: 1, date: 1 });

export default mongoose.model('CalendarEvent', calendarEventSchema);
