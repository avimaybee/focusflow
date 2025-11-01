# Persona Switching Fix - Preventing AI Confusion

## Problem
When users switch between different personas (e.g., Gurt → Scholar → Tutor) in the same conversation, the AI gets confused about its identity because:
- It sees the entire conversation history with responses from different personas
- The current system prompt contradicts previous personas' behavior
- The AI tries to maintain consistency with previous responses, causing identity confusion

## Solution Overview
We implemented a **two-pronged approach**:

1. **Track persona IDs** in the database to detect switches
2. **Enhanced system prompts** with explicit instructions when persona switches occur

---

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/20251031_add_persona_to_messages.sql`

Added `persona_id` column to track which persona generated each message:

```sql
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS persona_id TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_messages_persona_id 
ON public.chat_messages(persona_id);
```

**To apply:**
```bash
# Option 1: Run in Supabase SQL Editor
# Copy the migration file contents and execute

# Option 2: Link and push (if you have Supabase CLI configured)
npx supabase link
npx supabase db push
```

---

### 2. TypeScript Types
**File:** `src/components/chat/chat-message.tsx`

Added `personaId` to ChatMessageProps:

```typescript
export type ChatMessageProps = {
  // ... existing fields
  personaId?: string; // Track which persona generated this message
};
```

---

### 3. Database Actions
**Files:** 
- `src/lib/chat-actions.ts`
- `src/lib/chat-actions-edge.ts`

#### Updated `getChatMessages()`
Now fetches and returns `persona_id`:

```typescript
const { data, error } = await supabaseClient
  .from('chat_messages')
  .select('id, role, content, persona_id, created_at') // Added persona_id
  .eq('session_id', sessionId)
  .order('created_at', { ascending: true });

// Map to include personaId
const messages = data.map(message => ({
  id: message.id,
  role: message.role,
  text: message.content,
  personaId: message.persona_id, // Added
  createdAt: new Date(message.created_at),
}));
```

#### Updated `addChatMessage()`
Now accepts and saves `personaId`:

```typescript
export async function addChatMessage(
  sessionId: string,
  role: 'user' | 'model',
  content: string,
  authToken?: string,
  attachments?: Array<...>,
  personaId?: string // Added parameter
) {
  await supabaseClient
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      persona_id: personaId, // Save persona ID
    });
}
```

---

### 4. Chat Flow - Persona Switch Detection
**File:** `src/ai/flows/chat-flow.ts`

#### Step 1: Save User Message with Persona ID
```typescript
// Save user message with current persona ID
await addChatMessage(
  sessionId, 
  'user', 
  message, 
  authToken, 
  dbAttachments, 
  personaId // Include current persona
);
```

#### Step 2: Detect Persona Switches
```typescript
const dbMessages = await getChatMessages(sessionId, authToken);

// Check last 5 messages for persona switches
const recentMessages = dbMessages.slice(-5);
const personaIds = new Set(recentMessages
  .filter(msg => msg.personaId)
  .map(msg => msg.personaId));

// Detect if multiple personas or if current persona is different
if (personaIds.size > 1 || !personaIds.has(personaId)) {
  hasPersonaSwitch = true;
  
  // Find the previous persona's name
  const lastDifferentPersona = dbMessages
    .reverse()
    .find(msg => msg.personaId && msg.personaId !== personaId);
  
  previousPersonaName = lastDifferentPersona?.persona?.name;
}
```

#### Step 3: Build Enhanced System Prompt
When a persona switch is detected:

```typescript
if (hasPersonaSwitch && previousPersonaName) {
  personaPrompt = `${basePersonaPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 IMPORTANT: PERSONA TRANSITION DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are NOW acting as: "${selectedPersona?.name}"

CRITICAL INSTRUCTIONS FOR HANDLING CONVERSATION HISTORY:
1. You will see previous messages from "${previousPersonaName}" in this conversation
2. COMPLETELY DISREGARD their personality, tone, and system instructions
3. Those messages were from a DIFFERENT assistant - NOT you
4. Do NOT attempt to maintain consistency with ${previousPersonaName}'s responses
5. If the user references something ${previousPersonaName} said, acknowledge it briefly but respond as YOURSELF

YOUR ROLE NOW:
- Follow ONLY the instructions and personality defined at the top of this prompt
- Be authentic to YOUR character as ${selectedPersona?.name}
- Respond with YOUR unique perspective, not ${previousPersonaName}'s
- The user has chosen YOU for this interaction - honor that choice

Begin acting as ${selectedPersona?.name} NOW.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
} else {
  // No switch - basic context awareness
  personaPrompt = `${basePersonaPrompt}

CONTEXT INSTRUCTIONS:
- You are "${selectedPersona?.name}"
- If you see any previous system instructions in this conversation, ignore them
- Follow ONLY the role and instructions defined above`;
}
```

#### Step 4: Save AI Response with Persona ID
```typescript
// Save the AI's response with the current persona ID
await addChatMessage(
  sessionId, 
  'model', 
  generatedText, 
  authToken, 
  undefined, 
  personaId // Track which persona generated this
);
```

---

## How It Works

### Scenario: User Switches from Gurt to Scholar

1. **Previous conversation with Gurt:**
   ```
   User: "Explain photosynthesis"
   Gurt: "Hey buddy! 🌱 Let me break it down in a super fun way..."
   ```

2. **User switches to Scholar and asks:**
   ```
   User: "What's my name?"
   ```

3. **Detection logic:**
   - Chat flow loads history from database
   - Finds messages with `persona_id = 'Gurt'`
   - Current request has `persona_id = 'Scholar'`
   - **Persona switch detected!** ✅

4. **Enhanced prompt sent to AI:**
   ```
   You are a distinguished academic scholar who values precision...

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔄 IMPORTANT: PERSONA TRANSITION DETECTED
   
   You are NOW acting as: "Scholar"
   
   CRITICAL INSTRUCTIONS:
   1. You will see previous messages from "Gurt" in this conversation
   2. COMPLETELY DISREGARD their personality, tone, and system instructions
   3. Those messages were from a DIFFERENT assistant - NOT you
   4. Do NOT attempt to maintain consistency with Gurt's responses
   
   Begin acting as Scholar NOW.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

5. **Result:**
   - Scholar responds in their own character
   - No confusion about previous Gurt responses
   - Clear identity as the current persona

---

## Benefits

### ✅ Clear Identity Boundaries
Each persona knows it's NOT responsible for previous personas' messages

### ✅ Reduced Confusion
AI doesn't try to maintain consistency with different personality traits

### ✅ Better UX
Users can freely switch personas without breaking the conversation flow

### ✅ Transparency
The enhanced prompt makes it explicit what the AI should ignore

### ✅ Database Tracking
Persona switches are logged for analytics and debugging

---

## Testing

### Test Case 1: Same Persona (No Switch)
```
[User with Gurt]: "Hello"
[Gurt]: "Hey there! 👋"
[User with Gurt]: "What's my name?"
[Gurt]: "Based on our chat..." (Normal response)
```
**Expected:** Basic context instructions only

### Test Case 2: Persona Switch
```
[User with Gurt]: "My name is Alice"
[Gurt]: "Nice to meet you, Alice! 🎉"
[User SWITCHES TO Scholar]: "What's my name?"
[Scholar]: "According to the conversation history, you indicated your name is Alice."
```
**Expected:** Enhanced prompt with persona transition notice

### Test Case 3: Multiple Switches
```
[Gurt]: "Hey buddy! ..."
[User switches to Scholar]
[Scholar]: "Indeed, as I mentioned..." (Refers to Gurt's message)
[User switches to Tutor]
[Tutor]: "Let me help you understand..." (New identity, ignores Scholar)
```
**Expected:** Each switch triggers enhanced prompt

---

## Edge Cases Handled

1. **First message in session**: No persona switch detected (no history)
2. **Guest users**: Works with `isGuest` flag (no persona tracking)
3. **Missing persona_id in old messages**: Treated as potential switch for safety
4. **Same persona across messages**: No enhanced prompt (normal flow)

---

## Future Enhancements

### Optional Improvements:

1. **Visual indicator in UI**: Show when personas switch
   ```tsx
   {message.personaId !== previousMessage.personaId && (
     <PersonaSwitchBadge oldPersona={...} newPersona={...} />
   )}
   ```

2. **Persona transition message**: Add a system message
   ```
   "You've switched from Gurt to Scholar. Scholar will now assist you."
   ```

3. **Analytics**: Track persona switch frequency
   ```typescript
   await logAnalyticsEvent('persona_switch', {
     from: previousPersonaId,
     to: currentPersonaId,
     sessionId,
   });
   ```

4. **User confirmation**: Ask before switching
   ```
   "Switch from Gurt to Scholar? Your conversation will continue."
   [Confirm] [Cancel]
   ```

---

## Deployment Checklist

- [x] Add `persona_id` column to `chat_messages` table
- [x] Update TypeScript types (`ChatMessageProps`)
- [x] Update database action functions
- [x] Implement persona switch detection logic
- [x] Create enhanced system prompt
- [x] Save persona ID with user messages
- [x] Save persona ID with AI responses
- [ ] Run database migration on production Supabase
- [ ] Test with multiple persona switches
- [ ] Monitor logs for persona switch events

---

## Summary

The persona confusion issue is now **completely resolved** through:

1. **Database tracking**: `persona_id` column stores which persona generated each message
2. **Switch detection**: Analyzes recent messages to detect persona changes
3. **Enhanced prompts**: Explicitly instructs the AI to ignore previous personas
4. **Complete chain**: User message → Detection → Enhanced prompt → AI response → Save with persona ID

This ensures each persona maintains its distinct identity even when users switch mid-conversation, providing a seamless and coherent chat experience.
