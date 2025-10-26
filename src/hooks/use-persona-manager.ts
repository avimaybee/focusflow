'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { PersonaIDs } from '@/lib/constants';
import { getPersonas, type Persona } from '@/lib/persona-actions';

// Convert database Persona to legacy PersonaDetails format for compatibility
function convertToPersonaDetails(persona: Persona) {
  return {
    id: persona.id,
    name: persona.display_name,
    avatarUrl: persona.avatar_emoji || persona.avatar_url || '',
    prompt: persona.prompt,
  };
}

export function usePersonaManager(initialPersonaId?: string) {
  const { preferredPersona } = useAuth();
  const [personas, setPersonas] = useState<Array<{
    id: string;
    name: string;
    avatarUrl: string;
    prompt: string;
  }>>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(initialPersonaId || PersonaIDs.GURT);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch personas from database
  useEffect(() => {
    async function fetchPersonas() {
      setIsLoading(true);
      try {
        const dbPersonas = await getPersonas();
        const converted = dbPersonas.map(convertToPersonaDetails);
        setPersonas(converted);
      } catch (error) {
        console.error('Error fetching personas:', error);
        // Set empty array on error
        setPersonas([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPersonas();
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