import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'owner', 'reception', 'user'], default: 'user' },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
