import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { storage } from '../services/storage';
import { api } from '../services/api';
import type { User } from '../types';

interface RegisterPayload {
  name: string;
  username?: string;
  email: string;
  phone?: string;
  password: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = () => {
    const savedUserId = localStorage.getItem('salon-auth-user-id');
    if (savedUserId) {
      const foundUser = storage.getUserById(savedUserId);
      setUser(foundUser ?? null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const authenticatedUser = await api.login(email, password);
      setUser(authenticatedUser);
      localStorage.setItem('salon-auth-user-id', authenticatedUser.id);
      return true;
    } catch (error) {
      const fallbackUser = storage.getUsers().find(u => u.email === email || u.username === email);
      if (fallbackUser && fallbackUser.password === password) {
        setUser(fallbackUser);
        localStorage.setItem('salon-auth-user-id', fallbackUser.id);
        localStorage.setItem('salon-auth-token', `fallback-${fallbackUser.id}`);
        return true;
      }
      return false;
    }
  };

  const register = async (payload: RegisterPayload): Promise<{ success: boolean; message?: string }> => {
    try {
      const userPayload = {
        name: payload.name,
        username: payload.username || payload.email.split('@')[0],
        email: payload.email,
        phone: payload.phone || '',
        password: payload.password,
        role: payload.role || 'user',
      };
      const registeredUser = await api.register(userPayload);

      // Save user to local storage DB
      const db = storage.getDatabase();
      const existingUserIdx = db.users.findIndex(u => u.id === registeredUser.id || u.email === registeredUser.email);
      if (existingUserIdx !== -1) {
        db.users[existingUserIdx] = registeredUser;
      } else {
        db.users.push(registeredUser);
      }

      // Create/Update matching customer record in local storage DB
      const existingCustIdx = db.customers.findIndex(c => c.email === payload.email || c.id === registeredUser.id);
      const customerData = {
        id: registeredUser.id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone || '',
        role: (payload.role as any) || 'user',
        loyaltyPoints: existingCustIdx !== -1 ? db.customers[existingCustIdx].loyaltyPoints : 0,
        totalVisits: existingCustIdx !== -1 ? db.customers[existingCustIdx].totalVisits : 0,
        joinDate: existingCustIdx !== -1 ? db.customers[existingCustIdx].joinDate : new Date().toISOString().split('T')[0],
        notes: 'Registered user account',
      };

      if (existingCustIdx !== -1) {
        db.customers[existingCustIdx] = { ...db.customers[existingCustIdx], ...customerData };
      } else {
        db.customers.push(customerData);
      }
      storage.setDatabase(db);

      setUser(registeredUser);
      localStorage.setItem('salon-auth-user-id', registeredUser.id);
      return { success: true };
    } catch (error) {
      try {
        const newUser = storage.createUser({
          name: payload.name,
          username: payload.username || payload.email.split('@')[0],
          email: payload.email,
          phone: payload.phone || '',
          password: payload.password,
          role: (payload.role as any) || 'user',
        });

        // Ensure customer record exists in local database
        const db = storage.getDatabase();
        const existingCustIdx = db.customers.findIndex(c => c.email === payload.email || c.id === newUser.id);
        const customerData = {
          id: newUser.id,
          name: payload.name,
          email: payload.email,
          phone: payload.phone || '',
          role: (payload.role as any) || 'user',
          loyaltyPoints: 0,
          totalVisits: 0,
          joinDate: new Date().toISOString().split('T')[0],
          notes: 'Registered user account',
        };

        if (existingCustIdx !== -1) {
          db.customers[existingCustIdx] = { ...db.customers[existingCustIdx], ...customerData };
        } else {
          db.customers.push(customerData);
        }
        storage.setDatabase(db);

        setUser(newUser);
        localStorage.setItem('salon-auth-user-id', newUser.id);
        localStorage.setItem('salon-auth-token', `demo-${newUser.id}`);
        return { success: true };
      } catch (e) {
        return { success: false, message: (error as Error)?.message || 'Registration failed' };
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('salon-auth-user-id');
    localStorage.removeItem('salon-auth-token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
