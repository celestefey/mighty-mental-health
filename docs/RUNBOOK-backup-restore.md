# SRE Runbook: Point-In-Time Backup & Disaster Recovery (PITR)
**Practice**: Mighty Mental Health (Logan Central, QLD, Australia)  
**Clinician / System Owner**: Luke Piatti (MCouns, UQ; PACFA Reg. #28941)  
**Target RPO (Recovery Point Objective)**: < 1 hour (Write-Ahead Logging / Continuous Archiving)  
**Target RTO (Recovery Time Objective)**: < 4 hours (Service Restoration & Integrity Verification)  
**Compliance Standard**: Australian Privacy Principle 11 (Security of Personal & Health Information)

---

## 1. Backup Architecture Overview

Clinical practice health information is hosted within an isolated Supabase PostgreSQL instance (Sydney `ap-southeast-2` AWS region for Australian data residency).

### Continuous & Scheduled Backups
1. **Continuous Write-Ahead Logging (WAL)**:
   - Every transaction (appointments, clinical notes, intakes, screener submissions) is continuously written to WAL.
   - Enables Point-In-Time Recovery to any specific second within the last 7 days.
2. **Automated Daily Physical Snapshots**:
   - Executed daily at 03:00 AEST (UTC+10).
   - Retained for 30 rolling days in encrypted cloud storage (AES-256).
3. **Monthly Offline Practice Archive**:
   - On the first calendar day of each month, Luke downloads a cryptographically sealed schema + data dump for cold storage retention compliant with the 7-year health record retention mandate.

---

## 2. Emergency Disaster Recovery Procedures

### Scenario A: Accidental Data Corruption or Malicious Deletion

If data is corrupted or accidentally deleted (e.g., unintended mass record modification):

#### Step 1: Immediate Blast Radius Containment
1. Temporarily enable Maintenance Mode or restrict public access in Vercel / Edge proxy:
   ```bash
   # Route traffic to maintenance screen
   vercel env add NEXT_PUBLIC_MAINTENANCE_MODE true production
   ```
2. Identify the exact UTC / AEST timestamp of the incident event from the Supabase Audit Log:
   `Dashboard -> Database -> Logs -> Postgres Logs`

#### Step 2: Point-In-Time Recovery via Supabase Console
1. Navigate to `Database -> Backups -> Point in Time Recovery (PITR)`.
2. Select **Restore to a point in time**.
3. Specify the recovery timestamp exactly **2 minutes prior** to the incident timestamp.
4. Select target:
   - For complete instance restore: Restore directly to production instance.
   - For forensic audit/data extraction: Restore to an isolated staging branch (`recovery-audit-YYYYMMDD`).

#### Step 3: Command-Line Manual Dump & Restore (Supabase CLI)

To manually backup or restore locally:
```bash
# 1. Export schema and encrypted data
supabase db dump --data-only -f backup_data_$(date +%Y%m%d_%H%M%S).sql

# 2. Export full schema
supabase db dump -f backup_schema_$(date +%Y%m%d_%H%M%S).sql

# 3. Restore to target PostgreSQL instance
psql -h <host> -U postgres -d postgres -f backup_schema.sql
psql -h <host> -U postgres -d postgres -f backup_data.sql
```

---

## 3. Post-Recovery Verification Checklist

Before taking the clinic platform back online:

- [ ] **Table Row Counts**: Verify row counts match pre-incident metrics across `mmh_appointments`, `mmh_client_intakes`, `mmh_form_assignments`, and `mmh_clinical_notes`.
- [ ] **Append-Only Addenda Check**: Verify all records in `mmh_clinical_note_addenda` retain chronological ordering and note references.
- [ ] **RLS Policy Integrity**:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'mmh_%';
  ```
  Ensure all tables show `rowsecurity = true`.
- [ ] **Temporal GiST Exclusion Constraint**:
  ```sql
  SELECT conname, contype FROM pg_constraint WHERE conname = 'no_overlapping_sessions';
  ```
- [ ] **Application Health Check**: Run end-to-end booking verification and admin portal authentication test.

---

## 4. Disaster Recovery Drill Schedule

| Drill Type | Frequency | Last Executed | Responsible |
|------------|-----------|---------------|-------------|
| Table dump verification | Monthly (1st) | October 2026 | Luke Piatti |
| PITR Branch Restore Test | Semi-annual | October 2026 | Luke Piatti |
| Disaster Runbook Review | Annual | October 2026 | Luke Piatti |
