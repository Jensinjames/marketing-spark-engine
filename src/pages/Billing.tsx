
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import BillingHeader from "@/components/billing/BillingHeader";
import CurrentPlanCards from "@/components/billing/CurrentPlanCards";
import PlanSelector from "@/components/billing/PlanSelector";
import PaymentMethodCard from "@/components/billing/PaymentMethodCard";
import BillingHistoryTable from "@/components/billing/BillingHistoryTable";

const Billing = () => {
  const { user } = useAuth();
  const [planData, setPlanData] = useState({
    creditsUsed: 32,
    creditsLimit: 50,
    nextBilling: "Jan 1, 2025",
    status: "Active"
  });

  return (
    <AuthGuard requireAuth={true}>
      <Layout>
        <div className="space-y-8">
          <BillingHeader />
          <CurrentPlanCards planData={planData} />
          <PlanSelector />
          <PaymentMethodCard />
          <BillingHistoryTable />
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Billing;
