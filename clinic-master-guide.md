# Project Plan: Comprehensive Clinic & Booking Platform Production Implementation
## File: `clinic-master-guide.md`
### Target: Mighty Mental Health (Luke Piatti, MCouns, UQ; PACFA Reg. #28941)
### Specification Reference: `CLINIC_WEB_MASTER_GUIDE_FOR_AI.md` (Version 3.0)
### Full Plan: See `docs/PLAN-clinic-master-guide.md`

---

## Quick Summary & Roadmap

This project plan implements the remaining clinical safety, concurrency defense, financial automation, and infrastructure requirements specified in the **Comprehensive Clinic Website Master Guide (`CLINIC_WEB_MASTER_GUIDE_FOR_AI.md`)**:

1. **Phase P0 (Foundational Database Hardening)**:
   - PostgreSQL `btree_gist` exclusion constraints for concurrency defense (`no_overlapping_sessions`).
   - Append-only clinical note addenda table (`mmh_clinical_note_addenda`) with `FORBID UPDATE/DELETE` triggers.
   - Cryptographic single-use screener tokens (`token_hash`) with expiring `HttpOnly` session cookies.
   - Server-side psychometric scoring RPC (`submit_screener_result`).

2. **Phase P1 (Duty of Care & Financial Automation)**:
   - Duty of Care 13-vector test harness (TV-01 to TV-13) and live PHQ-9 Item 9 suicide interceptor modal.
   - Transactional clinician safety alerts (Twilio SMS / Resend) with local fallback audit logs.
   - Production Stripe Elements integration with split GST tax invoicing (GST-free counselling vs. taxable fitness coaching).

3. **Phase P2 (Healthcare Telehealth & Trauma-Informed UI)**:
   - Commercial WebRTC SFU / TURN integration (Daily.co or LiveKit) with cloud recording permanently disabled.
   - Trauma-informed UI/UX audit: 40/60 whitespace rhythm, earthy palette verification (0% purple), 44×44px touch targets.

4. **Phase P3 (Platform Hardening & SRE Runbooks)**:
   - Cloudflare Turnstile bot protection on `/intake` and booking.
   - Content Security Policy (Report-Only transitioning to Enforced).
   - 18-Point Pre-Launch Gate verification runbook and OAIC Part IIIC data breach incident plan.

---

### Full Details:
For the complete task breakdown with inputs, outputs, verification criteria, and the 18-Point Launch Gate, see:
- [`docs/PLAN-clinic-master-guide.md`](file:///c:/Users/grkga/Documents/antigravity/beautiful-newton/docs/PLAN-clinic-master-guide.md)
