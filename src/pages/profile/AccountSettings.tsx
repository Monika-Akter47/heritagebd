import React, { useState } from 'react';
import { authApi, profileImagesApi } from '../../services/api';
import { Shield, Bell, Eye, Lock, Smartphone, LogOut, ChevronRight, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ProfileImagePicker from '../../components/ui/ProfileImagePicker';

type Tab = 'security' | 'privacy' | 'notifications';

const SESSIONS = [
  { device: 'Chrome on Windows', location: 'Dhaka, Bangladesh', time: 'Active now', current: true },
  { device: 'Safari on iPhone 14', location: 'Dhaka, Bangladesh', time: '2 hours ago', current: false },
  { device: 'Firefox on macOS', location: 'Sylhet, Bangladesh', time: '3 days ago', current: false },
];

const NOTIFICATION_SETTINGS = [
  {
    category: 'Bookings & Orders',
    items: [
      { label: 'New booking confirmation', email: true, push: true, sms: true },
      { label: 'Booking reminder (24h before)', email: true, push: true, sms: false },
      { label: 'Order status updates', email: true, push: true, sms: true },
    ],
  },
  {
    category: 'Messages',
    items: [
      { label: 'New message from guide/vendor', email: false, push: true, sms: false },
      { label: 'Unread message reminder', email: true, push: false, sms: false },
    ],
  },
  {
    category: 'Promotions & Offers',
    items: [
      { label: 'Special offers and discounts', email: true, push: false, sms: false },
      { label: 'New destinations near you', email: false, push: true, sms: false },
      { label: 'Weekly heritage digest', email: true, push: false, sms: false },
    ],
  },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
      style={{ background: on ? 'var(--color-primary)' : 'var(--color-border)' }}>
      <span className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: on ? 'translateX(22px)' : 'translateX(4px)' }} />
    </button>
  );
}

function SettingRow({ label, desc, on, onToggle }: { label: string; desc?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-start justify-between py-3.5 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>}
      </div>
      <Toggle on={on} onChange={onToggle} />
    </div>
  );
}

export default function AccountSettings() {
  const { currentUser, updateCurrentUser } = useApp();
  const [tab, setTab] = useState<Tab>('security');
  const [twoFa, setTwoFa] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [showPwForm, setShowPwForm] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoBusy, setProfilePhotoBusy] = useState(false);
  const [profilePhotoMessage, setProfilePhotoMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveProfilePhoto() {
    if (!profilePhotoFile) {
      setProfilePhotoMessage({ ok: false, text: 'Choose a photo before saving.' });
      return;
    }
    setProfilePhotoBusy(true);
    setProfilePhotoMessage(null);
    try {
      const { url } = await profileImagesApi.upload(profilePhotoFile);
      const { user } = await authApi.updateMe({ avatar: url });
      updateCurrentUser(user);
      setProfilePhotoFile(null);
      setProfilePhotoMessage({ ok: true, text: 'Profile photo updated successfully.' });
    } catch (error) {
      setProfilePhotoMessage({
        ok: false,
        text: error instanceof Error ? error.message : 'Could not update your profile photo.',
      });
    } finally {
      setProfilePhotoBusy(false);
    }
  }

  async function submitPassword() {
    if (pw.next.length < 8) return setPwMsg({ ok: false, text: 'New password must be at least 8 characters.' });
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: 'New passwords do not match.' });
    setPwBusy(true); setPwMsg(null);
    try {
      await authApi.changePassword(pw.current, pw.next);
      setPwMsg({ ok: true, text: 'Password updated. Your other devices have been signed out.' });
      setPw({ current: '', next: '', confirm: '' });
    } catch (e: any) {
      setPwMsg({ ok: false, text: e?.message || 'Could not update your password.' });
    } finally {
      setPwBusy(false);
    }
  }

  const [notifs, setNotifs] = useState(NOTIFICATION_SETTINGS.map(c => ({
    ...c,
    items: c.items.map(i => ({ ...i })),
  })));

  function toggleNotif(ci: number, ii: number, channel: 'email' | 'push' | 'sms') {
    setNotifs(prev => prev.map((c, ci2) => ci2 !== ci ? c : {
      ...c,
      items: c.items.map((item, ii2) => ii2 !== ii ? item : { ...item, [channel]: !item[channel] }),
    }));
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'security', label: 'Security', icon: <Shield size={15} /> },
    { id: 'privacy', label: 'Privacy', icon: <Eye size={15} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  ];

  const inputCls = "w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white"
    + " border-[var(--color-border)] focus:border-[var(--color-primary)]";

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>
          Account Settings
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>Manage your security, privacy, and notification preferences</p>

        {(currentUser?.role === 'vendor' || currentUser?.role === 'guide') && (
          <section aria-labelledby="profile-photo-heading" className="mb-6 rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
            <h2 id="profile-photo-heading" className="mb-4 font-bold text-sm" style={{ color: 'var(--color-text)' }}>Profile Photo</h2>
            <ProfileImagePicker currentUrl={currentUser.avatar} onFileSelected={file => {
              setProfilePhotoFile(file);
              setProfilePhotoMessage(null);
            }} accentColor={currentUser.role === 'guide' ? '#7C3AED' : '#006A4E'} />
            {profilePhotoMessage && (
              <p role={profilePhotoMessage.ok ? 'status' : 'alert'} className={`mt-3 text-sm ${profilePhotoMessage.ok ? 'text-green-700' : 'text-red-700'}`}>
                {profilePhotoMessage.text}
              </p>
            )}
            <button type="button" onClick={saveProfilePhoto} disabled={profilePhotoBusy || !profilePhotoFile}
              className="mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: currentUser.role === 'guide' ? '#6D28D9' : 'var(--color-primary)' }}>
              {profilePhotoBusy ? 'Saving photo…' : 'Save profile photo'}
            </button>
          </section>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 p-1.5 rounded-2xl mb-6" style={{ background: 'var(--color-surface-2)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={tab === t.id
                ? { background: 'white', color: 'var(--color-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                : { color: 'var(--color-text-muted)' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Security tab */}
        {tab === 'security' && (
          <div className="space-y-4">
            {/* Change password */}
            <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock size={16} style={{ color: 'var(--color-primary)' }} />
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Password</h3>
                </div>
                <button onClick={() => setShowPwForm(p => !p)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ color: 'var(--color-primary)', background: '#E6F4EF' }}>
                  {showPwForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>
              {showPwForm ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Current Password</label>
                    <input type="password" placeholder="••••••••" className={inputCls} value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>New Password</label>
                    <input type="password" placeholder="••••••••" className={inputCls} value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Confirm New Password</label>
                    <input type="password" placeholder="••••••••" className={inputCls} value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} />
                  </div>
                  {pwMsg && <p className={`text-xs ${pwMsg.ok ? 'text-green-700' : 'text-red-600'}`}>{pwMsg.text}</p>}
                  <button onClick={submitPassword} disabled={pwBusy} className="w-full py-3 rounded-xl font-bold text-white text-sm mt-1 hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'var(--color-primary)' }}>
                    {pwBusy ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Last changed: <strong style={{ color: 'var(--color-text)' }}>March 15, 2025</strong>
                </p>
              )}
            </div>

            {/* 2FA */}
            <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Smartphone size={16} style={{ color: 'var(--color-primary)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Two-Factor Authentication</h3>
              </div>
              <SettingRow
                label="Enable 2FA via SMS"
                desc={twoFa ? 'Your account is protected with SMS verification on each login.' : 'Add an extra layer of security to your account.'}
                on={twoFa}
                onToggle={() => setTwoFa(p => !p)}
              />
            </div>

            {/* Active sessions */}
            <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--color-text)' }}>Active Sessions</h3>
              <div className="space-y-3">
                {SESSIONS.map((s, i) => (
                  <div key={i} className="flex items-start justify-between p-3 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                        {s.device}
                        {s.current && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#D1FAE5', color: '#059669' }}>Current</span>}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{s.location} · {s.time}</p>
                    </div>
                    {!s.current && (
                      <button className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                        <X size={13} /> Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button className="mt-4 text-sm text-red-500 hover:text-red-700 font-semibold flex items-center gap-2">
                <LogOut size={14} /> Sign out of all other sessions
              </button>
            </div>
          </div>
        )}

        {/* Privacy tab */}
        {tab === 'privacy' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--color-text)' }}>Location & Visibility</h3>
              <SettingRow label="Share my location" desc="Allow HeritageBD to show guides and vendors near you" on={locationSharing} onToggle={() => setLocationSharing(p => !p)} />
              <SettingRow label="Public profile" desc="Allow other users to see your profile and reviews" on={profilePublic} onToggle={() => setProfilePublic(p => !p)} />
              <SettingRow label="Show activity status" desc="Let guides and vendors see when you were last active" on={showActivity} onToggle={() => setShowActivity(p => !p)} />
            </div>

            <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--color-text)' }}>Data & Privacy</h3>
              {[
                { label: 'Download my data', desc: 'Get a copy of all data HeritageBD holds about you', action: 'Request' },
                { label: 'Delete my account', desc: 'Permanently delete your account and all associated data', action: 'Delete', danger: true },
              ].map(item => (
                <div key={item.label} className="flex items-start justify-between py-3.5 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: item.danger ? '#DC2626' : 'var(--color-text)' }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{item.desc}</p>
                  </div>
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 ml-4"
                    style={item.danger
                      ? { background: '#FEE2E2', color: '#DC2626' }
                      : { background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications tab */}
        {tab === 'notifications' && (
          <div className="space-y-4">
            {notifs.map((cat, ci) => (
              <div key={cat.category} className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                  <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{cat.category}</h3>
                  <div className="ml-auto flex gap-4 text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="w-10 text-center">Email</span>
                    <span className="w-10 text-center">Push</span>
                    <span className="w-10 text-center">SMS</span>
                  </div>
                </div>
                {cat.items.map((item, ii) => (
                  <div key={item.label} className="px-5 py-3.5 flex items-center border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>{item.label}</p>
                    <div className="flex gap-4">
                      {(['email', 'push', 'sms'] as const).map(ch => (
                        <div key={ch} className="w-10 flex justify-center">
                          <button onClick={() => toggleNotif(ci, ii, ch)}
                            className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all"
                            style={item[ch]
                              ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
                              : { borderColor: 'var(--color-border)' }}>
                            {item[ch] && <Check size={13} className="text-white" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
