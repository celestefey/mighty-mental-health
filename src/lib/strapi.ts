/**
 * Strapi Headless CMS Integration Layer for Mighty Mental Health
 * 
 * Provides type-safe content fetching for:
 * 1. Homepage & Hero Copy
 * 2. Clinician Profile ("About Luke")
 * 3. Services & Pricing Menu
 * 4. Psychoeducation & Somatic Knowledge Base (Articles/Blog)
 * 5. Frequently Asked Questions (FAQs & Health Fund Rebates)
 * 
 * Architecture:
 * - Uses Next.js Incremental Static Regeneration (ISR, revalidate: 60s)
 * - Automatically falls back to local brand defaults if Strapi is offline or unconfigured
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// Generic Strapi fetcher with fallback
export async function fetchFromStrapi<T>(
  path: string,
  fallbackData: T
): Promise<T> {
  if (!process.env.NEXT_PUBLIC_STRAPI_URL) {
    return fallbackData;
  }

  try {
    const res = await fetch(`${STRAPI_URL}/api${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
      },
      next: { revalidate: 60 }, // ISR: Revalidate content every 60 seconds
    });

    if (!res.ok) {
      console.warn(`Strapi returned status ${res.status} for ${path}. Using fallback.`);
      return fallbackData;
    }

    const data = await res.json();
    return data.data ?? fallbackData;
  } catch (error) {
    console.warn(`Could not connect to Strapi at ${STRAPI_URL}. Using fallback defaults.`);
    return fallbackData;
  }
}

// -----------------------------------------------------------------------------
// Type Definitions & Helper Methods
// -----------------------------------------------------------------------------

export interface StrapiHomepage {
  headline: string;
  subhead: string;
  heroTagline: string;
  crisisNotice: string;
}

export interface StrapiClinicianBio {
  name: string;
  qualifications: string;
  credentials: string[];
  bioParagraph1: string;
  bioParagraph2: string;
  location: string;
  quote: string;
}

export interface StrapiArticle {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  category: 'Somatic Science' | 'Trauma & Resilience' | 'Mind-Body Habits' | 'Case Studies';
  summary: string;
  content: string;
  readTimeMinutes: number;
  publishedAt: string;
}

export interface StrapiFAQ {
  id: number;
  question: string;
  answer: string;
  category: 'Billing & Rebates' | 'Telehealth Tech' | 'Clinical Process' | 'First Session';
}

// 1. Get Homepage Copy (with fallback to MMH Brand defaults)
export async function getHomepageContent(): Promise<StrapiHomepage> {
  return fetchFromStrapi<StrapiHomepage>('/homepage', {
    headline: 'Strengthening Mind & Body As One.',
    subhead: 'Meeting you where you’re at. Compassionate, evidence-based psychotherapy paired with physical movement regulation to build deep, enduring resilience.',
    heroTagline: 'The Somatic-Cognitive Synthesis',
    crisisNotice: 'If you are experiencing acute distress, call 000 or Lifeline 13 11 14 immediately.',
  });
}

// 2. Get About Luke Bio (with fallback to MMH Brand defaults)
export async function getClinicianBio(): Promise<StrapiClinicianBio> {
  return fetchFromStrapi<StrapiClinicianBio>('/clinician-bio', {
    name: 'Luke',
    qualifications: 'Master of Counselling (University of Queensland)',
    credentials: [
      'PACFA Registered Clinician',
      'UQ Master of Counselling',
      'Certified Movement & Strength Coach',
    ],
    bioParagraph1:
      'Conventional therapy often asks you to talk about your distress while ignoring the knots in your shoulders, shallow chest breathing, and an agitated nervous system.',
    bioParagraph2:
      'Mighty Mental Health was founded to fuse both. With an evidence-based, compassionate space, mind and body are strengthened as one unified human practice.',
    location: 'Logan, Queensland • Serving Australia-Wide via Telehealth',
    quote: 'Meeting you where you are at — getting onto the exact same eye-level.',
  });
}

// 3. Get Psychoeducation Articles / Blog
export async function getArticles(): Promise<StrapiArticle[]> {
  return fetchFromStrapi<StrapiArticle[]>('/articles?sort=publishedAt:desc', [
    {
      id: 1,
      documentId: 'art-01',
      title: 'Why Sitting All Day Amplifies Anxiety: The Autonomic Link',
      slug: 'sitting-and-anxiety-autonomic-link',
      category: 'Somatic Science',
      summary: 'How hip flexor tension and shallow thoracic breathing keep your nervous system locked in low-grade fight-or-flight.',
      content: 'Clinical overview of the vagus nerve and posture mechanics...',
      readTimeMinutes: 5,
      publishedAt: '2026-10-20',
    },
    {
      id: 2,
      documentId: 'art-02',
      title: 'Resistance Training for Emotional Regulation',
      slug: 'resistance-training-emotional-regulation',
      category: 'Mind-Body Habits',
      summary: 'Practical guide to using controlled isometric exercises to down-regulate sympathetic cortisol spikes.',
      content: 'Detailed strength protocols adapted for burnout recovery...',
      readTimeMinutes: 6,
      publishedAt: '2026-10-15',
    },
  ]);
}

// 4. Get Frequently Asked Questions
export async function getFAQs(): Promise<StrapiFAQ[]> {
  return fetchFromStrapi<StrapiFAQ[]>('/faqs', [
    {
      id: 1,
      question: 'Can I claim private health fund rebates for sessions?',
      answer: 'Yes. Luke is a PACFA registered clinician. Invoices include official provider credentials suitable for Medibank, Bupa, and most major Australian private insurers.',
      category: 'Billing & Rebates',
    },
    {
      id: 2,
      question: 'How do online Telehealth video consultations work?',
      answer: 'Upon booking, you receive an encrypted in-app room link. There is no software to install; simply click the link on your phone, tablet, or laptop browser.',
      category: 'Telehealth Tech',
    },
    {
      id: 3,
      question: 'Do I need to be physically fit to do somatic consultations?',
      answer: 'Not at all. Somatic movement is adapted to your current biological capacity — from gentle breath pacing and chair stretches to progressive resistance.',
      category: 'Clinical Process',
    },
  ]);
}
