import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { renameChatSession } from '@/lib/chat-actions';

export const runtime = 'edge';

const payloadSchema = z.object({
  chatId: z.string().min(1, 'Chat ID is required.'),
  title: z
    .string({ required_error: 'Title is required.' })
    .trim()
    .min(1, 'Title cannot be empty.')
    .max(120, 'Title must be 120 characters or fewer.'),
});

export async function PATCH(request: NextRequest) {
  try {
    const { userId, isAnonymous } = await getUserFromRequest(request);
    if (!userId || isAnonymous) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid payload.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { chatId, title } = parsed.data;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader || undefined;

    const result = await renameChatSession(userId, chatId, title, token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to rename chat.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, title: result.title });
  } catch (error) {
    console.error('[PATCH /api/chat/rename] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
