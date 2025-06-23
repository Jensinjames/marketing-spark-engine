
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  BarChart3, 
  CreditCard, 
  Zap, 
  Settings, 
  Menu, 
  X,
  FileText,
  Users,
  Puzzle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiredPlan: [] },
    { name: 'Generate', href: '/generate', icon: Zap, requiredPlan: [] },
    { name: 'Content', href: '/content', icon: FileText, requiredPlan: [] },
    { name: 'Teams', href: '/teams', icon: Users, requiredPlan: ['growth', 'elite'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, requiredPlan: [] },
    { name: 'Integrations', href: '/integrations', icon: Puzzle, requiredPlan: ['growth', 'elite'] },
    { name: 'Settings', href: '/settings', icon: Settings, requiredPlan: [] },
    { name: 'Billing', href: '/billing', icon: CreditCard, requiredPlan: [] },
  ];

  const userPlan = "starter"; // This should come from user context

  const isActive = (href: string) => location.pathname === href;

  const canAccess = (requiredPlan: string[]) => {
    return requiredPlan.length === 0 || requiredPlan.includes(userPlan);
  };

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white shadow-md"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-8 border-b border-gray-200">
            <div className="p-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AMAP
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const hasAccess = canAccess(item.requiredPlan);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive(item.href)
                      ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-600'
                      : hasAccess
                        ? 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        : 'text-gray-400 cursor-not-allowed'
                    }
                    ${!hasAccess && 'opacity-50'}
                  `}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                  {!hasAccess && item.requiredPlan.length > 0 && (
                    <div className="ml-auto w-2 h-2 bg-orange-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
