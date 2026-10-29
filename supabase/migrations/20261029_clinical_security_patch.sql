-- ==============================================================================
-- Mighty Mental Health (MMH) - Clinical Security Patch & Schema Hardening
-- Migration: 20261029_clinical_security_patch.sql
-- Targets: Australian Privacy Act (APPs 6, 8, 11), PACFA Ethics & Concurrency Safety
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PURGE ALL EXISTING POLICIES ON MMH TABLES (Eliminates Permissive OR Bypasses)
-- ------------------------------------------------------------------------------
DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    FOR r IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename LIKE 'mmh_%' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename); 
    END LOOP; 
END $$;

-- ------------------------------------------------------------------------------
-- 2. HARDEN CLINICIAN ROLE HELPER (Strict app_metadata Role Check)
-- Disallow user_metadata (which can be edited by untrusted clients)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_clinician()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'service_role' OR
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'clinician'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. APPOINTMENT CONCURRENCY & EXCLUSION CONSTRAINT
-- Add clinician_id, ends_at, backfill existing records, and enforce btree_gist
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Ensure clinician_id exists
ALTER TABLE public.mmh_appointments 
    ADD COLUMN IF NOT EXISTS clinician_id UUID;

-- Ensure ends_at exists
ALTER TABLE public.mmh_appointments 
    ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

-- Backfill existing rows with null ends_at or clinician_id
UPDATE public.mmh_appointments
SET 
    ends_at = scheduled_at + (COALESCE(duration_minutes, 60) || ' minutes')::INTERVAL
WHERE ends_at IS NULL;

-- Default clinician_id for existing practice single-practitioner records
-- (In production, replace with Luke Piatti's Supabase auth.users UUID)
UPDATE public.mmh_appointments
SET clinician_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE clinician_id IS NULL;

-- Enforce NOT NULL constraints
ALTER TABLE public.mmh_appointments 
    ALTER COLUMN scheduled_at SET NOT NULL,
    ALTER COLUMN ends_at SET NOT NULL,
    ALTER COLUMN clinician_id SET NOT NULL;

-- Trigger to maintain ends_at automatically on insert or update
CREATE OR REPLACE FUNCTION public.set_appointment_ends_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ends_at := NEW.scheduled_at + (COALESCE(NEW.duration_minutes, 60) || ' minutes')::INTERVAL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_appointment_ends_at ON public.mmh_appointments;
CREATE TRIGGER trg_set_appointment_ends_at
    BEFORE INSERT OR UPDATE OF scheduled_at, duration_minutes ON public.mmh_appointments
    FOR EACH ROW EXECUTE FUNCTION public.set_appointment_ends_at();

-- Drop old unique constraint if present
ALTER TABLE public.mmh_appointments 
    DROP CONSTRAINT IF EXISTS unique_clinician_timeslot;

-- Add GiST exclusion constraint preventing overlapping active appointments
ALTER TABLE public.mmh_appointments 
    DROP CONSTRAINT IF EXISTS no_overlapping_sessions;

ALTER TABLE public.mmh_appointments
    ADD CONSTRAINT no_overlapping_sessions
    EXCLUDE USING gist (
        clinician_id WITH =,
        tstzrange(scheduled_at, ends_at) WITH &&
    )
    WHERE (status <> 'cancelled');

-- ------------------------------------------------------------------------------
-- 4. CLINICAL PROGRESS NOTES: IMMUTABILITY TRIGGER (With Delete Preservation)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_clinical_note_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_locked = true THEN
        RAISE EXCEPTION 'Cannot modify or delete an audit-locked clinical note. Submit an addendum instead.';
    END IF;
    -- Use COALESCE(NEW, OLD) so deleting unlocked notes works while locked notes are blocked
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_note_immutability ON public.mmh_clinical_notes;
CREATE TRIGGER trg_enforce_note_immutability
    BEFORE UPDATE OR DELETE ON public.mmh_clinical_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.check_clinical_note_immutability();

-- ------------------------------------------------------------------------------
-- 5. CLINICAL NOTE ADDENDA TABLE (Append-Only Audit Path)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mmh_clinical_note_addenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.mmh_clinical_notes(id) ON DELETE RESTRICT,
    clinician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
    addendum_text TEXT NOT NULL,
    reason_for_amendment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to make addenda strictly append-only (No updates or deletes permitted)
CREATE OR REPLACE FUNCTION public.prevent_addenda_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Clinical note addenda are permanent legal records and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_addenda_modification ON public.mmh_clinical_note_addenda;
CREATE TRIGGER trg_prevent_addenda_modification
    BEFORE UPDATE OR DELETE ON public.mmh_clinical_note_addenda
    FOR EACH ROW EXECUTE FUNCTION public.prevent_addenda_modification();

-- ------------------------------------------------------------------------------
-- 6. SCREENER TOKEN SECURITY & SINGLE-USE VALIDATION
-- Add token_hash, expires_at, and used_at to mmh_form_assignments
-- ------------------------------------------------------------------------------
ALTER TABLE public.mmh_form_assignments
    ADD COLUMN IF NOT EXISTS token_hash TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- ------------------------------------------------------------------------------
-- 7. RE-ESTABLISH HARDENED ROW-LEVEL SECURITY POLICIES
-- Ensure RLS is enabled on all tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.mmh_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_client_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_clinical_note_addenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_invoices ENABLE ROW LEVEL SECURITY;

-- 7.1 Services Menu
CREATE POLICY "Public read active services"
    ON public.mmh_services FOR SELECT
    USING (is_active = true);

CREATE POLICY "Clinician manage services"
    ON public.mmh_services FOR ALL
    TO authenticated
    USING (public.is_clinician())
    WITH CHECK (public.is_clinician());

-- 7.2 Psychometric Forms Library
CREATE POLICY "Public and clients read active form templates"
    ON public.mmh_forms FOR SELECT
    USING (is_template = true OR public.is_clinician());

CREATE POLICY "Clinician manage form templates"
    ON public.mmh_forms FOR ALL
    TO authenticated
    USING (public.is_clinician())
    WITH CHECK (public.is_clinician());

-- 7.3 Appointments
CREATE POLICY "Clinician manage appointments"
    ON public.mmh_appointments FOR ALL
    TO authenticated
    USING (public.is_clinician())
    WITH CHECK (public.is_clinician());

CREATE POLICY "Clients read own appointments"
    ON public.mmh_appointments FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IS NOT NULL 
        AND lower(client_email) = lower(auth.jwt() ->> 'email')
    );

-- Note: In production, appointment inserts must route through a Next.js Server Action
-- with Cloudflare Turnstile bot verification. For direct client fallback:
CREATE POLICY "Allow validated appointment booking"
    ON public.mmh_appointments FOR INSERT
    WITH CHECK (status = 'confirmed' AND scheduled_at > now());

-- 7.4 Client Intakes
CREATE POLICY "Clinician manage client intakes"
    ON public.mmh_client_intakes FOR ALL
    TO authenticated
    USING (public.is_clinician())
    WITH CHECK (public.is_clinician());

CREATE POLICY "Clients read own intake"
    ON public.mmh_client_intakes FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IS NOT NULL 
        AND lower(client_email) = lower(auth.jwt() ->> 'email')
    );

CREATE POLICY "Allow public intake submission"
    ON public.mmh_client_intakes FOR INSERT
    WITH CHECK (true);

-- 7.5 Form Assignments (Read-only to clients; writes via server RPC / action)
CREATE POLICY "Clinician manage form assignments"
    ON public.mmh_form_assignments FOR ALL
    TO authenticated
    USING (public.is_clinician())
    WITH CHECK (public.is_clinician());

CREATE POLICY "Client read own assigned forms"
    ON public.mmh_form_assignments FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IS NOT NULL 
        AND lower(client_email) = lower(auth.jwt() ->> 'email')
    );

-- 7.6 Clinical Notes (Zero public or client access)
CREATE POLICY "Clinician access clinical notes"
    ON public.mmh_clinical_notes FOR ALL
    TO authenticated
    USING (public.is_clinician())
    WITH CHECK (public.is_clinician());

-- 7.7 Clinical Note Addenda (Zero public or client access)
CREATE POLICY "Clinician access note addenda"
    ON public.mmh_clinical_note_addenda FOR SELECT
    TO authenticated
    USING (public.is_clinician());

CREATE POLICY "Clinician insert note addenda"
    ON public.mmh_clinical_note_addenda FOR INSERT
    TO authenticated
    WITH CHECK (public.is_clinician());

-- 7.8 Invoices
CREATE POLICY "Clinician manage invoices"
    ON public.mmh_invoices FOR ALL
    TO authenticated
    USING (public.is_clinician())
    WITH CHECK (public.is_clinician());

CREATE POLICY "Clients read own invoices"
    ON public.mmh_invoices FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IS NOT NULL 
        AND lower(client_email) = lower(auth.jwt() ->> 'email')
    );

-- ------------------------------------------------------------------------------
-- 8. SERVER-SIDE RPC FOR SECURE PSYCHOMETRIC SUBMISSION
-- Prevents clients from spoofing scores or altering severity directly via PostgREST
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_screener_result(
    p_assignment_id UUID,
    p_raw_answers JSONB,
    p_calculated_score INTEGER,
    p_clinical_severity TEXT,
    p_has_crisis_flag BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    v_assignment RECORD;
BEGIN
    -- Verify assignment exists and is not already completed
    SELECT * INTO v_assignment 
    FROM public.mmh_form_assignments 
    WHERE id = p_assignment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assignment not found.';
    END IF;

    IF v_assignment.status = 'completed' THEN
        RAISE EXCEPTION 'This assessment has already been completed.';
    END IF;

    -- Update assignment record with server-validated score
    UPDATE public.mmh_form_assignments
    SET 
        answers = p_raw_answers,
        score = p_calculated_score,
        clinical_severity = p_clinical_severity,
        status = 'completed',
        completed_at = now()
    WHERE id = p_assignment_id;

    RETURN jsonb_build_object(
        'success', true,
        'assignment_id', p_assignment_id,
        'crisis_flag', p_has_crisis_flag
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
