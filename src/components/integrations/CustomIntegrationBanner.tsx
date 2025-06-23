
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Puzzle, ArrowRight } from "lucide-react";

const CustomIntegrationBanner = () => {
  return (
    <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
              <Puzzle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Need a Custom Integration?
              </h3>
              <p className="text-gray-600">
                Contact our team to build a custom integration for your specific needs.
              </p>
            </div>
          </div>
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
            Contact Sales
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomIntegrationBanner;
