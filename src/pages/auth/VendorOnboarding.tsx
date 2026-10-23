import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft, Upload, Store, MapPin, Image, AlertCircle, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authApi, documentsApi, profileImagesApi, vendorApi } from '../../services/api';
import ProfileImagePicker from '../../components/ui/ProfileImagePicker';

const STEPS = [
  { label: 'Personal Info', icon: '👤' },
  { label: 'Business Info', icon: '🏪' },
  { label: 'Documents', icon: '📄' },
  { label: 'Shop Setup', icon: '🖼️' },
  { label: 'Review', icon: '✅' },
];

const BUSINESS_TYPES = ['Sole Proprietorship', 'Partnership', 'Private Limited', 'NGO / Co-operative', 'Other'];
const DISTRICTS = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'];
const CATEGORIES = ['GI Products', 'Handicrafts', 'Traditional Clothing', 'Food & Delicacies', 'Pottery', 'Jewelry', 'Artisan Products', 'Souvenirs'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center min-w-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mb-1 transition-all"
                style={done ? { background: 'var(--color-primary)', color: 'white' }
                  : active ? { background: '#D4A017', color: 'white' }
                  : { background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                {done ? '✓' : s.icon}
              </div>
              <span className="text-xs text-center" style={{ color: active ? '#D4A017' : done ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 mb-4 transition-all" style={{ background: done ? 'var(--color-primary)' : 'var(--color-border)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function VendorOnboarding() {
  const { currentUser, updateCurrentUser } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    shopName: '',
    businessType: '',
    businessAddress: '',
    location: '',
    shopDescription: '',
    nidNumber: '',
    tradeLicense: '',
    shopImage: '',
    shopCoverImage: '',
    productCategories: [] as string[],
    pickupLocation: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [uploadedDocumentTypes, setUploadedDocumentTypes] = useState<string[]>([]);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [shopLogoFile, setShopLogoFile] = useState<File | null>(null);
  const [shopCoverFile, setShopCoverFile] = useState<File | null>(null);
  const [shopLogoPreview, setShopLogoPreview] = useState<string | null>(null);
  const [shopCoverPreview, setShopCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!shopLogoFile) {
      setShopLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(shopLogoFile);
    setShopLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [shopLogoFile]);

  useEffect(() => {
    if (!shopCoverFile) {
      setShopCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(shopCoverFile);
    setShopCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [shopCoverFile]);

  useEffect(() => {
    let active = true;
    Promise.all([vendorApi.profile(), documentsApi.list()])
      .then(([profile, documents]) => {
        if (!active) return;
        setForm(current => ({ ...current, ...profile }));
        setUploadedDocumentTypes(documents.map((document: any) => document.documentType));
      })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your vendor profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  function setField(key: keyof typeof form, value: string | string[]) {
    setForm(current => ({ ...current, [key]: value }));
    setError('');
  }

  function toggleCategory(c: string) {
    setForm(current => ({
      ...current,
      productCategories: current.productCategories.includes(c)
        ? current.productCategories.filter(category => category !== c)
        : [...current.productCategories, c],
    }));
    setError('');
  }

  async function handleSubmit() {
    if (!identityFile && !uploadedDocumentTypes.includes('identity')) {
      setError('Upload your National ID document before submitting.');
      setStep(2);
      return;
    }
    if (!licenseFile && !uploadedDocumentTypes.includes('business_license')) {
      setError('Upload your trade license document before submitting.');
      setStep(2);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const profile = { ...form };
      if (shopLogoFile) profile.shopImage = (await vendorApi.uploadShopImage(shopLogoFile)).url;
      if (shopCoverFile) profile.shopCoverImage = (await vendorApi.uploadShopImage(shopCoverFile)).url;
      await vendorApi.updateProfile(profile);
      setForm(current => ({ ...current, shopImage: profile.shopImage, shopCoverImage: profile.shopCoverImage }));
      setShopLogoFile(null);
      setShopCoverFile(null);
      if (profilePhotoFile) {
        const { url } = await profileImagesApi.upload(profilePhotoFile);
        const { user } = await authApi.updateMe({ avatar: url });
        updateCurrentUser(user);
      }
      if (identityFile) {
        await documentsApi.upload(identityFile, 'identity');
        setUploadedDocumentTypes(previous => [...previous, 'identity']);
        setIdentityFile(null);
      }
      if (licenseFile) {
        await documentsApi.upload(licenseFile, 'business_license');
        setUploadedDocumentTypes(previous => [...previous, 'business_license']);
        setLicenseFile(null);
      }
      navigate('/vendor/verification-status');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your vendor application.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white transition-colors"
    + " border-[var(--color-border)] focus:border-[var(--color-primary)]";

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>
              Heritage<span style={{ color: 'var(--color-primary)' }}>BD</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>Vendor Onboarding</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Complete all steps to activate your seller account</p>
        </div>

        <div className="bg-white rounded-2xl p-7 border" style={{ borderColor: 'var(--color-border)' }}>
          <StepBar current={step} />

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {loading ? (
            <p className="py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading your vendor profile…</p>
          ) : <>
          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-xl mb-4" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>Personal Information</h2>
              <ProfileImagePicker currentUrl={currentUser?.avatar} onFileSelected={setProfilePhotoFile} />
              {[
                { label: 'Full Name', value: currentUser?.name || '' },
                { label: 'Email Address', value: currentUser?.email || '' },
                { label: 'Phone Number', value: currentUser?.phone || '' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>{f.label}</label>
                  <input type="text" value={f.value} readOnly className={inputCls} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>National ID Number</label>
                <input type="text" value={form.nidNumber} onChange={e => setField('nidNumber', e.target.value)} placeholder="Your NID number" className={inputCls} />
              </div>
            </div>
          )}

          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-xl mb-4" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>Business Information</h2>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Shop Name</label>
                <input type="text" value={form.shopName} onChange={e => setField('shopName', e.target.value)} placeholder="Your shop or business name" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Business Type</label>
                <select value={form.businessType} onChange={e => setField('businessType', e.target.value)} className={inputCls}>
                  <option value="">Select business type</option>
                  {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Business Address</label>
                <textarea value={form.businessAddress} onChange={e => setField('businessAddress', e.target.value)} placeholder="Full business address" rows={2} className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>District</label>
                  <select value={form.location} onChange={e => setField('location', e.target.value)} className={inputCls}>
                    <option value="">Select district</option>
                    {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Trade License No.</label>
                  <input type="text" value={form.tradeLicense} onChange={e => setField('tradeLicense', e.target.value)} placeholder="Optional" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Business Description</label>
                <textarea value={form.shopDescription} onChange={e => setField('shopDescription', e.target.value)} placeholder="Describe your shop, products, and what makes your products unique..." rows={3} className={`${inputCls} resize-none`} />
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-bold text-xl mb-2" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>Upload Documents</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
                Upload clear PDF, JPG, or PNG copies (up to 10 MB each). These documents are private and visible only to the verification team.
              </p>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Trade License Number</label>
              <input type="text" value={form.tradeLicense} onChange={e => setField('tradeLicense', e.target.value)} placeholder="Trade license number (optional)" className={inputCls} />
              {[
                { label: 'National ID document', file: identityFile, saved: uploadedDocumentTypes.includes('identity'), set: setIdentityFile },
                { label: 'Trade license document', file: licenseFile, saved: uploadedDocumentTypes.includes('business_license'), set: setLicenseFile },
              ].map(document => (
                <label key={document.label} className="block rounded-xl border-2 border-dashed p-4" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    <FileText size={16} /> {document.label} *
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    className="mt-2 block w-full text-sm"
                    onChange={event => document.set(event.target.files?.[0] || null)}
                  />
                  <span className="mt-1 block text-xs" style={{ color: document.saved ? '#006A4E' : 'var(--color-text-muted)' }}>
                    {document.file?.name || (document.saved ? 'Previously uploaded' : 'PDF, JPG or PNG · Maximum 10 MB')}
                  </span>
                </label>
              ))}
              <div className="mt-4 p-3 rounded-xl flex items-start gap-2" style={{ background: '#FFFBEB' }}>
                <AlertCircle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">Do not upload bank statements or payment credentials. Your documents are stored privately and can only be viewed by an administrator.</p>
              </div>
            </div>
          )}

          {/* Step 3: Shop Setup */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-bold text-xl mb-4" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>Shop Setup</h2>

              <label className="block cursor-pointer">
                <span className="mb-2 block text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Shop Logo</span>
                <span className="flex items-center gap-4 rounded-xl border-2 border-dashed p-3 hover:border-green-500"
                  style={{ borderColor: 'var(--color-border)' }}>
                  {(shopLogoPreview || form.shopImage)
                    ? <img src={shopLogoPreview || form.shopImage} alt="Shop logo preview" className="h-16 w-16 rounded-xl object-cover" />
                    : <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--color-surface-2)]"><Image size={22} style={{ color: 'var(--color-text-muted)' }} /></span>}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>{shopLogoFile?.name || (form.shopImage ? 'Replace shop logo' : 'Choose shop logo')}</span>
                    <span className="block text-xs" style={{ color: 'var(--color-text-muted)' }}>JPG, PNG or WebP · maximum 5 MB · square recommended</span>
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose shop logo"
                    onChange={event => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
                        setError('Choose a JPG, PNG, or WebP shop logo up to 5 MB.');
                      } else {
                        setError('');
                        setShopLogoFile(file);
                      }
                      event.currentTarget.value = '';
                    }} />
                </span>
              </label>

              <label className="block cursor-pointer">
                <span className="mb-2 block text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Shop Cover Image</span>
                <span className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed hover:border-green-500"
                  style={{ borderColor: 'var(--color-border)' }}>
                  {(shopCoverPreview || form.shopCoverImage)
                    ? <img src={shopCoverPreview || form.shopCoverImage} alt="Shop cover preview" className="absolute inset-0 h-full w-full object-cover" />
                    : <span className="flex flex-col items-center"><Upload size={22} style={{ color: 'var(--color-text-muted)' }} /><span className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>Choose a cover image · JPG, PNG or WebP · maximum 5 MB</span></span>}
                  {(shopCoverPreview || form.shopCoverImage) && <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white">{shopCoverFile?.name || 'Replace cover image'}</span>}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose shop cover image"
                    onChange={event => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
                        setError('Choose a JPG, PNG, or WebP shop cover up to 5 MB.');
                      } else {
                        setError('');
                        setShopCoverFile(file);
                      }
                      event.currentTarget.value = '';
                    }} />
                </span>
              </label>

              {/* Product categories */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Product Categories (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => toggleCategory(c)} type="button"
                      className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
                      style={form.productCategories.includes(c)
                        ? { borderColor: 'var(--color-primary)', background: '#E6F4EF', color: 'var(--color-primary)' }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      {form.productCategories.includes(c) && '✓ '}{c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pickup location */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Pickup / Collection Point</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-primary)' }} />
                  <input type="text" value={form.pickupLocation} onChange={e => setField('pickupLocation', e.target.value)} placeholder="Address where tourists can pick up products" className={`${inputCls} pl-10`} />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-bold text-xl mb-4" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>Review & Submit</h2>
              {[
                { section: 'Personal Information', items: [['Full Name', currentUser?.name || ''], ['Email', currentUser?.email || ''], ['Phone', currentUser?.phone || 'Not provided'], ['NID', form.nidNumber || 'Not provided']] },
                { section: 'Business Information', items: [['Shop Name', form.shopName], ['Business Type', form.businessType], ['District', form.location], ['Address', form.businessAddress], ['Description', form.shopDescription]] },
                { section: 'Documents', items: [['National ID', form.nidNumber || 'Not provided'], ['Trade License', form.tradeLicense || 'Not provided']] },
                { section: 'Shop Setup', items: [['Categories', form.productCategories.join(', ') || 'Not selected'], ['Pickup Location', form.pickupLocation]] },
              ].map(group => (
                <div key={group.section} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                    {group.section}
                  </div>
                  <div className="divide-y divide-[var(--color-border)]">
                    {group.items.map(([k, v]) => (
                      <div key={k} className="flex justify-between px-4 py-3 text-sm">
                        <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="p-4 rounded-2xl border-2" style={{ borderColor: 'var(--color-primary)', background: '#E6F4EF' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>By submitting, you confirm that:</p>
                <ul className="text-xs space-y-1" style={{ color: '#004D38' }}>
                  <li>✓ All information provided is accurate and truthful</li>
                  <li>✓ Uploaded documents are valid and belong to you</li>
                  <li>✓ You agree to HeritageBD Vendor Terms & Conditions</li>
                  <li>✓ You understand that admin review may take 2–5 business days</li>
                </ul>
              </div>
            </div>
          )}
          </>}

          {/* Navigation */}
          {!loading && <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl border-2 font-semibold text-sm transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button
              onClick={step === 4 ? handleSubmit : () => setStep(s => s + 1)}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90"
              style={{ background: step === 4 ? 'var(--color-primary)' : '#D4A017' }}>
              {step === 4 ? saving ? 'Submitting…' : 'Submit for Verification' : <><span>{STEPS[step + 1]?.label}</span><ArrowRight size={15} /></>}
            </button>
          </div>}
        </div>
      </div>
    </div>
  );
}
