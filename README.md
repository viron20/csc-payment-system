# 📚 CSC Fee Payment Tracking System

A full-stack web application built for tracking CSC (Computer Science Council) fee payments across all academic year levels, supporting receipt uploads, automated payment tracking, and multi-tier role management (**Student**, **Admin**, and **Superadmin**).

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS, React Router v6, Axios |
| **Backend** | Node.js, Express.js, Mongoose |
| **Database** | MongoDB Atlas (Cloud NoSQL) |
| **Authentication** | JWT (JSON Web Tokens) + Google OAuth 2.0 |

---

## ⚡ Account Roles & Initial Access

### 👑 Superadmin Account
- **Google Account**: Sign in with the email defined by `SUPERADMIN_EMAIL` in `server/.env`
- **Local Password Login**: Credentials configured via `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` in `server/.env`
- **Capabilities**:
  - Full access to Student Fee Payment records & verification.
  - **Manage Admins**: Create new Admin accounts (name, email, department, password).
  - **Edit Admins**: Modify existing admin accounts or update their passwords.

### ⚡ Admin Account
- **Local Password Login**: Credentials configured via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`
- **Capabilities**:
  - View all student fee records.
  - Filter students by course, year level, department, or keyword search.
  - Review uploaded receipt proofs and toggle payment status (`Paid` / `Unpaid`).

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v16+
- A MongoDB Atlas Cluster (or local MongoDB server)

---

### 2. Environment Setup

#### Backend Configuration (`server/.env`)
Create or edit `server/.env`:
```env
# Server
PORT=5000

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/csc_payments?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here

# Allowed School Email Domain
ALLOWED_EMAIL_DOMAIN=school.edu, gmail.com

# Superadmin Configuration
SUPERADMIN_EMAIL=your-superadmin-email@school.edu
SUPERADMIN_PASSWORD=your_superadmin_password

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

---

### 3. Running the Application

To install all dependencies for root, backend, and frontend:
```bash
npm run install:all
```

To run both backend server and frontend client concurrently:
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 📡 API Endpoint Reference

### 🔑 Authentication (`/api`)
- `POST /api/register`: Register a new student account.
- `POST /api/login`: Password login for registered accounts.
- `POST /api/google-login`: Google OAuth login endpoint.
- `POST /api/google-register`: Register profile for new Google accounts.

### 👤 Student Profile & Payments (`/api`)
- `GET /api/profile`: Retrieve logged-in user profile.
- `PUT /api/profile`: Update profile information.
- `GET /api/payments`: Get payment history for current student.
- `POST /api/upload-receipt`: Upload receipt image proof for an academic year.

### ⚡ Admin Routes (`/api/admin`) *(Requires Admin or Superadmin role)*
- `GET /api/admin/students`: Fetch all students with total paid/unpaid counts.
- `GET /api/admin/filter`: Search/filter students by course, year level, department, or keyword.
- `GET /api/admin/student/:id/payments`: Fetch full payment breakdown for a student.
- `PUT /api/admin/update-payment`: Update student payment status (`paid` or `not_paid`).
- `GET /api/admin/stats`: Get dashboard overview metrics.

### 👑 Superadmin Routes (`/api/superadmin`) *(Requires Superadmin role)*
- `GET /api/superadmin/admins`: List all admin accounts.
- `POST /api/superadmin/add-admin`: Create a new Admin account.
- `PUT /api/superadmin/update-admin/:id`: Update admin details or reset password.

---

## 📂 Project Structure

```
csc-payment-system/
├── client/                      # React Frontend Application
│   ├── src/
│   │   ├── components/          # Reusable UI components (Sidebar, PaymentTable, ManageAdminsSection)
│   │   ├── context/             # AuthContext provider
│   │   ├── pages/               # Pages (AdminDashboardPage, DashboardPage, ProfilePage, etc.)
│   │   └── services/            # Axios API service client
│   └── package.json
├── server/                      # Node.js Express Backend
│   ├── controllers/             # Request handlers (authController, adminController, superadminController)
│   ├── middleware/              # JWT & Role authorization middlewares
│   ├── models/                  # Mongoose models (User.js, Payment.js, db.js)
│   ├── routes/                  # API router files (auth.js, admin.js, superadmin.js)
│   └── package.json
├── package.json                 # Root script runner (concurrently)
└── README.md                    # System documentation
```
