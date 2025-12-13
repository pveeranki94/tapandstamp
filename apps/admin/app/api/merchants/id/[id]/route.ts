import { NextRequest, NextResponse } from 'next/server';
import type { Branding } from '@tapandstamp/core';
import { renderStampStrip } from '@tapandstamp/imaging';
import { createAdminClient } from '../../../../../lib/supabase/admin';
import { validateSession, requireMerchantAccess } from '../../../../../lib/auth/api';
import { getMerchantById, updateMerchant } from '../../../../../lib/db/merchants';
import { uploadStampStrip, uploadLogo } from '../../../../../lib/storage';

interface UpdateMerchantRequest {
  name?: string;
  rewardGoal?: number;
  branding?: Branding;
  logoData?: {
    base64: string;
    contentType: string;
  };
  headerLogoData?: {
    base64: string;
    contentType: string;
  };
}

/**
 * GET /api/merchants/id/[id] - Get merchant by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Validate session
  const authResult = await validateSession();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;

    // Check merchant access
    const accessDenied = requireMerchantAccess(authResult, id);
    if (accessDenied) return accessDenied;

    const client = createAdminClient();
    const merchant = await getMerchantById(client, id);

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: merchant.id,
      slug: merchant.slug,
      name: merchant.name,
      rewardGoal: merchant.reward_goal,
      branding: merchant.branding,
      brandingVersion: merchant.branding_version,
      joinQrUrl: merchant.join_qr_url,
      stampQrUrl: merchant.stamp_qr_url,
      createdAt: merchant.created_at
    });
  } catch (error) {
    console.error('[merchants/id/[id]] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/merchants/id/[id] - Update merchant
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Validate session
  const authResult = await validateSession();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;

    // Check merchant access
    const accessDenied = requireMerchantAccess(authResult, id);
    if (accessDenied) return accessDenied;

    const body: UpdateMerchantRequest = await request.json();
    const supabase = createAdminClient();

    // Get current merchant to check it exists and get slug for uploads
    const currentMerchant = await getMerchantById(supabase, id);
    if (!currentMerchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Handle logo uploads if provided
    const updatedBranding = body.branding;
    if (updatedBranding) {
      // Upload new logo if provided
      if (body.logoData?.base64) {
        const logoBuffer = Buffer.from(body.logoData.base64, 'base64');
        updatedBranding.logoUrl = await uploadLogo(
          supabase,
          currentMerchant.slug,
          logoBuffer,
          body.logoData.contentType
        );
      }

      // Upload new header logo if provided
      if (body.headerLogoData?.base64) {
        const headerLogoBuffer = Buffer.from(body.headerLogoData.base64, 'base64');
        updatedBranding.headerLogoUrl = await uploadLogo(
          supabase,
          currentMerchant.slug,
          headerLogoBuffer,
          body.headerLogoData.contentType,
          'header-logo'
        );
      }
    }

    // Update merchant in database
    const merchant = await updateMerchant(supabase, id, {
      name: body.name,
      rewardGoal: body.rewardGoal,
      branding: updatedBranding
    });

    // If branding was updated, regenerate stamp strip images
    if (updatedBranding) {
      const stampTotal = updatedBranding.stamp.total;
      const uploadPromises = [];

      // Get logo buffer for logo-shaped stamps
      let logoBuffer: Buffer | undefined;
      if (updatedBranding.stamp.shape === 'logo') {
        if (body.logoData?.base64) {
          logoBuffer = Buffer.from(body.logoData.base64, 'base64');
        } else if (currentMerchant.branding?.logoUrl) {
          // Fetch existing logo if not uploading new one
          try {
            const response = await fetch(currentMerchant.branding.logoUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              logoBuffer = Buffer.from(arrayBuffer);
            }
          } catch (e) {
            console.warn('Could not fetch existing logo for stamp strips:', e);
          }
        }
      }

      for (let count = 0; count <= stampTotal; count++) {
        const appleResult = await renderStampStrip({
          branding: updatedBranding,
          count,
          platform: 'apple',
          logoBuffer
        });

        const googleResult = await renderStampStrip({
          branding: updatedBranding,
          count,
          platform: 'google',
          logoBuffer
        });

        uploadPromises.push(
          uploadStampStrip(
            supabase,
            currentMerchant.slug,
            merchant.branding_version,
            count,
            stampTotal,
            appleResult.buffer
          )
        );

        uploadPromises.push(
          uploadStampStrip(
            supabase,
            currentMerchant.slug,
            merchant.branding_version,
            count,
            stampTotal,
            googleResult.buffer
          )
        );
      }

      await Promise.all(uploadPromises);
    }

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        slug: merchant.slug,
        name: merchant.name,
        rewardGoal: merchant.reward_goal,
        branding: merchant.branding,
        brandingVersion: merchant.branding_version
      }
    });
  } catch (error) {
    console.error('[merchants/id/[id]] PUT Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update merchant',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
