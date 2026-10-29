# Australian Clinical Practice Compliance & Record Retention Policy
**Practice**: Mighty Mental Health  
**Principal Clinician**: Luke Piatti (Master of Counselling, University of Queensland; PACFA Reg. #28941)  
**Location**: Logan Central, QLD, Australia (Serving clients in-person and nationally via Telehealth)  
**Governing Bodies**: 
- Psychotherapy and Counselling Federation of Australia (PACFA)
- Office of the Australian Information Commissioner (OAIC)
- Australian Taxation Office (ATO)

---

## 1. PACFA Code of Ethics (2020) & Statutory Alignment

As a Registered Clinical Counsellor with PACFA, Luke Piatti adheres strictly to the **PACFA Code of Ethics (2020)**:

### Section 5: Confidentiality & Record Keeping
1. **Clinical Records Ownership & Security**:
   - Clinical notes, psychometric evaluations, and intake documentation must be maintained in a secure, encrypted system with access strictly limited to the treating clinician.
   - Access controls in the practice database enforce that only Luke Piatti (authenticated via multi-factor authentication) or the database service role can access progress notes.
2. **Immutable Clinical Records & Append-Only Amendments**:
   - Medical defense standards and PACFA ethics prohibit overwriting or deleting signed clinical progress notes.
   - Any modifications, retrospective notes, or clarifications must be appended as permanent, immutable addenda (`mmh_clinical_note_addenda`) with timestamp and explicit clinical rationale.
3. **Duty of Care & Confidentiality Limits**:
   - Confidentiality is paramount, but legally and ethically limited when:
     - There is imminent, serious risk of harm to the client or others;
     - There is child abuse or neglect reported (mandatory reporting under Queensland child protection legislation);
     - Compelled by subpoena or court order from an Australian court of competent jurisdiction.
   - The platform includes automated crisis interceptors (Item 9 PHQ-9) providing immediate 24/7 crisis service contact details (`000`, `13 11 14`, `1300 659 467`).

---

## 2. Statutory Health Record Retention Periods

In accordance with Queensland Health (Information Access and Privacy) standards and Australian health law:

| Client Category | Mandatory Minimum Retention Period | Statutory Trigger |
|-----------------|-----------------------------------|-------------------|
| **Adult Clients** (>= 18 years at first intake) | **7 years** | From the date of last clinical consultation or record entry |
| **Minor Clients** (< 18 years at intake) | **Until client reaches age 25** (or 7 years from last visit, whichever is longer) | Child reaches age 25 |
| **Deceased Clients** | **7 years** | From date of notification of death |

### Destruction Protocols
At the conclusion of the statutory retention period:
- Electronic health records must be cryptographically sanitized or permanently purged from all primary databases, replicas, and cloud snapshots in accordance with Australian Privacy Principle 11.2.
- Deletion events are recorded in an immutable practice compliance log with date, client ID code, and destruction certification.

---

## 3. Australian Legal Truth & Billing Standards

### Non-Medicare Boundary
- Counsellors and psychotherapists registered with PACFA are currently **not eligible** for provider numbers under the Medicare Better Access initiative (which covers Clinical Psychologists, Registered Psychologists, Social Workers, and Occupational Therapists).
- The platform strictly enforces **zero claims** of Medicare rebates or Bulk Billing.
- All consultations are delivered on a private billing basis.

### Private Health Insurance Rebates
- Luke Piatti holds recognized provider recognition with eligible Australian private health funds that cover PACFA registered counsellors (including **Medibank Private**, **Bupa**, and **ARHG** member funds), subject to the client's individual extras policy.
- Invoices clearly display Luke Piatti's PACFA registration number (`#28941`), practice address, client details, and itemized service descriptions to support client claim submissions.

### Goods and Services Tax (GST) Treatment
Under *A New Tax System (Goods and Services Tax) Act 1999 (Cth)*:
- **Section 38-10 (GST-Free Health Services)**: Professional counselling/psychotherapy sessions delivered by an appropriately qualified practitioner are **GST-free**.
- **Movement Coaching & Physical Conditioning**: Movement conditioning or fitness components attract the standard **10% GST**.
- For combined Somatic Movement Therapy offerings, the platform generates compliant split invoices separating the GST-free psychotherapy component ($110.00) from the taxable movement conditioning component ($50.00 + $5.00 GST = $55.00 inc GST; total $165.00).
