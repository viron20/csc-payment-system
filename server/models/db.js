const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Force public DNS servers for SRV record resolution on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

const connectDB = async (retries = 5, delay = 3000) => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/csc_payments';
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        console.log(`⏳ Retrying MongoDB connection in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  connectDB(3, 3000);
});

// Attempt initial connection on require
connectDB();

module.exports = connectDB;
