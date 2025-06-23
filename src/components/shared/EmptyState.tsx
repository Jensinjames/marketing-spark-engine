
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction, 
  children 
}: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-gradient-to-r from-purple-600 to-blue-600">
          {actionLabel}
        </Button>
      )}
      
      {children}
    </div>
  );
};

export default EmptyState;
