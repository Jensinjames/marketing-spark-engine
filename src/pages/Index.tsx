
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SecurityTrust from "@/components/SecurityTrust";
import Features from "@/components/Features";
import UseCases from "@/components/UseCases";
import Integrations from "@/components/Integrations";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      <Hero />
      <SecurityTrust />
      <Features />
      <UseCases />
      <Integrations />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
