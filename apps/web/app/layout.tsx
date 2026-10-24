import React from 'react';
import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'Print Bot — Enterprise Multi-Tenant SaaS',
  description: 'The Xerox counter, reimagined for Indian print shops. Unified multi-tenant cloud & Windows desktop workstation.',
};
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script src="/theme.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
