import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../../../../../../../lib/supabase';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Verify the authentication token from the pass
function verifyAuthToken(token: string, memberId: string): boolean {
  const secret = process.env.PASSKIT_AUTH_SECRET || 'default-secret-change-in-production';
  const expectedToken = crypto
    .createHmac('sha256', secret)
    .update(memberId)
    .digest('hex');
  return token === expectedToken;
}

// Extract member ID from serial number (format: apple-{memberId})
function extractMemberId(serial: string): string | null {
  if (serial.startsWith('apple-')) {
    return serial.substring(6);
  }
  return null;
}

interface RouteParams {
  deviceId: string;
  passTypeId: string;
  serial: string;
}

/**
 * POST - Register a device for push notifications
 * Apple Wallet calls this when a pass is added to a device
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { deviceId, passTypeId, serial } = await params;

    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('ApplePass ')) {
      return new NextResponse(null, { status: 401 });
    }
    const authToken = authHeader.substring(10);

    // Extract member ID from serial
    const memberId = extractMemberId(serial);
    if (!memberId) {
      return new NextResponse(null, { status: 400 });
    }

    // Verify auth token
    if (!verifyAuthToken(authToken, memberId)) {
      return new NextResponse(null, { status: 401 });
    }

    // Parse request body for push token
    const body = await request.json();
    const pushToken = body.pushToken;

    if (!pushToken) {
      return new NextResponse(null, { status: 400 });
    }

    const client = createServiceClient();

    // Check if member exists
    const { data: member, error: memberError } = await client
      .from('members')
      .select('id')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return new NextResponse(null, { status: 404 });
    }

    // Upsert the registration
    const { error } = await client
      .from('pass_registrations')
      .upsert(
        {
          member_id: memberId,
          device_id: deviceId,
          push_token: pushToken,
          pass_type_id: passTypeId,
          platform: 'apple',
        },
        {
          onConflict: 'member_id,device_id,pass_type_id',
        }
      );

    if (error) {
      console.error('[PassKit] Registration error:', error);
      return new NextResponse(null, { status: 500 });
    }

    // 201 = newly registered, 200 = already registered (updated)
    return new NextResponse(null, { status: 201 });
  } catch (error) {
    console.error('[PassKit] Registration error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

/**
 * DELETE - Unregister a device for push notifications
 * Apple Wallet calls this when a pass is removed from a device
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { deviceId, passTypeId, serial } = await params;

    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('ApplePass ')) {
      return new NextResponse(null, { status: 401 });
    }
    const authToken = authHeader.substring(10);

    // Extract member ID from serial
    const memberId = extractMemberId(serial);
    if (!memberId) {
      return new NextResponse(null, { status: 400 });
    }

    // Verify auth token
    if (!verifyAuthToken(authToken, memberId)) {
      return new NextResponse(null, { status: 401 });
    }

    const client = createServiceClient();

    // Delete the registration
    const { error } = await client
      .from('pass_registrations')
      .delete()
      .eq('member_id', memberId)
      .eq('device_id', deviceId)
      .eq('pass_type_id', passTypeId);

    if (error) {
      console.error('[PassKit] Unregistration error:', error);
      return new NextResponse(null, { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('[PassKit] Unregistration error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
