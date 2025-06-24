
import { Button } from "@/components/ui/button";

const CustomIntegrationBanner = () => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🔌</span>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Need a Custom Integration?</h2>
        <p className="text-purple-100 mb-8 leading-relaxed">
          Don't see the tool you need? We're constantly adding new integrations. Let us know what you'd like to connect and we'll prioritize it.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="secondary" 
            className="bg-white text-purple-600 hover:bg-gray-100 font-medium"
          >
            Request Integration
          </Button>
          <Button 
            variant="outline" 
            className="border-white/30 text-white hover:bg-white/10 font-medium"
          >
            View API Docs
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomIntegrationBanner;
