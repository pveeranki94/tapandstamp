import { createClient } from 'contentful';

const space = process.env.CONTENTFUL_SPACE_ID;
const environment = process.env.CONTENTFUL_ENVIRONMENT || 'master';

// Delivery client - for published content
function getDeliveryClient() {
  const accessToken = process.env.CONTENTFUL_DELIVERY_TOKEN;
  if (!space || !accessToken) {
    return null;
  }
  return createClient({ space, accessToken, environment });
}

// Preview client - for draft/unpublished content
function getPreviewClient() {
  const accessToken = process.env.CONTENTFUL_PREVIEW_TOKEN;
  if (!space || !accessToken) {
    return null;
  }
  return createClient({
    space,
    accessToken,
    environment,
    host: 'preview.contentful.com',
  });
}

export const contentfulClient = getDeliveryClient();
export const contentfulPreviewClient = getPreviewClient();

export function getClient(preview: boolean = false) {
  return preview ? contentfulPreviewClient : contentfulClient;
}
