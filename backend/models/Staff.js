import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    role: String,
    commissionRate: { type: Number, default: 0 },
    joinDate: String,
  },
  { timestamps: true }
);

export const Staff = mongoose.model('Staff', staffSchema);
