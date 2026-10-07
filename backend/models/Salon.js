import mongoose from 'mongoose';

const serviceSubSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  duration: Number,
  price: Number,
  category: String,
});

const salonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    city: String,
    description: String,
    address: String,
    phone: String,
    email: String,
    image: String,
    rating: { type: Number, default: 0 },
    openTime: String,
    closeTime: String,
    services: [serviceSubSchema],
  },
  { timestamps: true }
);

export const Salon = mongoose.model('Salon', salonSchema);
