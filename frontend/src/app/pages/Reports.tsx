import React, { useMemo } from 'react';
import { storage } from '../services/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, CalendarClock, Users, Receipt, Building2 } from 'lucide-react';
import { formatPrice } from '../utils/currency';

export const ReportsPage: React.FC = () => {
  const appointments = storage.getAppointments();
  const customers = storage.getCustomers();
  const invoices = storage.getInvoices();
  const salons = storage.getSalons();

  const totalRevenue = useMemo(
    () => invoices.reduce((sum, invoice) => sum + (invoice.grandTotal || 0), 0),
    [invoices]
  );

  const stats = [
    {
      label: 'Total Revenue',
      value: formatPrice(totalRevenue),
      icon: TrendingUp,
      hint: 'Total invoice revenue',
    },
    {
      label: 'Appointments',
      value: appointments.length.toString(),
      icon: CalendarClock,
      hint: 'Scheduled + completed',
    },
    {
      label: 'Customers',
      value: customers.length.toString(),
      icon: Users,
      hint: 'Registered users',
    },
    {
      label: 'Billed Invoices',
      value: invoices.length.toString(),
      icon: Receipt,
      hint: 'Completed checkout bills',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-amber-400" /> Reports & Analytics
        </h1>
        <p className="text-muted-foreground">Business overview, revenue performance and operational KPIs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, hint }) => (
          <Card key={label} className="border-0 bg-slate-900/60 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-slate-300 font-medium">{label}</CardTitle>
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
              <p className="text-xs text-slate-400 mt-2">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-slate-900/60 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-amber-400 text-lg">Operational Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="rounded-lg border border-white/10 bg-slate-800/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Completed Appointments</p>
              <p className="mt-2 text-2xl font-bold text-green-400">{appointments.filter((a) => a.status === 'completed').length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-800/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Scheduled Appointments</p>
              <p className="mt-2 text-2xl font-bold text-amber-400">{appointments.filter((a) => a.status === 'scheduled').length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-800/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Total Salons Active</p>
              <p className="mt-2 text-2xl font-bold text-white">{salons.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
