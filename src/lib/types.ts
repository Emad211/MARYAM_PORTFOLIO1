
import type { TdnBand } from '@/lib/exam-blueprints';

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

// ---------------------------------------------------------------------------
// LMS curriculum & exercises
// ---------------------------------------------------------------------------

export type LmsSkill = 'lesen' | 'hoeren' | 'schreiben' | 'sprechen' | 'allgemein';
export type QuestionType = 'mc' | 'match' | 'jnl';
export interface McOption { id: string; text: LocalizedString; }
export interface McPayload { options: McOption[]; }
export interface MatchItem { id: string; text: LocalizedString; }
export interface MatchPayload { left: MatchItem[]; right: MatchItem[]; }
export interface McAnswer { correct: string; }
export interface JnlAnswer { correct: 'ja' | 'nein' | 'nichts'; }
export interface MatchAnswer { mapping: Record<string, string>; } // leftId -> rightId
export interface LmsQuestion {
  id: string;
  type: QuestionType;
  prompt: LocalizedString;
  payload?: McPayload | MatchPayload; // absent for jnl
  audioPath?: string; // storage path in public 'listening' bucket (hoeren only)
  playsAllowed?: number; // 0 none / 1 once / 2 twice
  points: number;
}
export interface LmsLesson {
  id: string; moduleId: string;
  title: LocalizedString; body: LocalizedString;
  videoUrl?: string; skill: LmsSkill; durationMin?: number;
  isFreePreview: boolean; sortOrder: number;
}
export interface CurriculumModule {
  id: string; classSlug: string; title: LocalizedString;
  sortOrder: number; lessons: LmsLesson[];
}
export interface ClassProgress { total: number; done: number; }

// ---------------------------------------------------------------------------
// Productive-skill practice, teacher feedback & notification inbox
// ---------------------------------------------------------------------------

export type ProductiveSkill = 'schreiben' | 'sprechen';
export interface OpenTask {
    id: string;
    lessonId: string;
    skill: ProductiveSkill;
    prompt: LocalizedString;
    timeLimitMin?: number;
    wordMin?: number;
    wordMax?: number;
    sortOrder: number;
}
export interface RubricScores { wirkung: number; aufgabe: number; sprache: number; } // each 1..5
export interface SubmissionRecord {
    id: string;
    taskId: string;
    kind: 'text' | 'audio';
    body?: string;
    filePath?: string;
    teacherFeedback?: string;
    rubricScores?: RubricScores;
    status: 'pending' | 'graded';
    submittedAt: string;
    decidedAt?: string;
}
export interface SubmissionWithTask extends SubmissionRecord { task: OpenTask; }
export interface NotificationItem {
    id: string;
    type: 'submission_graded' | 'enrollment_decided' | 'system';
    payload: Record<string, unknown>;
    read: boolean;
    createdAt: string;
}

// ---------------------------------------------------------------------------
// Mock exam simulator (TestDaF Lesen/Hoeren sessions)
// ---------------------------------------------------------------------------

export type MockSectionKind = 'lesen' | 'hoeren';
export type MockSessionStatus = 'in_progress' | 'completed' | 'abandoned';
export interface MockExamSummary {
    id: string;
    code: string;
    title: LocalizedString;
    isActive: boolean;
    totalDurationMin: number;
    questionCount: number;
}
export interface MockSectionRunner {
    id: string;
    section: MockSectionKind;
    durationMin: number;
    sortOrder: number;
    questions: LmsQuestion[];
}
export interface MockSessionInfo {
    id: string;
    examId: string;
    status: MockSessionStatus;
    startedAt: string;
    expiresAt: string;
}
export interface SectionOutcome {
    sectionId: string;
    section: MockSectionKind;
    raw: number;
    max: number;
    band: TdnBand;
}
export interface ReviewItem {
    question: LmsQuestion;
    given: McAnswer | JnlAnswer | MatchAnswer | null;
    correct: McAnswer | JnlAnswer | MatchAnswer | null;
}
export interface MockSessionResults {
    sessionId: string;
    examCode: string;
    completedAt?: string;
    sections: SectionOutcome[];
    review: ReviewItem[];
}
export interface MockHistoryEntry {
    sessionId: string;
    completedAt: string;
    percent: number;
}
