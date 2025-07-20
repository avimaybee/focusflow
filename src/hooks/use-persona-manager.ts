
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

  const [isInitialPersonaSet, setIsInitialPersonaSet] = useState(false);

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
    // This effect should only run once when the component mounts and the necessary data is available.
    // It sets the initial persona based on the user's saved preference.
    // It will not run again to override a user's active selection in the same session.
    if (preferredPersona && personas.length > 0) {
      if (personas.some(p => p.id === preferredPersona)) {
        setSelectedPersonaId(preferredPersona);
      }
    }
  // We only want this to run when the user's preferredPersona is first loaded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredPersona, personas]);
  
  const selectedPersona = personas.find(p => p.id === selectedPersonaId);

  return {
    personas,
    selectedPersona,
    selectedPersonaId,
    setSelectedPersonaId,
  };
}

    