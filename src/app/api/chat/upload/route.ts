// src/app/api/chat/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToGemini, ALL_SUPPORTED_MIME_TYPES } from '@/lib/gemini-client';
import { getUserFromRequest } from '@/lib/auth-helpers';

// Edge runtime compatible
export const runtime = 'edge';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit

export async function POST(request: NextRequest) {
  const requestId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  try {
    // Authenticate user
    const { userId, isAnonymous } = await getUserFromRequest(request);
    console.log(`[chat-upload][${requestId}] Incoming upload request`, {
      userId: userId ?? 'anonymous',
      isAnonymous,
    });

    if (!userId && !isAnonymous) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.warn(`[chat-upload][${requestId}] No file provided`);
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`[chat-upload][${requestId}] File too large`, {
        size: file.size,
      });
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALL_SUPPORTED_MIME_TYPES.includes(file.type as any)) {
      console.warn(`[chat-upload][${requestId}] Unsupported file type`, {
        mimeType: file.type,
      });
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    console.log(`[chat-upload][${requestId}] Preparing upload`, {
      name: file.name,
      type: file.type,
      size: file.size,
      userId: userId || 'anonymous',
    });

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);
    console.log(`[chat-upload][${requestId}] Read file into memory`, {
      byteLength: fileBytes.byteLength,
    });

    // Upload to Gemini
    const uploadedFile = await uploadFileToGemini(fileBytes, file.type);
    console.log(`[chat-upload][${requestId}] Uploaded to Gemini`, {
      uri: uploadedFile.uri,
      mimeType: uploadedFile.mimeType,
      sizeBytes: uploadedFile.sizeBytes,
    });

    return NextResponse.json({
      success: true,
      file: {
        name: uploadedFile.name,
        uri: uploadedFile.uri,
        mimeType: uploadedFile.mimeType,
        sizeBytes: uploadedFile.sizeBytes,
        displayName: file.name,
      },
    });

  } catch (error: any) {
    console.error(`[chat-upload][${requestId}] File upload error`, error);
    return NextResponse.json(
      {
        error: 'File upload failed',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
