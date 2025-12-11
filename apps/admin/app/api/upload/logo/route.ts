import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../../lib/supabase';
import { uploadFile } from '../../../../lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;
    const slug = formData.get('slug') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        { error: 'Merchant slug is required' },
        { status: 400 }
      );
    }

    // Validate file type - SVG only
    if (file.type !== 'image/svg+xml') {
      return NextResponse.json(
        { error: 'Logo must be an SVG file' },
        { status: 400 }
      );
    }

    // Validate file size (1MB max for SVG)
    if (file.size > 1 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'SVG file size must be less than 1MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const supabase = createServiceClient();
    const path = `logos/${slug}/logo.svg`;
    const url = await uploadFile(supabase, path, buffer, 'image/svg+xml');

    return NextResponse.json({
      success: true,
      url
    });
  } catch (error) {
    console.error('Error uploading logo:', error);

    return NextResponse.json(
      {
        error: 'Failed to upload logo',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
