
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Mail, 
  Megaphone, 
  Share2, 
  PenTool, 
  TrendingUp,
  Zap,
  User,
  LogOut,
  Plus,
  Clock,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState({ used: 0, limit: 50 });
  const [recentAssets, setRecentAssets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    fetchUserData();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setUser(user);
  };

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
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Logged out successfully");
  };

  const assetTypes = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Landing Page",
      description: "High-converting landing page copy",
      color: "from-blue-500 to-cyan-500",
      credits: 10
    },
    {
      icon: <Mail className="h-8 w-8" />,
      title: "Email Campaign",
      description: "Complete email sequence",
      color: "from-purple-500 to-pink-500",
      credits: 15
    },
    {
      icon: <Megaphone className="h-8 w-8" />,
      title: "Ad Copy",
      description: "Performance-tested ad copy",
      color: "from-orange-500 to-red-500",
      credits: 8
    },
    {
      icon: <Share2 className="h-8 w-8" />,
      title: "Social Posts",
      description: "Engaging social media content",
      color: "from-green-500 to-emerald-500",
      credits: 5
    },
    {
      icon: <PenTool className="h-8 w-8" />,
      title: "Blog Post",
      description: "SEO-optimized blog content",
      color: "from-indigo-500 to-purple-500",
      credits: 12
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Strategy Brief",
      description: "Complete marketing strategy",
      color: "from-pink-500 to-rose-500",
      credits: 20
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AMAP
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-purple-700">
                  {credits.used}/{credits.limit} credits
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.user_metadata?.full_name || "User"}!
          </h1>
          <p className="text-gray-600">
            Generate high-converting marketing assets with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Credits Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {credits.used}/{credits.limit}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(credits.used / credits.limit) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Assets Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{recentAssets.length}</div>
              <p className="text-sm text-gray-600 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">Starter</div>
              <Button variant="link" className="text-purple-600 p-0 h-auto text-sm">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">1</div>
              <Button variant="link" className="text-purple-600 p-0 h-auto text-sm">
                Invite Members
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate New Asset</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assetTypes.map((asset, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${asset.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {asset.icon}
                  </div>
                  <CardTitle className="text-lg">{asset.title}</CardTitle>
                  <CardDescription>{asset.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{asset.credits} credits</span>
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Plus className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Assets</h2>
          {recentAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentAssets.map((asset: any, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{asset.title}</CardTitle>
                        <CardDescription className="capitalize">{asset.type.replace('_', ' ')}</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(asset.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No assets yet</h3>
                <p className="text-gray-600 mb-6">Generate your first marketing asset to get started</p>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Asset
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
