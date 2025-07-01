import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Mail, Megaphone, Share2, PenTool, TrendingUp, ArrowRight } from "lucide-react";
const AssetGeneratorGrid = () => {
  const assetTypes = [{
    icon: <Mail className="h-6 w-6" />,
    title: "Generate Email Campaign",
    description: "Create compelling email content with AI",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    credits: 15
  }, {
    icon: <Share2 className="h-6 w-6" />,
    title: "Social Media Posts",
    description: "Generate posts for all platforms",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-100",
    credits: 5
  }, {
    icon: <FileText className="h-6 w-6" />,
    title: "Landing Page Copy",
    description: "High-converting page content",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
    credits: 10
  }];
  return <div className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-zinc-50">Quick Actions</h2>
        <Button variant="ghost" className="text-purple-600 hover:text-purple-700 font-medium">
          View all options →
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {assetTypes.map((asset, index) => <Card key={index} className={`border-2 ${asset.borderColor} hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden`}>
            <CardHeader className="pb-4">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${asset.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300 w-fit`}>
                {asset.icon}
              </div>
              <CardTitle className="text-xl font-semibold text-zinc-100">{asset.title}</CardTitle>
              <CardDescription className="text-base text-zinc-200">{asset.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-fuchsia-500">{asset.credits} credits</span>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </CardContent>
          </Card>)}
      </div>
    </div>;
};
export default AssetGeneratorGrid;