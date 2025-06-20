
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Mail, 
  Megaphone, 
  Share2, 
  PenTool, 
  TrendingUp,
  Plus
} from "lucide-react";

const AssetGeneratorGrid = () => {
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
                  <Plus className="h-4 w-4 mr-1"  />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AssetGeneratorGrid;
