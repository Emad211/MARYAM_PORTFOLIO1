/**
 * Row ↔ domain-type mappers between the Supabase Postgres schema (snake_case,
 * JSONB) and the app's TypeScript types (camelCase). Pure functions — no I/O.
 *
 * Localized/JSONB columns are typed as their exact TS shapes here because we
 * own the schema; supabase-js round-trips JS objects to `jsonb` transparently.
 *
 * Note on `exactOptionalPropertyTypes`: optional domain fields
 * (`price`, `maxStudents`, `germanLevel`, …) are added via conditional spread
 * so an absent DB value stays *absent* rather than becoming an explicit
 * `undefined`, which that tsconfig flag forbids.
 */
import type {
  Post,
  Class,
  TimelineEvent,
  ClassRegistration,
  PageView,
  LocalizedString,
  SeoContent,
  PostCategory,
  ClassType,
  ClassLevel,
  ClassStatus,
  ContactMessage,
  Profile,
  Enrollment,
  EnrollmentStatus,
} from './../types';

// ---------------------------------------------------------------------------
// Row types (mirror the SQL columns exactly)
// ---------------------------------------------------------------------------

export interface PostRow {
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  content: LocalizedString;
  author: string;
  date: string;
  category: PostCategory;
  image_url: string;
  image_hint: string;
  tags: LocalizedString[];
  seo: SeoContent;
}

export interface ClassRow {
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  description: LocalizedString;
  type: ClassType;
  level: ClassLevel;
  status: ClassStatus;
  objectives: LocalizedString[];
  prerequisites: LocalizedString[];
  image_url: string;
  image_hint: string;
  schedule: { days: LocalizedString; time: string };
  price: number | null;
  max_students: number | null;
  seo: SeoContent;
}

export interface TimelineEventRow {
  id: string;
  year: string;
  title: LocalizedString;
  description: LocalizedString;
  sort_order: number;
}

export interface ClassRegistrationRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  class_name: string;
  class_slug: string;
  submitted_at: string;
  german_level: string | null;
  learning_goal: string | null;
  motivation: string | null;
}

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submitted_at: string;
}

export interface PageViewRow {
  path: string;
  viewed_at: string;
  ip: string;
  user_agent: string;
  referrer: string | null;
}

export interface ProfileRow {
  id: string;
  name: string;
  phone: string;
  german_level: string | null;
  created_at: string;
}

export interface EnrollmentRow {
  id: string;
  user_id: string;
  class_slug: string;
  status: EnrollmentStatus;
  learning_goal: string | null;
  motivation: string | null;
  submitted_at: string;
  decided_at: string | null;
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export function rowToPost(row: PostRow): Post {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    date: row.date,
    category: row.category,
    imageUrl: row.image_url,
    imageHint: row.image_hint,
    tags: row.tags ?? [],
    seo: row.seo,
  };
}

export function postToRow(post: Post): PostRow {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    author: post.author,
    date: post.date,
    category: post.category,
    image_url: post.imageUrl,
    image_hint: post.imageHint,
    tags: post.tags,
    seo: post.seo,
  };
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export function rowToClass(row: ClassRow): Class {
  return {
    slug: row.slug,
    title: row.title,
    type: row.type,
    level: row.level,
    status: row.status,
    excerpt: row.excerpt,
    description: row.description,
    objectives: row.objectives ?? [],
    prerequisites: row.prerequisites ?? [],
    imageUrl: row.image_url,
    imageHint: row.image_hint,
    schedule: row.schedule,
    seo: row.seo,
    ...(row.price != null ? { price: Number(row.price) } : {}),
    ...(row.max_students != null ? { maxStudents: row.max_students } : {}),
  };
}

export function classToRow(cls: Class): ClassRow {
  return {
    slug: cls.slug,
    title: cls.title,
    excerpt: cls.excerpt,
    description: cls.description,
    type: cls.type,
    level: cls.level,
    status: cls.status,
    objectives: cls.objectives,
    prerequisites: cls.prerequisites,
    image_url: cls.imageUrl,
    image_hint: cls.imageHint,
    schedule: cls.schedule,
    price: cls.price ?? null,
    max_students: cls.maxStudents ?? null,
    seo: cls.seo,
  };
}

// ---------------------------------------------------------------------------
// Timeline events (TS type has no id/sort_order; order is positional)
// ---------------------------------------------------------------------------

export function rowToTimelineEvent(row: TimelineEventRow): TimelineEvent {
  return {
    year: row.year,
    title: row.title,
    description: row.description,
  };
}

/** Insert shape for a timeline event; `sort_order` comes from array position. */
export function timelineEventToInsert(
  event: TimelineEvent,
  sortOrder: number
): Omit<TimelineEventRow, 'id'> {
  return {
    year: event.year,
    title: event.title,
    description: event.description,
    sort_order: sortOrder,
  };
}

// ---------------------------------------------------------------------------
// Class registrations
// ---------------------------------------------------------------------------

export function rowToRegistration(row: ClassRegistrationRow): ClassRegistration {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    className: row.class_name,
    classSlug: row.class_slug,
    submittedAt: row.submitted_at,
    ...(row.german_level != null ? { germanLevel: row.german_level } : {}),
    ...(row.learning_goal != null ? { learningGoal: row.learning_goal } : {}),
    ...(row.motivation != null ? { motivation: row.motivation } : {}),
  };
}

/** Insert shape from the public registration form (id/submittedAt DB-generated). */
export function registrationToInsert(
  data: Omit<ClassRegistration, 'id' | 'submittedAt'>
) {
  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    class_name: data.className,
    class_slug: data.classSlug,
    german_level: data.germanLevel ?? null,
    learning_goal: data.learningGoal ?? null,
    motivation: data.motivation ?? null,
  };
}

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

export function rowToMessage(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    submittedAt: row.submitted_at,
  };
}

/** Insert shape from the public contact form (id/submittedAt DB-generated). */
export function messageToInsert(
  data: Omit<ContactMessage, 'id' | 'submittedAt'>
) {
  return {
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
  };
}

// ---------------------------------------------------------------------------
// Page views (analytics log)
// ---------------------------------------------------------------------------

export function rowToPageView(row: PageViewRow): PageView {
  return {
    path: row.path,
    timestamp: row.viewed_at,
    ip: row.ip,
    userAgent: row.user_agent,
    referrer: row.referrer,
  };
}

/** Insert shape for a single page view (`viewed_at` uses the DB default). */
export function pageViewToInsert(data: Omit<PageView, 'timestamp'>) {
  return {
    path: data.path,
    ip: data.ip,
    user_agent: data.userAgent,
    referrer: data.referrer,
  };
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    createdAt: row.created_at,
    ...(row.german_level != null ? { germanLevel: row.german_level } : {}),
  };
}

/** Upsert shape for a profile (`created_at` DB-generated; `id` is the auth uid). */
export function profileToUpsert(
  data: Pick<Profile, 'id' | 'name' | 'phone'> & { germanLevel?: string }
) {
  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    german_level: data.germanLevel ?? null,
  };
}

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

export function rowToEnrollment(row: EnrollmentRow): Enrollment {
  return {
    id: row.id,
    userId: row.user_id,
    classSlug: row.class_slug,
    status: row.status,
    submittedAt: row.submitted_at,
    ...(row.learning_goal != null ? { learningGoal: row.learning_goal } : {}),
    ...(row.motivation != null ? { motivation: row.motivation } : {}),
    ...(row.decided_at != null ? { decidedAt: row.decided_at } : {}),
  };
}

/** Insert shape for a student enrollment. `status` is forced to 'pending' (RLS
 *  enforces this too); id/submitted_at/decided_at are DB-generated. */
export function enrollmentToInsert(data: {
  userId: string;
  classSlug: string;
  learningGoal?: string;
  motivation?: string;
}) {
  return {
    user_id: data.userId,
    class_slug: data.classSlug,
    status: 'pending' as const,
    learning_goal: data.learningGoal ?? null,
    motivation: data.motivation ?? null,
  };
}
