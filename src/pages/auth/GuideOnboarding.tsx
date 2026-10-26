import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft, FileText, MapPin, AlertCircle, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authApi, documentsApi, guidesApi, profileImagesApi } from '../../services/api';
import ProfileImagePicker from '../../components/ui/ProfileImagePicker';

const STEPS = [
  { label: 'Personal', icon: '👤' },
  { label: 'Professional', icon: '🧭' },
  { label: 'Documents', icon: '📄' },
  { label: 'Availability', icon: '📅' },
  { label: 'Location', icon: '📍' },
  { label: 'Review', icon: '✅' },
];

const LANGUAGES = ['Bengali', 'English', 'Hindi', 'Arabic', 'Chinese (Mandarin)', 'French', 'Japanese', 'Spanish', 'German'];
const SPECIALIZATIONS = ['Historical Heritage', 'Archaeological Sites', 'Religious Sites', 'Natural/Eco Tourism', 'Food & Culture', 'River & Coastal', 'Tea Gardens', 'Craft & Artisan', 'Photography Tours'];
const AREAS = ['Dhaka', 'Old Dhaka', 'Sonargaon', 'Sylhet', 'Srimangal', 'Chattogram', 'Cox\'s Bazar', 'Sundarbans', 'Rajshahi', 'Paharpur', 'Bagerhat', 'Khulna', 'Rangpur', 'Barishal'];
const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TOUR_TYPES = ['Half Day (4h)', 'Full Day (8h)', 'Multi-Day', 'Heritage Walk', 'Food Tour', 'Photography Tour', 'Custom'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all"
                style={done ? { background: 'var(--color-primary)', color: 'white' }
                  : active ? { background: '#7C3AED', color: 'white' }
                  : { background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                {done ? '✓' : s.icon}
              </div>
              <span className="text-xs text-center whitespace-nowrap" style={{ color: active ? '#7C3AED' : done ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 mb-4 transition-all flex-shrink-0" style={{ minWidth: 12, background: done ? 'var(--color-primary)' : 'var(--color-border)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function MultiSelect({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onToggle(o)}
          className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
          style={selected.includes(o)
            ? { borderColor: '#7C3AED', background: '#F5F3FF', color: '#7C3AED' }
            : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          {selected.includes(o) ? '✓ ' : ''}{o}
        </button>
      ))}
    </div>
  );
}

function DocCard({ label, hint, file, saved, onSelect }: {
  label: string;
  hint: string;
  file: File | null;
  saved: boolean;
  onSelect: (file: File | null) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all"
      style={{ borderColor: file || saved ? '#7C3AED' : 'var(--color-border)', background: file || saved ? '#F5F3FF' : 'white' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: file || saved ? '#7C3AED' : 'var(--color-surface-2)' }}>
        {file || saved ? <CheckCircle size={20} className="text-white" /> : <FileText size={20} style={{ color: 'var(--color-text-muted)' }} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{label}</p>
        <p className="truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{file?.name || (saved ? 'Already uploaded' : hint)}</p>
      </div>
      <span className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
        {file ? 'Change' : saved ? 'Replace' : 'Choose file'}
      </span>
      <input type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only"
        aria-label={`Upload ${label}`} onChange={event => {
          onSelect(event.target.files?.[0] ?? null);
          event.currentTarget.value = '';
        }} />
    </label>
  );
}

export default function GuideOnboarding() {
  const { currentUser, updateCurrentUser } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [langs, setLangs] = useState<string[]>(['Bengali', 'English']);
  const [specs, setSpecs] = useState<string[]>(['Historical Heritage']);
  const [areas, setAreas] = useState<string[]>(['Dhaka']);
  const [days, setDays] = useState<string[]>(['Saturday', 'Sunday', 'Friday']);
  const [tourTypes, setTourTypes] = useState<string[]>(['Full Day (8h)']);
  const [tourPrices, setTourPrices] = useState<Record<string, string>>({ 'Full Day (8h)': '3000' });
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [location, setLocation] = useState('Dhaka');
  const [pricePerDay, setPricePerDay] = useState('3000');
  const [halfDayPrice, setHalfDayPrice] = useState('1800');
  const [locationConsent, setLocationConsent] = useState<'yes' | 'no' | null>(null);
  const [phonePublic, setPhonePublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [guideLicenseDocument, setGuideLicenseDocument] = useState<File | null>(null);
  const [additionalDocument, setAdditionalDocument] = useState<File | null>(null);
  const [savedDocumentTypes, setSavedDocumentTypes] = useState<string[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    guidesApi.get(currentUser.id)
      .then((profile: any) => {
        if (cancelled) return;
        setBio(profile.bio || '');
        setYearsExperience(profile.yearsExperience ? String(profile.yearsExperience) : '');
        setLocation(profile.location || '');
        setPricePerDay(profile.pricePerDay > 0 ? String(profile.pricePerDay) : '3000');
        setLangs(Array.isArray(profile.languages) && profile.languages.length ? profile.languages : ['Bengali', 'English']);
        setSpecs(Array.isArray(profile.specializations) && profile.specializations.length ? profile.specializations : ['Historical Heritage']);
        setAreas(Array.isArray(profile.coverAreas) && profile.coverAreas.length ? profile.coverAreas : ['Dhaka']);
        setPhonePublic(!!profile.isPhonePublic);
        setTourTypes(Array.isArray(profile.tourTypes) && profile.tourTypes.length
          ? profile.tourTypes.map((tour: any) => tour.name)
          : ['Full Day (8h)']);
        setTourPrices(Object.fromEntries(
          (Array.isArray(profile.tourTypes) ? profile.tourTypes : []).map((tour: any) => [tour.name, String(tour.price)])
        ));
        const halfDay = profile.tourTypes?.find((tour: any) => tour.name.startsWith('Half Day'));
        if (halfDay?.price) setHalfDayPrice(String(halfDay.price));
      })
      .catch((error: unknown) => {
        if (!cancelled) setProfileLoadError(error instanceof Error ? error.message : 'Could not load your saved guide profile.');
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    documentsApi.list()
      .then((documents: any[]) => {
        if (!cancelled) setSavedDocumentTypes(documents.map(document => document.documentType));
      })
      .catch((error: unknown) => {
        if (!cancelled) setSubmitError(error instanceof Error ? error.message : 'Could not load your saved documents.');
      })
      .finally(() => {
        if (!cancelled) setDocumentsLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const inputCls = "w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white transition-colors"
    + " border-[var(--color-border)] focus:border-[#7C3AED]";

  function toggle(set: React.Dispatch<React.SetStateAction<string[]>>, val: string) {
    set(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  }

  function toggleTourType(name: string) {
    if (tourTypes.includes(name)) {
      setTourTypes(tourTypes.filter(item => item !== name));
      return;
    }
    const defaultPrice = name.startsWith('Half Day') ? halfDayPrice : pricePerDay;
    setTourTypes([...tourTypes, name]);
    setTourPrices(prices => ({ ...prices, [name]: prices[name] || defaultPrice }));
  }

  function selectDocument(file: File | null, setFile: (file: File | null) => void) {
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setSubmitError('Choose a PDF, JPG, or PNG document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('Documents must be 10 MB or smaller.');
      return;
    }
    setSubmitError('');
    setFile(file);
  }

  async function submitApplication() {
    if (!currentUser || profileLoading || profileLoadError) return;
    if (documentsLoading) {
      setSubmitError('Wait for your saved documents to finish loading.');
      setStep(2);
      return;
    }
    if (!identityDocument && !savedDocumentTypes.includes('identity')) {
      setSubmitError('Upload your National ID document before submitting.');
      setStep(2);
      return;
    }
    if (!profilePhotoFile && !currentUser.avatar) {
      setSubmitError('Add a profile photo before submitting your guide profile.');
      setStep(0);
      return;
    }
    const parsedDayRate = Number(pricePerDay);
    const parsedHalfDayRate = Number(halfDayPrice);
    if (!location.trim() || !bio.trim()) {
      setSubmitError('Add your location and a short professional bio before submitting.');
      return;
    }
    if (!Number.isFinite(parsedDayRate) || parsedDayRate <= 0
      || !Number.isFinite(parsedHalfDayRate) || parsedHalfDayRate <= 0) {
      setSubmitError('Enter valid prices greater than zero.');
      return;
    }
    const services = tourTypes.map(name => {
      const price = Number(tourPrices[name]);
      const duration = name.startsWith('Half Day') ? '4 hours'
        : name.startsWith('Full Day') ? '8 hours'
          : name === 'Multi-Day' ? '2 days' : '4 hours';
      return { name, duration, price, description: '' };
    });
    if (services.some(service => !Number.isFinite(service.price) || service.price <= 0)) {
      setSubmitError('Enter a valid price for each selected tour service.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const uploads: [File | null, 'identity' | 'guide_license' | 'other'][] = [
        [identityDocument, 'identity'],
        [guideLicenseDocument, 'guide_license'],
        [additionalDocument, 'other'],
      ];
      for (const [file, documentType] of uploads) {
        if (file) {
          await documentsApi.upload(file, documentType);
          setSavedDocumentTypes(previous => [...new Set([...previous, documentType])]);
        }
      }
      if (profilePhotoFile) {
        const { url } = await profileImagesApi.upload(profilePhotoFile);
        const { user } = await authApi.updateMe({ avatar: url });
        updateCurrentUser(user);
      }
      await guidesApi.update(currentUser.id, {
        bio: bio.trim(),
        location: location.trim(),
        yearsExperience: Math.max(0, Number(yearsExperience) || 0),
        pricePerDay: parsedDayRate,
        languages: langs,
        specializations: specs,
        coverAreas: areas,
        tourTypes: services,
        isLocationSharing: locationConsent === 'yes',
        isPhonePublic: phonePublic,
      });
      navigate(currentUser.verified ? '/guide-dashboard' : '/guide/verification-status');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save your guide profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
              Heritage<span style={{ color: 'var(--color-primary)' }}>BD</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>Guide Verification</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Complete your profile to become a verified guide</p>
        </div>

        <div className="bg-white rounded-2xl p-7 border" style={{ borderColor: 'var(--color-border)' }}>
          {profileLoadError && (
            <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <span>Could not load your saved profile: {profileLoadError}. Your existing details are protected from being overwritten.</span>
              <button type="button" onClick={() => window.location.reload()} className="font-semibold underline">Retry</button>
            </div>
          )}
          {profileLoading && <p className="mb-4 text-sm text-[var(--color-text-muted)]">Loading your saved guide information…</p>}
          {currentUser?.verified && <p className="mb-4 rounded-xl bg-[#E6F4EF] p-3 text-sm text-[#006A4E]">Edit your public guide profile and save it to update your listing.</p>}
          <StepBar current={step} />

          {/* Step 0: Personal */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>Personal Information</h2>
              <div className="flex items-center gap-5 mb-5">
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Profile Photo</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Required · Clear face photo · JPG, PNG or WebP</p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: '#7C3AED' }}>Photo will be shown to tourists</p>
                </div>
              </div>
              <ProfileImagePicker currentUrl={currentUser?.avatar} onFileSelected={setProfilePhotoFile} accentColor="#7C3AED" />
              {[
                { label: 'Full Name', placeholder: 'Your legal full name', type: 'text' },
                { label: 'Email Address', placeholder: 'you@example.com', type: 'email' },
                { label: 'Phone Number', placeholder: '01XXXXXXXXX', type: 'tel' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={f.label === 'Full Name' ? currentUser?.name || '' : f.label === 'Email Address' ? currentUser?.email || '' : currentUser?.phone || ''}
                    placeholder={f.placeholder}
                    readOnly
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Professional */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>Professional Information</h2>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Years of Experience</label>
                <input type="number" min="0" max="50" placeholder="e.g. 5" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Base Location</label>
                <input type="text" placeholder="City or area" value={location} onChange={e => setLocation(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Languages Spoken</label>
                <MultiSelect options={LANGUAGES} selected={langs} onToggle={v => toggle(setLangs, v)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Specializations</label>
                <MultiSelect options={SPECIALIZATIONS} selected={specs} onToggle={v => toggle(setSpecs, v)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Tour Areas / Coverage</label>
                <MultiSelect options={AREAS} selected={areas} onToggle={v => toggle(setAreas, v)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>About Yourself</label>
                <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell tourists about your experience, personality, and what makes your tours special..." className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Pricing</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Per Day (৳)</label>
                    <input type="number" min="1" value={pricePerDay} onChange={e => setPricePerDay(e.target.value)} placeholder="e.g. 3000" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Per Half Day (৳)</label>
                    <input type="number" min="1" value={halfDayPrice} onChange={e => setHalfDayPrice(e.target.value)} placeholder="e.g. 1800" className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-bold text-xl mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>Identity Verification</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
                Document verification is mandatory for all guides. Your information is securely handled.
              </p>
              <div className="space-y-3">
                <DocCard label="National ID Card (NID)" hint="Front and back · JPG, PNG, PDF · Max 10 MB"
                  file={identityDocument} saved={savedDocumentTypes.includes('identity')}
                  onSelect={file => selectDocument(file, setIdentityDocument)} />
                <DocCard label="Guide Certification / License" hint="Optional · PDF, JPG, or PNG · Max 10 MB"
                  file={guideLicenseDocument} saved={savedDocumentTypes.includes('guide_license')}
                  onSelect={file => selectDocument(file, setGuideLicenseDocument)} />
                <DocCard label="Additional Proof" hint="Optional · PDF, JPG, or PNG · Max 10 MB"
                  file={additionalDocument} saved={savedDocumentTypes.includes('other')}
                  onSelect={file => selectDocument(file, setAdditionalDocument)} />
              </div>
              <div className="mt-4 p-4 rounded-xl flex items-start gap-3" style={{ background: '#F5F3FF' }}>
                <Shield size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#7C3AED' }} />
                <p className="text-xs" style={{ color: '#5B21B6' }}>
                  Your documents are encrypted and stored securely. Only the HeritageBD verification team has access. Documents are deleted after verification is complete.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Availability */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>Availability</h2>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Available Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(d => (
                    <button key={d} type="button" onClick={() => toggle(setDays, d)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
                      style={days.includes(d)
                        ? { borderColor: '#7C3AED', background: '#F5F3FF', color: '#7C3AED' }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      {days.includes(d) && '✓ '}{d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Available From</label>
                  <input type="time" defaultValue="08:00" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Available Until</label>
                  <input type="time" defaultValue="20:00" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Tour Types Offered</label>
                <MultiSelect options={TOUR_TYPES} selected={tourTypes} onToggle={toggleTourType} />
                {tourTypes.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {tourTypes.map(name => (
                      <label key={name} className="block text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {name} price (৳)
                        <input
                          type="number"
                          min="1"
                          required
                          value={tourPrices[name] || ''}
                          onChange={event => setTourPrices(prices => ({ ...prices, [name]: event.target.value }))}
                          className={`${inputCls} mt-1`}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Maximum Group Size</label>
                <input type="number" min="1" max="50" placeholder="e.g. 10" className={inputCls} />
              </div>
            </div>
          )}

          {/* Step 4: Location Permission */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-bold text-xl mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>Location & Privacy</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                HeritageBD shows your approximate location on the map <strong>only when you manually enable "Available for Tour"</strong>. Your exact location is never permanently tracked.
              </p>

              <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: 'var(--color-border)' }}>
                <div className="px-5 py-3 text-sm font-bold" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
                  How location sharing works
                </div>
                <div className="p-5 space-y-3 text-sm">
                  {[
                    { icon: '🔴', text: 'Location OFF — You are invisible on the map. No tourist can see you.' },
                    { icon: '🟢', text: 'Available for Tour — Your approximate location is shown to nearby tourists.' },
                    { icon: '🔒', text: 'Your exact GPS coordinates are never stored or shared.' },
                    { icon: '✋', text: 'You can toggle availability on/off anytime from your dashboard.' },
                  ].map(item => (
                    <div key={item.text} className="flex items-start gap-3">
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      <p style={{ color: 'var(--color-text)' }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Allow location sharing for the guide feature?</p>
                <div className="space-y-3">
                  <button onClick={() => setLocationConsent('yes')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all"
                    style={locationConsent === 'yes'
                      ? { borderColor: 'var(--color-primary)', background: '#E6F4EF' }
                      : { borderColor: 'var(--color-border)', background: 'white' }}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${locationConsent === 'yes' ? 'border-green-600' : 'border-gray-300'}`}>
                      {locationConsent === 'yes' && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Allow location sharing</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>You can turn it on/off anytime from your dashboard</p>
                    </div>
                  </button>
                  <button onClick={() => setLocationConsent('no')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all"
                    style={locationConsent === 'no'
                      ? { borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }
                      : { borderColor: 'var(--color-border)', background: 'white' }}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${locationConsent === 'no' ? 'border-gray-400' : 'border-gray-300'}`}>
                      {locationConsent === 'no' && <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Not now</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>You can enable it later in your profile settings</p>
                    </div>
                  </button>
                </div>
              </div>

              {locationConsent === 'yes' && (
                <div className="p-4 rounded-xl flex items-center gap-2" style={{ background: '#E6F4EF' }}>
                  <CheckCircle size={16} style={{ color: 'var(--color-primary)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Location permission granted. You can disable this anytime.</p>
                </div>
              )}
              <label className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={phonePublic}
                  onChange={event => setPhonePublic(event.target.checked)}
                  disabled={!currentUser?.phone}
                  className="mt-1 accent-[#7C3AED]"
                />
                <span>
                  <span className="block text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Show my phone number on my public guide profile</span>
                  <span className="mt-1 block text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Tourists can call or message this number, including when you are unavailable. You can change this anytime from your guide dashboard.
                    {currentUser?.phone ? ` Number: ${currentUser.phone}` : ' Add a phone number to your account first; public phone sharing is unavailable until then.'}
                  </span>
                </span>
              </label>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>Review & Submit</h2>
              {[
                { section: 'Personal Information', items: [['Name', currentUser?.name || ''], ['Email', currentUser?.email || ''], ['Phone', currentUser?.phone || 'Not provided']] },
                { section: 'Professional', items: [['Experience', `${yearsExperience || '0'} years`], ['Location', location], ['Languages', langs.join(', ')], ['Specializations', specs.join(', ')], ['Tour Areas', areas.join(', ')], ['Pricing', `৳${pricePerDay}/day · ৳${halfDayPrice}/half-day`], ['About', bio || 'Not provided']] },
                { section: 'Documents', items: [['NID', '✓ Uploaded'], ['Certification', '✓ Uploaded']] },
                { section: 'Availability', items: [['Days', days.join(', ')], ['Hours', '8:00 AM – 8:00 PM'], ['Tour Types', tourTypes.map(name => `${name} · ৳${tourPrices[name] || '0'}`).join(', ')]] },
                { section: 'Location & Contact', items: [['Location sharing', locationConsent === 'yes' ? '✓ Allowed' : 'Not now (can enable later)'], ['Public phone number', phonePublic ? currentUser?.phone || 'No phone number on account' : 'Private']] },
              ].map(group => (
                <div key={group.section} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                    {group.section}
                  </div>
                  {group.items.map(([k, v]) => (
                    <div key={k} className="flex justify-between px-4 py-3 text-sm border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                      <span className="font-medium text-right max-w-[55%]" style={{ color: 'var(--color-text)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}

              <div className="p-4 rounded-2xl border-2" style={{ borderColor: '#7C3AED', background: '#F5F3FF' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#5B21B6' }}>Important notice:</p>
                <ul className="text-xs space-y-1" style={{ color: '#6D28D9' }}>
                  <li>✓ Your application will be reviewed within 3–7 business days</li>
                  <li>✓ You will not receive the Verified Guide badge until approved</li>
                  <li>✓ You may be asked to provide additional documents</li>
                  <li>✓ All submitted information must be accurate and truthful</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl border-2 font-semibold text-sm transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button
              onClick={step === 5 ? submitApplication : () => setStep(s => s + 1)}
              disabled={submitting || profileLoading || !!profileLoadError}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90"
              style={{ background: step === 5 ? 'var(--color-primary)' : '#7C3AED' }}>
              {submitError && step === 5 ? <span role="alert" className="sr-only">{submitError}</span> : null}
              {step === 5 ? submitting ? 'Saving profile…' : currentUser?.verified ? 'Save profile changes' : '🚀 Submit for Verification' : <><span>{STEPS[step + 1]?.label}</span><ArrowRight size={15} /></>}
            </button>
          </div>
          {step === 5 && submitError && <p role="alert" className="mt-3 text-sm text-red-600">{submitError}</p>}
        </div>
      </div>
    </div>
  );
}
