import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Appointments } from './pages/Appointments';
import { UserDashboard } from './pages/UserDashboard';
import { SalonDetails } from './pages/SalonDetails';
import { MyBookings } from './pages/MyBookings';
import { SalonsPage } from './pages/Salons';
import { StaffPage } from './pages/Staff';
import { OffersPage } from './pages/Offers';
import { POSPage } from './pages/POS';
import { ReportsPage } from './pages/Reports';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { MainLayout } from './layouts/MainLayout';
import { storage } from './services/storage';
import { api } from './services/api';

// User layout (simple header for users)
const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div>
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link to="/user-dashboard" className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Salon Pro
            </Link>
          </div>
          <nav className="flex flex-wrap justify-center gap-3 md:justify-start md:gap-6">
            <Link
              to="/user-dashboard"
              className={`text-sm transition-colors ${isActive('/user-dashboard') ? 'text-amber-400 font-medium' : 'text-gray-300 hover:text-white'}`}
            >
              Salons
            </Link>
            <Link
              to="/my-bookings"
              className={`text-sm transition-colors ${isActive('/my-bookings') ? 'text-amber-400 font-medium' : 'text-gray-300 hover:text-white'}`}
            >
              My Bookings
            </Link>
          </nav>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <span className="text-white text-sm">Welcome, {user?.name}</span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-white bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
};

export default function App() {
  const { user } = useAuth();

  useEffect(() => {
    api.syncFromBackend();
  }, []);

  if (!user) {
    return <Login />;
  }

  // User role shows user dashboard
  if (user.role === 'user') {
    return (
      <UserLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/user-dashboard" replace />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/salons/:id" element={<SalonDetails />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="*" element={<Navigate to="/user-dashboard" replace />} />
        </Routes>
      </UserLayout>
    );
  }

  // Admin/owner/reception shows admin panel
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/salons" element={<SalonsPage />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}
