import mongoose from 'mongoose';

const internshipConfigSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('InternshipConfig', internshipConfigSchema);
