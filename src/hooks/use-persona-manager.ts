
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import type { Persona } from '@/types/chat-types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PersonaIDs } from '@/lib/constants';

export function usePersonaManager() {
  const { preferredPersona } = useAuth();
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(PersonaIDs.NEUTRAL);

  useEffect(() => {
    async function fetchPersonas() {
      const personasCollection = collection(db, 'personas');
      const querySnapshot = await getDocs(personasCollection);
      const personasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPersonas(personasData);
    }
    fetchPersonas();
  }, []);

  useEffect(() => {
    if (preferredPersona && personas.some(p => p.id === preferredPersona)) {
      setSelectedPersonaId(preferredPersona);
    }
  }, [preferredPersona, personas]);
  
  const selectedPersona = personas.find(p => p.id === selectedPersonaId);

  return {
    personas,
    selectedPersona,
    selectedPersonaId,
    setSelectedPersonaId,
  };
}

    