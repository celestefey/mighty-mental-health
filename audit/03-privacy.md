# Area C: Privacy & Legal Compliance Audit (Australian Privacy Act & APPs)

**Reviewer:** Senior Privacy & Regulatory Compliance Analyst (Australian Law)  
**Artifact:** `./audit/03-privacy.md`  
**Finding Severity:** CRITICAL (P0)  
**Status:** [NEEDS HUMAN SIGN-OFF BY QUALIFIED AUSTRALIAN PRIVACY LAWYER / PACFA ADVISOR]

---

## 1. Statutory Framework: Privacy Act 1988 (Cth) & Health Information

Under Section 6D(4) of the *Privacy Act 1988 (Cth)*, **the small business exemption does NOT apply to any business that provides a health service and holds health information**.  
Mighty Mental Health provides psychotherapy, counselling, and clinical psychometric assessments; therefore, the practice is an **APP Entity** legally bound by the **13 Australian Privacy Principles (APPs)** from day one, regardless of annual turnover.

Health information (medical history, psychological assessment scores, medications, therapy notes) is classified as **Sensitive Information** under Section 6 of the Privacy Act, attracting the strictest statutory protections.

---

## 2. APP-by-APP Compliance Assessment

| Australian Privacy Principle (APP) | Obligation Summary | Mighty Mental Health Implementation | Compliance Status |
| :--- | :--- | :--- | :--- |
| **APP 1: Open and Transparent Management** | Must have an up-to-date, clearly expressed privacy policy detailing collection, storage, overseas disclosure, and complaint mechanisms. | Privacy policy link in footer redirects or renders generic static layout. Lacks specific subprocessor disclosure (Supabase, Vercel, Cal.com). | **NON-COMPLIANT** |
| **APP 3: Collection of Sensitive Information** | Sensitive health information may only be collected with explicit, informed consent and if reasonably necessary. | Intake form collects detailed psychiatric and somatic history, but lacks an unambiguous consent checkbox with limits of confidentiality. | **PARTIALLY COMPLIANT** |
| **APP 5: Notification of Collection** | Must provide a collection notice at or before collection detailing purpose, consequences of non-provision, and overseas transfers. | No APP 5 collection statement presented prior to booking, intake, or screener commencement. | **NON-COMPLIANT** |
| **APP 6: Use or Disclosure of Health Data** | Health information collected for one purpose must NOT be used or disclosed for a secondary purpose (especially marketing) without express consent. | **CRITICAL BREACH**: `/api/webhooks/intake/route.ts:18-49` forwards client names, emails, screener scores, and clinical severities alongside UTM campaign tags to `ANTIGRAVITY_MARKETING_WEBHOOK_URL`. | **CRITICAL STATUTORY BREACH** |
| **APP 8: Cross-Border Disclosure** | Before disclosing personal info overseas, entity must take reasonable steps to ensure recipient does not breach the APPs, or obtain informed consent. | Cal.com (US Delaware), Vercel (US), and external webhooks receive patient metadata without APP 8 disclosure or contractual safeguards. | **NON-COMPLIANT** |
| **APP 11: Security of Personal Information** | Must take active, reasonable steps to protect personal information from misuse, interference, loss, unauthorized access, modification, or disclosure. | **CRITICAL BREACH**: Database tables holding health records have `USING (true)` RLS policies (`supabase/schema.sql`). The anon key allows any user to read/modify/delete all records. | **CRITICAL STATUTORY BREACH** |
| **APP 12 & 13: Access and Correction** | Must provide individuals with access to their health records and allow correction of inaccurate information. | Client portal provides no mechanism for clients to download full health records or submit correction requests. | **PARTIALLY COMPLIANT** |

---

## 3. The Direct-Marketing Separation Failure (APP 6 & Spam Act)

In `src/app/api/webhooks/intake/route.ts:18-49`:
```typescript
const webhookPayload = {
  event: 'client.intake.submitted',
  timestamp: new Date().toISOString(),
  client: { name: client_name, email: client_email },
  intake: {
    form_id,
    form_title,
    severity: clinical_severity,
    scores: score_summary,
  },
  metadata: {
    utm_source: metadata.utm_source || 'organic',
    utm_medium: metadata.utm_medium || 'direct',
    utm_campaign: metadata.utm_campaign || 'mmh_telehealth_launch',
    workflow_id: metadata.workflow_id || 'agy_intake_pipeline_v1',
    origin: metadata.origin || 'mightymentalhealth.com.au',
  },
};

const externalWebhookUrl = process.env.ANTIGRAVITY_MARKETING_WEBHOOK_URL;
if (externalWebhookUrl) {
  await fetch(externalWebhookUrl, { ... });
}
```

### Legal Assessment:
1. Under APP 6, sensitive health data collected for clinical intake cannot be bundled into an advertising attribution pipeline (`utm_source`, `utm_campaign`, `workflow_id`).
2. Transmitting a client's clinical depression/anxiety severity into a marketing CRM or advertising webhook without informed, granular, opt-in consent violates federal privacy legislation.
3. **Remediation:** Completely sever and delete all webhook calls to `ANTIGRAVITY_MARKETING_WEBHOOK_URL` in clinical code paths.

---

## 4. Notifiable Data Breaches (NDB) Scheme Readiness (Part IIIC Privacy Act)

Under Part IIIC of the *Privacy Act 1988*, an eligible data breach occurs when there is unauthorized access to, or disclosure of, personal information that a reasonable person would conclude is likely to result in serious harm. Health information breaches are automatically presumed high harm by the OAIC (Office of the Australian Information Commissioner).

### Current Readiness Assessment:
- **Audit Logging:** **ZERO**. Supabase query logs are not persisted to a secure SIEM or long-term audit store. The app has no access log recording who queried `mmh_client_intakes` or `mmh_clinical_notes`.
- **Breach Detection Capability:** If an attacker dumped the entire database today using the anon key, Luke would have **no automated alert, no anomaly detection, and no record** that the exfiltration occurred.
- **Scoping Exposure:** Because there are no row-level read audit logs, determining which patients were compromised would be technically impossible.

---

## 5. PACFA Code of Ethics & Australian Consumer Law (ACL)

### 1. Medicare Better Access Misrepresentation
- **Code Locations:** `src/lib/clinicalTemplates.ts:172` and `src/lib/clinicalTemplates.ts:238`:
  > *"re-referral for an additional 4 sessions (Sessions 7–10) under the Better Access / Mental Health Care Plan framework."*
- **Legal Reality:** Counsellors registered under PACFA (even with an accredited Master of Counselling from UQ) **cannot claim Medicare Better Access rebates**. Medicare items under the Better Access initiative are restricted under Commonwealth law to Registered/Clinical Psychologists, AMHSWs, and OTs.
- **Risk:** Claiming Medicare Better Access rebates in GP letters or website copy is misleading conduct under Section 18 of the *Australian Consumer Law* (Schedule 2 of the *Competition and Consumer Act 2010*) and violates Section 3 of the PACFA Code of Ethics (truth in advertising).

### 2. Clinical Records Retention Requirements
- In Queensland, allied health and psychotherapy records must be retained for a minimum of:
  - **7 years** from the date of the last consultation for adult clients.
  - Until the client reaches **age 25** (or 7 years after the last entry, whichever is longer) if the client was under 18 at the time of consultation.
- The current database has no automated retention policies, no scheduled archival exports, and allows arbitrary client row deletion via `is_demo = true`.

---

## 6. Required Specification for Fix (Area C)

1. **Delete Marketing Webhooks from Health Paths:**
   - Remove `ANTIGRAVITY_MARKETING_WEBHOOK_URL` from `/api/alerts/clinician`, `/api/webhooks/intake`, and `/api/webhooks/booking`.
2. **Purge Medicare Claims:**
   - Replace all mentions of "Better Access" with *"PACFA Private Health Fund Rebates (Medibank, Bupa, ahm, ARHG, Police Health), NDIS, or Private Billing"*.
3. **Draft Australian APP Collection Notice:**
   - Embed a formal APP 5 collection statement before the intake form and booking modal.
4. **Data Retention & Integrity Lock:**
   - Implement PostgreSQL soft-delete (`deleted_at TIMESTAMPTZ`) instead of hard `DELETE`. Real records must never be hard-deleted.
