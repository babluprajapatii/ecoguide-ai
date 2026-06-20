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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ecoguide-ai.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'EcoGuide AI — AI-Powered Carbon Footprint & Sustainability Platform',
    template: '%s | EcoGuide AI',
  },
  description:
    'Track, reduce, and optimize your carbon footprint with AI-powered coaching, interactive assessments, real-time simulations, and community challenges. Start living greener today.',
  keywords: [
    'sustainability',
    'carbon footprint',
    'eco-friendly',
    'AI sustainability coach',
    'environmental impact',
    'green living',
    'climate action',
    'carbon calculator',
    'eco goals',
    'community leaderboard',
  ],
  authors: [{ name: 'EcoGuide AI Team', url: APP_URL }],
  creator: 'EcoGuide AI Team',
  publisher: 'EcoGuide AI',
  category: 'environment',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'EcoGuide AI',
    title: 'EcoGuide AI — AI-Powered Carbon Footprint & Sustainability Platform',
    description:
      'Track, reduce, and optimize your carbon footprint with AI-powered coaching, interactive assessments, and community challenges.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EcoGuide AI — Your AI-powered sustainability companion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EcoGuide AI — AI-Powered Carbon Footprint Platform',
    description:
      'Track, reduce, and optimize your carbon footprint with AI coaching, simulations, and community challenges.',
    images: ['/og-image.png'],
    creator: '@ecoguideai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: APP_URL,
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0f0d' },
    { media: '(prefers-color-scheme: light)', color: '#f0fdf4' },
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
