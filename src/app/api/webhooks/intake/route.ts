import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      client_name,
      client_email,
      form_id,
      form_title,
      answers,
      score_summary,
      clinical_severity,
      metadata = {},
    } = body;

    // Enriched payload with tracking metadata for Antigravity automated marketing workflows
    const webhookPayload = {
      event: 'client.intake.submitted',
      timestamp: new Date().toISOString(),
      client: {
        name: client_name,
        email: client_email,
      },
      intake: {
        form_id,
        form_title,
        severity: clinical_severity,
        scores: score_summary,
      },
      metadata: {
        utm_source: metadata.utm_source || 'organic',
        utm_medium: metadata.utm_medium || 'direct',
        utm_campaign: metadata.utm_campaign || 'mmh_telehealth_launch',
        workflow_id: metadata.workflow_id || 'agy_intake_pipeline_v1',
        origin: metadata.origin || 'mightymentalhealth.com.au',
      },
    };

    // If an external Antigravity webhook URL or Formspree URL is configured:
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
      message: 'Intake webhook processed and metadata tracked',
      tracked_event: webhookPayload.event,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
