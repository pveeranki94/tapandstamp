import { getClient } from './contentful';
import type { LandingPageEntry } from './contentful-types';

export async function getLandingPageContent(preview: boolean = false) {
  const client = getClient(preview);

  if (!client) {
    return null;
  }

  const entries = await client.getEntries({
    content_type: 'landingPage',
    include: 2,
    limit: 1,
  });

  if (!entries.items.length) {
    return null;
  }

  // Cast to our defined type - the shape is known from Contentful
  return entries.items[0] as unknown as LandingPageEntry;
}
