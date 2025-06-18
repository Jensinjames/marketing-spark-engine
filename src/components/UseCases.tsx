
import { User, Building2, Briefcase } from "lucide-react";

const UseCases = () => {
  const useCases = [
    {
      icon: <User className="h-8 w-8" />,
      title: "Solo Founders",
      description: "Launch and scale without a marketing team",
      features: [
        "Complete marketing strategies",
        "Launch-ready landing pages", 
        "Email automation sequences",
        "Social media content calendar"
      ],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Briefcase className="h-8 w-8" />,
      title: "Coaches & Consultants",
      description: "Attract and convert your ideal clients",
      features: [
        "Authority-building content",
        "Lead generation funnels",
        "Client onboarding sequences",
        "Workshop and webinar copy"
      ],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Building2 className="h-8 w-8" />,
      title: "Small Agencies",
      description: "Deliver faster for more clients",
      features: [
        "Client campaign templates",
        "Scalable content production",
        "Team collaboration tools",
        "White-label deliverables"
      ],
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <section id="use-cases" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Perfect for Every
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Type of Business
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you're a solo founder or running a small agency, 
            AMAP adapts to your specific needs and goals.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div key={index} className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${useCase.color} text-white mb-6`}>
                {useCase.icon}
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {useCase.title}
              </h3>
              
              <p className="text-gray-600 mb-8 text-lg">
                {useCase.description}
              </p>
              
              <ul className="space-y-4">
                {useCase.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mt-2 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
