import React from 'react';
import { Link, useLocation, Outlet } from 'react-router';
import { useTheme } from 'next-themes';
import { useAuth } from '../contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
} from '../components/ui/sidebar';
import { Button } from '../components/ui/button';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  UserCheck,
  Crown,
  ShoppingCart,
  TrendingUp,
  Tags,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';

export const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Building2, label: 'Salons', path: '/salons' },
    { icon: Calendar, label: 'Appointments', path: '/appointments' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: UserCheck, label: 'Staff', path: '/staff' },
    { icon: ShoppingCart, label: 'Bill & Invoices', path: '/pos' },
    { icon: TrendingUp, label: 'Reports', path: '/reports' },
    { icon: Tags, label: 'Offers & Discounts', path: '/offers' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-gray-900 via-slate-950 to-black text-white relative overflow-hidden">
        {/* Unified ambient background glow effect for all admin pages */}
        <div className="pointer-events-none fixed inset-0 z-0 opacity-40">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />
        </div>

        <Sidebar className="z-10 bg-slate-950/90 border-r border-white/10 text-white">
          <SidebarHeader className="border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black font-bold text-lg shadow-sm">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-white">Salon Pro</span>
                <span className="text-xs text-amber-400/80 capitalize">{user?.role || 'Management'} Panel</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-amber-400/60 px-3 mb-2">
                MAIN MENU
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className={isActive ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 font-semibold border-l-2 border-amber-500 rounded-r-md rounded-l-none' : 'text-slate-300 hover:text-white hover:bg-white/5'}
                        >
                          <Link to={item.path}>
                            <item.icon className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-white/10 p-3">
            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-white truncate">{user?.name}</span>
                <span className="text-xs text-slate-400 truncate">{user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Logout"
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 z-10 bg-transparent">
          <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur z-10 text-white">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white hover:bg-white/10" />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full text-slate-300 hover:text-white hover:bg-white/10"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6 max-w-7xl w-full mx-auto text-white">
            {children || <Outlet />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
