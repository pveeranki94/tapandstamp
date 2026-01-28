import { getClient } from './contentful';
import type { LandingPageFields } from './contentful-types';

export async function getLandingPageContent(preview: boolean = false) {
  const client = getClient(preview);

  if (!client) {
    return null;
  }

  const entries = await client.getEntries<LandingPageFields>({
    content_type: 'landingPage',
    include: 2,
    limit: 1,
  });

  if (!entries.items.length) {
    return null;
  }

  return entries.items[0];
}
