import dotenv from 'dotenv';
dotenv.config();

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"])

import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { seedDatabase } from './seeder.js';
import apiRoutes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRoutes);

// Start server AFTER MongoDB connection
const startServer = async () => {
  try {
    console.log('[Database] Connecting to MongoDB...');

    const conn = await connectDB();

    if (!conn) {
      throw new Error('MongoDB connection failed');
    }

    console.log(
      `[Database Status] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`
    );

    // Seed database
    await seedDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log('=================================');
      console.log('Salon Backend Server is running!');
      console.log(`Port: ${PORT}`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log('=================================');
    });

  } catch (error) {
    console.error('=================================');
    console.error('[Server Error] Server could not start');
    console.error(`[Database Error] ${error.message}`);
    console.error('=================================');
    process.exit(1);
  }
};

startServer();