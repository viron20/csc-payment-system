require('dotenv').config();
const connectDB = require('./models/db');
const express = require('express');
const cors = require('cors');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { syncAllStudentPayments } = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy headers from the React dev proxy / any reverse proxy
app.set('trust proxy', true);

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from localhost or any local network IP (192.168.x.x)
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.startsWith('http://192.168.') || origin.startsWith('http://10.')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Receipts are stored in MongoDB — no local uploads directory needed.
// Legacy /uploads/:filename requests are handled by MongoDB lookup.
app.use('/api', apiLimiter);

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api', authLimiter, require('./routes/auth'));
app.use('/api', require('./routes/user'));
app.use('/api', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/superadmin', require('./routes/superadmin'));

// ── Health check ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
  }
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ── Daily check: runs every 24 hours ──────────────────────────────
// Instead of one giant setTimeout, check once per day
// If it's August 1st → run the sync
let lastSyncedYear = null;

const startDailyChecker = () => {
  // Check daily for August 1st
  setInterval(runDailyCheck, 24 * 60 * 60 * 1000);
};

const runDailyCheck = async () => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  // Trigger sync on August 1st (start of new academic year)
  // Use lastSyncedYear to avoid syncing multiple times in the same year
  if (month === 8 && lastSyncedYear !== year) {
    console.log(`\n🔄 August 1st detected — syncing new academic year ${year}-${year + 1}...`);
    await syncAllStudentPayments();
    lastSyncedYear = year;
  }
};

// ── Start server ───────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();
  } catch (e) {
    console.error('Initial DB connection error:', e.message);
  }

  app.listen(PORT, async () => {
    console.log(`\n🚀 CSC Payment Server running on http://localhost:${PORT}`);
    console.log(`🔗 API base: http://localhost:${PORT}/api\n`);

    // Sync on startup to catch any missing records
    try {
      await syncAllStudentPayments();
    } catch (err) {
      console.error('Error during startup sync:', err.message);
    }

    // Start the daily checker (fires on August 1st every year)
    startDailyChecker();

    console.log(`📅 Auto-sync scheduled: runs every August 1st`);
  });
};

startServer();