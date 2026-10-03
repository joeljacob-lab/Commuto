import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import fuelRateRoutes from './routes/fuelRateRoutes.js';
import routePoolRoutes from './routes/routePoolRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import { startRideGenerationScheduler } from './jobs/dailyRideGeneratorJob.js';
import walletRoutes from './routes/walletRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { startRosterLockJob } from './jobs/rosterLockJob.js';


// Load environment variables
dotenv.config();

// Database connection
connectDB().then(() => {
  console.log('✅ Database connected. Starting background jobs...');
  
  // Start the midnight ride generator
  startRideGenerationScheduler();
  
  // Start the 9 PM roster lock
  startRosterLockJob();
});

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});


// Attach socket.io to app context for controllers/services
app.set('io', io);

// Socket.IO connection event handler
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // User room joining pattern for notifications
  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined personal socket room`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health / Status Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Commuto API',
    tagline: "Because someone's already driving your way.",
    version: '1.0.0',
    status: 'online',
  });
});

app.get('/api/health', (req, res) => {
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    status: 'healthy',
    database: dbStatusMap[mongoose.connection.readyState] || 'unknown',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/fuelrates', fuelRateRoutes);
app.use('/api/routepools', routePoolRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/bookings', bookingRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Commuto Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  startRideGenerationScheduler();
});
