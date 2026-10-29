# Phase 0: Inventory, Data-Flow Map, Third-Party Register & Claims Register

**Audited Application:** Mighty Mental Health (Logan, QLD, Australia)  
**Primary Clinician:** Luke Piatti (MCouns, UQ; PACFA Reg. #28941)  
**Audit Date:** 2026-10-29  
**Review Standard:** Australian Privacy Act 1988 (Cth) / Australian Privacy Principles (APPs), PACFA Code of Ethics, RACGP Documentation Standards, WCAG 2.2 AA, OWASP Top 10.

---

## 1. Application Code Inventory

All file paths are relative to repository root. Node modules, `.agent`, `.next`, build artifacts, and scratch scripts are excluded.

| Category | File Path | Lines | Data Touched / Responsibilities |
| :--- | :--- | :--- | :--- |
| **Route (Page)** | `src/app/page.tsx` | 892 | Public landing page, service selection, FAQ accordion, contact form, modal booking trigger. |
| **Route (Page)** | `src/app/admin/page.tsx` | 2,928 | Clinician EHR dashboard. Reads/writes appointments, intakes, forms, assignments, clinical notes, GP letters. Demo seed/purge controls. |
| **Route (Page)** | `src/app/portal/page.tsx` | 642 | Client portal. Displays upcoming sessions, assigned screeners, invoices, guidance engine. |
| **Route (Page)** | `src/app/intake/page.tsx` | 682 | Public 4-step onboarding intake form. Collects identity, GP, emergency contact, medications, somatic profile, presenting concerns, suicidal ideation history. |
| **Route (Page)** | `src/app/contact/page.tsx` | 248 | General contact form and clinic information. |
| **Route (Page)** | `src/app/screeners/[assignmentId]/page.tsx` | 512 | Psychometric screener delivery engine. Renders DASS-21, GAD-7, PHQ-9, K10, etc. Computes scores in-browser, displays crisis numbers, triggers alert API. |
| **Route (Page)** | `src/app/telehealth/[roomId]/page.tsx` | 1,333 | Telehealth consultation room. WebRTC preview, local chat, dual clinician workbench vs patient slide-over screener drawer. |
| **Layout** | `src/app/layout.tsx` | 168 | Root layout, JSON-LD Schema (`MedicalBusiness` / `HealthAndBeautyBusiness`), global footer, metadata. |
| **API Route** | `src/app/api/alerts/clinician/route.ts` | 73 | POST handler for clinical crisis alerts. Calculates risk boolean, attempts forward to external webhook. |
| **API Route** | `src/app/api/webhooks/booking/route.ts` | 59 | POST handler for booking confirmations. Forwards booking details & UTM tags to external webhook. |
| **API Route** | `src/app/api/webhooks/intake/route.ts` | 62 | POST handler for intake submissions. Forwards client intake details & scores to external webhook. |
| **Component** | `src/components/admin/ClientChartDossier.tsx` | 895 | 360° EHR Client Chart & Dossier view. Longitudinal psychometric trajectory delta calculation, active movement & somatic profile module. |
| **Component** | `src/components/booking/ValidatedBookingForm.tsx` | 312 | Client-side booking modal. Direct insert into Supabase `mmh_appointments`. |
| **Component** | `src/components/booking/CalBookingEmbed.tsx` | 64 | Cal.com third-party booking embed wrapper. |
| **Component** | `src/components/forms/TallyFormEmbed.tsx` | 48 | Tally.so third-party form builder embed wrapper. |
| **Component** | `src/components/ui/badge.tsx` | 46 | shadcn badge UI primitive. |
| **Component** | `src/components/ui/button.tsx` | 58 | shadcn button UI primitive. |
| **Component** | `src/components/ui/card.tsx` | 78 | shadcn card UI primitive. |
| **Component** | `src/components/ui/input.tsx` | 28 | shadcn input UI primitive. |
| **Library** | `src/lib/clinicalTemplates.ts` | 258 | SOAP, DAP, First Session, Risk Assessment, GP Letter templates & generation functions. |
| **Library** | `src/lib/scoring.ts` | 412 | Psychometric scoring algorithms for 11 clinical instruments (DASS-21, GAD-7, PHQ-9, K10, PCL-5, ASRS, AIS, BRS, CRAFFT, WSAS, AQ-10). |
| **Library** | `src/lib/supabase.ts` | 6 | Supabase JS client instantiation. |
| **Library** | `src/lib/strapi.ts` | 94 | Strapi headless CMS REST API client. |
| **Library** | `src/lib/types.ts` | 142 | Core TypeScript interfaces (`MMHAppointment`, `MMHClientIntake`, `MMHClinicalNote`, etc.). |
| **Library** | `src/lib/utils.ts` | 8 | `clsx` and `tailwind-merge` utility wrapper. |
| **Database** | `supabase/schema.sql` | 432 | Postgres DDL for 7 tables, RLS policies, index definitions, and instrument seed data. |

---

## 2. Comprehensive Data-Flow Map

| Data Classification | Fields Collected | Entry Point (Where Collected) | Storage Location | Read Access (Current Implementation) | Disclosures / Third-Party / Logging |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Identity & Demographics** | Full name, email, phone number, physical address, date of birth. | `/intake`, `ValidatedBookingForm.tsx`, `/contact` | Supabase `mmh_client_intakes`, `mmh_appointments`. | **Unrestricted Public Read**: Anonymous holder of public Supabase anon key (`SELECT USING (true)` in `schema.sql:144, 153`). | Posted to `ANTIGRAVITY_MARKETING_WEBHOOK_URL` in `src/app/api/webhooks/intake/route.ts:44` and `booking/route.ts:41`. |
| **Emergency Contact Details** | Name, phone, relationship to client. | `/intake` (Step 1) | Supabase `mmh_client_intakes` (`emergency_contact_*`). | **Unrestricted Public Read** via anon key. | None outside Supabase table. |
| **Primary GP & Care Plan** | GP name, medical practice, phone, address, MHTP status. | `/intake` (Step 2) | Supabase `mmh_client_intakes` (`gp_*`). | **Unrestricted Public Read** via anon key. | Rendered into GP Letter preview and print window in `src/app/admin/page.tsx:445`. |
| **Medical & Psychiatric History** | Current medications, medical history, psychiatric history. | `/intake` (Step 2) | Supabase `mmh_client_intakes`. | **Unrestricted Public Read** via anon key. | Injected into First Session SOAP note subjective field in `src/app/admin/page.tsx:663`. |
| **Somatic & Movement Profile** | Weekly exercise frequency, muscular tension zones, sleep architecture, fight/flight triggers, injuries. | `/intake` (Step 3) | Supabase `mmh_client_intakes` (`somatic_movement_profile` JSONB). | **Unrestricted Public Read** via anon key. | Rendered in `/admin` Client Chart and Telehealth workbench. |
| **Safety & Suicide Risk Data** | Historical ideation, intent, past attempts, protective factors, PHQ-9 Item 9 scores. | `/intake` (Step 4), `/screeners/[assignmentId]` | Supabase `mmh_client_intakes`, `mmh_form_assignments` (`answers`, `score_summary`). | **Unrestricted Public Read** via anon key. | Forwarded via client-side `fetch('/api/alerts/clinician')`, which attempts external POST to `ANTIGRAVITY_MARKETING_WEBHOOK_URL`. |
| **Psychometric Screener Answers** | Individual item responses (0-3 or 1-5 scales) across DASS-21, PHQ-9, GAD-7, PCL-5, etc. | `/screeners/[assignmentId]`, `/telehealth/[roomId]` | Supabase `mmh_form_assignments`. | **Unrestricted Public Read & Write** via anon key (`schema.sql:157-159`). | Forwarded in alert payload to marketing webhook endpoint. |
| **Clinician EHR Notes** | Subjective, Objective, Assessment, Plan (SOAP), consultation notes. | `/admin` (Notes Tab), `/telehealth/[roomId]` | Supabase `mmh_clinical_notes`. | **Unrestricted Public Read & Write** via anon key (`schema.sql:162-164`). | Exported via unescaped `window.open` print window in `src/app/admin/page.tsx:442`. |
| **GP Correspondence Letters** | Formal letters to referring medical practitioners regarding treatment progress. | `/admin` (GP Letter Builder) | Supabase `mmh_clinical_notes` (`gp_letter_text`). | **Unrestricted Public Read** via anon key. | Formatted for browser print dialog. |
| **Invoices & Billing Data** | Patient name, email, session amount ($AUD), GST ($0), PACFA item numbers. | Supabase demo seed (`schema.sql:90`) | Supabase `mmh_invoices`. | **Unrestricted Public Read** via anon key (`schema.sql:167`). | Rendered on `/portal`. |
| **Telehealth Media & Chat** | Webcam video/audio stream, in-call chat messages. | `/telehealth/[roomId]` | Local browser memory (`navigator.mediaDevices`), React state (`messages`). | Not stored on server; broadcast only locally to self (prototype). | None. |

---

## 3. Third-Party & Subprocessor Register

| Host / Vendor | Service / SDK | Data Sent | Transmission Mechanism | Geographic Location | Legal Basis / Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Supabase** (`*.supabase.co`) | PostgreSQL Database, GoTrue Auth, PostgREST API | Full database contents (PII, health history, clinical notes, appointments). | Client-side HTTPS REST requests using `createClient` (`src/lib/supabase.ts:6`). | Configured in Supabase dashboard (recommended Sydney `ap-southeast-2`, unverified). | APP 11 / APP 8 cross-border compliance. Anon key is public. |
| **Vercel** (`*.vercel.app`) | Edge/Node Hosting, Serverless API Functions | Request IP, headers, API payloads in transit (`/api/alerts/*`, `/api/webhooks/*`). | HTTP requests, Serverless execution. | US / Global Edge. | Subprocessor agreement required under Privacy Act. |
| **Cal.com** (`cal.com`) | External Booking Embed (`CalBookingEmbed.tsx`) | Client name, email, booking notes (if completed in iframe). | Client-side iframe / embed script. | US (Delaware). | Sensitive health booking metadata sent to overseas vendor without explicit Australian APP 8 disclosure. |
| **Tally.so** (`tally.so`) | External Form Builder Embed (`TallyFormEmbed.tsx`) | Intake answers if user completes form via Tally embed. | Client-side iframe / script. | EU (Belgium). | Secondary form mechanism. |
| **Antigravity Marketing Engine** (Configured via `ANTIGRAVITY_MARKETING_WEBHOOK_URL`) | Transactional / CRM Webhook | Client names, emails, appointment titles, intake health scores, screener severities, UTM tags. | Server-side `fetch` POST from `/api/alerts/clinician`, `/api/webhooks/booking`, `/api/webhooks/intake`. | Destination URL determined by env var (currently unset in `.env.local`). | **CRITICAL APP 6 BREACH**: Health information commingled with marketing attribution infrastructure without consent. |
| **Strapi CMS** (`localhost:1337` / configurable) | Content Management System | None (read-only service catalog fetch). | Server-side / client-side fetch (`src/lib/strapi.ts`). | Local / Self-hosted. | Informational only. |

---

## 4. Trust-Boundary & Threat Model

```
[ UNTRUSTED INTERNET ] 
      │
      ├──────────────────────────────┬──────────────────────────────┐
      ▼                              ▼                              ▼
[ Public Pages ]             [ Client Portal ]              [ Clinician Admin ]
  /, /intake, /screeners        /portal                        /admin
      │                              │                              │
      │ (Public anon key)            │ (Public anon key)            │ (Public anon key)
      ▼                              ▼                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   SUPABASE DATABASE (PostgREST API)                    │
│                                                                        │
│   RLS: USING (true) ON ALL TABLES — NO DATABASE-LEVEL AUTHORIZATION    │
│   Anyone on the internet with the anon key can SELECT, UPDATE, DELETE   │
└────────────────────────────────────────────────────────────────────────┘
      ▲
      │ (Server fetch with client PII + health scores)
┌────────────────────────────────────────────────────────────────────────┐
│                  NEXT.JS API ROUTES (/api/*)                           │
│   - /api/alerts/clinician (Unauthenticated POST)                       │
│   - /api/webhooks/intake  (Unauthenticated POST)                       │
│   - /api/webhooks/booking (Unauthenticated POST)                       │
└────────────────────────────────────────────────────────────────────────┘
      │
      ▼
[ External Marketing Webhook ]
```

### Threat Actors:
1. **Anonymous Internet Attacker:** Possesses the public Supabase URL and anon key (exposed in browser JavaScript). Can read, overwrite, or delete every clinical note, intake, and appointment.
2. **Malicious Client / Impersonator:** Can manipulate query parameters (`?role=clinician` or changing room ID) to access another client's record or view clinician workbench controls.
3. **Abusive Domestic Partner / Stalker:** Can enter victim's email into `/portal` switcher to view their consultation dates, screener completion status, and invoices.
4. **Automated Spammer / Bot:** Can spam `/api/alerts/clinician` to trigger false crisis alarms or flood clinician communications.

---

## 5. Claims Register (User-Facing & Code-Level Claims)

| Claim | Location in Code / UI | Verification Status | Proof / Evidence from Codebase |
| :--- | :--- | :--- | :--- |
| **"Encrypted consultation room initialized (256-bit AES)"** | `src/app/telehealth/[roomId]/page.tsx:97` | **FALSE** | The telehealth room uses local `navigator.mediaDevices.getUserMedia` attached to a single `<video>` element (`page.tsx:148`). No WebRTC peer connection, DTLS-SRTP, or AES-256 media relay is established. |
| **"Cryptographic Locking" / "Cryptographically sealed"** | `supabase/schema.sql:68`, `src/app/admin/page.tsx:1827` | **FALSE** | The note "lock" is a plain boolean column (`is_locked BOOLEAN DEFAULT false`, `schema.sql:79`). There is no cryptographic signature, hash chain, or database trigger preventing update/deletion. |
| **"Australian Privacy Principles (APP) Compliant"** | `src/app/telehealth/[roomId]/page.tsx:97`, `src/app/admin/page.tsx:1834` | **FALSE** | Database is completely world-readable (`schema.sql:144, 162`). Clinical health data is dispatched to marketing webhooks (`/api/webhooks/intake/route.ts:44`). Violates APP 6 and APP 11. |
| **"Medicare Better Access / MHTP Re-referral"** | `src/lib/clinicalTemplates.ts:172, 238` | **FALSE / ILLEGAL CLAIM** | Counsellors (PACFA Reg.) are not eligible providers under the Medicare Benefits Schedule (MBS Items 80000–80175). Medicare Better Access is legally limited to Psychologists, AMHSWs, and OTs. PACFA counsellors can only provide private health fund rebates (Medibank, Bupa, etc.). |
| **"Invoices issued automatically"** | `src/app/portal/page.tsx:327`, `supabase/schema.sql:89` | **FALSE** | No automated invoicing system, Stripe integration, or background cron job exists. Invoices exist only as static demo seed rows in `handleSeedDemoData`. |
| **"Luke Piatti (MCouns, UQ; PACFA Reg. #28941) • Exercise-Integrated Counsellor"** | `src/app/layout.tsx:18`, `src/lib/clinicalTemplates.ts:25` | **TRUE** | Matches Luke Piatti's genuine academic qualification (Master of Counselling, University of Queensland) and clinical PACFA registration #28941 without unheld personal trainer credentials. |
| **"Validated Scoring Algorithms (DASS-21, GAD-7, PHQ-9, K10)"** | `src/lib/scoring.ts:1-200` | **TRUE** | Mathematical formulas, subscale bucketing, and published normative severity cutoffs accurately match published literature. |

---

*Phase 0 is complete. Proceeding to Phase 1 (Specific Area Audits).*
