import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useAdminStudents } from '../hooks/useAdminStudents';
import {
  adminGetStudentPayments,
  adminUpdatePayment,
  adminUpdateStudentStatus,
  adminDeleteStudent,
} from '../services/api';
import PaymentTable from '../components/PaymentTable';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import ManageAdminsSection from '../components/ManageAdminsSection';
import GraduatedVaultSection from '../components/GraduatedVaultSection';
const COURSES    = [
  'BEED',
  'BTLED ICT',
  'BTLED HE',
  'BSED ENGLISH',
  'BSED MATH',
  'BSIS',
  'BSIT',
  'BSIT-ANIMATION',
  'BSCS',
  'BSCPE',
  'BSECE',
  'BSENTREP',
  'BSN',
  'BSAT',
  'BSET',
  'BSELT',
  'BSMT',
];
const DEPARTMENTS = [
  'TEACHER EDUCATION DEPARTMENT',
  'COMPUTER STUDIES DEPARTMENT',
  'ENGINEERING DEPARTMENT',
  'ENTREPRENEURSHIP',
  'NURSING',
  'TECHNOLOGY',
];

const formatDepartmentLabel = (department) =>
  department?.endsWith(' DEPARTMENT')
    ? department.replace(/ DEPARTMENT$/, '')
    : department || '';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { students, stats, loading, fetchStudents, fetchStats } = useAdminStudents();
  const [activeTab, setActiveTab] = useState('students');
  const [filters, setFilters] = useState({ course: '', year: '', department: '', search: '', studentStatus: '' });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPayments, setStudentPayments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchStudents();
  }, []); // eslint-disable-line 

  const handleFilterChange = (e) =>
    setFilters(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents(filters);
  };

  const clearFilters = () => {
    const reset = { course: '', year: '', department: '', search: '', studentStatus: '' };
    setFilters(reset);
    fetchStudents(reset);
  };

  const openStudent = async (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
    setPaymentLoading(true);
    try {
      const { data } = await adminGetStudentPayments(student.id);
      setStudentPayments(data);
    } catch {
      toast.error('Failed to load student payments');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleStatusChange = useCallback(async (paymentId, status) => {
    try {
      await adminUpdatePayment({ payment_id: paymentId, status });
      setStudentPayments(prev =>
        prev.map(p => p.id === paymentId ? { ...p, status } : p)
      );
      setSelectedStudent(prev => {
        if (!prev) return prev;
        const isPaid = status === 'paid';
        return {
          ...prev,
          paid_count:   isPaid ? +prev.paid_count + 1 : +prev.paid_count - 1,
          unpaid_count: isPaid ? +prev.unpaid_count - 1 : +prev.unpaid_count + 1,
        };
      });
      fetchStats();
      toast.success(status === 'paid' ? '✓ Marked as Paid' : 'Marked as Unpaid');
    } catch {
      toast.error('Failed to update payment status');
    }
  }, [fetchStats]);

  const handleToggleGraduated = async () => {
    if (!selectedStudent) return;
    const newStatus = selectedStudent.status === 'graduated' ? 'active' : 'graduated';
    setStatusUpdating(true);
    try {
      await adminUpdateStudentStatus(selectedStudent.id, newStatus);
      setSelectedStudent(p => ({ ...p, status: newStatus }));
      fetchStudents(filters);
      fetchStats();
      toast.success(newStatus === 'graduated' ? '🎓 Moved to Graduated Vault' : 'Restored to Active Students');
    } catch (err) {
      toast.error(err.message || 'Failed to update student status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete ${selectedStudent.firstname} ${selectedStudent.lastname} and all their payment records?`);
    if (!confirmDelete) return;

    try {
      await adminDeleteStudent(selectedStudent.id);
      toast.success('Student account deleted');
      setModalOpen(false);
      setSelectedStudent(null);
      fetchStudents(filters);
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Failed to delete student');
    }
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <div className="max-w-6xl mx-auto space-y-7 page-enter">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl text-slate-900">
              {isSuperAdmin ? 'Superadmin Panel' : 'Admin Panel'}
            </h1>
            {isSuperAdmin && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider">
                Superadmin
              </span>
            )}
          </div>
          <p className="text-sm text-muted mt-1">
            {isSuperAdmin
              ? 'Manage student payment records, graduated alumni vault, and administrator accounts'
              : 'Manage and verify student CSC fee payments'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'students'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Student Records
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'vault'
                ? 'bg-white text-purple-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🎓 Graduated Vault ({stats?.graduatedStudents ?? 0})
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admins'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🛡️ Manage Admins
            </button>
          )}
        </div>
      </div>

      {activeTab === 'admins' && isSuperAdmin ? (
        <ManageAdminsSection />
      ) : activeTab === 'vault' ? (
        <GraduatedVaultSection
          isSuperAdmin={isSuperAdmin}
          onRefresh={() => {
            fetchStudents(filters);
            fetchStats();
          }}
        />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Students" value={stats?.totalStudents} color="brand"
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
            />
            <StatCard title="Paid Records" value={stats?.totalPaid} color="emerald"
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
            />
            <StatCard title="Unpaid Records" value={stats?.totalUnpaid} color="amber"
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
            />
            <StatCard title="Graduated Students" value={stats?.graduatedStudents ?? 0} subtitle="alumni records" color="blue"
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>}
            />
          </div>

          {/* Filter + students table */}
          <div className="card">
            <form onSubmit={handleSearch}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-display text-xl text-slate-900">Student Records</h2>
                {activeFilterCount > 0 && (
                  <button type="button" onClick={clearFilters}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
                <input
                  className="input col-span-2 lg:col-span-2"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search name or email…"
                />
                <select className="input" name="course" value={filters.course} onChange={handleFilterChange}>
                  <option value="">All Courses</option>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="input" name="year" value={filters.year} onChange={handleFilterChange}>
                  <option value="">All Years</option>
                  {[1,2,3,4].map(y => <option key={y} value={y}>{y}{['st','nd','rd','th'][y-1]} Year</option>)}
                </select>
                <select className="input" name="studentStatus" value={filters.studentStatus} onChange={handleFilterChange}>
                  <option value="">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="graduated">Graduated Only</option>
                </select>
                <button type="submit" className="btn-primary justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Search
                </button>
              </div>
            </form>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              {loading ? (
                <div className="p-6 space-y-2">
                  {[...Array(6)].map((_,i) => (
                    <div key={i} className="h-11 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : students.length === 0 ? (
                <EmptyState
                  icon={<svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
                  title="No students found"
                  description="Try adjusting your filters or search query."
                />
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="table-header">Student</th>
                      <th className="table-header hidden sm:table-cell">Course</th>
                      <th className="table-header hidden md:table-cell">Year</th>
                      <th className="table-header hidden md:table-cell">Status</th>
                      <th className="table-header">Paid</th>
                      <th className="table-header">Unpaid</th>
                      <th className="table-header text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="table-cell">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-slate-800 text-sm">
                                {s.lastname}, {s.firstname}{s.middlename ? ` ${s.middlename[0]}.` : ''}
                              </p>
                              {s.status === 'graduated' && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">
                                  Graduated
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted truncate max-w-[180px]">{s.email}</p>
                          </div>
                        </td>
                        <td className="table-cell hidden sm:table-cell">
                          <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                            {s.course || '—'}
                          </span>
                        </td>
                        <td className="table-cell hidden md:table-cell text-xs text-slate-600">
                          {s.year_level ? `${s.year_level}Y` : '—'}
                        </td>
                        <td className="table-cell hidden md:table-cell text-xs">
                          {s.status === 'graduated' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                              🎓 Graduated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="table-cell">
                          <span className="badge-paid">{s.paid_count ?? 0}</span>
                        </td>
                        <td className="table-cell">
                          <span className="badge-unpaid">{s.unpaid_count ?? 0}</span>
                        </td>
                        <td className="table-cell text-right">
                          <button
                            onClick={() => openStudent(s)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {!loading && students.length > 0 && (
              <p className="text-xs text-muted mt-3">
                Showing {students.length} student{students.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Student payment modal ── */}
      {modalOpen && selectedStudent && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col animate-[fadeSlideIn_0.2s_ease_forwards]">
            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl text-slate-900 truncate">
                    {selectedStudent.firstname} {selectedStudent.middlename ? selectedStudent.middlename[0] + '. ' : ''}{selectedStudent.lastname}
                  </h2>
                  {selectedStudent.status === 'graduated' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                      🎓 Graduated
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5 truncate">{selectedStudent.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {selectedStudent.course && (
                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                      {selectedStudent.course}
                    </span>
                  )}
                  {selectedStudent.year_level && (
                    <span className="text-xs text-muted">
                      {selectedStudent.year_level}{['st','nd','rd','th'][selectedStudent.year_level-1]} Year
                    </span>
                  )}
                  {selectedStudent.department && (
                    <span className="text-xs text-muted">· {formatDepartmentLabel(selectedStudent.department)}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-muted transition-colors shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal summary badges & Graduation/Delete controls */}
            <div className="px-6 py-3 border-b border-slate-50 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="badge-paid">{selectedStudent.paid_count ?? 0} Paid</span>
                <span className="badge-unpaid">{selectedStudent.unpaid_count ?? 0} Unpaid</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={statusUpdating}
                  onClick={handleToggleGraduated}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    selectedStudent.status === 'graduated'
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  🎓 {selectedStudent.status === 'graduated' ? 'Mark as Active' : 'Mark as Graduated'}
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={handleDeleteStudent}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all"
                  >
                    🗑️ Delete Student
                  </button>
                )}
              </div>
            </div>

            {/* Modal body — scrollable */}
            <div className="overflow-y-auto flex-1 p-6">
              <PaymentTable
                payments={studentPayments}
                loading={paymentLoading}
                showActions
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
