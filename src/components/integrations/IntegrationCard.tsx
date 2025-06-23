
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  status: "connected" | "available" | "coming-soon";
  category: string;
}

interface IntegrationCardProps {
  integration: Integration;
}

const IntegrationCard = ({ integration }: IntegrationCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800";
      case "available":
        return "bg-blue-100 text-blue-800";
      case "coming-soon":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getButtonText = (status: string) => {
    switch (status) {
      case "connected":
        return "Disconnect";
      case "available":
        return "Connect";
      case "coming-soon":
        return "Coming Soon";
      default:
        return "Connect";
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-gray-600">
              {integration.name.charAt(0)}
            </span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
            {integration.status === "coming-soon" ? "Coming Soon" : 
             integration.status === "connected" ? "Connected" : "Available"}
          </span>
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2">{integration.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
        
        <Button 
          variant={integration.status === "connected" ? "outline" : "default"}
          className={`w-full ${integration.status === "available" ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" : ""}`}
          disabled={integration.status === "coming-soon"}
        >
          {getButtonText(integration.status)}
        </Button>
      </CardContent>
    </Card>
  );
};

export default IntegrationCard;
