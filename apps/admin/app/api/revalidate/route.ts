import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Validate the webhook secret
  const secret = request.headers.get('x-contentful-webhook-secret');

  if (!process.env.CONTENTFUL_REVALIDATE_SECRET || secret?.trim() !== process.env.CONTENTFUL_REVALIDATE_SECRET.trim()) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  try {
    // Revalidate the landing page
    revalidatePath('/');

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: 'Landing page revalidated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error revalidating', error: String(error) },
      { status: 500 }
    );
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');

  if (!process.env.CONTENTFUL_REVALIDATE_SECRET || secret?.trim() !== process.env.CONTENTFUL_REVALIDATE_SECRET.trim()) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  try {
    revalidatePath('/');
    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: 'Landing page revalidated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error revalidating', error: String(error) },
      { status: 500 }
    );
  }
}
