
import { 
  FileText, 
  Mail, 
  Megaphone, 
  Share2, 
  PenTool, 
  TrendingUp,
  Zap,
  Shield,
  Users
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Landing Pages",
      description: "High-converting landing page copy optimized for your audience and goals.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Mail className="h-8 w-8" />,
      title: "Email Campaigns",
      description: "Complete email sequences that nurture leads and drive conversions.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Megaphone className="h-8 w-8" />,
      title: "Ad Copy",
      description: "Performance-tested ad copy for Facebook, Google, and LinkedIn campaigns.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Share2 className="h-8 w-8" />,
      title: "Social Media Posts",
      description: "Engaging social content tailored for each platform and audience.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <PenTool className="h-8 w-8" />,
      title: "Blog Content",
      description: "SEO-optimized blog posts that establish authority and drive traffic.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Strategy Briefs",
      description: "Complete marketing strategies with actionable steps and timelines.",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const benefits = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Generate complete marketing assets in under 60 seconds"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Proven Templates",
      description: "Built on frameworks that have generated millions in revenue"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Ready",
      description: "Collaborate with your team and manage everything in one place"
    }
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Scale Your Marketing
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate professional marketing assets in minutes, not hours. 
            No marketing experience required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="group relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-200/50 hover:border-gray-300/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6`}>
                {feature.icon}
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
            Why Choose AMAP?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex p-4 bg-white rounded-2xl shadow-sm mb-6">
                  <div className="text-purple-600">
                    {benefit.icon}
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h4>
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
