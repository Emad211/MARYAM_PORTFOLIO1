
import { getEnrollmentsForAdmin } from "@/app/actions/enrollment-actions";
import { getClasses } from "@/lib/cms-store";
import { EnrollmentsDataTable } from "@/components/admin/enrollments-data-table";

// Always render live: enrollment status changes constantly and getClasses now
// uses the cookie-less anon client, so pin this route dynamic.
export const dynamic = 'force-dynamic';

// Admin enrollment management (Phase 1). Replaces the old anonymous
// class-registration list: enrollments are account-based now, and the admin
// approves/rejects each pending request here. The route stays /admin/registrations
// so existing links and the e2e visual suite keep resolving.
export default async function RegistrationsPage() {
    const [enrollments, classes] = await Promise.all([
        getEnrollmentsForAdmin(),
        getClasses(),
    ]);

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
