'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { PersonaIDs } from '@/lib/constants';
import type { PersonaDetails } from '@/types/chat-types';

import { defaultPersonas } from '@/lib/personas';

export function usePersonaManager(initialPersonaId?: string) {
  const { preferredPersona } = useAuth();
  const [personas, setPersonas] = useState<PersonaDetails[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(initialPersonaId || PersonaIDs.NEUTRAL);

  useEffect(() => {
    // In a real app, you might fetch these from a DB
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