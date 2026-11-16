import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  adminFilterStudents,
  adminUpdateStudentStatus,
  superadminDeleteBatchStudents,
} from '../services/api';
import EmptyState from './EmptyState';

const formatDepartmentLabel = (department) =>
  department?.endsWith(' DEPARTMENT')
    ? department.replace(/ DEPARTMENT$/, '')
    : department || '';

export default function GraduatedVaultSection({ isSuperAdmin, onRefresh }) {
  const [graduatedStudents, setGraduatedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGraduated = async () => {
    setLoading(true);
    try {
      const { data } = await adminFilterStudents({ studentStatus: 'graduated', search });
      setGraduatedStudents(data);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Failed to load graduated students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraduated();
  }, [search]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(graduatedStudents.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirm = window.confirm(
      `⚠️ CRITICAL WARNING:\nAre you sure you want to permanently delete ${selectedIds.length} graduated student(s) and ALL their payment history? This action CANNOT be undone.`
    );
    if (!confirm) return;

    setActionLoading(true);
    try {
      const { data } = await superadminDeleteBatchStudents(selectedIds);
      toast.success(`✓ ${data.message}`);
      fetchGraduated();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to delete selected students');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchRestore = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      for (const id of selectedIds) {
        await adminUpdateStudentStatus(id, 'active');
      }
      toast.success(`✓ Restored ${selectedIds.length} student(s) to active status`);
      fetchGraduated();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Failed to restore some students');
    } finally {
      setActionLoading(false);
    }
  };

  const allSelected =
    graduatedStudents.length > 0 && selectedIds.length === graduatedStudents.length;

  return (
    <div className="card space-y-6 border-2 border-purple-100 bg-gradient-to-b from-purple-50/20 to-white">
      {/* Header & Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl shadow-sm">
            🎓
          </div>
          <div>
            <h2 className="font-display text-xl text-slate-900">Graduated Alumni Vault</h2>
            <p className="text-xs text-muted mt-0.5">
              Graduated student records stored safely in a separate box
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <button
              disabled={actionLoading}
              onClick={handleBatchRestore}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1.5"
            >
              ↩️ Restore to Active ({selectedIds.length})
            </button>
          )}

          {isSuperAdmin && selectedIds.length > 0 && (
            <button
              disabled={actionLoading}
              onClick={handleBatchDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              🗑️ Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <input
          className="input flex-1"
          placeholder="Search graduated student by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-purple-100 bg-white">
        {loading ? (
          <div className="p-6 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-11 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : graduatedStudents.length === 0 ? (
          <EmptyState
            icon={<span className="text-3xl">🎓</span>}
            title="No graduated students in the vault"
            description="When students are marked as graduated, they appear in this box for easy batch deletion."
          />
        ) : (
          <table className="w-full">
            <thead className="bg-purple-50/60 border-b border-purple-100">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="table-header">Graduated Student</th>
                <th className="table-header hidden sm:table-cell">Course</th>
                <th className="table-header hidden md:table-cell">Department</th>
                <th className="table-header">Paid Semesters</th>
                <th className="table-header text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {graduatedStudents.map((s) => {
                const isChecked = selectedIds.includes(s.id);
                return (
                  <tr
                    key={s.id}
                    className={`transition-colors ${
                      isChecked ? 'bg-purple-50/40' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSelectOne(s.id)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">
                          {s.lastname}, {s.firstname} {s.middlename ? `${s.middlename[0]}.` : ''}
                        </p>
                        <p className="text-xs text-muted truncate max-w-[180px]">{s.email}</p>
                      </div>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className="inline-flex px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
                        {s.course || '—'}
                      </span>
                    </td>
                    <td className="table-cell hidden md:table-cell text-xs text-slate-600">
                      {formatDepartmentLabel(s.department) || '—'}
                    </td>
                    <td className="table-cell">
                      <span className="badge-paid">{s.paid_count ?? 0}</span>
                    </td>
                    <td className="table-cell text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                        🎓 Graduated
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && graduatedStudents.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted">
          <p>
            Showing {graduatedStudents.length} graduated student(s) in vault
          </p>
          {selectedIds.length > 0 && (
            <p className="font-medium text-purple-700">
              {selectedIds.length} selected for batch action
            </p>
          )}
        </div>
      )}
    </div>
  );
}
