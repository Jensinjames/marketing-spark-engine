
import { 
  Mail, 
  Megaphone, 
  FileText, 
  Workflow, 
  PenTool, 
  Share2,
  Zap,
  Target,
  Timer,
  Brain
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Mail className="h-8 w-8" />,
      title: "Email Sequences",
      description: "Sales, onboarding, nurture, win-back sequences that convert leads into customers.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Megaphone className="h-8 w-8" />,
      title: "Ad Copy",
      description: "Facebook, Instagram, Google ads — ready for testing and optimized for performance.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Landing Pages",
      description: "Headlines, CTAs, benefits, and everything you need for high-converting pages.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Workflow className="h-8 w-8" />,
      title: "Full Funnels",
      description: "One-click full-stack campaigns that connect every touchpoint seamlessly.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <PenTool className="h-8 w-8" />,
      title: "Strategy Briefs",
      description: "Positioning, pain points, value props — complete strategic foundation.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Share2 className="h-8 w-8" />,
      title: "Social Posts",
      description: "Brand voice matched and optimized content for every social platform.",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const benefits = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Backed by GPT-4",
      description: "Powered by the most advanced AI for marketing intelligence"
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Optimized for Conversion",
      description: "Every piece of copy is tested and optimized for maximum results"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Flexible for Any Niche",
      description: "Works for SaaS, eCommerce, coaching, consulting, and more"
    },
    {
      icon: <Timer className="h-6 w-6" />,
      title: "Live in Under 5 Minutes",
      description: "From idea to launch-ready campaign faster than ever"
    }
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            🛠 What You Can Generate
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              (Fast)
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional marketing assets in minutes, not hours. 
            No marketing experience required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="group relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-200/50 hover:border-gray-300/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mr-4`}>
                  {feature.icon}
                </div>
                <span className="text-green-500 font-semibold">✅</span>
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

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            🧠 Why It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex p-4 bg-white rounded-2xl shadow-sm mb-6">
                  <div className="text-purple-600">
                    {benefit.icon}
                  </div>
                </div>
                <div className="flex items-center justify-center mb-3">
                  <span className="text-green-500 font-semibold mr-2">✅</span>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {benefit.title}
                  </h4>
                </div>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
