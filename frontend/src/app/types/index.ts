export type UserRole = 'admin' | 'owner' | 'reception' | 'user';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
}

export interface Appointment {
  id: string;
  salonId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  staffId?: string;
  serviceId: string;
  serviceName?: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  originalPrice?: number;
  offerId?: string;
  offerName?: string;
  discountAmount?: number;
  amount?: number;
  offerAmount?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: UserRole;
  birthday?: string;
  loyaltyPoints: number;
  totalVisits: number;
  joinDate: string;
  notes?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  commissionRate: number;
  joinDate: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number; // minutes
  price: number;
  category: string;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  services: string[]; // service IDs
  price: number;
  discount: number;
}

export interface Membership {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // days
  benefits: string[];
}

export interface CustomerMembership {
  id: string;
  customerId: string;
  membershipId: string;
  startDate: string;
  endDate: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  lowStockAlert: number;
}

export interface Invoice {
  id: string;
  customerId?: string;
  items: InvoiceItem[];
  total: number;
  discount?: number;
  tax?: number;
  grandTotal: number;
  paymentMethod: string;
  date: string;
  staffId: string;
}

export interface InvoiceItem {
  type: 'service' | 'product' | 'package';
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Expense {
  id: string;
  category: string;
  description?: string;
  amount: number;
  date: string;
}

export interface Feedback {
  id: string;
  customerId?: string;
  rating: number;
  comment?: string;
  date: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  date: string;
}

export interface Offer {
  id: string;
  name: string;
  description?: string;
  salonId?: string;
  salonName?: string;
  serviceId?: string;
  serviceName?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  customerId?: string;
  customerName?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface GiftCard {
  id: string;
  code: string;
  value: number;
  balance: number;
  issuedDate: string;
  expiryDate?: string;
  active: boolean;
}

export interface GalleryImage {
  id: string;
  url: string;
  title?: string;
  description?: string;
  uploadDate: string;
}

export interface Salon {
  id: string;
  name: string;
  city?: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  image: string;
  rating: number;
  openTime?: string;
  closeTime?: string;
  services: Service[];
}

export interface Attendance {
  id: string;
  staffId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late';
}

export interface Database {
  users: User[];
  salons: Salon[];
  appointments: Appointment[];
  customers: Customer[];
  staff: Staff[];
  services: Service[];
  packages: Package[];
  memberships: Membership[];
  customerMemberships: CustomerMembership[];
  products: Product[];
  invoices: Invoice[];
  expenses: Expense[];
  feedback: Feedback[];
  notifications: Notification[];
  offers: Offer[];
  coupons: Coupon[];
  giftCards: GiftCard[];
  gallery: GalleryImage[];
  attendance: Attendance[];
}
