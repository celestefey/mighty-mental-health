-- ==============================================================================
-- Mighty Mental Health: Concurrency Defense, Note Addenda & Server Scoring RPC
-- Migration: 20261029_concurrency_addenda_rpc.sql
-- ==============================================================================

-- 1. Enable btree_gist extension for temporal range exclusion
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Concurrency Defense on mmh_appointments
ALTER TABLE public.mmh_appointments 
    ADD COLUMN IF NOT EXISTS clinician_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

-- Backfill ends_at for existing records
UPDATE public.mmh_appointments
SET ends_at = scheduled_at + (COALESCE(duration_minutes, 60) || ' minutes')::INTERVAL
WHERE ends_at IS NULL;

-- Ensure clinician_id and ends_at are NOT NULL
ALTER TABLE public.mmh_appointments 
    ALTER COLUMN scheduled_at SET NOT NULL,
    ALTER COLUMN ends_at SET NOT NULL,
    ALTER COLUMN clinician_id SET NOT NULL;

-- Trigger to calculate ends_at automatically on insert or update
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

-- Enforce GiST exclusion constraint preventing overlapping active appointments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_sessions'
    ) THEN
        ALTER TABLE public.mmh_appointments
            ADD CONSTRAINT no_overlapping_sessions
            EXCLUDE USING gist (
                clinician_id WITH =,
                tstzrange(scheduled_at, ends_at) WITH &&
            )
            WHERE (status <> 'cancelled');
    END IF;
END $$;

-- 3. Dedicated Append-Only Clinical Note Addenda Table
CREATE TABLE IF NOT EXISTS public.mmh_clinical_note_addenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.mmh_clinical_notes(id) ON DELETE RESTRICT,
    clinician_id UUID,
    addendum_text TEXT NOT NULL,
    reason_for_amendment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger strictly forbidding UPDATE or DELETE on clinical note addenda
CREATE OR REPLACE FUNCTION public.prevent_addenda_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'PACFA Legal Standard: Clinical note addenda are permanent records and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_addenda_modification ON public.mmh_clinical_note_addenda;
CREATE TRIGGER trg_prevent_addenda_modification
    BEFORE UPDATE OR DELETE ON public.mmh_clinical_note_addenda
    FOR EACH ROW EXECUTE FUNCTION public.prevent_addenda_modification();

-- Enable RLS on addenda table
ALTER TABLE public.mmh_clinical_note_addenda ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clinician read note addenda" ON public.mmh_clinical_note_addenda;
CREATE POLICY "Clinician read note addenda" ON public.mmh_clinical_note_addenda FOR SELECT USING (public.is_clinician());
DROP POLICY IF EXISTS "Clinician insert note addenda" ON public.mmh_clinical_note_addenda;
CREATE POLICY "Clinician insert note addenda" ON public.mmh_clinical_note_addenda FOR INSERT WITH CHECK (public.is_clinician());

-- 4. Cryptographic Single-Use Screener Tokens in mmh_form_assignments
ALTER TABLE public.mmh_form_assignments
    ADD COLUMN IF NOT EXISTS token_hash TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- 5. Server-Side Psychometric Scoring RPC
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
    SELECT * INTO v_assignment FROM public.mmh_form_assignments WHERE id = p_assignment_id;
    IF NOT FOUND THEN 
        RAISE EXCEPTION 'Assessment assignment not found.'; 
    END IF;
    IF v_assignment.status = 'completed' THEN 
        RAISE EXCEPTION 'Assessment has already been completed and locked.'; 
    END IF;

    UPDATE public.mmh_form_assignments
    SET 
        answers = p_raw_answers,
        score_summary = jsonb_build_object(
            'totalScore', p_calculated_score,
            'clinicalSeverity', p_clinical_severity,
            'hasCrisisFlag', p_has_crisis_flag,
            'submittedAt', now()
        ),
        clinical_severity = p_clinical_severity,
        status = 'completed',
        completed_at = now()
    WHERE id = p_assignment_id;

    RETURN jsonb_build_object(
        'success', true, 
        'assignment_id', p_assignment_id, 
        'severity', p_clinical_severity,
        'crisis_flag', p_has_crisis_flag
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
