
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play, Calendar } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-16 pb-24">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-purple-200/50 text-sm font-medium text-purple-700 mb-8">
            <Sparkles className="h-4 w-4 mr-2" />
            Your Full-Stack Marketing Assistant — On Autopilot
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 leading-tight">
            <span className="block bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Marketing Copilot
            </span>
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-8">
            Stop Wasting Time on Marketing. Start Scaling.
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            You didn't launch a business to become a full-time marketer. But growth depends on the right message, the right funnel, at the right time. AI Marketing Copilot takes your idea — and instantly turns it into emails, ads, landing pages, and full funnels tailored to your audience.
          </p>
          
          <p className="text-lg text-gray-700 mb-12 max-w-3xl mx-auto font-medium">
            👉 No team required. No guesswork. Just launch-ready marketing in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-4 h-auto">
                Try It Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-2 hover:bg-white/80">
              <Play className="mr-2 h-5 w-5" />
              See Live Demo
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-2 hover:bg-white/80">
              <Calendar className="mr-2 h-5 w-5" />
              Book a Strategy Call
            </Button>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-3xl" />
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-2xl">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-left">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <div className="font-mono text-sm text-green-400">
                  <div className="mb-2">$ Generate complete marketing funnel for SaaS startup</div>
                  <div className="mb-2 text-gray-400">→ Analyzing your business model...</div>
                  <div className="mb-2 text-gray-400">→ Creating email sequences (5 emails)...</div>
                  <div className="mb-2 text-gray-400">→ Writing Facebook & Google ads...</div>
                  <div className="mb-2 text-gray-400">→ Building landing page copy...</div>
                  <div className="text-green-400">✓ Complete funnel generated in 8 seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
