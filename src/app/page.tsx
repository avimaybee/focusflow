
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import {
  BrainCircuit,
  Combine,
  Lightbulb,
  Zap,
  MoveRight,
  Quote,
  BookOpen,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { cn } from '@/lib/utils';
import { GlowingCard } from '@/components/ui/glowing-card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { useAuthModal } from '@/hooks/use-auth-modal';

const HeroGradient = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 -z-10 overflow-hidden"
  >
    <div className="absolute left-[50%] top-0 h-[50rem] w-[50rem] -translate-x-[50%] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(60,130,246,0.15),rgba(255,255,255,0))]" />
  </div>
);

const AppPreview = () => (
  <div className="relative w-full max-w-6xl mx-auto mt-16">
    <div className="aspect-[16/9] rounded-2xl bg-background/50 border-2 border-primary/10 shadow-2xl shadow-primary/20 flex items-center justify-center p-4">
      <div className="w-full h-full rounded-lg bg-background/80 flex flex-col ring-1 ring-inset ring-border">
        <div className="h-10 bg-secondary rounded-t-lg flex items-center px-4 justify-between">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="w-1/2 h-4 bg-muted/50 rounded-full" />
        </div>
        <div className="flex-1 p-6 grid grid-cols-3 gap-6">
          <div className="col-span-1 bg-secondary/80 rounded-lg p-4 space-y-4">
            <div className="h-8 w-8 rounded-lg bg-primary/20" />
            <div className="h-4 w-3/4 rounded-full bg-muted/80" />
            <div className="h-4 w-1/2 rounded-full bg-muted/80" />
            <div className="h-4 w-5/6 rounded-full bg-muted/80" />
          </div>
          <div className="col-span-2 bg-secondary/80 rounded-lg p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted/80 rounded-full w-3/4" />
                <div className="h-4 bg-muted/80 rounded-full w-1/2" />
              </div>
            </div>
            <div className="flex items-start gap-3 justify-end">
              <div className="space-y-2 flex-1 text-right">
                <div className="h-4 bg-primary/20 rounded-full w-3/4 ml-auto" />
              </div>
              <div className="w-8 h-8 rounded-full bg-background flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BentoGrid = () => {
  const features = [
    {
      icon: <ClipboardList className="h-8 w-8 text-primary" />,
      title: 'Generate Summaries',
      description: 'Distill long texts into concise summaries.',
      className: 'md:col-span-1',
    },
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: 'Create Flashcards',
      description: 'Turn notes into interactive flashcards for active recall.',
      className: 'md:col-span-1',
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      title: 'Build Quizzes',
      description: 'Test your knowledge with AI-generated quizzes.',
      className: 'md:col-span-1',
    },
    {
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      title: 'AI-Powered Chat',
      description:
        'Go beyond simple questions with a contextual AI tutor that understands your materials.',
      className: 'md:col-span-2',
    },
    {
      icon: <Combine className="h-8 w-8 text-primary" />,
      title: 'Seamless Workflow',
      description:
        'From upload to summary to quiz, enjoy a frictionless study experience.',
      className: 'md:col-span-1',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <GlowingCard
          key={index}
          className={cn('transition-colors', feature.className)}
        >
          <div className="glowing-card-content p-6 flex flex-col gap-4 items-start justify-center h-full">
            <div className="bg-primary/10 rounded-lg h-14 w-14 flex items-center justify-center border border-primary/20">
              {feature.icon}
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        </GlowingCard>
      ))}
    </div>
  );
};

export default function LandingPage() {
  const { onOpen } = useAuthModal();

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
      name: 'Sarah J.',
      role: 'University Student',
    },
    {
      quote:
        "The 'Explain This' feature alone is worth its weight in gold. I can finally get unstuck without breaking my study flow. It's like having a tutor on standby 24/7.",
      name: 'Mike T.',
      role: 'High School Senior',
    },
    {
      quote:
        'I love the dashboard and the study streak. It actually makes me want to log my hours and stay consistent. Who knew studying could be fun?',
      name: 'Emily R.',
      role: 'College Freshman',
    },
    {
      quote:
        'As someone with ADHD, the AI-generated study plans are a lifesaver. It breaks everything down into manageable chunks and keeps me on track.',
      name: 'Alex P.',
      role: 'Graduate Student',
    },
    {
      quote:
        'The different AI personas are a fantastic touch. Switching to the "Cram Buddy" persona before an exam really gets me in the zone.',
      name: 'Jessica W.',
      role: 'Medical Student',
    }
  ];

  return (
    <>
      <Header />
      <div className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 text-center">
          <HeroGradient />
          <div className="container mx-auto px-4 relative">
            <h1 className="text-4xl md:text-6xl font-bold max-w-3xl mx-auto leading-tight tracking-tighter font-heading">
              Study Smarter, Not Harder
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              FocusFlow is your AI co-pilot for learning. Turn any document
              into summaries, flashcards, and quizzes—in seconds.
            </p>
            <div className="mt-8 flex gap-4 justify-center">
              <motion.div layoutId="auth-modal-trigger-hero">
                <Button size="lg" onClick={() => onOpen('signup', 'auth-modal-trigger-hero')}>
                  Get Started for Free{' '}
                  <MoveRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </div>
            <AppPreview />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold font-heading">
                Your Entire Study Toolkit, Reimagined
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-snug">
                FocusFlow AI integrates every tool you need to learn better,
                all in one intelligent platform.
              </p>
            </div>
            <div className="mt-12 max-w-6xl mx-auto">
              <BentoGrid />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold font-heading">
                Loved by Students Everywhere
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-snug">
                Don't just take our word for it. Here's what students are
                saying.
              </p>
            </div>
            <Carousel
              opts={{
                align: 'start',
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 3000,
                }),
              ]}
              className="w-full mt-12"
            >
              <CarouselContent>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card className="bg-background/60 border-border/60 h-full">
                        <CardContent className="p-6 flex flex-col h-full">
                          <Quote className="w-8 h-8 text-primary/50 mb-4" />
                          <p className="italic text-base text-foreground/90 leading-relaxed flex-grow">
                            "{testimonial.quote}"
                          </p>
                          <div className="mt-6">
                            <p className="font-semibold text-sm">
                              {testimonial.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {testimonial.role}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </section>

        {/* FAQ Section */}
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
      </div>
      <Footer />
    </>
  );
}
