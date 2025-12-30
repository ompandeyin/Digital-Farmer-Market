import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import helmet from 'helmet';
import morgan from "morgan"
import mongoSanitize from 'express-mongo-sanitize';

// Import middleware
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import auctionRoutes from './routes/auctionRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import adminRoutes from './routes/adminRoutes.js'
import escrowRoutes from './routes/escrowRoutes.js'
import settlementRoutes from './routes/settlementRoutes.js' // alias for /api/v1/escrow (safe migration)

// Import socket handler
import { initializeSocket } from './socket.js';

// Import auto-confirm scheduler
import { startScheduler, stopScheduler } from './services/autoConfirmScheduler.js';

// Initialize express and http server
const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['*'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(helmet());
app.use(morgan("dev"))
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(mongoSanitize());
app.use(generalLimiter);

// Health check endpoint

app.get('/health', (_, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});
// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/auctions', auctionRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/escrow', escrowRoutes);
// Alias routes for a non-breaking migration to more user-friendly naming
app.use('/api/v1/settlement', settlementRoutes);

// Socket.IO connection
initializeSocket(io);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ MongoDB connected')
    // Start auto-confirm scheduler after DB is connected
    startScheduler()
  })
  .catch(err => console.error('❌ MongoDB connection failed:', err));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  stopScheduler() // Stop scheduler on shutdown
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close();
    process.exit(0);
  });
});

export { app, server, io };
