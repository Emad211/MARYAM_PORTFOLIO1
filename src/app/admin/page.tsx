
import { getAnalyticsData } from "../actions/analytics-actions";
import { getOpsOverview } from "../actions/admin-ops-actions";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { AnalyticsSectionHeading, OpsCockpit } from "@/components/admin/ops-cockpit";

// Ops counts and analytics both read through the request-bound client (admin
// RLS), so this route must never be prerendered.
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [analyticsData, opsOverview] = await Promise.all([
    getAnalyticsData(),
    getOpsOverview(),
  ]);

  return (
    <div className="space-y-8">
      {opsOverview ? <OpsCockpit ops={opsOverview} /> : null}
      <section className="space-y-6">
        <AnalyticsSectionHeading />
        <AnalyticsDashboard initialData={analyticsData} />
      </section>
    </div>
  );
}
