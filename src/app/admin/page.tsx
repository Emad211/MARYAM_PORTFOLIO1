
import { getAnalyticsData } from "../actions/analytics-actions";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export default async function AdminDashboardPage() {
  const analyticsData = await getAnalyticsData();

  return <AnalyticsDashboard initialData={analyticsData} />;
}
