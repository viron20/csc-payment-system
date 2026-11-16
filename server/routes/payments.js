const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getPayments, uploadReceipt, getReceipt } = require('../controllers/paymentsController');
const { authenticate } = require('../middleware/auth');

// In-memory buffer storage (stores directly to MongoDB without disk dependency)
const storage = multer.memoryStorage();

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
router.get('/payments/:id/receipt', getReceipt);

module.exports = router;
