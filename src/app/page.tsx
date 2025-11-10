
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { motion } from 'framer-motion';
import { DotBackground } from '@/components/ui/dot-background';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { FlipWords } from '@/components/ui/flip-words';
import { FeaturesSection } from '@/components/landing/features-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { FaqSection } from '@/components/landing/faq-section';
import { LandingPageChatV2 } from '@/components/landing/landing-page-chat-v2';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { faqs, testimonials } from '@/lib/landing-page-data';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { VisionSection } from '@/components/landing/vision-section';

export default function LandingPage() {
  const authModal = useAuthModal();
  const words = ["summaries", "flashcards", "quizzes", "study plans"];

  return (
    <DotBackground>
      <div className="flex-grow">
        <main>
          {/* Hero Section */}
          <section className="relative py-20 md:py-32">
            <div className="relative z-10 text-center container mx-auto px-4 flex flex-col items-center">
                  <h1 className="text-4xl md:text-6xl font-bold max-w-4xl mx-auto leading-[1.15] tracking-tight text-foreground mb-8">
                      Your AI Co-Pilot for
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-primary"
                      > Learning</motion.span>
                  </h1>
                <div className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  FocusFlow is your all-in-one toolkit. Turn any document into
                  <FlipWords words={words} /> in seconds.
                </div>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/chat">
                      <HoverBorderGradient
                        containerClassName="rounded-full"
                        as="a"
                        className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2 px-8 py-4 text-lg"
                      >
                        Lets Start!
                      </HoverBorderGradient>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="#features">
                      <HoverBorderGradient
                        containerClassName="rounded-full"
                        as="button"
                        className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2 px-8 py-4 text-lg"
                      >
                          Learn More <ArrowRight className="ml-2 h-4 w-4" />
                      </HoverBorderGradient>
                    </Link>
                  </motion.div>
                </div>
              </div>
          </section>

          <ScrollReveal>
            <section className="py-20">
                <LandingPageChatV2 />
            </section>
          </ScrollReveal>

          <ScrollReveal yOffset={50}>
            <FeaturesSection />
          </ScrollReveal>
          
          <ScrollReveal yOffset={50} delay={0.1}>
            <SocialProofSection />
          </ScrollReveal>

          <ScrollReveal yOffset={50} delay={0.2}>
            <TestimonialsSection testimonials={testimonials} />
          </ScrollReveal>

          <ScrollReveal yOffset={50} delay={0.4}>
            <FaqSection faqs={faqs} />
          </ScrollReveal>

          <ScrollReveal yOffset={50} delay={0.5}>
            <VisionSection />
          </ScrollReveal>
        </main>
      </div>
    </DotBackground>
  );
}
