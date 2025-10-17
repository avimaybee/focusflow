# Testing Guide - Chat Migration Fixes

## Prerequisites

Before testing, ensure:

1. **Supabase Setup:**
   - Run migrations: `supabase db push` or manually execute `supabase/migrations/02_create_chat_tables.sql`
   - Verify tables exist: `chat_sessions`, `chat_messages`, `profiles`
   - Verify RLS policies are enabled

2. **Environment Variables:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   GEMINI_API_KEY=your_gemini_key
   ```

3. **Cloudflare Pages (for production):**
   - Ensure Edge runtime is enabled
   - Verify environment variables are set in Cloudflare dashboard

## Test Scenarios

### 1. Sign In Flow (Critical)

**Steps:**
1. Navigate to the landing page
2. Click "Sign In" or "Get Started"
3. Enter credentials and sign in
4. Observe: Should redirect to `/chat` without errors

**Expected Results:**
- ✅ No "Application error" message
- ✅ No TypeError in browser console
- ✅ Chat page loads with welcome screen
- ✅ No 400 errors in network tab

**What Was Fixed:**
- TypeError from undefined messages array
- Missing authentication in API calls
- Edge runtime compatibility issues

### 2. Create New Chat

**Steps:**
1. Sign in (see Test 1)
2. Type a message in the input box
3. Click Send

**Expected Results:**
- ✅ Creates a new chat session in Supabase
- ✅ Saves user message to `chat_messages` table
- ✅ Gets AI response
- ✅ Saves AI response to `chat_messages` table
- ✅ Chat appears in sidebar history
- ✅ URL updates to `/chat/[chatId]`

**Database Verification:**
```sql
-- Check session created
SELECT * FROM chat_sessions WHERE user_id = 'your_user_id';

-- Check messages saved
SELECT * FROM chat_messages WHERE session_id = 'your_session_id';
```

### 3. Load Existing Chat

**Steps:**
1. Create a chat (see Test 2)
2. Refresh the page or navigate away
3. Click the chat in the sidebar

**Expected Results:**
- ✅ Messages load from Supabase
- ✅ All previous messages display correctly
- ✅ Can send new messages
- ✅ New messages persist after refresh

### 4. Multiple Chats

**Steps:**
1. Create first chat with message "Hello"
2. Click "New Chat" button
3. Create second chat with message "How are you?"
4. Switch between chats using sidebar

**Expected Results:**
- ✅ Each chat maintains its own message history
- ✅ No messages leak between chats
- ✅ Both chats visible in sidebar
- ✅ RLS prevents seeing other users' chats

### 5. Authentication Edge Cases

**Test A: No Auth Token**
1. Open DevTools → Application → Clear site data
2. Try to navigate to `/chat` directly
3. Expected: Prompted to sign in

**Test B: Expired Token**
1. Sign in and create a chat
2. Wait for token to expire (or manually invalidate)
3. Try to send a message
4. Expected: Graceful error, prompt to re-authenticate

**Test C: Concurrent Sessions**
1. Sign in on two different browsers/tabs
2. Create chats in both
3. Expected: Both sessions work independently

## Browser Console Checks

### Look For (Should NOT see):
- ❌ `TypeError: Cannot read properties of undefined (reading 'map')`
- ❌ `TypeError: Cannot read properties of undefined (reading 'indexOf')`
- ❌ `400 Bad Request` on chat endpoints
- ❌ `Application error: a client-side exception has occurred`

### Expected Console Logs (Should see):
- ✅ `[ChatPage] messages changed, length: X`
- ✅ `[API] GET /api/chat hit`
- ✅ `[Client] Creating session - POST /api/chat/session`
- ✅ `[Client] POST /api/chat payload keys:`
- ✅ Debug logs showing successful operations

## Network Tab Checks

### API Calls to Monitor:

1. **GET /api/chat?sessionId=xxx**
   - Should return 200 with array of messages
   - Should include Authorization header

2. **POST /api/chat/session**
   - Should return 200 with `{ id: "..." }`
   - Should include Authorization header
   - Body should include userId and title

3. **POST /api/chat/message**
   - Should return 200 with `{ ok: true }`
   - Should include Authorization header
   - Body should include sessionId, role, content

4. **POST /api/chat**
   - Should return 200 with AI response
   - Should include Authorization header

## RLS Policy Testing

### Verify Users Can Only See Their Own Data:

1. Sign in as User A, create a chat, note the chat ID
2. Sign out, sign in as User B
3. Try to manually navigate to User A's chat: `/chat/[user_a_chat_id]`
4. Expected: No messages load (RLS blocks it)

### Database Query (as admin):
```sql
-- This should return rows only for the authenticated user
SELECT * FROM chat_sessions WHERE auth.uid() = user_id;
SELECT * FROM chat_messages WHERE EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE id = session_id AND auth.uid() = user_id
);
```

## Performance Testing

1. **Large Chat History:**
   - Create a chat with 50+ messages
   - Check load time
   - Verify pagination works (if implemented)

2. **Multiple Chats:**
   - Create 20+ chat sessions
   - Check sidebar load time
   - Verify all chats are accessible

## Error Handling

### Test Error Scenarios:

1. **Network Failure:**
   - Turn off network mid-chat
   - Try to send a message
   - Expected: Error toast, message not sent

2. **Invalid Session ID:**
   - Manually modify URL to invalid chat ID
   - Expected: Graceful handling, possibly redirect

3. **Server Error:**
   - If possible, simulate server error (500)
   - Expected: Error toast, retry option

## Mobile Testing

1. Sign in on mobile device
2. Create and send messages
3. Verify:
   - Sidebar opens/closes properly
   - Input works correctly
   - Messages display correctly
   - Authentication persists

## Cloudflare Pages Specific

1. **Edge Runtime:**
   - Verify API routes run on Edge
   - Check response times (should be fast)
   - Verify no "Function too large" errors

2. **Environment Variables:**
   - Ensure all env vars are set in Cloudflare dashboard
   - Test in preview deployment
   - Test in production deployment

## Rollback Plan

If issues are discovered:

1. **Immediate:**
   - Revert to previous deployment
   - Check Cloudflare rollback options

2. **Database:**
   - Chat tables can be dropped if needed (be careful!)
   - Backup existing data first

3. **Code Revert:**
   ```bash
   git revert HEAD~3..HEAD
   git push
   ```

## Success Criteria

All of these must pass:

- [ ] User can sign in without errors
- [ ] No TypeError in console after sign-in
- [ ] New chats are created successfully
- [ ] Messages persist in Supabase
- [ ] Messages load correctly on page refresh
- [ ] RLS policies work (users see only their own chats)
- [ ] Multiple chats can be created and switched between
- [ ] Authentication headers are sent with all API requests
- [ ] Edge runtime API routes work on Cloudflare
- [ ] No 400/500 errors under normal operation

## Debugging Tips

If tests fail:

1. **Check Browser Console:**
   - Look for red errors
   - Check network tab for failed requests
   - Verify auth token is present in request headers

2. **Check Supabase Dashboard:**
   - Verify tables exist
   - Check RLS policies are enabled
   - Look at real-time logs for query errors

3. **Check Cloudflare Logs:**
   - View function logs
   - Check for Edge runtime errors
   - Verify environment variables

4. **Common Issues:**
   - Missing environment variables
   - RLS policies too restrictive
   - Token not being sent in requests
   - Edge runtime incompatibility

## Contact

For issues or questions, refer to:
- `MIGRATION_FIXES.md` - Detailed explanation of changes
- GitHub Issues - Report bugs
- Code comments - Implementation details
