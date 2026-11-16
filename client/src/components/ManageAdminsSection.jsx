import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { superadminGetAdmins, superadminAddAdmin, superadminUpdateAdmin } from '../services/api';
import EmptyState from './EmptyState';

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

export default function ManageAdminsSection() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [addForm, setAddForm] = useState({
    firstname: '',
    middlename: '',
    lastname: '',
    email: '',
    password: '',
    department: 'COMPUTER STUDIES DEPARTMENT',
  });

  const [editForm, setEditForm] = useState({
    firstname: '',
    middlename: '',
    lastname: '',
    email: '',
    department: '',
    newPassword: '',
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await superadminGetAdmins();
      setAdmins(data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch admin accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await superadminAddAdmin(addForm);
      toast.success('✓ New Admin added successfully');
      setAddModalOpen(false);
      setAddForm({
        firstname: '',
        middlename: '',
        lastname: '',
        email: '',
        password: '',
        department: 'COMPUTER STUDIES DEPARTMENT',
      });
      fetchAdmins();
    } catch (err) {
      toast.error(err.message || 'Failed to add admin');
    }
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setEditForm({
      firstname: admin.firstname || '',
      middlename: admin.middlename || '',
      lastname: admin.lastname || '',
      email: admin.email || '',
      department: admin.department || 'COMPUTER STUDIES DEPARTMENT',
      newPassword: '',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;
    try {
      await superadminUpdateAdmin(editingAdmin.id, editForm);
      toast.success('✓ Admin updated successfully');
      setEditModalOpen(false);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (err) {
      toast.error(err.message || 'Failed to update admin');
    }
  };

  return (
    <div className="card space-y-6">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl text-slate-900">Admin Accounts</h2>
          <p className="text-xs text-muted mt-0.5">Manage and configure administrator permissions</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add New Admin
        </button>
      </div>

      {/* Admin Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        {loading ? (
          <div className="p-6 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-11 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : admins.length === 0 ? (
          <EmptyState
            icon={<svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
            title="No admin accounts found"
            description="Click 'Add New Admin' to create an admin user."
          />
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="table-header">Admin Name</th>
                <th className="table-header">Email</th>
                <th className="table-header hidden md:table-cell">Department</th>
                <th className="table-header">Role</th>
                <th className="table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {admins.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {a.firstname?.[0]}{a.lastname?.[0]}
                      </div>
                      <p className="font-medium text-slate-800 text-sm">
                        {a.lastname}, {a.firstname} {a.middlename ? `${a.middlename[0]}.` : ''}
                      </p>
                    </div>
                  </td>
                  <td className="table-cell text-xs text-slate-600 font-mono">{a.email}</td>
                  <td className="table-cell hidden md:table-cell text-xs text-slate-600">
                    {formatDepartmentLabel(a.department) || '—'}
                  </td>
                  <td className="table-cell">
                    <span className="inline-flex px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider border border-brand-200">
                      Admin
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <button
                      onClick={() => openEditModal(a)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add Admin Modal ── */}
      {addModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setAddModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeSlideIn_0.2s_ease_forwards]">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl text-slate-900">Add New Admin</h3>
                <p className="text-xs text-muted mt-0.5">Create credentials for a new system administrator</p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-muted transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    required
                    className="input"
                    value={addForm.firstname}
                    onChange={(e) => setAddForm((p) => ({ ...p, firstname: e.target.value }))}
                    placeholder="e.g. Maria"
                  />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    required
                    className="input"
                    value={addForm.lastname}
                    onChange={(e) => setAddForm((p) => ({ ...p, lastname: e.target.value }))}
                    placeholder="e.g. Santos"
                  />
                </div>
              </div>

              <div>
                <label className="label">Middle Name (Optional)</label>
                <input
                  className="input"
                  value={addForm.middlename}
                  onChange={(e) => setAddForm((p) => ({ ...p, middlename: e.target.value }))}
                  placeholder="e.g. Cruz"
                />
              </div>

              <div>
                <label className="label">Email Address *</label>
                <input
                  required
                  type="email"
                  className="input"
                  value={addForm.email}
                  onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="admin.name@school.edu"
                />
              </div>

              <div>
                <label className="label">Password (Min 8 chars) *</label>
                <input
                  required
                  type="password"
                  minLength={8}
                  className="input"
                  value={addForm.password}
                  onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="label">Department</label>
                <select
                  className="input"
                  value={addForm.department}
                  onChange={(e) => setAddForm((p) => ({ ...p, department: e.target.value }))}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{formatDepartmentLabel(d)}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Admin Modal ── */}
      {editModalOpen && editingAdmin && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeSlideIn_0.2s_ease_forwards]">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl text-slate-900">Edit Admin Account</h3>
                <p className="text-xs text-muted mt-0.5">Update details for {editingAdmin.firstname} {editingAdmin.lastname}</p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-muted transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    required
                    className="input"
                    value={editForm.firstname}
                    onChange={(e) => setEditForm((p) => ({ ...p, firstname: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    required
                    className="input"
                    value={editForm.lastname}
                    onChange={(e) => setEditForm((p) => ({ ...p, lastname: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="label">Middle Name</label>
                <input
                  className="input"
                  value={editForm.middlename}
                  onChange={(e) => setEditForm((p) => ({ ...p, middlename: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Email Address *</label>
                <input
                  required
                  type="email"
                  className="input"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">New Password (Leave blank to keep unchanged)</label>
                <input
                  type="password"
                  minLength={8}
                  className="input"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Min 8 characters if updating"
                />
              </div>

              <div>
                <label className="label">Department</label>
                <select
                  className="input"
                  value={editForm.department}
                  onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{formatDepartmentLabel(d)}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
