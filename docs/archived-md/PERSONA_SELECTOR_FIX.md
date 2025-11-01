# Persona Selector Fix - Landing Page Issue

## Problem
When clicking the persona dropdown on the landing page chat widget, no personas were visible ("No persona found" message appeared).

## Root Causes Identified

### 1. Missing TypeScript Properties
The `usePersonaManager` hook was not including all required properties that the `PersonaSelector` component expected:
- Missing: `displayName` property
- Missing: `description` property

### 2. Type Mismatch
The persona selector expected personas with these properties:
```typescript
{
  id: string;
  name: string;
  displayName: string;  // ← Was missing
  description: string;  // ← Was missing
  avatarUrl: string;
  prompt: string;
}
```

But `usePersonaManager` was only providing:
```typescript
{
  id: string;
  name: string;
  avatarUrl: string;
  prompt: string;
}
```

## Changes Made

### 1. Updated `src/hooks/use-persona-manager.ts`
- Added `displayName` and `description` to the conversion function
- Updated TypeScript type definition to include these fields

```typescript
function convertToPersonaDetails(persona: Persona) {
  return {
    id: persona.id,
    name: persona.display_name,
    displayName: persona.display_name,  // ✅ Added
    description: persona.description,   // ✅ Added
    avatarUrl: persona.avatar_emoji || persona.avatar_url || '',
    prompt: persona.prompt,
  };
}
```

### 2. Updated `src/components/chat/persona-selector.tsx`
- Added `disabled` prop support for loading states
- Improved empty state message to distinguish between "loading" and "no results"

### 3. Updated `src/components/landing/landing-page-chat-v2.tsx`
- Added `isLoading` state from `usePersonaManager`
- Added `disabled={isLoading}` to PersonaSelector
- Added console.log for debugging (can be removed later)

### 4. Updated `docs/PERSONAS.md`
- Fixed persona ID table to reflect the actual IDs in your database after migration
- IDs are now: 'Gurt', 'Im a baby', 'straight shooter', etc.

## Verification Steps

### 1. Check Browser Console
When you open the landing page, check the browser console for:
```
Landing page personas loaded: 10 [Array of personas]
```

If you see `Landing page personas loaded: 0 []`, it means:
- Either the Supabase migration hasn't been run yet
- Or there's an environment variable issue
- Or the personas table is empty

### 2. Verify Supabase Data
Run this query in your Supabase SQL Editor to confirm personas exist:

```sql
SELECT id, display_name, is_active FROM public.personas WHERE is_active = TRUE ORDER BY sort_order;
```

You should see 10 rows with these IDs:
- Gurt
- Im a baby
- straight shooter
- essay writer
- lore master
- sassy tutor
- idea cook
- memory coach
- code nerd
- exam strategist

### 3. Test the Selector
1. Visit http://localhost:3000
2. Click the persona icon in the chat widget input (bottom left)
3. You should now see all 10 personas in a colorful dropdown
4. Click any persona to select it
5. The selected persona should show an "Active" badge

## If Personas Still Don't Show

### Check 1: Environment Variables
Ensure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Check 2: Supabase RLS Policy
Run this to verify the RLS policy allows public reads:
```sql
SELECT * FROM pg_policies WHERE tablename = 'personas';
```

Should show a policy named "Personas are viewable by everyone" with `SELECT` permission.

### Check 3: Network Tab
Open browser DevTools > Network tab:
1. Filter by "Fetch/XHR"
2. Look for requests to Supabase
3. Check if there are any 401/403/500 errors

### Check 4: Server Action Logs
If you deployed to Cloudflare Pages, check the function logs for any errors when fetching personas.

## Build & Deploy

Build completed successfully ✅

To deploy:
```bash
git add .
git commit -m "fix: persona selector showing empty on landing page"
git push
```

Cloudflare Pages will auto-deploy from your git push.

## Next Steps (Optional Cleanup)

1. Remove the debug `console.log` from `landing-page-chat-v2.tsx` (line ~129)
2. Consider adding a retry mechanism if persona fetching fails
3. Add error toast notification if personas fail to load

---

**Status**: Fixed ✅  
**Files Modified**: 4 files
**Build Status**: Passing ✅
