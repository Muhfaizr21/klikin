import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import Logo from './Logo';
import {
  GoogleIcon,
  GithubIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowLeftIcon,
  CheckIcon,
  AlertCircleIcon,
} from './Icons';
import { navigateTo } from '../utils/navigation';
import { API_BASE } from '../lib/api';

export default function AuthPage({ initialMode = 'login', onBackToHome, onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!email || !password) {
      setFeedback({
        type: 'error',
        message: 'Mohon lengkapi email dan kata sandi Anda.',
      });
      return;
    }

    if (password.length < 8) {
      setFeedback({
        type: 'error',
        message: 'Kata sandi minimal 8 karakter.',
      });
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === 'register' ? `${API_BASE}/auth/register` : `${API_BASE}/auth/login`;
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const derivedUsername = (email.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');

      const payload = mode === 'register'
        ? {
            email: email.trim(),
            password,
            full_name: fullName || 'Pengguna Klikin',
            username: derivedUsername,
          }
        : {
            email: email.trim(),
            password,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || resData.message || 'Gagal memproses autentikasi akun.');
      }

      const user = resData.data.user;
      const token = resData.data.token;

      setFeedback({
        type: 'success',
        message: mode === 'register'
          ? 'Registrasi berhasil! Membuka dashboard...'
          : `Login berhasil sebagai ${user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Owner'}! Membuka workspace...`,
      });

      if (onAuthSuccess) {
        setTimeout(() => {
          onAuthSuccess(user, token);
        }, 500);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal memproses data akun.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      setLoading(true);
      setFeedback(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Login dengan ${provider} gagal: ${err.message}`,
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-void)] text-white flex items-center justify-center p-4 sm:p-8 lg:p-12 font-sans selection:bg-[var(--color-acid-lime)] selection:text-black">
      {/* Centered Modal / Split Container */}
      <div className="w-full max-w-[1040px] grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        {/* Left Column: Visual Showcase Card */}
        <div className="w-full">
          <div className="relative overflow-hidden rounded-[28px] sm:rounded-[34px] p-8 sm:p-12 min-h-[560px] sm:min-h-[620px] flex flex-col justify-center items-center text-center border border-white/[0.08] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9)] bg-gradient-to-b from-[#181a1d] via-[#101214] to-[#090a0b]">
            {/* Atmospheric Ambient Glow Layer */}
            <div className="absolute -top-24 -left-24 w-[380px] h-[380px] bg-white/[0.03] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-1/2 -right-20 w-72 h-72 bg-[var(--color-acid-lime)]/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
              {/* Brand Logo & Name */}
              <div className="mb-6">
                <Logo size={32} textClassName="text-[18px]" />
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-3xl sm:text-[34px] font-[510] text-[var(--color-paper)] tracking-tight mb-2.5">
                {mode === 'register' ? 'Get Started with Us' : 'Welcome Back'}
              </h2>
              <p className="text-[var(--color-fog)] text-sm leading-relaxed mb-8 max-w-xs">
                {mode === 'register'
                  ? 'Complete these easy steps to register your account.'
                  : 'Manage your links, store, and analytics in one place.'}
              </p>

              {/* 3 Step Indicator Cards matching the reference layout */}
              <div className="w-full flex flex-col gap-3 text-left">
                {/* Step 1: Active */}
                <div className="bg-white text-black rounded-xl p-3.5 flex items-center gap-3.5 shadow-lg transition-transform hover:scale-[1.01]">
                  <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </span>
                  <span className="text-sm font-semibold tracking-tight">
                    {mode === 'register' ? 'Sign up your account' : 'Log in to your account'}
                  </span>
                </div>

                {/* Step 2 */}
                <div className="bg-white/[0.03] border border-white/[0.08] text-[var(--color-fog)] rounded-xl p-3.5 flex items-center gap-3.5 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center font-medium text-xs shrink-0">
                    2
                  </span>
                  <span className="text-sm font-medium text-[var(--color-mist)]">
                    Set up your workspace
                  </span>
                </div>

                {/* Step 3 */}
                <div className="bg-white/[0.03] border border-white/[0.08] text-[var(--color-fog)] rounded-xl p-3.5 flex items-center gap-3.5 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center font-medium text-xs shrink-0">
                    3
                  </span>
                  <span className="text-sm font-medium text-[var(--color-mist)]">
                    Set up your profile
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Form Matching Reference */}
        <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center">
          {/* Back to Home Button */}
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-xs font-mono text-[var(--color-fog)] hover:text-white transition-colors mb-6 self-start group"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Kembali ke Beranda</span>
            </button>
          )}

          {/* Form Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-[28px] font-[510] text-white tracking-tight mb-2">
              {mode === 'register' ? 'Sign Up Account' : 'Welcome Back'}
            </h1>
            <p className="text-[var(--color-fog)] text-sm">
              {mode === 'register'
                ? 'Enter your personal data to create your account.'
                : 'Enter your credentials to access your account.'}
            </p>
          </div>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              className="bg-[#141517] hover:bg-[#1a1c1e] border border-white/10 hover:border-white/20 text-white text-sm font-medium py-2.5 px-3 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={loading}
              className="bg-[#141517] hover:bg-[#1a1c1e] border border-white/10 hover:border-white/20 text-white text-sm font-medium py-2.5 px-3 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <GithubIcon className="w-4 h-4 shrink-0" />
              <span>Github</span>
            </button>
          </div>

          {/* Horizontal Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-zinc-500 font-normal">Or continue with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Quick Demo Test Accounts (Superadmin & Owner) */}
          <div className="mb-5 p-3.5 rounded-xl bg-[var(--color-obsidian)] border border-[var(--color-graphite)]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-mono text-[var(--color-mist)] font-medium tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-acid-lime)]" />
                <span>Akun Demo Uji Coba:</span>
              </span>
              <span className="text-[10px] text-[var(--color-ash)] font-mono">Klik untuk Isi Cepat</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@klikin.id');
                  setPassword('admin12345');
                  setMode('login');
                  setFeedback(null);
                }}
                className="text-left p-2.5 rounded-lg bg-black/40 hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/20 transition-all text-xs group"
              >
                <div className="font-semibold text-white group-hover:text-[var(--color-acid-lime)] flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Super Admin</span>
                </div>
                <div className="text-[11px] text-zinc-300 font-mono truncate">admin@klikin.id</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('owner@klikin.id');
                  setPassword('owner12345');
                  setMode('login');
                  setFeedback(null);
                }}
                className="text-left p-2.5 rounded-lg bg-black/40 hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/20 transition-all text-xs group"
              >
                <div className="font-semibold text-white group-hover:text-emerald-400 flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Owner Toko</span>
                </div>
                <div className="text-[11px] text-zinc-300 font-mono truncate">owner@klikin.id</div>
              </button>
            </div>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircleIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="eg. John"
                    style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                    className="auth-input w-full bg-[#141517] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-sm !text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="eg. Francisco"
                    style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                    className="auth-input w-full bg-[#141517] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-sm !text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eg. johnfrans@gmail.com"
                style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                className="auth-input w-full bg-[#141517] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-sm !text-white placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback({
                        type: 'success',
                        message: 'Tautan reset kata sandi telah dikirim ke email Anda.',
                      });
                    }}
                    className="text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                  className="auth-input w-full bg-[#141517] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 pr-10 text-sm !text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Must be at least 8 characters.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-[var(--color-bone)] text-black font-semibold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              )}
              <span>{mode === 'register' ? 'Sign Up' : 'Log In'}</span>
            </button>
          </form>

          {/* Switch Mode Footer */}
          <div className="text-center mt-6 text-xs text-zinc-400">
            {mode === 'register' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setFeedback(null);
                    navigateTo('/login');
                  }}
                  className="text-white font-medium hover:underline ml-0.5"
                >
                  Log in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setFeedback(null);
                    navigateTo('/register');
                  }}
                  className="text-white font-medium hover:underline ml-0.5"
                >
                  Sign up
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
