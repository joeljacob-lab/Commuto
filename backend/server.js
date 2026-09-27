import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

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

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Commuto Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
