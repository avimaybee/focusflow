'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { updateUserPersona } from '@/lib/user-actions';
import type { Persona } from '@/ai/flows/chat-types';

const personas = [
  { id: 'neutral', name: 'Neutral Assistant', description: "A straightforward, helpful AI assistant." },
  { id: 'five-year-old', name: 'Explain Like I\'m 5', description: 'Explains complex topics in very simple terms.' },
  { id: 'casual', name: 'Casual Buddy', description: "Relaxed, peer-to-peer chat." },
  { id: 'entertaining', name: 'Entertaining Educator', description: "Makes learning fun and engaging." },
  { id: 'brutally-honest', name: 'Honest Mentor', description: "Sharp, direct, and critical feedback." },
  { id: 'straight-shooter', name: 'Straight Shooter', description: "Clear, scannable, and actionable takeaways." },
  { id: 'essay-sharpshooter', name: 'Essay Sharpshooter', description: "Scholarly and precise writing analysis." },
  { id: 'idea-generator', name: 'Idea Generator', description: "Expansive and imaginative brainstorming." },
  { id: 'cram-buddy', name: 'Cram Buddy', description: "Urgent, high-impact exam prep." },
  { id: 'sassy', name: 'Sassy Assistant', description: "Witty, irreverent, and informative." }
];

export function usePersonaManager() {
  const { user, preferredPersona } = useAuth();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(personas[0].id);

  useEffect(() => {
    if (preferredPersona && personas.some(p => p.id === preferredPersona)) {
      setSelectedPersonaId(preferredPersona);
    }
  }, [preferredPersona]);

  useEffect(() => {
    if (user?.uid) {
      updateUserPersona(user.uid, selectedPersonaId as Persona);
    }
  }, [selectedPersonaId, user?.uid]);

  const selectedPersona = personas.find(p => p.id === selectedPersonaId)!;

  return {
    personas,
    selectedPersona,
    selectedPersonaId,
    setSelectedPersonaId
  };
}