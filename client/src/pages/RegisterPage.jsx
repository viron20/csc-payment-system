import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { registerUser, googleRegister } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'TEACHER EDUCATION DEPARTMENT',
  'COMPUTER STUDIES DEPARTMENT',
  'ENGINEERING DEPARTMENT',
  'ENTREPRENEURSHIP',
  'NURSING',
  'TECHNOLOGY',
];

const PROGRAMS_BY_DEPARTMENT = {
  'TEACHER EDUCATION DEPARTMENT': [
    'BEED',
    'BTLED ICT',
    'BTLED HE',
    'BSED ENGLISH',
    'BSED MATH',
  ],
  'COMPUTER STUDIES DEPARTMENT': [
    'BSIS',
    'BSIT',
    'BSIT-ANIMATION',
    'BSCS',
  ],
  'ENGINEERING DEPARTMENT': [
    'BSCPE',
    'BSECE',
  ],
  ENTREPRENEURSHIP: ['BSENTREP'],
  NURSING: ['BSN'],
  TECHNOLOGY: ['BSAT', 'BSET', 'BSELT', 'BSMT'],
};

const formatDepartmentLabel = (department) =>
  department?.endsWith(' DEPARTMENT')
    ? department.replace(/ DEPARTMENT$/, '')
    : department || '';


export default function RegisterPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  // ── Email registration state ──────────────────────────────────
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({
    firstname: '', middlename: '', lastname: '',
    email: '', password: '', confirmPassword: '',
    course: '', year_level: '', department: '',
  });
  const [loading, setLoading] = useState(false);

  // ── Google registration state ─────────────────────────────────
  const [googleLoading,      setGoogleLoading]      = useState(false);
  const [showGoogleProfile,  setShowGoogleProfile]  = useState(false);
  const [pendingGoogleData,  setPendingGoogleData]  = useState(null);
  const [googleProfile, setGoogleProfile] = useState({
    firstname: '', middlename: '', lastname: '',
    course: '', year_level: '', department: '',
  });

  // ── Handlers ──────────────────────────────────────────────────
  const handle = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'department') {
        const validPrograms = PROGRAMS_BY_DEPARTMENT[value] || [];
        if (!validPrograms.includes(prev.course)) {
          next.course = '';
        }
      }
      return next;
    });
  };

  const handleGoogle = (e) => {
    const { name, value } = e.target;
    setGoogleProfile((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'department') {
        const validPrograms = PROGRAMS_BY_DEPARTMENT[value] || [];
        if (!validPrograms.includes(prev.course)) {
          next.course = '';
        }
      }
      return next;
    });
  };

  // Step 1 validation → go to step 2
  const handleNext = (e) => {
    e.preventDefault();
    if (!form.firstname || !form.lastname)    return toast.error('First and last name are required');
    if (!form.email)                          return toast.error('Email is required');
    if (form.password.length < 8)             return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setStep(2);
  };

  // Email/password full registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.year_level) return toast.error('Year level is required to set up your payment records');
    setLoading(true);
    try {
      const { data } = await registerUser({
        ...form,
        year_level: parseInt(form.year_level),
      });
      login(data.token, data.user);
      toast.success('Account created! Welcome to CSC Fees Tracker.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Google button click
  const handleGoogleSuccess = async (tokenResponse) => {
  setGoogleLoading(true);
  try {
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    });
    const googleUserInfo = await userInfoRes.json();

    // Always show profile form for registration — never skip it
    setPendingGoogleData({
      accessToken: tokenResponse.access_token,
      ...googleUserInfo,
    });
    setGoogleProfile(p => ({
      ...p,
      firstname: googleUserInfo.given_name  || '',
      lastname:  googleUserInfo.family_name || '',
    }));
    setShowGoogleProfile(true);
  } catch (err) {
    toast.error('Failed to get Google account info');
  } finally {
    setGoogleLoading(false);
  }
};

  const googleBtn = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError:   () => toast.error('Google sign-in was cancelled or failed'),
    prompt:    'select_account',
  });

  // Complete Google registration after profile form
  const handleGoogleProfileSubmit = async (e) => {
  e.preventDefault();
  if (!googleProfile.year_level)  return toast.error('Year level is required');
  if (!googleProfile.course)      return toast.error('Course is required');
  if (!googleProfile.department)  return toast.error('Department is required');

  setLoading(true);
  try {
    const { data } = await googleRegister({
      accessToken:    pendingGoogleData?.accessToken,
      googleUserInfo: pendingGoogleData,
      ...googleProfile,
      year_level: parseInt(googleProfile.year_level),
    });
    login(data.token, data.user);
    toast.success('Account created! Welcome to CSC Fees Tracker.');
    navigate('/dashboard');
  } catch (err) {
    const errData = err.response?.data;
    if (errData?.alreadyExists) {
      toast.error('This Google account is already registered. Please login instead.');
      navigate('/login');
    } else {
      toast.error(errData?.message || 'Registration failed');
    }
  } finally {
    setLoading(false);
  }
};

  // ── Google profile completion form ────────────────────────────
  if (showGoogleProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="font-display text-3xl text-slate-900">Complete Your Profile</h1>
            <p className="text-sm text-muted mt-1">
              We need a few details to set up your payment records
            </p>
          </div>

          <div className="card">
            {/* Google account info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 border border-brand-200 mb-5">
              {pendingGoogleData?.picture && (
                <img src={pendingGoogleData.picture} alt="" className="w-10 h-10 rounded-full shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-800 truncate">
                  {pendingGoogleData?.email}
                </p>
                <p className="text-xs text-brand-600">Signing up with Google</p>
              </div>
            </div>

            <form onSubmit={handleGoogleProfileSubmit} className="space-y-4">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    className="input" name="firstname" required
                    value={googleProfile.firstname} onChange={handleGoogle}
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    className="input" name="lastname" required
                    value={googleProfile.lastname} onChange={handleGoogle}
                    placeholder="Dela Cruz"
                  />
                </div>
              </div>
              <div>
                <label className="label">Middle Name</label>
                <input
                  className="input" name="middlename"
                  value={googleProfile.middlename} onChange={handleGoogle}
                  placeholder="Optional"
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-muted mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Academic details are used to automatically determine your payment records
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="label">Department *</label>
                    <select className="input" name="department" required value={googleProfile.department} onChange={handleGoogle}>
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{formatDepartmentLabel(d)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Program *</label>
                    <select className="input" name="course" required value={googleProfile.course} onChange={handleGoogle} disabled={!googleProfile.department}>
                      <option value="">{googleProfile.department ? 'Select Program' : 'Select department first'}</option>
                      {(PROGRAMS_BY_DEPARTMENT[googleProfile.department] || []).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Year Level *</label>
                    <select className="input" name="year_level" required value={googleProfile.year_level} onChange={handleGoogle}>
                      <option value="">Select</option>
                      {[1,2,3,4].map(y => (
                        <option key={y} value={y}>
                          {y}{['st','nd','rd','th'][y-1]} Year
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview how many years will be seeded */}
              {googleProfile.year_level && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {googleProfile.year_level} academic year{googleProfile.year_level > 1 ? 's' : ''} of payment records will be created for you
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowGoogleProfile(false)}
                  className="btn-secondary"
                >
                  ← Back
                </button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Main registration form ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="font-display text-3xl text-slate-900">Create Account</h1>
          <p className="text-sm text-muted mt-1">Join CSC Fees Tracker</p>
        </div>

        {/* Google sign-up button — always visible */}
        <div className="card mb-4">
          <p className="text-xs text-center text-muted mb-3 font-medium">Quick sign-up with Google</p>
          <button
            type="button"
            onClick={() => googleBtn()}
            disabled={googleLoading}
            className="btn-secondary w-full justify-center py-3"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-muted">or register with email</span>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-5">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${s <= step ? 'text-brand-600' : 'text-muted'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${s < step  ? 'bg-brand-600 text-white'
                    : s === step ? 'bg-brand-100 text-brand-700 border-2 border-brand-400'
                    :              'bg-slate-100 text-muted'}`}>
                    {s < step ? '✓' : s}
                  </div>
                  <span className="text-xs font-medium">
                    {s === 1 ? 'Account' : 'Academic Info'}
                  </span>
                </div>
                {s < 2 && (
                  <div className={`flex-1 h-px ${step > s ? 'bg-brand-400' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1 — account details */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name *</label>
                  <input className="input" name="firstname" required value={form.firstname} onChange={handle} placeholder="Juan" />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input className="input" name="lastname" required value={form.lastname} onChange={handle} placeholder="Dela Cruz" />
                </div>
              </div>
              <div>
                <label className="label">Middle Name</label>
                <input className="input" name="middlename" value={form.middlename} onChange={handle} placeholder="Optional" />
              </div>
              <div>
                <label className="label">School Email *</label>
                <input className="input" type="email" name="email" required value={form.email} onChange={handle} placeholder="you@school.edu" />
              </div>
              <div>
                <label className="label">Password *</label>
                <input className="input" type="password" name="password" required value={form.password} onChange={handle} placeholder="Min. 8 characters" />
              </div>
              <div>
                <label className="label">Confirm Password *</label>
                <input className="input" type="password" name="confirmPassword" required value={form.confirmPassword} onChange={handle} placeholder="Repeat password" />
              </div>
              <button type="submit" className="btn-primary w-full justify-center">
                Continue →
              </button>
            </form>
          )}

          {/* Step 2 — academic info */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-muted -mt-1 pb-3 border-b border-slate-100 flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 mt-0.5 text-brand-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Your year level determines how many academic years of payment records are created for you
              </p>

              <div className="space-y-4">
                <div>
                  <label className="label">Department *</label>
                  <select className="input" name="department" required value={form.department} onChange={handle}>
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{formatDepartmentLabel(d)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Program *</label>
                  <select className="input" name="course" required value={form.course} onChange={handle} disabled={!form.department}>
                    <option value="">{form.department ? 'Select Program' : 'Select department first'}</option>
                    {(PROGRAMS_BY_DEPARTMENT[form.department] || []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Year Level *</label>
                  <select className="input" name="year_level" required value={form.year_level} onChange={handle}>
                    <option value="">Select</option>
                    {[1,2,3,4].map(y => (
                      <option key={y} value={y}>
                        {y}{['st','nd','rd','th'][y-1]} Year
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview years to be created */}
              {form.year_level && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {form.year_level} academic year{form.year_level > 1 ? 's' : ''} of payment records will be created for you
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  ← Back
                </button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted mt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}