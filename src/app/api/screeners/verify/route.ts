import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/screeners/expired?reason=missing', req.url));
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Look up assignment by token_hash
  const { data: assignment, error } = await supabase
    .from('mmh_form_assignments')
    .select('id, expires_at, used_at, status')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !assignment) {
    return NextResponse.redirect(new URL('/screeners/expired?reason=not_found', req.url));
  }

  // Check expiration (48 hours standard)
  if (assignment.expires_at && new Date(assignment.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/screeners/expired?reason=expired', req.url));
  }

  // Mark token used (one-time exchange)
  await supabase
    .from('mmh_form_assignments')
    .update({ used_at: new Date().toISOString() })
    .eq('id', assignment.id);

  // Set HttpOnly session cookie
  const response = NextResponse.redirect(new URL(`/screeners/${assignment.id}`, req.url));
  response.cookies.set('mmh_screener_session', assignment.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 2, // 2 hours to complete the screener
    path: '/',
  });

  return response;
}
