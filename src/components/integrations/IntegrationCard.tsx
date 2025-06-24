
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  status: "connected" | "available" | "coming-soon";
  color: string;
}

interface IntegrationCardProps {
  integration: Integration;
}

const IntegrationCard = ({ integration }: IntegrationCardProps) => {
  const getButtonText = (status: string) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "available":
        return "Connect";
      case "coming-soon":
        return "Coming Soon";
      default:
        return "Connect";
    }
  };

  const getButtonVariant = (status: string) => {
    switch (status) {
      case "connected":
        return "outline";
      case "available":
        return "default";
      case "coming-soon":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow border border-gray-200">
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center`}>
            <span className="text-xl">{integration.icon}</span>
          </div>
          {integration.status === "available" && (
            <ExternalLink className="h-4 w-4 text-gray-400" />
          )}
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-1">{integration.name}</h3>
        <p className="text-xs text-gray-500 mb-3">{integration.category}</p>
        <p className="text-sm text-gray-600 mb-6">{integration.description}</p>
        
        <Button 
          variant={getButtonVariant(integration.status)}
          className={`w-full ${
            integration.status === "available" 
              ? "bg-purple-600 hover:bg-purple-700 text-white" 
              : ""
          }`}
          disabled={integration.status === "coming-soon"}
        >
          {getButtonText(integration.status)}
        </Button>
      </CardContent>
    </Card>
  );
};

export default IntegrationCard;
