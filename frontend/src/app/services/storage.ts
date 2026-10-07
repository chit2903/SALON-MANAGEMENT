import type {
  Database,
  User,
  Appointment,
  Customer,
  Staff,
  Service,
  Package,
  Membership,
  CustomerMembership,
  Product,
  Invoice,
  Expense,
  Feedback,
  Notification,
  Offer,
  Coupon,
  GiftCard,
  GalleryImage,
  Attendance,
  Salon,
} from '../types';
import { api } from './api';

const STORAGE_KEY = 'salon-management-system-db';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getEmptyData = (): Database => ({
  users: [],
  salons: [],
  appointments: [],
  customers: [],
  staff: [],
  services: [],
  packages: [],
  memberships: [],
  customerMemberships: [],
  products: [],
  invoices: [],
  expenses: [],
  feedback: [],
  notifications: [],
  offers: [],
  coupons: [],
  giftCards: [],
  gallery: [],
  attendance: [],
});

export const storage = {
  getDatabase: (): Database => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const db = JSON.parse(data);
        return {
          ...getEmptyData(),
          ...db,
        };
      } catch (e) {
        console.error('Failed to parse database', e);
      }
    }
    const emptyData = getEmptyData();
    storage.setDatabase(emptyData);
    return emptyData;
  },

  setDatabase: (db: Database) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  },

  resetDatabase: () => {
    const emptyData = getEmptyData();
    storage.setDatabase(emptyData);
    return emptyData;
  },

  backup: (): string => {
    return JSON.stringify(storage.getDatabase(), null, 2);
  },

  restore: (jsonData: string) => {
    try {
      const db = JSON.parse(jsonData);
      storage.setDatabase(db);
      return true;
    } catch (e) {
      console.error('Failed to restore database', e);
      return false;
    }
  },

  // Salons
  getSalons: (): Salon[] => storage.getDatabase().salons,
  getSalonById: (id: string): Salon | undefined => storage.getDatabase().salons.find(s => s.id === id),
  createSalon: (salon: Omit<Salon, 'id'>): Salon => {
    const db = storage.getDatabase();
    const newSalon = { ...salon, id: generateId() };
    db.salons.push(newSalon);
    storage.setDatabase(db);
    api.createResource('salons', newSalon);
    return newSalon;
  },
  updateSalon: (id: string, salon: Partial<Salon>): Salon | undefined => {
    const db = storage.getDatabase();
    const index = db.salons.findIndex(s => s.id === id);
    if (index !== -1) {
      db.salons[index] = { ...db.salons[index], ...salon };
      storage.setDatabase(db);
      api.updateResource('salons', id, salon);
      return db.salons[index];
    }
    return undefined;
  },
  deleteSalon: (id: string): boolean => {
    const db = storage.getDatabase();
    const initialLength = db.salons.length;
    db.salons = db.salons.filter(s => s.id !== id);
    storage.setDatabase(db);
    api.deleteResource('salons', id);
    return db.salons.length < initialLength;
  },

  // Users
  getUsers: (): User[] => storage.getDatabase().users,
  getUserById: (id: string): User | undefined => storage.getDatabase().users.find(u => u.id === id),
  getUserByUsername: (username: string): User | undefined => storage.getDatabase().users.find(u => u.username === username),
  createUser: (user: Omit<User, 'id'>): User => {
    const db = storage.getDatabase();
    const newUser = { ...user, id: generateId() };
    db.users.push(newUser);
    storage.setDatabase(db);
    api.createResource('users', newUser);
    return newUser;
  },
  updateUser: (id: string, user: Partial<User>): User | undefined => {
    const db = storage.getDatabase();
    const index = db.users.findIndex(u => u.id === id);
    if (index !== -1) {
      db.users[index] = { ...db.users[index], ...user };
      storage.setDatabase(db);
      api.updateResource('users', id, user);
      return db.users[index];
    }
    return undefined;
  },
  deleteUser: (id: string): boolean => {
    const db = storage.getDatabase();
    const initialLength = db.users.length;
    db.users = db.users.filter(u => u.id !== id);
    storage.setDatabase(db);
    api.deleteResource('users', id);
    return db.users.length < initialLength;
  },

  // Appointments
  getAppointments: (): Appointment[] => storage.getDatabase().appointments,
  getAppointmentById: (id: string): Appointment | undefined => storage.getDatabase().appointments.find(a => a.id === id),
  createAppointment: (appointment: Omit<Appointment, 'id'>): Appointment => {
    const db = storage.getDatabase();
    const newAppointment = { ...appointment, id: generateId() };
    db.appointments.push(newAppointment);
    storage.setDatabase(db);
    api.createResource('appointments', newAppointment);
    return newAppointment;
  },
  updateAppointment: (id: string, appointment: Partial<Appointment>): Appointment | undefined => {
    const db = storage.getDatabase();
    const index = db.appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      db.appointments[index] = { ...db.appointments[index], ...appointment };
      storage.setDatabase(db);
      api.updateResource('appointments', id, appointment);
      return db.appointments[index];
    }
    return undefined;
  },
  deleteAppointment: (id: string): boolean => {
    const db = storage.getDatabase();
    const initialLength = db.appointments.length;
    db.appointments = db.appointments.filter(a => a.id !== id);
    storage.setDatabase(db);
    api.deleteResource('appointments', id);
    return db.appointments.length < initialLength;
  },

  // Customers
  getCustomers: (): Customer[] => storage.getDatabase().customers,
  getCustomerById: (id: string): Customer | undefined => storage.getDatabase().customers.find(c => c.id === id),
  createCustomer: (customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalVisits' | 'joinDate'> & { role?: any }): Customer => {
    const db = storage.getDatabase();
    const newCustomer = { 
      ...customer, 
      id: generateId(), 
      role: customer.role || 'user',
      loyaltyPoints: 0, 
      totalVisits: 0, 
      joinDate: new Date().toISOString().split('T')[0] 
    };
    db.customers.push(newCustomer);
    storage.setDatabase(db);
    api.createResource('customers', newCustomer);
    return newCustomer;
  },
  updateCustomer: (id: string, customer: Partial<Customer>): Customer | undefined => {
    const db = storage.getDatabase();
    const index = db.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      db.customers[index] = { ...db.customers[index], ...customer };
      storage.setDatabase(db);
      api.updateResource('customers', id, customer);
      return db.customers[index];
    }
    return undefined;
  },
  deleteCustomer: (id: string): boolean => {
    const db = storage.getDatabase();
    const initialLength = db.customers.length;
    db.customers = db.customers.filter(c => c.id !== id);
    storage.setDatabase(db);
    api.deleteResource('customers', id);
    return db.customers.length < initialLength;
  },

  // Staff
  getStaff: (): Staff[] => storage.getDatabase().staff,
  getStaffById: (id: string): Staff | undefined => storage.getDatabase().staff.find(s => s.id === id),
  createStaff: (staff: Omit<Staff, 'id'>): Staff => {
    const db = storage.getDatabase();
    const newStaff = { ...staff, id: generateId() };
    db.staff.push(newStaff);
    storage.setDatabase(db);
    api.createResource('staff', newStaff);
    return newStaff;
  },
  updateStaff: (id: string, staff: Partial<Staff>): Staff | undefined => {
    const db = storage.getDatabase();
    const index = db.staff.findIndex(s => s.id === id);
    if (index !== -1) {
      db.staff[index] = { ...db.staff[index], ...staff };
      storage.setDatabase(db);
      api.updateResource('staff', id, staff);
      return db.staff[index];
    }
    return undefined;
  },
  deleteStaff: (id: string): boolean => {
    const db = storage.getDatabase();
    const initialLength = db.staff.length;
    db.staff = db.staff.filter(s => s.id !== id);
    storage.setDatabase(db);
    api.deleteResource('staff', id);
    return db.staff.length < initialLength;
  },

  // Services
  getServices: (): Service[] => {
    const db = storage.getDatabase();
    const salonServices = (db.salons || []).flatMap((s) => s.services || []);
    const rawServices = [...(db.services || []), ...salonServices];

    // Filter out corrupted/test service names like 'user000' or empty names
    const validServices = rawServices.filter(
      (s) => s && s.name && s.name.trim() !== '' && !/^user\d+$/i.test(s.name.trim())
    );

    if (validServices.length > 0) {
      const uniqueMap = new Map<string, Service>();
      validServices.forEach((s) => {
        if (!uniqueMap.has(s.name.toLowerCase())) {
          uniqueMap.set(s.name.toLowerCase(), s);
        }
      });
      return Array.from(uniqueMap.values());
    }

    return [
      { id: 'srv-1', name: 'Haircut & Styling', description: 'Professional haircut and styling', duration: 45, price: 350, category: 'Hair' },
      { id: 'srv-2', name: 'Facial & Glow Treatment', description: 'Deep cleansing facial', duration: 60, price: 600, category: 'Skin' },
      { id: 'srv-3', name: 'Hair Coloring & Highlights', description: 'Premium hair color', duration: 90, price: 1200, category: 'Hair' },
      { id: 'srv-4', name: 'Manicure & Pedicure', description: 'Nail care and polish', duration: 60, price: 500, category: 'Nails' },
      { id: 'srv-5', name: 'Relaxing Spa Massage', description: 'Full body spa massage', duration: 60, price: 1500, category: 'Spa' },
    ];
  },
  getServiceById: (id: string): Service | undefined => storage.getServices().find(s => s.id === id),
  createService: (service: Omit<Service, 'id'>): Service => {
    const db = storage.getDatabase();
    const newService = { ...service, id: generateId() };
    db.services.push(newService);
    storage.setDatabase(db);
    api.createResource('services', newService);
    return newService;
  },
  updateService: (id: string, service: Partial<Service>): Service | undefined => {
    const db = storage.getDatabase();
    const index = db.services.findIndex(s => s.id === id);
    if (index !== -1) {
      db.services[index] = { ...db.services[index], ...service };
      storage.setDatabase(db);
      api.updateResource('services', id, service);
      return db.services[index];
    }
    return undefined;
  },
  deleteService: (id: string): boolean => {
    const db = storage.getDatabase();
    const initialLength = db.services.length;
    db.services = db.services.filter(s => s.id !== id);
    storage.setDatabase(db);
    api.deleteResource('services', id);
    return db.services.length < initialLength;
  },

  // Packages
  getPackages: (): Package[] => storage.getDatabase().packages,
  getPackageById: (id: string): Package | undefined => storage.getDatabase().packages.find(p => p.id === id),
  createPackage: (pkg: Omit<Package, 'id'>): Package => {
    const db = storage.getDatabase();
    const newPackage = { ...pkg, id: generateId() };
    db.packages.push(newPackage);
    storage.setDatabase(db);
    api.createResource('packages', newPackage);
    return newPackage;
  },
  updatePackage: (id: string, pkg: Partial<Package>): Package | undefined => {
    const db = storage.getDatabase();
    const index = db.packages.findIndex(p => p.id === id);
    if (index !== -1) {
      db.packages[index] = { ...db.packages[index], ...pkg };
      storage.setDatabase(db);
      api.updateResource('packages', id, pkg);
      return db.packages[index];
    }
    return undefined;
  },
  deletePackage: (id: string): boolean => {
    const db = storage.getDatabase();
    const initialLength = db.packages.length;
    db.packages = db.packages.filter(p => p.id !== id);
    storage.setDatabase(db);
    api.deleteResource('packages', id);
    return db.packages.length < initialLength;
  },

  // Memberships
  getMemberships: (): Membership[] => storage.getDatabase().memberships,
  getMembershipById: (id: string): Membership | undefined => storage.getDatabase().memberships.find(m => m.id === id),
  createMembership: (membership: Omit<Membership, 'id'>): Membership => {
    const db = storage.getDatabase();
    const newMembership = { ...membership, id: generateId() };
    db.memberships.push(newMembership);
    storage.setDatabase(db);
    api.createResource('memberships', newMembership);
    return newMembership;
  },

  // Products
  getProducts: (): Product[] => storage.getDatabase().products,
  getProductById: (id: string): Product | undefined => storage.getDatabase().products.find(p => p.id === id),
  createProduct: (product: Omit<Product, 'id'>): Product => {
    const db = storage.getDatabase();
    const newProduct = { ...product, id: generateId() };
    db.products.push(newProduct);
    storage.setDatabase(db);
    api.createResource('products', newProduct);
    return newProduct;
  },
  updateProduct: (id: string, product: Partial<Product>): Product | undefined => {
    const db = storage.getDatabase();
    const index = db.products.findIndex(p => p.id === id);
    if (index !== -1) {
      db.products[index] = { ...db.products[index], ...product };
      storage.setDatabase(db);
      api.updateResource('products', id, product);
      return db.products[index];
    }
    return undefined;
  },
  deleteProduct: (id: string): boolean => {
    const db = storage.getDatabase();
    const initialLength = db.products.length;
    db.products = db.products.filter(p => p.id !== id);
    storage.setDatabase(db);
    api.deleteResource('products', id);
    return db.products.length < initialLength;
  },

  // Invoices
  getInvoices: (): Invoice[] => storage.getDatabase().invoices,
  createInvoice: (invoice: Omit<Invoice, 'id' | 'date'>): Invoice => {
    const db = storage.getDatabase();
    const existingInvoices = db.invoices || [];
    
    // Find highest numeric ID or count to start from 0001
    let maxIdNum = 0;
    existingInvoices.forEach((inv) => {
      const parsed = parseInt(String(inv.id).replace(/\D/g, ''), 10);
      if (!isNaN(parsed) && parsed > maxIdNum) {
        maxIdNum = parsed;
      }
    });

    const nextSeqNum = maxIdNum + 1;
    const formattedId = String(nextSeqNum).padStart(4, '0');

    const newInvoice = {
      ...invoice,
      id: formattedId,
      date: new Date().toISOString().split('T')[0],
    };
    db.invoices.push(newInvoice);
    storage.setDatabase(db);
    api.createResource('invoices', newInvoice);
    return newInvoice;
  },

  // Expenses
  getExpenses: (): Expense[] => storage.getDatabase().expenses,
  createExpense: (expense: Omit<Expense, 'id' | 'date'>): Expense => {
    const db = storage.getDatabase();
    const newExpense = {
      ...expense,
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
    };
    db.expenses.push(newExpense);
    storage.setDatabase(db);
    api.createResource('expenses', newExpense);
    return newExpense;
  },

  // Feedback
  getFeedback: (): Feedback[] => storage.getDatabase().feedback,
  createFeedback: (feedback: Omit<Feedback, 'id' | 'date'>): Feedback => {
    const db = storage.getDatabase();
    const newFeedback = {
      ...feedback,
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
    };
    db.feedback.push(newFeedback);
    storage.setDatabase(db);
    api.createResource('feedback', newFeedback);
    return newFeedback;
  },

  // Notifications
  getNotifications: (): Notification[] => storage.getDatabase().notifications,
  markNotificationAsRead: (id: string) => {
    const db = storage.getDatabase();
    const notification = db.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      storage.setDatabase(db);
      api.updateResource('notifications', id, { read: true });
    }
  },

  // Offers
  getOffers: (): Offer[] => storage.getDatabase().offers,
  createOffer: (offer: Omit<Offer, 'id'>): Offer => {
    const db = storage.getDatabase();
    const newOffer = { ...offer, id: generateId() };
    db.offers.push(newOffer);
    storage.setDatabase(db);
    api.createResource('offers', newOffer);
    return newOffer;
  },
  updateOffer: (id: string, offer: Partial<Offer>): Offer | undefined => {
    const db = storage.getDatabase();
    const index = db.offers.findIndex(o => o.id === id);
    if (index !== -1) {
      db.offers[index] = { ...db.offers[index], ...offer };
      storage.setDatabase(db);
      api.updateResource('offers', id, offer);
      return db.offers[index];
    }
    return undefined;
  },
  deleteOffer: (id: string): boolean => {
    const db = storage.getDatabase();
    const initialLength = db.offers.length;
    db.offers = db.offers.filter(o => o.id !== id);
    storage.setDatabase(db);
    api.deleteResource('offers', id);
    return db.offers.length < initialLength;
  },

  // Coupons
  getCoupons: (): Coupon[] => storage.getDatabase().coupons,
  createCoupon: (coupon: Omit<Coupon, 'id' | 'usedCount'>): Coupon => {
    const db = storage.getDatabase();
    const newCoupon = { ...coupon, id: generateId(), usedCount: 0 };
    db.coupons.push(newCoupon);
    storage.setDatabase(db);
    api.createResource('coupons', newCoupon);
    return newCoupon;
  },
  updateCoupon: (id: string, coupon: Partial<Coupon>): Coupon | undefined => {
    const db = storage.getDatabase();
    const index = db.coupons.findIndex(c => c.id === id);
    if (index !== -1) {
      db.coupons[index] = { ...db.coupons[index], ...coupon };
      storage.setDatabase(db);
      api.updateResource('coupons', id, coupon);
      return db.coupons[index];
    }
    return undefined;
  },
  deleteCoupon: (id: string): boolean => {
    const db = storage.getDatabase();
    const initialLength = db.coupons.length;
    db.coupons = db.coupons.filter(c => c.id !== id);
    storage.setDatabase(db);
    api.deleteResource('coupons', id);
    return db.coupons.length < initialLength;
  },

  // Gift Cards
  getGiftCards: (): GiftCard[] => storage.getDatabase().giftCards,
  createGiftCard: (giftCard: Omit<GiftCard, 'id' | 'issuedDate'>): GiftCard => {
    const db = storage.getDatabase();
    const newGiftCard = {
      ...giftCard,
      id: generateId(),
      issuedDate: new Date().toISOString().split('T')[0],
    };
    db.giftCards.push(newGiftCard);
    storage.setDatabase(db);
    api.createResource('giftCards', newGiftCard);
    return newGiftCard;
  },

  // Gallery
  getGallery: (): GalleryImage[] => storage.getDatabase().gallery,
  addGalleryImage: (image: Omit<GalleryImage, 'id' | 'uploadDate'>): GalleryImage => {
    const db = storage.getDatabase();
    const newImage = {
      ...image,
      id: generateId(),
      uploadDate: new Date().toISOString().split('T')[0],
    };
    db.gallery.push(newImage);
    storage.setDatabase(db);
    api.createResource('gallery', newImage);
    return newImage;
  },

  // Attendance
  getAttendance: (): Attendance[] => storage.getDatabase().attendance,
};
