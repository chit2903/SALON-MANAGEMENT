import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { api } from '../services/api';
import { Customer, UserRole, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Plus, Search, Edit, Trash2, UserPlus, ShieldCheck, Lock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const mergeUsersAndCustomers = (allUsers: User[], allCusts: Customer[]): Customer[] => {
  const mergedMap = new Map<string, Customer>();

  // Add existing customers
  allCusts.forEach((c) => {
    const key = (c.email || c.id || c.name).toLowerCase();
    mergedMap.set(key, c);
  });

  // Ensure every user is present in customer list
  allUsers.forEach((u) => {
    const key = (u.email || u.id || u.name).toLowerCase();
    const existing = mergedMap.get(key);
    if (existing) {
      mergedMap.set(key, {
        ...existing,
        id: existing.id || u.id,
        name: u.name || existing.name,
        email: u.email || existing.email,
        phone: u.phone || existing.phone,
        role: (u.role as any) || existing.role || 'user',
      });
    } else {
      mergedMap.set(key, {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        role: (u.role as any) || 'user',
        loyaltyPoints: 0,
        totalVisits: 0,
        joinDate: new Date().toISOString().split('T')[0],
        notes: 'Registered User',
      });
    }
  });

  return Array.from(mergedMap.values());
};

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('user');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    refreshCustomers();
  }, []);

  const refreshCustomers = async () => {
    const localUsers = storage.getUsers();
    const localCusts = storage.getCustomers();
    let combined = mergeUsersAndCustomers(localUsers, localCusts);
    setCustomers(combined);

    try {
      const [remoteCusts, remoteUsers] = await Promise.all([
        api.getResource<Customer>('customers').catch(() => []),
        api.getResource<User>('users').catch(() => []),
      ]);

      const allUsers = [...localUsers, ...(remoteUsers || [])];
      const allCusts = [...localCusts, ...(remoteCusts || [])];

      combined = mergeUsersAndCustomers(allUsers, allCusts);
      setCustomers(combined);

      // Sync combined customer database
      const db = storage.getDatabase();
      db.customers = combined;
      storage.setDatabase(db);
    } catch (err) {
      console.warn('Customer sync skipped/offline');
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('user');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormEmail(customer.email);
    setFormPhone(customer.phone);
    setFormRole(customer.role || 'user');
    setFormNotes(customer.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCustomer) {
      // Admin can ONLY change the Role of the customer
      storage.updateCustomer(editingCustomer.id, {
        role: formRole,
      });

      // Also update the role on the User account if matched
      const allUsers = storage.getUsers();
      const matchedUser = allUsers.find(
        (u) => u.id === editingCustomer.id || u.email === editingCustomer.email
      );
      if (matchedUser) {
        storage.updateUser(matchedUser.id, { role: formRole });
      }

      toast.success(`Role for ${editingCustomer.name} updated to ${formRole.toUpperCase()} successfully!`);
    } else {
      if (!formName.trim()) {
        toast.error('Customer name is required');
        return;
      }

      storage.createCustomer({
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: formRole,
        notes: formNotes.trim() || 'Added via admin panel',
      });
      toast.success('New customer added to database');
    }

    setIsModalOpen(false);
    refreshCustomers();
  };

  const filteredCustomers = customers.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      storage.deleteCustomer(id);
      refreshCustomers();
      toast.success('Customer deleted successfully');
    }
  };

  const renderRoleBadge = (role?: UserRole) => {
    const currentRole = role || 'user';
    switch (currentRole) {
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
            Admin
          </span>
        );
      case 'owner':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Owner
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
            User
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
            <Users className="w-7 h-7 text-amber-400" /> Customer Directory & User Roles
          </h1>
          <p className="text-muted-foreground">Manage customer records and assign user account roles (User / Admin / Owner)</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-900/40 border-white/10"
            />
          </div>
          <Button
            onClick={openAddModal}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <Card className="border-0 bg-slate-900/60 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            Customer List ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 px-4 sm:-mx-0 sm:px-0">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-300">Name</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Phone</TableHead>
                  <TableHead className="text-slate-300">Account Role</TableHead>
                  <TableHead className="text-slate-300">Joined Date</TableHead>
                  <TableHead className="text-right text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="font-medium text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                          {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div>{customer.name}</div>
                          {customer.notes && (
                            <div className="text-[10px] text-amber-400/80">{customer.notes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{customer.email || 'N/A'}</TableCell>
                      <TableCell className="text-slate-300">{customer.phone || 'N/A'}</TableCell>
                      <TableCell>{renderRoleBadge(customer.role)}</TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {customer.joinDate || 'Recent'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(customer)}
                            className="hover:bg-amber-500/10 hover:text-amber-400 text-slate-300 text-xs gap-1"
                            title="Change Role"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                            <span>Change Role</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(customer.id)}
                            className="hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CHANGE ROLE / ADD CUSTOMER DIALOG MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              {editingCustomer ? 'Change Customer Role' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              {editingCustomer
                ? 'Update the permissions role of this customer.'
                : 'Add a new customer entry to the permanent database.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {editingCustomer && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Customer details are read-only. Admins can only modify the user role.</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="cust-name" className="text-xs text-slate-200">Full Name</Label>
              <Input
                id="cust-name"
                placeholder="e.g. Sarah Jenkins"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={!!editingCustomer}
                className={`bg-slate-800/80 border-white/10 text-white text-sm ${
                  editingCustomer ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                required={!editingCustomer}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-email" className="text-xs text-slate-200">Email Address</Label>
              <Input
                id="cust-email"
                type="email"
                placeholder="sarah@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                disabled={!!editingCustomer}
                className={`bg-slate-800/80 border-white/10 text-white text-sm ${
                  editingCustomer ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-phone" className="text-xs text-slate-200">Phone Number</Label>
              <Input
                id="cust-phone"
                placeholder="+91 98765 43210"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                disabled={!!editingCustomer}
                className={`bg-slate-800/80 border-white/10 text-white text-sm ${
                  editingCustomer ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* ROLE SELECTOR (User, Owner, Admin) */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <Label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Select Customer Role *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormRole('user')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center ${
                    formRole === 'user'
                      ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800/60 text-slate-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setFormRole('owner')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center ${
                    formRole === 'owner'
                      ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800/60 text-slate-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() => setFormRole('admin')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center ${
                    formRole === 'admin'
                      ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-lg shadow-purple-500/20'
                      : 'bg-slate-800/60 text-slate-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {!editingCustomer && (
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="cust-notes" className="text-xs text-slate-200">Notes / Tags</Label>
                <Input
                  id="cust-notes"
                  placeholder="e.g. VIP Member"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="bg-slate-800/80 border-white/10 text-white text-sm"
                />
              </div>
            )}

            <DialogFooter className="pt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-white/10 text-slate-300 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
              >
                {editingCustomer ? 'Update Role' : 'Create Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
