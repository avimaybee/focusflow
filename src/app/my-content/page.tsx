
'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText,
  HelpCircle,
  BookOpen,
  LayoutGrid,
  Plus,
  Loader2,
  Save,
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
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const contentIcons: { [key: string]: React.ElementType } = {
  summary: FileText,
  quiz: HelpCircle,
  flashcardSet: BookOpen,
  savedMessage: Save,
};

interface ContentItem {
    id: string;
    type: 'summary' | 'quiz' | 'flashcardSet' | 'savedMessage';
    title: string;
    description: string;
    createdAt: Timestamp;
}

export default function MyContentPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState('All');
  const [allContent, setAllContent] = React.useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
        if (!authLoading) setIsLoading(false);
        return;
    }

    const fetchContent = async () => {
      setIsLoading(true);
      const contentTypes = ['summaries', 'quizzes', 'flashcardSets', 'savedMessages'];
      const promises = contentTypes.map(async (type) => {
        const contentRef = collection(db, 'users', user.uid, type);
        const q = query(contentRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            let description = '';
            let title = data.title;
            let itemType: ContentItem['type'] = 'summary';

            switch (type) {
                case 'summaries':
                    description = data.summary;
                    itemType = 'summary';
                    break;
                case 'quizzes':
                    description = `A quiz on "${data.sourceText}"`;
                    itemType = 'quiz';
                    break;
                case 'flashcardSets':
                    description = `Flashcards for "${data.sourceText}"`;
                    itemType = 'flashcardSet';
                    break;
                case 'savedMessages':
                    description = data.content;
                    title = `Saved Message`;
                    itemType = 'savedMessage';
                    break;
            }

            return {
                id: doc.id,
                type: itemType,
                title: title,
                description: description,
                createdAt: data.createdAt as Timestamp
            };
        });
      });

      const fetchedContent = (await Promise.all(promises)).flat();
      fetchedContent.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setAllContent(fetchedContent as ContentItem[]);
      setIsLoading(false);
    };

    fetchContent();
  }, [user, authLoading]);


  const tabs = [
    { title: 'All', icon: LayoutGrid, type: 'tab' as const },
    { title: 'Saved', icon: Save, type: 'tab' as const },
    { title: 'Summaries', icon: FileText, type: 'tab' as const },
    { title: 'Quizzes', icon: HelpCircle, type: 'tab' as const },
    { title: 'Flashcards', icon: BookOpen, type: 'tab' as const },
  ];

  const filteredContent = allContent.filter((item) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Saved') return item.type === 'savedMessage';
    if (activeTab === 'Summaries') return item.type === 'summary';
    if (activeTab === 'Quizzes') return item.type === 'quiz';
    if (activeTab === 'Flashcards') return item.type === 'flashcardSet';
    return false;
  });

  const renderContent = () => {
    if (isLoading || authLoading) {
        return <div className="col-span-full flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!user && !authLoading) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-border rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Please Log In</h2>
                <p className="text-muted-foreground mb-4">You need to be logged in to see your content.</p>
                <Button asChild>
                    <Link href="/login">Log In</Link>
                </Button>
            </div>
        )
    }

    if (allContent.length === 0 && !isLoading) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-border rounded-lg">
                <h2 className="text-xl font-semibold mb-2">No Content Yet</h2>
                <p className="text-muted-foreground mb-4">Use the chat to create summaries, quizzes, and more!</p>
                <Button asChild>
                    <Link href="/chat">Start Creating</Link>
                </Button>
            </div>
        )
    }

    return (
        <AnimatePresence>
            {filteredContent.map((item) => {
            const Icon = contentIcons[item.type];
            const linkHref = item.type === 'savedMessage' ? `/my-content/summaries/${item.id}` : `/my-content/${item.type}s/${item.id}`;

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
                        <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                    </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col">
                    <CardDescription className="flex-grow mb-4 line-clamp-3">
                        {item.description}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground">
                        Created: {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </p>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <Button asChild className="w-full">
                           <Link href={linkHref}>View Content</Link>
                        </Button>
                    </div>
                </Card>
                </motion.div>
            );
            })}
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
        </AnimatePresence>
    )
  }

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
            {renderContent()}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
