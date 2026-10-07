import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Sparkles, Mail, Lock, Phone, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login state (using email address)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;

    setIsLoading(true);
    try {
      const success = await login(loginEmail.trim(), loginPassword);
      if (success) {
        toast.success('Welcome back! Login successful.');
      } else {
        toast.error('Invalid email address or password.');
      }
    } catch (err) {
      toast.error('Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        name: regName.trim(),
        email: regEmail.trim(),
        username: regEmail.trim().split('@')[0],
        phone: regPhone.trim(),
        password: regPassword,
        role: 'user',
      });

      if (res.success) {
        toast.success('Account created successfully! Welcome to Salon Pro.');
      } else {
        toast.error(res.message || 'Registration failed');
      }
    } catch (err) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-slate-900/80 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black font-bold text-2xl shadow-lg mb-2">
              S
            </div>
            <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
              Salon Pro <Sparkles className="w-5 h-5 text-amber-400" />
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Luxury Salon & Appointment Management Portal
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'login' | 'register')} className="w-full">
              <TabsList className="grid grid-cols-2 w-full bg-slate-800/80 border border-white/5 mb-6 p-1">
                <TabsTrigger value="login" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black font-semibold">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black font-semibold">
                  Register
                </TabsTrigger>
              </TabsList>

              {/* LOGIN TAB */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-slate-200 text-xs font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="admin@salon.com"
                        className="pl-9 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-slate-200 text-xs font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password"
                        className="pl-9 pr-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold h-11 transition-all shadow-lg shadow-amber-500/20"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </form>

                {/* Demo Admin Login Button */}
                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                  <p className="text-xs text-slate-400 mb-2">Default Admin Demo Account:</p>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('admin@salon.com', 'admin123')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs hover:bg-amber-500/20 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Email: <strong>admin@salon.com</strong> | Pass: <strong>admin123</strong>
                  </button>
                </div>
              </TabsContent>

              {/* REGISTER TAB */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="reg-name" className="text-slate-200 text-xs font-medium">Full Name *</Label>
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="reg-name"
                        placeholder="John Doe"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="pl-9 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reg-email" className="text-slate-200 text-xs font-medium">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="john@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-9 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reg-phone" className="text-slate-200 text-xs font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="reg-phone"
                        placeholder="+91 98765 43210"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="pl-9 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reg-password" className="text-slate-200 text-xs font-medium">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pl-9 pr-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold h-10 mt-2 transition-all shadow-lg shadow-amber-500/20"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
