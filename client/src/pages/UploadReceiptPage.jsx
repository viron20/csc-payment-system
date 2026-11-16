import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getPayments, uploadReceipt } from '../services/api';
import EmptyState from '../components/EmptyState';

export default function UploadReceiptPage() {
  const [unpaid, setUnpaid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getPayments()
      .then(({ data }) => setUnpaid(data.filter(p => p.status === 'not_paid')))
      .catch(() => toast.error('Failed to load payment records'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(f.type)) { toast.error('Only JPG, PNG, WEBP or PDF allowed'); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    setFile(f);
    if (f.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = e => setPreview(e.target.result);
      r.readAsDataURL(f);
    } else {
      setPreview('pdf');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const selectedPayment = unpaid.find(p => p.academic_year === selectedYear);
  const alreadyHasReceipt = selectedPayment?.receipt;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file)         return toast.error('Please attach a receipt file');
    if (!selectedYear) return toast.error('Please select an academic year');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('receipt', file);
      fd.append('academic_year', selectedYear);
      await uploadReceipt(fd);
      toast.success('Receipt submitted! Pending admin review.');
      setFile(null);
      setPreview(null);
      setSelectedYear('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 page-enter">
        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
        <div className="card space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-7 page-enter">
      <div>
        <h1 className="font-display text-3xl text-slate-900">Upload Receipt</h1>
        <p className="text-sm text-muted mt-1">Submit your proof of CSC fee payment for admin verification</p>
      </div>

      {unpaid.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={
              <svg className="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            }
            title="All caught up!"
            description="You have no unpaid years remaining, or all receipts are currently under review."
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Academic year selector */}
          <div className="card space-y-4">
            <h2 className="font-display text-lg text-slate-900 border-b border-slate-100 pb-3">
              1. Select Academic Year
            </h2>

            <div>
              <label className="label">Academic Year *</label>
              <select
                className="input"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                required
              >
                <option value="">Choose academic year…</option>
                {unpaid.map(p => (
                  <option key={p.id} value={p.academic_year}>
                    {p.academic_year}{p.receipt ? ' (receipt submitted — replace?)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Warning if receipt already submitted */}
            {alreadyHasReceipt && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
                <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                A receipt was already submitted for this year and is under review. Uploading again will replace it.
              </div>
            )}
          </div>

          {/* File upload */}
          <div className="card">
            <h2 className="font-display text-lg text-slate-900 border-b border-slate-100 pb-3 mb-4">
              2. Attach Receipt
            </h2>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 select-none
                ${dragOver     ? 'border-brand-400 bg-brand-50 scale-[1.01]'
                : file         ? 'border-emerald-300 bg-emerald-50'
                :                'border-slate-200 hover:border-brand-300 hover:bg-brand-50/40'}`}
            >
              {preview && preview !== 'pdf' ? (
                <div className="space-y-2.5">
                  <img
                    src={preview}
                    alt="receipt preview"
                    className="max-h-44 rounded-lg mx-auto object-contain shadow-sm ring-2 ring-white"
                  />
                  <p className="text-xs font-medium text-emerald-700">{file.name}</p>
                  <p className="text-xs text-muted">Click to replace</p>
                </div>
              ) : preview === 'pdf' ? (
                <div className="space-y-2.5">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-emerald-700">{file.name}</p>
                  <p className="text-xs text-muted">Click to replace</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {dragOver ? 'Drop it here!' : 'Drop file or click to browse'}
                    </p>
                    <p className="text-xs text-muted mt-0.5">JPG · PNG · WEBP · PDF &nbsp;·&nbsp; Max 5MB</p>
                  </div>
                </div>
              )}
              <input
                id="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full justify-center py-3.5 text-base"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Submit Receipt for Review
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}