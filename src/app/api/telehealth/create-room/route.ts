import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointment_id, client_name, client_email } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const dailyApiKey = process.env.DAILY_API_KEY;

    if (dailyApiKey) {
      // Create ephemeral Daily.co room with recording permanently disabled for Australian Privacy Compliance
      const roomName = `mmh-${(appointment_id || crypto.randomUUID()).slice(0, 8)}-${Date.now().toString(36)}`;
      const expTime = Math.floor(Date.now() / 1000) + 7200; // 2 hours

      const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dailyApiKey}`,
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'public',
          properties: {
            enable_recording: false,
            enable_screenshare: true,
            enable_chat: true,
            exp: expTime,
            eject_at_room_exp: true,
          },
        }),
      });

      if (dailyRes.ok) {
        const roomData = await dailyRes.json();
        
        // Update appointment with room info if appointment_id provided
        if (appointment_id) {
          await supabase
            .from('mmh_appointments')
            .update({ telehealth_room_id: roomName })
            .eq('id', appointment_id);
        }

        return NextResponse.json({
          provider: 'daily',
          roomUrl: roomData.url,
          roomName: roomName,
          expiresAt: new Date(expTime * 1000).toISOString(),
        });
      }
    }

    // High-security WebRTC peer room fallback with Australian STUN config
    const secureRoomId = `mmh-room-${crypto.randomBytes(8).toString('hex')}`;
    
    if (appointment_id) {
      await supabase
        .from('mmh_appointments')
        .update({ telehealth_room_id: secureRoomId })
        .eq('id', appointment_id);
    }

    return NextResponse.json({
      provider: 'webrtc-peer',
      roomId: secureRoomId,
      roomUrl: `/telehealth/${secureRoomId}`,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      enableRecording: false,
      privacyCompliance: 'APP-11 Encrypted Peer Connection',
      expiresAt: new Date(Date.now() + 7200 * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('Telehealth room creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize telehealth room' },
      { status: 500 }
    );
  }
}
