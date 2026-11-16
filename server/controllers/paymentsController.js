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

    const ext = path.extname(req.file.originalname) || '.jpg';
    const safeFilename = `receipt_${userId}_${Date.now()}${ext}`;

    existing.receipt = safeFilename;
    existing.receipt_data = req.file.buffer;
    existing.receipt_content_type = req.file.mimetype || 'image/jpeg';
    existing.receipt_filename = req.file.originalname;
    existing.uploaded_at = new Date();
    await existing.save();

    res.json({
      message: 'Receipt uploaded successfully',
      receipt: existing.receipt,
      paymentId: existing._id,
    });
  } catch (err) {
    console.error('Error uploading receipt:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/payments/:id/receipt
const getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).select('+receipt_data +receipt_content_type +receipt_filename');

    if (!payment) {
      return res.status(404).send('Payment not found');
    }

    // 1. Serve directly from MongoDB binary storage
    if (payment.receipt_data && payment.receipt_data.length > 0) {
      res.set({
        'Content-Type': payment.receipt_content_type || 'image/jpeg',
        'Content-Disposition': `inline; filename="${payment.receipt_filename || 'receipt'}"`,
        'Cache-Control': 'public, max-age=86400',
      });
      return res.send(payment.receipt_data);
    }

    return res.status(404).send('No receipt image available for this payment');
  } catch (err) {
    console.error('Error retrieving receipt:', err);
    res.status(500).send('Error retrieving receipt');
  }
};

module.exports = { getPayments, uploadReceipt, getReceipt };