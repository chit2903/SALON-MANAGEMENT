import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    salonId: String,
    customerId: String,
    customerName: String,
    customerPhone: String,
    staffId: String,
    serviceId: String,
    serviceName: String,
    date: String,
    time: String,
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'no-show'], default: 'scheduled' },
    notes: String,
    originalPrice: Number,
    offerId: String,
    offerName: String,
    discountAmount: Number,
    amount: Number,
    offerAmount: Number,
  },
  { timestamps: true }
);

export const Appointment = mongoose.model('Appointment', appointmentSchema);
