import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import App from './app/App';
import { AuthProvider } from './app/contexts/AuthContext';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider attribute="class" defaultTheme="dark">
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);
