
import { Zap, Mail, FileText } from "lucide-react";

const Integrations = () => {
  const integrations = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Zapier or n8n",
      description: "Automate your workflows and connect with 1000+ apps",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Mail className="h-8 w-8" />,
      title: "Email Platforms",
      description: "Mailchimp, ConvertKit, ActiveCampaign, and more",
      color: "from-blue-500 to-purple-500"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Your Tech Stack",
      description: "Use our funnel templates or export to your existing tools",
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            🔌 Connect. Automate.
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Launch.
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Seamlessly integrate with your existing tools and workflows. 
            No need to change your entire tech stack.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {integrations.map((integration, index) => (
            <div key={index} className="text-center group">
              <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${integration.color} text-white mb-6`}>
                  {integration.icon}
                </div>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-green-500 font-semibold mr-2 text-lg">✅</span>
                  <h3 className="text-xl font-bold text-gray-900">
                    {integration.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {integration.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
