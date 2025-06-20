
import { Zap, Mail, Settings, Shield, Database, Bot } from "lucide-react";

const Integrations = () => {
  const integrationCategories = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Integrate",
      description: "Zapier, n8n, Mailchimp, ConvertKit, Webflow, and more. Export your assets or use built-in funnel templates.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "Automate",
      description: "Automate tasks, email flows, and campaign triggers. No-code workflow builder for everyone.",
      color: "from-blue-500 to-purple-500"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Trust",
      description: "End-to-end encrypted, GDPR compliant. Built on Supabase and Stripe—trusted infrastructure.",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const integrationLogos = [
    { name: "Zapier", logo: "⚡" },
    { name: "Mailchimp", logo: "📧" },
    { name: "ConvertKit", logo: "✉️" },
    { name: "Stripe", logo: "💳" },
    { name: "Supabase", logo: "🗄️" },
    { name: "GPT-4", logo: "🤖" }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Integrate. Automate.
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Trust.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {integrationCategories.map((category, index) => (
            <div key={index} className="text-center group">
              <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${category.color} text-white mb-6`}>
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {category.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {category.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-white rounded-3xl p-8">
          <h3 className="text-center text-lg font-semibold text-gray-900 mb-8">
            Trusted Integration Partners
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {integrationLogos.map((integration, index) => (
              <div key={index} className="flex flex-col items-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="text-3xl">{integration.logo}</div>
                <span className="text-sm font-medium text-gray-600">{integration.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;
