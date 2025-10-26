import { NextRequest, NextResponse } from 'next/server';
import { deleteChatSession } from '@/lib/chat-actions';

export const runtime = 'edge';

/**
 * DELETE /api/chat/delete - Delete a chat session
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const userId = searchParams.get('userId');
    const accessToken = searchParams.get('accessToken') || request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!chatId || !userId) {
      return NextResponse.json(
        { error: 'Missing chatId or userId' },
        { status: 400 }
      );
    }

    const result = await deleteChatSession(userId, chatId, accessToken || undefined);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete chat' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/chat/delete] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
