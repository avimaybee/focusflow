'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Check,
  Bot,
  Baby,
  MessageSquare,
  Zap,
  ThumbsDown,
  List,
  GraduationCap,
  Lightbulb,
  Clock,
  Drama,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Persona icon mapping with fallback
const personaIcons: { [key: string]: React.ElementType } = {
  'Gurt': Bot,
  'Im a baby': Baby,
  'straight shooter': List,
  'essay writer': GraduationCap,
  'lore master': Drama,
  'sassy tutor': Sparkles,
  'idea cook': Lightbulb,
  'memory coach': Clock,
  'code nerd': MessageSquare,
  'exam strategist': Zap,
  // Legacy IDs for backwards compatibility
  neutral: Bot,
  'five-year-old': Baby,
  casual: MessageSquare,
  entertaining: Zap,
  'brutally-honest': ThumbsDown,
  'straight-shooter': List,
  'essay-sharpshooter': GraduationCap,
  'idea-generator': Lightbulb,
  'cram-buddy': Clock,
  sassy: Drama,
};

// Persona color schemes for visual distinction
const personaColors: { [key: string]: string } = {
  'Gurt': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  'Im a baby': 'from-pink-500/20 to-purple-500/20 border-pink-500/30',
  'straight shooter': 'from-gray-500/20 to-slate-500/20 border-gray-500/30',
  'essay writer': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  'lore master': 'from-purple-500/20 to-indigo-500/20 border-purple-500/30',
  'sassy tutor': 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
  'idea cook': 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  'memory coach': 'from-teal-500/20 to-cyan-500/20 border-teal-500/30',
  'code nerd': 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30',
  'exam strategist': 'from-red-500/20 to-rose-500/20 border-red-500/30',
};

interface Persona {
  id: string;
  name: string;
  description?: string;
  displayName?: string;
}

interface PersonaSelectorProps {
  personas: Persona[];
  selectedPersonaId: string;
  onSelect: (personaId: string) => void;
  variant?: 'default' | 'compact';
  className?: string;
  disabled?: boolean;
}

export function PersonaSelector({
  personas,
  selectedPersonaId,
  onSelect,
  variant = 'default',
  className,
  disabled = false,
}: PersonaSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const selectedPersona = personas.find((p) => p.id === selectedPersonaId);
  const Icon = selectedPersona ? (personaIcons[selectedPersona.id] || Bot) : Users;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className={cn(
            "h-9 w-9 shrink-0 rounded-full transition-colors",
            "hover:bg-muted",
            open && "bg-muted",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <Icon className="h-5 w-5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="start" 
        className={cn(
          "p-0 mb-2 shadow-xl border-border/50",
          variant === 'compact' ? 'w-[300px]' : 'w-[380px]'
        )}
      >
        <Command className="rounded-lg">
          <div className="flex items-center border-b px-3 bg-muted/30">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <CommandInput 
              placeholder="Choose your AI persona..." 
              className="border-0 focus:ring-0"
            />
          </div>
            <CommandList className="max-h-[400px]">
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-6">
                  <Bot className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {personas.length === 0 ? 'Loading personas...' : 'No persona found.'}
                  </p>
                </div>
              </CommandEmpty>
              <CommandGroup className="p-2">
                  {(personas || []).map((persona) => {
                    const PersonaIcon = personaIcons[persona.id] || Bot;
                    const colorScheme = personaColors[persona.id] || 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
                    const isSelected = selectedPersonaId === persona.id;
                    
                    return (
                      <CommandItem
                        key={persona.id}
                        value={persona.id}
                        onSelect={() => {
                          onSelect(persona.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "group relative flex items-start gap-3 cursor-pointer rounded-lg p-3 mb-2",
                          "transition-colors duration-150",
                          isSelected 
                            ? `bg-gradient-to-r ${colorScheme} shadow-sm` 
                            : "hover:bg-muted/50"
                        )}
                      >
                          {/* Icon with colored background */}
                          <div className={cn(
                            "flex items-center justify-center h-10 w-10 rounded-full shrink-0 transition-colors",
                            isSelected 
                              ? "bg-primary/10 ring-2 ring-primary/30" 
                              : "bg-muted group-hover:bg-primary/5"
                          )}>
                            <PersonaIcon className={cn(
                              "h-5 w-5 transition-colors",
                              isSelected 
                                ? "text-primary" 
                                : "text-muted-foreground group-hover:text-foreground"
                            )} />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={cn(
                                "font-semibold text-sm transition-colors",
                                isSelected 
                                  ? "text-foreground" 
                                  : "text-foreground/90 group-hover:text-foreground"
                              )}>
                                {persona.displayName || persona.name}
                              </p>
                              {isSelected && (
                                <Badge 
                                  variant="default" 
                                  className="h-5 px-1.5 text-[10px] font-medium bg-primary/10 text-primary border-primary/30"
                                >
                                  Active
                                </Badge>
                              )}
                            </div>
                            {persona.description && (
                              <p className={cn(
                                "text-xs leading-relaxed transition-colors line-clamp-2",
                                isSelected 
                                  ? "text-foreground/70" 
                                  : "text-muted-foreground group-hover:text-foreground/70"
                              )}>
                                {persona.description}
                              </p>
                            )}
                          </div>
                          
                          {/* Checkmark */}
                          {isSelected && (
                            <div className="shrink-0">
                              <Check className="h-5 w-5 text-primary" />
                            </div>
                          )}
                        </CommandItem>
                    );
                  })}
              </CommandGroup>
            </CommandList>
          </Command>
      </PopoverContent>
    </Popover>
  );
}
