# Area K: Performance, SEO, Content & Trust Audit

**Reviewer:** Senior SEO Strategist & Technical Performance Engineer  
**Artifact:** `./audit/11-performance-seo.md`  
**Finding Severity:** MEDIUM (P2)

---

## 1. Search Engine Indexing of Private Medical Routes

**Location:** `src/app/layout.tsx:25-35`
```typescript
robots: {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
},
```

### Risk Analysis:
In Next.js App Router, metadata declared in `src/app/layout.tsx` cascades to all child routes unless overridden.  
Because `/admin`, `/portal`, `/telehealth/[roomId]`, and `/screeners/[assignmentId]` do not define specific `robots: { index: false, follow: false }` metadata, and because no `robots.txt` exists to disallow them, search engine web crawlers (Googlebot, Bingbot, Common Crawl) **will crawl and index private patient consultation links and administration pages**.

---

## 2. Placeholder Data in Production Schema Markup

**Location:** `src/app/layout.tsx:51-85`
```typescript
const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  url: 'https://mighty-mental-health.vercel.app',
  telephone: '+61 412 345 678', // Synthetic demo phone number!
  ...
};
```
- **Finding:** The JSON-LD structured data for Google Search contains the placeholder synthetic telephone number `+61 412 345 678` (which is the demo number assigned to Sarah Jenkins in test seeds).
- **Finding:** `metadataBase` points to `mighty-mental-health.vercel.app` rather than Luke's production canonical domain (`mightymentalhealth.com.au`).

---

## 3. Core Web Vitals & Bundle Performance

1. **Build Size & Turbopack:**  
   The application builds rapidly with Next.js 16 (`npm run build` compiles 11 routes in ~2.4s). The production bundle size for first load JS is ~142 kB, which is well within performance budgets.
2. **Font Loading & Icons:**  
   The project imports 35+ icons individually from `lucide-react`. Tree-shaking is effective, but consolidating icons into a centralized UI icon library will further streamline chunk size.
3. **Shader / Background Artifacts:**  
   The root directory contains multiple legacy shader generation scripts (`generate_patterns.ps1`, `capture_shader_screenshots.ps1`) and prototype assets. These are not imported into the production client bundle, but clutter the codebase.

---

## 4. Required Specification for Fix (Area K)

1. **Deploy `robots.ts` with Disallows for Private Routes:**
   Block `/admin`, `/portal`, `/telehealth/`, `/screeners/`, and `/api/`.
2. **Add Explicit Route Metadata:**
   Add `export const metadata: Metadata = { robots: { index: false, follow: false } };` to `/admin/page.tsx`, `/portal/page.tsx`, `/telehealth/[roomId]/page.tsx`, and `/screeners/[assignmentId]/page.tsx`.
3. **Correct Production Canonical Schema:**
   Update JSON-LD phone number to Luke's authentic practice number and set `metadataBase` to `https://mightymentalhealth.com.au`.
