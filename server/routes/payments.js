const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getPayments, uploadReceipt } = require('../controllers/paymentsController');
const { authenticate } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `receipt_${req.user?.id || 'unknown'}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, WEBP, and PDF files are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
});

router.get('/payments', authenticate, getPayments);
router.post('/upload-receipt', authenticate, upload.single('receipt'), uploadReceipt);

module.exports = router;
