import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle, ArrowRight, ArrowLeft, Users, Store, Compass,
  Eye, EyeOff, AlertCircle, Upload, Camera
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { documentsApi } from '../../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────

type Role = 'tourist' | 'vendor' | 'guide';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  avatar: string;
  terms: boolean;
}

// ─── Password strength ───────────────────────────────────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', '#DC2626', '#F97316', '#EAB308', '#16A34A', '#15803D'];
  return { score, label: labels[score] || '', color: colors[score] || '' };
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color } = getStrength(password);
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: i <= score ? color : 'var(--color-border)' }} />
          ))}
        </div>
        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${c.ok ? 'bg-green-100' : 'bg-gray-100'}`}>
              {c.ok ? <CheckCircle size={9} className="text-green-600" /> : <div className="w-1 h-1 rounded-full bg-gray-400" />}
            </div>
            <span style={{ color: c.ok ? '#16A34A' : 'var(--color-text-muted)' }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Steps ──────────────────────────────────────────────────────────────────

const ROLES = [
  {
    id: 'tourist' as Role,
    label: 'Tourist',
    icon: Users,
    desc: 'Explore heritage sites, hire guides, shop authentic products',
    color: '#006A4E',
    bg: '#E6F4EF',
    steps: 3,
  },
  {
    id: 'vendor' as Role,
    label: 'Vendor',
    icon: Store,
    desc: 'Sell your authentic Bengali products to heritage lovers',
    color: '#795800',
    bg: '#FDF6E3',
    steps: 4,
  },
  {
    id: 'guide' as Role,
    label: 'Tour Guide',
    icon: Compass,
    desc: 'Share your expertise and earn by guiding heritage travelers',
    color: '#7C3AED',
    bg: '#F5F3FF',
    steps: 4,
  },
];

// ─── Main component ──────────────────────────────────────────────────────────

export default function Signup() {
  const { register } = useApp();
  const [signupError, setSignupError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>(
    ROLES.find(r => r.id === searchParams.get('role'))?.id ?? 'tourist',
  );
  const [form, setForm] = useState<FormData>({
    name: '', email: '', phone: '', password: '', confirm: '', avatar: '', terms: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [touristDocument, setTouristDocument] = useState<File | null>(null);

  const selectedRole = ROLES.find(r => r.id === role)!;

  function setField(key: keyof FormData, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }));
    setFieldErrors(e => ({ ...e, [key]: undefined }));
  }

  function validateDetails(): boolean {
    const errs: typeof fieldErrors = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.email) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.phone) errs.phone = 'Phone number is required.';
    else if (!/^01[3-9]\d{8}$/.test(form.phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid Bangladeshi phone number (01XXXXXXXXX).';
    if (!form.password) errs.password = 'Password is required.';
    else if (getStrength(form.password).score < 3) errs.password = 'Password is too weak. Use 8+ characters with letters and numbers.';
    if (!form.confirm) errs.confirm = 'Please confirm your password.';
    else if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.';
    if (!form.terms) errs.terms = 'You must agree to the Terms & Conditions.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleDetailsNext() {
    if (!validateDetails()) return;
    if (role === 'tourist' && !touristDocument) {
      setSignupError('Upload an identity document (NID or passport) to create a tourist account.');
      return;
    }
    setSignupError('');
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        avatar: form.avatar || undefined,
        role,
      });
      if (role === 'tourist') {
        try {
          await documentsApi.upload(touristDocument!, 'identity');
        } catch (uploadError) {
          console.error('Account created, but the tourist identity document upload failed.', uploadError);
          navigate('/profile?tab=documents&upload=failed');
          return;
        }
        navigate('/?welcome=1');
      } else {
        navigate(role === 'vendor' ? '/onboarding/vendor' : '/onboarding/guide');
      }
    } catch (e: any) {
      setSignupError(e?.message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (key: keyof FormData) =>
    `w-full px-4 py-3 rounded-xl text-sm outline-none border-2 transition-colors bg-white ${fieldErrors[key] ? 'border-red-400' : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'}`;

  return (
    <div className="min-h-screen flex items-start justify-center p-4 py-10" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
              <span className="text-white font-bold">H</span>
            </div>
            <span className="font-bold text-xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
              Heritage<span style={{ color: 'var(--color-primary)' }}>BD</span>
            </span>
          </Link>

          {/* Step indicator */}
          {step > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {['Details', 'Create account'].map((label, i) => {
                const n = i + 1;
                const done = n < step;
                const active = n === step;
                return (
                  <React.Fragment key={label}>
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={done ? { background: 'var(--color-primary)', color: 'white' }
                          : active ? { background: selectedRole.color, color: 'white' }
                          : { background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                        {done ? '✓' : n}
                      </div>
                      <span className="text-xs mt-1" style={{ color: active ? selectedRole.color : 'var(--color-text-muted)' }}>{label}</span>
                    </div>
                    {i < 1 && <div className="w-8 h-px mb-4" style={{ background: done ? 'var(--color-primary)' : 'var(--color-border)' }} />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* ── STEP 0: Choose role ── */}
        {step === 0 && (
          <div>
            <h1 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
              Create your HeritageBD account
            </h1>
            <p className="text-center text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>How will you use HeritageBD?</p>

            <div className="space-y-3 mb-6">
              {ROLES.map(r => (
                <button key={r.id} type="button" aria-pressed={role === r.id} onClick={() => setRole(r.id)}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all"
                  style={role === r.id
                    ? { borderColor: r.color, background: r.bg }
                    : { borderColor: 'var(--color-border)', background: 'white' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: role === r.id ? r.color : 'var(--color-surface-2)' }}>
                    <r.icon size={22} style={{ color: role === r.id ? 'white' : 'var(--color-text-muted)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold" style={{ color: 'var(--color-text)' }}>{r.label}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{r.desc}</p>
                    {r.id !== 'tourist' && (
                      <p className="text-xs mt-1 font-medium" style={{ color: r.color }}>
                        {r.id === 'vendor' ? '📋 Requires business verification' : '📋 Requires identity verification'}
                      </p>
                    )}
                  </div>
                  {role === r.id && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: r.color }}>
                      <CheckCircle size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button type="button" onClick={() => setStep(1)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90"
              style={{ background: selectedRole.color }}>
              Continue as {selectedRole.label} <ArrowRight size={16} />
            </button>
            <p className="text-center text-sm mt-5" style={{ color: 'var(--color-text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>Sign in</Link>
            </p>
          </div>
        )}

        {/* ── STEP 1: Details ── */}
        {step === 1 && (
          <form onSubmit={event => { event.preventDefault(); void handleDetailsNext(); }} className="bg-white rounded-2xl p-7 border" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-3 mb-6">
              <button type="button" onClick={() => setStep(0)} aria-label="Back to account type selection" className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>Create Your Account</h2>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Registering as: <strong style={{ color: selectedRole.color }}>{selectedRole.label}</strong></p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2" style={{ borderColor: 'var(--color-border)' }}>
                    {form.avatar
                      ? <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      : <Camera size={22} style={{ color: 'var(--color-text-muted)' }} />}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer" style={{ background: 'var(--color-primary)' }}>
                    <Upload size={11} className="text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Profile Photo</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Optional · JPG, PNG up to 5MB</p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="signup-name" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Full Name *</label>
                <input id="signup-name" name="name" autoComplete="name" type="text" value={form.name} onChange={e => setField('name', e.target.value)}
                  placeholder="Your full name" className={inputClass('name')} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? 'signup-name-error' : undefined} />
                {fieldErrors.name && <p id="signup-name-error" role="alert" className="text-xs mt-1 text-red-600 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="signup-email" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Email Address *</label>
                <div className="relative">
                  <input id="signup-email" name="email" autoComplete="email" type="email" value={form.email} onChange={e => setField('email', e.target.value)}
                    placeholder="you@example.com" className={inputClass('email')} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined} />
                  {form.email && !fieldErrors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                    <CheckCircle size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {fieldErrors.email && <p id="signup-email-error" role="alert" className="text-xs mt-1 text-red-600 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="signup-phone" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Phone Number *</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 border-2 rounded-xl text-sm font-medium flex-shrink-0" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                    🇧🇩 +880
                  </div>
                  <input id="signup-phone" name="phone" autoComplete="tel" type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)}
                    placeholder="01XXXXXXXXX" className={`flex-1 ${inputClass('phone')}`} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'signup-phone-error' : undefined} />
                </div>
                {fieldErrors.phone && <p id="signup-phone-error" role="alert" className="text-xs mt-1 text-red-600 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.phone}</p>}
              </div>

              {role === 'tourist' && (
                <div>
                  <label htmlFor="signup-document" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Identity Document *</label>
                  <input
                    id="signup-document"
                    name="identityDocument"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={event => {
                      setTouristDocument(event.target.files?.[0] || null);
                      setSignupError('');
                    }}
                    className={inputClass('name')}
                  />
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>NID or passport · PDF, JPG or PNG · maximum 10 MB. Only admins can view it.</p>
                </div>
              )}

              {/* Password */}
              <div>
                <label htmlFor="signup-password" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Password *</label>
                <div className="relative">
                  <input id="signup-password" name="new-password" autoComplete="new-password" type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    placeholder="Create a strong password" className={`${inputClass('password')} pr-11`} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'signup-password-error' : undefined} />
                  <button type="button" aria-label={showPass ? 'Hide password' : 'Show password'} aria-pressed={showPass} onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
                {fieldErrors.password && <p id="signup-password-error" role="alert" className="text-xs mt-1 text-red-600 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="signup-confirm" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Confirm Password *</label>
                <div className="relative">
                  <input id="signup-confirm" name="confirm-password" autoComplete="new-password" type={showConfirm ? 'text' : 'password'} value={form.confirm}
                    onChange={e => setField('confirm', e.target.value)}
                    placeholder="Re-enter your password" className={`${inputClass('confirm')} pr-11`} aria-invalid={Boolean(fieldErrors.confirm)} aria-describedby={fieldErrors.confirm ? 'signup-confirm-error' : undefined} />
                  <button type="button" aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={showConfirm} onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                  {form.confirm && form.confirm === form.password && (
                    <CheckCircle size={15} className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {fieldErrors.confirm && <p id="signup-confirm-error" role="alert" className="text-xs mt-1 text-red-600 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.confirm}</p>}
                {form.confirm && form.password && form.confirm === form.password && !fieldErrors.confirm && (
                  <p className="text-xs mt-1 text-green-600 flex items-center gap-1"><CheckCircle size={11} /> Passwords match</p>
                )}
              </div>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.terms} onChange={event => setField('terms', event.target.checked)}
                    aria-invalid={Boolean(fieldErrors.terms)} aria-describedby={fieldErrors.terms ? 'signup-terms-error' : undefined}
                    className="mt-1 h-4 w-4 accent-[#006A4E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" />
                  <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                    I agree to the{' '}
                    <a href="#" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>Terms & Conditions</a>
                    {' '}and{' '}
                    <a href="#" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>Privacy Policy</a>
                  </span>
                </label>
                {fieldErrors.terms && <p id="signup-terms-error" role="alert" className="text-xs mt-1 text-red-600 flex items-center gap-1 ml-8"><AlertCircle size={11} />{fieldErrors.terms}</p>}
              </div>
            </div>

            {signupError && (
              <p role="alert" aria-live="assertive" className="text-sm text-red-600 flex items-center gap-1.5 mt-4">
                <AlertCircle size={14} /> {signupError}
              </p>
            )}
            <button type="submit" disabled={loading} aria-busy={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white mt-6 transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: selectedRole.color }}>
              {loading
                ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span className="sr-only">Creating your account…</span></>
                : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>
        )}

        {step < 2 && (
          <p className="text-center text-sm mt-5" style={{ color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
