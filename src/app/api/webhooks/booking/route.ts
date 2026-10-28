import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      appointment_id,
      client_name,
      client_email,
      service_title,
      scheduled_at,
      modality,
      telehealth_room_id,
      metadata = {},
    } = body;

    const webhookPayload = {
      event: 'appointment.scheduled',
      timestamp: new Date().toISOString(),
      booking: {
        appointment_id,
        service: service_title,
        scheduled_at,
        modality,
        telehealth_url: `https://mightymentalhealth.com.au/telehealth/${telehealth_room_id}`,
      },
      client: {
        name: client_name,
        email: client_email,
      },
      metadata: {
        utm_source: metadata.utm_source || 'website',
        utm_medium: metadata.utm_medium || 'booking_grid',
        client_ref_id: metadata.client_ref_id || 'ref_' + Math.random().toString(36).substring(2, 8),
        workflow_id: metadata.workflow_id || 'agy_onboarding_pipeline_v1',
      },
    };

    const externalWebhookUrl = process.env.ANTIGRAVITY_MARKETING_WEBHOOK_URL;
    if (externalWebhookUrl) {
      await fetch(externalWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking webhook dispatched to Antigravity marketing engine',
      payload: webhookPayload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
