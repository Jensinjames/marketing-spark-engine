
import { Brain, Shield, Check, Database, Workflow } from "lucide-react";

const SecurityTrust = () => {
  const trustItems = [
    {
      icon: <Brain className="h-5 w-5" />,
      text: "Powered by GPT‑4"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      text: "End-to-End Encryption"
    },
    {
      icon: <Check className="h-5 w-5" />,
      text: "GDPR Compliant"
    },
    {
      icon: <Database className="h-5 w-5" />,
      text: "Built on Supabase"
    },
    {
      icon: <Workflow className="h-5 w-5" />,
      text: "Automated with n8n"
    }
  ];

  return (
    <section className="py-12 bg-gradient-to-r from-gray-50 to-white border-t border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
              <div className="text-purple-600">
                {item.icon}
              </div>
              <span className="text-sm font-medium whitespace-nowrap">
                {item.text}
              </span>
              {index < trustItems.length - 1 && (
                <div className="hidden md:block w-px h-6 bg-gray-300 ml-8" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecurityTrust;
