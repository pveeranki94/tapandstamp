import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'tapandstamp';

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  client: SupabaseClient,
  path: string,
  file: Buffer | Blob,
  contentType: string
): Promise<string> {
  const { data, error } = await client.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType,
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = client.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * Upload logo image and return public URL
 */
export async function uploadLogo(
  client: SupabaseClient,
  merchantSlug: string,
  logoBuffer: Buffer,
  contentType: string
): Promise<string> {
  const path = `logos/${merchantSlug}/logo.png`;
  return uploadFile(client, path, logoBuffer, contentType);
}

/**
 * Upload stamp strip image and return public URL
 */
export async function uploadStampStrip(
  client: SupabaseClient,
  merchantSlug: string,
  version: number,
  count: number,
  total: number,
  imageBuffer: Buffer
): Promise<string> {
  const path = `stamps/${merchantSlug}/v${version}_${count}of${total}.png`;
  return uploadFile(client, path, imageBuffer, 'image/png');
}

/**
 * Delete all stamp strips for a merchant version (for cleanup)
 */
export async function deleteStampStrips(
  client: SupabaseClient,
  merchantSlug: string,
  version: number
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const prefix = `stamps/${merchantSlug}/v${version}_`;

  const { data: files, error: listError } = await client.storage
    .from(BUCKET_NAME)
    .list(`stamps/${merchantSlug}`, {
      search: `v${version}_`
    });

  if (listError) {
    console.error('Failed to list files for deletion:', listError);
    return;
  }

  if (files && files.length > 0) {
    const filePaths = files.map((file) => `stamps/${merchantSlug}/${file.name}`);
    const { error: deleteError } = await client.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (deleteError) {
      console.error('Failed to delete old stamp strips:', deleteError);
    }
  }
}

/**
 * Get public URL for an existing file
 */
export function getPublicUrl(
  client: SupabaseClient,
  path: string
): string {
  const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}
