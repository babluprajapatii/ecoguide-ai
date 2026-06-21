import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ecoguide-ai-lovat.vercel.app';
  const routes = [
    '',
    '/assessment',
    '/dashboard',
    '/coach',
    '/community',
    '/simulator',
    '/badges',
    '/settings',
    '/login',
    '/register',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date('2026-06-21'),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
