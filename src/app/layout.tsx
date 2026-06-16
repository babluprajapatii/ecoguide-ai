import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: {
    default: 'EcoGuide AI - Optimize Your Home, Lower Utility Bills',
    template: '%s | EcoGuide AI',
  },
  description:
    'The sustainable living platform that combines AI guidance, carbon footprint tracking, and smart home integration to help you live greener — effortlessly.',
  keywords: ['sustainability', 'eco-friendly', 'AI', 'environmental impact', 'green living'],
  authors: [{ name: 'EcoGuide AI Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'EcoGuide AI',
    title: 'EcoGuide AI - Optimize Your Home, Lower Utility Bills',
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
    { media: '(prefers-color-scheme: dark)', color: '#0a0f0d' },
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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-dark-900 font-sans antialiased text-stone-200 overflow-x-hidden">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
