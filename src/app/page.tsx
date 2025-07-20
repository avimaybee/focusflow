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
import { VisionSection } from '@/components/landing/vision-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { FaqSection } from '@/components/landing/faq-section';

const HeroGradient = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 -z-10 overflow-hidden"
  >
    <div className="absolute left-[50%] top-0 h-[50rem] w-[50rem] -translate-x-[50%] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(60,130,246,0.15),rgba(255,255,255,0))]" />
  </div>
);

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
        <section className="relative bg-background">
          <div className="relative py-20 md:py-24 lg:py-32 flex items-center justify-center">
            <BackgroundLines className="absolute inset-0 h-full w-full" />
            <HeroGradient />
            <div className="relative z-10 text-center container mx-auto px-4 flex flex-col items-center">
              <TextFlip
                words={[
                  'Generate Study Materials',
                  'Summarize Research PDFs',
                  'Ace Your Next Exam',
                  'Explain Complex Concepts',
                ]}
                className="text-4xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight tracking-tighter text-foreground"
              />
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                FocusFlow is your AI co-pilot for learning. Turn any document into summaries, flashcards, and quizzes in seconds.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" onClick={() => authModal.onOpen('signup')}>
                    Get Started for Free
                </Button>
                <Link href="#features">
                    <Button size="lg" variant="outline">
                        Learn More <span aria-hidden="true" className="ml-2">→</span>
                    </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <FeaturesSection />

        <VisionSection />

        <SocialProofSection />

        <TestimonialsSection />

        <FaqSection />
      </main>
      <AnimatePresence>
        {isWidgetOpen && <PreviewChatWidget onClose={() => setIsWidgetOpen(false)} />}
      </AnimatePresence>
      <FloatingWidgetButton isOpen={isWidgetOpen} onClick={() => setIsWidgetOpen(!isWidgetOpen)} />
    </div>
  );
}
