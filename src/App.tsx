import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Landing is the entry page, so it stays in the main bundle; every other page is
// split into its own chunk and fetched on first visit.
import Landing from './pages/Landing';
const Explore = lazy(() => import('./pages/Explore'));
const Places = lazy(() => import('./pages/Places'));
const PlaceDetail = lazy(() => import('./pages/PlaceDetail'));
const MapPage = lazy(() => import('./pages/MapPage'));

const GuideListing = lazy(() => import('./pages/guides/GuideListing'));
const GuideProfile = lazy(() => import('./pages/guides/GuideProfile'));

const Shop = lazy(() => import('./pages/marketplace/Shop'));
const ProductDetail = lazy(() => import('./pages/marketplace/ProductDetail'));
const Cart = lazy(() => import('./pages/marketplace/Cart'));
const Checkout = lazy(() => import('./pages/marketplace/Checkout'));
const OrderTracking = lazy(() => import('./pages/marketplace/OrderTracking'));

const Events = lazy(() => import('./pages/events/Events'));
const EventDetail = lazy(() => import('./pages/events/EventDetail'));
const Stories = lazy(() => import('./pages/stories/Stories'));
const StoryDetail = lazy(() => import('./pages/stories/StoryDetail'));

const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const VendorOnboarding = lazy(() => import('./pages/auth/VendorOnboarding'));
const GuideOnboarding = lazy(() => import('./pages/auth/GuideOnboarding'));
const VerificationStatus = lazy(() => import('./pages/auth/VerificationStatus'));
const AccountSuspended = lazy(() => import('./pages/auth/AccountSuspended'));
const SessionExpired = lazy(() => import('./pages/auth/SessionExpired'));
const AccountSettings = lazy(() => import('./pages/profile/AccountSettings'));

const TripPlanner = lazy(() => import('./pages/planner/TripPlanner'));
const TouristProfile = lazy(() => import('./pages/profile/TouristProfile'));
const GuideDashboard = lazy(() => import('./pages/guide/GuideDashboard'));
const TourPlanner = lazy(() => import('./pages/guide/TourPlanner'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const GuideVerification = lazy(() => import('./pages/admin/GuideVerification'));
const ChatInterface = lazy(() => import('./pages/chat/ChatInterface'));
const PreOrderCheckout = lazy(() => import('./pages/preorder/PreOrderCheckout'));
const PreOrderTracking = lazy(() => import('./pages/preorder/PreOrderTracking'));
const PreOrderQR = lazy(() => import('./pages/preorder/PreOrderQR'));
import { useApp } from './context/AppContext';
import LoadingSpinner from './components/ui/LoadingSpinner';
import type { User } from './types';

// Pages that don't use the standard layout (full-screen)
const FULL_SCREEN_PATHS = ['/login', '/signup'];

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

function FullLayout({ children }: { children: React.ReactNode }) {
  return <main>{children}</main>;
}

function ApiActionNotice() {
  const { actionError, clearActionError } = useApp();
  if (!actionError) return null;
  return (
    <div role="alert" aria-live="assertive" className="fixed bottom-4 left-4 right-4 z-[100] mx-auto flex max-w-xl items-start justify-between gap-4 rounded-xl border border-red-300 bg-white p-4 text-sm text-red-800 shadow-xl">
      <p>{actionError}</p>
      <button type="button" onClick={clearActionError} aria-label="Dismiss error message" className="shrink-0 rounded px-2 font-bold text-red-800 hover:bg-red-50 focus-visible:outline">
        Dismiss
      </button>
    </div>
  );
}

function RequireRole({ children, roles }: { children: React.ReactNode; roles: User['role'][] }) {
  const { currentUser, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }
  if (!currentUser) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!roles.includes(currentUser.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ApiActionNotice />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth - no nav/footer */}
      <Route path="/login" element={<FullLayout><Login /></FullLayout>} />
      <Route path="/signup" element={<FullLayout><Signup /></FullLayout>} />
      <Route path="/forgot-password" element={<FullLayout><ForgotPassword /></FullLayout>} />
      <Route path="/onboarding/vendor" element={<FullLayout><RequireRole roles={['vendor']}><VendorOnboarding /></RequireRole></FullLayout>} />
      <Route path="/onboarding/guide" element={<FullLayout><RequireRole roles={['guide']}><GuideOnboarding /></RequireRole></FullLayout>} />
      <Route path="/vendor/verification-status" element={<FullLayout><RequireRole roles={['vendor']}><VerificationStatus /></RequireRole></FullLayout>} />
      <Route path="/guide/verification-status" element={<FullLayout><RequireRole roles={['guide']}><VerificationStatus /></RequireRole></FullLayout>} />
      <Route path="/suspended" element={<FullLayout><AccountSuspended /></FullLayout>} />
      <Route path="/session-expired" element={<FullLayout><SessionExpired /></FullLayout>} />

      {/* Map - full height, no standard footer */}
      <Route path="/map" element={<><Navbar /><MapPage /></>} />

      {/* Chat - full height */}
      <Route path="/chat" element={<RequireRole roles={['tourist', 'guide', 'vendor', 'admin']}><Navbar /><ChatInterface /></RequireRole>} />

      {/* Admin - full height with sidebar */}
      <Route path="/admin" element={<RequireRole roles={['admin']}><Navbar /><AdminDashboard /></RequireRole>} />
      <Route path="/admin/guides" element={<RequireRole roles={['admin']}><Navbar /><GuideVerification /></RequireRole>} />

      {/* Pre-order flows - no standard footer */}
      <Route path="/preorder/checkout" element={<FullLayout><RequireRole roles={['tourist']}><PreOrderCheckout /></RequireRole></FullLayout>} />
      <Route path="/preorder/tracking/:orderId" element={<FullLayout><RequireRole roles={['tourist', 'vendor', 'admin']}><PreOrderTracking /></RequireRole></FullLayout>} />
      <Route path="/preorder/qr/:orderId" element={<FullLayout><RequireRole roles={['tourist', 'vendor', 'admin']}><PreOrderQR /></RequireRole></FullLayout>} />

      {/* Standard layout pages */}
      <Route path="/" element={<Layout><Landing /></Layout>} />
      <Route path="/explore" element={<Layout><Explore /></Layout>} />
      <Route path="/places" element={<Layout><Places /></Layout>} />
      <Route path="/places/:id" element={<Layout><PlaceDetail /></Layout>} />
      <Route path="/guides" element={<Layout><GuideListing /></Layout>} />
      <Route path="/guides/:id" element={<Layout><GuideProfile /></Layout>} />
      <Route path="/shop" element={<Layout><Shop /></Layout>} />
      <Route path="/shop/:id" element={<Layout><ProductDetail /></Layout>} />
      <Route path="/cart" element={<Layout><Cart /></Layout>} />
      <Route path="/checkout" element={<Layout><RequireRole roles={['tourist']}><Checkout /></RequireRole></Layout>} />
      <Route path="/order-tracking" element={<Layout><RequireRole roles={['tourist', 'vendor', 'admin']}><OrderTracking /></RequireRole></Layout>} />
      <Route path="/events" element={<Layout><Events /></Layout>} />
      <Route path="/events/:id" element={<Layout><EventDetail /></Layout>} />
      <Route path="/stories" element={<Layout><Stories /></Layout>} />
      <Route path="/stories/:id" element={<Layout><StoryDetail /></Layout>} />
      <Route path="/planner" element={<Layout><RequireRole roles={['tourist']}><TripPlanner /></RequireRole></Layout>} />
      <Route path="/profile" element={<Layout><RequireRole roles={['tourist']}><TouristProfile /></RequireRole></Layout>} />
      <Route path="/settings" element={<Layout><RequireRole roles={['tourist', 'guide', 'vendor', 'admin']}><AccountSettings /></RequireRole></Layout>} />
      <Route path="/guide-dashboard" element={<Layout><RequireRole roles={['guide']}><GuideDashboard /></RequireRole></Layout>} />
      <Route path="/guide/tour-planner" element={<FullLayout><RequireRole roles={['guide']}><TourPlanner /></RequireRole></FullLayout>} />
      <Route path="/vendor" element={<Layout><RequireRole roles={['vendor']}><VendorDashboard /></RequireRole></Layout>} />

      {/* Catch-all */}
      <Route path="*" element={<Layout><Landing /></Layout>} />
    </Routes>
  );
}
