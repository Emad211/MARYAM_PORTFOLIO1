import type { MetadataRoute } from 'next';
import { getPosts, getClasses } from '@/lib/cms-store';

// Public-client reads only → stays ISR-cacheable alongside the pages it lists.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://fluentiaa.ir';

  const staticEntries: MetadataRoute.Sitemap = ['', '/about', '/blog', '/classes', '/contact'].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
    }),
  );

  const [posts, classes] = await Promise.all([getPosts(), getClasses()]);

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  const classEntries: MetadataRoute.Sitemap = classes.map((cls) => ({
    url: `${base}/classes/${cls.slug}`,
  }));

  return [...staticEntries, ...postEntries, ...classEntries];
}
