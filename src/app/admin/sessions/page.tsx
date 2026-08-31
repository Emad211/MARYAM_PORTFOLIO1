import { getClasses } from '@/lib/cms-store';
import { getAdminSessions } from '@/app/actions/sessions-admin-actions';
import { SessionScheduler } from '@/components/admin/session-scheduler';

// Live schedule — new bookings and edits must render immediately.
export const dynamic = 'force-dynamic';

export default async function AdminSessionsPage() {
    const [classes, sessions] = await Promise.all([getClasses(), getAdminSessions()]);

    return <SessionScheduler classes={classes} sessions={sessions} />;
}
