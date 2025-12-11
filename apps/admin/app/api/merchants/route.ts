import { NextRequest, NextResponse } from 'next/server';
import type { Branding } from '@tapandstamp/core';
import { renderStampStrip } from '@tapandstamp/imaging';
import { createServiceClient } from '../../../lib/supabase';
import { createMerchant, getMerchantBySlug } from '../../../lib/db/merchants';
import { uploadStampStrip, uploadLogo } from '../../../lib/storage';

export interface LogoDataPayload {
  base64: string;
  contentType: string;
}

export interface CreateMerchantRequest {
  name: string;
  slug: string;
  rewardGoal: number;
  branding: Branding;
  logoData?: LogoDataPayload;
}

export interface CreateMerchantResponse {
  success: boolean;
  merchantId: string;
  slug: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateMerchantRequest = await request.json();

    // Validation
    if (!body.name || !body.slug || !body.rewardGoal || !body.branding) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Create Supabase service client
    const supabase = createServiceClient();

    // Check if slug already exists
    const existing = await getMerchantBySlug(supabase, body.slug);
    if (existing) {
      return NextResponse.json(
        { error: 'A merchant with this slug already exists' },
        { status: 409 }
      );
    }

    // Generate URLs
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const adminBaseUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
    // Join QR points to admin app's join page for name collection
    const joinQrUrl = `${adminBaseUrl}/join/${body.slug}`;
    // Stamp QR points to API (member ID appended at runtime)
    const stampQrUrl = `${apiBaseUrl}/stamp`;

    // Upload logo to storage if provided
    let logoUrl = body.branding.logoUrl;
    if (body.logoData?.base64) {
      const logoBuffer = Buffer.from(body.logoData.base64, 'base64');
      logoUrl = await uploadLogo(
        supabase,
        body.slug,
        logoBuffer,
        body.logoData.contentType
      );
    }

    // Update branding with the storage URL
    const brandingWithLogo: Branding = {
      ...body.branding,
      logoUrl
    };

    // Create merchant in database
    const merchant = await createMerchant(supabase, {
      slug: body.slug,
      name: body.name,
      rewardGoal: body.rewardGoal,
      branding: brandingWithLogo,
      joinQrUrl,
      stampQrUrl
    });

    // Generate and upload stamp strip images (0 to N)
    const stampTotal = body.branding.stamp.total;
    const uploadPromises = [];

    // For logo shape stamps, we need the logo buffer
    let logoBuffer: Buffer | undefined;
    if (body.branding.stamp.shape === 'logo' && body.logoData?.base64) {
      logoBuffer = Buffer.from(body.logoData.base64, 'base64');
    }

    for (let count = 0; count <= stampTotal; count++) {
      // Generate stamp strip image for this count
      const appleResult = await renderStampStrip({
        branding: body.branding,
        count,
        platform: 'apple',
        logoBuffer
      });

      const googleResult = await renderStampStrip({
        branding: body.branding,
        count,
        platform: 'google',
        logoBuffer
      });

      // Upload both platform versions
      uploadPromises.push(
        uploadStampStrip(
          supabase,
          body.slug,
          merchant.branding_version,
          count,
          stampTotal,
          appleResult.buffer
        )
      );

      uploadPromises.push(
        uploadStampStrip(
          supabase,
          body.slug,
          merchant.branding_version,
          count,
          stampTotal,
          googleResult.buffer
        )
      );
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Return success response
    const response: CreateMerchantResponse = {
      success: true,
      merchantId: merchant.id,
      slug: merchant.slug,
      message: 'Merchant created successfully'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating merchant:', error);

    return NextResponse.json(
      {
        error: 'Failed to create merchant',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
