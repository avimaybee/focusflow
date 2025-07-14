
'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText,
  HelpCircle,
  BookOpen,
  LayoutGrid,
  Plus,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { ExpandedTabs } from '@/components/ui/expanded-tabs';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Mock data for user's content
const allContent = [
  {
    id: 1,
    type: 'summary',
    title: 'Quantum Physics Summary',
    description: 'A summary of the key concepts from the lecture on quantum mechanics.',
    date: '2025-07-10',
  },
  {
    id: 2,
    type: 'quiz',
    title: 'History Midterm Quiz',
    description: 'A 20-question quiz covering the major events of WWII.',
    date: '2025-07-09',
  },
  {
    id: 3,
    type: 'flashcards',
    title: 'Biology Vocabulary',
    description: 'A set of 50 flashcards for key biological terms.',
    date: '2025-07-08',
  },
  {
    id: 4,
    type: 'summary',
    title: 'The Great Gatsby Notes',
    description: 'A chapter-by-chapter summary of the novel.',
    date: '2025-07-07',
  },
  {
    id: 5,
    type: 'summary',
    title: 'Calculus Formulas',
    description: 'A concise summary of important differentiation rules.',
    date: '2025-07-11',
  },
  {
    id: 6,
    type: 'quiz',
    title: 'Chemistry Pop Quiz',
    description: 'A quick 10-question quiz on the periodic table.',
    date: '2025-07-05',
  },
];

const contentIcons: { [key: string]: React.ElementType } = {
  summary: FileText,
  quiz: HelpCircle,
  flashcards: BookOpen,
};

export default function MyContentPage() {
  const [activeTab, setActiveTab] = React.useState('All');

  const tabs = [
    { title: 'All', icon: LayoutGrid, type: 'tab' as const },
    { title: 'Summaries', icon: FileText, type: 'tab' as const },
    { title: 'Quizzes', icon: HelpCircle, type: 'tab' as const },
    { title: 'Flashcards', icon: BookOpen, type: 'tab' as const },
  ];

  const filteredContent = allContent.filter(
    (item) =>
      activeTab === 'All' ||
      item.type === activeTab.slice(0, -1).toLowerCase()
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-secondary/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-4xl font-bold font-heading">My Content</h1>
            <p className="text-lg text-muted-foreground mt-1 max-w-2xl">
              All of your generated study materials, saved in one place.
            </p>
            <div className="mt-6">
              <ExpandedTabs tabs={tabs} onTabChange={setActiveTab} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredContent.map((item) => {
                const Icon = contentIcons[item.type];
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full flex flex-col hover:border-primary/80 hover:bg-muted transition-all">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle>{item.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col">
                        <CardDescription className="flex-grow mb-4">
                          {item.description}
                        </CardDescription>
                        <p className="text-xs text-muted-foreground">
                          Created: {item.date}
                        </p>
                      </CardContent>
                      <div className="p-6 pt-0">
                         <Button asChild className="w-full">
                            <Link href="#">View Content</Link>
                         </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center border-2 border-dashed border-border/80 rounded-lg hover:border-primary hover:text-primary transition-all min-h-[200px]"
            >
              <Button
                variant="ghost"
                className="h-full w-full flex flex-col gap-2 text-muted-foreground"
                asChild
              >
                <Link href="/chat">
                    <Plus className="h-8 w-8" />
                    <span>Create New Content</span>
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
