import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { storage } from '../services/storage';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Salon, Service, Offer } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Star, MapPin, Phone, Clock, Calendar, ArrowLeft, Check, Tag, Sparkles, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatPrice } from '../utils/currency';

export const SalonDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  useEffect(() => {
    if (id) {
      const foundSalon = storage.getSalonById(id);
      setSalon(foundSalon || null);
    }
    setOffers(storage.getOffers());
  }, [id]);

  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      setCustomerPhone(user.phone);
    }
  }, [user]);

  const activeSalonOffers = useMemo(() => {
    if (!salon) return [];
    return offers.filter(
      (o) => o.active && (!o.salonId || o.salonId === salon.id)
    );
  }, [salon, offers]);

  const getOfferForService = (serviceId: string, serviceName: string) => {
    return activeSalonOffers.find(
      (o) =>
        !o.serviceId ||
        o.serviceId === serviceId ||
        (o.serviceName && o.serviceName.toLowerCase() === serviceName.toLowerCase())
    );
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectedServicesList = useMemo(() => {
    if (!salon) return [];
    return salon.services.filter((s) => selectedServiceIds.includes(s.id));
  }, [salon, selectedServiceIds]);

  const calculateServicePricing = (service: Service) => {
    const matchedOffer = getOfferForService(service.id, service.name);
    const originalPrice = service.price || 0;
    let discountAmount = 0;
    if (matchedOffer) {
      discountAmount =
        matchedOffer.discountType === 'percentage'
          ? originalPrice * (matchedOffer.discountValue / 100)
          : Math.min(originalPrice, matchedOffer.discountValue);
    }
    const offerAmount = Math.max(0, originalPrice - discountAmount);
    return {
      originalPrice,
      matchedOffer,
      discountAmount,
      offerAmount,
    };
  };

  const selectedServicesPricingList = useMemo(() => {
    return selectedServicesList.map((s) => ({
      service: s,
      ...calculateServicePricing(s),
    }));
  }, [selectedServicesList, activeSalonOffers]);

  const totalOriginalPrice = useMemo(() => {
    return selectedServicesPricingList.reduce((sum, item) => sum + item.originalPrice, 0);
  }, [selectedServicesPricingList]);

  const totalDiscountSavings = useMemo(() => {
    return selectedServicesPricingList.reduce((sum, item) => sum + item.discountAmount, 0);
  }, [selectedServicesPricingList]);

  const totalOfferAmount = useMemo(() => {
    return selectedServicesPricingList.reduce((sum, item) => sum + item.offerAmount, 0);
  }, [selectedServicesPricingList]);

  const totalSelectedDuration = useMemo(() => {
    return selectedServicesList.reduce((sum, s) => sum + (s.duration || 0), 0);
  }, [selectedServicesList]);

  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 540; // default 09:00 AM
    const cleaned = timeStr.trim().toUpperCase();
    const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
    if (!match) return 540;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3];

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const openMins = useMemo(() => parseTimeToMinutes(salon?.openTime || '09:00 AM'), [salon]);
  const closeMins = useMemo(() => parseTimeToMinutes(salon?.closeTime || '09:00 PM'), [salon]);

  const isClosedNow = useMemo(() => {
    if (!salon) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate === todayStr) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      return currentMins < openMins || currentMins > closeMins;
    }
    return false;
  }, [salon, selectedDate, openMins, closeMins]);

  const availableTimeSlots = useMemo(() => {
    const rawSlots = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
      '20:00', '20:30', '21:00', '21:30', '22:00'
    ];

    return rawSlots.filter((slot) => {
      const slotMins = parseTimeToMinutes(slot);
      return slotMins >= openMins && slotMins <= closeMins;
    });
  }, [openMins, closeMins]);

  useEffect(() => {
    if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(selectedTime)) {
      setSelectedTime(availableTimeSlots[0]);
    }
  }, [availableTimeSlots]);

  const handleBook = async () => {
    if (selectedServiceIds.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    if (!customerName || !customerPhone || !salon) {
      toast.error('Please fill in your name and phone number');
      return;
    }

    if (isClosedNow) {
      toast.error(
        `Booking Closed Until Open! Operating hours for ${salon.name} are ${salon.openTime || '09:00 AM'} to ${salon.closeTime || '09:00 PM'}.`
      );
      return;
    }

    const selectedMins = parseTimeToMinutes(selectedTime);
    if (selectedMins < openMins || selectedMins > closeMins) {
      toast.error(
        `Cannot book after closing time! Operating hours for ${salon.name} are ${salon.openTime || '09:00 AM'} to ${salon.closeTime || '09:00 PM'}.`
      );
      return;
    }

    try {
      for (const item of selectedServicesPricingList) {
        const { service, originalPrice, matchedOffer, discountAmount, offerAmount } = item;
        const payload = {
          salonId: salon.id,
          customerId: user?.id,
          customerName,
          customerPhone,
          serviceId: service.id,
          serviceName: service.name,
          date: selectedDate,
          time: selectedTime,
          status: 'scheduled' as const,
          originalPrice,
          offerId: matchedOffer?.id,
          offerName: matchedOffer?.name,
          discountAmount,
          amount: offerAmount,
          offerAmount,
        };

        const created = await api.createAppointment(payload);
        if (created) {
          const db = storage.getDatabase();
          if (!db.appointments.some((a) => a.id === created.id)) {
            db.appointments.push(created);
            storage.setDatabase(db);
          }
        }
      }

      toast.success(`${selectedServiceIds.length} service(s) booked successfully for ${formatPrice(totalOfferAmount)}!`);
      navigate('/my-bookings');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create booking');
    }
  };

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white">
        <p>Salon not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pb-12">
      <div className="relative">
        <img
          src={salon.image}
          alt={salon.name}
          className="w-full h-64 md:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm hover:bg-black/70"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="container mx-auto px-4 -mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{salon.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-400">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-white">{salon.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{salon.address}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{salon.phone}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-medium bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 text-xs">
                  <Clock className="h-3.5 h-3.5 text-amber-400" />
                  <span>Hours: {salon.openTime || '09:00 AM'} - {salon.closeTime || '09:00 PM'}</span>
                </div>
              </div>
              <p className="mt-4 text-gray-300">{salon.description}</p>
            </motion.div>

            {/* ACTIVE OFFERS BANNER FOR THIS SALON */}
            {activeSalonOffers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 space-y-2 shadow-lg"
              >
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-400" /> Active Promotional Offers for {salon.name}
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeSalonOffers.map((o) => (
                    <span
                      key={o.id}
                      className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40 flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>{o.name}:</span>
                      <span className="text-white font-bold">
                        {o.discountType === 'percentage' ? `${o.discountValue}% OFF` : `${formatPrice(o.discountValue)} OFF`}
                      </span>
                      {o.serviceName && o.serviceName !== 'All Salon Services' && (
                        <span className="text-[10px] opacity-80">({o.serviceName})</span>
                      )}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Services & Special Offers</h2>
                  <p className="text-xs text-amber-400">Select one or more services to book (active offer discounts applied automatically)</p>
                </div>
                {selectedServiceIds.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                    {selectedServiceIds.length} Selected
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {salon.services.map((service) => {
                  const isSelected = selectedServiceIds.includes(service.id);
                  const matchedOffer = getOfferForService(service.id, service.name);

                  let finalPrice = service.price;
                  if (matchedOffer) {
                    finalPrice =
                      matchedOffer.discountType === 'percentage'
                        ? service.price * (1 - matchedOffer.discountValue / 100)
                        : Math.max(0, service.price - matchedOffer.discountValue);
                  }

                  return (
                    <Card
                      key={service.id}
                      className={`cursor-pointer transition-all relative overflow-hidden border ${isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      onClick={() => toggleService(service.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg text-white">{service.name}</CardTitle>
                            {matchedOffer && (
                              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/40 w-fit">
                                <Tag className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>Offer: {matchedOffer.name} ({matchedOffer.discountType === 'percentage' ? `${matchedOffer.discountValue}% OFF` : `₹${matchedOffer.discountValue} OFF`})</span>
                              </div>
                            )}
                          </div>
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center border shrink-0 ${isSelected
                                ? 'bg-amber-500 border-amber-400 text-black font-bold'
                                : 'border-white/30 text-transparent'
                              }`}
                          >
                            <Check className="w-4 h-4" />
                          </div>
                        </div>
                        <CardDescription className="text-gray-400">{service.category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-300 mb-3">{service.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-gray-400 text-sm">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span>{service.duration} min</span>
                          </div>
                          <div className="text-right">
                            {matchedOffer ? (
                              <div className="flex flex-col items-end">
                                <span className="text-xs line-through text-slate-400">{formatPrice(service.price)}</span>
                                <span className="text-xl font-bold text-amber-400">{formatPrice(finalPrice)}</span>
                              </div>
                            ) : (
                              <span className="text-xl font-bold text-amber-400">{formatPrice(service.price)}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm sticky top-4">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-400" />
                    Book Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name"
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter your phone"
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                  {isClosedNow && (
                    <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-medium space-y-1">
                      <div className="font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Clock className="w-4 h-4 shrink-0 text-red-400" />
                        <span>Booking Closed Until Open</span>
                      </div>
                      <p className="text-[11px] text-red-200/90 leading-relaxed">
                        Operating hours for {salon.name} are {salon.openTime || '09:00 AM'} to {salon.closeTime || '09:00 PM'}. Salon timing is over for today.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="time">Time Slot</Label>
                      <span className="text-[10px] text-amber-400 font-semibold">
                        Timing : {salon.openTime || '09:00 AM'} - {salon.closeTime || '09:00 PM'}
                      </span>
                    </div>
                    {availableTimeSlots.length === 0 || isClosedNow ? (
                      <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-semibold text-center uppercase tracking-wider">
                        Booking Closed Until Open
                      </div>
                    ) : (
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger id="time" className="bg-white/10 border-white/20">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-white/20">
                          {availableTimeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* SELECTED SERVICES SUMMARY */}
                  {selectedServicesPricingList.length > 0 ? (
                    <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between text-xs text-amber-300 font-semibold uppercase tracking-wider">
                        <span>Selected Services ({selectedServicesPricingList.length})</span>
                        {totalDiscountSavings > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                            <Tag className="w-3 h-3 text-emerald-400" />
                            Save {formatPrice(totalDiscountSavings)}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {selectedServicesPricingList.map(({ service, originalPrice, matchedOffer, offerAmount }) => (
                          <div key={service.id} className="flex flex-col border-b border-white/5 pb-1.5 last:border-b-0">
                            <div className="flex items-center justify-between text-xs text-white">
                              <span className="truncate max-w-[150px] font-medium">{service.name}</span>
                              <div className="flex items-center gap-1.5">
                                {matchedOffer ? (
                                  <>
                                    <span className="text-[11px] line-through text-slate-400">{formatPrice(originalPrice)}</span>
                                    <span className="font-bold text-amber-400">{formatPrice(offerAmount)}</span>
                                  </>
                                ) : (
                                  <span className="font-semibold text-amber-400">{formatPrice(originalPrice)}</span>
                                )}
                              </div>
                            </div>
                            {matchedOffer && (
                              <div className="text-[10px] text-amber-300/80 flex items-center gap-1 mt-0.5">
                                <Tag className="w-2.5 h-2.5 text-amber-400" />
                                <span>{matchedOffer.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-amber-500/20 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Est. Duration:</span>
                          <span className="font-medium text-white">{totalSelectedDuration} mins</span>
                        </div>
                        {totalDiscountSavings > 0 && (
                          <>
                            <div className="flex items-center justify-between text-xs text-slate-300">
                              <span>Original Subtotal:</span>
                              <span className="line-through text-slate-400">{formatPrice(totalOriginalPrice)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                              <span>Offer Savings:</span>
                              <span>-{formatPrice(totalDiscountSavings)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center justify-between text-base font-extrabold text-amber-400 pt-1">
                          <span>Book Offer Total:</span>
                          <span>{formatPrice(totalOfferAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-white/10 text-center text-xs text-slate-400">
                      No services selected yet. Click on any service above to add it to your booking.
                    </div>
                  )}

                  <Button
                    disabled={selectedServicesList.length === 0 || isClosedNow || availableTimeSlots.length === 0}
                    className={`w-full h-12 rounded-xl mt-4 font-bold transition-all ${
                      isClosedNow || availableTimeSlots.length === 0
                        ? 'bg-red-950/70 border border-red-500/40 text-red-300 cursor-not-allowed opacity-90 uppercase tracking-wider text-xs'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                    }`}
                    onClick={handleBook}
                  >
                    {isClosedNow || availableTimeSlots.length === 0
                      ? 'Booking Closed Until Open'
                      : `Confirm Booking (${selectedServicesList.length} Service${selectedServicesList.length === 1 ? '' : 's'})`
                    }
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

