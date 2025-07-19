'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Persona {
    id: string;
    name: string;
    avatarUrl: string;
}

interface ChatMessageSkeletonProps {
    persona?: Persona;
}

export function ChatMessageSkeleton({ persona }: ChatMessageSkeletonProps) {
    return (
        <div className="group flex items-start gap-3">
            <Avatar className="h-8 w-8 bg-accent/50 text-accent-foreground border border-accent">
                <AvatarImage src={persona?.avatarUrl} alt={persona?.name} />
                <AvatarFallback className="bg-transparent">
                    <Bot className="h-5 w-5" />
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 items-start">
                <div className="max-w-2xl p-3 px-4 text-base rounded-2xl bg-secondary">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-sm italic">{persona?.name || 'AI Assistant'} is thinking</span>
                        <motion.div
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                            className="h-1.5 w-1.5 bg-primary rounded-full"
                        />
                        <motion.div
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                            className="h-1.5 w-1.5 bg-primary rounded-full"
                        />
                        <motion.div
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                            className="h-1.5 w-1.5 bg-primary rounded-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}