// SEO Optimization Component
import { Metadata } from 'next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  locale?: string;
}

export const generateSEOMetadata = ({
  title = 'LinguaSage - آموزش زبان آلمانی آنلاین',
  description = 'بهترین پلتفرم آموزش زبان آلمانی با معلمان متخصص و روش‌های نوین یادگیری',
  keywords = ['آموزش آلمانی', 'زبان آلمانی', 'کلاس آنلاین', 'معلم آلمانی'],
  image = '/og-image.jpg',
  url = 'https://linguasage.com',
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'LinguaSage Team',
  locale = 'fa_IR'
}: SEOProps = {}): Metadata => {
  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: author }],
    creator: author,
    publisher: 'LinguaSage',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type,
      locale,
      url,
      title,
      description,
      siteName: 'LinguaSage',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@linguasage',
      site: '@linguasage',
    },
    alternates: {
      canonical: url,
      languages: {
        'fa-IR': `${url}/fa`,
        'en-US': `${url}/en`,
        'de-DE': `${url}/de`,
      },
    },
    verification: {
      google: 'your-google-verification-code',
      yandex: 'your-yandex-verification-code',
    },
    category: 'education',
    classification: 'Education, Language Learning',
    referrer: 'origin-when-cross-origin',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(url),
    manifest: '/manifest.json',
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        {
          rel: 'mask-icon',
          url: '/safari-pinned-tab.svg',
          color: '#5bbad5',
        },
      ],
    },
    applicationName: 'LinguaSage',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'LinguaSage',
    },
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'msapplication-TileColor': '#ffffff',
      'theme-color': '#ffffff',
    },
  };
};

// Structured Data Generator
export const generateStructuredData = () => {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'LinguaSage',
    description: 'پلتفرم آموزش زبان آلمانی آنلاین',
    url: 'https://linguasage.com',
    logo: 'https://linguasage.com/logo.png',
    sameAs: [
      'https://facebook.com/linguasage',
      'https://twitter.com/linguasage',
      'https://instagram.com/linguasage',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+98-21-1234-5678',
      contactType: 'customer service',
      availableLanguage: ['Persian', 'German', 'English']
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Tehran',
      addressCountry: 'IR'
    }
  };

  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LinguaSage',
    url: 'https://linguasage.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://linguasage.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  return [organizationData, websiteData];
};