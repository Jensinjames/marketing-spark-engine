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
import { useUserPlan } from "@/hooks/useUserPlanQuery";
import LogoutButton from "@/components/auth/LogoutButton";
import cn from "classnames";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { plan } = useUserPlan();

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

  const isActive = (href: string) => location.pathname === href;

  const canAccess = (requiredPlan: string[]) => {
    if (requiredPlan.length === 0) return true;
    if (!plan) return false;
    return requiredPlan.includes(plan.planType);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-card shadow-md border-border hover:bg-surface-elevated"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-background border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-lg
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-8 border-b border-sidebar-border">
            <div className="p-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AMAP
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2" role="navigation" aria-label="Main menu">
            {navigation.map((item) => {
              const Icon = item.icon;
              const hasAccess = canAccess(item.requiredPlan);
              
              return (
                <Link
                  key={item.name}
                  to={hasAccess ? item.href : "#"}
                  onClick={() => hasAccess && setIsOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-sidebar-background",
                    isActive(item.href)
                      ? "sidebar-item-active bg-primary/10 text-primary border-r-2 border-primary"
                      : hasAccess
                        ? "sidebar-item-hover text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        : "text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  aria-describedby={!hasAccess && item.requiredPlan.length > 0 ? `${item.name}-upgrade-needed` : undefined}
                >
                  <Icon className="h-5 w-5 mr-3" aria-hidden="true" />
                  {item.name}
                  {!hasAccess && item.requiredPlan.length > 0 && (
                    <>
                      <div className="ml-auto w-2 h-2 bg-warning rounded-full shadow-sm" aria-hidden="true" />
                      <span id={`${item.name}-upgrade-needed`} className="sr-only">
                        Requires {item.requiredPlan.join(' or ')} plan
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section with LogoutButton */}
          <div className="border-t border-sidebar-border p-4">
            <LogoutButton 
              variant="ghost"
              showConfirmation={true}
              className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
            />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
