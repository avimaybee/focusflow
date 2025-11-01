'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Persona, DEFAULT_PERSONA_ID } from '@/types/persona';

/**
 * Minimal fallback personas used only when API fails and cache is empty.
 * These are NOT meant to be comprehensive — they exist solely for resilience.
 * For new personas, update the database only; they will auto-load from /api/personas.
 */
const MINIMAL_FALLBACK_PERSONAS: Persona[] = [
  {
    id: 'Gurt',
    name: 'Gurt',
    displayName: 'Gurt - The Guide',
    description: 'Your default helpful companion',
    prompt: '',
    avatarUrl: null,
    avatarEmoji: null,
    sortOrder: 0,
  },
];

export function usePersonaManager(initialPersonaId?: string) {
  const { preferredPersona } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(initialPersonaId || DEFAULT_PERSONA_ID);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Module-level caching to avoid duplicate persona fetches across multiple hook instances.
   * This keeps network calls to a minimum and returns a shared promise while fetching.
   */
  const globalAny: any = globalThis as any;
  if (!globalAny.__personasCache) {
    globalAny.__personasCache = { data: null, ts: 0, promise: null } as {
      data: Persona[] | null;
      ts: number;
      promise: Promise<Persona[]> | null;
    };
  }
  const CACHE_TTL = 60 * 1000; // 60s

  useEffect(() => {
    let mounted = true;

    async function ensurePersonas() {
      setIsLoading(true);

      const cache = globalAny.__personasCache;
      const now = Date.now();

      // If cache valid, use it
      if (cache.data && now - cache.ts < CACHE_TTL) {
        if (!mounted) return;
        setPersonas(cache.data);
        setIsLoading(false);
        return;
      }

      // If another fetch is in-flight, await it
      if (cache.promise) {
        try {
          const fetched = await cache.promise;
          if (!mounted) return;
          setPersonas(fetched);
        } catch (err) {
          if (!mounted) return;
          console.error('[usePersonaManager] Error awaiting personas promise:', err);
          setPersonas(MINIMAL_FALLBACK_PERSONAS);
        } finally {
          if (mounted) setIsLoading(false);
        }
        return;
      }

      // Otherwise start a new fetch and store the promise
      const promise = (async () => {
        try {
          const response = await fetch('/api/personas', {
            method: 'GET',
            cache: 'no-store',
          });
          if (!response.ok) {
            throw new Error(`Persona request failed with status ${response.status}`);
          }
          const payload = await response.json() as { personas?: Persona[] };
          const fetched = Array.isArray(payload.personas) ? payload.personas : [];
          const final = fetched.length > 0 ? fetched : MINIMAL_FALLBACK_PERSONAS;
          cache.data = final;
          cache.ts = Date.now();
          return final;
        } catch (error) {
          console.error('[usePersonaManager] Error fetching personas:', error);
          const final = MINIMAL_FALLBACK_PERSONAS;
          cache.data = final;
          cache.ts = Date.now();
          return final;
        } finally {
          cache.promise = null;
        }
      })();

      cache.promise = promise;

      try {
        const res = await promise;
        if (!mounted) return;
        setPersonas(res);
      } catch (err) {
        if (!mounted) return;
        console.error('[usePersonaManager] Error resolving personas fetch:', err);
        setPersonas(MINIMAL_FALLBACK_PERSONAS);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    ensurePersonas();

    return () => {
      mounted = false;
    };
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