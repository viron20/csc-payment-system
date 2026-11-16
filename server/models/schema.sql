-- ============================================================
-- CSC Fee Payment Tracking System — MySQL Schema
-- Run this in phpMyAdmin SQL tab, or via:
--   mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS csc_payments
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE csc_payments;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  firstname   VARCHAR(100)  NOT NULL,
  middlename  VARCHAR(100)  DEFAULT '',
  lastname    VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  UNIQUE NOT NULL,
  password    VARCHAR(255)  DEFAULT NULL,        -- NULL for Google-only accounts
  course      VARCHAR(100)  DEFAULT NULL,
  year_level  TINYINT       DEFAULT NULL,
  department  VARCHAR(100)  DEFAULT NULL,
  role        ENUM('student','admin') DEFAULT 'student',
  google_id   VARCHAR(255)  DEFAULT NULL,
  avatar_url  VARCHAR(500)  DEFAULT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
);

-- ── Payments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  academic_year VARCHAR(20)  NOT NULL,
  semester      ENUM('1st','2nd') NOT NULL,
  status        ENUM('paid','not_paid') DEFAULT 'not_paid',
  receipt       VARCHAR(255) DEFAULT NULL,
  uploaded_at   TIMESTAMP    DEFAULT NULL,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_payment (user_id, academic_year, semester),
  INDEX idx_user_id (user_id),
  INDEX idx_status  (status)
);
