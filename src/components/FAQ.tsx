
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Do I need marketing experience?",
      answer: "No—just describe your offer and Copilot does the rest."
    },
    {
      question: "What can I integrate?",
      answer: "Zapier, n8n, Mailchimp, ConvertKit, Webflow, and more."
    },
    {
      question: "Do I own what I create?",
      answer: "Yes—100% yours to use or resell."
    },
    {
      question: "What's in the free plan?",
      answer: "All core features, limited by monthly credits."
    },
    {
      question: "Is it fast?",
      answer: "Yes—most campaigns launch in under 10 minutes."
    },
    {
      question: "Agency/multi-brand ready?",
      answer: "Elite & Custom plans include team and client support."
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Frequently Asked
            </span>
          </h2>
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
