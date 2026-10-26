import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldOff, MessageCircle, ArrowRight } from 'lucide-react';

export default function AccountSuspended() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-md w-full">
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
          <div className="px-8 py-8 text-center" style={{ background: '#FEF2F2', borderBottom: '2px solid #FECACA' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-white">
              <ShieldOff size={38} style={{ color: '#DC2626' }} />
            </div>
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              Account Suspended
            </span>
            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
              Your account has been suspended
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Access to HeritageBD has been temporarily restricted
            </p>
          </div>

          <div className="px-8 py-6">
            <div className="p-4 rounded-xl mb-5" style={{ background: '#FEF2F2', borderLeft: '4px solid #DC2626' }}>
              <p className="font-semibold text-sm mb-1" style={{ color: '#DC2626' }}>Reason for suspension:</p>
              <p className="text-sm" style={{ color: '#7F1D1D' }}>
                Your account was suspended due to a violation of our community guidelines regarding misleading product listings.
              </p>
              <p className="text-xs mt-2" style={{ color: '#B91C1C' }}>
                Suspension issued: 25 August 2026
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>What you can do:</p>
              <a href="mailto:appeals@heritagebd.com"
                className="flex items-center gap-3 p-4 rounded-xl border-2 hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'var(--color-border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#E6F4EF' }}>
                  <ArrowRight size={16} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Submit an appeal</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>appeals@heritagebd.com · We respond within 48 hours</p>
                </div>
              </a>
              <a href="mailto:support@heritagebd.com"
                className="flex items-center gap-3 p-4 rounded-xl border-2 hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'var(--color-border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F5F3FF' }}>
                  <MessageCircle size={16} style={{ color: '#7C3AED' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Contact support</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>support@heritagebd.com</p>
                </div>
              </a>
            </div>

            <div className="text-center pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <Link to="/login" className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Sign in with a different account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
