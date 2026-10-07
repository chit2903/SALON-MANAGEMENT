import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { api } from '../services/api';
import { Appointment } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Plus, Search, Edit, Trash2, Calendar, Clock, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatPrice } from '../utils/currency';

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    refreshAppointments();
  }, []);

  const refreshAppointments = async () => {
    const data = await api.getAppointments();
    setAppointments(data);
  };

  const getSalonName = (salonId?: string) => {
    if (!salonId) return 'Unknown Salon';
    const salon = storage.getSalonById(salonId);
    return salon?.name || 'Unknown Salon';
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchesSearch = 
      (a.customerName?.toLowerCase().includes(search.toLowerCase()) || 
       a.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
       getSalonName(a.salonId).toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this appointment?')) {
      try {
        await api.deleteAppointment(id);
        await refreshAppointments();
        toast.success('Appointment deleted');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to delete appointment');
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await api.updateAppointment(id, { status });
      await refreshAppointments();
      toast.success(`Appointment marked as ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update appointment');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'no-show': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
            <Calendar className="w-7 h-7 text-amber-400" /> Appointments
          </h1>
          <p className="text-muted-foreground">Manage all salon appointments</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, service, or salon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no-show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 bg-white/5 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>All Appointments ({filteredAppointments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No appointments found
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 sm:-mx-0 sm:px-0">
              <Table className="min-w-[850px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Salon</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Offer Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment, index) => {
                    const priceAmount = appointment.offerAmount ?? appointment.amount ?? appointment.originalPrice;
                    const hasOffer = Boolean(appointment.offerName || (appointment.discountAmount && appointment.discountAmount > 0));

                    return (
                      <motion.tr
                        key={appointment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <TableCell>
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                            <div className="inline-flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{appointment.date}</span>
                            </div>
                            <div className="inline-flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{appointment.time}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {appointment.customerName || 'Unknown Customer'}
                          {appointment.customerPhone && (
                            <p className="text-sm text-muted-foreground">{appointment.customerPhone}</p>
                          )}
                        </TableCell>
                        <TableCell>{getSalonName(appointment.salonId)}</TableCell>
                        <TableCell>{appointment.serviceName || 'Unknown Service'}</TableCell>
                        <TableCell>
                          {hasOffer ? (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                                <span>{formatPrice(priceAmount || 0)}</span>
                                <span className="text-[10px] line-through text-slate-400 font-normal">
                                  {formatPrice(appointment.originalPrice || 0)}
                                </span>
                              </div>
                              <span className="text-[10px] text-amber-300/80 flex items-center gap-1 mt-0.5">
                                <Tag className="w-2.5 h-2.5 text-amber-400" />
                                {appointment.offerName || 'Offer Discount'}
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold text-amber-400">
                              {priceAmount !== undefined ? formatPrice(priceAmount) : '-'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={appointment.status}
                            onValueChange={(value: any) => handleUpdateStatus(appointment.id, value)}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="no-show">No Show</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(appointment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
