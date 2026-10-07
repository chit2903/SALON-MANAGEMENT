import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    services: [String],
    price: Number,
    discount: Number,
  },
  { timestamps: true }
);

export const Package = mongoose.model('Package', packageSchema);
