
import IntegrationCard from "./IntegrationCard";

const IntegrationGrid = () => {
  const integrations = [
    {
      id: "zapier",
      name: "Zapier",
      description: "Connect to 5000+ apps and automate your workflows",
      logo: "",
      status: "connected" as const,
      category: "automation"
    },
    {
      id: "mailchimp",
      name: "Mailchimp",
      description: "Sync your email campaigns and subscriber lists",
      logo: "",
      status: "available" as const,
      category: "email"
    },
    {
      id: "hubspot",
      name: "HubSpot",
      description: "Integrate with your CRM and marketing tools",
      logo: "",
      status: "connected" as const,
      category: "database"
    },
    {
      id: "wordpress",
      name: "WordPress",
      description: "Publish content directly to your WordPress site",
      logo: "",
      status: "available" as const,
      category: "website"
    },
    {
      id: "slack",
      name: "Slack",
      description: "Get notifications and share content in Slack",
      logo: "",
      status: "connected" as const,
      category: "automation"
    },
    {
      id: "notion",
      name: "Notion",
      description: "Save and organize content in your Notion workspace",
      logo: "",
      status: "coming-soon" as const,
      category: "database"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
        />
      ))}
    </div>
  );
};

export default IntegrationGrid;
