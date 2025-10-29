
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { PersonaIDs } from '@/lib/constants';

type PersonaDetails = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  avatarUrl: string;
  prompt: string;
};

type PersonaApiEntry = {
  id: string;
  name?: string | null;
  displayName?: string | null;
  description?: string | null;
  prompt?: string | null;
  avatarUrl?: string | null;
  avatarEmoji?: string | null;
};

const FALLBACK_PERSONAS: PersonaDetails[] = [
  {
    id: PersonaIDs.GURT,
    name: 'Gurt',
    displayName: 'Gurt - The Guide',
    description: 'Friendly default study buddy for anything you throw at them.',
    avatarUrl: '',
    prompt: '',
  },
  {
    id: PersonaIDs.IM_A_BABY,
    name: 'Milo',
    displayName: 'Milo - Explain Like I\'m Five',
    description: 'Breaks tough topics into playful kid-level explanations.',
    avatarUrl: '',
    prompt: '',
  },
  {
    id: PersonaIDs.STRAIGHT_SHOOTER,
    name: 'Frank',
    displayName: 'Frank - The Straight Shooter',
    description: 'No fluff answers when you just need the facts.',
    avatarUrl: '',
    prompt: '',
  },
  {
    id: PersonaIDs.ESSAY_WRITER,
    name: 'Clairo',
    displayName: 'Clairo - Essay Writer',
    description: 'Builds polished academic essays with structure and voice.',
    avatarUrl: '',
    prompt: '',
  },
  {
    id: PersonaIDs.LORE_MASTER,
    name: 'Syd',
    displayName: 'Syd - Deep Dive Explainer',
    description: 'Guides you through every angle until the concept finally sticks.',
    avatarUrl: '',
    prompt: '',
  },
  {
    id: PersonaIDs.SASSY_TUTOR,
    name: 'Lexi',
    displayName: 'Lexi - The Sassy Tutor',
    description: 'High-energy coach who makes studying feel fun and encouraging.',
    avatarUrl: '',
    prompt: '',
  },
  {
    id: PersonaIDs.IDEA_COOK,
    name: 'The Chef',
    displayName: 'The Chef - Idea Cook',
    description: 'Rapid-fire brainstorm partner serving up creative takes.',
    avatarUrl: '',
    prompt: '',
  },
  {
    id: PersonaIDs.MEMORY_COACH,
    name: 'Remi',
    displayName: 'Remi - Memory Coach',
    description: 'Helps you lock down facts fast with mnemonics and repetition.',
    avatarUrl: '',
    prompt: '',
  },
  {
    id: PersonaIDs.CODE_NERD,
    name: 'Dex',
    displayName: 'Dex - Code Nerd',
    description: 'Clear, encouraging programming mentor from basics to advanced.',
    avatarUrl: '',
    prompt: '',
  },
  {
    id: PersonaIDs.EXAM_STRATEGIST,
    name: 'Theo',
    displayName: 'Theo - Exam Strategist',
    description: 'Exam-day strategist who optimises time, focus, and points.',
    avatarUrl: '',
    prompt: '',
  },
];

function convertToPersonaDetails(persona: PersonaApiEntry): PersonaDetails {
  return {
    id: persona.id,
    name: persona.name || persona.displayName || persona.id,
    displayName: persona.displayName || persona.name || persona.id,
    description: persona.description || '',
    avatarUrl: persona.avatarEmoji || persona.avatarUrl || '',
    prompt: persona.prompt || '',
  };
}

export function usePersonaManager(initialPersonaId?: string) {
  const { preferredPersona } = useAuth();
  const [personas, setPersonas] = useState<PersonaDetails[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(initialPersonaId || PersonaIDs.GURT);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch personas from database
  useEffect(() => {
    const controller = new AbortController();

    async function fetchPersonas() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/personas', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Persona request failed with status ${response.status}`);
        }

        const payload = await response.json() as { personas?: PersonaApiEntry[] };
        const fetched = Array.isArray(payload.personas) ? payload.personas : [];
        const converted = fetched.map(convertToPersonaDetails);

        if (!controller.signal.aborted) {
          setPersonas(converted.length > 0 ? converted : FALLBACK_PERSONAS);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error fetching personas:', error);
        setPersonas(FALLBACK_PERSONAS);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchPersonas();

    return () => controller.abort();
  }, []);

  // Set preferred persona from auth context
  useEffect(() => {
    if (initialPersonaId) return;
    if (preferredPersona && personas.length > 0) {
      if (personas.some(p => p.id === preferredPersona)) {
        setSelectedPersonaId(preferredPersona);
      }
    }
  }, [preferredPersona, personas, initialPersonaId]);
  
  const selectedPersona = personas.find(p => p.id === selectedPersonaId);

  return {
    personas,
    selectedPersona,
    selectedPersonaId,
    setSelectedPersonaId,
    isLoading,
  };
}