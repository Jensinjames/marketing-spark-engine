
import { Button } from "@/components/ui/button";
import { LogOut, Zap } from "lucide-react";

interface DashboardNavProps {
  credits: { used: number; limit: number };
  userName?: string;
  onLogout: () => void;
}

const DashboardNav = ({ credits, userName, onLogout }: DashboardNavProps) => {
  return (
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
            <Button variant="ghost" size="sm" onClick={onLogout}>
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
