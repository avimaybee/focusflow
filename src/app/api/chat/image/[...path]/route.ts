
import { NextRequest, NextResponse } from 'next/server';
import { geminiClient } from '@/lib/gemini-client';

export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const fileId = params.path.join('/');

  if (!fileId) {
    return new NextResponse('File ID is required', { status: 400 });
  }

  try {
    const file = await geminiClient.files.get(fileId);
    const blob = await file.blob();

    return new NextResponse(blob, {
      headers: {
        'Content-Type': file.mimeType,
      },
    });
  } catch (error) {
    console.error(`Error fetching image proxy for file ${fileId}:`, error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
