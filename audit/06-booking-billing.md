# Area F: Booking, Payments & Billing Audit

**Reviewer:** Senior Full-Stack Engineer & FinTech Specialist  
**Artifact:** `./audit/06-booking-billing.md`  
**Finding Severity:** HIGH (P1)

---

## 1. Booking Architecture & Silent Failure Bug

**Location:** `src/components/booking/ValidatedBookingForm.tsx:83-137`

```typescript
const { data, error } = await supabase
  .from('mmh_appointments')
  .insert({ ... })
  .select()
  .single();

// 2. Fire Antigravity marketing automation webhook
try {
  await fetch('/api/webhooks/booking', { ... });
} catch (err) {
  console.warn('Webhook logging note:', err);
}

setIsSubmitting(false);
onSuccess(data || {
  client_name: values.clientName,
  service_title: selectedService.title,
  scheduled_at: scheduledDateTime,
  telehealth_room_id: roomId,
});
```

### Critical Flaws:
1. **Silent Failure on Error:** If Supabase returns an error (network outage, RLS rejection, schema constraint), `data` is `null` and `error` is populated. The code **never checks `if (error)`**. Instead, it executes: `onSuccess(data || { ... })`.  
   The client receives a celebratory confirmation screen: *"Booking Confirmed! You are booked with Luke Piatti"*, while the database holds **zero record of the booking**. The patient arrives for a session that Luke does not know exists.
2. **Double-Booking & Race Conditions:**  
   There is no PostgreSQL `EXCLUDE` constraint, database locking, or server-side slot check. Two clients can simultaneously book the exact same clinician slot.
3. **Timezone Misparsing (AEST vs Client Local Time):**  
   The booking string is created via: `new Date(\`${selectedDate} ${selectedTime}\`).toISOString()`. In JavaScript, date strings without explicit timezone offsets parse in the **browser's local time**. If a client in Perth (UTC+8) books "10:00 AM", it translates to 12:00 PM Brisbane (AEST, UTC+10). The appointment is recorded at the wrong time.
4. **Cal.com vs Native Booking Disconnect:**  
   The site features both a native booking modal (`ValidatedBookingForm.tsx`) and an embedded Cal.com iframe (`CalBookingEmbed.tsx`). The two systems do not sync. A booking made in the native modal does not block Cal.com calendar availability, creating inevitable scheduling conflicts.

---

## 2. Payments, Invoicing & Stripe Reality Check

### 1. Zero Payment Processing Implementation
- **Claim:** The website implies online payments and automated invoicing.
- **Reality:** A search across the entire codebase reveals **zero Stripe SDK imports, zero PayPal/Square integration, and zero payment intents**.
- Payments exist only as static text copy and mock seed entries in `handleSeedDemoData` (`src/app/admin/page.tsx:920`).

### 2. Invoicing Compliance (Australian Tax Law)
- In Australia, health services provided by counsellors are generally **GST-free** under Section 38-10 of the *A New Tax System (Goods and Services Tax) Act 1999* if the counsellor is a recognised professional and the treatment is generally accepted as being necessary for the appropriate treatment of the recipient.
- The demo invoices set `gst_cents: 0` (`schema.sql:96`), which is correct, but there is no engine to generate, issue, or email real Australian Compliant Tax Invoices.

---

## 3. Required Specification for Fix (Area F)

1. **Fix Silent Failure Bug Immediately:**
   ```typescript
   if (error) {
     setIsSubmitting(false);
     setErrorMessage('Unable to reserve appointment. Please try again or call the clinic.');
     return;
   }
   ```
2. **Implement Server-Side Booking Slot Validation:**
   Move booking submission to a Next.js Server Action with an explicit conflict check:
   ```sql
   ALTER TABLE public.mmh_appointments 
   ADD CONSTRAINT no_double_booking 
   EXCLUDE USING gist (scheduled_at WITH =, duration_minutes WITH =);
   ```
3. **Explicit Timezone Offset:**
   Anchor all calendar slots to Australian Eastern Standard Time (`Australia/Brisbane`, UTC+10, no Daylight Saving Time).
4. **Choose Single Source of Truth:**
   Either deprecate the native booking form in favor of Cal.com's hosted webhooks (with Stripe integration), or build a complete native booking engine with Stripe Checkout integration.
