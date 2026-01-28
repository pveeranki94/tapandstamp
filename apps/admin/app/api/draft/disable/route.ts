import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug') || '/';

  // Disable Draft Mode
  const draft = await draftMode();
  draft.disable();

  // Redirect to the path
  redirect(slug);
}
