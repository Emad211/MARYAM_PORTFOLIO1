
import { getEnrollmentsForAdmin } from "@/app/actions/enrollment-actions";
import { getClasses } from "@/lib/cms-store";
import { EnrollmentsDataTable } from "@/components/admin/enrollments-data-table";
import type { AdminEnrollment } from "@/app/actions/enrollment-actions";
import type { Class } from "@/lib/types";

// Always render live: enrollment status changes constantly and getClasses now
// uses the cookie-less anon client, so pin this route dynamic.
export const dynamic = 'force-dynamic';

// Admin enrollment management (Phase 1). Replaces the old anonymous
// class-registration list: enrollments are account-based now, and the admin
// approves/rejects each pending request here. The route stays /admin/registrations
// so existing links and the e2e visual suite keep resolving.
export default async function RegistrationsPage() {
    let enrollments: AdminEnrollment[];
    let classes: Class[];
    let setupError: string | null = null;
    try {
        [enrollments, classes] = await Promise.all([
            getEnrollmentsForAdmin(),
            getClasses(),
        ]);
    } catch (error) {
        // Missing SUPABASE_SERVICE_ROLE_KEY (local dev) — show a setup banner
        // instead of crashing the whole admin shell.
        setupError = error instanceof Error ? error.message : 'Unknown error';
        enrollments = [];
        classes = await getClasses();
    }

    if (setupError) {
        return (
            <div className="space-y-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Enrollments</h1>
                    <p className="text-muted-foreground">Review and approve student enrollment requests for your classes.</p>
                </div>
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-6">
                    <h2 className="font-semibold text-amber-700 dark:text-amber-400">
                        Service key required
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">{setupError}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        This page stitches student accounts and needs the service-role key. Production
                        (Vercel) is unaffected.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Enrollments</h1>
                <p className="text-muted-foreground">Review and approve student enrollment requests for your classes.</p>
            </div>

            <EnrollmentsDataTable data={enrollments} classes={classes} />
        </div>
    );
}
