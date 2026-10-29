import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

    // In local development or when no secret key is configured, pass validation
    if (!secretKey || secretKey === 'placeholder_turnstile_secret') {
      return NextResponse.json({ success: true, mock: true });
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Turnstile verification token is missing' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    if (ip) {
      formData.append('remoteip', ip);
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const outcome = await verifyRes.json();

    if (outcome.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Bot challenge validation failed' },
        { status: 403 }
      );
    }
  } catch (err: any) {
    console.error('Turnstile verification error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal verification failure' },
      { status: 500 }
    );
  }
}
