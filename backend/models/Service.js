import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    duration: Number,
    price: Number,
    category: String,
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', serviceSchema);
