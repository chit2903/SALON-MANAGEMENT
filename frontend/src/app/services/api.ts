import type { Appointment, User, Salon, Service, Customer, Staff, Product, Invoice, Package, Membership, Expense, Feedback, Notification, Offer, Coupon, GiftCard, GalleryImage, Attendance, Database } from '../types';
import { storage } from './storage';

const API_BASE_URLS = [
  import.meta.env.VITE_API_BASE_URL,
  'http://localhost:5000',
  'http://localhost:3001',
].filter(Boolean) as string[];

let activeBaseUrl = API_BASE_URLS[0] || 'http://localhost:5000';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('salon-auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseError = async (response: Response) => {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return data?.message ?? text ?? 'Request failed';
  } catch {
    return text || 'Request failed';
  }
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  for (const baseUrl of API_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options.headers ?? {}),
        },
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      activeBaseUrl = baseUrl;

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof TypeError || (error as Error)?.message?.includes('fetch')) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to connect to backend server');
};

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<User> => {
    const response = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('salon-auth-token', response.token);
    return response.user;
  },

  register: async (payload: { name: string; username: string; email?: string; phone?: string; password: string; role?: string }): Promise<User> => {
    const response = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    localStorage.setItem('salon-auth-token', response.token);
    return response.user;
  },

  // Generic Resource API Calls
  getResource: <T>(resource: string) => request<T[]>(`/api/${resource}`),
  getResourceById: <T>(resource: string, id: string) => request<T>(`/api/${resource}/${id}`),
  createResource: <T>(resource: string, payload: any) =>
    request<T>(`/api/${resource}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }).catch(err => {
      console.warn(`[API] Remote create for ${resource} failed:`, err.message);
      return payload as T;
    }),
  updateResource: <T>(resource: string, id: string, payload: any) =>
    request<T>(`/api/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).catch(err => {
      console.warn(`[API] Remote update for ${resource}/${id} failed:`, err.message);
      return payload as T;
    }),
  deleteResource: (resource: string, id: string) =>
    request<void>(`/api/${resource}/${id}`, {
      method: 'DELETE',
    }).catch(err => {
      console.warn(`[API] Remote delete for ${resource}/${id} failed:`, err.message);
    }),

  // Specific Helpers
  getAppointments: () => request<Appointment[]>('/api/appointments'),
  createAppointment: (payload: Omit<Appointment, 'id'>) =>
    request<Appointment>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAppointment: (id: string, payload: Partial<Appointment>) =>
    request<Appointment>(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteAppointment: (id: string) =>
    request<void>(`/api/appointments/${id}`, {
      method: 'DELETE',
    }),

  getSalons: () => request<Salon[]>('/api/salons'),
  getSalonById: (id: string) => request<Salon>(`/api/salons/${id}`),

  // Comprehensive Backend Synchronization
  syncFromBackend: async () => {
    try {
      const [
        users, salons, appointments, customers, staff, services,
        packages, memberships, products, invoices, expenses,
        feedback, notifications, offers, coupons, giftCards,
        gallery, attendance
      ] = await Promise.all([
        api.getResource<User>('users').catch(() => []),
        api.getResource<Salon>('salons').catch(() => []),
        api.getAppointments().catch(() => []),
        api.getResource<Customer>('customers').catch(() => []),
        api.getResource<Staff>('staff').catch(() => []),
        api.getResource<Service>('services').catch(() => []),
        api.getResource<Package>('packages').catch(() => []),
        api.getResource<Membership>('memberships').catch(() => []),
        api.getResource<Product>('products').catch(() => []),
        api.getResource<Invoice>('invoices').catch(() => []),
        api.getResource<Expense>('expenses').catch(() => []),
        api.getResource<Feedback>('feedback').catch(() => []),
        api.getResource<Notification>('notifications').catch(() => []),
        api.getResource<Offer>('offers').catch(() => []),
        api.getResource<Coupon>('coupons').catch(() => []),
        api.getResource<GiftCard>('giftCards').catch(() => []),
        api.getResource<GalleryImage>('gallery').catch(() => []),
        api.getResource<Attendance>('attendance').catch(() => []),
      ]);

      const db: Database = {
        users: users || [],
        salons: salons || [],
        appointments: appointments || [],
        customers: customers || [],
        staff: staff || [],
        services: services || [],
        packages: packages || [],
        memberships: memberships || [],
        customerMemberships: [],
        products: products || [],
        invoices: invoices || [],
        expenses: expenses || [],
        feedback: feedback || [],
        notifications: notifications || [],
        offers: offers || [],
        coupons: coupons || [],
        giftCards: giftCards || [],
        gallery: gallery || [],
        attendance: attendance || [],
      };

      storage.setDatabase(db);
    } catch (e) {
      console.warn('Backend synchronization notice:', e);
    }
  }
};
