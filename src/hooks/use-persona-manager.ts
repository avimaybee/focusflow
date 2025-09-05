'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import type { Persona } from '@/types/chat-types';
import { PersonaIDs } from '@/lib/constants';

const defaultPersonas: Persona[] = [
    { id: PersonaIDs.NEUTRAL, name: 'Neutral', prompt: 'You are a helpful AI study assistant.' },
    { id: PersonaIDs.SOCRATIC, name: 'Socratic', prompt: 'You are a Socratic tutor.' },
    { id: PersonaIDs.EXPLAIN_LIKE_IM_FIVE, name: 'ELI5', prompt: 'You explain things like I\'m five years old.' },
];

export function usePersonaManager(initialPersonaId?: string) {
  const { preferredPersona } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(initialPersonaId || PersonaIDs.NEUTRAL);

  useEffect(() => {
    // Placeholder for fetching personas
    setPersonas(defaultPersonas);
  }, []);

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
  };
}