import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    category: String,
    price: Number,
    cost: Number,
    stock: { type: Number, default: 0 },
    lowStockAlert: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
