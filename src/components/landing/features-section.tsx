'use client';

import { BrainCircuit, ClipboardList, Users, Sparkles, BookOpen, BarChart } from 'lucide-react';

const features = [
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: 'Your 24/7 AI Tutor',
    description: 'Ask complex questions and get instant, easy-to-understand answers, anytime you\'re stuck.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Customizable AI Personas',
    description: 'Choose from various AI personalities to make learning more engaging.',
  },
  {
    icon: <ClipboardList className="h-8 w-8 text-primary" />,
    title: 'Instant Study Materials',
    description: 'Generate summaries, quizzes, and flashcards from any document or topic in seconds.',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Personalized Study Plans',
    description: 'Let our AI create a tailored study plan to help you prepare for your exams.',
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: 'Track Your Progress',
    description: 'Stay motivated with study streaks, goals, and achievement badges on your personal dashboard.',
  },
  {
    icon: <BrainCircuit className="h-8 w-8 text-primary" />,
    title: 'Context-Aware Conversations',
    description: 'Our AI remembers your previous conversations, providing a seamless and personalized learning experience.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-heading">
            A Smarter Way to Study
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-snug">
            FocusFlow AI integrates every tool you need to learn better, all in one intelligent platform.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6">
              <div className="inline-block p-4 bg-background rounded-full mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
