
import { Clock, Zap, DollarSign, TrendingUp } from "lucide-react";

const UseCases = () => {
  const targetAudience = [
    {
      icon: <Clock className="h-6 w-6" />,
      text: "Don't have time to write copy or hire an agency"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      text: "Want to test offers and funnels quickly"
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      text: "Need pro-level marketing without the price tag"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      text: "Are ready to scale with clarity, speed, and focus"
    }
  ];

  return (
    <section id="use-cases" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            🎯 Built for Founders
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Who...
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            If this sounds like you, AI Marketing Copilot was built specifically 
            for founders like you who need results, not complexity.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {targetAudience.map((item, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white">
                      {item.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mr-3" />
                      <p className="text-lg text-gray-700 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCases;
