import React, { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import type { Membership } from '../types';
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
import { Plus, Edit, Trash2, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatPrice } from '../utils/currency';

type MembershipForm = {
  name: string;
  description: string;
  price: number;
  duration: number;
  benefits: string;
};

const emptyForm = (): MembershipForm => ({
  name: '',
  description: '',
  price: 0,
  duration: 30,
  benefits: '',
});

export const MembershipsPage: React.FC = () => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [form, setForm] = useState<MembershipForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    refreshMemberships();
  }, []);

  const refreshMemberships = () => {
    setMemberships(storage.getMemberships());
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      duration: Number(form.duration),
      benefits: form.benefits.split(',').map((benefit) => benefit.trim()).filter(Boolean),
    };

    if (!payload.name) {
      toast.error('Please provide a membership name');
      return;
    }

    if (editingId) {
      storage.updateMembership(editingId, payload);
      toast.success('Membership updated');
    } else {
      storage.createMembership(payload);
      toast.success('Membership created');
    }

    setForm(emptyForm());
    setEditingId(null);
    refreshMemberships();
  };

  const handleEdit = (membership: Membership) => {
    setEditingId(membership.id);
    setForm({
      name: membership.name,
      description: membership.description ?? '',
      price: membership.price,
      duration: membership.duration,
      benefits: membership.benefits.join(', '),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this membership?')) {
      storage.deleteMembership(id);
      refreshMemberships();
      toast.success('Membership deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
          <Crown className="w-7 h-7 text-amber-400" /> Memberships
        </h1>
        <p className="text-muted-foreground">Create programs and loyalty plans</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="border-0 bg-white/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle>Available Membership Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 px-4 sm:-mx-0 sm:px-0">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Benefits</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.map((membership, index) => (
                    <motion.tr key={membership.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
                      <TableCell className="font-medium">{membership.name}</TableCell>
                      <TableCell>{formatPrice(membership.price)}</TableCell>
                      <TableCell>{membership.duration} days</TableCell>
                      <TableCell>{membership.benefits.join(', ')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(membership)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(membership.id)}>
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
            <CardTitle>{editingId ? 'Edit Membership' : 'Add Membership'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="membership-name">Name</Label>
                <Input id="membership-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="membership-description">Description</Label>
                <Input id="membership-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="membership-price">Price</Label>
                  <Input id="membership-price" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="membership-duration">Duration (days)</Label>
                  <Input id="membership-duration" type="number" value={form.duration} onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="membership-benefits">Benefits (comma separated)</Label>
                <Input id="membership-benefits" value={form.benefits} onChange={(event) => setForm({ ...form, benefits: event.target.value })} />
              </div>

              <Button type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                {editingId ? 'Update Membership' : 'Add Membership'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
