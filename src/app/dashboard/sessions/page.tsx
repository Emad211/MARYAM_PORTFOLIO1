import { getClasses } from '@/lib/cms-store';
import { getMySessions } from '@/app/actions/sessions-actions';
import { SessionList } from '@/components/dashboard/session-list';

// Attendance and new sessions must appear immediately.
export const dynamic = 'force-dynamic';

export default async function StudentSessionsPage() {
    const [{ upcoming, past }, classes] = await Promise.all([getMySessions(), getClasses()]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
            <SessionList upcoming={upcoming} past={past} classes={classes} />
        </div>
    );
}
