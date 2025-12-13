import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth/AuthProvider';
import './globals.css';

export const metadata = {
  title: 'Tap & Stamp Admin',
  description: 'Wallet-based loyalty management for cafés'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
