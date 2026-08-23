import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/login', '/signup', '/forgot-password'],
      },
    ],
    sitemap: 'https://fluentiaa.ir/sitemap.xml',
  };
}
