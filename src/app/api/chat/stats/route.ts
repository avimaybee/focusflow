// src/app/api/chat/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getChatMessages } from '@/lib/chat-actions-edge';
import { getConversationStats, isConversationNearLimit } from '@/lib/conversation-manager';

export const runtime = 'edge';

/**
 * GET /api/chat/stats?sessionId=xxx
 * Returns conversation statistics including token count and warnings
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Get authorization token
    const authHeader = request.headers.get('authorization');
    const messages = await getChatMessages(sessionId, authHeader || undefined);

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        messageCount: 0,
        userMessages: 0,
        modelMessages: 0,
        estimatedTokens: 0,
        averageMessageLength: 0,
        nearLimit: false,
        shouldWarn: false,
      });
    }

    // Convert to conversation format
    const conversation = messages.map(m => ({
      role: m.role,
      text: m.rawText || m.text?.toString() || '',
    }));

    const stats = getConversationStats(conversation);
    const nearLimit = isConversationNearLimit(conversation, 30000, 0.8); // 80% of 30k
    const shouldWarn = isConversationNearLimit(conversation, 30000, 0.9); // 90% of 30k

    return NextResponse.json({
      ...stats,
      nearLimit,
      shouldWarn,
      recommendation: shouldWarn 
        ? 'Consider starting a new conversation soon to avoid context limit issues.'
        : nearLimit
        ? 'Your conversation is getting long. You may want to start a new chat soon.'
        : null,
    });

  } catch (error: any) {
    console.error('[API] Chat stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get conversation stats', details: error?.message },
      { status: 500 }
    );
  }
}
