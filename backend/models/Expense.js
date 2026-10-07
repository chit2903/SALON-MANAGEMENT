import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    category: String,
    description: String,
    amount: Number,
    date: String,
  },
  { timestamps: true }
);

export const Expense = mongoose.model('Expense', expenseSchema);
