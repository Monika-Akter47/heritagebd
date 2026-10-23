import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, ShoppingCart, Bell, User, Search, Map, ChevronDown, LogOut,
  LayoutDashboard, Store, Compass, Calendar, BookOpen, Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const navLinks = [
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'Places', href: '/places', icon: Map },
  { label: 'Shop', href: '/shop', icon: Store },
  { label: 'Guides', href: '/guides', icon: Users },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Stories', href: '/stories', icon: BookOpen },
  { label: 'Map', href: '/map', icon: Map },
];

export default function Navbar() {
  const { currentUser, userRole, cartCount, unreadCount, notifications, logout, markNotificationRead } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDashboardPath = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'vendor') return '/vendor';
    if (userRole === 'guide') return '/guide-dashboard';
    return '/profile';
  };

  return (
    <>
      <nav aria-label="Main navigation" className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#006A4E] flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-lg text-[var(--color-text)] hidden sm:block" style={{ fontFamily: 'Fraunces, serif' }}>
                Heritage<span className="text-[#006A4E]">BD</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.href
                      ? 'bg-[#006A4E]/10 text-[#006A4E]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label={searchOpen ? 'Close search' : 'Open search'}
                aria-expanded={searchOpen}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-gray-100 transition-colors"
              >
                <Search size={18} />
              </button>

              {/* Notifications */}
              {currentUser && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                    aria-expanded={notifOpen}
                    className="relative p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-gray-100 transition-colors"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-[#F42A41] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-[var(--color-border)]">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.slice(0, 5).map(n => (
                          <Link key={n.id} to={n.link || '#'} onClick={() => {
                            markNotificationRead(n.id);
                            setNotifOpen(false);
                          }} className={`block px-4 py-3 border-b border-[var(--color-border-light)] hover:bg-gray-50 ${!n.read ? 'bg-[#006A4E]/5' : ''}`}>
                            <p className="text-sm font-medium text-[var(--color-text)]">{n.title}</p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{n.message}</p>
                          </Link>
                        ))}
                        {notifications.length === 0 && (
                          <p className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">You're all caught up. No notifications yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cart */}
              <Link to="/cart" aria-label={`Shopping cart${cartCount ? `, ${cartCount} items` : ', empty'}`} className="relative p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-gray-100 transition-colors">
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#006A4E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Profile / Auth */}
              {currentUser ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    aria-label="Open account menu"
                    aria-expanded={profileOpen}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-[#006A4E]/10">
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#006A4E] font-bold text-xs">
                          {currentUser.name[0]}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium hidden md:block max-w-[100px] truncate">{currentUser.name}</span>
                    <ChevronDown size={14} className="hidden md:block text-[var(--color-text-muted)]" />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-[var(--color-border)]">
                        <p className="font-semibold text-sm">{currentUser.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)] capitalize">{userRole}</p>
                      </div>
                      <Link to={getDashboardPath()} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm transition-colors">
                        <LayoutDashboard size={15} />
                        Dashboard
                      </Link>
                      <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm text-[#F42A41] w-full transition-colors"
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    Sign In
                  </Link>
                  <Link to="/signup" className="bg-[#006A4E] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#004D38] transition-colors">
                    Join Free
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileOpen}
                className="lg:hidden p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-gray-100 transition-colors"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Search bar overlay */}
          {searchOpen && (
            <div className="pb-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search heritage places, products, guides..."
                  className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006A4E]/30"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      navigate(`/explore?q=${(e.target as HTMLInputElement).value}`);
                      setSearchOpen(false);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[var(--color-border)] bg-white">
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === link.href
                      ? 'bg-[#006A4E]/10 text-[#006A4E]'
                      : 'text-[var(--color-text)] hover:bg-gray-100'
                  }`}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              ))}
              {!currentUser && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                  <Link to="/login" className="flex-1 text-center py-2.5 border-2 border-[#006A4E] text-[#006A4E] rounded-xl text-sm font-semibold">Sign In</Link>
                  <Link to="/signup" className="flex-1 text-center py-2.5 bg-[#006A4E] text-white rounded-xl text-sm font-semibold">Join Free</Link>
                </div>
              )}
              {currentUser && (
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#006A4E]/10">
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#006A4E] font-bold">
                          {currentUser.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{currentUser.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] capitalize">{userRole}</p>
                    </div>
                  </div>
                  <button onClick={logout} className="w-full text-left flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-[#F42A41] hover:bg-red-50 transition-colors">
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

    </>
  );
}
