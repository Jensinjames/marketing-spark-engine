
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    console.log("Newsletter signup:", email);
    setEmail("");
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <Mail className="h-12 w-12 text-purple-600 mx-auto mb-6" />
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            📬 Get AI Funnel-Building Tips & Tools
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Weekly insights on AI marketing, growth strategies, and tool recommendations — delivered to your inbox.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Subscribe
            </Button>
          </form>
          
          <p className="text-sm text-gray-500 mt-4">
            1x/week. Unsubscribe anytime. No spam, ever.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
