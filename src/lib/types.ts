
export type Language = 'en' | 'de' | 'fa';

export type LocalizedString = {
  [key in Language]: string;
};

export interface SeoContent {
    title: LocalizedString;
    description: LocalizedString;
}

export type PostCategory = 'language' | 'culture' | 'tips';

export interface Post {
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  content: LocalizedString;
  author: string;
  date: string;
  category: PostCategory;
  imageUrl: string;
  imageHint: string;
  tags: LocalizedString[];
  seo: SeoContent;
}

export type ClassType = 'private' | 'group' | 'workshop';
export type ClassLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';
export type ClassStatus = 'active' | 'full' | 'inactive';

export interface Class {
  slug: string;
  title: LocalizedString;
  type: ClassType;
  level: ClassLevel;
  status: ClassStatus;
  excerpt: LocalizedString;
  description: LocalizedString;
  objectives: LocalizedString[];
  prerequisites: LocalizedString[];
  imageUrl: string;
  imageHint: string;
  schedule: {
    days: LocalizedString;
    time: string;
  };
  price?: number;
  maxStudents?: number;
  seo: SeoContent;
}

export interface ClassRegistration {
  id: string;
  name: string;
  email: string;
  phone: string;
  className: string;
  classSlug: string;
  submittedAt: string;
  germanLevel?: string;
  learningGoal?: string;
  motivation?: string;
}

export interface TimelineEvent {
  year: string;
  title: LocalizedString;
  description: LocalizedString;
}

export interface HomeContent {
  slogan: LocalizedString;
  subSlogan: LocalizedString;
  ctaClasses: LocalizedString;
  ctaFreeCourse: LocalizedString;
  missionTitle: LocalizedString;
  missionText: LocalizedString;
  manifestoTitle: LocalizedString;
  manifestoText: LocalizedString;
  recentPostsTitle: LocalizedString;
  readMore: LocalizedString;
  ctaTitle: LocalizedString;
  ctaText: LocalizedString;
  seo: SeoContent;
}

export interface AboutContent {
  title: LocalizedString;
  story: LocalizedString;
  qualificationsTitle: LocalizedString;
  testdafTitle: LocalizedString;
  testdafDescription: LocalizedString;
  timelineTitle: LocalizedString;
  seo: SeoContent;
}

export interface ContactContent {
    title: LocalizedString;
    description: LocalizedString;
    contactInfo: LocalizedString;
    email: string;
    address: LocalizedString;
    linkedinUrl: string;
    telegramUrl: string;
    seo: SeoContent;
}

export interface AdminUser {
    email: string;
    password: string;
}

export interface PageView {
  path: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  referrer: string | null;
}
