import React, { useEffect, useMemo, useState } from 'react';
import { storage } from '../services/storage';
import { api } from '../services/api';
import type { Customer, Invoice, InvoiceItem, Service, Appointment } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Sparkles,
  Calendar,
  CheckCircle,
  Clock,
  UserCheck,
  UserPlus,
  AlertCircle,
  Plus,
  Trash2,
  TrendingUp,
  Receipt,
  Search,
  Check,
  CreditCard,
  Wallet,
  Coins,
  Printer,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '../utils/currency';

export const POSPage: React.FC = () => {
  // POS State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Quick Add User State
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setInvoices(storage.getInvoices());
    setCustomers(storage.getCustomers());
    setServices(storage.getServices());
    setAppointments(storage.getAppointments());

    try {
      const remoteCustomers = await api.getResource<Customer>('customers');
      if (remoteCustomers && Array.isArray(remoteCustomers) && remoteCustomers.length > 0) {
        setCustomers(remoteCustomers);
        const db = storage.getDatabase();
        db.customers = remoteCustomers;
        storage.setDatabase(db);
      }
    } catch (err) {
      console.warn('POS customer sync skipped/offline');
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  // Automatically fetch customer services & bill amounts from appointments when customer is selected
  useEffect(() => {
    if (!customerId) {
      setUserAppointments([]);
      setItems([]);
      return;
    }

    const selectedCustomer = customers.find((c) => c.id === customerId);
    const allAppointments = storage.getAppointments();

    const matchedAppts = allAppointments.filter((a) => {
      if (a.status === 'completed') return false;
      if (a.customerId && a.customerId === customerId) return true;
      if (selectedCustomer) {
        if (a.customerName && a.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()) return true;
        if (a.customerPhone && a.customerPhone === selectedCustomer.phone) return true;
        if (selectedCustomer.email && a.customerName && selectedCustomer.email.toLowerCase().includes(a.customerName.toLowerCase())) return true;
      }
      return false;
    });

    setUserAppointments(matchedAppts);

    // Auto generate invoice items from booked appointment services with their exact bill amounts
    const autoItems: InvoiceItem[] = matchedAppts.map((appt) => {
      const matchedService = services.find((s) => s.id === appt.serviceId);
      const price = matchedService?.price || 0;
      return {
        type: 'service',
        itemId: appt.serviceId,
        name: appt.serviceName || matchedService?.name || 'Salon Service',
        quantity: 1,
        price: price,
      };
    });

    setItems(autoItems);
  }, [customerId, customers, services]);

  const handlePriceChange = (index: number, newPrice: number) => {
    setItems((current) => {
      const next = [...current];
      if (next[index]) {
        next[index] = { ...next[index], price: Number(newPrice) || 0 };
      }
      return next;
    });
  };

  const handleAddManualService = (serviceId: string) => {
    if (!serviceId) return;
    const s = services.find((srv) => srv.id === serviceId);
    if (!s) return;

    setItems((prev) => [
      ...prev,
      {
        type: 'service',
        itemId: s.id,
        name: s.name,
        quantity: 1,
        price: s.price,
      },
    ]);
    toast.success(`Added ${s.name} to bill`);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    const newCust = storage.createCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: newCustEmail.trim(),
      role: 'user',
      notes: 'Added via POS Billing',
    });

    setCustomers((prev) => [newCust, ...prev]);
    setCustomerId(newCust.id);
    toast.success(`Customer "${newCust.name}" added and selected for billing!`);

    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setIsAddCustomerOpen(false);
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items]
  );

  const grandTotal = subtotal;

  // Sum of ALL billed invoice amounts across the database
  const totalInvoiceRevenue = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
    [invoices]
  );

  // Separate payment method subtotals for Cash, UPI, and Card
  const { cashSubtotal, upiSubtotal, cardSubtotal } = useMemo(() => {
    let cash = 0;
    let upi = 0;
    let card = 0;

    invoices.forEach((inv) => {
      const method = (inv.paymentMethod || '').toLowerCase();
      const amount = Number(inv.grandTotal) || 0;
      if (method === 'cash') {
        cash += amount;
      } else if (method === 'upi' || method === 'mobile') {
        upi += amount;
      } else if (method === 'card') {
        card += amount;
      } else {
        cash += amount;
      }
    });

    return { cashSubtotal: cash, upiSubtotal: upi, cardSubtotal: card };
  }, [invoices]);

  const handlePrintInvoice = (invoice: Invoice) => {
    const customer = customers.find((c) => c.id === invoice.customerId);
    const printWindow = window.open('', '_blank', 'width=750,height=850');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to print invoices.');
      return;
    }

    const itemsHtml = (invoice.items || [])
      .map(
        (item, idx) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 500;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #b45309;">${formatPrice(item.price * item.quantity)}</td>
        </tr>
      `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill Receipt #${invoice.id} - Salon Pro</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #1e293b; background: #fff; margin: 0; }
            .receipt-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; max-width: 650px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f59e0b; padding-bottom: 16px; margin-bottom: 20px; }
            .logo { font-size: 26px; font-weight: 800; color: #d97706; letter-spacing: -0.5px; }
            .sub-logo { font-size: 12px; color: #64748b; font-weight: 500; text-transform: uppercase; tracking-wider; }
            .meta { text-align: right; font-size: 13px; color: #475569; line-height: 1.5; }
            .meta strong { color: #0f172a; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; background: #f8fafc; padding: 14px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; border: 1px solid #f1f5f9; }
            .info-item { color: #475569; }
            .info-item strong { color: #0f172a; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
            th { background: #fffbeb; padding: 10px; text-align: left; font-weight: 700; color: #92400e; border-bottom: 2px solid #fde68a; font-size: 12px; text-transform: uppercase; }
            .total-section { display: flex; justify-content: flex-end; font-size: 14px; border-top: 2px solid #e2e8f0; padding-top: 16px; margin-top: 12px; }
            .grand-total { font-size: 22px; font-weight: 800; color: #d97706; border-top: 2px solid #d97706; padding-top: 6px; margin-top: 6px; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; text-transform: uppercase; border: 1px solid #a7f3d0; }
            .footer { margin-top: 36px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div>
                <div class="logo">SALON PRO</div>
                <div class="sub-logo">Official Billing & Payment Receipt</div>
              </div>
              <div class="meta">
                <div><strong>Invoice #:</strong> #${invoice.id}</div>
                <div><strong>Date:</strong> ${invoice.date}</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div><strong>Customer Name:</strong> ${customer?.name || 'Walk-in User'}</div>
                <div><strong>Phone:</strong> ${customer?.phone || 'N/A'}</div>
              </div>
              <div class="info-item" style="text-align: right;">
                <div><strong>Payment Mode:</strong> <span class="badge">${(invoice.paymentMethod || 'cash').toUpperCase()}</span></div>
                <div><strong>Status:</strong> <span style="color: #16a34a; font-weight: 700;">PAID</span></div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 30px;">#</th>
                  <th>Billed Service</th>
                  <th style="text-align: center; width: 50px;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total-section">
              <div style="text-align: right; width: 250px;">
                <div style="color: #64748b; font-size: 13px;">Services Subtotal: <strong>${formatPrice(invoice.total || invoice.grandTotal)}</strong></div>
                <div style="color: #64748b; font-size: 13px;">Taxes & Fees: <strong>${formatPrice(0)}</strong></div>
                <div class="grand-total">Total: ${formatPrice(invoice.grandTotal)}</div>
              </div>
            </div>

            <div class="footer">
              Thank you for visiting Salon Pro! Have a wonderful day.<br/>
              <em>This is a computer-generated tax receipt.</em>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    const customer = customers.find((c) => c.id === invoice.customerId);
    const textContent = `
============================================================
                 SALON PRO - BILL RECEIPT                   
              Official Tax Payment Invoice                  
============================================================
Invoice Number : #${invoice.id}
Invoice Date   : ${invoice.date}
Customer Name  : ${customer?.name || 'Walk-in User'}
Customer Phone : ${customer?.phone || 'N/A'}
Payment Method : ${(invoice.paymentMethod || 'cash').toUpperCase()}
Payment Status : PAID
------------------------------------------------------------
BILLED SERVICES:
${(invoice.items || [])
        .map(
          (item, idx) =>
            ` ${idx + 1}. ${item.name.padEnd(30)} x${item.quantity}  ${formatPrice(item.price * item.quantity)}`
        )
        .join('\n')}
------------------------------------------------------------
Services Subtotal : ${formatPrice(invoice.total || invoice.grandTotal)}
Taxes & Fees      : ${formatPrice(0)}
GRAND TOTAL PAID  : ${formatPrice(invoice.grandTotal)}
============================================================
Thank you for choosing Salon Pro!
============================================================
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bill_Invoice_${invoice.id}_${(customer?.name || 'Customer').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded Bill Invoice #${invoice.id}!`);
  };

  const handleCreateInvoice = () => {
    if (!customerId) {
      toast.error('Please select or add a customer to bill');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one service to generate a bill');
      return;
    }

    const selectedCustomer = customers.find((c) => c.id === customerId);

    // Create & Save Invoice in MongoDB & Storage
    const newInvoice = storage.createInvoice({
      customerId: customerId,
      items: items,
      total: subtotal,
      tax: 0,
      grandTotal,
      paymentMethod,
      staffId: '1',
    });

    // Mark fetched appointments as completed
    userAppointments.forEach((appt) => {
      if (appt.id) {
        storage.updateAppointment(appt.id, { status: 'completed' });
      }
    });

    toast.success(`Invoice generated for ${selectedCustomer?.name || 'Customer'}! ${formatPrice(grandTotal)} added to Revenue.`);
    setCustomerId('');
    setPaymentMethod('cash');
    setItems([]);
    setUserAppointments([]);
    refreshData();

    // Auto prompt print for newly generated invoice
    setTimeout(() => {
      handlePrintInvoice(newInvoice);
    }, 400);
  };

  const selectedCustomerObj = customers.find((c) => c.id === customerId);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER WITH LIVE TOTAL INVOICE REVENUE & SEPARATE PAYMENT SUBTOTALS */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
              <Receipt className="w-7 h-7 text-amber-400" /> Bill & Invoices
            </h1>
          </div>

          {/* LIVE TOTAL REVENUE BADGE */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center gap-3 shadow-lg shrink-0">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold border border-amber-500/40">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">Total POS Revenue</div>
              <div className="text-xl font-extrabold text-white tracking-tight">{formatPrice(totalInvoiceRevenue)}</div>
            </div>
          </div>
        </div>

        {/* SEPARATE PAYMENT METHOD SUBTOTAL CARDS (CASH, UPI, CARD) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* CASH SUBTOTAL */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Cash Subtotal</div>
                <div className="text-base font-bold text-emerald-400">{formatPrice(cashSubtotal)}</div>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">CASH</span>
          </div>

          {/* UPI SUBTOTAL */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-sky-500/30 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">UPI / Mobile Subtotal</div>
                <div className="text-base font-bold text-sky-400">{formatPrice(upiSubtotal)}</div>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20">UPI</span>
          </div>

          {/* CARD SUBTOTAL */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/30 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Card Subtotal</div>
                <div className="text-base font-bold text-purple-400">{formatPrice(cardSubtotal)}</div>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">CARD</span>
          </div>
        </div>
      </div>

      {/* POS BILLING & INVOICES CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        {/* RECENT BILLED INVOICES TABLE */}
        <Card className="border-0 bg-slate-900/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-amber-400" />
              Billed Invoices ({invoices.length})
            </CardTitle>
            <div className="text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Total Revenue: {formatPrice(totalInvoiceRevenue)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 px-4 sm:-mx-0 sm:px-0">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-slate-300">Invoice ID</TableHead>
                    <TableHead className="text-slate-300">Customer</TableHead>
                    <TableHead className="text-slate-300">Billed Services</TableHead>
                    <TableHead className="text-slate-300">Billed Amount</TableHead>
                    <TableHead className="text-slate-300">Payment Method</TableHead>
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-right text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No invoices created yet. Select a customer to generate a bill.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice) => {
                      const customer = customers.find((c) => c.id === invoice.customerId);
                      const serviceNames = invoice.items?.map((i) => i.name).join(', ') || 'Salon Service';
                      const method = (invoice.paymentMethod || '').toLowerCase();
                      let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                      let label = 'Cash';

                      if (method === 'upi' || method === 'mobile') {
                        badgeStyle = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
                        label = 'UPI';
                      } else if (method === 'card') {
                        badgeStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
                        label = 'Card';
                      }

                      return (
                        <TableRow key={invoice.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="font-medium text-amber-300">#{invoice.id}</TableCell>
                          <TableCell className="text-white font-medium">{customer?.name ?? 'Walk-in'}</TableCell>
                          <TableCell className="text-slate-300 text-xs max-w-[180px] truncate" title={serviceNames}>
                            {serviceNames}
                          </TableCell>
                          <TableCell className="text-amber-400 font-bold">{formatPrice(invoice.grandTotal)}</TableCell>
                          <TableCell>
                            <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${badgeStyle}`}>
                              {label}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-400 text-xs">{invoice.date}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Print Bill Invoice"
                                onClick={() => handlePrintInvoice(invoice)}
                                className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Download Bill Invoice"
                                onClick={() => handleDownloadInvoice(invoice)}
                                className="h-8 w-8 text-sky-400 hover:text-sky-300 hover:bg-sky-500/20"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* NEW INVOICE / POS CHECKOUT FORM */}
        <Card className="border-0 bg-slate-900/60 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Generate POS Bill & Invoice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* SELECT OR ADD CUSTOMER (NO DROPDOWN MENU) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-200 flex items-center gap-1.5 font-medium">
                  <UserCheck className="w-4 h-4 text-amber-400" /> Select Customer *
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="h-7 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 gap-1 font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Add User Manually
                </Button>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search customer by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-slate-800/90 border-white/10 text-white placeholder:text-slate-400 focus:border-amber-500"
                />
              </div>

              {/* CUSTOMER CARDS LIST (NO DROPDOWN) */}
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-white/10 rounded-lg bg-slate-800/40">
                {filteredCustomers.length === 0 ? (
                  <div className="text-xs text-slate-400 py-2 w-full text-center">
                    No customers found. Click "+ Add User Manually" to create one.
                  </div>
                ) : (
                  filteredCustomers.map((c) => {
                    const isSelected = customerId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCustomerId(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border text-left ${isSelected
                            ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-200 border-white/10 hover:border-amber-500/50 hover:bg-slate-750'
                          }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5 shrink-0" /> : <UserCheck className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
                        <span className="truncate max-w-[120px]">{c.name}</span>
                        {c.phone && <span className="text-[10px] opacity-75">({c.phone})</span>}
                      </button>
                    );
                  })
                )}
              </div>

              {selectedCustomerObj && (
                <div className="text-xs text-amber-300 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-amber-400" /> Selected: <span className="text-white font-bold">{selectedCustomerObj.name}</span> ({selectedCustomerObj.phone || selectedCustomerObj.email || 'Customer'})
                </div>
              )}
            </div>

            {/* PAYMENT METHOD TOGGLE BUTTONS (NO DROPDOWN) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200">Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Cash', icon: Coins },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'mobile', label: 'UPI / Mobile', icon: Wallet },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${isSelected
                          ? 'bg-amber-500 text-black border-amber-400 shadow-md font-bold'
                          : 'bg-slate-800 text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SERVICES & BILL AMOUNTS */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" /> Services & Bill Amounts
                </Label>
                {items.length > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                    {items.length} Billed Service(s)
                  </span>
                )}
              </div>

              {!customerId ? (
                <div className="p-4 rounded-lg bg-slate-800/40 border border-white/5 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <UserCheck className="w-6 h-6 text-amber-400/60" />
                  <span>Select a customer above or click "+ Add User Manually" to generate a bill.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* SERVICE BUTTON CHIPS (NO DROPDOWN MENU) */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-slate-300 font-medium">Click Service to Add to Bill:</div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1.5 rounded-lg bg-slate-800/40 border border-white/10">
                      {services
                        .filter((s) => s && s.name && s.name.trim() !== '' && !/^user\d+$/i.test(s.name.trim()))
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleAddManualService(s.id)}
                            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-amber-500/20 text-xs text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-all flex items-center gap-1 font-medium"
                          >
                            <Plus className="w-3 h-3 text-amber-400" />
                            <span>{s.name}</span>
                            <span className="font-bold text-white">({formatPrice(s.price)})</span>
                          </button>
                        ))}
                    </div>
                  </div>

                  {userAppointments.length > 0 && (
                    <div className="px-3 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Fetched {userAppointments.length} service(s) from customer's appointment.</span>
                    </div>
                  )}

                  {items.length === 0 ? (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>No booked appointments found. Click any service button above to add to bill.</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-white/10 bg-slate-800/60 p-3 flex items-center justify-between text-sm"
                        >
                          <div>
                            <div className="font-semibold text-white">{item.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Service Item #{idx + 1}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-[11px] text-slate-400">Bill Amount</div>
                              <div className="flex items-center gap-1">
                                <span className="text-amber-400 text-xs font-semibold">₹</span>
                                <Input
                                  type="number"
                                  min={0}
                                  value={item.price}
                                  onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                                  className="w-20 h-7 text-xs bg-slate-900 border-white/10 text-amber-400 font-bold text-right"
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(idx)}
                              className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* TOTAL & BILL SUMMARY WITH SEPARATE PAYMENT METHOD SUBTOTAL */}
            <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Services Total ({items.length})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Selected Payment Method</span>
                <span className="capitalize font-bold text-amber-300">
                  {paymentMethod === 'upi' || paymentMethod === 'mobile' ? 'UPI / Mobile' : paymentMethod.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Taxes & Fees</span>
                <span>{formatPrice(0)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-amber-500/20 text-amber-400">
                <span>Payment Subtotal ({paymentMethod === 'upi' || paymentMethod === 'mobile' ? 'UPI' : paymentMethod.toUpperCase()})</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <Button
              onClick={handleCreateInvoice}
              disabled={!customerId || items.length === 0}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold h-11 shadow-lg shadow-amber-500/20"
            >
              Generate Invoice & Add {formatPrice(grandTotal)} to Revenue
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ADD USER MODAL */}
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-400">
              <UserPlus className="w-5 h-5" /> Add Customer / Walk-In User
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Quickly add a new customer directly into POS for billing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickAddCustomer} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200">Customer Name *</Label>
              <Input
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                placeholder="Enter customer name"
                required
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200">Phone Number</Label>
              <Input
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                placeholder="Enter phone number"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200">Email Address</Label>
              <Input
                type="email"
                value={newCustEmail}
                onChange={(e) => setNewCustEmail(e.target.value)}
                placeholder="Enter email address"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddCustomerOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
              >
                Add & Select for Billing
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
