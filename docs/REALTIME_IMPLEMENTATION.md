# Supabase Realtime Chat Implementation

## Overview
This implementation uses Supabase Realtime to provide instant, push-based message delivery in the chat interface. Messages appear immediately without polling or manual refresh.

## Architecture

### Components

1. **`use-chat-realtime.ts`** - Custom React hook
   - Subscribes to `chat_messages` INSERT events filtered by `session_id`
   - Transforms DB rows to `ChatMessageProps` format
   - Handles attachment parsing with Gemini proxy URLs
   - Resolves persona details from personas array or activePersona
   - Includes auto-selection metadata parsing

2. **`page.tsx` Integration**
   - Subscribes when `activeChatId` is set (including new chats)
   - Deduplicates incoming messages by DB id
   - Replaces optimistic messages with real DB messages
   - Maintains stateful chat history

3. **Database Migration** - `20251110_enable_realtime_chat_messages.sql`
   - Adds `chat_messages` table to realtime publication
   - Sets `REPLICA IDENTITY FULL` for complete event data
   - Documents realtime usage

## Data Flow

### New Message Flow
```
1. User sends message → Optimistic UI update (id: user-<timestamp>)
2. POST /api/chat → Server processes and saves to DB
3. DB INSERT triggers Realtime event
4. Supabase Realtime pushes event to subscribed clients
5. useChatRealtime receives event and transforms row
6. handleRealtimeMessage deduplicates and replaces optimistic message
7. UI updates with real DB message (id: <uuid>)
```

### AI Response Flow
```
1. Server calls chat-flow.ts → Generates AI response
2. Server saves model message to DB via addChatMessage
3. DB INSERT triggers Realtime event
4. Client receives event via WebSocket
5. handleRealtimeMessage appends/replaces AI message
6. UI shows AI response instantly (no polling needed)
```

## Deduplication Strategy

### By Database ID
- Primary deduplication method
- Check if `message.id` already exists in messages array
- Skip if duplicate found

### Optimistic Message Replacement

#### Model Messages (AI Responses)
- Check for optimistic messages with id starting with `ai-` or `model-`
- Match by:
  - Exact `rawText` match, OR
  - Created time within 2 seconds
- Replace optimistic message with real DB message

#### User Messages
- Check for optimistic messages with id starting with `user-`
- Match by:
  - Exact `rawText` match AND
  - Created time within 5 seconds
- Replace optimistic message with real DB message

## Attachment Handling

The Realtime hook parses attachments from DB format to UI format:

```typescript
// DB format (from row.attachments JSONB)
{
  url: string,           // Remote Gemini file URI
  name: string,
  mimeType: string,
  sizeBytes: string | number
}

// Transformed to ChatMessageProps format
{
  url: string,           // Proxied URL via buildGeminiProxyUrl
  remoteUrl: string,     // Original Gemini URI
  name: string,
  contentType: string,   // Normalized from mimeType
  size: number           // Parsed and validated
}
```

## Persona Handling

Personas are resolved in this priority order:

1. **From personas array** - Match by `persona_id` (case-insensitive)
2. **From activePersona** - If persona_id matches current active persona
3. **Undefined** - If no match found (graceful degradation)

Auto-selection metadata is preserved:
- `selectedByAuto` boolean flag
- `autoSelectedPersonaId` from DB
- `autoSelectedPersonaName` resolved from personas array

## Security & RLS

- Realtime subscriptions enforce Row Level Security (RLS)
- Client uses authenticated Supabase client (anon key + user session)
- Only messages visible per RLS policies are pushed to client
- Filter by `session_id` ensures users only receive their own chat messages

## Performance Considerations

### Subscription Lifecycle
- One WebSocket connection per active chat session
- Subscription created when `activeChatId` changes
- Automatic cleanup on chat switch or unmount
- `processedIdsRef` cleared on cleanup to prevent memory leaks

### Network Efficiency
- Push-based: No polling = reduced network traffic
- Filtered subscriptions: Only relevant messages pushed
- Deduplication: Prevents redundant UI updates

## Database Requirements

### Realtime Publication
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
```

### RLS Policies (assumed to exist)
```sql
-- Users can view their own chat messages
CREATE POLICY "Users can view their chat messages" 
  ON public.chat_messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );
```

## Testing Checklist

### Functional Tests
- [x] New chat: Send first message → Both user and AI messages appear
- [ ] Attachments: Send message with file → File displays correctly
- [ ] Personas: Messages show correct persona avatar and name
- [ ] Auto-selection: "Auto → <PersonaName>" label appears correctly
- [ ] Multiple messages: Rapid sends → All messages appear in order
- [ ] Chat switch: Navigate between chats → Messages load correctly
- [ ] Reconnection: Disconnect network → Reconnect → Messages sync

### Edge Cases
- [ ] Duplicate INSERT events → Deduplication prevents double display
- [ ] Optimistic message timing → Replaced correctly even if timing varies
- [ ] Missing persona → Message displays with undefined persona (no crash)
- [ ] Invalid attachment data → Gracefully skipped, message still displays
- [ ] Network interruption → Auto-reconnects, catches up on missed messages

## Debugging

### Console Logs
Enable debug logs by searching console for:
- `[Realtime]` - Hook subscription and message handling
- `[Client]` - Chat page message operations
- `[chat-flow]` - Server-side message processing

### Common Issues

**Realtime not working:**
1. Check Supabase dashboard: Database > Replication > Enable realtime for `chat_messages`
2. Verify RLS policies allow SELECT for authenticated users
3. Check console for `[Realtime] Successfully subscribed` log

**Messages appearing twice:**
- Check deduplication logic in `handleRealtimeMessage`
- Ensure `processedIdsRef` is being cleared on cleanup

**Attachments not displaying:**
- Verify `buildGeminiProxyUrl` is working correctly
- Check attachment parsing in `transformDbRow`
- Inspect DB row.attachments format matches expected structure

**Personas not showing:**
- Verify `personas` array is passed to `useChatRealtime`
- Check persona IDs match (case-insensitive comparison used)
- Ensure `getPersonaById` returns valid persona data

## Migration Path

### From Polling to Realtime
1. ✅ Remove polling loop from `handleSendMessage`
2. ✅ Add `useChatRealtime` hook
3. ✅ Implement deduplication in `handleRealtimeMessage`
4. ✅ Run migration to enable realtime on table
5. ⏳ Deploy and monitor

### Rollback Plan
If issues arise, temporarily disable Realtime:
```typescript
enabled: false, // In useChatRealtime options
```
And re-enable polling loop (revert commit).

## Future Enhancements

- **Typing indicators**: Use Realtime Presence
- **Read receipts**: Add UPDATE events subscription
- **Message edits**: Subscribe to UPDATE events with old/new values
- **Batch operations**: Group rapid inserts for smoother UI updates
- **Offline support**: Queue messages locally, sync on reconnect
