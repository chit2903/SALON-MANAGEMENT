import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    price: Number,
    duration: Number,
    benefits: [String],
  },
  { timestamps: true }
);

export const Membership = mongoose.model('Membership', membershipSchema);
