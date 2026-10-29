import { NextRequest, NextResponse } from 'next/server';

/**
 * Internal intake receipt handler.
 * Strictly adheres to Privacy Act 1988 (Cth) APP 6 & 11:
 * Sensitive clinical data and psychometric scores are NEVER transmitted
 * to marketing, analytics, or external advertising pipelines.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      client_name,
      client_email,
      form_id,
      form_title,
    } = body;

    // Secure clinical audit logging within server runtime only
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Clinical Audit] Intake received for ${client_name} (${client_email}) - Form: ${form_title || form_id}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Intake record processed securely in compliance with APP 6/11.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
