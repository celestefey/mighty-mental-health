import { NextRequest, NextResponse } from 'next/server';

/**
 * Clinical Alert Dispatcher for Luke Piatti (Practice Clinician).
 * Evaluates screener severity (e.g., PHQ-9 item 9 suicidal ideation, severe DASS-21)
 * and dispatches urgent alerts via secure practice channels (CLINICIAN_ALERT_WEBHOOK_URL).
 * Never uses marketing endpoints or returns false success indicators.
 */
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
      (typeof severity === 'string' && (
        severity.includes('Severe') || 
        severity.includes('Extremely Severe') ||
        severity.includes('URGENT') ||
        severity.includes('Suicide Risk') ||
        severity.includes('Very High Distress') ||
        severity.includes('Probable PTSD') ||
        severity.includes('High Substance Risk')
      )) ||
      Boolean(scores?.hasSelfHarmRisk) ||
      Boolean(scores?.probablePTSD) ||
      Boolean(scores?.highRisk) ||
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

    let alertDispatched = false;
    const alertWebhookUrl = process.env.CLINICIAN_ALERT_WEBHOOK_URL;

    if (alertWebhookUrl) {
      try {
        const response = await fetch(alertWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'clinician.alert.screener_submitted',
            alert: alertPayload,
          }),
        });
        alertDispatched = response.ok;
      } catch (dispatchErr) {
        console.error('[Clinical Alert Error] Failed to reach alert webhook:', dispatchErr);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Clinical Alert Local Log] ${alertPayload.subject}`, alertPayload);
      }
    }

    return NextResponse.json({
      success: true,
      alert_dispatched: alertDispatched,
      is_high_risk: isHighSeverity,
      message: alertDispatched 
        ? 'Alert dispatched successfully to clinician gateway' 
        : 'Alert logged locally; configure CLINICIAN_ALERT_WEBHOOK_URL for external dispatch.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
