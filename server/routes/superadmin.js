const express = require('express');
const router = express.Router();
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const { getAllAdmins, addAdmin, updateAdmin, deleteBatchStudents } = require('../controllers/superadminController');

router.get('/admins', authenticate, requireSuperAdmin, getAllAdmins);
router.post('/add-admin', authenticate, requireSuperAdmin, addAdmin);
router.put('/update-admin/:id', authenticate, requireSuperAdmin, updateAdmin);
router.post('/delete-batch-students', authenticate, requireSuperAdmin, deleteBatchStudents);

module.exports = router;
