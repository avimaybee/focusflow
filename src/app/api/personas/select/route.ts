import { NextRequest, NextResponse } from 'next/server';
import { selectPersonaForPrompt } from '@/lib/persona-selector';
import { z } from 'zod';

export const runtime = 'edge';

const selectPersonaSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  currentPersonaId: z.string().optional(),
});

/**
 * POST /api/personas/select
 * 
 * Select the best persona for a given prompt using semantic analysis
 * 
 * Request body:
 * {
 *   "prompt": "Write an essay about climate change",
 *   "currentPersonaId": "Auto" (optional)
 * }
 * 
 * Response:
 * {
 *   "personaId": "essay writer",
 *   "personaName": "Clairo",
 *   "confidence": 0.85,
 *   "reason": "Semantic similarity: 85.0%",
 *   "method": "semantic"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = selectPersonaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const { prompt, currentPersonaId } = parsed.data;

    // Perform persona selection
    const result = await selectPersonaForPrompt(prompt, currentPersonaId);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[api/personas/select] Error selecting persona:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to select persona',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
