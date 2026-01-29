import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug') || '/';

  // Validate the secret token (trim to handle trailing newlines from secret managers)
  if (!process.env.CONTENTFUL_PREVIEW_SECRET || secret?.trim() !== process.env.CONTENTFUL_PREVIEW_SECRET.trim()) {
    return new Response('Invalid token', { status: 401 });
  }

  // Enable Draft Mode
  const draft = await draftMode();
  draft.enable();

  // Redirect to the path from the fetched post
  redirect(slug);
}
