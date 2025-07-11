
'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BrainCircuit, FileText, HelpCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

const contentTypes = [
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'My Summaries',
    description: 'Review all the notes and documents you have summarized.',
    href: '/my-content/summaries',
  },
  {
    icon: <HelpCircle className="h-8 w-8 text-primary" />,
    title: 'My Quizzes',
    description: 'Re-take practice quizzes you have generated.',
    href: '#', // Coming soon
    disabled: true,
  },
  {
    icon: <BrainCircuit className="h-8 w-8 text-primary" />,
    title: 'My Flashcards',
    description: 'Study with the flashcard sets you have created.',
    href: '#', // Coming soon
    disabled: true,
  },
  {
    icon: <Calendar className="h-8 w-8 text-primary" />,
    title: 'My Study Plans',
    description: 'View and manage your personalized study plans.',
    href: '#', // Coming soon
    disabled: true,
  },
];

export default function MyContentPage() {
  return (
    <>
      <Header />
      <main className="flex-grow bg-secondary/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">My Saved Content</h1>
            <p className="text-lg text-muted-foreground">
              All of your generated study materials, saved in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contentTypes.map((type) => (
              <Card 
                key={type.title} 
                className={`flex flex-col ${type.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/80 hover:bg-muted transition-all'}`}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      {type.icon}
                    </div>
                    <CardTitle>{type.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <CardDescription className="flex-grow">{type.description}</CardDescription>
                  <Button asChild className="mt-4" disabled={type.disabled}>
                    <Link href={type.href}>
                      {type.disabled ? 'Coming Soon' : 'View All'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
