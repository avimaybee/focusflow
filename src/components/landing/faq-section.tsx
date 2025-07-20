'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Is FocusFlow AI free to use?',
    answer: 'Yes! FocusFlow AI offers a generous free tier that includes access to all our core tools, including the summarizer, planner, and quiz generator. For advanced features like the AI Tutor, we offer a Premium plan.',
  },
  {
    question: 'What makes FocusFlow AI different from other study tools?',
    answer: "FocusFlow AI is an all-in-one, integrated toolkit. Instead of using separate apps for summarizing, planning, and quizzing, you can do it all in a seamless workflow. Our conversational interface and deep, contextual learning features like 'Explain This Concept' provide a unique, interactive experience.",
  },
  {
    question: 'What technology powers the AI?',
    answer: "Our AI features are powered by Google's state-of-the-art Gemini models, orchestrated through Genkit. This ensures high-quality, relevant, and safe responses tailored for educational purposes.",
  },
  {
    question: 'Can I use my own notes or documents?',
    answer: 'Absolutely. You can paste text directly into the chat or upload documents like PDFs. The AI will use your material as the source for generating summaries, flashcards, and quizzes.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-heading">
            Frequently Asked Questions
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full mt-8">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="text-lg text-left font-medium leading-snug hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
