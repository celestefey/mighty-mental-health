# Area B: Clinical Safety & Duty of Care Audit

**Reviewer:** Clinical Safety Reviewer & PACFA Compliance Specialist  
**Artifact:** `./audit/02-safety.md`  
**Finding Severity:** CRITICAL (P0)

---

## 1. Risk-Flag Pipeline: End-to-End Analysis

The risk alerting architecture was designed to detect acute clinical distress (suicidal ideation on PHQ-9 Item 9, extreme DASS-21 scores, severe PTSD symptoms on PCL-5, adolescent substance risk on CRAFFT) and notify the clinician.

```
[ Client Completes Screener ]
             │
             ▼
[ Client-Side Browser computes scoreSummary ] (`src/app/screeners/[assignmentId]/page.tsx:120`)
             │
             ▼
[ Browser writes to Supabase mmh_form_assignments ] (`page.tsx:138-147`)
             │
             ▼
[ Browser fires async fetch('/api/alerts/clinician') ] (`page.tsx:151`)
             │
             ▼
[ API handler checks severity ] (`src/app/api/alerts/clinician/route.ts:15`)
             │
             ▼
[ Attempts forward to process.env.ANTIGRAVITY_MARKETING_WEBHOOK_URL ] (`route.ts:49-59`)
```

### Critical Vulnerabilities in the Alert Pipeline:

1. **Client-Side Failure Point (Dropped Alert):**  
   Because the alert is triggered by the browser *after* updating Supabase (`page.tsx:151`), any interruption—such as the user closing the browser tab upon seeing the "Thank you" state, mobile browser throttling background requests, or a spotty 4G/5G connection—results in the database holding a severe suicide risk answer while **the alert request is never transmitted to the server**.
2. **Unauthenticated Public Endpoint with Spoofable Severity:**  
   The route `/api/alerts/clinician` is completely unauthenticated. Anyone can send a POST request with arbitrary JSON payloads:
   ```bash
   curl -X POST http://localhost:3000/api/alerts/clinician \
     -H "Content-Type: application/json" \
     -d '{"client_name":"Fake Alert","severity":"🚨 URGENT Suicide Risk","scores":{"hasSelfHarmRisk":true}}'
   ```
   An attacker can flood Luke with hundreds of false crisis notifications, causing alarm fatigue, or conversely, send benign payloads to suppress alerts.
3. **False Success Semantics:**  
   In `src/app/api/alerts/clinician/route.ts:49-66`, if `process.env.ANTIGRAVITY_MARKETING_WEBHOOK_URL` is undefined (which it is in `.env.local`), the route skips sending anything, yet returns:
   ```json
   { "success": true, "alert_dispatched": true, "is_high_risk": true }
   ```
   The application falsely reports to the client and logs that an alert was dispatched when **zero notifications were transmitted**.
4. **No Direct Clinician Channel (No SMS / Direct SMTP):**  
   The application contains no Twilio SMS integration, no Australian emergency escalation gateway, and no direct SMTP email sender. It relies entirely on an unconfigured third-party marketing webhook.

---

## 2. Test-Vector Execution Matrix

| Test Vector | Input State | Code Behavior (Observed) | Clinical Outcome / Risk |
| :--- | :--- | :--- | :--- |
| **PHQ-9 Item 9 = 3** ("Nearly every day thoughts of death/self-harm") | All items answered; Item 9 = 3. | `scorePhq9` sets `hasSelfHarmRisk = true` (`scoring.ts:77`). Severity set to `Severe / Crisis Flag`. Directs to generic post-submission screen with crisis numbers. | **High Risk**: Client sees static text box. No dynamic immediate safety modal; alert delivery to clinician is unreliable. |
| **PHQ-9 Item 9 = 0** | All items answered; Item 9 = 0. | `hasSelfHarmRisk = false`. Standard severity calculation. | Expected clinical behavior. |
| **PHQ-9 Item 9 Unanswered** | Items 1-8 answered; Item 9 omitted from `answers`. | `const item9 = Number(answers['q9']) \|\| 0;` (`scoring.ts:76`). | **CRITICAL FAILURE**: Evaluates silently to `0`. High-risk client skipping item 9 is categorized as zero self-harm risk. |
| **All Answers Missing** | User submits empty form `{}`. | `total += Number(answers['q' + i]) \|\| 0;` (for PHQ-9, DASS-21) or `\|\| 1;` (for K10). | **CRITICAL FAILURE**: Empty submission scores as `0` ("None-Minimal") for PHQ-9 and `10` ("Low Distress") for K10. No completeness validation. |
| **Tab Closed Mid-Submit** | User clicks submit; closes tab within 200ms. | Supabase update may succeed; `fetch('/api/alerts/clinician')` is aborted by browser process exit. | **CRITICAL FAILURE**: Database records severe depression/suicidality, but clinician receives zero notification. |
| **DB Write Fails, Alert Succeeds** | Supabase connection drops during update. | Execution halts before `fetch('/api/alerts/clinician')`. Alert is never sent. | Alert suppressed on DB write failure. |
| **CRAFFT Adolescent Screener** | Submits score >= 2 (Positive substance screen). | Scores correctly (`scoring.ts:250`). Severity marked "High Substance Risk". | CRAFFT is validated for adolescents aged 12-21; no age check or guardian consent exists. |

---

## 3. Psychometric Instrument Evaluation

| Instrument | Items Checked | Scoring Logic (`src/lib/scoring.ts`) | Missing Item Handling | Attribution & Licensing Check |
| :--- | :--- | :--- | :--- | :--- |
| **DASS-21** | 21 items (0-3 scale). Multiplied by 2. | Matches Lovibond & Lovibond (1995). Subscales: Depression, Anxiety, Stress correctly bucketed. | Coerced to `0` (`scoring.ts:25`). **Fails completeness check.** | Public domain for clinical use with author attribution. Attribution is missing in UI footer. |
| **PHQ-9** | 9 items (0-3 scale). | Cutoffs: 5, 10, 15, 20 match Kroenke et al. (2001). Item 9 triggers flag. | Coerced to `0` (`scoring.ts:73`). **Fails completeness check.** | Developed by Drs. Spitzer, Williams, Kroenke. Free for clinical use. |
| **GAD-7** | 7 items (0-3 scale). | Cutoffs: 5, 10, 15 match Spitzer et al. (2006). | Coerced to `0` (`scoring.ts:50`). **Fails completeness check.** | Free for clinical use. |
| **K10** | 10 items (1-5 scale). | Cutoffs: 20, 25, 30 match Kessler et al. (2002) Australian National Survey standards. | Coerced to `1` (`scoring.ts:116`). **Empty form scores as 10.** | Public domain (Harvard/WHO). Claims of population percentiles (`scoring.ts:120-134`) are accurate against ABS 2007 National Survey of Mental Health and Wellbeing, but unsourced in UI. |
| **PCL-5** | 20 items (0-4 scale). DSM-5 PTSD clusters (B, C, D, E). | Matches Weathers et al. (2013). Cutoff >= 33 for probable PTSD. | Coerced to `0` (`scoring.ts:150`). **Fails completeness check.** | US National Center for PTSD. Free for clinical use. |
| **ASRS v1.1** | 6 items (Part A). | Matches Kessler et al. (2005) WHO adult ADHD screener. | Coerced to `0`. | WHO copyright; free for clinical use. |
| **CRAFFT v2.1** | 6 items (Yes/No). | Matches Knight et al. (2002). Score >= 2 positive. | Coerced to `0`. | Center for Adolescent Behavioral Health Research. **Validated for ages 12-21 only.** |
| **AIS** | 8 items (0-3 scale). | Athens Insomnia Scale. Cutoff >= 6. | Coerced to `0`. | Free for clinical practice. |
| **BRS** | 6 items (1-5 scale). Reverse scored items 2, 4, 6. | Reverse scoring implemented correctly (`6 - val`, `scoring.ts:233`). | Coerced to `3` (neutral midpoint). | Smith et al. (2008). |

---

## 4. Consent, Limits of Confidentiality & Crisis Resources

1. **Pre-Screening Consent Barrier:**  
   Currently, clicking a screener link immediately opens the questionnaire with no pre-screener limits-of-confidentiality declaration. In Australia, under the PACFA Code of Ethics Section 4, clients must be explicitly informed that confidentiality is limited where there is reasonable belief of imminent risk of harm to self or others.
2. **Immediate Crisis Resource Visibility:**  
   Crisis numbers (`000`, Lifeline `13 11 14`, Suicide Call Back `1300 659 467`) currently appear **only at the very bottom of the post-submission screen** (`src/app/screeners/[assignmentId]/page.tsx:280-310`). If a client experiences acute distress while answering questions or experiences emotional dysregulation mid-screener, the crisis contact info is not persistently accessible.
3. **Telehealth Safety Plan:**  
   In `src/app/telehealth/[roomId]/page.tsx`, there is no prompt asking the client for their current physical location (street address) at the start of the call. In national telehealth counselling, establishing the client's physical location at the beginning of every video session is mandatory so emergency services (QAS / Police) can be dispatched in the event of an acute medical or psychiatric emergency.

---

## 5. Required Specification for Fix (Area B)

1. **Server-Side Scoring & Form Completeness Enforcement:**  
   - Remove client-side scoring in `src/app/screeners/[assignmentId]/page.tsx`.
   - Client submits raw answers to a secure Next.js API route (`/api/screeners/submit`).
   - The server validates that 100% of required questions are answered using Zod. Reject partial submissions.
   - The server calculates psychometric totals and determines severity flags using `src/lib/scoring.ts` on the server.
2. **Atomic Transaction & Reliable Notification:**  
   - Inside the server route, update Supabase `mmh_form_assignments` and, if high risk is detected, immediately write to an `mmh_clinical_alerts` table.
   - Dispatch notifications via a dedicated transactional email/SMS service (e.g. Resend or Twilio) with retry logic.
3. **Persistent Crisis Drawer:**  
   - Add a fixed, high-contrast Emergency Crisis Button (`🚨 Need Immediate Help? 13 11 14`) visible at all times during screener completion.
4. **Telehealth Physical Location Check:**  
   - Add a mandatory 1-step location confirmation at room entry: *"Confirm your physical address today in case of emergency"*.
