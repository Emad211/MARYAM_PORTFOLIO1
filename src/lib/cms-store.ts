import 'server-only';
import { createClient } from './supabase/server';
import type {
    Post,
    Class,
    TimelineEvent,
    HomeContent,
    AboutContent,
    ContactContent,
    ClassRegistration,
    ContactMessage,
    PageView,
    Profile,
    Enrollment,
    EnrollmentStatus,
} from './types';
import { getEmptyCMSData } from './empty-data';
import {
    rowToPost,
    postToRow,
    rowToClass,
    classToRow,
    rowToTimelineEvent,
    timelineEventToInsert,
    rowToRegistration,
    registrationToInsert,
    rowToMessage,
    messageToInsert,
    rowToPageView,
    pageViewToInsert,
    rowToProfile,
    profileToUpsert,
    rowToEnrollment,
    enrollmentToInsert,
    type PostRow,
    type ClassRow,
    type TimelineEventRow,
    type ClassRegistrationRow,
    type ContactMessageRow,
    type PageViewRow,
    type ProfileRow,
    type EnrollmentRow,
} from './supabase/mappers';

// Re-export types for convenience (kept for consumers that import from here).
export type {
    Post,
    Class,
    TimelineEvent,
    HomeContent,
    AboutContent,
    ContactContent,
    ClassRegistration,
    ContactMessage,
    Language,
    PageView,
    Profile,
    Enrollment,
    EnrollmentStatus,
} from './types';

// Default content used only as a render-time fallback for the three page
// singletons if a row is somehow missing (the DB is seeded from this same
// source). Submission/analytics tables have no such fallback — empty is empty.
const EMPTY_DATA = getEmptyCMSData();

// ---------------------------------------------------------------------------
// site_content singletons (home / about / contact)
// ---------------------------------------------------------------------------

async function getSiteContent<T>(key: 'home' | 'about' | 'contact', fallback: T): Promise<T> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('site_content')
        .select('content')
        .eq('key', key)
        .maybeSingle();

    if (error) {
        console.error(`Failed to load site_content '${key}':`, error);
        return fallback;
    }
    if (!data) {
        return fallback;
    }
    return data.content as T;
}

async function saveSiteContent(key: 'home' | 'about' | 'contact', content: unknown): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('site_content')
        .upsert({ key, content, updated_at: new Date().toISOString() });
    if (error) throw error;
}

// Home Content
export const getHomeContent = () => getSiteContent<HomeContent>('home', EMPTY_DATA.homeContent);
export const saveHomeContent = (data: HomeContent) => saveSiteContent('home', data);

// About Content
export const getAboutContent = () => getSiteContent<AboutContent>('about', EMPTY_DATA.aboutContent);
export const saveAboutContent = (data: AboutContent) => saveSiteContent('about', data);

// Contact Content
export const getContactContent = () => getSiteContent<ContactContent>('contact', EMPTY_DATA.contactContent);
export const saveContactContent = (data: ContactContent) => saveSiteContent('contact', data);

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function getPosts(): Promise<Post[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Failed to load posts:', error);
        return [];
    }
    return (data as PostRow[]).map(rowToPost);
}

// Callers pass the full array (create/update/delete all rebuild it), so make
// the table match `data`: upsert the given rows, then delete any slug no
// longer present.
export async function savePosts(data: Post[]): Promise<void> {
    const supabase = await createClient();

    const { data: existing, error: selError } = await supabase.from('posts').select('slug');
    if (selError) throw selError;

    if (data.length > 0) {
        const { error } = await supabase.from('posts').upsert(data.map(postToRow));
        if (error) throw error;
    }

    const keep = new Set(data.map(p => p.slug));
    const toDelete = (existing as { slug: string }[] ?? [])
        .map(r => r.slug)
        .filter(slug => !keep.has(slug));
    if (toDelete.length > 0) {
        const { error } = await supabase.from('posts').delete().in('slug', toDelete);
        if (error) throw error;
    }
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export async function getClasses(): Promise<Class[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to load classes:', error);
        return [];
    }
    return (data as ClassRow[]).map(rowToClass);
}

export async function saveClasses(data: Class[]): Promise<void> {
    const supabase = await createClient();

    const { data: existing, error: selError } = await supabase.from('classes').select('slug');
    if (selError) throw selError;

    if (data.length > 0) {
        const { error } = await supabase.from('classes').upsert(data.map(classToRow));
        if (error) throw error;
    }

    const keep = new Set(data.map(c => c.slug));
    const toDelete = (existing as { slug: string }[] ?? [])
        .map(r => r.slug)
        .filter(slug => !keep.has(slug));
    if (toDelete.length > 0) {
        const { error } = await supabase.from('classes').delete().in('slug', toDelete);
        if (error) throw error;
    }
}

// ---------------------------------------------------------------------------
// Timeline (domain type has no stable key; order is positional). Callers pass
// the full array, so replace the whole set: delete all, insert in order.
// ---------------------------------------------------------------------------

export async function getTimeline(): Promise<TimelineEvent[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Failed to load timeline:', error);
        return [];
    }
    return (data as TimelineEventRow[]).map(rowToTimelineEvent);
}

export async function saveTimeline(data: TimelineEvent[]): Promise<void> {
    const supabase = await createClient();

    // `not id is null` matches every row (Supabase requires a filter on delete).
    const { error: delError } = await supabase
        .from('timeline_events')
        .delete()
        .not('id', 'is', null);
    if (delError) throw delError;

    if (data.length > 0) {
        const rows = data.map((event, i) => timelineEventToInsert(event, i));
        const { error } = await supabase.from('timeline_events').insert(rows);
        if (error) throw error;
    }
}

// ---------------------------------------------------------------------------
// Class registrations (public insert; admin read/delete). Single-row ops —
// no more read-all-mutate-write-all.
// ---------------------------------------------------------------------------

export async function getRegistrations(): Promise<ClassRegistration[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('class_registrations')
        .select('*')
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Failed to load registrations:', error);
        return [];
    }
    return (data as ClassRegistrationRow[]).map(rowToRegistration);
}

export async function insertRegistration(
    data: Omit<ClassRegistration, 'id' | 'submittedAt'>
): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('class_registrations').insert(registrationToInsert(data));
    if (error) throw error;
}

export async function deleteRegistration(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('class_registrations').delete().eq('id', id);
    if (error) throw error;
}

// ---------------------------------------------------------------------------
// Contact messages (public insert; admin read/delete). Single-row ops.
// ---------------------------------------------------------------------------

export async function getMessages(): Promise<ContactMessage[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Failed to load messages:', error);
        return [];
    }
    return (data as ContactMessageRow[]).map(rowToMessage);
}

export async function insertMessage(
    data: Omit<ContactMessage, 'id' | 'submittedAt'>
): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('contact_messages').insert(messageToInsert(data));
    if (error) throw error;
}

export async function deleteMessage(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) throw error;
}

// ---------------------------------------------------------------------------
// Analytics / page views (public insert; admin read).
//
// The WRITE path is now a single-row INSERT (previously every page view read
// the entire log and rewrote it — the migration's main scalability fix).
//
// The READ path still loads rows for in-memory aggregation in
// analytics-actions.ts to keep the dashboard's output shape byte-for-byte
// identical. The `limit` is a generous safety bound; when traffic grows this
// aggregation should move into a SQL RPC/view.
// ---------------------------------------------------------------------------

export async function getAnalytics(): Promise<PageView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .order('viewed_at', { ascending: true })
        .limit(50000);

    if (error) {
        console.error('Failed to load analytics:', error);
        return [];
    }
    return (data as PageViewRow[]).map(rowToPageView);
}

export async function insertPageView(data: Omit<PageView, 'timestamp'>): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('page_views').insert(pageViewToInsert(data));
    if (error) throw error;
}

// ---------------------------------------------------------------------------
// Profiles (Phase 1). One row per auth user; RLS scopes reads/writes to the
// owner (admin may read all). Signup provisions the row via service_role, but
// these run under the request-bound client so a signed-in user can maintain
// their own profile too.
// ---------------------------------------------------------------------------

export async function getProfile(userId: string): Promise<Profile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('Failed to load profile:', error);
        return null;
    }
    return data ? rowToProfile(data as ProfileRow) : null;
}

export async function upsertProfile(
    data: Pick<Profile, 'id' | 'name' | 'phone'> & { germanLevel?: string }
): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').upsert(profileToUpsert(data));
    if (error) throw error;
}

// ---------------------------------------------------------------------------
// Enrollments (Phase 1). RLS scopes SELECT to the owner (student sees own,
// admin sees all). INSERT is forced to 'pending'; a re-enrol after
// cancel/reject flips the SAME row back to pending via upsert on the
// unique(user_id, class_slug) constraint. Status transitions go through
// updateEnrollmentStatus (admin approve/reject; student cancel).
// ---------------------------------------------------------------------------

export async function getEnrollments(): Promise<Enrollment[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Failed to load enrollments:', error);
        return [];
    }
    return (data as EnrollmentRow[]).map(rowToEnrollment);
}

export async function insertEnrollment(data: {
    userId: string;
    classSlug: string;
    learningGoal?: string;
    motivation?: string;
}): Promise<void> {
    const supabase = await createClient();
    // Upsert on the unique(user_id, class_slug) pair so re-enrolling after a
    // cancellation/rejection reuses the row and resets it to 'pending'.
    const { error } = await supabase
        .from('enrollments')
        .upsert(enrollmentToInsert(data), { onConflict: 'user_id,class_slug' });
    if (error) throw error;
}

export async function updateEnrollmentStatus(
    id: string,
    status: EnrollmentStatus
): Promise<void> {
    const supabase = await createClient();
    // `decided_at` marks an admin decision; a student cancel or re-enrol
    // (pending) is not a decision, so it stays null.
    const decidedAt =
        status === 'approved' || status === 'rejected' ? new Date().toISOString() : null;
    const { error } = await supabase
        .from('enrollments')
        .update({ status, decided_at: decidedAt })
        .eq('id', id);
    if (error) throw error;
}

export async function countApprovedEnrollments(classSlug: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('class_slug', classSlug)
        .eq('status', 'approved');
    if (error) throw error;
    return count ?? 0;
}
