import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'next-themes';
import { Button } from '../components/ui/button';
import { LogOut, Moon, Sun } from 'lucide-react';

export const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Salon Pro
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">Hello, {user?.name}</div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut size={16} />
          </Button>
        </div>
      </header>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
};
