'use client';

import { useState, useRef } from 'react';
import styles from './LogoUpload.module.css';

interface LogoUploadProps {
  currentUrl: string;
  onUpload: (url: string) => void;
}

export function LogoUpload({ currentUrl, onUpload }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // TODO: Implement actual upload to storage
      // For now, just use the preview URL (in production, upload to Supabase Storage or CDN)

      // Simulating upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In production:
      // const formData = new FormData();
      // formData.append('logo', file);
      // const response = await fetch('/api/upload/logo', {
      //   method: 'POST',
      //   body: formData
      // });
      // const { url } = await response.json();

      onUpload(previewUrl);
    } catch (err) {
      setError('Failed to upload logo');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview('');
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
      />

      {preview ? (
        <div className={styles.preview}>
          <img src={preview} alt="Logo preview" className={styles.image} />
          <div className={styles.actions}>
            <button
              onClick={handleClick}
              disabled={uploading}
              className={styles.changeButton}
            >
              Change Logo
            </button>
            <button
              onClick={handleRemove}
              disabled={uploading}
              className={styles.removeButton}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={uploading}
          className={styles.uploadButton}
        >
          {uploading ? 'Uploading...' : 'Upload Logo'}
        </button>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.hint}>
        Recommended: Square image, at least 300×300px, PNG or JPG format
      </div>
    </div>
  );
}
