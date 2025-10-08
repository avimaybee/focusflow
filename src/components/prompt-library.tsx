
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Star, Search, Brain, FileText, Bot, PenLine, Pencil, Plus } from 'lucide-react';
import type { PromptTemplate } from '@/lib/prompts-data';
import { getPromptTemplates } from '@/lib/prompts-data';
import { updateUserFavoritePrompts } from '@/lib/user-actions';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

const iconMap: { [key: string]: React.ElementType } = {
  Brain,
  FileText,
  Bot,
  PenLine,
  Pencil,
};

interface PromptLibraryProps {
  onSelectPrompt: (prompt: string) => void;
  children: React.ReactNode;
}

export function PromptLibrary({ onSelectPrompt, children }: PromptLibraryProps) {
  const { user, favoritePrompts, setFavoritePrompts } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
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
    
    setFavoritePrompts(newFavorites);
    await updateUserFavoritePrompts(user.id, newFavorites);
  };

  const categories = ['All', ...(user ? ['Favorites'] : []), ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates = () => {
    let categoryFiltered = templates;
    if (activeCategory === 'Favorites') {
        categoryFiltered = templates.filter(t => favoritePrompts?.includes(t.id));
    } else if (activeCategory !== 'All') {
        categoryFiltered = templates.filter(t => t.category === activeCategory);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Prompt Library</DialogTitle>
           <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all templates..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </DialogHeader>
        <div className="flex-grow flex overflow-hidden">
          <aside className="w-1/4 border-r p-4">
            <nav className="flex flex-col gap-1">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'secondary' : 'ghost'}
                  className="justify-start"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'Favorites' && <Star className="mr-2 h-4 w-4" />}
                  {cat}
                </Button>
              ))}
            </nav>
          </aside>
          <main className="w-3/4">
            <ScrollArea className="h-full">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates().map((template) => {
                  const Icon = iconMap[template.icon] || Pencil;
                  const isFavorite = favoritePrompts?.includes(template.id);
                  return (
                    <Card 
                        key={template.id} 
                        className="flex flex-col cursor-pointer hover:bg-muted/50 transition-colors group"
                        onClick={() => handleSelect(template.prompt)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSelect(template.prompt)}
                        tabIndex={0}
                        role="button"
                        aria-label={`Select prompt: ${template.title}`}
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
                                className="h-7 w-7 shrink-0 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
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
                {filteredTemplates().length === 0 && (
                    <p className="text-muted-foreground text-sm text-center col-span-full py-16">
                        {activeCategory === 'Favorites' ? 'No favorite prompts yet. Add some!' : 'No templates found.'}
                    </p>
                )}
              </div>
            </ScrollArea>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
