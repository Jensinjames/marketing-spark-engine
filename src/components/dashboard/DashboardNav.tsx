
import { Button } from "@/components/ui/button";
import { LogOut, Zap } from "lucide-react";

interface DashboardNavProps {
  credits: { used: number; limit: number };
  userName?: string;
  onLogout: () => void;
}

const DashboardNav = ({ credits, userName, onLogout }: DashboardNavProps) => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AMAP
            </span>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex items-center space-x-3 bg-purple-50 px-4 py-2.5 rounded-xl border border-purple-100">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-semibold text-purple-700">
                {credits.used}/{credits.limit} credits
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2.5 rounded-xl font-medium"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;
