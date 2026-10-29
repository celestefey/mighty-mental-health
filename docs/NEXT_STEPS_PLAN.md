# Mighty Mental Health — Post-Update Production & Growth Master Plan
### *Next Steps Roadmap: Commercial Launch, Scanned Referral Ingestion, Zero-Cost Telehealth & Local Growth*

> **Practice**: Mighty Mental Health  
> **Clinician**: Luke Piatti (MCouns, UQ; PACFA Reg. #28941) — Exercise-Integrated Counsellor  
> **Location**: Logan, Queensland, Australia (In-Person & Australia-Wide Telehealth)  
> **Target Production Domain**: `mightymentalhealth.com.au`  
> **Current Stack**: Next.js 16 (App Router + Turbopack), Supabase (Sydney `ap-southeast-2`), Tailwind CSS, Radix UI / shadcn, TypeScript  
> **Document Status**: Production Strategy & Architectural Blueprint  

---

## Executive Summary

With the foundational clinical safety, NovoPsych 12-instrument psychometric engine, in-call telehealth workbench, digital intake suite, GP letterhead engine, and 100/100 Lighthouse accessibility audit successfully implemented, Mighty Mental Health is ready for its **next operational evolutionary phase**.

Based on clinical priorities and requirements:
1. **Commercial Launch**: Finalizing custom domain mapping, live Sydney database isolation, and live Stripe card processing with automated split GST.
2. **Scanned Referral Ingestion Engine**: Allowing clients and doctors to securely upload scanned GP Mental Health Treatment Plans (MHTPs) and referral letters with encrypted storage and automated clinician chart linking.
3. **Zero-Cost, Fully Compliant Telehealth & Messaging**: Leveraging zero-cost, end-to-end encrypted peer-to-peer WebRTC and enterprise-grade free tiers (Daily.co 10k mins/mo, Resend 3k emails/mo) complying with the Australian Privacy Act 1988 (APPs) and OAIC standards.
4. **Local SEO & Somatic Growth Hub**: Dominating local search across Logan and South Brisbane for exercise-integrated counselling while providing GPs with a streamlined referral corridor.

---

## Master Next-Steps Roadmap Overview

```
+------------------------------------------------------------------------------------------------------------+
| PHASE 1: PRODUCTION CUTOVER & LAUNCH (Week 1)                                                              |
|   • Custom Domain (mightymentalhealth.com.au) + DNS + SSL                                                  |
|   • Live Sydney Supabase Deployment & Hardened RLS                                                         |
|   • Live Stripe Elements + Split GST Invoicing (PACFA GST-Free vs Exercise 10% GST)                        |
|   • 18-Point Clinical Go-Live Sign-Off                                                                     |
+------------------------------------------------------------------------------------------------------------+
                                      │
                                      ▼
+------------------------------------------------------------------------------------------------------------+
| PHASE 2: SCANNED REFERRAL & MEDICAL DOCUMENT INGESTION (Week 2)                                            |
|   • Encrypted Supabase Storage Bucket ('clinical-referrals' with restricted AES-256 RLS)                   |
|   • Client Scanned Document Uploader in /intake and /portal (PDF / Image / Mobile Camera HEIC conversion)  |
|   • Clinician Referral Workbench in /admin (View, Extract GP Provider #, Link to MHTP Letters)            |
|   • Automated Referral Expiry & Session Counter (e.g., 6 initial sessions under MHTP)                     |
+------------------------------------------------------------------------------------------------------------+
                                      │
                                      ▼
+------------------------------------------------------------------------------------------------------------+
| PHASE 3: ZERO-COST COMPLIANT TELEHEALTH & NOTIFICATIONS (Week 3)                                           |
|   • In-Browser P2P WebRTC Primary (100% Free, Zero Intermediary Storage, TLS 1.3)                         |
|   • Daily.co Free Tier Cloud Fallback (10,000 mins/month, Australian Edge SFU, Zero Recording)             |
|   • Resend Free Tier Transactional Email (3,000 emails/mo, .ics Calendar Invites, Intake Alerts)          |
|   • Cal.com Free Tier Dual Booking Sync with Luke's Personal Calendar                                      |
+------------------------------------------------------------------------------------------------------------+
                                      │
                                      ▼
+------------------------------------------------------------------------------------------------------------+
| PHASE 4: LOCAL SEO, GP BRIDGE & SOMATIC CONTENT ENGINE (Week 4)                                            |
|   • Local Logan & South Brisbane SEO ("Exercise-Integrated Counselling", "Men's Somatic Therapy")           |
|   • Dedicated Doctor Referral Corridor (/for-doctors) with PACFA #28941 Verification & Referral Guide      |
|   • Somatic Article & Video Hub (Strapi CMS / MDX: Vagus nerve resets, gym-based regulation)               |
|   • Google Business Profile Sync & MedicalClinic Schema Validation                                         |
+------------------------------------------------------------------------------------------------------------+
                                      │
                                      ▼
+------------------------------------------------------------------------------------------------------------+
| PHASE 5: CLIENT RETENTION & SOMATIC HABIT TRACKING (Post-Launch Expansion)                                 |
|   • Client Portal Somatic Workout & Tension Log (Physical recovery metrics between sessions)               |
|   • Longitudinal Psychometric Trajectory Charts (DASS-21, PHQ-9, K10 recovery curves)                     |
|   • Multi-Seat Movement Workshop Booking (Gym-based group psychoeducation sessions)                        |
+------------------------------------------------------------------------------------------------------------+
```

---

## Detailed Phase Execution Breakdown

### Phase 1: Production Launch & Commercialization (The "Go-Live" Sprint)

#### 1.1 Custom Domain & Production DNS (`mightymentalhealth.com.au`)
- **DNS Configuration**:
  - Configure `A` and `CNAME` records at registrar pointing to Vercel edge network.
  - Enable automatic Vercel Let's Encrypt Wildcard SSL certificate.
  - Configure canonical 301 redirect: `http://mightymentalhealth.com.au` and `https://www.mightymentalhealth.com.au` $\rightarrow$ `https://mightymentalhealth.com.au`.
- **Security Headers & CSP Verification**:
  - Transition Content Security Policy (CSP) from `Content-Security-Policy-Report-Only` to enforced `Content-Security-Policy` in `next.config.ts`.
  - Enforce `HSTS` (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).

#### 1.2 Isolated Sydney Supabase Production Project
- **Region**: Sydney, Australia (`ap-southeast-2`) to guarantee sovereign data residency under the Australian Privacy Act 1988 (APPs).
- **Migration & Schema Push**:
  - Execute full production migration package:
    - Tables: `mmh_services`, `mmh_appointments`, `mmh_forms`, `mmh_form_assignments`, `mmh_clinical_notes`, `mmh_clinical_note_addenda`, `mmh_client_intakes`, `mmh_invoices`.
    - Extensions: `btree_gist`, `pgcrypto`.
    - Concurrency defense: `no_overlapping_sessions` exclusion constraint.
    - Immutability: Note lock and append-only addenda triggers.
- **Production RLS & Auth**:
  - Enforce strict Row-Level Security so anonymous users have zero read access to health records.
  - Restrict Clinician Admin role to Luke Piatti (`luke@mightymentalhealth.com.au`).

#### 1.3 Live Stripe Payments with Automated Split-GST Invoicing
- **Australian Tax Compliance**:
  - **Psychotherapy & Counselling Consultations**: GST-Free under A New Tax System (Goods and Services Tax) Act 1999 (Cth) Section 38-10 (Recognised health professional: PACFA Reg. #28941).
  - **Somatic Movement & Physical Exercise Coaching**: Standard 10% GST applicable.
- **Stripe Elements Flow**:
  - Embed responsive Stripe Payment Element in the booking confirmation drawer.
  - Server-side PaymentIntent creation with HMAC SHA-256 webhook verification (`/api/webhooks/stripe`).
  - Automated PDF tax invoice receipt generated with Luke's ABN, PACFA Provider details, and clear GST breakdown for private health fund rebates (Medibank, Bupa, ARHG, HCF).

---

### Phase 2: Scanned Referral & Medical Document Ingestion Engine

Clients frequently receive hardcopy GP Mental Health Treatment Plans (MHTPs) or specialist letters printed by their doctor and need a frictionless, secure way to upload phone camera snapshots or PDFs.

```
+----------------------------------------------------------------------------------------------------+
|                                    PATIENT UPLOAD INTERFACE                                        |
|  [Select File / Take Photo with Phone]  ──>  [Client-side Compression & HEIC-to-JPEG Conversion]   |
+--------------------------------------------------+-------------------------------------------------+
                                                   │
                                                   │ Encrypted TLS 1.3 Upload
                                                   ▼
+----------------------------------------------------------------------------------------------------+
|                                   SUPABASE SECURE STORAGE                                          |
|                          Bucket: 'clinical-documents' (Private, Non-Public)                       |
|   • Path: /clients/{clientId}/referrals/{uuid}-{timestamp}.pdf                                     |
|   • Server-Side Encryption: AES-256                                                                |
|   • RLS Policy: Only authenticated client can upload; only Clinician (Luke) can view/download      |
+--------------------------------------------------+-------------------------------------------------+
                                                   │
                                                   │ Webhook / Database Reference Link
                                                   ▼
+----------------------------------------------------------------------------------------------------+
|                                   CLINICIAN WORKBENCH (/admin)                                     |
|   • New "Referrals & Medical Files" Tab in Client Dossier                                          |
|   • 1-Click High-Res Document Viewer with Zoom & Rotate (for phone camera angles)                 |
|   • "Extract GP Details": Copies Referring Doctor, Provider #, and Referral Date directly into     |
|     the formal GP Letterhead generator and first-session clinical note.                               |
+----------------------------------------------------------------------------------------------------+
```

#### 2.1 Storage Infrastructure & Security
- **Bucket Creation**: `clinical-documents` bucket in Sydney Supabase instance with `public = false`.
- **Row-Level Security Policies**:
  ```sql
  -- Client can only insert into their own folder
  CREATE POLICY "Clients can upload own referrals"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'clinical-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Only Clinician Luke can select and download
  CREATE POLICY "Clinician has full document access"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'clinical-documents' AND
    auth.email() = 'luke@mightymentalhealth.com.au'
  );
  ```

#### 2.2 Client Upload Experience (`/intake` and `/portal`)
- **Multi-Format Support**: Native PDF files, JPEG/PNG images, and automatic client-side HEIC/HEIF conversion for Apple iPhone camera photos.
- **File Validation & Safety**:
  - Maximum upload size: 15 MB per file.
  - MIME-type inspection to prevent malicious script uploads.
  - Client-side image compression (reducing 12MB raw phone photos to clean 1.5MB high-contrast clinical scans).
- **Placement**:
  - Mounted directly in **Step 1 of `/intake`** ("Do you have a GP Mental Health Treatment Plan or Referral Letter?").
  - Mounted in `/portal` under **"My Health Records & Documents"** for uploading additional specialist reports at any time.

#### 2.3 Clinician Review & Administrative Linking
- In `/admin` Client Chart:
  - Displays thumbnail previews with instant high-resolution modal viewer (including 90° rotation controls for sideways phone photos).
  - One-click field extraction: Luke can quickly verify the GP's name, clinic, provider number, and referral date, auto-populating the client's administrative profile.
  - Active MHTP session counter (tracks 6 initial sessions $\rightarrow$ prompts 6-session GP Review Letter when session 5 completes).

---

### Phase 3: Zero-Cost, Fully Compliant Telehealth & Communication

#### 3.1 Zero-Cost Compliant Video Strategy
To deliver maximum reliability without unnecessary recurring overheads:

| Feature | Primary Layer: In-Browser P2P WebRTC | Fallback Layer: Daily.co Free Tier | External Sync: Cal.com / Google Meet |
|---|---|---|---|
| **Cost** | **$0.00 / forever** | **$0.00** (Up to 10,000 mins/mo) | **$0.00** (Free personal tiers) |
| **Data Privacy** | Peer-to-Peer, direct browser connection, zero intermediate recording | HIPAA & Australian Privacy compliant, TLS 1.3 encrypted, cloud recording disabled | External Google / Cal infrastructure |
| **Bandwidth & SFU** | Best for 1-on-1 consultations on standard broadband | Media server routing for low-bandwidth mobile or rural 4G/5G connections | Managed by Google |
| **In-Session Tools** | Full integration with Luke's SOAP Workbench & Patient Slide-Over Form Drawer | Compatible with drawer via overlay iframe | External tab |

- **Execution**: The existing built-in WebRTC room remains the primary zero-cost engine. For rural clients with strict firewall/NAT traversal issues, a free Daily.co room token fallback is triggered with a single click.

#### 3.2 Zero-Cost Transactional Communications
- **Resend Free Tier** (3,000 emails/month):
  - Connect verified domain `mightymentalhealth.com.au` via SPF/DKIM DNS records.
  - Transactional templates:
    1. *Booking Confirmation & Calendar `.ics` File*: Automatically adds session to client's Apple/Google/Outlook calendar with direct `/portal` link.
    2. *Clinical Intake & Screener Reminder*: Sent 24 hours prior to appointment if forms remain pending.
    3. *Instant Clinician Crisis Alert*: Dispatches immediate email notification to Luke when high-risk assessment scores (e.g. PHQ-9 Q9) are flagged.

---

### Phase 4: Local SEO, GP Referral Bridge & Somatic Content Hub

#### 4.1 Local SEO Domination (Logan & South Brisbane)
Luke's unique positioning — **Exercise-Integrated Counselling** combining Master's-level psychotherapy with gym-based physical movement — has virtually zero direct competitors in the Logan and South Brisbane corridor.

- **High-Intent Target Keywords**:
  - `Exercise-integrated counselling Logan`
  - `Men's mental health gym therapy Brisbane`
  - `Somatic counsellor Logan Central / Springwood`
  - `PACFA counsellor Logan bulk bill private health rebate`
  - `Trauma informed movement coach Queensland`
- **Technical SEO Enhancements**:
  - Implement full `MedicalClinic` and `Physician` schema JSON-LD with Luke's PACFA registration #28941, Logan clinic geographic coordinates, opening hours, and accepted health funds.
  - Set up Google Business Profile for Mighty Mental Health with categories: *Mental Health Clinic*, *Counsellor*, *Wellness Program*.

#### 4.2 Dedicated GP & Allied Health Referral Bridge (`/for-doctors`)
A dedicated, professional landing page built specifically for local General Practitioners, Psychiatrists, and Physiotherapists:
- **Clinical Overview**: Explaining the dual-track cognitive-somatic model, evidence base, and suitability criteria (Depression, Anxiety, ADHD somatic regulation, Chronic Stress, Body Image, PTSD).
- **Direct Referral Submission Form**:
  - Allows medical receptionists or GPs to securely submit patient details, attach PDF MHTPs, and specify referring provider numbers.
  - Automatically dispatches formal receipt to the medical practice confirming acceptance of care within 24 hours.
- **Downloadable Referral Pack**: Clean 1-page PDF referral pad for doctors to keep in medical clinic rooms.

#### 4.3 Somatic Psychoeducation Article & Video Hub
- Structured blog/resources hub educating potential clients on:
  - *The Physiology of Stress: Why Talking Alone Sometimes Isn't Enough*
  - *Vagus Nerve & Resistance Training: How Heavy Lifting Calms the Nervous System*
  - *Understanding Your DASS-21 Scores: A Practical Breakdown*
- Powered by MDX or Strapi CMS with automatic social sharing preview cards (OpenGraph).

---

### Phase 5: Client Retention & Somatic Habit Tracking (Future Horizon)

Once core production operations are running smoothly, the platform will expand client engagement between clinical sessions:

1. **Between-Session Somatic Tension & Movement Log**:
   - Client portal widget where clients can log weekly resistance training, autonomic arousal levels (1–10), and sleep quality.
   - Provides Luke with real-time biofeedback trends visible directly inside his in-call Telehealth Workbench.
2. **Longitudinal Recovery Trajectory**:
   - Visual trendlines illustrating score reductions across DASS-21, PHQ-9, and GAD-7 over 6–12 sessions.
   - Automatically printable for inclusion in the 6-Session GP Review Letter.
3. **Multi-Seat Somatic Movement Workshops**:
   - Booking engine extension allowing registration for small group gym-based psychoeducation workshops (e.g., 6 participants max per cohort).

---

## 4-Week Implementation & Verification Timeline

| Week | Focus Area | Deliverables | Verification Milestone |
|---|---|---|---|
| **Week 1** | **Production Cutover & Commercial Launch** | Custom domain DNS (`mightymentalhealth.com.au`), live Sydney Supabase migration, live Stripe Elements card processing with split GST invoicing. | Real $1.00 test transaction processed with correct GST-free receipt generated; SSL active. |
| **Week 2** | **Scanned Referral Upload & EHR Dossier** | Supabase `clinical-documents` private bucket, `/intake` & `/portal` upload component with HEIC conversion, `/admin` referral viewer & GP letter autofill. | Test PDF and phone camera snapshot uploaded, verified in Luke's admin chart, and extracted into GP letterhead. |
| **Week 3** | **Zero-Cost Telehealth & Resend Messaging** | P2P WebRTC zero-cost optimization, Daily.co free tier fallback, Resend domain verification, automated `.ics` calendar notifications and crisis alerts. | Video call tested across mobile 4G and desktop; automated calendar invite received in email inbox. |
| **Week 4** | **Local SEO & GP Referral Corridor** | `/for-doctors` medical portal, `MedicalClinic` JSON-LD schema, local Logan/Brisbane SEO landing copy, Google Business Profile configuration. | 100/100 Lighthouse SEO score maintained; Google Rich Results test confirms valid medical schema. |

---

## Operational Verification & Safety Sign-Off Checklist

- [ ] **Data Residency**: Supabase database verified in Sydney (`ap-southeast-2`), no patient PII transmitted outside Australia.
- [ ] **Document Storage Security**: Scanned referral files blocked from public access; direct URLs return 403 Forbidden without valid clinician session.
- [ ] **Payment Integrity**: Stripe webhook signatures cryptographically verified with HMAC SHA-256; split GST correctly flags counselling as GST-free.
- [ ] **Patient Emergency Safeguards**: 24/7 crisis numbers (`000`, `13 11 14`, `1300 659 467`, `1300 22 4636`) permanently rendered across screeners, booking, and footer.
- [ ] **Clinical Immutability**: Signed clinical notes protected against tampering; amendments restricted to append-only addenda table.
- [ ] **Universal Accessibility**: WCAG 2.1 AAA compliance maintained at 100/100 across mobile and desktop viewpoints.
