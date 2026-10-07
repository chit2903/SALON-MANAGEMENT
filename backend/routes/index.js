import { Router } from 'express';
import authRoutes from './authRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import { getAll, getById, create, update, remove } from '../controllers/resourceController.js';

const router = Router();

// Dedicated Routes
router.use('/auth', authRoutes);
router.use('/appointments', appointmentRoutes);

// Generic Resource Routes for all frontend entities & admin settings
const validResources = [
  'salons', 'services', 'customers', 'staff', 'users',
  'packages', 'memberships', 'invoices',
  'feedback', 'notifications', 'offers',
  'coupons', 'giftCards', 'settings',
  'products', 'expenses', 'gallery', 'attendance'
];

validResources.forEach(resource => {
  router.get(`/${resource}`, getAll(resource));
  router.get(`/${resource}/:id`, getById(resource));
  router.post(`/${resource}`, create(resource));
  router.put(`/${resource}/:id`, update(resource));
  router.delete(`/${resource}/:id`, remove(resource));
});

export default router;
