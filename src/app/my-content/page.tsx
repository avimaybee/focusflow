
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
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { ExpandedTabs } from '@/components/ui/expanded-tabs';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { PublishAsBlogModal } from '@/components/publish-as-blog-modal';
import { makeSummaryPublic, makeFlashcardsPublic, makeQuizPublic, makeStudyPlanPublic, deleteContent } from '@/lib/content-actions';
import { useToast } from '@/hooks/use-toast';

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
    createdAt: Timestamp;
    isPublic: boolean;
    publicSlug: string | null;
}

export default function MyContentPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('All');
  const [allContent, setAllContent] = React.useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);
  const [selectedContent, setSelectedContent] = React.useState<ContentItem | null>(null);

  const fetchContent = React.useCallback(async () => {
    if (!user) {
      if (!authLoading) setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const contentTypes = ['summaries', 'quizzes', 'flashcardSets', 'savedMessages', 'studyPlans'];
    const promises = contentTypes.map(async (type) => {
      const collectionName = type === 'flashcardSets' ? 'flashcardSets' : type;
      const contentRef = collection(db, 'users', user.uid, collectionName);
      const q = query(contentRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
          const data = doc.data();
          let description = '';
          let title = data.title;
          let itemType: ContentItem['type'] | null = null;

          switch (type) {
              case 'summaries':
                  description = data.summary || 'No summary content.';
                  itemType = 'summary';
                  break;
              case 'quizzes':
                  description = data.sourceText ? `A quiz on "${data.sourceText}"` : 'A quiz with multiple questions.';
                  itemType = 'quiz';
                  break;
              case 'flashcardSets':
                  description = data.sourceText ? `Flashcards for "${data.sourceText}"` : 'A set of flashcards.';
                  itemType = 'flashcardSet';
                  break;
              case 'studyPlans':
                  description = data.sourceText ? `A study plan for "${data.sourceText}"` : 'A study plan.';
                  itemType = 'studyPlan';
                  break;
              case 'savedMessages':
                  description = data.content || 'No content.';
                  title = `Saved: "${description.substring(0, 30)}..."`;
                  itemType = 'savedMessage';
                  break;
          }

          if (!itemType) return null;

          return {
              id: doc.id,
              type: itemType,
              title: title || 'Untitled',
              description: description,
              createdAt: data.createdAt as Timestamp,
              isPublic: data.isPublic || false,
              publicSlug: data.publicSlug || null,
          };
      }).filter(item => item !== null) as ContentItem[];
    });

    const fetchedContent = (await Promise.all(promises)).flat();
    fetchedContent.sort((a, b) => b!.createdAt.toMillis() - a!.createdAt.toMillis());
    setAllContent(fetchedContent);
    setIsLoading(false);
  }, [user, authLoading]);

  React.useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const [isSharing, setIsSharing] = React.useState<string | null>(null);

  const handleShare = async (item: ContentItem) => {
    if (!user) return;
    setIsSharing(item.id);
    try {
      let slug = '';
      let path = '';
      switch (item.type) {
        case 'summary':
          slug = await makeSummaryPublic(user.uid, item.id);
          path = 'summaries';
          break;
        case 'flashcardSet':
          slug = await makeFlashcardsPublic(user.uid, item.id);
          path = 'flashcards';
          break;
        case 'quiz':
          slug = await makeQuizPublic(user.uid, item.id);
          path = 'quizzes';
          break;
        case 'studyPlan':
            slug = await makeStudyPlanPublic(user.uid, item.id);
            path = 'plans';
            break;
        default:
          throw new Error('Invalid content type for sharing.');
      }
      
      const publicUrl = `${window.location.origin}/${path}/${slug}`;
      navigator.clipboard.writeText(publicUrl);
      
      toast({
        title: 'Shared Successfully!',
        description: `The public link has been copied to your clipboard.`,
      });

      // Optimistically update UI
      setAllContent(prev => prev.map(c => c.id === item.id ? { ...c, isPublic: true, publicSlug: slug } : c));

    } catch (error) {
      console.error(`Failed to share ${item.type}:`, error);
      toast({
        variant: 'destructive',
        title: 'Sharing failed',
        description: 'There was an error making this content public.',
      });
    } finally {
      setIsSharing(null);
    }
  };

  const handleDelete = async (itemId: string, type: ContentItem['type']) => {
    if (!user || !window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
        await deleteContent(user.uid, itemId, type);
        setAllContent(prev => prev.filter(item => item.id !== itemId));
        toast({ title: 'Content Deleted', description: 'The item has been removed.' });
    } catch (error) {
        console.error(`Failed to delete ${type}:`, error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the item.' });
    }
  };

  const handleOpenPublishModal = (content: ContentItem) => {
    setSelectedContent(content);
    setIsPublishModalOpen(true);
  };

  const tabs = [
    { title: 'All', icon: LayoutGrid, type: 'tab' as const },
    { title: 'Saved', icon: Save, type: 'tab' as const },
    { title: 'Summaries', icon: FileText, type: 'tab' as const },
    { title: 'Quizzes', icon: HelpCircle, type: 'tab' as const },
    { title: 'Flashcards', icon: BookOpen, type: 'tab' as const },
    { title: 'Study Plans', icon: Calendar, type: 'tab' as const },
  ];

  const filteredContent = allContent.filter((item) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Saved') return item.type === 'savedMessage';
    if (activeTab === 'Summaries') return item.type === 'summary';
    if (activeTab === 'Quizzes') return item.type === 'quiz';
    if (activeTab === 'Flashcards') return item.type === 'flashcardSet';
    if (activeTab === 'Study Plans') return item.type === 'studyPlan';
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
              let collectionName = `${item.type}s`;
              if (item.type === 'flashcardSet') collectionName = 'flashcardSets';
              if (item.type === 'savedMessage') collectionName = 'savedMessages';
              const linkHref = `/my-content/${collectionName}/${item.id}`;

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
                      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                          <Button asChild className="w-full">
                            <Link href={linkHref}>View & Edit</Link>
                          </Button>
                          {item.isPublic && item.type !== 'savedMessage' && (
                              <Button asChild variant="secondary" className="w-full">
                                  <Link href={`/${collectionName}/${item.publicSlug}`} target="_blank">View Public</Link>
                              </Button>
                          )}
                          {item.type !== 'savedMessage' && (
                              <Button variant="outline" className="w-full" onClick={() => handleShare(item)} disabled={isSharing === item.id}>
                                  {isSharing === item.id ? 'Sharing...' : (item.isPublic ? 'Copy Public Link' : 'Share Publicly')}
                              </Button>
                          )}
                          {(item.type === 'summary' || item.type === 'savedMessage') && (
                              <Button variant="secondary" className="w-full" onClick={() => handleOpenPublishModal(item)}>
                                  Publish as Blog
                              </Button>
                          )}
                          <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(item.id, item.type)}>
                              Delete
                          </Button>
                      </CardFooter>
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
    <>
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
      {selectedContent && (
          <PublishAsBlogModal
              isOpen={isPublishModalOpen}
              onOpenChange={setIsPublishModalOpen}
              contentItem={selectedContent}
              onSuccess={fetchContent}
          />
      )}
    </>
  );
}
