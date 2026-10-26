import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { User, ShoppingBag, Star, Heart, Settings, Package, MapPin, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authApi, tripsApi, ordersApi, preordersApi, bookingsApi, reviewsApi, documentsApi, placesApi, guidePaymentsApi, type GuidePayment } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import Badge from '../../components/ui/Badge';
import PaymentProofFields, { emptyPaymentProof, methodLabel, validatePaymentProof, type PaymentProof } from '../../components/ui/PaymentProofFields';

/** Tourist side of the guide's balance payment: mark it paid, then the guide confirms receipt. */
function GuideBalancePayment({ booking, payment, onChanged }: { booking: any; payment?: GuidePayment; onChanged: () => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<'cash' | 'bkash' | 'nagad'>('cash');
  const [proof, setProof] = useState<PaymentProof>(emptyPaymentProof);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const balance = Number(booking.balanceAmount || 0);

  if (payment?.status === 'confirmed') {
    return (
      <p className="mt-3 text-sm font-semibold text-[#006A4E]">
        ✓ {booking.guideName || 'The guide'} confirmed receiving ৳{Number(payment.amount).toLocaleString()} ({methodLabel(payment.method)}).
      </p>
    );
  }

  async function submit() {
    const proofError = validatePaymentProof(method, proof);
    if (proofError) { setError(proofError); return; }
    setBusy(true); setError('');
    try {
      await guidePaymentsApi.record(booking.id, method, { payerPhone: proof.phone, reference: proof.transactionId });
      setOpen(false);
      await onChanged();
    } catch (e: any) {
      setError(e?.message || 'Could not record the payment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-[var(--color-border)] pt-4 text-sm">
      {payment?.status === 'reported' ? (
        <p className="text-[var(--color-text-muted)]">
          You marked ৳{Number(payment.amount).toLocaleString()} as paid ({methodLabel(payment.method)}). Waiting for the guide to confirm.
          {!open && <button onClick={() => setOpen(true)} className="ml-2 text-[#006A4E] hover:underline">Edit</button>}
        </p>
      ) : !open && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p>Balance for the guide: <strong>৳{balance.toLocaleString()}</strong> <span className="text-xs text-[var(--color-text-muted)]">(the advance was paid online)</span></p>
          <button onClick={() => setOpen(true)} className="rounded-lg bg-[#006A4E] px-3 py-1.5 text-xs font-semibold text-white">Mark as Paid</button>
        </div>
      )}
      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How you paid the guide">
            {(['cash', 'bkash', 'nagad'] as const).map(m => (
              <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => { setMethod(m); setError(''); }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${method === m ? 'border-[#006A4E] bg-[#006A4E]/10 text-[#006A4E]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
                {methodLabel(m)}
              </button>
            ))}
          </div>
          <PaymentProofFields method={method} value={proof} onChange={setProof} amount={balance} />
          <div className="flex gap-2">
            <button disabled={busy} onClick={submit} className="rounded-lg bg-[#006A4E] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              {busy ? 'Saving…' : `I Paid ৳${balance.toLocaleString()}`}
            </button>
            <button onClick={() => { setOpen(false); setError(''); }} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs">Cancel</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const TABS = [
  { id: 'trips', label: 'My Trips', icon: MapPin },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'reviews', label: 'My Reviews', icon: Star },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function TouristProfile() {
  const { currentUser, logout } = useApp();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const [activeTab, setActiveTabState] = useState(TABS.some(tab => tab.id === requestedTab) ? requestedTab! : 'trips');
  function setActiveTab(tab: string) {
    setActiveTabState(tab);
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  }
  useEffect(() => {
    if (TABS.some(tab => tab.id === requestedTab)) setActiveTabState(requestedTab!);
  }, [requestedTab]);

  if (!currentUser) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <p className="text-[var(--color-text-muted)] mb-4">Please sign in to view your profile.</p>
      <Link to="/login" className="bg-[#006A4E] text-white px-6 py-3 rounded-xl font-semibold">Sign In</Link>
    </div>
  );

  return <TouristProfileContent currentUser={currentUser} logout={logout} activeTab={activeTab} setActiveTab={setActiveTab} documentUploadFailed={params.get('upload') === 'failed'} />;
}

function TouristProfileContent({ currentUser, logout, activeTab, setActiveTab, documentUploadFailed }: { currentUser: any; logout: () => void; activeTab: string; setActiveTab: (t: string) => void; documentUploadFailed: boolean }) {
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentError, setDocumentError] = useState('');
  const [documentSaving, setDocumentSaving] = useState(false);
  const [tripStatusBusy, setTripStatusBusy] = useState<string | null>(null);
  const [tripStatusError, setTripStatusError] = useState('');
  const { data: tripsData, error: tripsError, refetch: refetchTrips } = useApiData(() => tripsApi.list(), [] as any[]);
  const { data: ordersData, error: ordersError } = useApiData(() => ordersApi.list(), [] as any[]);
  const { data: preOrdersData, error: preOrdersError } = useApiData(() => preordersApi.list(), [] as any[]);
  const { data: bookingsData, error: bookingsError, refetch: refetchGuideBookings } = useApiData(() => bookingsApi.list(), [] as any[]);
  const { data: guidePayments, refetch: refetchGuidePayments } = useApiData(() => guidePaymentsApi.list(), [] as GuidePayment[]);
  const { data: reviewsData, error: reviewsError, refetch: refetchReviews } = useApiData(() => reviewsApi.mine(), [] as any[]);
  const { data: documentsData, loading: documentsLoading, error: documentsLoadError, refetch: refetchDocuments } = useApiData(() => documentsApi.list(), [] as any[]);
  const { data: savedPlacesData, error: savedPlacesError } = useApiData(() => placesApi.saved(), [] as any[]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        refetchGuideBookings();
      }
    }, 20000);
    return () => window.clearInterval(timer);
  }, [refetchGuideBookings]);
  const mockTripPlans = Array.isArray(tripsData) ? tripsData.filter((trip: any) => trip && typeof trip === 'object') : [];
  const mockOrders = Array.isArray(ordersData) ? ordersData.filter((order: any) => order && typeof order === 'object') : [];
  const myPreOrders = Array.isArray(preOrdersData) ? preOrdersData.filter((order: any) => order && typeof order === 'object') : [];
  const guideBookings = Array.isArray(bookingsData) ? bookingsData.filter((booking: any) => booking && typeof booking === 'object') : [];
  const myReviews = Array.isArray(reviewsData) ? reviewsData.filter((review: any) => review && typeof review === 'object') : [];
  const myDocuments = Array.isArray(documentsData) ? documentsData.filter((doc: any) => doc && typeof doc === 'object') : [];
  const mySavedPlaces = Array.isArray(savedPlacesData) ? savedPlacesData.filter((place: any) => place && typeof place === 'object') : [];
  const dashboardErrors = [
    tripsError && `Trips: ${tripsError}`,
    ordersError && `Orders: ${ordersError}`,
    preOrdersError && `Ready to Pick orders: ${preOrdersError}`,
    bookingsError && `Guide bookings: ${bookingsError}`,
    reviewsError && `Reviews: ${reviewsError}`,
    documentsLoadError && `Documents: ${documentsLoadError}`,
    savedPlacesError && `Saved places: ${savedPlacesError}`,
    !Array.isArray(tripsData) && 'Trips: the server returned an unexpected response.',
    !Array.isArray(ordersData) && 'Orders: the server returned an unexpected response.',
    !Array.isArray(preOrdersData) && 'Ready to Pick orders: the server returned an unexpected response.',
    !Array.isArray(bookingsData) && 'Guide bookings: the server returned an unexpected response.',
    !Array.isArray(reviewsData) && 'Reviews: the server returned an unexpected response.',
    !Array.isArray(documentsData) && 'Documents: the server returned an unexpected response.',
  ].filter((error): error is string => Boolean(error));
  const completedTours = [
    ...guideBookings
      .filter((booking: any) => booking.status === 'completed')
      .map((booking: any) => ({ ...booking, tourKey: `booking-${booking.id}`, tourName: booking.tourType })),
    ...mockTripPlans
      .filter((trip: any) => trip.status === 'completed' && trip.guideId && trip.guideResponse === 'accepted')
      .map((trip: any) => ({ ...trip, tourKey: `trip-${trip.id}`, tourName: trip.name })),
  ];

  async function markTripCompleted(tripId: string, bookingId: string) {
    setTripStatusBusy(tripId);
    setTripStatusError('');
    try {
      await bookingsApi.update(bookingId, 'completed');
      await Promise.all([refetchTrips(), refetchGuideBookings()]);
    } catch (error) {
      setTripStatusError(error instanceof Error ? error.message : 'Could not update the tour status.');
    } finally {
      setTripStatusBusy(null);
    }
  }

  async function uploadIdentityDocument() {
    if (!documentFile) {
      setDocumentError('Choose an identity document to upload.');
      return;
    }
    setDocumentSaving(true);
    setDocumentError('');
    try {
      await documentsApi.upload(documentFile, 'identity');
      setDocumentFile(null);
      await refetchDocuments();
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : 'Could not upload your document.');
    } finally {
      setDocumentSaving(false);
    }
  }

  async function submitGuideReview(booking: any) {
    setReviewSaving(true);
    setReviewError('');
    try {
      await reviewsApi.create({
        targetId: booking.guideId,
        targetType: 'guide',
        rating: reviewRating,
        content: reviewContent.trim(),
      });
      await refetchReviews();
      setReviewBookingId(null);
      setReviewContent('');
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Could not submit your review.');
    } finally {
      setReviewSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Profile header */}
      <div className="bg-gradient-to-r from-[#006A4E] to-[#004D38] py-16 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white/30 bg-white/10">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">{currentUser.name?.[0] || '?'}</div>
            )}
          </div>
          <div className="text-white">
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{currentUser.name}</h1>
            <p className="text-white/70 mt-1">{currentUser.email}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="gold">Heritage Explorer</Badge>
              {currentUser.verified && <Badge variant="green">Verified</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {dashboardErrors.length > 0 && (
          <div role="status" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="mb-1 font-semibold">Some dashboard information could not be loaded.</p>
            <ul className="list-inside list-disc">{dashboardErrors.map(error => <li key={error}>{error}</li>)}</ul>
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Trips Planned', value: mockTripPlans.length, icon: MapPin },
            { label: 'Orders', value: mockOrders.length, icon: Package },
            { label: 'Reviews', value: myReviews.length, icon: Star },
            { label: 'Saved Places', value: mySavedPlaces.length, icon: Heart },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-[var(--color-border)] text-center">
              <stat.icon size={20} className="text-[#006A4E] mx-auto mb-2" />
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--color-border)] mb-8 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id ? 'border-[#006A4E] text-[#006A4E]' : 'border-transparent text-[var(--color-text-muted)]'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'trips' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">My Trips</h3>
              <Link to="/planner" className="text-sm text-[#006A4E] font-medium hover:underline">+ New Trip</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockTripPlans.map(trip => (
                <div key={trip.id} className="bg-white rounded-2xl p-5 border border-[var(--color-border)]">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{trip.name}</h4>
                    <Badge variant={trip.status === 'completed' ? 'green' : 'gray'} size="sm">
                      {trip.status === 'completed' ? 'Successfully completed' : 'Not completed'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-3">
                    {new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}
                    {trip.startTime && trip.endTime ? ` · ${trip.startTime}–${trip.endTime}` : ''}
                  </p>
                  {trip.guideId && (
                    <p className="mb-2 text-xs font-semibold text-[var(--color-text-muted)]">
                      Guide response: {trip.guideResponse === 'accepted' ? 'Accepted' : trip.guideResponse === 'declined' ? 'Declined' : 'Awaiting response'}
                    </p>
                  )}
                  {trip.guideId && trip.guideFee !== null && trip.guideFee !== undefined && (
                    <p className="mb-2 text-xs font-semibold text-[var(--color-text-muted)]">
                      {trip.guideResponse === 'accepted' ? 'Agreed guide fee' : 'Estimated guide fee'}: ৳{Number(trip.guideFee).toLocaleString()}
                    </p>
                  )}
                  {trip.guideBookingId && (
                    <p className="mb-2 text-xs text-[var(--color-text-muted)]">
                      Online advance: ৳{Number(trip.guideBookingAdvance || 0).toLocaleString()} · Cash balance: ৳{Number(trip.guideBookingBalance || 0).toLocaleString()}
                    </p>
                  )}
                  {trip.guideBookingId && <p className="mb-2 text-xs text-amber-800">The online advance is simulated in demo mode; no real payment gateway is connected.</p>}
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(trip.destinations) ? trip.destinations : []).map((d: string) => <Badge key={d} variant="gray" size="sm">{d}</Badge>)}
                  </div>
                  <Link to="/planner" className="block mt-3 text-sm text-[#006A4E] font-medium hover:underline">View Trip</Link>
                  {trip.guideResponse === 'accepted' && trip.guideBookingStatus === 'awaiting_confirmation' && trip.guideBookingId && (
                    <button
                      disabled={tripStatusBusy === trip.id}
                      onClick={() => {
                        if (window.confirm('Confirm the guided tour is complete and the remaining balance was paid to the guide in cash?')) {
                          void markTripCompleted(trip.id, trip.guideBookingId);
                        }
                      }}
                      className="mt-3 rounded-lg bg-[#006A4E] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {tripStatusBusy === trip.id ? 'Saving…' : 'Confirm tour completed & balance paid'}
                    </button>
                  )}
                  {trip.guideResponse === 'accepted' && trip.guideBookingStatus === 'awaiting_confirmation' && (
                    <p className="mt-3 text-xs text-[var(--color-text-muted)]">Your guide marked this tour finished. Confirm completion after paying the balance in cash.</p>
                  )}
                  {trip.guideBookingStatus === 'completed' && <p className="mt-3 text-sm font-semibold text-[#006A4E]">Tour completed and guide settlement recorded.</p>}
                </div>
              ))}
              {mockTripPlans.length === 0 && (
                <div className="sm:col-span-2 rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-6 text-center">
                  <MapPin size={24} className="mx-auto mb-2 text-[#006A4E]" />
                  <p className="font-semibold">No trips planned yet</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Create a trip to save destinations and share an itinerary with a guide.</p>
                  <Link to="/planner" className="mt-3 inline-block text-sm font-semibold text-[#006A4E] hover:underline">Plan your first trip</Link>
                </div>
              )}
            </div>
            {tripStatusError && !tripStatusBusy && <p className="mt-3 text-sm text-red-600">{tripStatusError}</p>}
            <div className="mt-8">
              <h3 className="font-bold mb-4">Guide booking requests</h3>
              {guideBookings.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No guide bookings yet. Browse verified guides to request a tour.</p>
              ) : (
                <div className="space-y-3">
                  {guideBookings.map((booking: any) => (
                    <div key={booking.id} className="bg-white rounded-2xl p-5 border border-[var(--color-border)]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{booking.tourType} · {booking.guideName || 'Guide'}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{booking.startDate} – {booking.endDate} · ৳{booking.totalPrice.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={['accepted', 'awaiting_confirmation', 'completed'].includes(booking.status) ? 'green' : booking.status === 'pending' ? 'gold' : 'gray'}>
                          {booking.status === 'completed' ? 'Successfully completed' : booking.status === 'awaiting_confirmation' ? 'Guide finished · confirmation needed' : booking.status}
                        </Badge>
                        {['pending', 'accepted'].includes(booking.status) && (
                          <button
                            onClick={async () => {
                              if (!window.confirm('Cancel this guide booking request?')) return;
                              try {
                                await bookingsApi.update(booking.id, 'cancelled');
                                await refetchGuideBookings();
                              } catch (error) {
                                alert(error instanceof Error ? error.message : 'Could not cancel this booking.');
                              }
                            }}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                        {booking.status === 'awaiting_confirmation' && (
                          <button
                            onClick={async () => {
                              if (!window.confirm('Confirm the tour is complete? This releases the advance to the guide.')) return;
                              try {
                                await bookingsApi.update(booking.id, 'completed');
                                await refetchGuideBookings();
                                await refetchTrips();
                              } catch (error) {
                                alert(error instanceof Error ? error.message : 'Could not confirm tour completion.');
                              }
                            }}
                            className="text-sm font-semibold text-[#006A4E] hover:underline"
                          >
                            Confirm tour completed
                          </button>
                        )}
                        {booking.status === 'completed' && !myReviews.some((review: any) => review.targetType === 'guide' && review.targetId === booking.guideId) && (
                          <button
                            onClick={() => { setReviewBookingId(booking.id); setActiveTab('reviews'); setReviewError(''); }}
                            className="text-sm text-[#006A4E] hover:underline"
                          >
                            Review guide
                          </button>
                        )}
                      </div>
                    </div>
                      {['awaiting_confirmation', 'completed'].includes(booking.status) && (
                        <GuideBalancePayment
                          booking={booking}
                          payment={guidePayments.find(p => p.bookingId === booking.id)}
                          onChanged={refetchGuidePayments}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <section className="space-y-5">
            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold mb-2">Identity documents</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Upload an NID or passport for account verification. Only admins can access uploaded files.</p>
              {documentUploadFailed && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">Your account was created, but the first upload did not complete. Select the file again to retry.</p>}
              {(documentError || documentsLoadError) && <p className="mb-3 text-sm text-red-600">{documentError || `Could not load your documents: ${documentsLoadError}`}</p>}
              <div className="flex flex-wrap items-center gap-3">
                <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={event => setDocumentFile(event.target.files?.[0] || null)} />
                <button type="button" disabled={documentSaving || !documentFile} onClick={uploadIdentityDocument}
                  className="rounded-xl bg-[#006A4E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {documentSaving ? 'Uploading…' : 'Upload document'}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold mb-3">Submitted documents</h3>
              {documentsLoading ? <p className="text-sm text-[var(--color-text-muted)]">Loading documents…</p> : myDocuments.length === 0
                ? <p className="text-sm text-[var(--color-text-muted)]">No documents uploaded yet.</p>
                : <ul className="space-y-3">{myDocuments.map((document: any) => (
                  <li key={document.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{document.fileName}</span>
                    <span className="text-xs capitalize text-[var(--color-text-muted)]">{document.documentType.replace('_', ' ')} · {new Date(document.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}</ul>}
            </div>
          </section>
        )}

        {activeTab === 'orders' && (
          <div>
            <h3 className="font-bold mb-4">My Orders</h3>
            <div className="space-y-4">
              {mockOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl p-5 border border-[var(--color-border)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-sm">#{order.id}</p>
                    <Badge variant={order.status === 'completed' || order.status === 'delivered' ? 'green' : 'gold'}>{String(order.status || 'unknown').replace(/_/g, ' ')}</Badge>
                  </div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">
                      {order.createdAt && !Number.isNaN(new Date(order.createdAt).getTime())
                        ? new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Date unavailable'}
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      {(Array.isArray(order.items) ? order.items : []).slice(0, 2).map((item: any, index: number) => (
                        item?.product ? (
                          <img key={item.product.id || index} src={item.product.images?.[0] || ''} alt={item.product.name || 'Order item'} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div key={item?.productId || index} className="w-12 h-12 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center text-[10px] text-[var(--color-text-muted)]">Item</div>
                        )
                      ))}
                      {Array.isArray(order.items) && order.items.length > 2 && <span className="text-xs text-[var(--color-text-muted)]">+{order.items.length - 2} more</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#006A4E]">৳{Number(order.totalAmount || 0).toLocaleString()}</span>
                    <Link to={`/order-tracking?id=${encodeURIComponent(order.id)}`} className="text-sm text-[#006A4E] font-medium hover:underline">Track Order</Link>
                  </div>
                </div>
              ))}
              {myPreOrders.length > 0 && (
                <div className="pt-4">
                  <h4 className="font-bold mb-3">Ready to Pick orders</h4>
                  <div className="space-y-3">
                    {myPreOrders.map((order: any) => (
                      <div key={order.id} className="bg-white rounded-2xl p-5 border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{order.productName}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">#{order.orderNumber} · Pickup {order.pickupDate} at {order.pickupTime}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={order.status === 'completed' ? 'green' : 'gold'}>{order.status.replace(/_/g, ' ')}</Badge>
                          <Link to={`/preorder/tracking/${encodeURIComponent(order.orderNumber)}`} className="text-sm text-[#006A4E] font-medium hover:underline">View order</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {mockOrders.length === 0 && myPreOrders.length === 0 && (
                <p className="text-sm text-[var(--color-text-muted)]">You have not placed any orders yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <h3 className="font-bold">Reviews for completed tours</h3>
            {completedTours.map((booking: any) => {
              const existingReview = myReviews.find((review: any) => review.targetType === 'guide' && review.targetId === booking.guideId);
              const editing = reviewBookingId === booking.tourKey;
              return (
                <div key={booking.tourKey} className="bg-white rounded-2xl p-5 border border-[var(--color-border)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{booking.guideName || 'Guide'} · {booking.tourName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{booking.startDate} – {booking.endDate}</p>
                    </div>
                    {existingReview
                      ? <Badge variant="green">{existingReview.rating} ★ reviewed</Badge>
                      : <button onClick={() => { setReviewBookingId(editing ? null : booking.tourKey); setReviewError(''); }} className="text-sm font-semibold text-[#006A4E] hover:underline">{editing ? 'Close' : 'Write review'}</button>}
                  </div>
                  {editing && !existingReview && (
                    <form onSubmit={event => { event.preventDefault(); void submitGuideReview(booking); }} className="mt-4 space-y-3">
                      <label className="block text-sm font-medium">
                        Rating
                        <select value={reviewRating} onChange={event => setReviewRating(Number(event.target.value))} className="ml-3 rounded-lg border border-[var(--color-border)] px-3 py-2">
                          {[5, 4, 3, 2, 1].map(rating => <option key={rating} value={rating}>{rating} star{rating === 1 ? '' : 's'}</option>)}
                        </select>
                      </label>
                      <textarea required minLength={3} value={reviewContent} onChange={event => setReviewContent(event.target.value)} rows={3} placeholder="Share how your tour went..." className="w-full rounded-xl border border-[var(--color-border)] p-3 text-sm" />
                      {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
                      <button disabled={reviewSaving} className="rounded-xl bg-[#006A4E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        {reviewSaving ? 'Submitting…' : 'Submit review'}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
            {completedTours.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">Completed guide bookings and accepted trip plans will appear here when they are ready for a review.</p>
            )}
            {myReviews.filter((review: any) => review.targetType !== 'guide').map((review: any) => (
              <div key={review.id} className="bg-white rounded-2xl p-5 border border-[var(--color-border)]">
                <p className="font-semibold">{review.rating} ★ · {review.targetType}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{review.content}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && <ProfileSettings currentUser={currentUser} logout={logout} />}
      </div>
    </div>
  );
}


function ProfileSettings({ currentUser, logout }: { currentUser: any; logout: () => void }) {
  const { updateCurrentUser } = useApp();
  const [name, setName] = useState(currentUser.name ?? '');
  const [phone, setPhone] = useState(currentUser.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const res: any = await authApi.updateMe({ name, phone });
      updateCurrentUser(res.user);
      setMsg({ ok: true, text: 'Profile saved.' });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || 'Could not save your profile.' });
    } finally {
      setSaving(false);
    }
  }

  const cls = 'w-full px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#006A4E]/30';
  return (
    <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)]">
      <h3 className="font-bold mb-6">Account Settings</h3>
      <div className="space-y-4 max-w-md">
        <div><label className="text-sm font-semibold mb-1 block">Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className={cls} /></div>
        <div><label className="text-sm font-semibold mb-1 block">Email</label>
          <input value={currentUser.email} disabled className={cls + ' bg-gray-50 text-gray-500'} />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Email can't be changed.</p></div>
        <div><label className="text-sm font-semibold mb-1 block">Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880 1XXX XXXXXX" className={cls} /></div>
        {msg && <p className={`text-sm ${msg.ok ? 'text-[#006A4E]' : 'text-red-600'}`}>{msg.text}</p>}
        <button onClick={save} disabled={saving} className="bg-[#006A4E] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#004D38] transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
      <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
        <button onClick={logout} className="text-sm text-[#F42A41] font-semibold hover:underline">Sign Out</button>
      </div>
    </div>
  );
}
