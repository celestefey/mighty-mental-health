import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build', {
  apiVersion: '2025-02-24.acacia' as any,
  appInfo: {
    name: 'Mighty Mental Health Clinic Platform',
    version: '1.0.0',
    url: 'https://mightymentalhealth.com.au',
  },
});

export interface GstSplitBreakdown {
  totalAmountCents: number;
  totalAmountDollars: number;
  psychotherapyGstFreeDollars: number;
  movementConditioningExGstDollars: number;
  movementGstDollars: number;
  totalGstDollars: number;
  serviceDescription: string;
}

/**
 * Calculates compliant GST breakdown according to A New Tax System (GST) Act 1999 (Cth) Section 38-10.
 * - Psychotherapy / Counselling delivered by PACFA registered clinician: GST-free ($0 GST).
 * - Physical conditioning / movement coaching: 10% GST.
 */
export function calculateGstBreakdown(serviceSlugOrName: string, totalAmountCents: number): GstSplitBreakdown {
  const totalAmountDollars = totalAmountCents / 100;
  const lower = (serviceSlugOrName || '').toLowerCase();

  if (lower.includes('somatic') || lower.includes('movement')) {
    // Somatic movement therapy session (e.g. $165):
    // $110 psychotherapy (GST-free) + $50 movement conditioning ($5 GST) = $165 inc GST
    const psychotherapyGstFreeDollars = Math.min(110, totalAmountDollars);
    const movementTotalWithGst = Math.max(0, totalAmountDollars - psychotherapyGstFreeDollars);
    const movementConditioningExGstDollars = Number((movementTotalWithGst / 1.1).toFixed(2));
    const movementGstDollars = Number((movementTotalWithGst - movementConditioningExGstDollars).toFixed(2));

    return {
      totalAmountCents,
      totalAmountDollars,
      psychotherapyGstFreeDollars,
      movementConditioningExGstDollars,
      movementGstDollars,
      totalGstDollars: movementGstDollars,
      serviceDescription: 'Somatic Movement Psychotherapy (Split GST: Sec 38-10 Psychotherapy + 10% Movement Conditioning)',
    };
  }

  // Standard Individual Clinical Psychotherapy (e.g., $140):
  // 100% GST-free under Section 38-10
  return {
    totalAmountCents,
    totalAmountDollars,
    psychotherapyGstFreeDollars: totalAmountDollars,
    movementConditioningExGstDollars: 0,
    movementGstDollars: 0,
    totalGstDollars: 0,
    serviceDescription: 'Clinical Psychotherapy Consultation (GST-free: Sec 38-10 A New Tax System Act)',
  };
}
