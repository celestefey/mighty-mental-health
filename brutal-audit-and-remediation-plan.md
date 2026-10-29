# Brutal Platform Audit & Remediation Plan (APPROVED)

> **Standard**: Production Clinical Grade (PACFA Code of Ethics, Australian Privacy Principles, WCAG 2.1 AA).
> **Approved Decisions**:
> - **P0 (Auth)**: Option B — Supabase Auth (Email + Password / Magic Link) for `/admin` and `/portal`.
> - **P1 (Credentials)**: Option 2 — **Luke Piatti (MCouns, UQ; PACFA Reg. #28941)** titled as **"Exercise-Integrated Counsellor"**, framing therapy around gym workouts, physical training, and active exercise without claiming unheld PT quals.
> - **P2 (FAQ/Contact)**: Option A — Side-by-Side 2-Column Split (Left: Categorized compact FAQ, Right: Direct Contact Form).
> - **Print Engine**: Formal RACGP/PACFA Australian clinical letterhead with clinic header, two-column patient/GP metadata grid, and print-ready CSS.
> - **Accessibility**: Remediate 28 color contrast violations, timezone select label, and heading order identified via Chrome DevTools.

---

## Remediation Tasks

- [ ] **Task 1: Credential & Clinician Identity Overhaul**
  - Scrub all instances of *"Certified Movement Coach"* and *"Certified Fitness Coach"*.
  - Update clinician identity to **Luke Piatti (MCouns, UQ; PACFA Reg. #28941)**.
  - Implement the **"Exercise-Integrated Counsellor"** framing: emphasize structured physical exercise, gym-based workouts, resistance/weight training, and active movement as therapeutic tools under PACFA scope.
  - Files: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/contact/page.tsx`, `src/app/telehealth/[roomId]/page.tsx`, `src/lib/clinicalTemplates.ts`, `BRAND_GUIDELINES.md`.

- [ ] **Task 2: Chrome DevTools Accessibility Remediations**
  - Remediate 28 color contrast violations: update Cadmium Orange `#F96100` on light backgrounds (3.11:1) to high-contrast burnt amber `#BA3D00` (>4.5:1), and darken light gray helper text.
  - Add explicit `<label>` and `aria-label` to the timezone selector in the booking calendar.
  - Fix heading hierarchy skips (`h1` -> `h2` -> `h3` -> `h4`).

- [ ] **Task 3: Landing Page Side-by-Side 2-Column Layout (FAQ & Contact)**
  - Re-engineer the FAQ and Contact sections into a balanced 2-column grid.
  - Left column: Compact, categorized FAQ with topic tabs (`All`, `Exercise & Therapy`, `Fees & Rebates`, `Telehealth`).
  - Right column: High-converting, sticky direct contact form accessible without vertical scroll drag.

- [ ] **Task 4: Professional RACGP Standard GP Letterhead & Print Engine**
  - Overhaul `handlePrintGpLetter` in `src/app/admin/page.tsx`.
  - Implement full clinical letterhead: Practice Header, Luke Piatti's credentials, Logan QLD clinic details, structured two-column Patient & Referring GP metadata grid, and formal clinician signature sign-off.
  - Add print-specific CSS (`@media print`) ensuring exact 15mm margins, clean typography, and zero browser URL clutter.

- [ ] **Task 5: Supabase Authentication Barrier for `/admin` & `/portal`**
  - Implement Supabase Auth login barrier for `/admin`: require email/password or magic link authentication before granting access to patient EHR notes.
  - Implement Supabase Auth client gate for `/portal`: replace hardcoded `sarah.jenkins@example.com` with authenticated client session.

- [ ] **Task 6: Dynamic Context-Aware Guidance in Client Portal**
  - Replace the static *"Remember to complete your assigned DASS-21"* card with dynamic status-aware logic (Intake Pending vs. Session Prep with comfortable movement attire vs. Post-Session health rebate receipts).

- [ ] **Task 7: Verification & DevTools Re-Audit**
  - Build check (`npm run build`).
  - Chrome DevTools Lighthouse accessibility re-run to confirm score improvement.
