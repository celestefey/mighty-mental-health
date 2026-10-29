# Area G: Clinical Notes, Records & Medical Correspondence Audit

**Reviewer:** Senior Health Informatics Specialist & Medico-Legal Reviewer  
**Artifact:** `./audit/07-records.md`  
**Finding Severity:** HIGH (P1)

---

## 1. Clinical Note Immutability & "Locking" Flaw

Under PACFA Documentation Guidelines and Australian Medico-Legal standards, clinical notes must be contemporaneous, tamper-evident, and immutable once finalized and signed. If a correction is made to a finalized clinical record, the original entry must remain legible, with an addendum noting the date, time, and reason for alteration.

### Technical Analysis:
1. **The "Lock" is a Client-Side Illusion:**  
   In `src/app/admin/page.tsx:2321-2350`, the UI displays a badge `Locked & Signed` (`is_locked: true`). However, in `supabase/schema.sql:164`:
   ```sql
   CREATE POLICY "Clinical notes update" ON public.mmh_clinical_notes FOR UPDATE USING (true);
   ```
   There is **no PostgreSQL trigger or check constraint** preventing updates to locked notes. Any client can issue an `UPDATE` mutation to change the clinical text of a "locked" note at any time.
2. **Zero Audit History / Versioning:**  
   The `mmh_clinical_notes` table contains only `updated_at`. When a note is modified, the previous text is permanently overwritten. No revision history, snapshot diffs, or author logs are recorded.

---

## 2. GP Medical Letters & Correspondence

**Location:** `src/lib/clinicalTemplates.ts:167-258` and `src/app/admin/page.tsx:443-470`

### 1. Regulatory Accuracy of Generated Letters
The GP letter generation engine (`generateGpLetter`) generates comprehensive RACGP-style clinical summaries. However, it contains regulatory misrepresentations:
- Line 238: Recommends re-referral under the *"Better Access / Mental Health Care Plan framework"*.
- **Medico-Legal Risk:** A receiving GP will recognize that Medicare Better Access re-referrals cannot be made to a counsellor. This undermines Luke's professional credibility with local GPs in Logan Central and Springwood. The letter must instead recommend ongoing care under private health insurance, NDIS, or private billing.

### 2. Export & Print Window Security
The print window renders via `printWindow.document.write` (`src/app/admin/page.tsx:456`) without HTML entity encoding, creating the stored DOM-XSS vulnerability identified in Area D.

---

## 3. Continuity of Care & Incapacity Protocol

In solo allied health practice, ethical guidelines (PACFA Code of Ethics Section 5) require a "Clinical Will" or continuity protocol if the practitioner becomes suddenly incapacitated or deceased.
- Currently, all data access relies on a single login (`luke@mightymentalhealth.com.au`).
- There is no delegated supervisor emergency unlock or designated custodian access path.

---

## 4. Required Specification for Fix (Area G)

1. **Postgres Trigger for Note Immutability:**
   ```sql
   CREATE OR REPLACE FUNCTION prevent_locked_note_mutation()
   RETURNS TRIGGER AS $$
   BEGIN
       IF OLD.is_locked = true THEN
           RAISE EXCEPTION 'Cannot modify a finalized and locked clinical note.';
       END IF;
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER trg_lock_clinical_notes
   BEFORE UPDATE OR DELETE ON public.mmh_clinical_notes
   FOR EACH ROW EXECUTE FUNCTION prevent_locked_note_mutation();
   ```
2. **Clinical Addendum Pattern:**
   Instead of editing locked notes, provide an `Add Clinical Addendum` feature that appends timestamped entries to a separate `mmh_clinical_addenda` table.
3. **Correct GP Letter Template:**
   Update `src/lib/clinicalTemplates.ts` to state: *"I recommend a continued course of exercise-integrated psychotherapy under private billing / private health fund arrangements."*
