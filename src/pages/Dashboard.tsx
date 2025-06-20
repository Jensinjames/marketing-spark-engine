
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardStats from "@/components/dashboard/DashboardStats";
import AssetGeneratorGrid from "@/components/dashboard/AssetGeneratorGrid";
import RecentAssets from "@/components/dashboard/RecentAssets";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [credits, setCredits] = useState({ used: 0, limit: 50 });
  const [recentAssets, setRecentAssets] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const { data: creditsData } = await supabase
        .from("user_credits")
        .select("*")
        .single();
      
      if (creditsData) {
        setCredits({
          used: creditsData.credits_used,
          limit: creditsData.monthly_limit
        });
      }

      const { data: assetsData } = await supabase
        .from("generated_content")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (assetsData) {
        setRecentAssets(assetsData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <DashboardNav 
          credits={credits}
          userName={user?.user_metadata?.full_name || "User"}
          onLogout={handleLogout}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.user_metadata?.full_name || "User"}!
            </h1>
            <p className="text-gray-600">
              Generate high-converting marketing assets with AI
            </p>
          </div>

          <DashboardStats 
            credits={credits}
            assetsCount={recentAssets.length}
          />

          <AssetGeneratorGrid />

          <RecentAssets assets={recentAssets} />
        </div>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;
