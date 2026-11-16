const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const User = require('../models/User');
const Payment = require('../models/Payment');

const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'superadmin@school.edu').trim();
const SUPERADMIN_PASSWORD = (process.env.SUPERADMIN_PASSWORD || '').trim();
const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@school.edu').trim();
const DEFAULT_ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();

const isAllowedEmail = (email) => {
  if (!email || !email.includes('@')) return false;
  const allowed = process.env.ALLOWED_EMAIL_DOMAIN;
  if (!allowed || allowed.trim() === '*' || allowed.trim() === '') return true;
  const domains = allowed.split(',').map((d) => d.trim().toLowerCase());
  const domain = (email.split('@')[1] || '').toLowerCase();
  return domains.includes(domain);
};

const generateToken = (user) =>
  jwt.sign({ id: user._id || user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const getCurrentAcademicYear = () => {
  const year  = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  return month >= 8
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

const seedPayments = async (userId, yearLevel = 1) => {
  const now          = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  const enrollmentStartYear = currentMonth >= 8
    ? currentYear - (yearLevel - 1)
    : currentYear - yearLevel;

  const currentAcademicYear = getCurrentAcademicYear();

  const bulkOps = [];

  for (let y = enrollmentStartYear; ; y++) {
    const academicYear = `${y}-${y + 1}`;
    bulkOps.push({
      updateOne: {
        filter: { user_id: userId, academic_year: academicYear, semester: '1st' },
        update: { $setOnInsert: { user_id: userId, academic_year: academicYear, semester: '1st', status: 'not_paid' } },
        upsert: true,
      },
    });
    if (academicYear === currentAcademicYear) break;
  }

  if (bulkOps.length > 0) {
    await Payment.bulkWrite(bulkOps);
  }
};

const seedDefaultAdmin = async () => {
  try {
    const email = DEFAULT_ADMIN_EMAIL.toLowerCase();
    let admin = await User.findOne({ email });
    if (!admin) {
      admin = await User.findOne({ role: 'admin' });
    }

    if (!admin) {
      if (!DEFAULT_ADMIN_PASSWORD) return;
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      await User.create({
        firstname: 'Admin',
        middlename: '',
        lastname: 'CSC',
        email,
        password: hashedPassword,
        role: 'admin',
      });
      console.log(`✅ Default admin initialized (${email})`);
    } else {
      let changed = false;
      if (admin.email !== email) {
        admin.email = email;
        changed = true;
      }
      if (DEFAULT_ADMIN_PASSWORD) {
        const isMatch = await bcrypt.compare(DEFAULT_ADMIN_PASSWORD, admin.password || '');
        if (!isMatch) {
          admin.password = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
          changed = true;
          console.log(`🔒 Updated admin password for (${email})`);
        }
      }
      if (changed) {
        await admin.save();
      }
    }
  } catch (err) {
    console.error('Error seeding default admin:', err.message);
  }
};

const seedDefaultSuperadmin = async () => {
  try {
    const email = SUPERADMIN_EMAIL.toLowerCase();
    let superadmin = await User.findOne({ email });
    if (!superadmin) {
      superadmin = await User.findOne({ role: 'superadmin' });
    }

    if (!superadmin) {
      const hashedPassword = SUPERADMIN_PASSWORD ? await bcrypt.hash(SUPERADMIN_PASSWORD, 10) : null;
      superadmin = await User.create({
        firstname: 'CSC',
        middlename: '',
        lastname: 'Treasurer',
        email,
        password: hashedPassword,
        role: 'superadmin',
        department: 'EDUCATION DEPARTMENT',
      });
      console.log(`👑 Default superadmin initialized (${email})`);
    } else {
      let changed = false;
      if (superadmin.email !== email) {
        superadmin.email = email;
        changed = true;
      }
      if (SUPERADMIN_PASSWORD && superadmin.password) {
        const isMatch = await bcrypt.compare(SUPERADMIN_PASSWORD, superadmin.password);
        if (!isMatch) {
          superadmin.password = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
          changed = true;
          console.log(`🔒 Updated superadmin password for (${email})`);
        }
      }
      if (superadmin.role !== 'superadmin') {
        superadmin.role = 'superadmin';
        changed = true;
      }
      if (changed) {
        await superadmin.save();
      }
    }
  } catch (err) {
    console.error('Error seeding default superadmin:', err.message);
  }
};

const syncAllStudentPayments = async () => {
  try {
    await seedDefaultAdmin();
    await seedDefaultSuperadmin();

    const students = await User.find({ role: 'student' }).select('_id year_level');
    if (!students.length) return;

    const now          = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear  = now.getFullYear();
    const currentAcademicYear = getCurrentAcademicYear();

    let totalAdded = 0;

    for (const student of students) {
      const yearLevel = student.year_level || 1;

      const enrollmentStartYear = currentMonth >= 8
        ? currentYear - (yearLevel - 1)
        : currentYear - yearLevel;

      const bulkOps = [];

      for (let y = enrollmentStartYear; ; y++) {
        const academicYear = `${y}-${y + 1}`;
        bulkOps.push({
          updateOne: {
            filter: { user_id: student._id, academic_year: academicYear, semester: '1st' },
            update: { $setOnInsert: { user_id: student._id, academic_year: academicYear, semester: '1st', status: 'not_paid' } },
            upsert: true,
          },
        });
        if (academicYear === currentAcademicYear) break;
      }

      if (bulkOps.length > 0) {
        const res = await Payment.bulkWrite(bulkOps);
        totalAdded += (res.upsertedCount || 0);
      }
    }

    if (totalAdded > 0) {
      console.log(`✅ Auto-synced ${totalAdded} new payment slot(s) for ${students.length} student(s)`);
    } else {
      console.log(`✅ All student payments are up to date`);
    }
  } catch (err) {
    console.error('❌ Failed to sync student payments:', err.message);
  }
};

const fetchGoogleUserInfo = (accessToken) =>
  new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.googleapis.com',
      path: '/oauth2/v3/userinfo',
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Failed to parse Google userinfo')); }
      });
    }).on('error', reject);
  });

const register = async (req, res) => {
  try {
    const {
      firstname, middlename, lastname,
      email, password,
      course, year_level, department,
    } = req.body;

    if (!isAllowedEmail(email)) {
      return res.status(400).json({ message: 'Only school email addresses are allowed' });
    }

    const lowerEmail = email.toLowerCase();
    const existing = await User.findOne({ email: lowerEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const isSuperAdminEmail = lowerEmail === SUPERADMIN_EMAIL.toLowerCase();
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      firstname,
      middlename: middlename || '',
      lastname,
      email: lowerEmail,
      password: hashed,
      course: course || null,
      year_level: year_level ? parseInt(year_level) : null,
      department: department || null,
      role: isSuperAdminEmail ? 'superadmin' : 'student',
    });

    if (!isSuperAdminEmail) {
      await seedPayments(newUser._id, year_level || 1);
    }

    const token = generateToken(newUser);
    const userObj = newUser.toJSON();
    delete userObj.password;

    res.status(201).json({ token, user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isAllowedEmail(email)) {
      return res.status(400).json({ message: 'Only school email addresses are allowed' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'This account uses Google Sign-In. Please use the Google button.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const userObj = user.toJSON();
    delete userObj.password;

    res.json({ token, user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { accessToken, googleUserInfo } = req.body;

    let profile;
    if (googleUserInfo && googleUserInfo.email) {
      profile = googleUserInfo;
    } else if (accessToken) {
      profile = await fetchGoogleUserInfo(accessToken);
    } else {
      return res.status(400).json({ message: 'No Google token provided' });
    }

    if (profile.error) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const { email, sub: googleId, picture, given_name, family_name } = profile;

    if (!email) {
      return res.status(400).json({ message: 'Could not retrieve email from Google' });
    }

    if (!isAllowedEmail(email)) {
      return res.status(400).json({ message: 'Only school email addresses are allowed' });
    }

    const lowerEmail = email.toLowerCase();
    const isSuperAdminEmail = lowerEmail === SUPERADMIN_EMAIL.toLowerCase();

    let existing = await User.findOne({ email: lowerEmail });

    // Auto-create superadmin account if configured SUPERADMIN_EMAIL logs in via Google for the first time
    if (!existing && isSuperAdminEmail) {
      existing = await User.create({
        firstname: given_name || 'CSC',
        middlename: '',
        lastname: family_name || 'Treasurer',
        email: lowerEmail,
        google_id: googleId,
        avatar_url: picture || null,
        role: 'superadmin',
        department: 'EDUCATION DEPARTMENT',
      });
    }

    if (!existing) {
      return res.status(404).json({
        message: 'No account found for this Google account. Please register first.',
        notRegistered: true,
        email,
      });
    }

    let needsSave = false;
    if (isSuperAdminEmail && existing.role !== 'superadmin') {
      existing.role = 'superadmin';
      needsSave = true;
    }
    if (!existing.google_id) {
      existing.google_id = googleId;
      needsSave = true;
    }
    if (picture && !existing.avatar_url) {
      existing.avatar_url = picture;
      needsSave = true;
    }

    if (needsSave) {
      await existing.save();
    }

    const token = generateToken(existing);
    const userObj = existing.toJSON();
    delete userObj.password;

    return res.json({ token, user: userObj });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

const googleRegister = async (req, res) => {
  try {
    const {
      accessToken,
      googleUserInfo,
      firstname, middlename, lastname,
      course, year_level, department,
    } = req.body;

    let profile;
    if (googleUserInfo && googleUserInfo.email) {
      profile = googleUserInfo;
    } else if (accessToken) {
      profile = await fetchGoogleUserInfo(accessToken);
    } else {
      return res.status(400).json({ message: 'No Google token provided' });
    }

    if (profile.error) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const { email, sub: googleId, picture, given_name, family_name } = profile;

    if (!email) {
      return res.status(400).json({ message: 'Could not retrieve email from Google' });
    }

    if (!isAllowedEmail(email)) {
      return res.status(400).json({ message: 'Only school email addresses are allowed' });
    }

    const lowerEmail = email.toLowerCase();
    const isSuperAdminEmail = lowerEmail === SUPERADMIN_EMAIL.toLowerCase();

    const existing = await User.findOne({ email: lowerEmail });
    if (existing) {
      return res.status(409).json({
        message: 'This Google account is already registered. Please login instead.',
        alreadyExists: true,
      });
    }

    const resolvedFirst = firstname || given_name || 'CSC';
    const resolvedLast  = lastname  || family_name || 'User';

    if (!isSuperAdminEmail) {
      if (!resolvedFirst || !resolvedLast) {
        return res.status(400).json({ message: 'First and last name are required' });
      }
      if (!year_level) {
        return res.status(400).json({ message: 'Year level is required to set up payment records' });
      }
      if (!course) {
        return res.status(400).json({ message: 'Course is required' });
      }
      if (!department) {
        return res.status(400).json({ message: 'Department is required' });
      }
    }

    const newUser = await User.create({
      firstname: resolvedFirst,
      middlename: middlename || '',
      lastname: resolvedLast,
      email: lowerEmail,
      google_id: googleId,
      avatar_url: picture || null,
      course: course || null,
      year_level: year_level ? parseInt(year_level) : null,
      department: department || null,
      role: isSuperAdminEmail ? 'superadmin' : 'student',
    });

    if (!isSuperAdminEmail) {
      await seedPayments(newUser._id, parseInt(year_level));
    }

    const token = generateToken(newUser);
    const userObj = newUser.toJSON();
    delete userObj.password;

    res.status(201).json({ token, user: userObj });
  } catch (err) {
    console.error('Google register error:', err);
    res.status(500).json({ message: 'Google registration failed' });
  }
};

module.exports = { register, login, googleLogin, googleRegister, syncAllStudentPayments };