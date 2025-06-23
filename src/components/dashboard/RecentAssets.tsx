
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Star, Clock, Plus, ArrowRight } from "lucide-react";

interface RecentAssetsProps {
  assets: any[];
}

const RecentAssets = ({ assets }: RecentAssetsProps) => {
  if (assets.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Recent Content</h2>
          <Button variant="ghost" className="text-purple-600 hover:text-purple-700 font-medium">
            View all →
          </Button>
        </div>
        <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No content yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">Get started by creating your first piece of content.</p>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Generate Content
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Recent Content</h2>
        <Button variant="ghost" className="text-purple-600 hover:text-purple-700 font-medium">
          View all →
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset: any, index) => (
          <Card key={index} className="border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {asset.title}
                  </CardTitle>
                  <CardDescription className="capitalize text-gray-600 mt-1">
                    {asset.type.replace('_', ' ')}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-yellow-500 p-2">
                  <Star className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  {new Date(asset.created_at).toLocaleDateString()}
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecentAssets;
