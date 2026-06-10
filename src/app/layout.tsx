import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'EcoGuide AI - Your Sustainable Living Assistant',
    template: '%s | EcoGuide AI',
  },
  description:
    'EcoGuide AI helps you make sustainable choices through AI-powered assessments, coaching, and community engagement. Track your environmental impact and join the green revolution.',
  keywords: ['sustainability', 'eco-friendly', 'AI', 'environmental impact', 'green living'],
  authors: [{ name: 'EcoGuide AI Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'EcoGuide AI',
    title: 'EcoGuide AI - Your Sustainable Living Assistant',
    description:
      'AI-powered sustainability coaching and environmental impact tracking.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EcoGuide AI',
    description:
      'AI-powered sustainability coaching and environmental impact tracking.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
