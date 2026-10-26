import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';

export default function SessionExpired() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm w-full text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
            Heritage<span style={{ color: 'var(--color-primary)' }}>BD</span>
          </span>
        </Link>

        <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: 'var(--color-border)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#FFFBEB' }}>
            <Clock size={40} style={{ color: '#D97706' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
            Session Expired
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            For your security, you have been signed out after a period of inactivity. Please sign in again to continue.
          </p>
          <button onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: 'var(--color-primary)' }}>
            Sign In Again <ArrowRight size={16} />
          </button>
          <Link to="/" className="block mt-4 text-sm hover:underline" style={{ color: 'var(--color-text-muted)' }}>
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
