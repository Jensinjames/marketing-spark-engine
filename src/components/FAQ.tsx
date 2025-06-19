
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Can I use this if I have zero marketing experience?",
      answer: "Absolutely. Just describe your business or offer, and AI Copilot handles the rest — no guesswork required."
    },
    {
      question: "What platforms does it integrate with?",
      answer: "You can connect it to tools like Zapier, n8n, Mailchimp, ConvertKit, Webflow, and more. Use your stack, your way."
    },
    {
      question: "Do I own the content it generates?",
      answer: "Yes — every email, ad, landing page, and funnel is 100% yours to use, modify, or scale."
    },
    {
      question: "What's included in the free plan?",
      answer: "The free plan gives you limited access to core tools, enough to test real outputs before upgrading."
    },
    {
      question: "How long does it take to generate a full funnel?",
      answer: "Most users generate complete campaigns (ads, landing page, email sequence) in under 10 minutes."
    },
    {
      question: "Can I use it for clients or multiple brands?",
      answer: "Yes — our Elite and Custom tiers are designed for agencies, freelancers, and power users."
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            🙋‍♂️ Frequently Asked
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about AI Marketing Copilot
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-200/50 p-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:text-purple-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
