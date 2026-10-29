import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculateGstBreakdown } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // In development or test environments
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { appointment_id, client_name, client_email, service_id } = paymentIntent.metadata || {};
    const amountCents = paymentIntent.amount_received || paymentIntent.amount;

    // Calculate Australian Split GST
    const gstInfo = calculateGstBreakdown(service_id || 'psychotherapy', amountCents);
    const gstCents = Math.round(gstInfo.totalGstDollars * 100);

    // 1. Confirm appointment if appointment_id provided
    if (appointment_id) {
      await supabase
        .from('mmh_appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointment_id);
    }

    // 2. Generate itemized tax invoice in mmh_invoices
    const invoiceNumber = `MMH-INV-${Date.now().toString().slice(-6)}`;
    await supabase.from('mmh_invoices').insert({
      appointment_id: appointment_id || null,
      client_name: client_name || 'Client',
      client_email: client_email || paymentIntent.receipt_email || 'client@example.com',
      amount_cents: amountCents,
      gst_cents: gstCents,
      status: 'paid',
      invoice_number: invoiceNumber,
      is_demo: false,
    });
  }

  return NextResponse.json({ received: true });
}
