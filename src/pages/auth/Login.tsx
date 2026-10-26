import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useApp, ApiError } from '../../context/AppContext';

type LoginError =
  | 'wrong_password'
  | 'not_found'
  | 'not_verified'
  | 'suspended'
  | 'too_many'
  | 'server'
  | 'role_mismatch'
  | null;

const ERROR_MESSAGES: Record<NonNullable<LoginError>, { title: string; body: string; cta?: string; ctaLink?: string }> = {
  wrong_password: { title: 'Incorrect credentials', body: 'The email or password you entered is incorrect. Please try again.' },
  not_found:      { title: 'Account not found', body: 'No account exists with this email address. Did you mean to sign up?' },
  not_verified:   { title: 'Account not verified', body: 'Your account has not been verified yet. Please check your email or phone for the OTP.', cta: 'Verify Account', ctaLink: '/verify' },
  suspended:      { title: 'Account suspended', body: 'Your account has been suspended. Please contact support for assistance.', cta: 'Contact Support', ctaLink: '/contact' },
  too_many:       { title: 'Too many attempts', body: 'Too many failed login attempts. Please wait 15 minutes before trying again.' },
  server:         { title: 'Something went wrong', body: 'We could not connect to our servers. Please check your internet connection and try again.' },
  role_mismatch:  { title: 'Account type does not match', body: 'The account you signed in with does not have the selected role. Choose the role assigned to your account.' },
};

export default function Login() {
  const { login, logout } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [expectedRole, setExpectedRole] = useState<'tourist' | 'vendor' | 'guide' | 'admin'>('tourist');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const redirectedFrom = searchParams.get('from');
  const justVerified = searchParams.get('verified') === '1';
  const justReset = searchParams.get('reset') === '1';

  function validate() {
    const errs: typeof fieldErrors = {};
    if (!email) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role !== expectedRole) {
        logout();
        setError('role_mismatch');
        return;
      }
      const dest = user.role === 'admin' ? '/admin'
        : user.role === 'vendor' ? '/vendor'
        : user.role === 'guide' ? '/guide-dashboard'
        : redirectedFrom || '/';
      navigate(dest);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 403 && /suspend/i.test(e.message)) setError('suspended');
        else if (e.status === 401) setError('wrong_password');
        else setError('server');
      } else {
        setError('server');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left visual panel */}
      <div className="hidden lg:flex w-[45%] relative flex-col">
        <img
          src="https://images.unsplash.com/photo-1601315773738-d529c1a65d08?w=1200&h=900&fit=crop&auto=format"
          alt="Heritage Bangladesh"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(0,106,78,0.85) 0%, rgba(26,26,46,0.92) 100%)' }} />
        <div className="relative flex flex-col h-full p-12 justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>H</span>
            </div>
            <span className="text-white font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
              Heritage<span style={{ color: '#D4A017' }}>BD</span>
            </span>
          </Link>

          {/* Centre message */}
          <div className="text-white">
            <h2 className="text-4xl font-bold mb-4 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Discover.<br />Experience.<br /><span style={{ color: '#D4A017' }}>Preserve.</span>
            </h2>
            <p className="text-white/70 text-base leading-relaxed max-w-sm">
              Sign in to explore Bangladesh's living heritage — from ancient forts and mosques to master artisans and expert local guides.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 text-white/60 text-xs">
            <div className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-400" /> Verified Guides</div>
            <div className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-400" /> Authentic Products</div>
            <div className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-400" /> Secure Payments</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 overflow-y-auto" style={{ background: 'var(--color-bg)' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
              Heritage<span style={{ color: 'var(--color-primary)' }}>BD</span>
            </span>
          </div>

          {/* Success banners from redirect */}
          {justVerified && (
            <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Account verified!</p>
                <p className="text-xs text-green-700">Your account is now verified. Sign in to continue.</p>
              </div>
            </div>
          )}
          {justReset && (
            <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Password changed successfully!</p>
                <p className="text-xs text-green-700">Please sign in with your new password.</p>
              </div>
            </div>
          )}

          <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
            Welcome back
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
            Sign in to continue your heritage journey
          </p>

          {/* Global error banner */}
          {error && (
            <div role="alert" aria-live="assertive" className="mb-5 p-4 rounded-xl border-2 flex items-start gap-3"
              style={{ background: error === 'suspended' ? '#FEF2F2' : error === 'not_verified' ? '#FFFBEB' : '#FEF2F2',
                       borderColor: error === 'not_verified' ? '#FCD34D' : '#FECACA' }}>
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0"
                style={{ color: error === 'not_verified' ? '#D97706' : '#DC2626' }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: error === 'not_verified' ? '#92400E' : '#991B1B' }}>
                  {ERROR_MESSAGES[error].title}
                </p>
                <p id="login-error-message" className="text-xs mt-0.5" style={{ color: error === 'not_verified' ? '#B45309' : '#B91C1C' }}>
                  {ERROR_MESSAGES[error].body}
                </p>
                {ERROR_MESSAGES[error].cta && (
                  <Link to={ERROR_MESSAGES[error].ctaLink!}
                    className="inline-block text-xs font-semibold mt-2 underline"
                    style={{ color: error === 'not_verified' ? '#D97706' : '#DC2626' }}>
                    {ERROR_MESSAGES[error].cta} →
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <fieldset>
              <legend className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Sign in as</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['tourist', 'vendor', 'guide', 'admin'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={expectedRole === role}
                    onClick={() => setExpectedRole(role)}
                    className="rounded-xl border-2 px-3 py-2.5 text-sm font-semibold capitalize transition-colors"
                    style={expectedRole === role
                      ? { borderColor: 'var(--color-primary)', background: '#E6F4EF', color: 'var(--color-primary)' }
                      : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>This selection is checked against your role stored on the server.</p>
            </fieldset>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Email address</label>
              <div className="relative">
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  autoComplete="username"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: undefined })); }}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border-2 transition-colors bg-white"
                  style={{ borderColor: fieldErrors.email ? '#DC2626' : 'var(--color-border)' }}
                  onFocus={e => { if (!fieldErrors.email) e.target.style.borderColor = 'var(--color-primary)'; }}
                  onBlur={e => { if (!fieldErrors.email) e.target.style.borderColor = 'var(--color-border)'; }}
                />
                {email && !fieldErrors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                  <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
              {fieldErrors.email && (
                <p id="login-email-error" role="alert" className="text-xs mt-1 flex items-center gap-1 text-red-600">
                  <AlertCircle size={12} /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Password</label>
                <Link to="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: undefined })); }}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none border-2 transition-colors bg-white"
                  style={{ borderColor: fieldErrors.password ? '#DC2626' : 'var(--color-border)' }}
                  onFocus={e => { if (!fieldErrors.password) e.target.style.borderColor = 'var(--color-primary)'; }}
                  onBlur={e => { if (!fieldErrors.password) e.target.style.borderColor = 'var(--color-border)'; }}
                />
                <button type="button" aria-label={showPass ? 'Hide password' : 'Show password'} aria-pressed={showPass} onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="login-password-error" role="alert" className="text-xs mt-1 flex items-center gap-1 text-red-600">
                  <AlertCircle size={12} /> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} aria-busy={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--color-primary)' }}>
              {loading
                ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span className="sr-only">Signing in…</span></>
                : <><span>Sign In</span><ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          </div>

          {/* Google SSO */}
          <button type="button" disabled title="Google sign-in is not set up in this project — please use email and password."
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border-2 font-semibold text-sm opacity-50 cursor-not-allowed"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
            <span className="text-lg font-bold" style={{ color: '#4285F4' }}>G</span>
            Continue with Google (not available)
          </button>

          <div className="flex items-center justify-center gap-4 mt-5">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {"Don't have an account? "}
              <Link to="/signup" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
                Create one
              </Link>
            </p>
          </div>

          {import.meta.env.DEV && (
            <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Development demo accounts are available only when the local development seed data is installed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
