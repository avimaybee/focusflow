
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot as ToolsIcon, Star, Search, Brain, FileText, Bot, PenLine, Pencil } from 'lucide-react';
import type { PromptTemplate } from '@/lib/prompts-data';
import { getPromptTemplates } from '@/lib/prompts-data';
import { updateUserFavoritePrompts } from '@/lib/user-actions';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

// Map icon names to Lucide components
const iconMap: { [key: string]: React.ElementType } = {
  Brain,
  FileText,
  Bot,
  PenLine,
  Pencil,
};


interface PromptLibraryProps {
  onSelectPrompt: (prompt: string) => void;
}

export function PromptLibrary({ onSelectPrompt }: PromptLibraryProps) {
  const { user, favoritePrompts, setFavoritePrompts } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In a real app, this might fetch from a live collection
    const loadTemplates = async () => {
      const fetchedTemplates = await getPromptTemplates();
      setTemplates(fetchedTemplates);
    };
    loadTemplates();
  }, []);

  const handleFavoriteToggle = async (promptId: string) => {
    if (!user || !favoritePrompts || !setFavoritePrompts) return;
    const newFavorites = favoritePrompts.includes(promptId)
      ? favoritePrompts.filter((id) => id !== promptId)
      : [...favoritePrompts, promptId];
    
    setFavoritePrompts(newFavorites); // Optimistic update
    await updateUserFavoritePrompts(user.uid, newFavorites);
  };

  const categories = ['All', ...(user ? ['Favorites'] : []), ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates = (category: string) => {
    let categoryFiltered = templates;
    if (category === 'Favorites') {
        categoryFiltered = templates.filter(t => favoritePrompts?.includes(t.id));
    } else if (category !== 'All') {
        categoryFiltered = templates.filter(t => t.category === category);
    }
    
    return categoryFiltered.filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSelect = (prompt: string) => {
    onSelectPrompt(prompt);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" 
            aria-label="Open prompt library"
        >
          <Bot className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] md:w-[500px] lg:w-[600px] p-0 mb-2">
        <div className="flex flex-col h-[50vh] md:h-[60vh]">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Prompt Library</h3>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Tabs defaultValue="All" className="flex-grow flex flex-col min-h-0">
            <TabsList className="m-4 mb-0">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollArea className="flex-grow">
              {categories.map((cat) => (
                <TabsContent key={cat} value={cat} className="p-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredTemplates(cat).map((template) => {
                      const Icon = iconMap[template.icon] || Pencil;
                      const isFavorite = favoritePrompts?.includes(template.id);
                      return (
                        <Card 
                            key={template.id} 
                            className="flex flex-col cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleSelect(template.prompt)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleSelect(template.prompt);
                                }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`Use prompt: ${template.title}`}
                        >
                          <CardHeader className="flex-row items-start justify-between pb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-md">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="text-base font-semibold">{template.title}</CardTitle>
                            </div>
                            {user && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 shrink-0 -mr-2 -mt-2"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent card click
                                        handleFavoriteToggle(template.id);
                                    }}
                                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    <Star className={cn("h-4 w-4", isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground')} />
                                </Button>
                            )}
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-sm">{template.description}</CardDescription>
                          </CardContent>
                        </Card>
                      );
                    })}
                     {filteredTemplates(cat).length === 0 && (
                        <p className="text-muted-foreground text-sm text-center col-span-full py-8">
                            {cat === 'Favorites' ? 'No favorite prompts yet. Add some!' : 'No templates found.'}
                        </p>
                    )}
                  </div>
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
}

    