import React, { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import type { Staff } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Plus, Search, Edit, Trash2, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type StaffForm = {
  name: string;
  email: string;
  phone: string;
  role: string;
  commissionRate: number;
  joinDate: string;
};

const emptyForm = (): StaffForm => ({
  name: '',
  email: '',
  phone: '',
  role: 'Stylist',
  commissionRate: 0.15,
  joinDate: new Date().toISOString().split('T')[0],
});

export const StaffPage: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<StaffForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    refreshStaff();
  }, []);

  const refreshStaff = () => {
    setStaff(storage.getStaff());
  };

  const filteredStaff = staff.filter((member) =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase()) ||
    member.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role.trim(),
      commissionRate: Number(form.commissionRate),
      joinDate: form.joinDate,
    };

    if (!payload.name || !payload.email || !payload.phone) {
      toast.error('Please complete the required staff fields');
      return;
    }

    if (editingId) {
      storage.updateStaff(editingId, payload);
      toast.success('Staff updated');
    } else {
      storage.createStaff(payload);
      toast.success('Staff created');
    }

    setForm(emptyForm());
    setEditingId(null);
    refreshStaff();
  };

  const handleEdit = (member: Staff) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      commissionRate: member.commissionRate,
      joinDate: member.joinDate,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this staff member?')) {
      storage.deleteStaff(id);
      refreshStaff();
      toast.success('Staff member removed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-amber-400" /> Staff Management
          </h1>
          <p className="text-muted-foreground">Manage salon team members and commissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-6">
        <Card className="border-0 bg-white/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle>Team Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search staff..."
                className="pl-10"
              />
            </div>

            <div className="overflow-x-auto -mx-4 px-4 sm:-mx-0 sm:px-0">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member, index) => (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{(member.commissionRate * 100).toFixed(0)}%</TableCell>
                      <TableCell>{member.joinDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle>{editingId ? 'Edit Staff Member' : 'Add Staff Member'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full name</Label>
                <Input
                  id="staff-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone</Label>
                <Input
                  id="staff-phone"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-role">Role</Label>
                <Input
                  id="staff-role"
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-commission">Commission</Label>
                  <Input
                    id="staff-commission"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={form.commissionRate}
                    onChange={(event) => setForm({ ...form, commissionRate: Number(event.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-join-date">Join date</Label>
                  <Input
                    id="staff-join-date"
                    type="date"
                    value={form.joinDate}
                    onChange={(event) => setForm({ ...form, joinDate: event.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {editingId ? 'Update Staff' : 'Add Staff'}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm());
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
