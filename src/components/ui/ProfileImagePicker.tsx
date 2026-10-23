import React, { useEffect, useState } from 'react';
import { Camera, Upload } from 'lucide-react';

interface ProfileImagePickerProps {
  currentUrl?: string | null;
  onFileSelected: (file: File | null) => void;
  accentColor?: string;
}

export default function ProfileImagePicker({
  currentUrl,
  onFileSelected,
  accentColor = '#006A4E',
}: ProfileImagePickerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError('Profile photos must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }
    setError('');
    setFile(selected);
    onFileSelected(selected);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div
        className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 bg-gray-100"
        style={{ borderColor: accentColor }}
      >
        {previewUrl || currentUrl
          ? <img src={previewUrl || currentUrl || ''} alt="Profile photo preview" className="h-full w-full object-cover" />
          : <Camera size={26} aria-hidden="true" style={{ color: accentColor }} />}
      </div>
      <div className="min-w-0 flex-1">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-2"
          style={{ borderColor: accentColor, color: accentColor }}>
          <Upload size={15} aria-hidden="true" />
          {currentUrl || file ? 'Change profile photo' : 'Add profile photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={selectFile}
            className="sr-only"
            aria-label="Choose profile photo"
          />
        </label>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {file ? file.name : 'JPG, PNG or WebP · maximum 5 MB'}
        </p>
        {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
      </div>
    </div>
  );
}
