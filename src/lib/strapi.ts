/**
 * Strapi Headless CMS Integration Layer for Mighty Mental Health
 * Enables complete marketing copy and content editability through Strapi CMS
 * with automatic fallback to local clinical brand constants.
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export interface StrapiArticle {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: string;
  publishedAt: string;
}

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
      next: { revalidate: 60 }, // ISR: Revalidate every 60 seconds
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
