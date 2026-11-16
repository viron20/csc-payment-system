import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { loginUser, googleLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate   = useNavigate();
  const { login } = useAuth();
  const [form, setForm]               = useState({ email: '', password: '' });
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── Email / password login ─────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginUser(form);
      login(data.token, data.user);
      navigate(['admin', 'superadmin'].includes(data.user.role) ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Google login — LOGIN ONLY, never registers ─────────────────
  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleLoading(true);
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const googleUserInfo = await userInfoRes.json();

      const { data } = await googleLogin({
        accessToken: tokenResponse.access_token,
        googleUserInfo,
      });

      login(data.token, data.user);
      navigate(['admin', 'superadmin'].includes(data.user.role) ? '/admin' : '/dashboard');
    } catch (err) {
      const errData = err.response?.data;
      const status  = err.response?.status;

      if (status === 404 && errData?.notRegistered) {
        // Not registered — warn and redirect to register page
        toast.warning(
          `"${errData.email}" is not registered. Redirecting to registration...`,
          { autoClose: 4000 }
        );
        setTimeout(() => navigate('/register'), 2500);
      } else if (status === 401) {
        toast.error('This account uses email and password. Please use the form above.');
      } else {
        toast.error(errData?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleBtn = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError:   () => toast.error('Google sign-in was cancelled or failed'),
    prompt:    'select_account',
  });

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="font-display text-3xl text-slate-900">Welcome back</h1>
          <p className="text-sm text-muted mt-1">Sign in to your CSC Fees account</p>
        </div>

        <div className="card">
          {/* Email / password form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">School Email</label>
              <input
                className="input"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@school.edu"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full justify-center py-3"
              disabled={loading}
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-muted">or continue with</span>
            </div>
          </div>

          {/* Google login */}
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
            Sign in with Google
          </button>

          {/* Hint for Google-only accounts */}
          <p className="text-xs text-center text-muted mt-3">
            First time using Google?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">
              Register here first
            </Link>
          </p>
        </div>

        <p className="text-center text-sm text-muted mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}