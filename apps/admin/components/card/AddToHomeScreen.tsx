'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AddToHomeScreen() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    const isDismissed = sessionStorage.getItem('a2hs-dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Check if iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isInStandaloneMode) {
      setShowIOSPrompt(true);
    }

    // Listen for beforeinstallprompt (Chrome/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('a2hs-dismissed', 'true');
  };

  if (dismissed) return null;

  // Android/Chrome prompt
  if (deferredPrompt) {
    return (
      <div className="a2hs-prompt">
        <div className="a2hs-content">
          <div className="a2hs-icon">📱</div>
          <div className="a2hs-text">
            <strong>Add to Home Screen</strong>
            <p>Quick access to your stamp card anytime</p>
          </div>
        </div>
        <div className="a2hs-actions">
          <button className="a2hs-dismiss" onClick={handleDismiss}>
            Not now
          </button>
          <button className="a2hs-install" onClick={handleInstall}>
            Install
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari prompt
  if (showIOSPrompt) {
    return (
      <div className="a2hs-prompt a2hs-prompt--ios">
        <button className="a2hs-close" onClick={handleDismiss}>×</button>
        <div className="a2hs-content">
          <div className="a2hs-icon">📱</div>
          <div className="a2hs-text">
            <strong>Add to Home Screen</strong>
            <p>
              Tap <span className="a2hs-share-icon">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6a2 2 0 01-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3a2 2 0 012 2z"/>
                </svg>
              </span> then &quot;Add to Home Screen&quot;
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
