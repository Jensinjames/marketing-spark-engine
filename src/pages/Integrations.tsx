
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import PlanGate from "@/components/shared/PlanGate";
import IntegrationsHeader from "@/components/integrations/IntegrationsHeader";
import IntegrationStats from "@/components/integrations/IntegrationStats";
import CategoryFilters from "@/components/integrations/CategoryFilters";
import IntegrationGrid from "@/components/integrations/IntegrationGrid";
import CustomIntegrationBanner from "@/components/integrations/CustomIntegrationBanner";

const Integrations = () => {
  return (
    <AuthGuard requireAuth={true}>
      <PlanGate 
        requiredPlans={["growth", "elite"]} 
        feature="integrations"
      >
        <Layout>
          <div className="space-y-8">
            <IntegrationsHeader />
            <IntegrationStats />
            <CategoryFilters />
            <IntegrationGrid />
            <CustomIntegrationBanner />
          </div>
        </Layout>
      </PlanGate>
    </AuthGuard>
  );
};

export default Integrations;
