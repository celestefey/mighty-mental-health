# Area A: Authorization & Access Control Audit

**Reviewer:** Senior Application Security Engineer & Supabase/Postgres RLS Specialist  
**Artifact:** `./audit/01-auth.md`  
**Finding Severity:** CRITICAL (P0)

---

## 1. Trace of Read / Write Paths to Supabase

Every data transaction in the current application executes from the browser client via `@supabase/supabase-js` using the public anonymous key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).

| Path | Initiator | Target Table | Current Enforcement | Risk |
| :--- | :--- | :--- | :--- | :--- |
| `src/app/intake/page.tsx:442` | Anonymous Client | `mmh_client_intakes` | `INSERT WITH CHECK (true)` | Open public insert (intended for intake, but lacks rate limiting or captcha). |
| `src/app/admin/page.tsx:218` | Browser Component | `mmh_appointments`, `mmh_forms`, `mmh_form_assignments`, `mmh_clinical_notes`, `mmh_client_intakes` | `SELECT USING (true)` on all tables | **Zero database authorization.** Any client can execute these identical queries from developer tools. |
| `src/app/portal/page.tsx:162` | Browser Component | `mmh_appointments`, `mmh_form_assignments`, `mmh_invoices` | Filtered by `.eq('client_email', userEmail)` in JavaScript query | **Client-side only filter.** Database allows `SELECT *` without the email filter. |
| `src/app/telehealth/[roomId]/page.tsx:182` | Browser Component | `mmh_appointments`, `mmh_forms`, `mmh_form_assignments`, `mmh_clinical_notes` | Filtered by `.or(\`telehealth_room_id.eq.${roomId},id.eq.${roomId}\`)` | **Dangerous fallback** loads arbitrary client appointment if room ID fails (`page.tsx:192-198`). |
| `src/app/admin/page.tsx:242` | Browser Component | `mmh_forms` | `ALL USING (true)` | Anonymous internet users can modify, deface, or delete clinical screening questions and scoring logic. |

---

## 2. Table-by-Table RLS Policy Breakdown (`supabase/schema.sql`)

The database enables Row-Level Security via `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`, but **every single policy is configured with `USING (true)` or `WITH CHECK (true)`**, rendering RLS completely ineffective.

```sql
-- Evidence from supabase/schema.sql lines 140-169:

-- Intakes policies
CREATE POLICY "Public insert intakes" ON public.mmh_client_intakes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read intakes" ON public.mmh_client_intakes FOR SELECT USING (true);
CREATE POLICY "Allow delete demo intakes" ON public.mmh_client_intakes FOR DELETE TO public USING (is_demo = true);

-- Form library policies
CREATE POLICY "Public read forms" ON public.mmh_forms FOR SELECT USING (true);
CREATE POLICY "Public modify forms" ON public.mmh_forms FOR ALL USING (true);

-- Appointment policies
CREATE POLICY "Allow appointment booking" ON public.mmh_appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow appointment read" ON public.mmh_appointments FOR SELECT USING (true);
CREATE POLICY "Allow appointment update" ON public.mmh_appointments FOR UPDATE USING (true);

-- Form assignments policies
CREATE POLICY "Form assignments read" ON public.mmh_form_assignments FOR SELECT USING (true);
CREATE POLICY "Form assignments insert" ON public.mmh_form_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Form assignments update" ON public.mmh_form_assignments FOR UPDATE USING (true);

-- Clinical notes policies (Clinician only)
CREATE POLICY "Clinical notes read" ON public.mmh_clinical_notes FOR SELECT USING (true);
CREATE POLICY "Clinical notes insert" ON public.mmh_clinical_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Clinical notes update" ON public.mmh_clinical_notes FOR UPDATE USING (true);

-- Invoices policies
CREATE POLICY "Invoices read" ON public.mmh_invoices FOR SELECT USING (true);
CREATE POLICY "Invoices insert" ON public.mmh_invoices FOR INSERT WITH CHECK (true);
```

### Exploit Demonstration (What any visitor can do right now):

An attacker opens the developer console on `https://mighty-mental-health.vercel.app` or runs a simple curl command using the hardcoded anon key:

```javascript
// EXPLOIT 1: Dump all clinical notes and psychiatric histories
const { data: allNotes } = await supabase.from('mmh_clinical_notes').select('*');
console.log(allNotes); // Returns every patient SOAP note, assessment, and trauma history.

// EXPLOIT 2: Dump all client intake forms (medications, addresses, suicide risk)
const { data: allIntakes } = await supabase.from('mmh_client_intakes').select('*');
console.log(allIntakes); // Returns home addresses, mobile numbers, medications, and safety flags.

// EXPLOIT 3: Arbitrary Deletion Loophole (The is_demo bypass)
// The policy allows DELETE if is_demo = true:
// "Allow delete demo intakes" USING (is_demo = true);
// Because UPDATE has USING (true), an attacker first flips is_demo to true on REAL client data:
await supabase.from('mmh_client_intakes').update({ is_demo: true }).eq('id', targetRealClientId);
// Then deletes the record:
await supabase.from('mmh_client_intakes').delete().eq('id', targetRealClientId);
```

---

## 3. Authentication & Role Model Flaws

### 1. Client-Side Only Admin Gate
In `src/app/admin/page.tsx:128-152`:
- Authentication state is evaluated solely inside a React `useEffect` in the browser.
- There is no server-side route handler, Next.js Middleware, or layout barrier.
- An attacker can inspect the client bundle, inspect the page DOM, or bypass state checks.

### 2. The "Clinician Fast-Unlock" Backdoor
In `src/app/admin/page.tsx:199-209`:
```typescript
async function handleClinicianBypass() {
  const mockSession = {
    user: {
      id: 'clinician-luke-piatti',
      email: 'luke@mightymentalhealth.com.au',
      user_metadata: { name: 'Luke Piatti', role: 'clinician' }
    }
  };
  setSession(mockSession);
  loadAllAdminData();
}
```
**Evidence:** A button labeled *"Clinician Fast-Unlock (Demo Access)"* exists directly on `/admin` (`page.tsx:1120-1130`). Clicking it creates a fabricated JavaScript object and immediately calls `loadAllAdminData()`. Because Supabase RLS is `USING (true)`, this mock session successfully fetches the entire practice database.

### 3. Magic Link Privilege Escalation (No Role Check)
In `src/app/admin/page.tsx:176-197`:
- If an arbitrary user enters their own email into the login form and clicks "Send Magic Access Link", Supabase generates an OTP.
- When the user clicks the magic link, `supabase.auth.getSession()` returns a valid authenticated session for that email.
- The admin dashboard code checks `if (existingSession) { loadAllAdminData(); }` without verifying whether `session.user.email` matches Luke Piatti or has a verified `clinician` role in `app_metadata`. Any registered user is immediately granted full access to the clinician console.

### 4. Portal Client Impersonation
In `src/app/portal/page.tsx`:
- The client portal contains persona switching buttons (`Sarah Jenkins`, `Marcus Vance`).
- The portal has a manual text input allowing any user to type an arbitrary email address and view all appointments, screener assignments, and billing records for that email address.

---

## 4. Route Protection & Middleware Evaluation

| Route | Middleware Guard | Server-Side Validation | Status |
| :--- | :--- | :--- | :--- |
| `/admin` | **NONE** (`middleware.ts` does not exist) | None. Client-side state only. | **CRITICAL FAILURE** |
| `/portal` | **NONE** | None. Client-side state only. | **CRITICAL FAILURE** |
| `/telehealth/[roomId]` | **NONE** | None. Reads `?role=clinician` from URL (`page.tsx:81`). | **CRITICAL FAILURE** |
| `/screeners/[assignmentId]`| **NONE** | None. Assignment ID is guessable/enumerable. | **HIGH FAILURE** |
| `/api/alerts/clinician` | **NONE** | None. Unauthenticated public POST endpoint. | **CRITICAL FAILURE** |

---

## 5. Required Specification for Fix (Area A)

1. **Delete all `USING (true)` policies in `supabase/schema.sql`**:
   - Create a dedicated PostgreSQL role or custom claim: `auth.jwt() ->> 'role' = 'clinician'`.
   - `mmh_clinical_notes`: Restrict `SELECT, INSERT, UPDATE, DELETE` to clinician only.
   - `mmh_client_intakes`: Restrict `SELECT, UPDATE, DELETE` to clinician, or client where `auth.email() = client_email`.
   - `mmh_appointments` & `mmh_form_assignments`: Restrict `SELECT` to `auth.email() = client_email` OR clinician.
2. **Implement Next.js Middleware (`middleware.ts`)**:
   - Inspect Supabase session cookies server-side using `@supabase/ssr`.
   - If path starts with `/admin`, verify `user.email === 'luke@mightymentalhealth.com.au'` AND `app_metadata.role === 'clinician'`. Redirect any other user to `/admin/login`.
   - If path starts with `/portal`, ensure user is authenticated.
3. **Purge Backdoors**:
   - Delete `handleClinicianBypass` and the "Clinician Fast-Unlock" UI button from `src/app/admin/page.tsx`.
   - Delete persona-switching and arbitrary email lookup inputs from `src/app/portal/page.tsx`.
