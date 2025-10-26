# Persona System - Quick Reference for Developers

## 🚀 Quick Start

### Using Personas in Your Code

```typescript
// 1. Import server actions
import { getPersonas, getPersonaById } from '@/lib/persona-actions';

// 2. Get all personas (client or server)
const personas = await getPersonas();

// 3. Get specific persona
const gurt = await getPersonaById('gurt');

// 4. Use in chat flow (server-side)
const selectedPersona = personaId 
  ? await getPersonaById(personaId) 
  : await getDefaultPersona();
```

---

## 📋 Persona IDs

```typescript
import { PersonaIDs } from '@/lib/constants';

PersonaIDs.GURT              // 'gurt'
PersonaIDs.ELI5              // 'eli5'
PersonaIDs.STRAIGHT_SHOOTER  // 'straight-shooter'
PersonaIDs.ESSAY_WRITER      // 'essay-writer'
PersonaIDs.IN_DEPTH_EXPLAINER // 'in-depth-explainer'
PersonaIDs.SASSY_EVA         // 'sassy-eva'
PersonaIDs.BRAINSTORMER      // 'brainstormer'
PersonaIDs.MEMORY_COACH      // 'memory-coach'
PersonaIDs.CODING_GURU       // 'coding-guru'
PersonaIDs.EXAM_STRATEGIST   // 'exam-strategist'
```

---

## 🔧 Database Schema

```sql
Table: personas

Columns:
- id (text, PK)              -- 'gurt', 'eli5', etc.
- name (text)                -- Internal name
- display_name (text)        -- UI display name
- description (text)         -- Short description
- prompt (text)              -- Full system prompt
- avatar_url (text, nullable) -- Image URL (optional)
- avatar_emoji (text, nullable) -- Emoji avatar
- personality_traits (text[]) -- Array of traits
- is_active (boolean)        -- Active/inactive
- sort_order (integer)       -- Display order
- created_at (timestamptz)   -- Created timestamp
- updated_at (timestamptz)   -- Updated timestamp
```

---

## 📦 Type Definitions

```typescript
// From persona-actions.ts
interface Persona {
  id: string;
  name: string;
  display_name: string;
  description: string;
  prompt: string;
  avatar_url: string | null;
  avatar_emoji: string | null;
  personality_traits: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Legacy format (for compatibility)
interface PersonaDetails {
  id: string;
  name: string;
  avatarUrl: string;
  prompt: string;
}
```

---

## 🎯 Common Operations

### Client-Side (React Component)

```typescript
import { usePersonaManager } from '@/hooks/use-persona-manager';

function MyComponent() {
  const { 
    personas,           // All personas
    selectedPersona,    // Current persona
    selectedPersonaId,  // Current ID
    setSelectedPersonaId, // Change persona
    isLoading           // Loading state
  } = usePersonaManager();

  if (isLoading) return <div>Loading personas...</div>;

  return (
    <select 
      value={selectedPersonaId} 
      onChange={(e) => setSelectedPersonaId(e.target.value)}
    >
      {personas.map(p => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
```

### Server-Side (API Route)

```typescript
import { getPersonaById } from '@/lib/persona-actions';

export async function POST(request: Request) {
  const { personaId } = await request.json();
  
  const persona = await getPersonaById(personaId);
  
  if (!persona) {
    return Response.json({ error: 'Persona not found' }, { status: 404 });
  }
  
  // Use persona.prompt in AI call
  const response = await generateAIResponse({
    systemPrompt: persona.prompt,
    userMessage: "Hello"
  });
  
  return Response.json({ response });
}
```

---

## 🎨 UI Components

### Persona Selector

```typescript
{personas.map(persona => (
  <button
    key={persona.id}
    onClick={() => setSelectedPersonaId(persona.id)}
    className={selectedPersonaId === persona.id ? 'active' : ''}
  >
    <span className="text-2xl">{persona.avatarUrl}</span>
    <span>{persona.name}</span>
  </button>
))}
```

### Persona Avatar Display

```typescript
function PersonaAvatar({ personaId }: { personaId: string }) {
  const persona = personas.find(p => p.id === personaId);
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{persona?.avatarUrl}</span>
      <span className="font-medium">{persona?.name}</span>
    </div>
  );
}
```

---

## 🔒 RLS Policies

```sql
-- Everyone can read active personas (already set in migration)
CREATE POLICY "Personas are viewable by everyone" 
ON public.personas
FOR SELECT 
USING (is_active = TRUE);

-- Future: Admin-only edits
-- CREATE POLICY "Only admins can modify personas" 
-- ON public.personas
-- FOR ALL 
-- USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));
```

---

## 🐛 Debugging

### Check if persona exists:
```typescript
const persona = await getPersonaById('gurt');
if (!persona) {
  console.error('Persona not found! Did migration run?');
}
```

### Check database connection:
```typescript
const personas = await getPersonas();
console.log(`Loaded ${personas.length} personas`); // Should be 10
```

### Verify prompt:
```typescript
const gurt = await getPersonaById('gurt');
console.log(gurt?.prompt.includes('who are you')); // Should be true
```

---

## ⚡ Performance

### Caching Strategy

```typescript
// Client-side: usePersonaManager caches in state
// Server-side: Consider adding Redis cache

import { cache } from 'react';

export const getCachedPersonas = cache(async () => {
  return await getPersonas();
});
```

### Reduce Database Calls

```typescript
// Good: Fetch once, reuse
const personas = await getPersonas();
const gurt = personas.find(p => p.id === 'gurt');

// Avoid: Multiple DB calls
const gurt = await getPersonaById('gurt'); // Call 1
const eli5 = await getPersonaById('eli5'); // Call 2
```

---

## 🧪 Testing

### Unit Test Example

```typescript
import { getPersonaById } from '@/lib/persona-actions';

describe('Persona Actions', () => {
  it('should fetch Gurt persona', async () => {
    const gurt = await getPersonaById('gurt');
    expect(gurt).toBeDefined();
    expect(gurt?.id).toBe('gurt');
    expect(gurt?.display_name).toBe('Gurt - The Guide');
  });

  it('should return null for invalid persona', async () => {
    const invalid = await getPersonaById('nonexistent');
    expect(invalid).toBeNull();
  });
});
```

### Integration Test

```typescript
import { chatFlow } from '@/ai/flows/chat-flow';

it('should use Sassy Eva personality', async () => {
  const result = await chatFlow({
    message: 'Explain photosynthesis',
    userId: 'test-user',
    isGuest: false,
    personaId: 'sassy-eva'
  });

  // Check for Sassy Eva's signature style
  expect(result.response).toMatch(/bestie|slay|iconic|period/i);
});
```

---

## 📝 Adding a New Persona

### 1. Write SQL

```sql
INSERT INTO personas (
  id, name, display_name, description, prompt, 
  avatar_emoji, personality_traits, sort_order
) VALUES (
  'new-persona',
  'New Persona',
  'New Persona - The Description',
  'Short description',
  'Full system prompt...',
  '🆕',
  ARRAY['trait1', 'trait2'],
  11
);
```

### 2. Update Constants

```typescript
// src/lib/constants.ts
export const PersonaIDs = {
  // ... existing
  NEW_PERSONA: 'new-persona',
} as const;
```

### 3. Update Type

```typescript
// src/types/chat-types.ts
export const validPersonas = [
  // ... existing
  'new-persona',
] as const;
```

---

## 🔗 File Locations

```
src/
├── lib/
│   ├── persona-actions.ts    # Server actions
│   └── constants.ts           # PersonaIDs
├── hooks/
│   └── use-persona-manager.ts # Client hook
├── ai/flows/
│   └── chat-flow.ts           # AI integration
└── types/
    └── chat-types.ts          # Type definitions

supabase/
└── migrations/
    ├── 04_create_personas_table.sql  # Migration
    └── 04_verify_personas.sql        # Verification queries

docs/
├── PERSONAS_GUIDE.md                  # User guide
├── PERSONA_MIGRATION_GUIDE.md         # Migration steps
└── PERSONA_IMPLEMENTATION_SUMMARY.md  # Technical summary
```

---

## 🚨 Common Mistakes

### ❌ Don't Do This:
```typescript
// Don't hardcode persona IDs as strings
if (personaId === 'gurt') { ... }

// Don't import from old file
import { defaultPersonas } from '@/lib/personas'; // DELETED!

// Don't use client hook in server components
import { usePersonaManager } from '@/hooks/use-persona-manager';
export default async function ServerComponent() {
  const { personas } = usePersonaManager(); // ERROR!
}
```

### ✅ Do This Instead:
```typescript
// Use PersonaIDs constant
import { PersonaIDs } from '@/lib/constants';
if (personaId === PersonaIDs.GURT) { ... }

// Use server actions
import { getPersonas } from '@/lib/persona-actions';

// Server components use server actions directly
export default async function ServerComponent() {
  const personas = await getPersonas();
}
```

---

## 📞 Getting Help

**Migration Issues**: See `PERSONA_MIGRATION_GUIDE.md`
**Persona Details**: See `docs/PERSONAS_GUIDE.md`
**Implementation**: See `PERSONA_IMPLEMENTATION_SUMMARY.md`
**Database**: Check Supabase Table Editor > personas
**Types**: Check `src/types/chat-types.ts`

---

**Last Updated**: 2024 (Persona System v2.0)
