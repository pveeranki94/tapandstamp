'use client';

import { useState, useRef } from 'react';
import styles from './LogoUpload.module.css';

interface LogoUploadProps {
  currentUrl: string;
  onUpload: (url: string) => void;
  merchantSlug?: string;
}

export function LogoUpload({ currentUrl, onUpload, merchantSlug }: LogoUploadProps) {
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

      // If merchantSlug is provided, upload to storage
      if (merchantSlug) {
        const formData = new FormData();
        formData.append('logo', file);
        formData.append('slug', merchantSlug);

        const response = await fetch('/api/upload/logo', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const { url } = await response.json();
        onUpload(url);
      } else {
        // Without merchantSlug, just use preview URL (for wizard before saving)
        onUpload(previewUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
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
