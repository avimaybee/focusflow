// PERSONAS UNIFIED: Single Source of Truth
// ============================================
// This document explains the new unified persona system in FocusFlow.

/**
 * WHAT CHANGED?
 * =============
 * Previously, persona data was scattered and duplicated across multiple files:
 *   - PersonaIDs in src/lib/constants.ts (string IDs only)
 *   - validPersonas in src/types/chat-types.ts (array of IDs)
 *   - PersonaDetails in src/types/chat-types.ts AND src/hooks/use-persona-manager.ts (DUPLICATED, different shapes)
 *   - FALLBACK_PERSONAS in src/hooks/use-persona-manager.ts (hardcoded data, not synced with DB)
 *   - PersonaRecord interface in src/app/api/personas/route.ts (DB schema, only used in that file)
 *
 * This caused:
 *   - Confusion about which type to use
 *   - Difficult maintenance when adding new personas (had to update 4+ places)
 *   - Hardcoded persona data that got out of sync with the database
 *   - Type incompatibilities between components
 *
 * SOLUTION: Unified persona module at src/types/persona.ts
 * ===========================================================
 * All persona types, constants, and converters now live in ONE file:
 *   - Persona (complete DB record, camelCase)
 *   - PersonaPreview (minimal UI data)
 *   - PersonaDatabaseRow (DB schema, snake_case - internal only)
 *   - PERSONA_IDS (canonical ID constants)
 *   - PersonaID (type-safe ID type)
 *   - validPersonaIDs (for Zod validation)
 *   - DEFAULT_PERSONA_ID (default selection)
 *   - convertDatabaseRowToPersona() (DB → internal conversion)
 *
 * HOW IT WORKS NOW
 * ================
 *
 * 1. DATABASE (Supabase table: public.personas)
 *    ┌─ id: "Gurt" (primary key, matches PERSONA_IDS.GURT)
 *    ├─ name: "Gurt"
 *    ├─ display_name: "Gurt - The Guide"
 *    ├─ description: "Friendly default study buddy..."
 *    ├─ prompt: "You are a helpful tutor..."
 *    ├─ avatar_url: "https://..."
 *    ├─ avatar_emoji: "🎓"
 *    ├─ sort_order: 0
 *    └─ is_active: true
 *
 * 2. API ROUTE (/api/personas)
 *    - Fetches from Supabase as PersonaDatabaseRow[]
 *    - Converts to Persona[] using convertDatabaseRowToPersona()
 *    - Returns JSON: { personas: Persona[] }
 *    - Cache-Control header ensures CDN caches for 5 min + stale-while-revalidate 1 hour
 *
 * 3. HOOK (usePersonaManager)
 *    - Imports Persona from @/types/persona
 *    - Fetches from /api/personas
 *    - Caches in memory (60s TTL, dedups in-flight requests)
 *    - Falls back to minimal MINIMAL_FALLBACK_PERSONAS if API fails
 *    - Returns: { personas: Persona[], selectedPersona, selectedPersonaId, ... }
 *
 * 4. COMPONENTS
 *    - Import Persona from @/types/persona
 *    - Use Persona type for all persona-related props
 *    - avatarUrl is now nullable (string | null) — components must handle null
 *
 * HOW TO ADD A NEW PERSONA
 * =========================
 * Step 1: Add to database only
 *    INSERT INTO public.personas (
 *      id, name, display_name, description, prompt, avatar_emoji, sort_order, is_active
 *    ) VALUES (
 *      'new-persona-id',
 *      'New Persona',
 *      'New Persona - The Description',
 *      'Long description...',
 *      'System prompt for the AI...',
 *      '🆕',
 *      11,  -- next sort order
 *      true
 *    );
 *
 * Step 2: Add to PERSONA_IDS in src/types/persona.ts (optional, for type safety)
 *    export const PERSONA_IDS = {
 *      // ... existing IDs ...
 *      NEW_PERSONA: 'new-persona-id',
 *    } as const;
 *
 * Step 3: Add to validPersonaIDs in src/types/persona.ts
 *    export const validPersonaIDs = [
 *      // ... existing IDs ...
 *      'new-persona-id',
 *    ] as const;
 *
 * Step 4: That's it! The new persona will auto-load from /api/personas on next page load.
 *    - No code changes needed in hooks or components
 *    - No hardcoded fallback data to update
 *    - Type-safe if you updated PERSONA_IDS
 *
 * MIGRATION NOTES (What we changed)
 * ==================================
 * Backwards Compatibility:
 *   - src/lib/constants.ts still exports PersonaIDs, but it now re-exports PERSONA_IDS from @/types/persona
 *     Old code: import { PersonaIDs } from '@/lib/constants' still works
 *     New code: import { PERSONA_IDS } from '@/types/persona' preferred
 *
 *   - src/types/chat-types.ts still exports validPersonas and PersonaDetails, but they're deprecated
 *     Old code using PersonaDetails still compiles, but avatar Url can now be null
 *     New code should use Persona from @/types/persona
 *
 * Files Updated:
 *   ✓ src/types/persona.ts (NEW)
 *   ✓ src/app/api/personas/route.ts (uses new types + converter)
 *   ✓ src/hooks/use-persona-manager.ts (imports Persona, uses minimal fallback)
 *   ✓ src/lib/constants.ts (re-exports from persona.ts for backwards compat)
 *   ✓ src/types/chat-types.ts (deprecated PersonaDetails, imports from persona.ts)
 *   ✓ src/components/chat/message-list.tsx (uses Persona)
 *   ✓ src/components/chat/chat-message.tsx (uses Persona)
 *   ✓ src/components/chat/chat-message-skeleton.tsx (uses Persona)
 *   ✓ src/components/chat/persona-selector.tsx (uses imported Persona)
 *
 * EXAMPLE: Using personas in your code
 * =====================================
 * import { usePersonaManager } from '@/hooks/use-persona-manager';
 * import { PERSONA_IDS } from '@/types/persona';
 * import type { Persona } from '@/types/persona';
 *
 * export function MyComponent() {
 *   const { personas, selectedPersona, setSelectedPersonaId } = usePersonaManager();
 *
 *   // personas: Persona[]
 *   // selectedPersona: Persona | undefined
 *
 *   const handleSelectDefault = () => {
 *     setSelectedPersonaId(PERSONA_IDS.GURT);
 *   };
 *
 *   return (
 *     <div>
 *       {personas.map((p: Persona) => (
 *         <button key={p.id} onClick={() => setSelectedPersonaId(p.id)}>
 *           {p.displayName}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 *
 * TROUBLESHOOTING
 * ===============
 * Q: Personas not showing up?
 *    A: Check that they exist in the database with is_active=true
 *    A: Check the browser console for /api/personas fetch errors
 *    A: Check Supabase query logs for permissions errors
 *
 * Q: Persona colors not right?
 *    A: See the getPersonaColor function in src/components/chat/chat-message.tsx
 *    A: It matches on persona.name (lowercase), so make sure DB has the right names
 *
 * Q: TypeScript error about avatarUrl type mismatch?
 *    A: Persona.avatarUrl is now nullable (string | null)
 *    A: Use persona?.avatarUrl || undefined when passing to Avatar components
 *
 * Q: Old code still importing PersonaDetails?
 *    A: It still compiles but is deprecated. Update to use Persona from @/types/persona
 *    A: PersonaDetails is only kept for backwards compat during migration
 */
