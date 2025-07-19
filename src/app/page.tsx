'use client';

import { useState, useEffect } from 'react';
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
  ClipboardList,
  Library,
  MessageCircle,
  Quote,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlowingCard } from '@/components/ui/glowing-card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthModal } from '@/hooks/use-auth-modal';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { AnimatePresence, motion } from 'framer-motion';
import { BackgroundLines } from '@/components/ui/background-lines';
import { TextFlip } from '@/components/ui/text-flip';
import { PreviewChatWidget } from '@/components/ui/preview-chat-widget';

const HeroGradient = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 -z-10 overflow-hidden"
  >
    <div className="absolute left-[50%] top-0 h-[50rem] w-[50rem] -translate-x-[50%] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(60,130,246,0.15),rgba(255,255,255,0))]" />
  </div>
);

const BentoGrid = () => {
  const features = [
    {
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      title: 'AI-Powered Chat',
      description:
        'Go beyond simple questions with a contextual AI tutor that understands your materials.',
      className: 'md:col-span-2',
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: 'Customizable AI Personas',
      description:
        'Choose from various AI personalities, from a formal professor to a sassy friend.',
      className: 'md:col-span-1',
    },
    {
      icon: <ClipboardList className="h-8 w-8 text-primary" />,
      title: 'Generate Study Materials',
      description:
        'Instantly create summaries, quizzes, and flashcards from any document.',
      className: 'md:col-span-1',
    },
    {
      icon: <Library className="h-8 w-8 text-primary" />,
      title: 'Rich Prompt Library',
      description:
        'Kickstart your sessions with expertly crafted prompts for any study task.',
      className: 'md:col-span-1',
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      title: 'Track Your Progress',
      description:
        'Log study sessions, set goals, and earn badges on your personal dashboard.',
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

const FloatingWidgetButton = ({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowTooltip(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 }}
            className="fixed bottom-5 right-5 z-50"
        >
            <TooltipProvider>
                <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
                    <TooltipTrigger asChild>
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1, 1.1, 1],
                                rotate: [0, 5, -5, 5, 0],
                            }}
                            transition={{
                                delay: 1.5,
                                duration: 0.7,
                                repeat: 2,
                                ease: 'easeInOut',
                            }}
                        >
                            <Button
                                size="icon"
                                className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90"
                                onClick={() => {
                                    onClick();
                                    setShowTooltip(false);
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {isOpen ? (
                                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                                            <X className="h-7 w-7" />
                                        </motion.div>
                                    ) : (
                                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                                            <MessageCircle className="h-7 w-7" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-primary text-primary-foreground">
                        <p>Try FocusFlow AI instantly!</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </motion.div>
    );
}


export default function LandingPage() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const authModal = useAuthModal();

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
        'I turned my confusing 50-page research paper into flashcards and actually understood it. Took less than a minute.',
      name: 'Sarah J.',
      role: 'History Major, UCLA',
    },
    {
      quote:
        "FocusFlow helped me go from zero prep to a full AI-generated quiz for my psych exam. I got an A.",
      name: 'Mike T.',
      role: 'Psychology Student, NYU',
    },
    {
      quote:
        'I uploaded my syllabus and had a complete semester study plan within 5 minutes. It’s a lifesaver for staying organized.',
      name: 'Emily R.',
      role: 'Pre-Med, Johns Hopkins',
    },
    {
      quote:
        'As someone with ADHD, the AI-generated study plans are a lifesaver. It breaks everything down into manageable chunks and keeps me on track.',
      name: 'Alex P.',
      role: 'Graduate Student, Stanford',
    },
    {
      quote:
        'The different AI personas are a fantastic touch. Switching to the "Cram Buddy" persona before an exam really gets me in the zone.',
      name: 'Jessica W.',
      role: 'Medical Student, Harvard',
    },
  ];

  return (
    <div className="flex-grow bg-background">
      <main>
        {/* Hero Section */}
        <section className="relative bg-background overflow-hidden">
          <div className="relative py-20 md:py-24 lg:py-32 flex items-center justify-center">
            <BackgroundLines className="absolute inset-0 h-full w-full" />
            <div className="relative z-10 text-center container mx-auto px-4 flex flex-col items-center">
              <HeroGradient />
              <TextFlip
                words={[
                  'Generate Study Materials',
                  'Summarize Research PDFs',
                  'Ace Your Next Exam',
                  'Explain Complex Concepts',
                ]}
                className="text-4xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight tracking-tighter text-foreground"
              />
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                FocusFlow is your AI co-pilot for learning. See how it can turn any document into summaries, flashcards, and quizzes in seconds.
              </p>
              <div className="mt-12 flex flex-col items-center gap-4">
                <Button size="lg" onClick={() => authModal.onOpen('signup')}>
                    Get Started for Free
                </Button>
                <Button variant="link" className="text-muted-foreground" onClick={() => setIsWidgetOpen(true)}>
                    or, try without signing up
                </Button>
              </div>
              <div className="mt-12 text-sm text-muted-foreground">
                Trusted by <span className="font-semibold text-foreground">15,000+ students</span> at <span className="font-semibold text-foreground">50+ universities</span> worldwide
              </div>
            </div>
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

        {/* Trusted by Section */}
        <section id="trusted-by" className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold font-heading">
                        Trusted by Students at Top Universities
                    </h2>
                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 items-center">
                        {/* Replace with actual university logos */}
                        <div className="flex justify-center">
                            <img src="/logos/placeholder.svg" alt="University Logo" className="h-8 filter grayscale hover:grayscale-0 transition-all" />
                        </div>
                        <div className="flex justify-center">
                            <img src="/logos/placeholder.svg" alt="University Logo" className="h-8 filter grayscale hover:grayscale-0 transition-all" />
                        </div>
                        <div className="flex justify-center">
                            <img src="/logos/placeholder.svg" alt="University Logo" className="h-8 filter grayscale hover:grayscale-0 transition-all" />
                        </div>
                        <div className="flex justify-center">
                            <img src="/logos/placeholder.svg" alt="University Logo" className="h-8 filter grayscale hover:grayscale-0 transition-all" />
                        </div>
                        <div className="flex justify-center">
                            <img src="/logos/placeholder.svg" alt="University Logo" className="h-8 filter grayscale hover:grayscale-0 transition-all" />
                        </div>
                        <div className="flex justify-center">
                            <img src="/logos/placeholder.svg" alt="University Logo" className="h-8 filter grayscale hover:grayscale-0 transition-all" />
                        </div>
                    </div>
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
                  <CarouselItem
                    key={index}
                    className="md:basis-1/2 lg:basis-1/3"
                  >
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
      </main>
      <AnimatePresence>
        {isWidgetOpen && <PreviewChatWidget onClose={() => setIsWidgetOpen(false)} />}
      </AnimatePresence>
      <FloatingWidgetButton isOpen={isWidgetOpen} onClick={() => setIsWidgetOpen(!isWidgetOpen)} />
    </div>
  );
}
