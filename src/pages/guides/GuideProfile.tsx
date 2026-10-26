import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, CheckCircle, Languages, Clock, Award, ArrowLeft, MessageCircle, Phone } from 'lucide-react';
import { bookingsApi, chatApi, guidesApi, paymentTermsApi, reviewsApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import Badge from '../../components/ui/Badge';
import StarRating from '../../components/ui/StarRating';
import ReviewCard from '../../components/cards/ReviewCard';
import Modal from '../../components/ui/Modal';
import PaymentProofFields, { emptyPaymentProof, validatePaymentProof, type PaymentProof } from '../../components/ui/PaymentProofFields';
import { useApp } from '../../context/AppContext';
import type { TourType } from '../../types';

const TABS = ['About', 'Tours & Pricing', 'Reviews', 'Availability'];

export default function GuideProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: guide, loading, error } = useApiData(() => guidesApi.get(id as string), null as any, [id]);
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('About');
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [paymentProof, setPaymentProof] = useState<PaymentProof>(emptyPaymentProof);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [sent, setSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const { data: paymentTerms, error: paymentTermsError } = useApiData(
    () => paymentTermsApi.get(),
    null as any,
  );

  const { data: guideReviews } = useApiData(
    () => (id ? reviewsApi.list('guide', id) : Promise.resolve([])),
    [] as any[],
    [id]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-[var(--color-text-muted)]">Loading guide…</p>
      </div>
    );
  }
  if (error || !guide) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-lg font-semibold text-[var(--color-text)]">This guide profile is unavailable.</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{error || 'The guide may no longer be approved or the profile link is invalid.'}</p>
        <Link to="/guides" className="mt-5 rounded-xl bg-[#006A4E] px-5 py-3 font-semibold text-white">Browse guides</Link>
      </div>
    );
  }

  const canBook = !!guide.verified && !!guide.bio?.trim() && !!guide.location?.trim()
    && guide.pricePerDay > 0 && Array.isArray(guide.tourTypes) && guide.tourTypes.length > 0;

  const openBooking = (tourName = '') => {
    if (!canBook) return;
    if (!currentUser) {
      navigate('/login?from=' + encodeURIComponent(`/guides/${id}`));
      return;
    }
    if (currentUser.role !== 'tourist') return;
    setSelectedTour(tourName || guide.tourTypes[0]?.name || 'Private tour');
    setBookingError('');
    setCreatedBooking(null);
    setContactOpen(true);
  };

  const contactGuide = async () => {
    if (!currentUser) {
      navigate('/login?from=' + encodeURIComponent(`/guides/${id}`));
      return;
    }
    if (currentUser.role !== 'tourist' || !id) return;
    setContactLoading(true);
    setContactError('');
    try {
      const conversation = await chatApi.startConversation(id);
      navigate('/chat', { state: { conversationId: conversation.id } });
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Could not start a conversation with this guide.');
    } finally {
      setContactLoading(false);
    }
  };

  const submitBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !selectedTour || !startDate || !endDate) {
      setBookingError('Choose a tour and both dates to continue.');
      return;
    }
    const proofError = validatePaymentProof(paymentMethod, paymentProof);
    if (proofError) {
      setBookingError(proofError);
      return;
    }
    setBookingLoading(true);
    setBookingError('');
    try {
      const booking = await bookingsApi.create({
        guideId: id,
        tourType: selectedTour,
        startDate,
        endDate,
        message: bookingMessage.trim(),
        groupSize: 1,
        paymentMethod,
        advancePayerPhone: paymentProof.phone,
        advanceTransactionId: paymentProof.transactionId,
      });
      setCreatedBooking(booking);
      setSent(true);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Could not submit your booking request.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Hero */}
      <div className="relative h-72 bg-gradient-to-br from-[#006A4E] to-[#004D38]">
        <div className="absolute top-4 left-4 z-10">
          <Link to="/guides" className="flex items-center gap-2 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-xl text-sm hover:bg-white/30 transition-colors">
            <ArrowLeft size={16} /> All Guides
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Profile header */}
        <div className="relative -mt-20 flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-[var(--color-surface-2)]">
              <img src={guide.profileImage || guide.avatar || ''} alt={guide.name} className="w-full h-full object-cover" />
            </div>
            {guide.isAvailable && (
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          <div className="pb-2 flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-3xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>{guide.name}</h1>
              {guide.verified && (
                <div className="flex items-center gap-1 text-[#006A4E] bg-[#006A4E]/10 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircle size={14} />
                  Verified Guide
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-[var(--color-text-muted)] mb-2">
              <MapPin size={14} />
              <span className="text-sm">{guide.location || 'Location not provided yet'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                <StarRating rating={guide.rating} size="sm" showValue />
                <span className="text-sm text-[var(--color-text-muted)]">({guide.reviewCount} reviews)</span>
              </div>
              <span className="text-sm text-[var(--color-text-muted)]">{guide.toursCompleted} tours completed</span>
              <span className="text-sm text-[var(--color-text-muted)]">{guide.yearsExperience} years experience</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => void contactGuide()}
              disabled={contactLoading || (currentUser !== null && currentUser.role !== 'tourist')}
              className="flex items-center gap-2 bg-[#006A4E] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#004D38] transition-colors disabled:opacity-50"
            >
              <MessageCircle size={16} /> {contactLoading ? 'Opening…' : 'Contact'}
            </button>
            {guide.phone && (
              <a
                href={`tel:${guide.phone.replace(/[^\d+]/g, '')}`}
                className="flex items-center gap-2 rounded-xl border-2 border-[#006A4E] px-4 py-2.5 text-sm font-semibold text-[#006A4E] hover:bg-[#006A4E]/5"
              >
                <Phone size={16} /> Call {guide.phone}
              </a>
            )}
          </div>
        </div>
        {contactError && <p role="alert" className="mb-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">{contactError}</p>}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Rating', value: guide.rating.toFixed(1), icon: Star },
            { label: 'Tours Done', value: guide.toursCompleted, icon: Award },
            { label: 'Languages', value: guide.languages.length, icon: Languages },
            { label: 'Years Exp.', value: guide.yearsExperience, icon: Clock },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-[var(--color-border)] text-center">
              <stat.icon size={20} className="text-[#006A4E] mx-auto mb-1" />
              <div className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-[var(--color-border)] mb-8 overflow-x-auto scrollbar-hide">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab ? 'border-[#006A4E] text-[#006A4E]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'About' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>About</h3>
                  <p className="text-[var(--color-text-muted)] leading-relaxed">{guide.bio || 'This guide has not added a biography yet.'}</p>
                </div>
                <div>
                  <h3 className="font-bold text-base mb-3">Specializations</h3>
                  {guide.specializations.length > 0
                    ? <div className="flex flex-wrap gap-2">{guide.specializations.map((s: string) =><Badge key={s} variant="green">{s}</Badge>)}</div>
                    : <p className="text-sm text-[var(--color-text-muted)]">No specializations listed yet.</p>}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-3">Languages</h3>
                  {guide.languages.length > 0
                    ? <div className="flex flex-wrap gap-2">{guide.languages.map((l: string) =><Badge key={l} variant="blue">{l}</Badge>)}</div>
                    : <p className="text-sm text-[var(--color-text-muted)]">No languages listed yet.</p>}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-3">Cover Areas</h3>
                  {guide.coverAreas.length > 0
                    ? <div className="flex flex-wrap gap-2">{guide.coverAreas.map((a: string) =><Badge key={a} variant="gray">{a}</Badge>)}</div>
                    : <p className="text-sm text-[var(--color-text-muted)]">No covered areas listed yet.</p>}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-3">Certifications</h3>
                  {guide.certifications.length > 0
                    ? <ul className="space-y-2">{guide.certifications.map((c: string) => (
                        <li key={c} className="flex items-center gap-2 text-sm">
                          <Award size={14} className="text-[#D4A017]" />
                          {c}
                        </li>
                      ))}</ul>
                    : <p className="text-sm text-[var(--color-text-muted)]">No certifications listed yet.</p>}
                </div>
              </div>
            )}

            {activeTab === 'Tours & Pricing' && (
              <div className="space-y-4">
                {guide.tourTypes.length === 0 && (
                  <p className="rounded-2xl border border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-text-muted)]">
                    This verified guide is visible, but is not bookable until their profile and tour services are completed.
                  </p>
                )}
                {guide.tourTypes.map((tour: TourType, i: number) => (
                  <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-base" style={{ fontFamily: 'var(--font-display)' }}>{tour.name}</h3>
                      <div className="text-right">
                        <div className="font-bold text-[#006A4E] text-lg">৳{tour.price.toLocaleString()}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{tour.duration}</div>
                      </div>
                    </div>
                    <p className="text-[var(--color-text-muted)] text-sm">{tour.description}</p>
                    <button
                      onClick={() => openBooking(tour.name)}
                      className="mt-4 bg-[#006A4E] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#004D38] transition-colors"
                    >
                      Book This Tour
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Reviews' && (
              <div className="space-y-4">
                {guideReviews.length > 0 ? (
                  guideReviews.map(r => <ReviewCard key={r.id} review={r} />)
                ) : (
                  <div className="text-center py-12 text-[var(--color-text-muted)]">
                    <Star size={32} className="mx-auto mb-3 opacity-30" />
                    <p>No reviews yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Availability' && (
              <div>
                <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${guide.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="font-semibold">{guide.isAvailable ? 'Currently Available' : 'Currently Busy'}</span>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-sm">
                    {guide.isAvailable
                      ? 'This guide is available for bookings. Contact them to check specific dates.'
                      : 'This guide is currently busy. Contact them for future availability.'}
                  </p>
                </div>
                <p className="text-[var(--color-text-muted)] text-sm">Contact the guide directly to confirm availability for your preferred dates.</p>
              </div>
            )}
          </div>

          {/* Sidebar CTA */}
          <div className="space-y-6">
            <div className="bg-[#006A4E] rounded-2xl p-6 text-white sticky top-24">
              <h3 className="font-bold text-xl mb-1" style={{ fontFamily: 'var(--font-display)' }}>Book {guide.name.split(' ')[0]}</h3>
              <div className="text-3xl font-bold text-[#D4A017] my-3" style={{ fontFamily: 'var(--font-display)' }}>
                {guide.pricePerDay > 0 ? <>৳{guide.pricePerDay.toLocaleString()}<span className="text-base font-normal text-white/70">/day</span></> : <span className="text-base font-normal text-white/70">Pricing not added</span>}
              </div>
              {!canBook ? (
                <Badge variant="gold" className="mb-4">Profile Incomplete</Badge>
              ) : guide.isAvailable ? (
                <Badge variant="green" className="mb-4">Available Now</Badge>
              ) : (
                <Badge variant="gray" className="mb-4">Currently Busy</Badge>
              )}
              <div className="space-y-3">
                {guide.phone ? (
                  <a
                    href={`tel:${guide.phone.replace(/[^\d+]/g, '')}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20"
                  >
                    <Phone size={16} /> Call {guide.phone}
                  </a>
                ) : (
                  <p className="text-xs text-white/75">This guide has not shared a public phone number.</p>
                )}
                <button
                  onClick={() => openBooking()}
                  disabled={!canBook || !guide.isAvailable || (currentUser !== null && currentUser.role !== 'tourist')}
                  className="w-full bg-white text-[#006A4E] py-3 rounded-xl font-semibold text-sm hover:bg-[#D4A017] hover:text-white transition-colors disabled:opacity-50"
                >
                  {!canBook ? 'Profile Being Completed' : !currentUser ? 'Sign In to Request' : currentUser.role === 'tourist' ? 'Request This Guide' : 'Tourist Account Required'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Modal isOpen={contactOpen} onClose={() => { setContactOpen(false); setSent(false); }} title={`Request ${guide.name}`}>
        {sent ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-[#006A4E] mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Booking Request Sent</h3>
            <p className="text-[var(--color-text-muted)]">The online advance payment was recorded in demo mode. Your booking will appear in your profile.</p>
            {createdBooking && (
              <div className="mt-4 rounded-xl bg-[#F8F7F4] p-4 text-left text-sm">
                <p>Total guide fee: ৳{Number(createdBooking.totalPrice || 0).toLocaleString()}</p>
                <p>Online advance: ৳{Number(createdBooking.advanceAmount || 0).toLocaleString()}</p>
                <p>Cash balance after the tour: ৳{Number(createdBooking.balanceAmount || 0).toLocaleString()}</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={submitBooking} className="space-y-4">
            {guide.phone && (
              <a
                href={`tel:${guide.phone.replace(/[^\d+]/g, '')}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#006A4E] bg-[#E6F4EF] px-4 py-3 text-sm font-semibold text-[#006A4E]"
              >
                <Phone size={16} /> Call {guide.phone}
              </a>
            )}
            {!guide.isAvailable && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                This guide is currently unavailable for bookings. {guide.phone ? 'You can call to ask about future availability.' : 'The guide has not shared a public phone number.'}
              </p>
            )}
            <p className="text-[var(--color-text-muted)] text-sm">
              Choose a service and dates. The server calculates the guide fee and required advance from saved rates.
            </p>
            {paymentTermsError && <p role="alert" className="text-sm text-red-600">Could not load payment terms: {paymentTermsError}</p>}
            {paymentTerms && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              Pay {paymentTerms.guide_booking}% online advance now. The remaining balance is paid directly to the guide after the tour; either of you marks it paid. No payment gateway is connected yet: the admin checks your number and TrxID against the wallet statement.
            </p>}
            <label className="block text-sm font-semibold">Online advance method
              <select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value as 'bkash' | 'nagad' | 'card')}
                className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3">
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="card">Card</option>
              </select>
            </label>
            <PaymentProofFields method={paymentMethod} value={paymentProof} onChange={setPaymentProof} />
            <label className="block text-sm font-semibold">
              Tour service
              <select required value={selectedTour} onChange={e => setSelectedTour(e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-[var(--color-border)] rounded-xl bg-white">
                {guide.tourTypes.map((tour: TourType) => <option key={tour.name} value={tour.name}>{tour.name} — ৳{tour.price.toLocaleString()}</option>)}
                {!guide.tourTypes.length && <option value="Private tour">Private tour</option>}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold">Start date
                <input required type="date" min={new Date().toISOString().slice(0, 10)} value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="mt-1 w-full px-3 py-3 border border-[var(--color-border)] rounded-xl" />
              </label>
              <label className="text-sm font-semibold">End date
                <input required type="date" min={startDate || undefined} value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="mt-1 w-full px-3 py-3 border border-[var(--color-border)] rounded-xl" />
              </label>
            </div>
            <label className="block text-sm font-semibold">Message (optional)
              <textarea value={bookingMessage} onChange={e => setBookingMessage(e.target.value)} rows={3}
                className="mt-1 w-full px-4 py-3 border border-[var(--color-border)] rounded-xl resize-none"
                placeholder="Share any details about your group or interests." />
            </label>
            {bookingError && <p role="alert" className="text-sm text-red-600">{bookingError}</p>}
            <button type="submit" disabled={bookingLoading || !guide.isAvailable || !paymentTerms}
              className="w-full bg-[#006A4E] text-white py-3 rounded-xl font-semibold hover:bg-[#004D38] disabled:opacity-50">
              {bookingLoading ? 'Submitting…' : 'Send Booking Request'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
