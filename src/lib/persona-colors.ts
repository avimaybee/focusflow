// Centralized persona color mapping used by multiple components.
export function getPersonaColor(personaId?: string): string {
    if (!personaId) {
        return 'border-l-teal-500/50'; // Default
    }

    const id = (personaId || '').toLowerCase();

    // Map persona IDs to colors
    if (id === 'auto') {
        return 'border-l-violet-500/50';
    }

    if (id === 'gurt') {
        return 'border-l-teal-500/50';
    }

    if (id === 'im a baby' || id === 'milo') {
        return 'border-l-green-500/50';
    }

    if (id === 'straight shooter' || id === 'frank') {
        return 'border-l-cyan-500/50';
    }

    if (id === 'essay writer' || id === 'clairo') {
        return 'border-l-purple-500/50';
    }

    if (id === 'lore master' || id === 'syd') {
        return 'border-l-blue-500/50';
    }

    if (id === 'sassy tutor' || id === 'lexi') {
        return 'border-l-pink-500/50';
    }

    if (id === 'idea cook' || id === 'the chef') {
        return 'border-l-orange-500/50';
    }

    if (id === 'memory coach' || id === 'remi') {
        return 'border-l-amber-500/50';
    }

    if (id === 'code nerd' || id === 'dex') {
        return 'border-l-indigo-500/50';
    }

    if (id === 'exam strategist' || id === 'theo') {
        return 'border-l-rose-500/50';
    }

    return 'border-l-teal-500/50';
}
