"use client";

import { cn } from "@/lib/utils";
import {
  IconBrain,
  IconUsers,
  IconFileText,
  IconCalendarEvent,
  IconChartBar,
  IconMessageChatbot,
} from "@tabler/icons-react";
import React from "react";

const features = [
  {
    title: "Your 24/7 AI Tutor",
    description:
      "Ask complex questions and get instant, easy-to-understand answers, anytime you're stuck.",
    icon: <IconMessageChatbot />,
  },
  {
    title: "Customizable AI Personas",
    description:
      "Choose from various AI personalities to make learning more engaging.",
    icon: <IconUsers />,
  },
  {
    title: "Instant Study Materials",
    description:
      "Generate summaries, quizzes, and flashcards from any document or topic in seconds.",
    icon: <IconFileText />,
  },
  {
    title: "Personalized Study Plans",
    description:
      "Let our AI create a tailored study plan to help you prepare for your exams.",
    icon: <IconCalendarEvent />,
  },
  {
    title: "Track Your Progress",
    description:
      "Stay motivated with study streaks, goals, and achievement badges on your personal dashboard.",
    icon: <IconChartBar />,
  },
  {
    title: "Context-Aware Conversations",
    description:
      "Our AI remembers your previous conversations, providing a seamless and personalized learning experience.",
    icon: <IconBrain />,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 py-10 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
        (index === 0 || index === 3) && "lg:border-l dark:border-neutral-800",
        index < 3 && "lg:border-b dark:border-neutral-800"
      )}
    >
      {index < 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-primary">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-foreground">
          {title}
        </span>
      </div>
      <p className="text-sm text-muted-foreground max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};