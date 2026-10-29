# Phase 3: Reconciliation with Prior External Review Findings

**Reviewer:** Lead Audit Panel Coordinator  
**Artifact:** `./audit/95-reconciliation.md`  
**Reconciliation Source:** External Claude Security & Architecture Audit (Transcribed from User Submission)

---

## Reconciliation Summary Table

Every finding from the prior review was independently re-tested against the local codebase.

| Prior Finding (Claude Audit) | Verification Status | Fresh Codebase Evidence (File:Line) | Notes / Severity |
| :--- | :--- | :--- | :--- |
| **1. Database RLS open (`USING (true)`) on all tables** | **CONFIRMED** | `supabase/schema.sql:140-169` configures `USING (true)` and `WITH CHECK (true)` across all 7 tables. | **Critical (P0)**: Public anon key has full read/write access. |
| **2. Supabase URL & anon key hardcoded in `supabase.ts`** | **CONFIRMED** | `src/lib/supabase.ts:3-4` contains hardcoded project URL and JWT anon token fallback. | **High (P1)**: Bypasses environment variable isolation. |
| **3. Note "lock" is just an unenforced boolean** | **CONFIRMED** | `supabase/schema.sql:79` (`is_locked BOOLEAN DEFAULT false`). No Postgres trigger blocks updates. | **High (P1)**: Notes can be overwritten post-locking. |
| **4. `/admin` client-side only gate & Fast-Unlock bypass** | **CONFIRMED** | `src/app/admin/page.tsx:199-209` (`handleClinicianBypass`) and `page.tsx:1120-1130` (Fast-Unlock UI button). | **Critical (P0)**: Backdoor bypasses all authentication. |
| **5. Magic link grants admin to any registered user** | **CONFIRMED** | `src/app/admin/page.tsx:133` (`if (existingSession) loadAllAdminData()`). Zero check on user email or role. | **Critical (P0)**: Any external email gets clinician console. |
| **6. `/portal` persona switcher & arbitrary email lookup** | **CONFIRMED** | `src/app/portal/page.tsx:162-180`. Text input filters client-side by arbitrary email string. | **Critical (P0)**: Client data enumeration. |
| **7. Risk alert triggered client-side; dropped on disconnect** | **CONFIRMED** | `src/app/screeners/[assignmentId]/page.tsx:151`. Alert is an async client fetch after DB write. | **Critical (P0)**: Missed suicide risk alerts. |
| **8. Open `/api/alerts/clinician` endpoint; echoes PII** | **CONFIRMED** | `src/app/api/alerts/clinician/route.ts:3-73`. Unauthenticated POST, returns client name/email. | **High (P1)**: Spoofing and alert flooding hazard. |
| **9. False alert success (`alert_dispatched: true`)** | **CONFIRMED** | `src/app/api/alerts/clinician/route.ts:63`. Returns true even if webhook env var is empty. | **High (P1)**: False sense of safety. |
| **10. Clinical data piped to marketing webhook** | **CONFIRMED** | `src/app/api/webhooks/intake/route.ts:18-49` and `booking/route.ts:39-46`. Sends PII + health scores + UTM tags to `ANTIGRAVITY_MARKETING_WEBHOOK_URL`. | **Critical (P0)**: Direct Privacy Act 1988 (APP 6) breach. |
| **11. Telehealth is fake (local webcam only, local chat)** | **CONFIRMED** | `src/app/telehealth/[roomId]/page.tsx:96, 148`. Local `getUserMedia` to single `<video>`; local React state chat. | **Critical (P0)**: Non-functional video layer. |
| **12. Telehealth role from URL (`?role=clinician`)** | **CONFIRMED** | `src/app/telehealth/[roomId]/page.tsx:81`. Query parameter controls clinician workbench. | **Critical (P0)**: Unauthorized workbench access. |
| **13. Missing room ID loads most recent appointment of ANY client** | **CONFIRMED** | `src/app/telehealth/[roomId]/page.tsx:191-199`. Explicit `SELECT ... LIMIT 1` fallback on invalid room. | **Critical (P0)**: Active data leak hazard. |
| **14. PostgREST filter string interpolation (`roomId`)** | **CONFIRMED** | `src/app/telehealth/[roomId]/page.tsx:185`. Template literal interpolation without regex validation. | **High (P1)**: Potential PostgREST filter tampering. |
| **15. Unimplemented claims: "256-bit AES", "cryptographically locked"** | **CONFIRMED** | `src/app/telehealth/[roomId]/page.tsx:97`, `supabase/schema.sql:68`. | **Medium (P2)**: Misleading marketing/technical copy. |
| **16. "Medicare Better Access" rebate claims** | **CONFIRMED** | `src/lib/clinicalTemplates.ts:172, 238`. Recommends re-referral under Better Access framework. | **Critical (Regulatory)**: PACFA counsellors cannot claim Medicare Better Access. |
| **17. Booking fails silently; double-booking possible** | **CONFIRMED** | `src/components/booking/ValidatedBookingForm.tsx:104, 135`. Supabase insert error is ignored; no DB lock. | **High (P1)**: Missed patient consultations. |
| **18. Payments, invoices & email do not exist in code** | **CONFIRMED** | `package.json` contains no email or payment libraries. Stripe exists only in copy; invoices only in demo seeds. | **High (P1)**: Non-functional billing infrastructure. |
| **19. Missing `next.config` security headers & CSP** | **CONFIRMED** | No `next.config.ts` or `next.config.js` exists in repository root. | **High (P1)**: Clickjacking & XSS risk. |
| **20. Missing `robots.txt` / private routes indexed** | **CONFIRMED** | No `robots.txt` or `robots.ts` exists. `src/app/layout.tsx:25` applies `index: true` globally. | **High (P1)**: Search engines can index private routes. |
| **21. Missing automated tests and CI pipeline** | **CONFIRMED** | `package.json:11` test script is `echo "Tests completed."`. No `.github/` workflow. | **High (P1)**: Unverified scoring and regressions. |
| **22. Placeholder phone `+61 412 345 678` in JSON-LD** | **CONFIRMED** | `src/app/layout.tsx:70`. Synthetic demo phone number published in production schema. | **Low (P3)**: Inaccurate search engine metadata. |
| **23. Stored DOM-XSS via GP Letter `document.write`** | **CONFIRMED** | `src/app/admin/page.tsx:456`. Unescaped template string injected directly into new window document. | **Critical (P0)**: Arbitrary script execution in admin. |
| **24. Missing screener answers score silently as 0 (1 for K10)** | **CONFIRMED** | `src/lib/scoring.ts:73, 116`. Missing items coerced to `0` or `1`. Zero completeness validation. | **Critical (P0)**: Incomplete screeners misdiagnose severity. |
| **25. Intake form has 17 labels with no `htmlFor`** | **CONFIRMED** | `src/app/intake/page.tsx:267-330`. Labels lack `htmlFor`, inputs lack `id`. | **Medium (P2)**: WCAG 2.2 Level A failure. |

---

## What the Prior Audit Missed (Fresh Findings from Our Review):

1. **TypeScript Build Compilation Failure in Turbopack:**  
   Running `npm run build` currently fails with 9 TypeScript errors in `src/components/admin/ClientChartDossier.tsx` (`traj.deltas.depression is possibly undefined`). The build does not pass cleanly without type assertions.
2. **Timezone Offset Distortion on Booking:**  
   `new Date(\`${selectedDate} ${selectedTime}\`).toISOString()` in `ValidatedBookingForm.tsx:80` parses in the **client's local browser timezone** rather than `Australia/Brisbane` (AEST, UTC+10). Interstate clients in AWST or ACDT book appointments offset by 1.5 to 2 hours.
3. **Cal.com vs Native Booking Database Conflict:**  
   Native booking inserts into Supabase, but does not block Cal.com availability. The two booking pathways will cause client double-bookings.
4. **Absence of Trauma-Informed Quick Exit Button:**  
   Neither `/intake` nor `/screeners` includes a rapid safe-exit button for clients in vulnerable or domestic violence environments.
