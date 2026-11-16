const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  filterStudents,
  getStudentPayments,
  updatePaymentStatus,
  updateStudentStatus,
  deleteStudent,
  getStats,
} = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

router.get('/students', getAllStudents);
router.get('/filter', filterStudents);
router.get('/student/:id/payments', getStudentPayments);
router.put('/update-payment', updatePaymentStatus);
router.put('/student/:id/status', updateStudentStatus);
router.delete('/student/:id', deleteStudent);
router.get('/stats', getStats);

module.exports = router;
