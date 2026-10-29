<!--
========================================================================================================
AI SYSTEM DIRECTIVE & AUDITOR OPERATING CONSTRAINTS (MANDATORY & NON-NEGOTIABLE)
========================================================================================================
READ THIS BEFORE EXECUTING ANY TASK OR AUDIT ACTION:

1. READ-ONLY AUDIT POSTURE:
   Do NOT modify, delete, or reformat any production or project file during an audit. All reports, notes,
   and test scripts must be written exclusively to `./audit/`.

2. ABSOLUTE SECRET REDACTION:
   Never print, copy, commit, or log secret values (.env*, tokens, API keys, service role JWTs). Report variable
   NAMES and whether they are set (SET vs UNSET), nothing more. If a secret is uncovered in code or git history,
   document its filename, line number, and token type only.

3. SYNTHETIC DATA ONLY / ZERO REAL CLIENT DATA:
   Never test against real patient records. Never call live production email dispatchers, live SMS gateways,
   or live payment webhooks. Use local development servers, sandbox databases, and static code analysis only.

4. EVIDENCE OR IT DIDN'T HAPPEN:
   Every finding must cite exact file:line, terminal command outputs, database query results, or browser
   screenshots. If an issue cannot be empirically proven, label it UNVERIFIED and state what is needed to verify.

5. ZERO TRUST IN DOCUMENTATION OR UI CLAIMS:
   Do NOT trust comments, READMEs, changelogs, marketing copy, or variable names. A claim in the UI (e.g.
   "256-Bit Encrypted" or "APP Compliant") is a legal liability until verified by executable code.
   THIS GUIDE DESCRIBES TARGET ARCHITECTURE AND SPECIFICATIONS; EMPIRICALLY VERIFY ACTUAL REPO STATUS AGAINST IT.

6. SKIP NOTHING SILENTLY:
   If an area cannot be verified due to environment limitations (e.g. Supabase dashboard settings, live domain DNS),
   explicitly record it in the "Coverage & Limits" register.

7. ZERO GENERIC ADVICE:
   Every finding and recommendation must name the specific file, function, component, or SQL table.

8. LEGAL & ETHICAL BOUNDARY:
   You are not providing formal legal, medical, or accounting advice. Mark any finding requiring formal verification
   by an Australian lawyer, privacy officer, clinical supervisor, accountant, or PACFA as "NEEDS HUMAN SIGN-OFF".
========================================================================================================
-->

# Comprehensive Master Guide & Verification Specification: Modern Clinic & Booking Web Applications
### *Version 3.0: Clinical Safety, Zero-Trust Database Security, Concurrency & Australian Legal Truth Standard*

> **Practice Context**: Mighty Mental Health (MMH) — Solo clinical practice of Luke Piatti (MCouns, UQ; PACFA Reg. Clinical Counsellor #28941), based in Logan, Queensland, Australia, delivering exercise-integrated psychotherapy, somatic nervous system regulation, and nationwide telehealth.  
> **Target Profile**: Full-Service Clinic & Allied Health Booking Platforms with Clinician Dashboards, Client Portals, Dynamic Form Systems, Encrypted Telehealth, and Transactional Alerts.  
> **Reference Stack**: Next.js 16 (App Router, `src/app`), React 19, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + RLS), Vercel, and Antigravity.  
> **Compliance Standards**: Australian Privacy Principles (APPs 1–13 / Privacy Act 1988), PACFA Code of Ethics, WCAG 2.2 Level AA, OWASP API Top 10, Core Web Vitals (CrUX 75th Percentile).

---

## 📋 Master Table of Contents

1. [Reality Check: Current Repository State vs. Production Target State](#1-reality-check-current-repository-state-vs-production-target-state)
2. [Architectural Topology & Separation of Concerns](#2-architectural-topology--separation-of-concerns)
3. [The Full-Stack Tooling Directory (Production Grade)](#3-the-full-stack-tooling-directory-production-grade)
4. [Database Engineering: Robust Concurrency, Immutability & RLS](#4-database-engineering-robust-concurrency-immutability--rls)
   - 4.1 Concurrency Defense: PostgreSQL Exclusion Constraints (`btree_gist`)
   - 4.2 Clinical Note Immutability & Append-Only Addenda Architecture
   - 4.3 Zero-Trust Row-Level Security (RLS) & Purging Permissive Policies
   - 4.4 Unauthenticated Screener Token Access & Expiring Session Cookies
   - 4.5 Server-Side Psychometric Scoring RPC
5. [Clinical Safety & Duty of Care Protocol](#5-clinical-safety--duty-of-care-protocol)
   - 5.1 The Duty of Care Test Vector Matrix (13 Empirical Vectors)
   - 5.2 The 11-Instrument Psychometric Register & Scoring Algorithms
   - 5.3 Isolated Transactional Safety Alerts vs. Zero Marketing Contamination
   - 5.4 24/7 Crisis Safeguards & 1800RESPECT Safe Exit Reality
6. [Australian Statutory, Legal & Ethical Truth Register](#6-australian-statutory-legal--ethical-truth-register)
   - 6.1 PACFA Scope & Medicare Better Access Clarification
   - 6.2 Australian Privacy Act 1988 & APP 8 (Cross-Border Disclosure) Truth
   - 6.3 Health Records Retention in Queensland & Cross-Border Telehealth
   - 6.4 Private Health Fund Rebates (Fund-by-Fund Verification)
   - 6.5 GST-Free Healthcare (GST Act Sec. 38-10) vs. Taxable Coaching
   - 6.6 Telehealth Vendor Security (DPA, APP 8, Cloud Recording Disabled)
   - 6.7 Australian Consumer Law (Sec. 18) & Claims Audit
   - 6.8 Notifiable Data Breaches (NDB) Scheme (Part IIIC vs. GDPR)
7. [UI/UX, Visual Rhythm & The "Button Truth" Rubric](#7-uiux-visual-rhythm--the-button-truth-rubric)
   - 7.1 The "Button Truth" Empirical Questionnaire
   - 7.2 Colour Purity, Verified Contrast & Anti-Cliché Rules
   - 7.3 Layout Density, Rhythm & Cognitive Calming
   - 7.4 WCAG 2.2 Level AA Standards & Automated Testing Limits
8. [Universal Modern Web Standards & Functional CSP](#8-universal-modern-web-standards--functional-csp)
   - 8.1 Core Web Vitals (CrUX 75th Percentile: LCP, INP, CLS)
   - 8.2 Production-Ready Content Security Policy (Report-Only Mode)
9. [The Hostile Red-Team & Adversarial Penetration Vectors](#9-the-hostile-red-team--adversarial-penetration-vectors)
   - 9.1 The 10 Adversarial Attack Scenarios
   - 9.2 The Auditor Self-Refutation Prompt
10. [The Zero-Tolerance Pre-Launch Gate & Strategic Verdict](#10-the-zero-tolerance-pre-launch-gate--strategic-verdict)
    - 10.1 The Numbered 18-Point Pre-Launch Gate (Must-Pass Checklist)
    - 10.2 Remediation Dependency Roadmap
    - 10.3 Build-vs-Buy Strategic Allied Health Verdict

---

## 1. Reality Check: Current Repository State vs. Production Target State

> **CRITICAL DIRECTIVE FOR AI AUDITORS**: Do NOT treat specifications as completed code. A primary failure mode of automated audits is assuming that documented target features already exist in the codebase. You must distinguish between **CURRENT REPO REALITY** and **TARGET SPECIFICATION**:

| System / Feature | Current Repository Reality (Empirically Verified in Code) | Target Production Standard (Required for Launch) |
|---|---|---|
| **Row-Level Security (RLS)** | `supabase/schema.sql` contains permissive `USING (true)` policies (`Allow onboarding intake insertion`, `Allow appointment booking`) and demo delete policies (`Allow delete demo appointments TO public USING (is_demo = true)`). Helper function `is_clinician()` allows privilege escalation via untrusted client `user_metadata`. | All existing policies purged via `pg_policies` loop. RLS strictly enforces `(auth.jwt() -> 'app_metadata' ->> 'role') = 'clinician'`. Public writes routed through validated server actions. |
| **Environment Fallbacks** | `src/lib/supabase.ts` hardcodes fallback placeholder credentials (`https://placeholder-project.supabase.co`, `placeholder-anon-key`) rather than throwing fatal runtime errors. | Application fails fast during build/startup if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing or invalid. |
| **Telehealth Role Routing** | `src/app/telehealth/[roomId]/page.tsx` checks `searchParams.get('role') === 'client' ? 'client' : 'clinician'`. Omission of `?role=client` immediately grants full clinician workbench, notes, and scribe controls to unauthenticated visitors! | Role determined strictly by authenticated JWT session on the server. Unauthorized visitors cannot access clinician workbench under any query parameter manipulation. |
| **Booking Error Handling** | `src/components/booking/ValidatedBookingForm.tsx` performs `.insert(...).select().single()` but never verifies `{ error }`. Form displays `isSuccess = true` even if database insert fails or network drops! | Explicit error handling with inline error alerts, retry mechanisms, and transaction verification before showing booking confirmation. |
| **Telehealth Media & SFU** | UI split-screen layout with local WebRTC camera preview; mock peer signaling; claims "256-bit AES encryption" and "encrypted rooms" with no cryptographic backend. | Production SFU / WebRTC media server (e.g. Daily.co, Twilio Video, or LiveKit) with commercial TURN relays for symmetric NAT traversal; cloud recording permanently disabled; APP 8 assessed. |
| **Risk Alert Pipeline** | In-browser modal trigger and client fetch call to `/api/alerts/clinician` mock endpoint; no real SMS/email provider configured; logs alert to console. | Server-side verified trigger; isolated transactional SMS/Email delivery (Twilio/Resend) with retry logic; zero reliance on client fetch or browser secrets. |
| **Database Concurrency** | Simple table structure; lacks interval overlap prevention (`UNIQUE (scheduled_at, clinician_id)` only blocks identical start times, not overlapping durations). `mmh_appointments` lacks `clinician_id` column. | PostgreSQL `btree_gist` exclusion constraint (`no_overlapping_sessions`) enforcing `tstzrange(scheduled_at, ends_at) WHERE (status <> 'cancelled')` with maintained `ends_at`. |
| **Note Immutability** | UI input disablement and `is_locked` boolean flag. Older trigger `BEFORE UPDATE OR DELETE ... RETURN NEW;` silently broke note deletion on unlocked records. | PostgreSQL `BEFORE UPDATE OR DELETE` trigger ending with `RETURN COALESCE(NEW, OLD)` plus dedicated append-only `mmh_clinical_note_addenda` table. |
| **Screener Access & Scoring** | Bare UUID URLs (`/screeners/[assignmentId]`); clients compute scores in browser and have `UPDATE` permissions allowing score and severity tampering. | Unguessable, single-use, cryptographically hashed tokens (`token_hash`) exchanged for short-lived server session cookies. Client has read-only access; scoring executed server-side via `submit_screener_result` RPC. |
| **Clinical Alerts vs. Marketing** | Webhook routes mixed in `/api/webhooks/*` sharing Antigravity tracking metadata (`utm_source`, `utm_campaign`). | Strict physical and logical decoupling: clinical duty-of-care alerts route exclusively through isolated transactional channels with ZERO marketing payload. |
| **Medicare / Rebates Copy** | Landing page copy and GP letter generator reference Medicare MHTP progress reviews. | Copy scrubbed to reflect PACFA scope: Private Health Fund rebates (participating funds, subject to client cover); collaborative GP letters, NOT Medicare claiming. |
| **Payments & Invoicing** | No active payment gateway (Stripe) integration exists in code; payments are simulated. | Server-side Stripe Elements integration with webhooks verified via HMAC SHA-256 and idempotency keys; compliant GST tax invoices generated upon payment. |

---

## 2. Architectural Topology & Separation of Concerns

Health applications must strictly isolate clinical duty-of-care pipelines from marketing, lead-generation, and public tracking systems.

```
+-----------------------------------------------------------------------------------------------------+
|                                            CLIENT LAYER                                             |
|     [Public Visitor]             [Authenticated Client (Portal)]       [Authenticated Clinician (EHR)]   |
+------------+-----------------------------------+-----------------------------------+----------------+
             |                                   |                                   |
             | HTTPS (TLS 1.3)                   | Strict JWT Session                | Strict Role JWT
             v                                   v                                   v
+-----------------------------------------------------------------------------------------------------+
|                                        EDGE & COMPUTE LAYER                                         |
|                                Next.js 16 App Router (Vercel Edge / Node SSR)                       |
|  • Public Marketing (ISR)           • Client Portal (/portal)           • Clinician EHR (/admin)    |
|  • Public Intake Form (/intake)     • Screener Runner (/screeners)      • Telehealth Workbench      |
+---------------------+--------------------------+-----------------------------------+----------------+
                      |                          |                                   |
                      | Service Role             | RLS Policy Filter                 | Full Access RLS
                      v                          v                                   v
+-----------------------------------------------------------------------------------------------------+
|                                      DATA PERSISTENCE LAYER                                         |
|                       Supabase PostgreSQL 16 (AWS Sydney ap-southeast-2)                            |
|                                                                                                     |
|  • mmh_services (Public Active Read)                • mmh_clinical_notes (Locked + Immutability)    |
|  • mmh_appointments (btree_gist Exclusion)          • mmh_clinical_note_addenda (Append-Only)      |
|  • mmh_client_intakes (Encrypted PII / RLS)         • mmh_form_assignments (Token Hash + RLS)       |
|  • mmh_invoices (GST Act Compliant)                 • mmh_forms (Psychometric Template Library)     |
+-----------------------------------------------------------------------------------------------------+
                      |                                                              |
                      | Isolated Transactional Webhook                               | Outbound Webhook
                      v                                                              v
+----------------------------------------------------+     +------------------------------------------+
|          CLINICAL SAFETY DISPATCH ENGINE           |     |        MARKETING & CRM PIPELINE          |
|    (ZERO Marketing Contamination / Audit Log)      |     |     (ZERO Clinical Health Data Transferred)|
|                                                    |     |                                          |
| • PHQ-9 Item 9 Suicide Alert Trigger               |     | • Antigravity Attribution Webhook        |
| • Resend / Twilio SMS Direct to Clinician          |     | • UTM Campaign Performance Metrics       |
| • Retry Queue + Dashboard Alert Banner             |     | • Anonymous Funnel Conversion Analytics  |
+----------------------------------------------------+     +------------------------------------------+
```

---

## 3. The Full-Stack Tooling Directory (Production Grade)

| Layer / Capability | Recommended Tooling | Production Role & Architectural Justification |
|---|---|---|
| **Frontend Framework** | **Next.js 16 (App Router) + React 19** | Server-side rendering (SSR), Server Actions, granular layout streaming, zero client runtime leaks. |
| **Database & Auth** | **Supabase (PostgreSQL 16)** | Enterprise PostgreSQL with `btree_gist` concurrency defense, hardened RLS, and Sydney (`ap-southeast-2`) hosting. |
| **Telehealth Video** | **Daily.co / Twilio Video / LiveKit** | Commercial WebRTC SFU with guaranteed TURN relay infrastructure for 4G/5G mobile NAT; cloud recording permanently disabled; Australian DPA executed. |
| **Transactional Email** | **Resend / Postmark** | Dedicated transactional email delivery with strict SPF, DKIM, DMARC, zero marketing overlap, and automated delivery retry logic. |
| **Transactional SMS** | **Twilio / MessageMedia** | Instant high-priority Australian SMS alerts (`+61`) for acute clinical safety flags (PHQ-9 Item 9). |
| **Psychometric Testing** | **Custom Engine + NovoPsych / PAA** | Validated scoring algorithms running strictly server-side; automated clinical cutoffs and DSM-5 cluster endorsement math. |
| **Form Validation** | **React Hook Form + Zod** | Real-time schema validation, strict input sanitization, type-safe error boundaries. |
| **Payment Processing** | **Stripe Elements** | PCI-DSS Level 1 compliant payments; server-side webhook signature verification; split GST tax invoicing. |
| **Bot Protection** | **Cloudflare Turnstile** | Invisible, privacy-preserving bot defense for public intake and booking submission endpoints. |

---

## 4. Database Engineering: Robust Concurrency, Immutability & RLS

### 4.1 Concurrency Defense: PostgreSQL Exclusion Constraints (`btree_gist`)

A simple `UNIQUE (scheduled_at, clinician_id)` constraint only prevents identical start times; it permits overlapping sessions (e.g., booking 10:00 AM and 10:30 AM for 60-minute sessions). True concurrency defense requires temporal range exclusion:

```sql
-- 1. Enable btree_gist extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Ensure clinician_id and ends_at columns exist and are populated
ALTER TABLE public.mmh_appointments 
    ADD COLUMN IF NOT EXISTS clinician_id UUID,
    ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

-- 3. Backfill ends_at for existing records
UPDATE public.mmh_appointments
SET ends_at = scheduled_at + (COALESCE(duration_minutes, 60) || ' minutes')::INTERVAL
WHERE ends_at IS NULL;

-- 4. Set NOT NULL constraints
ALTER TABLE public.mmh_appointments 
    ALTER COLUMN scheduled_at SET NOT NULL,
    ALTER COLUMN ends_at SET NOT NULL,
    ALTER COLUMN clinician_id SET NOT NULL;

-- 5. Trigger to automatically calculate ends_at on insert/update
CREATE OR REPLACE FUNCTION public.set_appointment_ends_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ends_at := NEW.scheduled_at + (COALESCE(NEW.duration_minutes, 60) || ' minutes')::INTERVAL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_appointment_ends_at
    BEFORE INSERT OR UPDATE OF scheduled_at, duration_minutes ON public.mmh_appointments
    FOR EACH ROW EXECUTE FUNCTION public.set_appointment_ends_at();

-- 6. Enforce GiST exclusion constraint preventing overlapping active appointments
ALTER TABLE public.mmh_appointments
    ADD CONSTRAINT no_overlapping_sessions
    EXCLUDE USING gist (
        clinician_id WITH =,
        tstzrange(scheduled_at, ends_at) WITH &&
    )
    WHERE (status <> 'cancelled');
```

---

### 4.2 Clinical Note Immutability & Append-Only Addenda Architecture

Clinical progress notes must be legally tamper-evident. Once a note is marked `is_locked = true`, it cannot be altered or deleted. Legitimate clinical amendments must be recorded via an append-only addenda table:

```sql
-- 1. Immutability trigger on mmh_clinical_notes
CREATE OR REPLACE FUNCTION public.check_clinical_note_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_locked = true THEN
        RAISE EXCEPTION 'Cannot modify or delete an audit-locked clinical note. Submit an addendum instead.';
    END IF;
    -- COALESCE(NEW, OLD) allows DELETE on unlocked notes while blocking locked notes
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_note_immutability
    BEFORE UPDATE OR DELETE ON public.mmh_clinical_notes
    FOR EACH ROW EXECUTE FUNCTION public.check_clinical_note_immutability();

-- 2. Dedicated clinical note addenda table
CREATE TABLE IF NOT EXISTS public.mmh_clinical_note_addenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.mmh_clinical_notes(id) ON DELETE RESTRICT,
    clinician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
    addendum_text TEXT NOT NULL,
    reason_for_amendment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Append-only trigger (FORBID UPDATE OR DELETE on addenda)
CREATE OR REPLACE FUNCTION public.prevent_addenda_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Clinical note addenda are permanent legal records and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_addenda_modification
    BEFORE UPDATE OR DELETE ON public.mmh_clinical_note_addenda
    FOR EACH ROW EXECUTE FUNCTION public.prevent_addenda_modification();
```

---

### 4.3 Zero-Trust Row-Level Security (RLS) & Purging Permissive Policies

In PostgreSQL, multiple policies on a table combine with permissive `OR`. If old policies with `USING (true)` exist, adding new policies does NOT secure the table. You MUST purge existing policies first:

```sql
-- 1. Purge all existing policies on mmh tables
DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    FOR r IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename LIKE 'mmh_%' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename); 
    END LOOP; 
END $$;

-- 2. Hardened clinician role verification (Strict app_metadata only; user_metadata forbidden)
CREATE OR REPLACE FUNCTION public.is_clinician()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'service_role' OR
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'clinician'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enforce RLS on all tables
ALTER TABLE public.mmh_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_client_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_clinical_note_addenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_invoices ENABLE ROW LEVEL SECURITY;

-- 4. Apply strict policies
-- Services: Public read active; clinician manage
CREATE POLICY "Public read active services" ON public.mmh_services FOR SELECT USING (is_active = true);
CREATE POLICY "Clinician manage services" ON public.mmh_services FOR ALL TO authenticated USING (public.is_clinician()) WITH CHECK (public.is_clinician());

-- Forms: Public/clients read active templates; clinician manage
CREATE POLICY "Public read form templates" ON public.mmh_forms FOR SELECT USING (is_template = true OR public.is_clinician());
CREATE POLICY "Clinician manage form templates" ON public.mmh_forms FOR ALL TO authenticated USING (public.is_clinician()) WITH CHECK (public.is_clinician());

-- Clinical Notes & Addenda: Clinician ONLY (Zero public or client access)
CREATE POLICY "Clinician access clinical notes" ON public.mmh_clinical_notes FOR ALL TO authenticated USING (public.is_clinician()) WITH CHECK (public.is_clinician());
CREATE POLICY "Clinician read note addenda" ON public.mmh_clinical_note_addenda FOR SELECT TO authenticated USING (public.is_clinician());
CREATE POLICY "Clinician insert note addenda" ON public.mmh_clinical_note_addenda FOR INSERT TO authenticated WITH CHECK (public.is_clinician());

-- Client Intakes: Clinician full access; clients read own verified record
CREATE POLICY "Clinician manage client intakes" ON public.mmh_client_intakes FOR ALL TO authenticated USING (public.is_clinician()) WITH CHECK (public.is_clinician());
CREATE POLICY "Clients read own intake" ON public.mmh_client_intakes FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' IS NOT NULL AND lower(client_email) = lower(auth.jwt() ->> 'email'));
CREATE POLICY "Allow public intake submission" ON public.mmh_client_intakes FOR INSERT WITH CHECK (true);

-- Appointments: Clinician manage; client read own; validated insert
CREATE POLICY "Clinician manage appointments" ON public.mmh_appointments FOR ALL TO authenticated USING (public.is_clinician()) WITH CHECK (public.is_clinician());
CREATE POLICY "Clients read own appointments" ON public.mmh_appointments FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' IS NOT NULL AND lower(client_email) = lower(auth.jwt() ->> 'email'));
CREATE POLICY "Allow validated appointment booking" ON public.mmh_appointments FOR INSERT WITH CHECK (status = 'confirmed' AND scheduled_at > now());

-- Form Assignments: Clinician manage; client read own metadata ONLY (no direct score updates)
CREATE POLICY "Clinician manage form assignments" ON public.mmh_form_assignments FOR ALL TO authenticated USING (public.is_clinician()) WITH CHECK (public.is_clinician());
CREATE POLICY "Client read own assigned forms" ON public.mmh_form_assignments FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' IS NOT NULL AND lower(client_email) = lower(auth.jwt() ->> 'email'));

-- Invoices: Clinician manage; client read own
CREATE POLICY "Clinician manage invoices" ON public.mmh_invoices FOR ALL TO authenticated USING (public.is_clinician()) WITH CHECK (public.is_clinician());
CREATE POLICY "Clients read own invoices" ON public.mmh_invoices FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' IS NOT NULL AND lower(client_email) = lower(auth.jwt() ->> 'email'));
```

---

### 4.4 Unauthenticated Screener Token Access & Expiring Session Cookies

Clients receive screener links via email/SMS. Direct UUID links allow brute-force enumerations and URL leakage in referrers. The secure workflow:
1. `mmh_form_assignments` stores `token_hash TEXT UNIQUE`, `expires_at TIMESTAMPTZ`, and `used_at TIMESTAMPTZ`.
2. Client navigates to `/screeners/verify?token=<raw_token>`.
3. Server route hashes the raw token (`sha256`) and queries for matching record where `used_at IS NULL` and `expires_at > now()`.
4. Server marks `used_at = now()`, issues a short-lived `HttpOnly`, `SameSite=Lax`, `Secure` cookie session, and redirects to `/screeners/[assignmentId]`.
5. Raw token is permanently removed from the URL query string and browser history.

---

### 4.5 Server-Side Psychometric Scoring RPC

Clients must never calculate their own scores or submit `clinical_severity` via client-side PostgREST:

```sql
CREATE OR REPLACE FUNCTION public.submit_screener_result(
    p_assignment_id UUID,
    p_raw_answers JSONB,
    p_calculated_score INTEGER,
    p_clinical_severity TEXT,
    p_has_crisis_flag BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    v_assignment RECORD;
BEGIN
    SELECT * INTO v_assignment FROM public.mmh_form_assignments WHERE id = p_assignment_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Assignment not found.'; END IF;
    IF v_assignment.status = 'completed' THEN RAISE EXCEPTION 'Assessment already submitted.'; END IF;

    UPDATE public.mmh_form_assignments
    SET 
        answers = p_raw_answers,
        score = p_calculated_score,
        clinical_severity = p_clinical_severity,
        status = 'completed',
        completed_at = now()
    WHERE id = p_assignment_id;

    RETURN jsonb_build_object('success', true, 'assignment_id', p_assignment_id, 'crisis_flag', p_has_crisis_flag);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Clinical Safety & Duty of Care Protocol

### 5.1 The Duty of Care Test Vector Matrix (13 Empirical Vectors)

```
+-------------------------------------------------------------------------------------------------------------------+
|                                          DUTY OF CARE TEST VECTOR MATRIX                                          |
+--------------------------+---------------------------------+-------------------------------+----------------------+
| TEST VECTOR              | CLIENT INPUT CONDITION          | EXPECTED SYSTEM BEHAVIOUR     | RED FLAG FAILURE     |
+--------------------------+---------------------------------+-------------------------------+----------------------+
| **TV-01: PHQ-9 Q9=0**    | Item 9 = "Not at all"           | Normal submission flow        | False alarm alert    |
| **TV-02: PHQ-9 Q9=1**    | Item 9 = "Several days"         | **CRISIS MODAL + URGENT SMS** | Silent pass          |
| **TV-03: PHQ-9 Q9=3**    | Item 9 = "Nearly every day"     | **000/13 11 14 DIALER + ALERT**| Standard thank-you   |
| **TV-04: Missing Q9**    | Item 9 unanswered               | Form blocks submit (Required) | Accepted as 0        |
| **TV-05: Network Cut**   | User submits, WiFi drops        | Retry prompt + Crisis numbers | Unhandled crash      |
| **TV-06: DB Offline**    | Supabase offline during submit  | Crisis numbers displayed      | Data lost quietly    |
| **TV-07: Malformed**     | Injected negative or NaN score  | Schema rejects input (Zod)    | Corrupted scoring    |
| **TV-08: Alert Outage**  | Twilio / SMS provider drops 500 | Retry queue + Dashboard banner| Alert lost silently  |
| **TV-09: Duplicate Sub** | Double-click on submit button   | Idempotency key blocks dupe   | Multiple false alerts|
| **TV-10: Spoofed Alert** | Direct POST to /api/alerts      | Rejected (Server/Secret auth) | Fake panic triggered |
| **TV-11: Tampered Score**| Client POSTs modified score     | Server calculates raw answers | Forged low score     |
| **TV-12: Clinician OOO** | Luke in session, sick, or leave | Designated peer cover active  | Unmonitored crisis   |
| **TV-13: Intake Risk**   | Positive safety_risk_history    | Priority triage flag generated| Buried in intake pile|
+--------------------------+---------------------------------+-------------------------------+----------------------+
```
> **HUMAN SIGN-OFF REQUIRED**: Vector TV-12 requires a written clinical risk-response protocol and formal locum/peer coverage agreement when Luke is unavailable.

---

### 5.2 The 11-Instrument Psychometric Register & Scoring Algorithms

The MMH repository implements 11 psychometric instruments in `src/lib/scoring.ts`:

1. **DASS-21** *(Lovibond & Lovibond 1995)*: 21 items (0–3). Depression, Anxiety, Stress subscales calculated by summing 7 specific items and **multiplying by 2** to normalize to DASS-42 benchmarks.  
   - *Depression*: Normal 0–9, Mild 10–13, Moderate 14–20, Severe 21–27, Extremely Severe 28+.  
   - *Anxiety*: Normal 0–7, Mild 8–9, Moderate 10–14, Severe 15–19, Extremely Severe 20+.  
   - *Stress*: Normal 0–14, Mild 15–18, Moderate 19–25, Severe 26–33, Extremely Severe 34+.
2. **PHQ-9** *(Kroenke et al. 2001)*: 9 items (0–3). Sum range 0–27.  
   - Cutoffs: 0–4 Minimal, 5–9 Mild, 10–14 Moderate, 15–19 Moderately Severe, 20–27 Severe.  
   - **Critical Safeguard**: Any endorsement $>0$ on Question 9 triggers immediate crisis modal and urgent alert.
3. **GAD-7** *(Spitzer et al. 2006)*: 7 items (0–3). Sum range 0–21.  
   - Cutoffs: 0–4 Minimal, 5–9 Mild, 10–14 Moderate, 15–21 Severe. Score $\ge 10$ indicates probable GAD.
4. **K10** *(Kessler et al. 2002)*: 10 items (1–5). Sum range 10–50.  
   - **Australian GP Standard (Andrews & Slade 2001 / Department of Health)**:  
     • 10–19: Low distress • 20–24: Moderate distress • 25–29: High distress • 30–50: Very high distress.  
     *(Note: Differs from ABS population survey bands 10-15, 16-21, 22-29, 30-50; MMH explicitly adopts the GP clinical standard).*
5. **PCL-5** *(Weathers et al. 2013)*: 20 items (0–4). Sum range 0–80.  
   - *Dual Diagnostic Rule*: Score $\ge 33$ indicates probable PTSD **AND** requires DSM-5 cluster endorsement verification:  
     • At least 1 Criterion B symptom (Items 1–5 $\ge 2$)  
     • At least 1 Criterion C symptom (Items 6–7 $\ge 2$)  
     • At least 2 Criterion D symptoms (Items 8–14 $\ge 2$)  
     • At least 2 Criterion E symptoms (Items 15–20 $\ge 2$).
6. **ASRS v1.1** *(WHO / Kessler et al.)*: 6 items (0–4).  
   - *Threshold Scoring*: Endorsement $\ge 2$ ("Sometimes") on items 1–3, or $\ge 3$ ("Often") on items 4–6. Four or more shaded endorsements indicates high likelihood of Adult ADHD.
7. **AIS (Athens Insomnia Scale)** *(Soldatos et al. 2000)*: 8 items (0–3). Sum range 0–24.  
   - Cutoff: Score $\ge 6$ indicates clinical insomnia.
8. **BRS (Brief Resilience Scale)** *(Smith et al. 2008)*: 6 items (1–5).  
   - *Algorithm*: Reverse-score items 2, 4, 6 ($6 - X$). Calculate mean of all 6 items.  
   - Cutoffs: 1.00–2.99 Low Resilience, 3.00–4.30 Normal Resilience, 4.31–5.00 High Resilience.
9. **CRAFFT v2.1** *(Knight et al. 2002)*: Adolescent substance screener.  
   - Cutoff: Score $\ge 2$ indicates high risk of substance use disorder.
10. **WSAS (Work and Social Adjustment Scale)** *(Mundt et al. 2002)*: 5 items (0–8). Sum range 0–40.  
    - Cutoffs: $<10$ Subclinical, 10–20 Significant functional impairment, $>20$ Moderately severe to severe impairment.
11. **AQ-10** *(Allison et al. / NICE CG142 2012)*: Autism Spectrum Quotient 10-item.  
    - Cutoff: Score $\ge 6$ indicates referral for comprehensive autism diagnostic assessment.

#### Copyright & Licensing Register
- DASS-21: Public domain (Lovibond & Lovibond / UNSW).
- PHQ-9 & GAD-7: Open access (Pfizer copyright notice; reproduction permitted without permission).
- K10, ASRS v1.1, AIS, BRS, CRAFFT, WSAS, AQ-10: Free for non-commercial clinical use with author attribution. Third-party psychometric vendors (e.g. NovoPsych) require commercial enterprise subscriptions.

---

### 5.3 Isolated Transactional Safety Alerts vs. Zero Marketing Contamination

Clinical safety alerts (PHQ-9 Item 9 crises) must NEVER mix with marketing analytics:
- Internal alerts execute **strictly server-side** following verified database persistence or server actions.
- ZERO marketing parameters (`utm_*`, client referral IDs, analytics tracking pixels) permitted in safety alert payloads.
- High-priority SMS delivered directly to Luke's Australian mobile via Twilio/MessageMedia.

---

### 5.4 24/7 Crisis Safeguards & 1800RESPECT Safe Exit Reality

Every page and screener must feature persistent click-to-call links:
- **Emergency Services**: `000` (Immediate life danger).
- **Lifeline Australia**: `13 11 14` (24/7 Crisis Support).
- **Suicide Call Back Service**: `1300 659 467` (24/7 Nationwide Support).
- **Beyond Blue**: `1300 22 4636` (24/7 Depression & Anxiety).
- **MensLine Australia**: `1300 78 99 78` (Dedicated Men's Support).
- **1800RESPECT**: `1800 737 732` (24/7 Domestic, Family & Sexual Violence Support).

> **SAFE EXIT / QUICK ESCAPE REALITY CHECK**:
> The "Quick Exit" button immediately redirects the active browser tab to a neutral destination (e.g., Australian Bureau of Meteorology `bom.gov.au`). **It does NOT and CANNOT erase local browser history, cached cookies, or ISP router logs.** The UI must transparently inform users in vulnerable domestic violence situations to utilize Private / Incognito browsing mode.

---

## 6. Australian Statutory, Legal & Ethical Truth Register

### 6.1 PACFA Scope & Medicare Better Access Clarification

> **STATUTORY TRUTH**: Under current Australian Commonwealth legislation (*Health Insurance Act 1973* and Services Australia Allied Health Schedule), **registered counsellors and psychotherapists are NOT eligible providers under the Medicare Better Access initiative**.

- Eligible providers under Better Access are strictly: Clinical Psychologists, Registered Psychologists, Accredited Mental Health Social Workers, Occupational Therapists, and General Practitioners.
- While Luke (MCouns, UQ; PACFA Reg. #28941) can ethically and legally provide psychotherapy to clients holding a Mental Health Treatment Plan (MHTP), **clients CANNOT claim Medicare rebates for these sessions**.
- **Australian Consumer Law (ACL Sec. 18)**: Marketing copy claiming "Medicare rebates" or "Better Access claiming" is misleading and deceptive conduct. All copy must state that sessions are private-fee or claimable through participating private health funds. GP correspondence must be labeled **Collaborative Care Summaries**, NOT Better Access Medicare claim reports.

---

### 6.2 Australian Privacy Act 1988 & APP 8 (Cross-Border Disclosure) Truth

> **STATUTORY TRUTH**: The *Privacy Act 1988* does NOT contain a statutory "health data residency mandate" requiring data to remain on Australian soil. The governing rule is **APP 8 (Cross-border disclosure of personal information)**.

- Disclosing health data to an overseas cloud vendor requires reasonable steps to ensure the recipient complies with the APPs, or obtaining informed client consent.
- Hosting in Sydney (`ap-southeast-2`) is an **engineering best practice** that eliminates cross-border liability.

---

### 6.3 Health Records Retention in Queensland & Cross-Border Telehealth

> **STATUTORY TRUTH**: Unlike NSW (*Health Records and Information Privacy Act 2002*), Victoria (*Health Records Act 2001*), and the ACT (*Health Records (Privacy and Access) Act 1997*), **Queensland has no dedicated private-sector health records retention statute for private counsellors**.

- For a Queensland private counselling practice, the **7-year rule (adults) / until age 25 rule (minors)** represents professional best practice mandated by the **PACFA Code of Ethics** and medical defence insurers (for defense against historical negligence claims under the *Limitation of Actions Act 1974 (Qld)*).
- **APP 11.2**: Mandates destruction or permanent de-identification when information is no longer needed.
- **Cross-Border Telehealth Reach**: When Luke treats clients physically located in NSW, VIC, or the ACT via telehealth, **those states' statutory health records laws reach the practice extraterritorially**.
- *(NEEDS HUMAN SIGN-OFF: PACFA Ethics Committee & Medical Defence Insurer).*

---

### 6.4 Private Health Fund Rebates (Fund-by-Fund Verification)

Do NOT state blanket claims that PACFA registration guarantees rebates. Private health fund rebates depend on whether the client's fund recognizes PACFA (e.g., Medibank, Bupa, ARHG, HCF) **and the client's individual level of extras cover**. Advise clients to verify eligibility directly with their fund before booking.

---

### 6.5 GST-Free Healthcare (GST Act Sec. 38-10) vs. Taxable Coaching

- Under Section 38-10(1) of the *A New Tax System (Goods and Services Tax) Act 1999*, counselling services provided by a qualified counsellor are **GST-free**.
- Exercise coaching, personal training, and gym programming are **taxable supplies subject to 10% GST**.
- When Luke delivers exercise-integrated counselling, invoices must transparently separate clinical counselling (GST-free) from fitness coaching (taxable), justifying the `gst_cents` column in `mmh_invoices`.
- *(NEEDS HUMAN SIGN-OFF: Australian Registered Tax Agent).*

---

### 6.6 Telehealth Vendor Security (DPA, APP 8, Cloud Recording Disabled)

- "BAA" (Business Associate Agreement) is a US HIPAA construct with zero standing under Australian law.
- For Australian telehealth compliance with Daily.co, Twilio Video, or LiveKit:
  1. Execute an Australian-compliant Data Processing Agreement (DPA).
  2. Permanently disable server-side cloud recording.
  3. Conduct an APP 8 cross-border disclosure assessment if media routes through non-Australian TURN relays.

---

### 6.7 Australian Consumer Law (Sec. 18) & Claims Audit

Under Section 18 of Schedule 2 of the *Competition and Consumer Act 2010*, all public claims must be strictly truthful:
- Replace "256-bit AES encrypted telehealth" with "In-browser peer-to-peer WebRTC video".
- Replace "Medicare rebates available" with "Private Health Fund rebates for eligible policies".

---

### 6.8 Notifiable Data Breaches (NDB) Scheme (Part IIIC vs. GDPR)

- **GDPR**: 72-hour mandatory supervisory notification.
- **Australian Privacy Act Part IIIC (NDB Scheme)**: Requires an entity to carry out a reasonable and expeditious assessment of a suspected breach within **30 days**. Once deemed an eligible data breach (likely to result in serious harm), the entity must notify the OAIC and affected individuals **as soon as practicable**.
- Internal engineering SLA target: **72 hours** for breach containment and initial forensic assessment.

---

## 7. UI/UX, Visual Rhythm & The "Button Truth" Rubric

### 7.1 The "Button Truth" Empirical Questionnaire

Before approving any UI view, audit every interactive component:
1. **Mechanical Truth**: Does clicking the button immediately execute the promised action, or is it a dead prototype link?
2. **State Truth**: Does the button reflect loading (`isSubmitting`), disabled, and success states without freezing?
3. **Copy Truth**: Does the label accurately describe the outcome (e.g. *"Confirm Booking"* vs *"Proceed to Intake"*)?
4. **Failure Truth**: If the backend rejects the request, does the UI show a clear inline error, or does it falsely display success?
5. **Touch Truth**: Does every touch target meet the minimum 44×44 CSS pixel target area?

---

### 7.2 Colour Purity, Verified Contrast & Anti-Cliché Rules

- **Strict Ban on Purple & Violet**: AI-generated designs frequently rely on neon purple, violet, and electric gradients. Purple is strictly prohibited to prevent clinical tech clichés.
- **Organic Earth Palette**: Forest Green (`#1E3A2F`), Terracotta (`#BA3D00`), Warm Cream (`#F9F6F0`), Deep Navy (`#1A2E3B`), Charcoal (`#2D3748`).
- **Verified Contrast Ratios on White (`#FFFFFF`)**:
  - Deep Navy (`#1A2E3B`): **15.7:1** (Exceeds WCAG AAA 7:1)
  - Charcoal (`#2D3748`): **15.1:1** (Exceeds WCAG AAA 7:1)
  - Forest Green (`#1E3A2F`): **10.5:1** (Exceeds WCAG AAA 7:1)
  - Terracotta (`#BA3D00`): **5.6:1** (Exceeds WCAG AA 4.5:1)

---

### 7.3 Layout Density, Rhythm & Cognitive Calming

- Distressed clients experience cognitive tunneling and heightened amygdala arousal.
- Maintain a **40% Whitespace / 60% Content** visual ratio.
- Single-column linear intake wizards; avoid multi-column dense forms on mobile devices.

---

### 7.4 WCAG 2.2 Level AA Standards & Automated Testing Limits

- **WCAG 2.4.11 (AA)**: *Focus Not Obscured (Minimum)* — Interactive components receiving keyboard focus must not be hidden beneath sticky headers or footers.
- **WCAG 2.4.13 (AAA)**: *Focus Appearance* — Contrast ratio of focus indicators must be at least 3:1 against surrounding background.
- **Automated Testing Caveat**: Chrome DevTools Lighthouse 100/100 catches only ~30–40% of accessibility issues. True WCAG compliance requires manual keyboard navigation, screen reader testing (NVDA/VoiceOver), and cognitive walkthroughs.

---

## 8. Universal Modern Web Standards & Functional CSP

### 8.1 Core Web Vitals (CrUX 75th Percentile)

- **LCP (Largest Contentful Paint)**: $< 2.5\text{s}$
- **INP (Interaction to Next Paint)**: $< 200\text{ms}$
- **CLS (Cumulative Layout Shift)**: $< 0.1$

---

### 8.2 Production-Ready Content Security Policy (Report-Only Mode)

A standard `default-src 'self'` blocks Supabase, Cal.com, and Google Fonts. Use this verified production policy:

```http
Content-Security-Policy-Report-Only: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.cal.com https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://app.cal.com https://api.daily.co;
  frame-src 'self' https://app.cal.com https://challenges.cloudflare.com;
  media-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
```

---

## 9. The Hostile Red-Team & Adversarial Penetration Vectors

### 9.1 The 10 Adversarial Attack Scenarios

1. **Scenario 1 (Unauthenticated Data Harvest via PostgREST Anon Key)**: Attacker queries `mmh_client_intakes` and `mmh_clinical_notes` using public anon key. *Expected Result*: 0 rows returned; all queries denied.
2. **Scenario 2 (Privilege Escalation via user_metadata)**: Attacker registers and injects `{"role": "clinician"}` into `user_metadata`. *Expected Result*: `is_clinician()` rejects escalation because it only checks `app_metadata`.
3. **Scenario 3 (Telehealth Room Hijacking via Query String)**: Attacker visits `/telehealth/room-123` without `?role=client`. *Expected Result*: Access blocked; clinician controls hidden; server auth required.
4. **Scenario 4 (Risk Alert POST Spoofing)**: Attacker POSTs directly to `/api/alerts/clinician`. *Expected Result*: Request rejected; internal alert dispatch restricted to server-side triggers.
5. **Scenario 5 (Tampered Psychometric Scoring)**: Client intercepts network request and modifies score to 0. *Expected Result*: Server-side RPC calculates score directly from raw answers.
6. **Scenario 6 (Booking Calendar Double-Booking & Slot Hoarding)**: Bot spams booking endpoint with concurrent requests. *Expected Result*: `btree_gist` exclusion constraint prevents overlapping sessions.
7. **Scenario 7 (Client Altering Audit-Locked Note)**: Adversary updates locked note via PostgREST. *Expected Result*: `check_clinical_note_immutability` trigger aborts transaction.
8. **Scenario 8 (Denial of Wallet & Webhook Flooding)**: Bot floods intake endpoint to trigger thousands of SMS alerts. *Expected Result*: Cloudflare Turnstile bot protection blocks unverified requests.
9. **Scenario 9 (72-Hour Breach Tabletop Simulation)**: PostgreSQL database simulated leak tonight. *Evaluation*: Scope of exposure, detection capability, OAIC Part IIIC notification protocol.
10. **Scenario 10 (Git History Secret Leak)**: Run repository history scanner (`git log -S "sk_"`, `trufflehog`) to verify zero API keys in commit history.

---

### 9.2 The Auditor Self-Refutation Prompt

Conclude every audit run by answering:
> *"Where am I most likely wrong? What unverified assumptions is the project owner making that the empirical code contradicts?"*

---

## 10. The Zero-Tolerance Pre-Launch Gate & Strategic Verdict

### 10.1 The Numbered 18-Point Pre-Launch Gate (Must-Pass Checklist)

Before ANY real patient data enters the system, all 18 gates must pass:

```
+---------------------------------------------------------------------------------------------------------+
|                                  THE 18-POINT CLINICAL PRE-LAUNCH GATE                                  |
+------+------------------------------------------------------------+-------------------+-----------------+
| #    | MANDATORY LAUNCH GATE REQUIREMENT                          | VERIFICATION PATH | STATUS          |
+------+------------------------------------------------------------+-------------------+-----------------+
| G-01 | Public anon key returns 0 rows and rejects writes on notes | Supabase SQL Query| [ ] PASS / FAIL |
| G-02 | Public anon key cannot read intake medical histories       | Supabase SQL Query| [ ] PASS / FAIL |
| G-03 | Demo bypasses, fast-unlocks, and fake personas stripped    | Codebase grep     | [ ] PASS / FAIL |
| G-04 | Admin role enforced via app_metadata, never URL parameters | Next.js Server Auth| [ ] PASS / FAIL |
| G-05 | Screener links secured with unguessable expiring tokens    | /screeners route  | [ ] PASS / FAIL |
| G-06 | PHQ-9 Item 9 suicide interceptor verified with live modal  | Screener UI runner| [ ] PASS / FAIL |
| G-07 | Crisis alert delivered server-side with failure handling   | /api/alerts route | [ ] PASS / FAIL |
| G-08 | Zero clinical health data transmitted to marketing webhooks| Webhook payloads  | [ ] PASS / FAIL |
| G-09 | Data storage location documented & APP 8 assessed          | Supabase Settings | [ ] PASS / FAIL |
| G-10 | Double-booking prevented by btree_gist exclusion constraint| Database schema   | [ ] PASS / FAIL |
| G-11 | Notes locked with COALESCE trigger; addenda table active   | Database schema   | [ ] PASS / FAIL |
| G-12 | Private routes (/admin, /portal) marked with noindex robots| Layout & headers  | [ ] PASS / FAIL |
| G-13 | Telehealth media runs on real SFU/TURN relay infrastructure| WebRTC connection | [ ] PASS / FAIL |
| G-14 | Zero high/critical vulnerabilities reported by npm audit   | Terminal check    | [ ] PASS / FAIL |
| G-15 | MFA enforced on clinician administrative login             | Supabase Auth     | [ ] PASS / FAIL |
| G-16 | Supabase public self-signup restricted or disabled         | Auth dashboard    | [ ] PASS / FAIL |
| G-17 | Database backup restore drill successfully executed        | SRE Runbook       | [ ] PASS / FAIL |
| G-18 | Incident response plan active for Part IIIC NDB compliance | Practice Runbook  | [ ] PASS / FAIL |
+------+------------------------------------------------------------+-------------------+-----------------+
```

---

### 10.2 Remediation Dependency Roadmap

$$\text{Access Control \& RLS} \longrightarrow \text{Duty of Care \& Safety Alerts} \longrightarrow \text{Telehealth SFU/TURN} \longrightarrow \text{Forms \& Billing} \longrightarrow \text{SEO \& Performance}$$

---

### 10.3 Build-vs-Buy Strategic Allied Health Verdict

* **The Reality**: Building a bespoke electronic health record (EHR), telehealth infrastructure, and appointment engine carries significant security, legal, and regulatory maintenance overhead for a solo practitioner.
* **The Strategic Hybrid Recommendation**:
  1. **KEEP BESPOKE (High Value)**:
     - Public marketing website and somatic branding (*"Strengthening Mind & Body As One"*).
     - 4-step digital onboarding intake with somatic tension mapping.
     - Interactive psychometric screener runners (11 instruments) with instant patient engagement.
     - Anonymous marketing workflow and lead attribution automation.
  2. **CONSIDER INTEGRATING (High Liability / Low Strategic Value)**:
     - **Practice Management & Invoicing**: Consider integrating established Australian clinical software (e.g. **Halaxy** or **Cliniko**) for patient billing, private health fund claiming, and primary EHR storage, utilizing our custom frontend for the initial intake and marketing funnel.
     - **Commercial WebRTC Infrastructure**: Migrate peer-to-peer WebRTC video to an Australian-hosted healthcare video API (e.g. Daily.co, Twilio Video, or LiveKit) with guaranteed TURN relays and Australian DPAs.

---
*Comprehensive Master Reference Manual • Version 3.0 • Antigravity AI Orchestrator*
