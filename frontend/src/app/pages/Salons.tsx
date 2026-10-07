import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../services/storage';
import { api } from '../services/api';
import type { Salon, Service } from '../types';
import { Plus, Search, MapPin, Phone, Mail, Star, Edit, Trash2, Scissors, Building2, X, Upload, Image as ImageIcon, Link as LinkIcon, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';

const TIME_OPTIONS = [
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
];

export const SalonsPage: React.FC = () => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    image: '',
    rating: 4.5,
    openTime: '09:00 AM',
    closeTime: '09:00 PM',
  });

  const [servicesList, setServicesList] = useState<Omit<Service, 'id'>[]>([
    { name: 'Haircut & Styling', description: 'Professional hair styling', duration: 45, price: 350, category: 'Hair' },
    { name: 'Facial & Glow', description: 'Deep cleansing facial', duration: 60, price: 600, category: 'Skin' },
  ]);

  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(300);

  useEffect(() => {
    loadSalons();
  }, []);

  const loadSalons = async () => {
    const data = storage.getSalons();
    setSalons(data);

    try {
      const remoteSalons = await api.getSalons();
      if (remoteSalons && remoteSalons.length > 0) {
        setSalons(remoteSalons);
      }
    } catch (e) {
      console.warn('Backend fetch failed, using local state');
    }
  };

  const handleOpenAddModal = () => {
    setEditingSalon(null);
    setImageInputMode('upload');
    setFormData({
      name: '',
      city: '',
      address: '',
      phone: '',
      email: '',
      description: '',
      image: '',
      rating: 4.8,
      openTime: '09:00 AM',
      closeTime: '09:00 PM',
    });
    setServicesList([
      { name: 'Haircut & Styling', description: 'Professional hair styling', duration: 45, price: 350, category: 'Hair' },
    ]);
    setIsOpen(true);
  };

  const handleOpenEditModal = (salon: Salon) => {
    setEditingSalon(salon);
    setImageInputMode(salon.image && salon.image.startsWith('data:') ? 'upload' : 'url');
    setFormData({
      name: salon.name,
      city: salon.city || '',
      address: salon.address,
      phone: salon.phone,
      email: salon.email,
      description: salon.description,
      image: salon.image,
      rating: salon.rating,
      openTime: salon.openTime || '09:00 AM',
      closeTime: salon.closeTime || '09:00 PM',
    });
    setServicesList(salon.services || []);
    setIsOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size exceeds 5MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    setServicesList([
      ...servicesList,
      {
        name: newServiceName.trim(),
        description: `${newServiceName.trim()} service`,
        duration: 30,
        price: Number(newServicePrice) || 300,
        category: 'General',
      },
    ]);
    setNewServiceName('');
    setNewServicePrice(300);
  };

  const handleRemoveService = (index: number) => {
    setServicesList(servicesList.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    const formattedServices: Service[] = servicesList.map((s, idx) => ({
      id: `service-${idx + 1}-${Date.now()}`,
      ...s,
    }));

    const finalImage = formData.image || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=400&fit=crop';

    if (editingSalon) {
      const updated = storage.updateSalon(editingSalon.id, {
        ...formData,
        image: finalImage,
        services: formattedServices,
      });
      if (updated) {
        setSalons(salons.map(s => s.id === editingSalon.id ? updated : s));
      }
    } else {
      const created = storage.createSalon({
        ...formData,
        image: finalImage,
        services: formattedServices,
      });
      setSalons([...salons, created]);
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this salon?')) {
      storage.deleteSalon(id);
      setSalons(salons.filter(s => s.id !== id));
    }
  };

  const filteredSalons = salons.filter(
    s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
            <Building2 className="w-7 h-7 text-amber-400" /> Salon Management
          </h1>
          <p className="text-muted-foreground">Add, manage, and inspect all salons registered in your network.</p>
        </div>

        <Button onClick={handleOpenAddModal} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold shadow-md shadow-amber-500/20">
          <Plus className="mr-2 h-4 w-4" /> Add New Salon
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search salons by name, city, or address..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Salons Grid */}
      {filteredSalons.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-white/20 bg-white/5 backdrop-blur-sm text-white">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No Salons Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm ? 'No salons match your search criteria.' : 'No salons have been added yet.'}
          </p>
          <Button onClick={handleOpenAddModal} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Plus className="mr-2 h-4 w-4" /> Add First Salon
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSalons.map(salon => (
            <Card key={salon.id} className="overflow-hidden flex flex-col justify-between border-white/10 bg-white/5 backdrop-blur-sm text-white hover:border-amber-500/50 transition-all">
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  <img
                    src={salon.image || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=400&fit=crop'}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                  />
                  {salon.city && (
                    <span className="absolute top-3 left-3 bg-black/70 text-amber-400 text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
                      {salon.city}
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-amber-500 text-black text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow">
                    <Star className="w-3 h-3 fill-black" /> {salon.rating || 4.5}
                  </span>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-xl line-clamp-1">{salon.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">{salon.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 text-xs">{salon.address}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs pt-1">
                    {salon.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <span>{salon.phone}</span>
                      </div>
                    )}
                    {salon.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                        <span className="truncate max-w-[140px]">{salon.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium pt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Hours: {salon.openTime || '09:00 AM'} - {salon.closeTime || '09:00 PM'}</span>
                  </div>

                  {salon.services && salon.services.length > 0 && (
                    <div className="pt-2 border-t border-border/40 mt-2">
                      <div className="flex items-center gap-1 text-xs text-foreground font-medium mb-1">
                        <Scissors className="w-3.5 h-3.5 text-amber-500" />
                        <span>{salon.services.length} Services Offered</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {salon.services.slice(0, 3).map((srv, i) => (
                          <span key={i} className="text-[10px] bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                            {srv.name} (₹{srv.price})
                          </span>
                        ))}
                        {salon.services.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{salon.services.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>

              <CardFooter className="pt-2 border-t border-border/40 flex justify-end gap-2 bg-muted/20">
                <Button size="sm" variant="ghost" onClick={() => handleOpenEditModal(salon)}>
                  <Edit className="w-4 h-4 mr-1 text-amber-500" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(salon.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Salon Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSalon ? 'Edit Salon Details' : 'Add New Salon'}</DialogTitle>
            <DialogDescription>
              Fill out the details below to register and display this salon on the platform.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Salon Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. THE INDIAN SALON"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="e.g. Ahmedabad, Mumbai, Hyderabad"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address *</Label>
              <Input
                id="address"
                placeholder="Street address, landmark, area"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@salon.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* OPENING AND CLOSING TIME DROPDOWN MENUS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openTime">Opening Time *</Label>
                <select
                  id="openTime"
                  value={formData.openTime}
                  onChange={e => setFormData({ ...formData, openTime: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="closeTime">Closing Time *</Label>
                <select
                  id="closeTime"
                  value={formData.closeTime}
                  onChange={e => setFormData({ ...formData, closeTime: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description / Tagline</Label>
              <Input
                id="description"
                placeholder="Haircut, styling, facial, manicure · Starting at ₹300+"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Banner Image Upload Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-500" /> Salon Banner Image
                </Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`text-xs px-2.5 py-1 rounded transition-colors ${
                      imageInputMode === 'upload' ? 'bg-amber-500 text-black font-semibold' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Upload className="w-3 h-3 inline mr-1" /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`text-xs px-2.5 py-1 rounded transition-colors ${
                      imageInputMode === 'url' ? 'bg-amber-500 text-black font-semibold' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3 inline mr-1" /> Image URL
                  </button>
                </div>
              </div>

              {imageInputMode === 'upload' ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  {formData.image ? (
                    <div className="relative rounded-lg overflow-hidden border border-border h-40 group bg-muted">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change Image
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setFormData({ ...formData, image: '' })}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border hover:border-amber-500 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/20 hover:bg-amber-500/5 text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Click to upload salon image</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  )}
                </div>
              ) : (
                <Input
                  id="image"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1.0 - 5.0)</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={formData.rating}
                onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) || 4.5 })}
              />
            </div>

            {/* Services Builder */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-500" /> Salon Services Catalog
              </Label>

              <div className="flex gap-2">
                <Input
                  placeholder="Service Name (e.g. Haircut)"
                  value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Price (₹)"
                  value={newServicePrice}
                  onChange={e => setNewServicePrice(Number(e.target.value))}
                  className="w-28"
                />
                <Button type="button" onClick={handleAddService} variant="secondary">
                  Add Service
                </Button>
              </div>

              {servicesList.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {servicesList.map((srv, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-muted/50 px-3 py-1.5 rounded text-sm">
                      <div>
                        <span className="font-medium">{srv.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">₹{srv.price} • {srv.duration} mins</span>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleRemoveService(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                {editingSalon ? 'Save Changes' : 'Create Salon'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default SalonsPage;
