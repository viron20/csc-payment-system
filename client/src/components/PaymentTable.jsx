import React from 'react';

const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function PaymentTable({ payments, loading, showActions, onStatusChange }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!payments?.length) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
          </svg>
        </div>
        <p className="text-sm text-muted">No payment records found</p>
      </div>
    );
  }

  const StatusBadge = ({ status, receipt }) => {
    if (status === 'paid') return (
      <span className="badge-paid">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        Paid
      </span>
    );
    if (receipt) return (
      <span className="badge-pending">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
        Under Review
      </span>
    );
    return (
      <span className="badge-unpaid">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
        Not Paid
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="table-header">Academic Year</th>
            <th className="table-header">Status</th>
            <th className="table-header">Receipt</th>
            {showActions && <th className="table-header text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {payments.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="table-cell font-mono text-xs font-medium text-slate-600">
                {p.academic_year}
              </td>
              <td className="table-cell">
                <StatusBadge status={p.status} receipt={p.receipt} />
              </td>
              <td className="table-cell">
                {p.receipt ? (
                  <a
                    href={`${API_URL}/uploads/${p.receipt}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 text-xs font-medium hover:underline"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    View Receipt
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
              {showActions && (
                <td className="table-cell text-right">
                  <div className="flex items-center justify-end gap-2">
                    {p.status !== 'paid' && (
                      <button
                        onClick={() => onStatusChange(p.id, 'paid')}
                        className="btn-success"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Mark Paid
                      </button>
                    )}
                    {p.status === 'paid' && (
                      <button
                        onClick={() => onStatusChange(p.id, 'not_paid')}
                        className="btn-danger"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Mark Unpaid
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}