
"use client";

import { useLanguage } from '@/context/language-context';
import { type Post, type Class, type HomeContent, type AboutContent, type ContactContent } from '@/lib/types';
import Head from 'next/head';

interface MetadataProps {
  post?: Post;
  classInfo?: Class;
  homeContent?: HomeContent;
  aboutContent?: AboutContent;
  contactContent?: ContactContent;
  pageType?: 'post' | 'class' | 'home' | 'about' | 'contact' | 'generic';
  pageTitle?: string;
  pageDescription?: string;
  pagePath: string;
}

export function Metadata({
  post,
  classInfo,
  homeContent,
  aboutContent,
  contactContent,
  pageType = 'generic',
  pageTitle,
  pageDescription,
  pagePath
}: MetadataProps) {
  const { language } = useLanguage();
  const domain = "https://linguasage.com"; // Replace with your actual domain

  let title = pageTitle || "LinguaSage";
  let description = pageDescription || "Learn languages with a master educator.";
  let imageUrl = `${domain}/og-image.png`; // A default OG image
  let structuredData: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: domain,
      name: 'LinguaSage',
  };

  if (pageType === 'home' && homeContent) {
    title = homeContent.seo?.title?.[language] || homeContent.slogan[language];
    description = homeContent.seo?.description?.[language] || homeContent.subSlogan[language];
    structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'LinguaSage',
        url: domain,
        logo: `${domain}/logo.png`,
        contactPoint: {
            '@type': 'ContactPoint',
            email: 'hello@linguasage.com',
            contactType: 'Customer Service'
        }
    }
  } else if (pageType === 'post' && post) {
    title = post.seo?.title?.[language] || post.title[language];
    description = post.seo?.description?.[language] || post.excerpt[language];
    imageUrl = post.imageUrl;
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${domain}${pagePath}`,
      },
      headline: post.title[language],
      description: post.excerpt[language],
      image: post.imageUrl,
      author: {
        '@type': 'Person',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'LinguaSage',
        logo: {
          '@type': 'ImageObject',
          url: `${domain}/logo.png`,
        },
      },
      datePublished: post.date,
    };
  } else if (pageType === 'class' && classInfo) {
    title = classInfo.seo?.title?.[language] || classInfo.title[language];
    description = classInfo.seo?.description?.[language] || classInfo.excerpt[language];
    imageUrl = classInfo.imageUrl;
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: classInfo.title[language],
      description: classInfo.excerpt[language],
      provider: {
        '@type': 'Organization',
        name: 'LinguaSage',
        url: domain,
      },
      ...(classInfo.price !== undefined && {
          offers: {
              '@type': 'Offer',
              price: classInfo.price,
              priceCurrency: 'IRR', // Assuming Toman, IRR is the official code
              category: classInfo.type
          }
      })
    };
  } else if (pageType === 'about' && aboutContent) {
      title = aboutContent.seo?.title?.[language] || aboutContent.title[language];
      description = aboutContent.seo?.description?.[language] || aboutContent.story[language].substring(0, 160);
       structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        url: `${domain}${pagePath}`,
        name: title,
        description: description,
        publisher: {
          '@type': 'Organization',
          name: 'LinguaSage',
          logo: {
            '@type': 'ImageObject',
            url: `${domain}/logo.png`,
          },
        },
    };
  } else if (pageType === 'contact' && contactContent) {
      title = contactContent.seo?.title?.[language] || contactContent.title[language];
      description = contactContent.seo?.description?.[language] || contactContent.description[language];
       structuredData = {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        url: `${domain}${pagePath}`,
        name: title,
        description: description,
        publisher: {
          '@type': 'Organization',
          name: 'LinguaSage',
          logo: {
            '@type': 'ImageObject',
            url: `${domain}/logo.png`,
          },
        },
    };
  }


  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`${domain}${pagePath}`} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={pageType === 'post' ? 'article' : 'website'} />
      <meta property="og:url" content={`${domain}${pagePath}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="LinguaSage" />
      <meta property="og:locale" content={language} />


      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={`${domain}${pagePath}`} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageUrl} />
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        key="structured-data"
      />
    </Head>
  );
}
