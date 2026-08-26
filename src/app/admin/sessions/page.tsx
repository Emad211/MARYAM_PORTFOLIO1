import { getClasses } from '@/lib/cms-store';
import { getAdminSessions } from '@/app/actions/sessions-admin-actions';
import { SessionScheduler } from '@/components/admin/session-scheduler';

// Live schedule — new bookings and edits must render immediately.
export const dynamic = 'force-dynamic';

export default async function AdminSessionsPage() {
    const [classes, sessions] = await Promise.all([getClasses(), getAdminSessions()]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
                <p className="text-muted-foreground">
                    Schedule live teaching sessions per class. Approved students are notified automatically.
                </p>
            </div>

            <SessionScheduler classes={classes} sessions={sessions} />
        </div>
    );
}
