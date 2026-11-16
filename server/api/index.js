// Vercel Serverless Function entry point
// This wraps the Express app for Vercel's serverless environment

require('dotenv').config();

const mongoose = require('mongoose');
const dns = require('dns');
const express = require('express');
const cors = require('cors');
const { apiLimiter, authLimiter } = require('../middleware/rateLimiter');

// Force public DNS for MongoDB Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const app = express();

app.set('trust proxy', true);

// ── CORS: allow the Vercel frontend origin ──────────────────────────
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      ALLOWED_ORIGINS.some((o) => origin.startsWith(o)) ||
      origin.includes('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);

// ── Routes ──────────────────────────────────────────────────────────
app.use('/api', authLimiter, require('../routes/auth'));
app.use('/api', require('../routes/user'));
app.use('/api', require('../routes/payments'));
app.use('/api/admin', require('../routes/admin'));
app.use('/api/superadmin', require('../routes/superadmin'));

// ── Health check ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
  }
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ── MongoDB lazy connection (cached for serverless warm reuse) ───────
let cachedConnection = null;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) throw new Error('MONGODB_URI env variable is not set');

  cachedConnection = await mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 10000,
    bufferCommands: false,
  });
  return cachedConnection;
}

// ── Vercel serverless handler ────────────────────────────────────────
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
