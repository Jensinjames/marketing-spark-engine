
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import MetricsRow from "@/components/analytics/MetricsRow";
import PerformanceChart from "@/components/analytics/PerformanceChart";
import ContentTypeBreakdown from "@/components/analytics/ContentTypeBreakdown";
import AdvancedAnalyticsBanner from "@/components/analytics/AdvancedAnalyticsBanner";

const Analytics = () => {
  return (
    <AuthGuard requireAuth={true}>
      <Layout>
        <div className="space-y-8">
          <AnalyticsHeader />
          <MetricsRow />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PerformanceChart />
            </div>
            <div className="lg:col-span-1">
              <ContentTypeBreakdown />
            </div>
          </div>
          
          <AdvancedAnalyticsBanner />
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Analytics;
