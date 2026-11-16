import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const COURSES = [
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

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstname:  user?.firstname  || '',
    middlename: user?.middlename || '',
    lastname:   user?.lastname   || '',
    course:     user?.course     || '',
    year_level: user?.year_level || '',
    department: user?.department || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Change password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handle = (e) => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setSaved(false); };
  const handlePw = (e) => setPwForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ ...form, year_level: form.year_level ? parseInt(form.year_level) : null });
      await refreshUser();
      setSaved(true);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    setPwSaving(true);
    try {
      await API.put('/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPw(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const isGoogleUser = !user?.password && !!user;

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">

      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl text-slate-900">My Profile</h1>
        <p className="text-sm text-muted mt-1">Manage your account information</p>
      </div>

      {/* Identity card */}
      <div className="card flex items-center gap-5">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt="avatar"
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-brand-100 shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 font-bold text-xl flex items-center justify-center shrink-0 select-none">
            {user?.firstname?.[0]}{user?.lastname?.[0]}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-display text-xl text-slate-900 truncate">
            {user?.firstname} {user?.middlename ? user.middlename[0] + '. ' : ''}{user?.lastname}
          </p>
          <p className="text-sm text-muted truncate">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border
              ${user?.role === 'admin'
                ? 'bg-brand-50 text-brand-700 border-brand-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {user?.role === 'admin' ? '⚡ Administrator' : '🎓 Student'}
            </span>
            {user?.google_id && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                <svg className="w-3 h-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit profile form */}
      <div className="card">
        <h2 className="font-display text-lg text-slate-900 border-b border-slate-100 pb-3 mb-5">
          Personal Information
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">First Name *</label>
              <input className="input" name="firstname" required value={form.firstname} onChange={handle} />
            </div>
            <div>
              <label className="label">Middle Name</label>
              <input className="input" name="middlename" value={form.middlename} onChange={handle} placeholder="Optional" />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input" name="lastname" required value={form.lastname} onChange={handle} />
            </div>
          </div>

          <div>
            <label className="label">School Email</label>
            <input className="input bg-slate-50 cursor-not-allowed text-muted" value={user?.email || ''} disabled />
            <p className="text-xs text-muted mt-1.5">Email address cannot be changed</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Course</label>
              <select className="input" name="course" value={form.course} onChange={handle}>
                <option value="">Select</option>
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year Level</label>
              <select className="input" name="year_level" value={form.year_level} onChange={handle}>
                <option value="">Select</option>
                {[1,2,3,4].map(y => (
                  <option key={y} value={y}>{y}{['st','nd','rd','th'][y-1]} Year</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input" name="department" value={form.department} onChange={handle}>
                <option value="">Select</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{formatDepartmentLabel(d)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
              )}
              Save Changes
            </button>
            {saved && (
              <span className="text-sm text-emerald-600 font-medium flex items-center gap-1 animate-[fadeSlideIn_0.2s_ease_forwards]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Change password — only for email/password accounts */}
      {!isGoogleUser && (
        <div className="card">
          <button
            type="button"
            onClick={() => setShowPw(p => !p)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">Change Password</p>
                <p className="text-xs text-muted">Update your account password</p>
              </div>
            </div>
            <svg
              className={`w-4 h-4 text-muted transition-transform duration-200 ${showPw ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showPw && (
            <form onSubmit={handlePasswordChange} className="mt-5 pt-5 border-t border-slate-100 space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input
                  className="input" type="password" name="currentPassword" required
                  value={pwForm.currentPassword} onChange={handlePw} placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  className="input" type="password" name="newPassword" required
                  value={pwForm.newPassword} onChange={handlePw} placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  className="input" type="password" name="confirmPassword" required
                  value={pwForm.confirmPassword} onChange={handlePw} placeholder="Repeat new password"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPw(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={pwSaving}>
                  {pwSaving
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
