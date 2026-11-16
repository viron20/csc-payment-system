import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  upload:    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  profile:   <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  admin:     <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  logout:    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  menu:      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const studentLinks = [
  { to: '/dashboard',       label: 'Dashboard',       icon: 'dashboard' },
  { to: '/upload-receipt',  label: 'Upload Receipt',  icon: 'upload'    },
  { to: '/profile',         label: 'My Profile',      icon: 'profile'   },
];

const adminLinks = [
  { to: '/admin',         label: 'Admin Panel', icon: 'admin',   end: true },
  { to: '/admin/profile', label: 'My Profile',  icon: 'profile'           },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const links = ['admin', 'superadmin'].includes(user?.role) ? adminLinks : studentLinks;

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  const close = () => setMobileOpen(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <p className="font-display text-base text-slate-900 leading-tight">CSC Fees</p>
            <p className="text-[10px] text-muted font-mono uppercase tracking-widest">Tracker</p>
          </div>
        </div>
      </div>

      {/* User chip */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs
              flex items-center justify-center shrink-0 select-none">
              {user?.firstname?.[0]}{user?.lastname?.[0]}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user?.firstname} {user?.lastname}
            </p>
            <p className="text-[10px] text-muted truncate">{user?.email}</p>
          </div>
        </div>
        {user?.role === 'superadmin' ? (
          <div className="mt-2 flex justify-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-50
              text-purple-700 text-[10px] font-bold uppercase tracking-wider border border-purple-200">
              👑 Superadmin
            </span>
          </div>
        ) : user?.role === 'admin' ? (
          <div className="mt-2 flex justify-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-brand-50
              text-brand-700 text-[10px] font-bold uppercase tracking-wider border border-brand-200">
              ⚡ Admin
            </span>
          </div>
        ) : null}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          Menu
        </p>
        {links.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={close}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            {icons[icon]}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5 border-t border-slate-100 pt-3">
        <button
          onClick={handleLogoutClick}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          {icons.logout}
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        aria-label="Open menu"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white rounded-xl p-2 shadow-card border border-slate-200"
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? icons.close : icons.menu}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-50 shadow-xl
        transition-transform duration-300 ease-out lg:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-slate-100 fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* ── Sign Out Warning Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 text-center animate-[fadeSlideIn_0.2s_ease_forwards]">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto ring-4 ring-red-50/50">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>

            <div>
              <h3 className="font-display text-xl text-slate-900">Sign Out Confirmation</h3>
              <p className="text-xs text-muted mt-1">
                Are you sure you really want to sign out of your account?
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors flex-1 justify-center shadow-sm"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
