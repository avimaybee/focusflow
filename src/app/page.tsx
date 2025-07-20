
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, X } from 'lucide-react';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { AnimatePresence, motion } from 'framer-motion';
import { BackgroundLines } from '@/components/ui/background-lines';
import { PreviewChatWidget } from '@/components/ui/preview-chat-widget';
import { FeaturesSection } from '@/components/landing/features-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { FaqSection } from '@/components/landing/faq-section';
import { InteractiveDemo } from '@/components/ui/interactive-demo';
import { faqs, testimonials } from '@/lib/landing-page-data';



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
        </motion.div>
    );
}

export default function LandingPage() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const authModal = useAuthModal();

  return (
    <div className="flex-grow bg-background">
      <main>
        {/* Hero Section */}
        <section className="relative">
          <BackgroundLines className="py-20 md:py-24 lg:py-32">
            <div className="relative z-10 text-center container mx-auto px-4 flex flex-col items-center">
                 <h1 className="text-4xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight tracking-tighter text-foreground">
                    Your AI Co-Pilot for Learning
                </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                FocusFlow is your all-in-one toolkit. Turn any document into summaries, flashcards, and quizzes in seconds.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" onClick={() => authModal.onOpen('signup')}>
                    Get Started for Free
                </Button>
                <Link href="#features">
                    <Button size="lg" variant="outline">
                        Learn More <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
              </div>
            </div>
          </BackgroundLines>
        </section>

        <section className="py-20">
            <InteractiveDemo />
        </section>

        <FeaturesSection />

        <TestimonialsSection testimonials={testimonials} />

        <FaqSection faqs={faqs} />
      </main>
      <AnimatePresence>
        {isWidgetOpen && <PreviewChatWidget onClose={() => setIsWidgetOpen(false)} />}
      </AnimatePresence>
      <FloatingWidgetButton isOpen={isWidgetOpen} onClick={() => setIsWidgetOpen(!isWidgetOpen)} />
    </div>
  );
}
