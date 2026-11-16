import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePayments } from '../hooks/usePayments';
import PaymentTable from '../components/PaymentTable';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

const YEAR_SUFFIX = ['st', 'nd', 'rd', 'th'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { payments, loading, error, paid, unpaid, pendingReview, progressPct } = usePayments();

  return (
    <div className="max-w-5xl mx-auto space-y-7 page-enter">

      {/* Greeting header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl text-slate-900">
            Hello, {user?.firstname} 👋
          </h1>
          <p className="text-sm text-muted mt-1">
            {[
              user?.course,
              user?.year_level && `${user.year_level}${YEAR_SUFFIX[user.year_level - 1] || 'th'} Year`,
              user?.department,
            ].filter(Boolean).join(' · ') || 'Your CSC fee payment tracker'}
          </p>
        </div>
        {unpaid.length > 0 && (
          <Link to="/upload-receipt" className="btn-primary shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload Receipt
          </Link>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Academic Years"
          value={payments.length}
          subtitle="tracked records"
          color="brand"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
          }
        />
        <StatCard
          title="Paid"
          value={paid.length}
          subtitle="semesters cleared"
          color="emerald"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          }
        />
        <StatCard
          title="Unpaid"
          value={unpaid.length}
          subtitle="pending payment"
          color="amber"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          }
        />
        <StatCard
          title="Under Review"
          value={pendingReview.length}
          subtitle="receipts submitted"
          color="blue"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          }
        />
      </div>

      {/* Progress bar */}
      {!loading && payments.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Overall Payment Progress</p>
            <p className="font-mono text-xs text-muted">
              {paid.length}/{payments.length} semesters paid
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-brand-600 h-2.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted">{progressPct}% complete</p>
            {progressPct === 100 && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                All payments cleared!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Payment history table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-slate-900">Payment History</h2>
          <span className="text-xs text-muted font-mono bg-slate-100 px-2.5 py-1 rounded-full">
            {payments.length} records
          </span>
        </div>

        {!loading && payments.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
            }
            title="No payment records yet"
            description="Your payment history will appear here once records are created."
          />
        ) : (
          <PaymentTable payments={payments} loading={loading} />
        )}
      </div>
    </div>
  );
}
