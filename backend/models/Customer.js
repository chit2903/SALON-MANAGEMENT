import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    role: { type: String, enum: ['admin', 'owner', 'reception', 'user'], default: 'user' },
    birthday: String,
    loyaltyPoints: { type: Number, default: 0 },
    totalVisits: { type: Number, default: 0 },
    joinDate: String,
    notes: String,
  },
  { timestamps: true }
);

export const Customer = mongoose.model('Customer', customerSchema);
