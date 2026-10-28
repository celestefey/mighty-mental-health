import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      client_name,
      client_email,
      form_title,
      severity,
      scores,
      submitted_at = new Date().toISOString(),
    } = body;

    const isHighSeverity = 
      (typeof severity === 'string' && (severity.includes('Severe') || severity.includes('Extremely Severe'))) ||
      (scores?.depression && scores.depression >= 20) ||
      (scores?.anxiety && scores.anxiety >= 15);

    const alertPayload = {
      recipient: 'luke@mightymentalhealth.com.au',
      subject: `${isHighSeverity ? '🚨 URGENT CLINICAL ALERT' : '📋 Screener Submitted'}: ${client_name} - ${form_title}`,
      client: {
        name: client_name,
        email: client_email,
      },
      assessment: {
        title: form_title,
        severity: severity,
        scores: scores,
        is_high_risk: isHighSeverity,
        submitted_at,
      },
      urgent_action_required: isHighSeverity,
    };

    // Forward to transactional alert webhook (e.g. Resend / Zoho SMTP / Antigravity alerting engine)
    const externalWebhookUrl = process.env.ANTIGRAVITY_MARKETING_WEBHOOK_URL;
    if (externalWebhookUrl) {
      await fetch(externalWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'clinician.alert.screener_submitted',
          alert: alertPayload,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      alert_dispatched: true,
      is_high_risk: isHighSeverity,
      alert: alertPayload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
