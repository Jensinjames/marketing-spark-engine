
import { 
  Mail, 
  Megaphone, 
  FileText, 
  Workflow,
  Zap,
  Target,
  Timer,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Features = () => {
  const features = [
    {
      icon: <Mail className="h-8 w-8" />,
      title: "Email Sequences",
      description: "Generate sales, onboarding, or nurture emails in seconds—just add your product.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Megaphone className="h-8 w-8" />,
      title: "Ad Copy for All Platforms",
      description: "Facebook, Instagram, Google—ready to test and optimized for clicks.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "High-Converting Landing Pages",
      description: "Instant headlines, CTAs, and benefit-driven layouts.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Workflow className="h-8 w-8" />,
      title: "1-Click Funnels",
      description: "Go from zero to launch-ready campaigns—no tech skills required.",
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Automate Your Marketing—
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              From Idea to Campaign
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="group relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-200/50 hover:border-gray-300/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mr-4`}>
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-8 mb-8">
          <div className="inline-flex items-center space-x-2 text-purple-600 mb-4">
            <Timer className="h-6 w-6" />
            <span className="text-lg font-semibold">Launch your full marketing funnel in under 10 minutes.</span>
          </div>
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-2 hover:bg-white/80">
            See Live Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Features;
