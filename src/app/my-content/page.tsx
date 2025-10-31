'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Loader2, FileText, HelpCircle, BookOpen, Save, Calendar, Star, Search, Sparkles, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  getSummaries,
  getFlashcardSets,
  getQuizzes,
  getStudyPlans,
  getSavedMessages,
  toggleFavoriteStatus,
  deleteSummary,
  deleteFlashcardSet,
  deleteQuiz,
  deleteStudyPlan,
  deleteSavedMessage,
} from '@/lib/content-actions';

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

const contentTypeOptions: { value: ContentItem['type']; label: string; helper: string }[] = [
  { value: 'summary', label: 'Summaries', helper: 'AI-generated study notes' },
  { value: 'quiz', label: 'Quizzes', helper: 'Auto-built practice questions' },
  { value: 'flashcardSet', label: 'Flashcards', helper: 'Key terms to drill' },
  { value: 'savedMessage', label: 'Saved Messages', helper: 'Pinned chat insights' },
  { value: 'studyPlan', label: 'Study Plans', helper: 'Structured schedules' },
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
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [allContent, setAllContent] = React.useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTypes, setActiveTypes] = React.useState<ContentItem['type'][]>([]);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const fetchAllContent = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const [summaries, flashcardSets, quizzes, studyPlans, savedMessages] = await Promise.all([
        getSummaries(user.id).catch(err => {
          console.error('Error fetching summaries:', err);
          return [];
        }),
        getFlashcardSets(user.id).catch(err => {
          console.error('Error fetching flashcards:', err);
          return [];
        }),
        getQuizzes(user.id).catch(err => {
          console.error('Error fetching quizzes:', err);
          return [];
        }),
        getStudyPlans(user.id).catch(err => {
          console.error('Error fetching study plans:', err);
          return [];
        }),
        getSavedMessages(user.id).catch(err => {
          console.error('Error fetching saved messages:', err);
          return [];
        }),
      ]);

      const content: ContentItem[] = [
        ...summaries.map((s: any) => ({
          id: s.id,
          type: 'summary' as const,
          title: s.title,
          description: s.content?.substring(0, 100) || '',
          createdAt: new Date(s.created_at),
          isPublic: s.is_public || false,
          publicSlug: s.slug,
          tags: s.keywords || [],
          isFavorited: s.is_favorite || false,
          lastViewed: s.last_viewed_at ? new Date(s.last_viewed_at) : new Date(s.created_at),
        })),
        ...flashcardSets.map((f: any) => ({
          id: f.id,
          type: 'flashcardSet' as const,
          title: f.title,
          description: f.description || `${f.flashcards?.length || 0} cards`,
          createdAt: new Date(f.created_at),
          isPublic: f.is_public || false,
          publicSlug: f.slug,
          tags: [],
          isFavorited: f.is_favorite || false,
          lastViewed: f.last_viewed_at ? new Date(f.last_viewed_at) : new Date(f.created_at),
        })),
        ...quizzes.map((q: any) => ({
          id: q.id,
          type: 'quiz' as const,
          title: q.title,
          description: q.description || `${q.quiz_questions?.length || 0} questions`,
          createdAt: new Date(q.created_at),
          isPublic: q.is_public || false,
          publicSlug: q.slug,
          tags: [],
          isFavorited: q.is_favorite || false,
          lastViewed: q.last_viewed_at ? new Date(q.last_viewed_at) : new Date(q.created_at),
        })),
        ...studyPlans.map((p: any) => ({
          id: p.id,
          type: 'studyPlan' as const,
          title: p.title,
          description: p.description || 'Study plan',
          createdAt: new Date(p.created_at),
          isPublic: p.is_public || false,
          publicSlug: p.slug,
          tags: [],
          isFavorited: p.is_favorite || false,
          lastViewed: p.last_viewed_at ? new Date(p.last_viewed_at) : new Date(p.created_at),
        })),
        ...savedMessages.map((m: any) => ({
          id: m.id,
          type: 'savedMessage' as const,
          title: m.message_content?.substring(0, 50) || 'Saved message',
          description: m.message_content || '',
          createdAt: new Date(m.created_at),
          isPublic: false,
          publicSlug: null,
          tags: m.tags || [],
          isFavorited: false,
          lastViewed: new Date(m.created_at),
        })),
      ];

      setAllContent(content);
      setHasError(false);
      setIsLoading(false);
    } catch (error) {
      // Only show error if there's a critical failure, not just empty results
      console.error('Critical error fetching content:', error);
      setAllContent([]);
      setHasError(true);
      setIsLoading(false);
      
      // Only show toast for unexpected errors, not for normal empty states
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        // Don't show error for common "no data" scenarios
        if (!errorMessage.includes('PGRST116') && !errorMessage.includes('no rows')) {
          toast({
            variant: 'destructive',
            title: 'Connection Issue',
            description: 'Unable to load your content right now. Please try refreshing.',
          });
        }
      }
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (!authLoading) {
      fetchAllContent();
    }
  }, [authLoading, fetchAllContent]);

  const handleToggleFavorite = async (item: ContentItem) => {
    if (!user) return;

    try {
      const typeMap: Record<ContentItem['type'], 'summary' | 'flashcard_set' | 'quiz' | 'study_plan' | 'practice_exam'> = {
        summary: 'summary',
        flashcardSet: 'flashcard_set',
        quiz: 'quiz',
        studyPlan: 'study_plan',
        savedMessage: 'summary', // Fallback, saved messages don't have favorites
      };

      await toggleFavoriteStatus(user.id, item.id, typeMap[item.type], item.isFavorited);

      // Update local state
      setAllContent((prev) =>
        prev.map((content) =>
          content.id === item.id ? { ...content, isFavorited: !content.isFavorited } : content
        )
      );

      toast({
        title: item.isFavorited ? 'Removed from favorites' : 'Added to favorites',
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update favorite status',
      });
    }
  };

  const handleDelete = async (item: ContentItem) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      switch (item.type) {
        case 'summary':
          await deleteSummary(user.id, item.id);
          break;
        case 'flashcardSet':
          await deleteFlashcardSet(user.id, item.id);
          break;
        case 'quiz':
          await deleteQuiz(user.id, item.id);
          break;
        case 'studyPlan':
          await deleteStudyPlan(user.id, item.id);
          break;
        case 'savedMessage':
          await deleteSavedMessage(user.id, item.id);
          break;
      }

      // Update local state
      setAllContent((prev) => prev.filter((content) => content.id !== item.id));

      toast({
        title: 'Deleted',
        description: `${item.title} has been deleted.`,
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete content',
      });
    }
  };

  const fuse = React.useMemo(() => {
    return new Fuse(allContent, {
      keys: ['title', 'description', 'tags'],
      threshold: 0.3,
    });
  }, [allContent]);

  const filteredContent = React.useMemo(() => {
    const base = searchQuery.trim()
      ? fuse.search(searchQuery.trim()).map(result => result.item)
      : allContent;

    if (!activeTypes.length) {
      return base;
    }

    return base.filter((item) => activeTypes.includes(item.type));
  }, [searchQuery, fuse, allContent, activeTypes]);

  const hasAnyContent = allContent.length > 0;
  const hasResults = filteredContent.length > 0;
  const isFiltering = activeTypes.length > 0 || searchQuery.trim().length > 0;

  const toggleType = (type: ContentItem['type']) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const resetFilters = () => {
    setActiveTypes([]);
    setSearchQuery('');
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  };

  React.useEffect(() => {
    const handleSlashFocus = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      event.preventDefault();
      searchInputRef.current?.focus();
    };

    window.addEventListener('keydown', handleSlashFocus);
    return () => window.removeEventListener('keydown', handleSlashFocus);
  }, []);

  const renderContent = () => {
    if (isLoading || authLoading) {
        return <div className="col-span-full flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    // Error state - visually distinct from empty state
    if (hasError && !hasAnyContent) {
      return (
        <div className="col-span-full">
          <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-destructive/50 bg-destructive/5 px-8 py-20 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <svg className="h-12 w-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold leading-tight text-destructive">Connection Error</h3>
              <p className="text-base text-muted-foreground max-w-md leading-relaxed">
                We couldn&apos;t load your content due to a connection issue. Please check your internet and try again.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Button onClick={() => fetchAllContent()} className="min-w-[160px]">
                Retry Connection
              </Button>
              <Button variant="outline" asChild className="min-w-[160px]">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Empty state - friendly and encouraging
    if (!hasAnyContent) {
      return (
        <div className="col-span-full">
          <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-border/70 bg-secondary/40 px-8 py-20 text-center">
            <Sparkles className="h-12 w-12 text-primary" />
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold leading-tight">You haven&apos;t created anything yet</h3>
              <p className="text-base text-muted-foreground max-w-md leading-relaxed">
                Start a chat or launch a smart tool to generate summaries, flashcards, and quizzes. Everything you create will land here automatically.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Button asChild className="min-w-[160px]">
                <Link href="/chat">Open Chat</Link>
              </Button>
              <Button variant="outline" asChild className="min-w-[160px]">
                <Link href="/dashboard">Explore Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (!hasResults) {
      return (
        <div className="col-span-full">
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border/70 bg-secondary/30 px-8 py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold leading-tight">No matches yet</h3>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                Try a different keyword or clear your filters to see everything you&apos;ve saved.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-1">
              <Button onClick={resetFilters} className="min-w-[140px]">Clear Filters</Button>
              <Button variant="outline" asChild className="min-w-[140px]">
                <Link href="/chat">Generate new content</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
        <AnimatePresence>
            {filteredContent.map((item: ContentItem) => {
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="shrink-0" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleFavorite(item);
                            }}
                          >
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
                            <Button className="w-full h-10 font-semibold shadow-md hover:shadow-lg transition-all duration-200" asChild>
                              <Link href={linkHref}>View & Edit →</Link>
                            </Button>
                          ) : (
                            <Button className="w-full h-10 font-semibold" disabled variant="secondary">
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
          <p className="text-lg text-foreground/75 mt-1 max-w-2xl font-medium">
            All of your generated study materials, saved in one place.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4">
            <div className="space-y-2">
              <div className="relative w-full">
                  <Input 
                      ref={searchInputRef}
                      placeholder="Search by title, keywords, or content..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search saved content"
                      disabled={!hasAnyContent}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/60" />
              </div>
              {!hasAnyContent && (
                <p className="text-xs text-foreground/65 italic font-medium">
                  Search will be available once you create some content
                </p>
              )}
              {hasAnyContent && !searchQuery && (
                <p className="text-xs text-foreground/70 font-medium">
                  💡 Tip: Search finds matches in titles, descriptions, and tags. Press <kbd className="rounded border border-border/60 bg-secondary/80 px-1 text-xs font-semibold">/</kbd> to quick-search
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/80">Filter by type</span>
              {contentTypeOptions.map(({ value, label, helper }) => {
                const isActive = activeTypes.includes(value);
                return (
                  <Button
                    key={value}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleType(value)}
                    className="rounded-full"
                    aria-pressed={isActive}
                    aria-label={`${isActive ? 'Remove' : 'Include'} ${label} results${helper ? ` (${helper})` : ''}`}
                    disabled={!hasAnyContent}
                    title={helper}
                  >
                    {label}
                  </Button>
                );
              })}
              {isFiltering && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
              )}
            </div>

            {hasAnyContent && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>Showing {filteredContent.length} of {allContent.length} items</span>
                {!isFiltering && (
                  <span className="text-xs">Use filters above to narrow results by content type</span>
                )}
              </div>
            )}
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