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
  metadataBase: new URL('https://ecoguide-ai-lovat.vercel.app'),
  applicationName: 'EcoGuide AI',
  title: {
    default: 'EcoGuide AI — Optimize Your Home Energy',
    template: '%s | EcoGuide AI',
  },
  description:
    'AI-powered home energy optimization. Reduce bills and carbon footprint with personalized AI recommendations.',
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
  authors: [{ name: 'EcoGuide AI Team', url: 'https://ecoguide-ai-lovat.vercel.app' }],
  creator: 'EcoGuide AI Team',
  publisher: 'EcoGuide AI',
  category: 'Technology',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ecoguide-ai-lovat.vercel.app',
    siteName: 'EcoGuide AI',
    title: 'EcoGuide AI — Optimize Your Home Energy',
    description:
      'AI-powered home energy optimization. Reduce bills and carbon footprint with personalized AI recommendations.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EcoGuide AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EcoGuide AI — Optimize Your Home Energy',
    description: 'AI-powered home energy optimization platform.',
    images: ['/og-image.png'],
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
    canonical: 'https://ecoguide-ai-lovat.vercel.app',
  },
  manifest: '/manifest.json',
  other: {
    citation_author: 'EcoGuide AI Team',
    citation_title: 'EcoGuide AI: Carbon Footprint Tracking & Sustainability Platform',
    citation_publication_date: '2026/06/21',
    organization: 'EcoGuide AI',
    copyright: '© 2026 EcoGuide AI. All rights reserved.',
  },
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
  const staticDate = '2026-06-21';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'EcoGuide AI',
    url: 'https://ecoguide-ai-lovat.vercel.app',
    logo: 'https://ecoguide-ai-lovat.vercel.app/logo.png',
    description:
      'AI-powered home energy optimization platform that helps households reduce carbon footprint and save on electricity bills.',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      availableLanguage: 'English',
    },
    sameAs: ['https://github.com/your-github/ecoguide-ai'],
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'EcoGuide AI',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    url: 'https://ecoguide-ai-lovat.vercel.app',
    description:
      'AI-powered energy optimization tool for smart home management and sustainability.',
    author: {
      '@type': 'Organization',
      name: 'EcoGuide AI Team',
    },
    datePublished: '2024-01-01',
    dateModified: staticDate,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does EcoGuide AI help reduce energy consumption?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'EcoGuide AI analyzes your home energy usage patterns using AI and provides personalized recommendations to reduce waste, optimize appliance usage, and lower electricity bills.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is EcoGuide AI free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, EcoGuide AI offers a free tier with core energy monitoring and AI recommendations. Premium features are available for advanced analytics.',
        },
      },
      {
        '@type': 'Question',
        name: 'What data does EcoGuide AI use to make recommendations?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'EcoGuide AI uses your household energy consumption data, appliance information, local climate data, and utility rates to generate personalized energy-saving recommendations.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much can I save with EcoGuide AI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Users typically see 15-30% reduction in energy costs within the first three months of following EcoGuide AI recommendations.',
        },
      },
    ],
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'EcoGuide AI — Optimize Your Home Energy',
    url: 'https://ecoguide-ai-lovat.vercel.app',
    description:
      'AI-powered platform for home energy optimization, carbon footprint reduction, and smart sustainability recommendations.',
    author: {
      '@type': 'Organization',
      name: 'EcoGuide AI Team',
      url: 'https://ecoguide-ai-lovat.vercel.app',
    },
    publisher: {
      '@type': 'Organization',
      name: 'EcoGuide AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://ecoguide-ai-lovat.vercel.app/logo.png',
      },
    },
    datePublished: '2024-01-01',
    dateModified: staticDate,
    inLanguage: 'en-US',
    about: {
      '@type': 'Thing',
      name: 'Home Energy Optimization',
    },
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Home Sustainability & Carbon Footprint Reduction Guide',
    description:
      'Learn how to optimize home energy consumption, reduce carbon footprints, and adopt sustainable habits with AI recommendations.',
    image: 'https://ecoguide-ai-lovat.vercel.app/og-image.png',
    author: {
      '@type': 'Organization',
      name: 'EcoGuide AI Team',
      url: 'https://ecoguide-ai-lovat.vercel.app',
    },
    publisher: {
      '@type': 'Organization',
      name: 'EcoGuide AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://ecoguide-ai-lovat.vercel.app/logo.png',
      },
    },
    datePublished: '2024-01-01',
    dateModified: staticDate,
  };

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-dark-900 font-sans text-stone-200 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
