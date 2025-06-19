
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Calendar, Zap } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <Zap className="h-16 w-16 mx-auto mb-6 text-yellow-300" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ⚡ Ready to Build Smarter?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
            Let AI handle the heavy lifting — while you focus on growing your business.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/signup">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold">
              Try It Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-2 border-white text-white hover:bg-white/10">
            <Play className="mr-2 h-5 w-5" />
            See Live Demo
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-2 border-white text-white hover:bg-white/10">
            <Calendar className="mr-2 h-5 w-5" />
            Book a Strategy Call
          </Button>
        </div>

        <p className="text-blue-200 mt-8 text-lg">
          Join thousands of founders who've already transformed their marketing with AI
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;
