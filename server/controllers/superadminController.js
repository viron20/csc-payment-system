const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Payment = require('../models/Payment');

// GET /api/superadmin/admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .sort({ lastname: 1 });
    res.json(admins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/superadmin/add-admin
const addAdmin = async (req, res) => {
  try {
    const { firstname, middlename, lastname, email, password, department } = req.body;

    if (!firstname || !lastname) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const lowerEmail = email.toLowerCase();
    const existing = await User.findOne({ email: lowerEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
      firstname: firstname.trim(),
      middlename: (middlename || '').trim(),
      lastname: lastname.trim(),
      email: lowerEmail,
      password: hashedPassword,
      department: department || null,
      role: 'admin',
    });

    const adminObj = newAdmin.toJSON();
    delete adminObj.password;

    res.status(201).json({ message: 'Admin account created successfully', admin: adminObj });
  } catch (err) {
    console.error('Error adding admin:', err);
    res.status(500).json({ message: 'Failed to create admin account' });
  }
};

// PUT /api/superadmin/update-admin/:id
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, middlename, lastname, email, department, newPassword } = req.body;

    const admin = await User.findOne({ _id: id, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    if (email && email.toLowerCase() !== admin.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ message: 'Email address is already in use' });
      }
      admin.email = email.toLowerCase();
    }

    if (firstname) admin.firstname = firstname.trim();
    if (middlename !== undefined) admin.middlename = (middlename || '').trim();
    if (lastname) admin.lastname = lastname.trim();
    if (department !== undefined) admin.department = department || null;

    if (newPassword && newPassword.length >= 8) {
      admin.password = await bcrypt.hash(newPassword, 10);
    }

    await admin.save();

    const adminObj = admin.toJSON();
    delete adminObj.password;

    res.json({ message: 'Admin details updated successfully', admin: adminObj });
  } catch (err) {
    console.error('Error updating admin:', err);
    res.status(500).json({ message: 'Failed to update admin account' });
  }
};

// POST /api/superadmin/delete-batch-students
const deleteBatchStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'No student IDs provided' });
    }

    const deletedUsers = await User.deleteMany({
      _id: { $in: studentIds },
      role: 'student',
    });

    await Payment.deleteMany({
      user_id: { $in: studentIds },
    });

    res.json({
      message: `Successfully deleted ${deletedUsers.deletedCount} student(s) and their payment records`,
      deletedCount: deletedUsers.deletedCount,
    });
  } catch (err) {
    console.error('Error batch deleting students:', err);
    res.status(500).json({ message: 'Failed to batch delete students' });
  }
};

module.exports = { getAllAdmins, addAdmin, updateAdmin, deleteBatchStudents };
