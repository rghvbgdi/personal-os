import mongoose from 'mongoose';

const EXPENSE_CATEGORIES = [
  'food', 'transport', 'rent', 'groceries', 'utilities', 'entertainment',
  'health', 'education', 'shopping', 'subscriptions', 'travel', 'personal', 
  'emi', 'maid', 'internet', 'philanthropy', 'family', 'grooming', 'other',
];

const INCOME_CATEGORIES = [
  'salary', 'freelance', 'bonus', 'interest', 'other-income',
];

const INVESTMENT_CATEGORIES = [
  'sip', 'stocks', 'fd', 'crypto', 'gold', 'ppf', 'emergency-fund', 'savings-account',
];

const CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...INVESTMENT_CATEGORIES];
const PAYMENT_METHODS = ['upi', 'cash', 'card', 'netbanking', 'wallet', 'other'];

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['expense', 'income', 'investment'],
      default: 'expense',
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, 'Category is required'],
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'upi',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    subItems: [{
      name: { type: String, required: true },
      amount: { type: Number, required: true },
    }],
    tags: [{ type: String, trim: true, maxlength: 30 }],
    notes: { type: String, trim: true, maxlength: 500 },
    // Recurring Expenses
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly', null],
      default: null,
    },
    recurringEndDate: { type: Date, default: null }, // e.g., Lease end date
    recurringOccurrences: { type: Number, default: null }, // e.g., 6 for a 6-month EMI
    recurringOccurrencesLeft: { type: Number, default: null },
    nextRecurringDate: { type: Date, default: null }, // Tracking when the next expense fires
    recurringStatus: {
      type: String,
      enum: ['active', 'paused', 'completed', null],
      default: null,
    },
    parentRecurringId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', default: null },

    // Flatmate/Group Splitting (Bangalore lifestyle)
    isSplit: { type: Boolean, default: false },
    splitDetails: [
      {
        personName: { type: String, required: true },
        amountOwed: { type: Number, required: true },
        isSettled: { type: Boolean, default: false },
      }
    ],

    // Corporate Perks / Reimbursements (WFH setup, Internet, etc.)
    isReimbursable: { type: Boolean, default: false },
    reimbursementStatus: {
      type: String,
      enum: ['pending', 'submitted', 'reimbursed', null],
      default: null,
    },
  },
  { timestamps: true }
);

expenseSchema.pre('save', function (next) {
  if (this.subItems && this.subItems.length > 0) {
    this.amount = this.subItems.reduce((acc, curr) => acc + curr.amount, 0);
  }
  next();
});

expenseSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const subItems = update.subItems || (update.$set && update.$set.subItems);
  
  if (subItems && subItems.length > 0) {
    const sum = subItems.reduce((acc, curr) => acc + curr.amount, 0);
    if (update.$set) {
      update.$set.amount = sum;
    } else {
      update.amount = sum;
    }
  }
  next();
});

expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });
expenseSchema.index({ user: 1, type: 1, date: -1 });

export default mongoose.model('Expense', expenseSchema);
export { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, INVESTMENT_CATEGORIES, PAYMENT_METHODS };
