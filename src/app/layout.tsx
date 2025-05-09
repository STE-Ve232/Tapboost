
// No "use client" here
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import LayoutClientContent from '@/components/layout-client-content'; // New component

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TapBoost - Tap to Earn',
  description: 'Tap to Earn - Earn rewards by tapping and referring friends!',
  manifest: '/manifest.json',
  themeColor: '#f5f7fa',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TapBoost',
  },
  icons: {
    apple: '/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col items-center box-border overflow-y-auto`}
      >
        <LayoutClientContent>
          {children}
        </LayoutClientContent>
      </body>
    </html>
  );
}
