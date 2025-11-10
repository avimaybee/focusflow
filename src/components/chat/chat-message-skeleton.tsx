'use client';

import { LoaderFive } from '../ui/loader';
import { getPersonaColor } from '@/lib/persona-colors';

interface Persona {
    id: string;
    name: string;
    avatarUrl: string;
}

interface ChatMessageSkeletonProps {
    persona?: Persona;
}

export function ChatMessageSkeleton({ persona }: ChatMessageSkeletonProps) {
    const personaColorClass = getPersonaColor(persona?.id);

    return (
        <div className="group flex w-full gap-3 px-4 py-3 justify-start">
            {/* spacing where avatar would be */}
            <div className="h-8 w-8" />
            <div className="flex flex-col gap-1 max-w-2xl items-start">
                {persona?.name && (
                    <div className="flex items-center gap-1 px-1">
                        <p className="text-xs font-medium text-foreground/60">{persona.name}</p>
                    </div>
                )}
                <div className={`relative text-sm leading-relaxed text-foreground/90 border-l-2 pl-4 pr-3 py-3 ${personaColorClass}`}>
                    <div className="font-sans font-bold text-muted-foreground">
                        <LoaderFive text={`${persona?.name || 'AI Assistant'} is thinking...`} />
                    </div>
                </div>
            </div>
        </div>
    );
}