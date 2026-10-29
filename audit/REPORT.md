# Senior Review Panel Audit Synthesis Report: Mighty Mental Health

**Target Application:** Mighty Mental Health (`https://mighty-mental-health.vercel.app`)  
**Sole Practitioner:** Luke Piatti (MCouns, UQ; PACFA Reg. #28941) — Exercise-Integrated Counsellor, Logan QLD  
**Audit Date:** 2026-10-29  
**Review Standard:** Australian Privacy Act 1988 (Cth) / APPs, PACFA Code of Ethics, WCAG 2.2 AA, OWASP Top 10  
**Overall Verdict:** 🔴 **NOT READY FOR PRODUCTION / MUST NOT ACCEPT REAL CLIENT DATA**

---

## 1. Executive Summary

### Plain-English Explanation for Luke Piatti:
> Mighty Mental Health has a visually compelling brand identity, clean aesthetic, and accurate mathematical scoring algorithms for clinical instruments like the DASS-21 and PHQ-9. However, **the platform is currently an interactive prototype, not a safe electronic health record (EHR)**. Crucially, the database door is wide open: anyone on the internet with basic technical knowledge can read, modify, or delete every client intake, medication list, and therapy note. Furthermore, clinical intake information is currently wired to send patient details to an advertising/marketing webhook, which is a serious breach of Australian federal privacy law. In addition, the video call room does not actually connect two people (it only shows your own camera to yourself), and the website claims you can offer Medicare Better Access rebates when, as a PACFA counsellor, your rebates are legally limited to private health funds and NDIS. **No real client data should be entered into this system until the database security, authentication, and clinical safety alerts are completely locked down.**

---

### Top 10 Critical Risks:
1. **Open Database RLS (`USING (true)`):** The public anonymous key can read, update, or delete all patient clinical notes, intakes, and appointments (`supabase/schema.sql:140-169`).
2. **Clinical Data Piped to Marketing Webhook:** Intake submissions and screener scores are dispatched to `ANTIGRAVITY_MARKETING_WEBHOOK_URL` alongside advertising UTM tracking tags (`src/app/api/webhooks/intake/route.ts:18-49`).
3. **Telehealth Fallback Leaks Other Patients' Records:** An invalid or mistyped room URL triggers a fallback that loads the most recent appointment and clinical notes of an arbitrary patient (`src/app/telehealth/[roomId]/page.tsx:191-199`).
4. **Client-Side Admin Bypass & Magic Link Escalation:** A *"Clinician Fast-Unlock"* button fabricates an admin session in memory, and any external user signing up via magic link is granted full clinician console access (`src/app/admin/page.tsx:133, 199`).
5. **Missed Suicide Risk Alerts:** Crisis flags are calculated on the client side and sent asynchronously *after* saving; if a client closes their tab or loses internet, the alert is never transmitted (`src/app/screeners/[assignmentId]/page.tsx:151`).
6. **False Alert Success:** The alert endpoint reports `alert_dispatched: true` even when no notification was sent because no email or SMS provider is configured (`src/app/api/alerts/clinician/route.ts:63`).
7. **Stored DOM-XSS in GP Letter Generator:** Unescaped client and clinic names are injected directly into `printWindow.document.write` (`src/app/admin/page.tsx:456`).
8. **Incomplete Screeners Silently Score as Zero:** Unanswered questions default to `0` (or `1` for K10), misdiagnosing severe distress as "None-Minimal" (`src/lib/scoring.ts:73, 116`).
9. **Illegal Medicare Better Access Claims:** Generated GP letters recommend re-referral under the Medicare Better Access framework, which legally does not apply to counsellors (`src/lib/clinicalTemplates.ts:172, 238`).
10. **Silent Booking Failure:** If the database insert fails, the booking modal ignores the error and displays a fake confirmation to the client (`src/components/booking/ValidatedBookingForm.tsx:104, 135`).

---

## 2. Comprehensive Findings Matrix

| ID | Domain | Severity | Code Location | Client / Practice Impact | Recommended Technical Fix | Effort | Needs Human Sign-Off |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | AppSec / DB | **CRITICAL** | `supabase/schema.sql:140-169` | Total practice database exposed to anonymous internet users. Mass breach liability. | Rewrite RLS: restrict clinical notes to clinician JWT role; restrict intakes/appointments to verified client email or clinician. | **M** | **YES** (Privacy/Legal) |
| **SEC-02** | AppSec / Auth | **CRITICAL** | `src/app/admin/page.tsx:133, 199` | Unauthorized visitors gain full access to clinician EHR and patient notes. | Delete `handleClinicianBypass`. Add Next.js `middleware.ts` verifying `user.email === 'luke@...'` and clinician role. | **M** | **NO** |
| **SEC-03** | Telehealth | **CRITICAL** | `src/app/telehealth/[roomId]/page.tsx:191-199` | Data breach: Invalid room URL discloses another client's full identity and notes. | Delete fallback query lines 191-199. Return strict 404 / Unauthorized barrier. | **S** | **NO** |
| **SEC-04** | Privacy / Legal | **CRITICAL** | `src/app/api/webhooks/intake/route.ts:18-49` | Criminal/civil liability under Privacy Act (APP 6) for commingling health data with marketing. | Remove `ANTIGRAVITY_MARKETING_WEBHOOK_URL` from all clinical intake and screener routes. | **S** | **YES** (Privacy) |
| **SEC-05** | AppSec / XSS | **CRITICAL** | `src/app/admin/page.tsx:456` | Clinician account takeover via malicious patient name in intake. | Replace raw `document.write` with DOM element creation and `textContent` encoding. | **S** | **NO** |
| **CLIN-01** | Clinical Safety | **CRITICAL** | `src/app/screeners/[assignmentId]/page.tsx:151` | Clinician unaware of acute patient suicidal ideation (PHQ-9 Item 9). Client harm. | Move scoring and alert dispatch to atomic server-side route with retries. | **M** | **YES** (Clinician) |
| **CLIN-02** | Clinical Math | **CRITICAL** | `src/lib/scoring.ts:73, 116` | Missing answers score as zero, leading to false-negative depression/anxiety assessments. | Enforce 100% question completeness via Zod before scoring. | **S** | **YES** (Clinician) |
| **REG-01** | Legal / Ethics | **CRITICAL** | `src/lib/clinicalTemplates.ts:172, 238` | Misleading conduct under Australian Consumer Law & PACFA Code of Ethics. | Replace Medicare Better Access wording with Private Health Funds (Medibank, Bupa), NDIS, and Private Billing. | **S** | **YES** (PACFA / Legal) |
| **OPS-01** | Booking | **HIGH** | `src/components/booking/ValidatedBookingForm.tsx:104, 135` | Patient believes they have an appointment; clinician has no record. Missed care. | Check `if (error)` on Supabase insert. Return user-visible error state on failure. | **S** | **NO** |
| **OPS-02** | DevSecOps | **HIGH** | `next.config.ts` (missing) | Clickjacking, MIME sniffing, and missing HSTS transport security. | Create `next.config.ts` with strict HSTS, CSP, and X-Frame-Options headers. | **S** | **NO** |
| **OPS-03** | SEO / Privacy | **HIGH** | `src/app/robots.ts` (missing) | Search engines index private telehealth rooms, admin console, and client screeners. | Create `src/app/robots.ts` disallowing `/admin`, `/portal`, `/telehealth/`, `/screeners/`. | **S** | **NO** |
| **CLIN-03** | Clinical Safety | **HIGH** | `src/app/telehealth/[roomId]/page.tsx:81` | Patients or third parties access clinician workbench by omitting `?role=client`. | Authenticate clinician workbench via server-side session, not URL query parameter. | **S** | **NO** |
| **A11Y-01** | Accessibility | **MEDIUM** | `src/app/intake/page.tsx:267-330` | Screen reader users cannot identify input fields. WCAG 2.2 Level A failure. | Add `id` to all 17 inputs and matching `htmlFor` to labels. | **S** | **NO** |
| **DEV-01** | Code Quality | **HIGH** | `src/components/admin/ClientChartDossier.tsx:1230-1310` | Production build fails TypeScript compilation during `next build`. | Add optional chaining (`traj.deltas?.depression`) and strict type guards. | **S** | **NO** |

---

## 3. Mandatory Launch Gate (Must-Pass Checklist Before Live Launch)

Real client data must not be accepted until every single item below passes:

1. [ ] **Pass:** Supabase RLS policies rewritten and verified to reject anonymous read/write access.
2. [ ] **Pass:** `handleClinicianBypass` and "Fast-Unlock" button deleted from `/admin`.
3. [ ] **Pass:** Server-side Next.js Middleware (`middleware.ts`) deployed protecting `/admin`.
4. [ ] **Pass:** Marketing webhook (`ANTIGRAVITY_MARKETING_WEBHOOK_URL`) completely removed from all clinical routes.
5. [ ] **Pass:** Telehealth arbitrary client fallback deleted (`src/app/telehealth/[roomId]/page.tsx:191-199`).
6. [ ] **Pass:** Real WebRTC provider (e.g. Daily.co / LiveKit) integrated for video calls.
7. [ ] **Pass:** Server-side scoring and completeness validation deployed for all screeners.
8. [ ] **Pass:** Automated transactional email/SMS service (e.g. Resend/Twilio) configured for crisis flags.
9. [ ] **Pass:** All mentions of "Medicare Better Access" purged from website copy, templates, and GP letters.
10. [ ] **Pass:** GP letter `document.write` replaced with sanitized rendering.
11. [ ] **Pass:** `robots.ts` deployed blocking `/admin`, `/portal`, `/telehealth/`, `/screeners/`.
12. [ ] **Pass:** `next.config.ts` deployed with HSTS, CSP, and X-Frame-Options headers.
13. [ ] **Pass:** Automated unit test suite (`npm test`) implemented for all scoring algorithms in `src/lib/scoring.ts`.
14. [ ] **Pass:** TypeScript compilation (`npm run build`) passes with 0 errors.

---

## 4. Claims Register & Required Copy Changes

| False / Exaggerated Claim in Codebase | Location | Required Correction |
| :--- | :--- | :--- |
| *"Encrypted consultation room initialized (256-bit AES)"* | `src/app/telehealth/[roomId]/page.tsx:97` | Delete claim until genuine end-to-end WebRTC media relay is deployed. |
| *"Cryptographically locked records"* | `supabase/schema.sql:68`, `src/app/admin/page.tsx:1827` | Change to *"Finalized and signed clinical record"*. |
| *"Australian Privacy Principles (APP) Compliant"* | `src/app/telehealth/[roomId]/page.tsx:97`, `src/app/admin/page.tsx:1834` | Remove claim until RLS is locked down and marketing webhooks are purged. |
| *"re-referral under the Better Access / Mental Health Care Plan framework"* | `src/lib/clinicalTemplates.ts:172, 238` | Change to *"ongoing therapy under private billing / private health fund arrangements"*. |
| *"Invoices issued automatically with Australian GST"* | `src/app/portal/page.tsx:327`, `supabase/schema.sql:89` | Remove claim until automated billing integration is operational. |

---

## 5. Remediation Roadmap (In Strict Dependency Order)

```
[ Phase 1: Access Control & Data Security (P0) ]
  ├── 1. Rewrite Supabase schema.sql RLS policies (Lock DB)
  ├── 2. Purge hardcoded fallback anon key in src/lib/supabase.ts
  ├── 3. Deploy Next.js middleware.ts for /admin and /portal
  └── 4. Delete Fast-Unlock and persona switcher backdoors

[ Phase 2: Privacy Act & Regulatory Purge (P0) ]
  ├── 5. Sever ANTIGRAVITY_MARKETING_WEBHOOK_URL from all clinical endpoints
  ├── 6. Purge Medicare Better Access claims across all files
  └── 7. Fix DOM-XSS in GP letter print layout

[ Phase 3: Telehealth & Clinical Safety (P0/P1) ]
  ├── 8. Delete dangerous telehealth appointment fallback (page.tsx:191-199)
  ├── 9. Implement server-side screener completeness validation & scoring
  ├── 10. Deploy transactional email/SMS service for high-severity alerts
  └── 11. Integrate real WebRTC provider (Daily.co / LiveKit)

[ Phase 4: Platform Hardening & Quality (P1/P2) ]
  ├── 12. Deploy next.config.ts with security headers & CSP
  ├── 13. Deploy src/app/robots.ts disallowing private routes
  ├── 14. Fix booking silent failure bug and AEST timezone handling
  ├── 15. Fix TypeScript compilation errors in ClientChartDossier.tsx
  └── 16. Fix 17 intake form labels (htmlFor / id) for WCAG 2.2 AA
```

---

## 6. Build-vs-Buy Strategic Verdict

For a solo-practitioner counselling clinic in Logan, QLD:
- **Build Custom:** Keep the **Marketing Website, Branding, Client Intake, and Psychometric Screener Engine**. These are Luke's core differentiators and represent high clinical value.
- **Buy / Integrate:** Do not attempt to build a custom video conferencing engine, custom billing system, or custom EHR from scratch. Embed a certified telehealth provider (**Daily.co** or **Whereby**) and integrate an established Australian allied-health EHR (**Halaxy** or **Cliniko**) for automated billing, Medicare/Health fund claiming, and appointment booking.

---

## 7. Manual Owner Verification Test Plan

Luke can personally execute these manual checks to verify security:
1. **The RLS Console Test:** Open the browser developer console on any computer, run `supabase.from('mmh_clinical_notes').select('*')`. It must return an error, not patient notes.
2. **The Invalid Room Test:** Open `/telehealth/test-fake-room-id`. It must show a "Room Not Found" error, never another patient's appointment.
3. **The Unanswered Screener Test:** Open a screener, leave question 1 blank, click submit. The form must prevent submission with a red validation error.
4. **The Booking Failure Test:** Turn off Wi-Fi on your device, click "Confirm Booking". The form must show an error alert, never a success screen.

---

## 8. What is Working Well

- **Design System & Aesthetics:** The visual styling, typography, and earthy Australian palette (Cadmium Orange, Deep Navy, Warm Ochre) create an exceptionally warm, trauma-informed atmosphere.
- **Scoring Formulas:** The mathematical implementations in `src/lib/scoring.ts` for DASS-21, PHQ-9, K10, and GAD-7 are accurate and match published clinical literature.
- **Core Stack:** Next.js 16, React 19, Tailwind, and Zod form validation represent modern, performant foundations.
- **Clinician Framing:** Framing Luke as **"Exercise-Integrated Counsellor" (MCouns, UQ; PACFA Reg. #28941)** accurately captures his real expertise without creating regulatory liability.

---

## 9. Coverage and Limits

- **What was reviewed:** 100% of the application source code in `src/`, `supabase/schema.sql`, package dependencies, build outputs, and static assets.
- **What was NOT reviewed:** Supabase and Vercel cloud dashboard settings (database region, serverless function timeouts, SSO providers), external DNS records, and live production database backups.
