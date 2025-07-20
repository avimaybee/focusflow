
'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Fuse from 'fuse.js';
import { PublishAsBlogModal } from '@/components/publish-as-blog-modal';
import { AddToCollectionModal } from '@/components/add-to-collection-modal';
import { makeSummaryPublic, makeFlashcardsPublic, makeQuizPublic, makeStudyPlanPublic, deleteContent, toggleFavoriteStatus } from '@/lib/content-actions';
import { getCollections } from '@/lib/collections-actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    tags: string[];
    isFavorited: boolean;
    lastViewed: Timestamp;
}

function MyContentPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState('All');
  const [allContent, setAllContent] = React.useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);
  const [selectedContent, setSelectedContent] = React.useState<ContentItem | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isCollectionModalOpen, setIsCollectionModalOpen] = React.useState(false);
  const [collections, setCollections] = React.useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  
  const recentContent = React.useMemo(() => {
    return [...allContent]
      .sort((a, b) => (b.lastViewed?.toMillis() || 0) - (a.lastViewed?.toMillis() || 0))
      .slice(0, 5);
  }, [allContent]);

  const fetchCollections = React.useCallback(async () => {
    if (!user) return;
    try {
      const userCollections = await getCollections(user.uid);
      setCollections(userCollections);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch collections.' });
    }
  }, [user, toast]);

  const fetchContent = React.useCallback(async () => {
    if (!user) {
      if (!authLoading) setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    fetchCollections(); // Fetch collections alongside content
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
              tags: data.tags || [],
              isFavorited: data.isFavorited || false,
              lastViewed: data.lastViewed as Timestamp,
          };
      }).filter(item => item !== null) as ContentItem[];
    });

    const fetchedContent = (await Promise.all(promises)).flat();
    fetchedContent.sort((a, b) => b!.createdAt.toMillis() - a!.createdAt.toMillis());
    setAllContent(fetchedContent);
    setIsLoading(false);
  }, [user, authLoading, fetchCollections, toast]);

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

  const handleToggleFavorite = async (item: ContentItem) => {
    if (!user) return;
    
    // Optimistically update the UI
    setAllContent(prev => prev.map(c => 
      c.id === item.id ? { ...c, isFavorited: !c.isFavorited } : c
    ));

    try {
      await toggleFavoriteStatus(user.uid, item.id, item.type, item.isFavorited);
    } catch (error) {
      // Revert the UI change on error
      setAllContent(prev => prev.map(c => 
        c.id === item.id ? { ...c, isFavorited: item.isFavorited } : c
      ));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update favorite status.',
      });
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
    { title: 'Collections', icon: Folder, type: 'tab' as const },
    { title: 'Favorites', icon: Star, type: 'tab' as const },
    { title: 'Saved', icon: Save, type: 'tab' as const },
    { title: 'Summaries', icon: FileText, type: 'tab' as const },
    { title: 'Quizzes', icon: HelpCircle, type: 'tab' as const },
    { title: 'Flashcards', icon: BookOpen, type: 'tab' as const },
    { title: 'Study Plans', icon: Calendar, type: 'tab' as const },
  ];

  const tabFilteredContent = allContent.filter((item) => {
    if (selectedCollectionId) {
      const collection = collections.find(c => c.id === selectedCollectionId);
      return collection?.contentIds.includes(item.id);
    }
    if (activeTab === 'All') return true;
    if (activeTab === 'Favorites') return item.isFavorited;
    if (activeTab === 'Saved') return item.type === 'savedMessage';
    if (activeTab === 'Summaries') return item.type === 'summary';
    if (activeTab === 'Quizzes') return item.type === 'quiz';
    if (activeTab === 'Flashcards') return item.type === 'flashcardSet';
    if (activeTab === 'Study Plans') return item.type === 'studyPlan';
    return false;
  });

  const fuse = new Fuse(tabFilteredContent, {
    keys: ['title', 'description', 'tags'],
    threshold: 0.3,
  });

  const searchFilteredContent = searchQuery
    ? fuse.search(searchQuery).map(result => result.item)
    : tabFilteredContent;

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

    if (activeTab === 'Collections') {
      return (
        <AnimatePresence>
          {collections.map(collection => (
            <motion.div
              key={collection.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setActiveTab('All'); // Switch view to all to see the filtered content
                setSelectedCollectionId(collection.id);
              }}
              className="cursor-pointer"
            >
              <Card className="h-full flex flex-col hover:border-primary/80 hover:bg-muted transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Folder className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{collection.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{collection.contentIds?.length || 0} items</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )
    }

    return (
        <AnimatePresence>
            {searchFilteredContent.map((item) => {
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
                      <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleToggleFavorite(item)}>
                            <Star className={cn("h-5 w-5", item.isFavorited ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                          </Button>
                      </div>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col">
                      <CardDescription className="flex-grow mb-4 line-clamp-3">
                          {item.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.tags.map(tag => (
                          <div key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium">
                            {tag}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-auto">
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
                          <Button variant="outline" size="sm" className="w-full" onClick={() => {
                            setSelectedContent(item);
                            setIsCollectionModalOpen(true);
                          }}>
                            <FolderPlus className="h-4 w-4 mr-2" />
                            Add to Collection
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
        </div>

        <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-1/2 lg:w-1/3">
                <Input 
                    placeholder="Search your materials..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-grow">
                <ExpandedTabs tabs={tabs} onTabChange={(tab) => {
                    setActiveTab(tab);
                    setSelectedCollectionId(null); // Clear collection filter when changing tabs
                }} />
            </div>
        </div>

        {selectedCollectionId && (
            <div className="mb-4 flex items-center gap-4">
                <h2 className="text-xl font-bold">
                    In Collection: {collections.find(c => c.id === selectedCollectionId)?.title}
                </h2>
                <Button variant="outline" onClick={() => setSelectedCollectionId(null)}>
                    Clear Filter
                </Button>
            </div>
        )}

        {recentContent.length > 0 && !selectedCollectionId && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold font-heading mb-4">Recently Viewed</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentContent.map(item => {
                const Icon = contentIcons[item.type];
                return (
                <Link href={`/my-content/${item.type}s/${item.id}`} key={item.id} className="block">
                  <Card className="hover:border-primary/80 hover:bg-muted transition-all">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base line-clamp-2">{item.title}</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              )})}
            </div>
          </div>
        )}

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
      {selectedContent && (
        <AddToCollectionModal
          isOpen={isCollectionModalOpen}
          onOpenChange={setIsCollectionModalOpen}
          contentItem={selectedContent}
          onSuccess={fetchContent}
        />
      )}
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
