import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { getMessages } from './controllers/userController';
import { authenticateJWT } from './middleware/authMiddleware';
import { setupChatSocket } from './sockets/chatSocket';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL;

// CORS configuration supporting unified single-host and decoupled frontend/backend
const corsOrigin = CLIENT_URL
  ? [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
  : true;

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'E2EE Real-Time Chat Backend',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.get('/api/messages/:contactId', authenticateJWT, getMessages);

// Initialize Socket.io Chat Handlers
setupChatSocket(io);

// Static assets & SPA fallback (Production Single-Host / Unified Deployment)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start Server and Connect Database
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n\x1b[35m══════════════════════════════════════════════════════\x1b[0m`);
    console.log(`\x1b[36m🚀 AegisChat Server is live on port ${PORT}\x1b[0m`);
    console.log(`\x1b[33m🔒 Zero-Knowledge Cryptographic Router Ready\x1b[0m`);
    console.log(`\x1b[35m══════════════════════════════════════════════════════\x1b[0m\n`);
  });
};

startServer();
