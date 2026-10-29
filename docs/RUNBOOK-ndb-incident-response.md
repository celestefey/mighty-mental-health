# Incident Response Runbook: Australian Notifiable Data Breaches (NDB)
**Practice**: Mighty Mental Health (Logan Central, QLD, Australia)  
**Clinician & Nominated Privacy Officer**: Luke Piatti (MCouns, UQ; PACFA Reg. #28941)  
**Legal Authority**: Privacy Act 1988 (Cth) Part IIIC — Notifiable Data Breaches Scheme  
**Statutory Assessment Deadline**: Reasonable and expeditious, strictly within **30 calendar days** (Practice Internal Target: **72 hours**)

---

## 1. What Constitutes an Eligible Data Breach?

Under Section 26WE of the Privacy Act, an **Eligible Data Breach** occurs when:
1. There is unauthorized access to, or unauthorized disclosure of, personal or health information, OR information is lost in circumstances where unauthorized access or disclosure is likely to occur; AND
2. A reasonable person would conclude that the access or disclosure is likely to result in **serious harm** (psychological, emotional, physical, financial, or reputational) to any of the individuals to whom the information relates; AND
3. The practice has not been able to prevent the likely risk of serious harm with remedial action.

> **Health Information Sensitivity**: Clinical psychotherapy notes, intake psychiatric history, medications, and psychometric screening scores (e.g. PHQ-9, DASS-21) are classified as **sensitive health information** under Section 6 of the Privacy Act. Any exposure carries an inherently high presumption of serious harm.

---

## 2. 4-Phase Incident Response Protocol

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Phase 1: Contain │ ──> │ Phase 2: Assess  │ ──> │ Phase 3: Notify  │ ──> │ Phase 4: Review  │
│  (0 - 2 Hours)   │     │ (Within 72 Hours)│     │(OAIC & Clients)  │     │(Prevent Recur)   │
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Phase 1: Contain the Breach Immediately (Hours 0 – 2)

Take immediate operational action to stop unauthorized access or data exfiltration:
1. **Revoke Compromised Credentials**:
   - Rotate Supabase Service Role Key and Anon Key immediately in Supabase Dashboard.
   - Rotate `JWT_SECRET` to invalidate all active client and admin sessions.
   - Rotate Stripe API keys and Daily.co API tokens if telemetry or logs suggest compromise.
2. **Isolate Compromised Systems**:
   - If a specific endpoint or API route is leaking data, block the route via Vercel Edge Middleware / Cloudflare WAF rule immediately.
   - Set practice platform to Maintenance Mode if database integrity is uncertain.
3. **Preserve Forensic Evidence**:
   - Do NOT delete database audit logs, access logs, or Vercel runtime logs.
   - Download raw access logs and query history for the preceding 72 hours for forensic analysis.

### Phase 2: Assess Risk of Serious Harm (Hours 2 – 48)

Luke Piatti conducts a formal impact assessment using the OAIC Risk Assessment Framework:

1. **Information Exfiltrated**:
   - Were clinical notes exposed? (`mmh_clinical_notes`, `mmh_clinical_note_addenda`)
   - Were intake psychiatric/medication records exposed? (`mmh_client_intakes`)
   - Were psychometric scores exposed? (`mmh_form_assignments`)
   - Was client contact info exposed? (`mmh_appointments`)
2. **Remedial Action Evaluation**:
   - Can remedial action prevent serious harm before data is viewed (e.g. Remote wipe, encryption key revocation)?
   - If yes and serious harm is prevented, breach notification is not required under Section 26WF.
3. **Determination**:
   - If risk of serious harm remains likely: proceed immediately to Phase 3.

### Phase 3: Statutory Notification (Target: Within 72 Hours)

#### A. Notify the Australian Information Commissioner (OAIC)
- Submit an official **Notifiable Data Breach Statement** to the OAIC online:  
  **URL**: `https://forms.business.gov.au/smartforms/landing.open?formId=oaic-ndb`  
  **Telephone**: 1300 363 992  
- Statement contents:
  1. Practice identity and contact: Mighty Mental Health, Luke Piatti (`luke@mightymentalhealth.com.au`, 0400 000 000).
  2. Description of the breach: Date, discovery time, and technical circumstances.
  3. Information categories involved: Health information, clinical notes, contact details.
  4. Recommended steps for affected individuals to protect themselves.

#### B. Notify Affected Clients Directly
- Send personalized, trauma-informed notification via secure email/registered phone call to each affected client.
- Avoid technical jargon. Provide clear, supportive guidance and offer dedicated support consultations.
- Notification template:
  > *"Dear [Client Name],  
  > We are writing to inform you of a confidential security incident at Mighty Mental Health regarding private health records. Protecting your privacy is fundamental to our therapeutic relationship. We detected unauthorized access affecting [describe records]. We have contained the incident, secured all systems, and reported the matter to the Office of the Australian Information Commissioner. [Steps taken and direct contact details]. If you are experiencing distress, please reach out to Luke directly or contact Lifeline on 13 11 14."*

#### C. Professional Indemnity & PACFA Notification
- Notify professional indemnity medical defense insurer within 24 hours of suspected breach.
- Notify PACFA (Psychotherapy and Counselling Federation of Australia) Ethics Committee: `admin@pacfa.org.au`.

### Phase 4: Review and Post-Incident Remediation

1. Conduct root-cause technical post-mortem:
   - Identify whether vulnerability arose from RLS configuration, dependency compromise, or endpoint misconfiguration.
2. Implement architectural fixes and run comprehensive security scan:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
3. Update practice risk register and document incident in secure offline compliance archive.
