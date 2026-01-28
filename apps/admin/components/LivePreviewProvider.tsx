'use client';

import { ContentfulLivePreviewProvider } from '@contentful/live-preview/react';

interface LivePreviewProviderProps {
  children: React.ReactNode;
  isEnabled: boolean;
}

export function LivePreviewProvider({ children, isEnabled }: LivePreviewProviderProps) {
  return (
    <ContentfulLivePreviewProvider
      locale="en-US"
      enableInspectorMode={isEnabled}
      enableLiveUpdates={isEnabled}
    >
      {children}
    </ContentfulLivePreviewProvider>
  );
}
