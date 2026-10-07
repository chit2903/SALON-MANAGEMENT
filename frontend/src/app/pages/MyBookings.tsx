import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { storage } from '../services/storage';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, Salon } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, Clock, MapPin, Phone, ArrowLeft, Trash2, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatPrice } from '../utils/currency';

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Appointment[]>([]);

  useEffect(() => {
    refreshBookings();
  }, [user]);

  const refreshBookings = async () => {
    const appointments = await api.getAppointments();
    const filtered = appointments.filter(
      (a) => a.salonId && a.status !== 'completed' && (!user || a.customerId === user.id || a.customerName === user.name)
    );
    setBookings(filtered);
  };

  const getSalonName = (salonId?: string) => {
    if (!salonId) return 'Unknown Salon';
    const salon = storage.getSalonById(salonId);
    return salon?.name || 'Unknown Salon';
  };

  const getSalonImage = (salonId?: string) => {
    if (!salonId) return '';
    const salon = storage.getSalonById(salonId);
    return salon?.image || '';
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        await api.deleteAppointment(id);
        await refreshBookings();
        toast.success('Booking cancelled');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to cancel booking');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pb-12">
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/user-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">My Bookings</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {bookings.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-xl font-semibold mb-2">No Bookings Yet</h2>
            <p className="text-gray-400 mb-6">Book your first appointment to get started!</p>
            <Button onClick={() => navigate('/user-dashboard')} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
              Browse Salons
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking, index) => {
              const displayPrice = booking.offerAmount ?? booking.amount ?? booking.originalPrice;
              const hasOffer = Boolean(booking.offerName || (booking.discountAmount && booking.discountAmount > 0));

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-white/5 border-white/10 overflow-hidden">
                    <div className="h-32 relative">
                      <img
                        src={getSalonImage(booking.salonId)}
                        alt={getSalonName(booking.salonId)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle>{getSalonName(booking.salonId)}</CardTitle>
                      <CardDescription className="text-amber-400 font-medium text-sm flex items-center justify-between">
                        <span>{booking.serviceName}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar className="h-4 w-4 text-amber-400" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock className="h-4 w-4 text-amber-400" />
                        <span>{booking.time}</span>
                      </div>

                      {/* OFFER & PRICE BREAKDOWN */}
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1">
                        {hasOffer ? (
                          <>
                            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
                              <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Offer Applied: {booking.offerName || 'Promotional Offer'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                              <span className="text-slate-400">Original Price:</span>
                              <span className="line-through text-slate-400">{formatPrice(booking.originalPrice || 0)}</span>
                            </div>
                            {booking.discountAmount ? (
                              <div className="flex items-center justify-between text-xs text-emerald-400">
                                <span>Discount Saved:</span>
                                <span>-{formatPrice(booking.discountAmount)}</span>
                              </div>
                            ) : null}
                            <div className="flex items-center justify-between text-sm font-bold text-amber-400 pt-0.5">
                              <span>Booked Offer Amount:</span>
                              <span>{formatPrice(displayPrice || 0)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between text-sm font-semibold text-white">
                            <span className="text-xs text-slate-300">Price Amount:</span>
                            <span className="text-amber-400 font-bold">{displayPrice !== undefined ? formatPrice(displayPrice) : 'N/A'}</span>
                          </div>
                        )}
                      </div>

                      {booking.customerName && (
                        <div className="text-xs text-gray-400">
                          Booked by: <span className="text-gray-200 font-medium">{booking.customerName}</span>
                        </div>
                      )}

                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleCancel(booking.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel Booking
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
