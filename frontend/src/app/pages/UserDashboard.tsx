import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { storage } from '../services/storage';
import { Salon } from '../types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Star, MapPin, Phone, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

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

const checkSalonClosed = (salon: Salon): boolean => {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const openMins = parseTimeToMinutes(salon.openTime || '09:00 AM');
  const closeMins = parseTimeToMinutes(salon.closeTime || '09:00 PM');
  return currentMins < openMins || currentMins > closeMins;
};

export const UserDashboard: React.FC = () => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  useEffect(() => {
    const salonList = storage.getSalons();
    setSalons(salonList);
  }, []);

  const cityOptions = ['All Cities', ...Array.from(new Set(salons.map((salon) => salon.city?.trim()).filter((city): city is string => Boolean(city)))).sort()];

  const filteredSalons = salons.filter((salon) => {
    const cityName = (salon.city || '').trim().toLowerCase();
    const matchesCity = selectedCity === 'All Cities' || cityName === selectedCity.toLowerCase();
    const matchesSearch =
      salon.name.toLowerCase().includes(search.toLowerCase()) ||
      cityName.includes(search.toLowerCase()) ||
      salon.address.toLowerCase().includes(search.toLowerCase()) ||
      salon.description.toLowerCase().includes(search.toLowerCase());

    return matchesCity && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-4">
            Find Your Perfect Salon
          </h1>
          <p className="text-gray-400 text-lg mb-6">Discover and book appointments at top-rated salons near you</p>
          <Link to="/my-bookings">
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
              <Calendar className="h-4 w-4 mr-2" />
              View My Bookings
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by salon name, city or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 py-6 text-lg bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-300">City:</span>
            {cityOptions.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-2 rounded-full text-sm border transition-colors ${selectedCity === city
                    ? 'bg-amber-500 text-black border-amber-400'
                    : 'bg-white/5 text-gray-200 border-white/10 hover:border-amber-500/60 hover:text-white'
                  }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 text-sm text-gray-400">
          Showing {filteredSalons.length} salons
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSalons.map((salon, index) => {
            const isClosed = checkSalonClosed(salon);

            return (
              <motion.div
                key={salon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card className="group h-full flex flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#0d1b2a] shadow-[0_14px_35px_rgba(0,0,0,0.35)]">
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={salon.image}
                      alt={salon.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute right-4 top-4 rounded-full bg-black/60 px-2.5 py-1.5 backdrop-blur-sm border border-white/10 flex items-center gap-1.5 text-sm font-semibold text-amber-300">
                      <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                      <span>{salon.rating}</span>
                    </div>

                    {isClosed && (
                      <div className="absolute left-4 top-4 rounded-full bg-red-950/80 px-3 py-1 backdrop-blur-sm border border-red-500/40 flex items-center gap-1.5 text-xs font-extrabold text-red-400 uppercase tracking-wider shadow-lg">
                        <span>Closed</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col px-4 pb-3 pt-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="flex-1 text-[1.06rem] font-bold uppercase tracking-wide text-white leading-snug">{salon.name}</h3>
                      <span className="inline-flex items-center rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-300">
                        {salon.city || 'City'}
                      </span>
                    </div>

                    <div className="mb-2.5 flex items-start gap-2 text-sm text-gray-300">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                      <span className="leading-relaxed">{salon.address}</span>
                    </div>

                    <div className="mb-3 flex items-center gap-2 text-sm text-gray-300">
                      <Phone className="h-4 w-4 shrink-0 text-amber-300" />
                      <span className="leading-relaxed font-medium text-gray-200">{salon.phone || 'N/A'}</span>
                    </div>

                    <div className={`mb-3 flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-lg border w-fit ${isClosed
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      }`}>
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Hours: {salon.openTime || '09:00 AM'} - {salon.closeTime || '09:00 PM'} {isClosed ? '(Closed)' : ''}</span>
                    </div>

                    <p className="mb-4 text-sm leading-relaxed text-gray-300 line-clamp-3">{salon.description}</p>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {salon.services.slice(0, 3).map((service) => (
                        <span
                          key={service.id}
                          className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-300"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-1">
                      {isClosed ? (
                        <Button
                          disabled
                          className="h-12 w-full rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-bold cursor-not-allowed opacity-90 uppercase tracking-wider"
                        >
                          Booking Closed Until Open
                        </Button>
                      ) : (
                        <Link to={`/salons/${salon.id}`} className="block w-full">
                          <Button className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-semibold text-white hover:from-amber-600 hover:to-amber-700 shadow-[0_8px_16px_rgba(245,158,11,0.3)]">
                            Book Now
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
