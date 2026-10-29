# Area H: Automated Email & Notifications Audit

**Reviewer:** DevOps / Communications Reliability Engineer  
**Artifact:** `./audit/08-notifications.md`  
**Finding Severity:** HIGH (P1)

---

## 1. Email Transmission Reality Check

### Is Any Email Actually Sent by this Codebase?
**NO.**  
Inspection of `package.json` and the entire codebase confirms that **no email transport library is installed** (`nodemailer`, `@sendgrid/mail`, `resend`, `postmark`, `aws-sdk/ses` do not exist).

All "notifications" in the codebase are implemented as HTTP POST requests to a single external webhook environment variable: `process.env.ANTIGRAVITY_MARKETING_WEBHOOK_URL`.

| Notification Type | Trigger Location | Intended Recipient | Actual Execution in Code |
| :--- | :--- | :--- | :--- |
| **Booking Confirmation** | `src/app/api/webhooks/booking/route.ts:40` | Client & Clinician | Posts JSON to `ANTIGRAVITY_MARKETING_WEBHOOK_URL`. If unset, **nothing is sent**. Client receives no email confirmation. |
| **Intake Submission** | `src/app/api/webhooks/intake/route.ts:43` | Clinician | Posts JSON to `ANTIGRAVITY_MARKETING_WEBHOOK_URL`. If unset, **nothing is sent**. |
| **Clinical Severity Alert** | `src/app/api/alerts/clinician/route.ts:49` | Clinician (Luke) | Posts JSON to `ANTIGRAVITY_MARKETING_WEBHOOK_URL`. If unset, **nothing is sent**. Returns `{ alert_dispatched: true }`. |

---

## 2. Shared Inbox & Discretion Hazards

In psychological counselling, emails sent to clients can be viewed by family members or employers on shared computers, tablets, or email accounts.
- Under Australian clinical best practices, automated emails (booking confirmations, screener reminders) must follow a **minimal-content design**:
  - Do NOT put clinical scores, screener names (e.g. *"Your DASS-21 Depression Screener"*), or therapy topics in email subject lines.
  - Use discreet subject lines: e.g. *"Mighty Mental Health - Consultation Confirmation"* or *"Your Consultation Link"*.
- In the current API payload (`src/app/api/alerts/clinician/route.ts:33`), the subject line explicitly announces:
  `🚨 URGENT CLINICAL ALERT: [Client Name] - PHQ-9 (Depression)`
  If this payload were ever forwarded to an unvetted email gateway, it would leak confidential diagnosis categories in transit.

---

## 3. Required Specification for Fix (Area H)

1. **Install Dedicated Transactional Email Provider:**
   Install `resend` or `@react-email/components` directly in the project.
2. **Domain Authentication (SPF, DKIM, DMARC):**
   Configure DNS for `mightymentalhealth.com.au` with strict SPF (`v=spf1 include:resend.com ~all`), DKIM 2048-bit keys, and DMARC policy (`p=reject; rua=mailto:dmarc@mightymentalhealth.com.au`).
3. **Discrete Notification Templates:**
   Ensure client-facing emails contain zero diagnostic or psychometric labels.
4. **Retry Queue & Dead-Letter Handling:**
   Implement a resilient webhook/alert queue with exponential backoff (e.g. using Upstash QStash or Supabase pg_net) so alerts are never dropped.
