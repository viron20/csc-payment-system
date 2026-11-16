const Payment = require('../models/Payment');

// GET /api/payments
const getPayments = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const payments = await Payment.find({ user_id: userId }).sort({ academic_year: -1 });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/upload-receipt
const uploadReceipt = async (req, res) => {
  try {
    const { academic_year } = req.body;
    const userId = req.user._id || req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!academic_year) {
      return res.status(400).json({ message: 'Academic year is required' });
    }

    const existing = await Payment.findOne({ user_id: userId, academic_year });

    if (!existing) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    if (existing.status === 'paid') {
      return res.status(400).json({ message: 'This year is already marked as paid' });
    }

    existing.receipt = req.file.filename;
    existing.uploaded_at = new Date();
    await existing.save();

    res.json({ message: 'Receipt uploaded successfully', receipt: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getPayments, uploadReceipt };