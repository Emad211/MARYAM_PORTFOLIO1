import { getClasses } from '@/lib/cms-store';
import { getAdminSessions } from '@/app/actions/sessions-admin-actions';
import { ScheduleCalendar } from '@/components/admin/schedule-calendar';

// Live schedule — drag/move and edits must render immediately.
export const dynamic = 'force-dynamic';

export default async function AdminSessionsPage() {
    const [classes, sessions] = await Promise.all([getClasses(), getAdminSessions()]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">جلسات</h1>
                <p className="text-muted-foreground">
                    تقویم هفتگی — جلسه را بسازید، بکشید و جابهجا کنید؛ حضور و غیاب روی خود کارت.
                </p>
            </div>

            <ScheduleCalendar classes={classes} sessions={sessions} />
        </div>
    );
}
