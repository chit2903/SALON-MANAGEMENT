import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    customerId: String,
    rating: Number,
    comment: String,
    date: String,
  },
  { timestamps: true }
);

export const Feedback = mongoose.model('Feedback', feedbackSchema);
