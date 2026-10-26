import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { authApi } from '../../services/api';

type Step = 'request' | 'otp' | 'reset' | 'success';

function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  return (
    <div className="flex justify-center gap-2.5">
      {value.map((v, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }} type="text" inputMode="numeric"
          maxLength={1} value={v}
          onChange={e => {
            const ch = e.target.value.replace(/\D/, '');
            const next = [...value]; next[i] = ch; onChange(next);
            if (ch && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={e => { if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus(); }}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-colors"
          style={{ borderColor: v ? 'var(--color-primary)' : 'var(--color-border)', background: v ? '#E6F4EF' : 'white' }}
        />
      ))}
    </div>
  );
}

function getStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('request');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (step !== 'otp' || otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [step, otpTimer]);

  async function handleSend() {
    if (!contact) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(contact);
      setStep('otp');
      setOtpTimer(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request a password reset.');
    } finally {
      setLoading(false);
    }
  }

  function handleVerify() {
    const code = otp.join('');
    if (code.length < 6) { setOtpError('Please enter the complete 6-digit code.'); return; }
    setOtpError('');
    setStep('reset');
  }

  async function handleReset() {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter the complete 6-digit verification code.'); return; }
    if (!password) { setError('Enter a new password.'); return; }
    if (getStrength(password) < 3) { setError('Password is too weak.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(contact, code, password);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  }

  const strength = getStrength(password);
  const strengthColors = ['', '#DC2626', '#F97316', '#EAB308', '#16A34A', '#15803D'];
  const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
              <span className="text-white font-bold">H</span>
            </div>
            <span className="font-bold text-xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
              Heritage<span style={{ color: 'var(--color-primary)' }}>BD</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: 'var(--color-border)' }}>
          {/* ── Step: request ── */}
          {step === 'request' && (
            <>
              <Link to="/login" className="flex items-center gap-1.5 text-sm mb-5 hover:underline" style={{ color: 'var(--color-text-muted)' }}>
                <ArrowLeft size={15} /> Back to Sign In
              </Link>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#E6F4EF' }}>
                <Mail size={26} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
                Forgot your password?
              </h2>
              <p className="text-sm text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
                Enter your registered email address and we will send you a verification code.
              </p>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Email address</label>
              <input type="email" value={contact} onChange={e => { setContact(e.target.value); setError(''); }}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border-2 outline-none text-sm mb-1 bg-white"
                style={{ borderColor: error ? '#DC2626' : 'var(--color-border)' }}
                onFocus={e => { if (!error) e.target.style.borderColor = 'var(--color-primary)'; }}
                onBlur={e => { if (!error) e.target.style.borderColor = 'var(--color-border)'; }}
              />
              {error && <p className="text-xs text-red-600 flex items-center gap-1 mb-3"><AlertCircle size={11} />{error}</p>}
              <button onClick={handleSend} disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white mt-4 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--color-primary)' }}>
                {loading ? <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send Verification Code'}
              </button>
            </>
          )}

          {/* ── Step: OTP ── */}
          {step === 'otp' && (
            <>
              <button onClick={() => setStep('request')} className="flex items-center gap-1.5 text-sm mb-5 hover:underline" style={{ color: 'var(--color-text-muted)' }}>
                <ArrowLeft size={15} /> Back
              </button>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">📱</div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>Enter verification code</h2>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  We sent a 6-digit code to <strong style={{ color: 'var(--color-text)' }}>{contact}</strong>
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Enter the code sent to your email. It expires after 15 minutes.
                </p>
              </div>
              <OtpInput value={otp} onChange={setOtp} />
              {otpError && <p className="text-sm text-red-600 flex items-center justify-center gap-1.5 mt-3"><AlertCircle size={14} />{otpError}</p>}
              <button onClick={handleVerify}
                className="w-full py-3.5 rounded-xl font-bold text-white mt-5 transition-all hover:opacity-90"
                style={{ background: 'var(--color-primary)' }}>
                Verify Code
              </button>
              <div className="text-center mt-4 text-sm">
                {otpTimer > 0
                  ? <span style={{ color: 'var(--color-text-muted)' }}>Resend in {String(Math.floor(otpTimer / 60)).padStart(2,'0')}:{String(otpTimer % 60).padStart(2,'0')}</span>
                  : <button onClick={() => { setOtp(Array(6).fill('')); handleSend(); }} className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>Resend Code</button>}
              </div>
            </>
          )}

          {/* ── Step: reset ── */}
          {step === 'reset' && (
            <>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>Create new password</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>Your new password must be different from previous passwords.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>New Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Create a strong password"
                      className="w-full px-4 py-3 pr-11 rounded-xl border-2 outline-none text-sm bg-white"
                      style={{ borderColor: 'var(--color-border)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; }}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                            style={{ background: i <= strength ? strengthColors[strength] : 'var(--color-border)' }} />
                        ))}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Confirm New Password</label>
                  <div className="relative">
                    <input type={showCf ? 'text' : 'password'} value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-3 pr-11 rounded-xl border-2 outline-none text-sm bg-white"
                      style={{ borderColor: 'var(--color-border)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; }}
                    />
                    <button type="button" onClick={() => setShowCf(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                      {showCf ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                    {confirm && confirm === password && (
                      <CheckCircle size={15} className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                  {confirm && confirm === password && (
                    <p className="text-xs mt-1 text-green-600 flex items-center gap-1"><CheckCircle size={11} /> Passwords match</p>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-red-600 flex items-center gap-1.5 mt-3"><AlertCircle size={14} />{error}</p>}

              {error && <p className="text-sm text-red-600 flex items-center gap-1.5 mt-3"><AlertCircle size={14} />{error}</p>}

              <button onClick={handleReset} disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white mt-5 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--color-primary)' }}>
                {loading ? <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Reset Password'}
              </button>
            </>
          )}

          {/* ── Step: success ── */}
          {step === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#E6F4EF' }}>
                <CheckCircle size={36} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>Password changed!</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                Your password has been successfully changed. You can now sign in with your new password.
              </p>
              <button onClick={() => navigate('/login?reset=1')}
                className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--color-primary)' }}>
                Return to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
