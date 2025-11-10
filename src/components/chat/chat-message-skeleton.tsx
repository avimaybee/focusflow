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
        <div className="group flex w-full gap-3 sm:gap-4 px-4 sm:px-6 py-1 sm:py-1.5 mb-2 sm:mb-2.5 last:mb-0 justify-start">
            <div className="flex flex-col gap-1 max-w-2xl sm:max-w-3xl items-start w-full">
                {persona?.name && (
                    <div className="flex items-center gap-1 px-1">
                        <p className="text-xs font-medium text-foreground/60">{persona.name}</p>
                    </div>
                )}
                <div className={`relative w-full text-sm sm:text-[15px] leading-relaxed text-foreground/90 border-l-2 pl-4 pr-3 py-1.5 sm:py-2 ${personaColorClass}`}>
                    <div className="font-sans font-bold text-muted-foreground">
                        <LoaderFive text={`${persona?.name || 'AI Assistant'} is thinking...`} />
                    </div>
                </div>
            </div>
        </div>
    );
}