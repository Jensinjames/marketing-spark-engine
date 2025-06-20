
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const UseCases = () => {
  const painSolutions = [
    {
      pain: "Don't have time for copywriting?",
      solution: "AI Copilot writes it for you."
    },
    {
      pain: "Need to test offers, fast?",
      solution: "Validate ideas and iterate instantly."
    },
    {
      pain: "Want pro marketing but not the price?",
      solution: "Get agency-quality assets, minus the agency."
    },
    {
      pain: "Ready to scale but not to hire?",
      solution: "Automate, optimize, grow—without extra hires."
    }
  ];

  return (
    <section id="use-cases" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Built for Founders,
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Solopreneurs & Small Teams
            </span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-200/50">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-3xl">👨‍💼</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {painSolutions.map((item, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg text-gray-700 mb-1 font-medium">
                      {item.pain}
                    </p>
                    <p className="text-purple-600 font-semibold">
                      {item.solution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link to="/signup">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-4 h-auto">
              Try Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UseCases;
