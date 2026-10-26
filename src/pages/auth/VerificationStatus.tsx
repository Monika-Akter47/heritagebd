import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, ArrowRight, MessageCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { vendorApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';

type Status = 'pending' | 'approved' | 'rejected';

export default function VerificationStatus() {
  const { currentUser } = useApp();
  const role = currentUser?.role === 'guide' ? 'guide' : 'vendor';
  const isGuide = role === 'guide';
  const { data: profile, loading, error, refetch } = useApiData<any | null>(
    () => !isGuide ? vendorApi.profile() : Promise.resolve(null),
    null,
    [currentUser?.id],
  );

  useEffect(() => {
    if (isGuide) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) void refetch();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [isGuide, refetch]);

  const profileStatus = profile?.verificationStatus;
  const status: Status = profileStatus === 'verified' || (!profileStatus && currentUser?.verified)
    ? 'approved'
    : profileStatus === 'rejected' || (!profileStatus && currentUser?.status === 'suspended')
      ? 'rejected'
      : 'pending';

  const configs = {
    pending: {
      icon: <Clock size={40} style={{ color: '#D97706' }} />,
      bg: '#FFFBEB',
      border: '#FCD34D',
      title: 'Application Under Review',
      subtitle: isGuide ? 'Your guide application is being verified' : 'Your vendor application is being verified',
      badge: { color: '#D97706', bg: '#FEF3C7', label: 'Pending Review' },
      steps: [
        { done: true, label: 'Application submitted' },
        { done: true, label: 'Documents received' },
        { done: false, label: 'Identity verification', active: true },
        { done: false, label: isGuide ? 'Guide certification check' : 'Business registration check' },
        { done: false, label: 'Final approval' },
      ],
    },
    approved: {
      icon: <CheckCircle size={40} style={{ color: '#059669' }} />,
      bg: '#E6F4EF',
      border: '#6EE7B7',
      title: 'Congratulations! You\'re Verified',
      subtitle: isGuide ? 'You can now accept tour bookings on HeritageBD' : 'Your shop is now live on HeritageBD Marketplace',
      badge: { color: '#059669', bg: '#D1FAE5', label: 'Verified ✓' },
      steps: [],
    },
    rejected: {
      icon: <XCircle size={40} style={{ color: '#DC2626' }} />,
      bg: '#FEF2F2',
      border: '#FECACA',
      title: 'Application Not Approved',
      subtitle: 'Your application did not meet our verification requirements',
      badge: { color: '#DC2626', bg: '#FEE2E2', label: 'Not Approved' },
      steps: [],
    },
  };

  const cfg = configs[status];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[var(--color-text-muted)]">Loading your latest verification status…</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p role="alert" className="text-sm text-red-700">Could not load your latest verification status: {error}</p>
        <button type="button" onClick={() => void refetch()} className="rounded-xl bg-[#006A4E] px-4 py-2 text-sm font-semibold text-white">Try again</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
              Heritage<span style={{ color: 'var(--color-primary)' }}>BD</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
          {/* Header */}
          <div className="px-8 py-8 text-center" style={{ background: cfg.bg, borderBottom: `2px solid ${cfg.border}` }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'white' }}>
              {cfg.icon}
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ background: cfg.badge.bg, color: cfg.badge.color }}>
              {cfg.badge.label}
            </span>
            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
              {cfg.title}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{cfg.subtitle}</p>
          </div>

          <div className="px-8 py-6">
            {/* Pending: Progress steps */}
            {status === 'pending' && (
              <>
                <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--color-text)' }}>Verification Progress</h3>
                <div className="space-y-3 mb-6">
                  {cfg.steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={s.done
                          ? { background: 'var(--color-primary)', color: 'white' }
                          : s.active
                          ? { background: '#FEF3C7', color: '#D97706', border: '2px solid #D97706' }
                          : { background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                        {s.done ? '✓' : s.active ? '…' : i + 1}
                      </div>
                      <span className="text-sm" style={{
                        color: s.done ? 'var(--color-text)' : s.active ? '#D97706' : 'var(--color-text-muted)',
                        fontWeight: s.active ? 600 : 400
                      }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl text-sm mb-4" style={{ background: '#FFFBEB', color: '#92400E' }}>
                  <p className="font-semibold mb-1">⏳ Expected timeline: 3–7 business days</p>
                  <p>You will receive an email and SMS notification once your verification is complete. You can also check back here anytime.</p>
                </div>
              </>
            )}

            {/* Approved */}
            {status === 'approved' && (
              <>
                <div className="space-y-3 mb-6">
                  {(isGuide ? [
                    { icon: '🧭', label: 'Verified Guide Badge', desc: 'Visible on your profile and search results' },
                    { icon: '📅', label: 'Accept Bookings', desc: 'Tourists can now book you directly' },
                    { icon: '💬', label: 'In-app Chat', desc: 'Message tourists who book you' },
                    { icon: '💰', label: 'Earnings', desc: 'Receive payments directly to your bKash/bank' },
                  ] : [
                    { icon: '🏪', label: 'Shop is Live', desc: 'Visible on the HeritageBD Marketplace' },
                    { icon: '📦', label: 'Add Products', desc: 'Start listing your heritage crafts and goods' },
                    { icon: '🛒', label: 'Pre-Order Ready', desc: 'Enable "Ready to Pick" for your products' },
                    { icon: '💰', label: 'Receive Payments', desc: 'bKash, Nagad, and bank transfers supported' },
                  ]).map(item => (
                    <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{item.label}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to={isGuide ? '/guide-dashboard' : '/vendor'}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--color-primary)' }}>
                  Go to {isGuide ? 'Guide' : 'Vendor'} Dashboard <ArrowRight size={16} />
                </Link>
              </>
            )}

            {/* Rejected */}
            {status === 'rejected' && (
              <>
                <div className="p-4 rounded-xl mb-5" style={{ background: '#FEF2F2', borderLeft: '4px solid #DC2626' }}>
                  <p className="font-semibold text-sm mb-1" style={{ color: '#DC2626' }}>Reason for rejection:</p>
                  <p className="text-sm" style={{ color: '#7F1D1D' }}>
                    The submitted NID document was unclear or did not match the information provided. Please resubmit with a clear, legible copy.
                  </p>
                </div>
                <div className="space-y-3 mb-6">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>You can:</p>
                  <Link to={isGuide ? '/onboarding/guide' : '/onboarding/vendor'}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: 'var(--color-border)' }}>
                    <RefreshCw size={18} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Resubmit application</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Fix the issues and apply again</p>
                    </div>
                    <ArrowRight size={15} className="ml-auto" style={{ color: 'var(--color-text-muted)' }} />
                  </Link>
                  <a href="mailto:support@heritagebd.com"
                    className="flex items-center gap-3 p-4 rounded-xl border-2 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: 'var(--color-border)' }}>
                    <MessageCircle size={18} style={{ color: '#7C3AED' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Contact support</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>support@heritagebd.com</p>
                    </div>
                    <ArrowRight size={15} className="ml-auto" style={{ color: 'var(--color-text-muted)' }} />
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
