'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Loader2, FileText, HelpCircle, BookOpen, Save, Calendar, Star, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

const contentIcons: { [key: string]: React.ElementType } = {
  summary: FileText,
  quiz: HelpCircle,
  flashcardSet: BookOpen,
  savedMessage: Save,
  studyPlan: Calendar,
};

export interface ContentItem {
    id: string;
    type: 'summary' | 'quiz' | 'flashcardSet' | 'savedMessage' | 'studyPlan';
    title: string;
    description: string;
    createdAt: Date;
    isPublic: boolean;
    publicSlug: string | null;
    tags: string[];
    isFavorited: boolean;
    lastViewed: Date;
}

const placeholderContent: ContentItem[] = [
    {
        id: '1',
        type: 'summary',
        title: 'Placeholder Summary',
        description: 'This is a placeholder summary of some notes.',
        createdAt: new Date(),
        isPublic: false,
        publicSlug: null,
        tags: ['placeholder', 'summary'],
        isFavorited: false,
        lastViewed: new Date(),
    },
    {
        id: '2',
        type: 'quiz',
        title: 'Placeholder Quiz',
        description: 'A placeholder quiz on a fascinating topic.',
        createdAt: new Date(),
        isPublic: false,
        publicSlug: null,
        tags: ['placeholder', 'quiz'],
        isFavorited: true,
        lastViewed: new Date(),
    },
];

const getContentLink = (item: ContentItem): string | undefined => {
  switch (item.type) {
    case 'summary':
      return `/my-content/summaries/${item.id}`;
    case 'quiz':
      return `/my-content/quizzes/${item.id}`;
    case 'flashcardSet':
      return `/my-content/flashcardSets/${item.id}`;
    case 'savedMessage':
      return `/my-content/savedMessages/${item.id}`;
    case 'studyPlan':
      return `/my-content/studyPlans/${item.id}`;
    default:
      return undefined;
  }
};

function MyContentPageContent() {
  const { loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [allContent, setAllContent] = React.useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    // Placeholder for fetching data
    setAllContent(placeholderContent);
    setIsLoading(false);
  }, []);

  const fuse = new Fuse(allContent, {
    keys: ['title', 'description', 'tags'],
    threshold: 0.3,
  });

  const searchFilteredContent = searchQuery
    ? fuse.search(searchQuery).map(result => result.item)
    : allContent;

  const renderContent = () => {
    if (isLoading || authLoading) {
        return <div className="col-span-full flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <AnimatePresence>
            {searchFilteredContent.map((item) => {
              const Icon = contentIcons[item.type];
              const linkHref = getContentLink(item);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="h-full flex flex-col hover:border-primary/80 hover:bg-muted transition-all">
                      <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => toast({ title: 'Coming Soon!' })}>
                            <Star className={cn("h-5 w-5", item.isFavorited ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                          </Button>
                      </div>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col">
                      <CardDescription className="flex-grow mb-4 line-clamp-3">
                          {item.description}
                      </CardDescription>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                          {linkHref ? (
                            <Button className="w-full" asChild>
                              <Link href={linkHref}>View & Edit</Link>
                            </Button>
                          ) : (
                            <Button className="w-full" disabled>
                              Coming Soon
                            </Button>
                          )}
                      </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
        </AnimatePresence>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-4xl font-bold font-heading">My Content</h1>
          <p className="text-lg text-muted-foreground mt-1 max-w-2xl">
            All of your generated study materials, saved in one place.
          </p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-1/2 lg:w-1/3">
                <Input 
                    placeholder="Search your materials..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderContent()}
        </div>
      </div>
    </>
  );
}

export default function MyContentPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <MyContentPageContent />
        </React.Suspense>
    )
}