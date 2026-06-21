import mongoose from 'mongoose';
import { CATEGORIES } from './Expense.js';

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true, min: 0, max: 12 }, // 0 = yearly budget
    year: { type: Number, required: true },
    totalBudget: { type: Number, default: 0 },
    categories: [
      {
        category: { type: String, enum: CATEGORIES },
        limit: { type: Number, min: 0 },
      },
    ],
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
