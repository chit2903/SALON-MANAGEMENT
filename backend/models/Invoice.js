import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  type: { type: String, enum: ['service', 'product', 'package'] },
  itemId: String,
  name: String,
  quantity: Number,
  price: Number,
});

const invoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    customerId: String,
    items: [invoiceItemSchema],
    total: Number,
    discount: Number,
    tax: Number,
    grandTotal: Number,
    paymentMethod: String,
    date: String,
    staffId: String,
  },
  { timestamps: true }
);

export const Invoice = mongoose.model('Invoice', invoiceSchema);
