
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

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
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

export interface PageView {
  path: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  referrer: string | null;
}

// ---------------------------------------------------------------------------
// Accounts & enrollment (Phase 1)
// ---------------------------------------------------------------------------

/** JWT `app_metadata.role` values. Server-controlled; never from user_metadata. */
export type UserRole = 'admin' | 'student';

/** Enrollment lifecycle: student enrolls (pending) → admin approves/rejects,
 *  or the student cancels. A payment step can slot between pending and approved
 *  later without changing these states. */
export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

/** App-level profile for an auth user (email lives on the auth record). */
export interface Profile {
  id: string;
  name: string;
  phone: string;
  germanLevel?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  classSlug: string;
  status: EnrollmentStatus;
  learningGoal?: string;
  motivation?: string;
  submittedAt: string;
  decidedAt?: string;
}
