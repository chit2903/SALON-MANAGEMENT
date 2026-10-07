import React, { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { api } from '../services/api';
import type { Offer, Salon, Service } from '../types';
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
import { Plus, Edit, Trash2, Tag, Building2, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatPrice } from '../utils/currency';

type OfferForm = {
  name: string;
  description: string;
  salonId: string;
  serviceId: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  active: boolean;
};

const emptyOfferForm = (): OfferForm => ({
  name: '',
  description: '',
  salonId: '',
  serviceId: '',
  discountType: 'percentage',
  discountValue: 10,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
  active: true,
});

export const OffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [offerForm, setOfferForm] = useState<OfferForm>(emptyOfferForm());
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setOffers(storage.getOffers());
    setSalons(storage.getSalons());
    setServices(storage.getServices());

    try {
      const remoteSalons = await api.getResource<Salon>('salons').catch(() => []);
      if (remoteSalons && remoteSalons.length > 0) setSalons(remoteSalons);
    } catch (err) {
      // fallback to storage
    }
  };

  const handleOfferSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!offerForm.name.trim()) {
      toast.error('Please provide an offer name');
      return;
    }

    const selectedSalon = salons.find((s) => s.id === offerForm.salonId);
    const salonServices = selectedSalon?.services?.length ? selectedSalon.services : services;
    const selectedService = salonServices.find((s) => s.id === offerForm.serviceId);

    const payload = {
      name: offerForm.name.trim(),
      description: offerForm.description.trim(),
      salonId: offerForm.salonId,
      salonName: selectedSalon ? selectedSalon.name : 'All Salons',
      serviceId: offerForm.serviceId,
      serviceName: selectedService ? selectedService.name : 'All Salon Services',
      discountType: offerForm.discountType,
      discountValue: Number(offerForm.discountValue),
      startDate: offerForm.startDate,
      endDate: offerForm.endDate,
      active: offerForm.active,
    };

    if (editingOfferId) {
      storage.updateOffer(editingOfferId, payload);
      toast.success('Offer updated successfully');
    } else {
      storage.createOffer(payload);
      toast.success(`Offer created for ${payload.salonName} (${payload.serviceName})`);
    }

    setOfferForm(emptyOfferForm());
    setEditingOfferId(null);
    refreshData();
  };

  const handleDeleteOffer = (id: string) => {
    if (confirm('Delete this offer?')) {
      storage.deleteOffer(id);
      refreshData();
      toast.success('Offer deleted');
    }
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setOfferForm({
      name: offer.name,
      description: offer.description ?? '',
      salonId: offer.salonId ?? '',
      serviceId: offer.serviceId ?? '',
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      startDate: offer.startDate,
      endDate: offer.endDate,
      active: offer.active,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
          <Tag className="w-7 h-7 text-amber-400" /> Offers Management
        </h1>
        <p className="text-muted-foreground">Assign promotional offers to created salons & specific salon services</p>
      </div>

      {/* OFFERS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <Card className="border-0 bg-slate-900/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-400">
              <Building2 className="w-5 h-5 text-amber-400" /> Salon Offers List ({offers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 px-4 sm:-mx-0 sm:px-0">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-slate-300">Offer Name</TableHead>
                    <TableHead className="text-slate-300">Salon</TableHead>
                    <TableHead className="text-slate-300">Salon Service</TableHead>
                    <TableHead className="text-slate-300">Discount</TableHead>
                    <TableHead className="text-slate-300">Validity</TableHead>
                    <TableHead className="text-right text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-slate-400">
                        No offers created yet. Use the form to add an offer to a salon & service.
                      </TableCell>
                    </TableRow>
                  ) : (
                    offers.map((offer, index) => (
                      <motion.tr key={offer.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} className="border-white/5 hover:bg-white/5">
                        <TableCell className="font-medium text-white">
                          {offer.name}
                          {offer.description && <div className="text-[11px] text-slate-400">{offer.description}</div>}
                        </TableCell>
                        <TableCell className="text-amber-300 font-semibold">{offer.salonName || 'All Salons'}</TableCell>
                        <TableCell className="text-slate-300 text-xs font-medium flex items-center gap-1 mt-1">
                          <Scissors className="w-3 h-3 text-amber-400 inline" /> {offer.serviceName || 'All Salon Services'}
                        </TableCell>
                        <TableCell className="text-amber-400 font-bold">{offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : formatPrice(offer.discountValue)}</TableCell>
                        <TableCell className="text-xs text-slate-400">{offer.startDate} → {offer.endDate}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditOffer(offer)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteOffer(offer.id)}>
                              <Trash2 className="h-4 w-4 text-red-400" />
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

        {/* ADD / EDIT OFFER FORM WITH SALON & SERVICE DROPDOWNS */}
        <Card className="border-0 bg-slate-900/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-400">{editingOfferId ? 'Edit Salon Offer' : 'Add Offer to Salon & Service'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOfferSubmit} className="space-y-4">
              {/* SALON DROPDOWN MENU */}
              <div className="space-y-1.5">
                <Label htmlFor="offer-salon" className="text-xs text-slate-200 font-medium">Select Created Salon *</Label>
                <select
                  id="offer-salon"
                  value={offerForm.salonId}
                  onChange={(event) => setOfferForm({ ...offerForm, salonId: event.target.value, serviceId: '' })}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- All Salons (Global Offer) --</option>
                  {salons.map((salon) => (
                    <option key={salon.id} value={salon.id}>
                      {salon.name} ({salon.city || 'Salon'})
                    </option>
                  ))}
                </select>
              </div>

              {/* SALON SERVICE DROPDOWN MENU */}
              <div className="space-y-1.5">
                <Label htmlFor="offer-service" className="text-xs text-slate-200 font-medium">Select Salon Service *</Label>
                <select
                  id="offer-service"
                  value={offerForm.serviceId}
                  onChange={(event) => setOfferForm({ ...offerForm, serviceId: event.target.value })}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- All Services in Salon --</option>
                  {(() => {
                    const activeSalon = salons.find((s) => s.id === offerForm.salonId);
                    const availServices = activeSalon?.services?.length ? activeSalon.services : services;
                    return availServices.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} ({formatPrice(srv.price)})
                      </option>
                    ));
                  })()}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="offer-name" className="text-xs text-slate-200">Offer Name *</Label>
                <Input id="offer-name" placeholder="e.g. Festival Special 20% OFF" value={offerForm.name} onChange={(event) => setOfferForm({ ...offerForm, name: event.target.value })} className="bg-slate-800 border-white/10 text-white" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="offer-description" className="text-xs text-slate-200">Description</Label>
                <Input id="offer-description" placeholder="Valid on hair & facial services" value={offerForm.description} onChange={(event) => setOfferForm({ ...offerForm, description: event.target.value })} className="bg-slate-800 border-white/10 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="offer-type" className="text-xs text-slate-200">Discount Type</Label>
                  <select id="offer-type" value={offerForm.discountType} onChange={(event) => setOfferForm({ ...offerForm, discountType: event.target.value as 'percentage' | 'fixed' })} className="flex h-10 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="offer-value" className="text-xs text-slate-200">Discount Value</Label>
                  <Input id="offer-value" type="number" min={1} value={offerForm.discountValue} onChange={(event) => setOfferForm({ ...offerForm, discountValue: Number(event.target.value) })} className="bg-slate-800 border-white/10 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="offer-start" className="text-xs text-slate-200">Start Date</Label>
                  <Input id="offer-start" type="date" value={offerForm.startDate} onChange={(event) => setOfferForm({ ...offerForm, startDate: event.target.value })} className="bg-slate-800 border-white/10 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="offer-end" className="text-xs text-slate-200">End Date</Label>
                  <Input id="offer-end" type="date" value={offerForm.endDate} onChange={(event) => setOfferForm({ ...offerForm, endDate: event.target.value })} className="bg-slate-800 border-white/10 text-white" />
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold h-10 shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                {editingOfferId ? 'Update Offer' : 'Add Offer to Salon'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

