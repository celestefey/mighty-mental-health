import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointment_id, service_id, client_name, client_email, amount_cents } = body;

    if (!amount_cents || amount_cents <= 0) {
      return NextResponse.json({ error: 'Valid amount_cents is required' }, { status: 400 });
    }

    if (!client_email) {
      return NextResponse.json({ error: 'Client email is required' }, { status: 400 });
    }

    // In local development without live Stripe secret, return mock client secret
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder_for_build') {
      return NextResponse.json({
        clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(2),
        paymentIntentId: 'pi_mock_' + Math.random().toString(36).substring(2),
        isMock: true,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount_cents),
      currency: 'aud',
      receipt_email: client_email,
      metadata: {
        appointment_id: appointment_id || '',
        service_id: service_id || '',
        client_name: client_name || '',
        client_email: client_email || '',
        provider: 'Luke Piatti (PACFA Reg. #28941)',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Stripe PaymentIntent error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
