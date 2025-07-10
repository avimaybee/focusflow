
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BrainCircuit,
  Combine,
  Lightbulb,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function LandingPage() {
  const features = [
    {
      icon: <Combine className="h-8 w-8 text-primary" />,
      title: 'The Seamless AI Workflow',
      description:
        'Stop juggling apps. FocusFlow is your single, intelligent hub for every study need, from summaries to quizzes, all in one place.',
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-primary" />,
      title: 'AI-Powered Active Learning',
      description:
        "Don't just read it, master it. Actively learn and truly understand with AI-generated flashcards, quizzes, and contextual explanations.",
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      title: 'High-Quality, Contextual AI Output',
      description:
        'Get precise summaries, smart plans, and effective learning tools, powered by Gemini for intelligent, tailored study assistance.',
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: 'Frictionless & Rewarding Experience',
      description:
        'Start studying smarter in seconds with no signup required. Enjoy a delightful and rewarding journey with a gamified dashboard.',
    },
  ];

  const faqs = [
    {
      question: 'Is FocusFlow AI free to use?',
      answer:
        'Yes! FocusFlow AI offers a generous free tier that includes access to all our core tools, including the summarizer, planner, and quiz generator. For advanced features like the AI Tutor, we offer a Premium plan.',
    },
    {
      question: 'What makes FocusFlow AI different from other study tools?',
      answer:
        "FocusFlow AI is an all-in-one, integrated toolkit. Instead of using separate apps for summarizing, planning, and quizzing, you can do it all in a seamless workflow. Our conversational interface and deep, contextual learning features like 'Explain This Concept' provide a unique, interactive experience.",
    },
    {
      question: 'What technology powers the AI?',
      answer:
        "Our AI features are powered by Google's state-of-the-art Gemini models, orchestrated through Genkit. This ensures high-quality, relevant, and safe responses tailored for educational purposes.",
    },
    {
      question: 'Can I use my own notes or documents?',
      answer:
        'Absolutely. You can paste text directly into the chat or upload documents like PDFs. The AI will use your material as the source for generating summaries, flashcards, and quizzes.',
    },
  ];

  const testimonials = [
    {
      quote:
        'This app is a game-changer. I went from juggling three different apps to just one. The seamless flow from summary to flashcards is brilliant.',
      name: 'Sarah J., University Student',
      avatar: 'https://placehold.co/100x100.png',
    },
    {
      quote:
        "The 'Explain This' feature alone is worth its weight in gold. I can finally get unstuck without breaking my study flow. It's like having a tutor on standby 24/7.",
      name: 'Mike T., High School Senior',
      avatar: 'https://placehold.co/100x100.png',
    },
    {
      quote:
        'I love the dashboard and the study streak. It actually makes me want to log my hours and stay consistent. Who knew studying could be fun?',
      name: 'Emily R., College Freshman',
      avatar: 'https://placehold.co/100x100.png',
    },
  ];

  return (
    <>
      <Header />
      <div className="flex-grow">
          {/* Hero Section */}
          <section className="py-20 md:py-32 text-center">
            <div className="container mx-auto px-4">
              <h1 className="text-4xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight">
                Free AI Note Summarizer & Study Planner for Students
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Stop juggling apps. Summarize notes, create flashcards, build
                study plans, and chat with an AI tutor—all in one place.
              </p>
              <div className="mt-8">
                <Button size="lg" asChild>
                  <Link href="/chat">Start Free – No Signup Needed</Link>
                </Button>
              </div>
              <div className="mt-12">
                <Image
                  src="https://placehold.co/1200x600.png"
                  width={1200}
                  height={600}
                  alt="FocusFlow AI App Preview"
                  className="rounded-lg shadow-2xl"
                  data-ai-hint="app interface"
                />
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-20 bg-muted/50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center">
                Your All-in-One AI Study Toolkit
              </h2>
              <p className="mt-4 text-lg text-muted-foreground text-center max-w-3xl mx-auto leading-snug">
                FocusFlow AI integrates every tool you need to study smarter, not
                harder.
              </p>
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature, index) => (
                  <Card key={index} className="text-center">
                    <CardHeader>
                      <div className="mx-auto bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center">
                        {feature.icon}
                      </div>
                      <CardTitle className="pt-4 text-xl">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section id="testimonials" className="py-20">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center">
                Loved by Students Everywhere
              </h2>
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <p className="italic text-base leading-relaxed">"{testimonial.quote}"</p>
                      <div className="mt-4 flex items-center gap-3">
                        <Image
                          src={testimonial.avatar}
                          width={40}
                          height={40}
                          alt={testimonial.name}
                          className="rounded-full"
                          data-ai-hint="person"
                        />
                        <p className="font-semibold text-sm">{testimonial.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="py-20 bg-muted/50">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-3xl font-bold text-center">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="w-full mt-8">
                {faqs.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-lg text-left font-medium leading-snug">
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
      </div>
      <Footer />
    </>
  );
}
