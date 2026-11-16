const User = require('../models/User');
const Payment = require('../models/Payment');

// GET /api/admin/students
const getAllStudents = async (req, res) => {
  try {
    const students = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'user_id',
          as: 'payments',
        },
      },
      {
        $project: {
          id: '$_id',
          firstname: 1,
          middlename: 1,
          lastname: 1,
          email: 1,
          course: 1,
          year_level: 1,
          department: 1,
          status: { $ifNull: ['$status', 'active'] },
          created_at: 1,
          total_payments: { $size: '$payments' },
          paid_count: {
            $size: {
              $filter: {
                input: '$payments',
                as: 'p',
                cond: { $eq: ['$$p.status', 'paid'] },
              },
            },
          },
          unpaid_count: {
            $size: {
              $filter: {
                input: '$payments',
                as: 'p',
                cond: { $eq: ['$$p.status', 'not_paid'] },
              },
            },
          },
        },
      },
      { $sort: { lastname: 1 } },
    ]);
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/filter
const filterStudents = async (req, res) => {
  try {
    const { course, year, department, search, studentStatus } = req.query;

    const matchStage = { role: 'student' };
    if (course) matchStage.course = course;
    if (year) matchStage.year_level = parseInt(year);
    if (department) matchStage.department = department;
    if (studentStatus && ['active', 'graduated'].includes(studentStatus)) {
      matchStage.status = studentStatus;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      matchStage.$or = [
        { firstname: regex },
        { lastname: regex },
        { email: regex },
      ];
    }

    const students = await User.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'user_id',
          as: 'payments',
        },
      },
      {
        $project: {
          id: '$_id',
          firstname: 1,
          middlename: 1,
          lastname: 1,
          email: 1,
          course: 1,
          year_level: 1,
          department: 1,
          status: { $ifNull: ['$status', 'active'] },
          total_payments: { $size: '$payments' },
          paid_count: {
            $size: {
              $filter: {
                input: '$payments',
                as: 'p',
                cond: { $eq: ['$$p.status', 'paid'] },
              },
            },
          },
          unpaid_count: {
            $size: {
              $filter: {
                input: '$payments',
                as: 'p',
                cond: { $eq: ['$$p.status', 'not_paid'] },
              },
            },
          },
        },
      },
      { $sort: { lastname: 1 } },
    ]);
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/student/:id/payments
const getStudentPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user_id: req.params.id }).sort({ academic_year: -1 });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/admin/update-payment
const updatePaymentStatus = async (req, res) => {
  try {
    const { payment_id, status } = req.body;

    if (!['paid', 'not_paid'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updated = await Payment.findByIdAndUpdate(
      payment_id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    res.json({ message: 'Payment status updated', payment: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/admin/student/:id/status (Mark Graduated / Active)
const updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'graduated'].includes(status)) {
      return res.status(400).json({ message: 'Invalid student status' });
    }

    const student = await User.findOneAndUpdate(
      { _id: id, role: 'student' },
      { status },
      { new: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: `Student status updated to ${status}`, student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/admin/student/:id (Delete Student & Payments)
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await User.findOneAndDelete({ _id: id, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    await Payment.deleteMany({ user_id: id });
    res.json({ message: 'Student account and payment history deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const studentCount = await User.countDocuments({ role: 'student' });
    const activeStudentCount = await User.countDocuments({ role: 'student', status: { $ne: 'graduated' } });
    const graduatedStudentCount = await User.countDocuments({ role: 'student', status: 'graduated' });
    const paidCount = await Payment.countDocuments({ status: 'paid' });
    const unpaidCount = await Payment.countDocuments({ status: 'not_paid' });
    const pendingReview = await Payment.countDocuments({
      receipt: { $ne: null },
      status: 'not_paid',
    });

    res.json({
      totalStudents: studentCount,
      activeStudents: activeStudentCount,
      graduatedStudents: graduatedStudentCount,
      totalPaid: paidCount,
      totalUnpaid: unpaidCount,
      pendingReview: pendingReview,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllStudents,
  filterStudents,
  getStudentPayments,
  updatePaymentStatus,
  updateStudentStatus,
  deleteStudent,
  getStats,
};