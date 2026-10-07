import mongoose from 'mongoose';
import { User } from './User.js';
import { Salon } from './Salon.js';
import { Appointment } from './Appointment.js';
import { Customer } from './Customer.js';
import { Staff } from './Staff.js';
import { Service } from './Service.js';
import { Package } from './Package.js';
import { Membership } from './Membership.js';
import { Invoice } from './Invoice.js';
import { Feedback } from './Feedback.js';
import { Product } from './Product.js';
import { Expense } from './Expense.js';

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  message: String,
  type: { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
  read: { type: Boolean, default: false },
  date: String,
}, { timestamps: true });

const offerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  description: String,
  discountType: String,
  discountValue: Number,
  startDate: String,
  endDate: String,
  active: Boolean,
}, { timestamps: true });

const couponSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: String,
  discountType: String,
  discountValue: Number,
  maxUses: Number,
  usedCount: Number,
  startDate: String,
  endDate: String,
  active: Boolean,
}, { timestamps: true });

const giftCardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: String,
  value: Number,
  balance: Number,
  issuedDate: String,
  expiryDate: String,
  active: Boolean,
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: 'global_settings' },
  businessName: String,
  businessEmail: String,
  timezone: String,
  currency: String,
  emailAlerts: Boolean,
  smsAlerts: Boolean,
  maintenanceMode: Boolean,
}, { timestamps: true, strict: false });

const gallerySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  url: String,
  title: String,
  description: String,
  uploadDate: String,
}, { timestamps: true });

const attendanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  staffId: String,
  date: String,
  checkIn: String,
  checkOut: String,
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
}, { timestamps: true });

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);
export const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
export const GiftCard = mongoose.models.GiftCard || mongoose.model('GiftCard', giftCardSchema);
export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
export const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);
export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

export {
  User,
  Salon,
  Appointment,
  Customer,
  Staff,
  Service,
  Package,
  Membership,
  Invoice,
  Feedback,
  Product,
  Expense,
};

export const models = {
  users: User,
  salons: Salon,
  appointments: Appointment,
  customers: Customer,
  staff: Staff,
  services: Service,
  packages: Package,
  memberships: Membership,
  invoices: Invoice,
  feedback: Feedback,
  notifications: Notification,
  offers: Offer,
  coupons: Coupon,
  giftCards: GiftCard,
  settings: Settings,
  products: Product,
  expenses: Expense,
  gallery: Gallery,
  attendance: Attendance,
};
