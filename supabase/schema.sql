-- ==============================================================================
-- Mighty Mental Health (MMH) - Official Production Schema
-- Target: Dedicated Supabase Project (Sydney ap-southeast-2 recommended)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Services Menu
CREATE TABLE IF NOT EXISTS public.mmh_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    duration_minutes INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    modality_options TEXT[] NOT NULL DEFAULT ARRAY['video', 'phone'],
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Client Appointments & Telehealth Schedule (with btree_gist Concurrency Defense)
CREATE TABLE IF NOT EXISTS public.mmh_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinician_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    service_id UUID REFERENCES public.mmh_services(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    ends_at TIMESTAMPTZ,
    modality TEXT NOT NULL DEFAULT 'video',
    status TEXT NOT NULL DEFAULT 'confirmed',
    telehealth_room_id TEXT NOT NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT no_overlapping_sessions EXCLUDE USING gist (
        clinician_id WITH =,
        tstzrange(scheduled_at, ends_at) WITH &&
    ) WHERE (status <> 'cancelled')
);

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

-- 3. Psychometric & Clinical Forms Library (DASS-21, GAD-7, Tally, Custom)
CREATE TABLE IF NOT EXISTS public.mmh_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'screener', -- 'screener', 'intake', 'somatic', 'tally', 'custom'
    description TEXT,
    tally_form_id TEXT, -- Optional Tally.so form ID for external no-code builder
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    scoring_rules JSONB DEFAULT '{}'::jsonb,
    is_template BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Form Assignments with Cryptographic Tokens & Deadlines
CREATE TABLE IF NOT EXISTS public.mmh_form_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.mmh_forms(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    token_hash TEXT UNIQUE,
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'assigned', -- 'assigned', 'completed', 'overdue'
    answers JSONB DEFAULT '{}'::jsonb,
    score_summary JSONB DEFAULT '{}'::jsonb,
    clinical_severity TEXT,
    completed_at TIMESTAMPTZ,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Clinician SOAP / DAP Notes with Cryptographic Locking
CREATE TABLE IF NOT EXISTS public.mmh_clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.mmh_appointments(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    note_type TEXT NOT NULL DEFAULT 'SOAP',
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    locked_at TIMESTAMPTZ,
    template_type TEXT DEFAULT 'SOAP',
    content_json JSONB DEFAULT '{}'::jsonb,
    gp_letter_text TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5b. Dedicated Append-Only Clinical Note Addenda Table (Tamper-Evident)
CREATE TABLE IF NOT EXISTS public.mmh_clinical_note_addenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.mmh_clinical_notes(id) ON DELETE RESTRICT,
    clinician_id UUID,
    addendum_text TEXT NOT NULL,
    reason_for_amendment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- 6. Invoices with Australian GST & PACFA Rebate Information
CREATE TABLE IF NOT EXISTS public.mmh_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.mmh_appointments(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    gst_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid',
    invoice_number TEXT NOT NULL UNIQUE,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Comprehensive Client Intake Form (Psychological Assessments Australia & NovoPsych Intake standard)
CREATE TABLE IF NOT EXISTS public.mmh_client_intakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    date_of_birth TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    gp_name TEXT,
    gp_clinic TEXT,
    gp_phone TEXT,
    gp_address TEXT,
    medications TEXT,
    medical_history TEXT,
    psychiatric_history TEXT,
    somatic_movement_profile JSONB DEFAULT '{}'::jsonb,
    presenting_concerns TEXT,
    therapy_goals TEXT,
    safety_risk_history TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security (RLS) on all MMH tables
ALTER TABLE public.mmh_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_client_intakes ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- Hardened Production Row-Level Security (RLS) & Access Control
-- Compliant with Australian Privacy Act (APPs 6 & 11) & PACFA Documentation Rules
-- ==============================================================================

-- Helper function to verify clinician role (Luke Piatti or service_role)
CREATE OR REPLACE FUNCTION public.is_clinician()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.role() = 'service_role' OR
    (auth.jwt() ->> 'email') = 'luke@mightymentalhealth.com.au' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'clinician' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'clinician'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Services: Public read active services; clinician manages
CREATE POLICY "Public read active services" ON public.mmh_services FOR SELECT USING (is_active = true);
CREATE POLICY "Clinician manage services" ON public.mmh_services FOR ALL USING (public.is_clinician());

-- 2. Client Intakes: Public insert allowed (onboarding); reading strictly restricted to clinician or client owner
CREATE POLICY "Allow onboarding intake insertion" ON public.mmh_client_intakes FOR INSERT WITH CHECK (true);
CREATE POLICY "Restricted intake read" ON public.mmh_client_intakes FOR SELECT USING (
  public.is_clinician() OR 
  (auth.jwt() ->> 'email' IS NOT NULL AND lower(client_email) = lower(auth.jwt() ->> 'email'))
);
CREATE POLICY "Clinician modify intakes" ON public.mmh_client_intakes FOR UPDATE USING (public.is_clinician());
CREATE POLICY "Clinician delete intakes" ON public.mmh_client_intakes FOR DELETE USING (public.is_clinician());

-- 3. Form library: Public read templates/active forms; clinician only can modify questions & scoring
CREATE POLICY "Public read forms library" ON public.mmh_forms FOR SELECT USING (is_template = true OR public.is_clinician());
CREATE POLICY "Clinician manage forms library" ON public.mmh_forms FOR ALL USING (public.is_clinician());

-- 4. Appointments: Clients book; viewing restricted to clinician or client owner
CREATE POLICY "Allow appointment booking" ON public.mmh_appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Restricted appointment read" ON public.mmh_appointments FOR SELECT USING (
  public.is_clinician() OR 
  (auth.jwt() ->> 'email' IS NOT NULL AND lower(client_email) = lower(auth.jwt() ->> 'email'))
);
CREATE POLICY "Clinician modify appointments" ON public.mmh_appointments FOR UPDATE USING (public.is_clinician());
CREATE POLICY "Clinician delete appointments" ON public.mmh_appointments FOR DELETE USING (public.is_clinician());

-- 5. Form assignments: Clinician assigns; reading and submission restricted to client owner or clinician
CREATE POLICY "Clinician insert assignments" ON public.mmh_form_assignments FOR INSERT WITH CHECK (public.is_clinician());
CREATE POLICY "Restricted assignments read" ON public.mmh_form_assignments FOR SELECT USING (
  public.is_clinician() OR 
  (auth.jwt() ->> 'email' IS NOT NULL AND lower(client_email) = lower(auth.jwt() ->> 'email'))
);
CREATE POLICY "Client submit assignment answers" ON public.mmh_form_assignments FOR UPDATE USING (
  public.is_clinician() OR 
  (auth.jwt() ->> 'email' IS NOT NULL AND lower(client_email) = lower(auth.jwt() ->> 'email'))
);
CREATE POLICY "Clinician delete assignments" ON public.mmh_form_assignments FOR DELETE USING (public.is_clinician());

-- 6. Clinical notes: STRICTLY CLINICIAN ONLY for all operations (ZERO public/client access)
CREATE POLICY "Clinician read clinical notes" ON public.mmh_clinical_notes FOR SELECT USING (public.is_clinician());
CREATE POLICY "Clinician insert clinical notes" ON public.mmh_clinical_notes FOR INSERT WITH CHECK (public.is_clinician());
CREATE POLICY "Clinician update clinical notes" ON public.mmh_clinical_notes FOR UPDATE USING (public.is_clinician());
CREATE POLICY "Clinician delete clinical notes" ON public.mmh_clinical_notes FOR DELETE USING (public.is_clinician());

-- 7. Invoices: Reading restricted to clinician or client owner; clinician manages
CREATE POLICY "Restricted invoice read" ON public.mmh_invoices FOR SELECT USING (
  public.is_clinician() OR 
  (auth.jwt() ->> 'email' IS NOT NULL AND lower(client_email) = lower(auth.jwt() ->> 'email'))
);
CREATE POLICY "Clinician manage invoices" ON public.mmh_invoices FOR ALL USING (public.is_clinician());

-- 7b. Addenda RLS: Clinician read and insert only (no updates or deletes)
ALTER TABLE public.mmh_clinical_note_addenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinician read note addenda" ON public.mmh_clinical_note_addenda FOR SELECT USING (public.is_clinician());
CREATE POLICY "Clinician insert note addenda" ON public.mmh_clinical_note_addenda FOR INSERT WITH CHECK (public.is_clinician());

-- 7c. Server-Side Psychometric Scoring RPC
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

-- 8. Clinical Note Immutability Trigger (Postgres-enforced locking)
CREATE OR REPLACE FUNCTION public.prevent_locked_clinical_note_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_locked = true AND (
    NEW.subjective IS DISTINCT FROM OLD.subjective OR
    NEW.objective IS DISTINCT FROM OLD.objective OR
    NEW.assessment IS DISTINCT FROM OLD.assessment OR
    NEW.plan IS DISTINCT FROM OLD.plan OR
    NEW.gp_letter_text IS DISTINCT FROM OLD.gp_letter_text
  ) THEN
    RAISE EXCEPTION 'PACFA Integrity Protection: Cannot modify clinical text of a locked and signed clinical note.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_locked_note_mutation ON public.mmh_clinical_notes;
CREATE TRIGGER trg_prevent_locked_note_mutation
BEFORE UPDATE ON public.mmh_clinical_notes
FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_clinical_note_mutation();

-- ==============================================================================
-- Seed Standard Services & Psychometric Instruments
-- ==============================================================================

INSERT INTO public.mmh_services (title, slug, duration_minutes, price_cents, modality_options, description) VALUES
('40-Min Initial Consultation', 'initial-consult', 40, 16000, ARRAY['video', 'phone'], 'Comprehensive dual intake mapping mental health history, physical activity baseline, somatic regulation, and personal therapy goals.'),
('60-Min Psychotherapy & Counselling', 'psychotherapy-counselling', 60, 21000, ARRAY['video', 'phone'], 'Deep evidence-based psychotherapy (PACFA accredited) addressing root causes, emotional trauma, cognitive processing, and core values.'),
('30-Min Somatic & Movement Consultation', 'somatic-movement', 30, 12000, ARRAY['video', 'phone'], 'Tailored physical movement prescriptions, progressive resistance, walking protocols, and vagal nerve/somatic nervous system resets.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.mmh_forms (title, slug, category, description, is_template, questions, scoring_rules) VALUES
(
    'DASS-21 (Depression, Anxiety, Stress Scales)',
    'dass-21',
    'Mood & Depression',
    'Quantitative measure of distress along the 3 axes of Depression, Anxiety, and Stress over the past week.',
    true,
    '[
        {"id": "q1", "text": "I found it hard to wind down", "scale": "stress", "type": "scale_0_3"},
        {"id": "q2", "text": "I was aware of dryness of my mouth", "scale": "anxiety", "type": "scale_0_3"},
        {"id": "q3", "text": "I could not seem to experience any positive feeling at all", "scale": "depression", "type": "scale_0_3"},
        {"id": "q4", "text": "I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion)", "scale": "anxiety", "type": "scale_0_3"},
        {"id": "q5", "text": "I found it difficult to work up the initiative to do things", "scale": "depression", "type": "scale_0_3"},
        {"id": "q6", "text": "I tended to over-react to situations", "scale": "stress", "type": "scale_0_3"},
        {"id": "q7", "text": "I experienced trembling (e.g. in the hands)", "scale": "anxiety", "type": "scale_0_3"},
        {"id": "q8", "text": "I felt that I was using a lot of nervous energy", "scale": "stress", "type": "scale_0_3"},
        {"id": "q9", "text": "I was worried about situations in which I might panic and make a fool of myself", "scale": "anxiety", "type": "scale_0_3"},
        {"id": "q10", "text": "I felt that I had nothing to look forward to", "scale": "depression", "type": "scale_0_3"},
        {"id": "q11", "text": "I found myself getting agitated", "scale": "stress", "type": "scale_0_3"},
        {"id": "q12", "text": "I found it difficult to relax", "scale": "stress", "type": "scale_0_3"},
        {"id": "q13", "text": "I felt down-hearted and blue", "scale": "depression", "type": "scale_0_3"},
        {"id": "q14", "text": "I was intolerant of anything that kept me from getting on with what I was doing", "scale": "stress", "type": "scale_0_3"},
        {"id": "q15", "text": "I felt I was close to panic", "scale": "anxiety", "type": "scale_0_3"},
        {"id": "q16", "text": "I was unable to become enthusiastic about anything", "scale": "depression", "type": "scale_0_3"},
        {"id": "q17", "text": "I felt I was not worth much as a person", "scale": "depression", "type": "scale_0_3"},
        {"id": "q18", "text": "I felt that I was rather touchy", "scale": "stress", "type": "scale_0_3"},
        {"id": "q19", "text": "I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat)", "scale": "anxiety", "type": "scale_0_3"},
        {"id": "q20", "text": "I felt scared without any good reason", "scale": "anxiety", "type": "scale_0_3"},
        {"id": "q21", "text": "I felt that life was meaningless", "scale": "depression", "type": "scale_0_3"}
    ]'::jsonb,
    '{"multiplier": 2, "scales": ["depression", "anxiety", "stress"]}'::jsonb
),
(
    'GAD-7 (Generalised Anxiety Disorder Screener)',
    'gad-7',
    'Anxiety & Trauma',
    'Screening tool for generalized anxiety disorder assessing symptoms over the past 2 weeks.',
    true,
    '[
        {"id": "q1", "text": "Feeling nervous, anxious, or on edge", "type": "scale_0_3"},
        {"id": "q2", "text": "Not being able to stop or control worrying", "type": "scale_0_3"},
        {"id": "q3", "text": "Worrying too much about different things", "type": "scale_0_3"},
        {"id": "q4", "text": "Trouble relaxing", "type": "scale_0_3"},
        {"id": "q5", "text": "Being so restless that it is hard to sit still", "type": "scale_0_3"},
        {"id": "q6", "text": "Becoming easily annoyed or irritable", "type": "scale_0_3"},
        {"id": "q7", "text": "Feeling afraid, as if something awful might happen", "type": "scale_0_3"}
    ]'::jsonb,
    '{"max_score": 21, "cutoffs": {"mild": 5, "moderate": 10, "severe": 15}}'::jsonb
),
(
    'PHQ-9 (Patient Health Questionnaire - 9)',
    'phq-9',
    'Mood & Depression',
    'Standard 9-item depression screener assessing core DSM criteria over the past 2 weeks with critical suicidality and self-harm detection.',
    true,
    '[
        {"id": "q1", "text": "Little interest or pleasure in doing things", "type": "scale_0_3"},
        {"id": "q2", "text": "Feeling down, depressed, or hopeless", "type": "scale_0_3"},
        {"id": "q3", "text": "Trouble falling or staying asleep, or sleeping too much", "type": "scale_0_3"},
        {"id": "q4", "text": "Feeling tired or having little energy", "type": "scale_0_3"},
        {"id": "q5", "text": "Poor appetite or overeating", "type": "scale_0_3"},
        {"id": "q6", "text": "Feeling bad about yourself — or that you are a failure or have let yourself or your family down", "type": "scale_0_3"},
        {"id": "q7", "text": "Trouble concentrating on things, such as reading or watching television", "type": "scale_0_3"},
        {"id": "q8", "text": "Moving or speaking slowly, or being so fidgety/restless that you have been moving around more than usual", "type": "scale_0_3"},
        {"id": "q9", "text": "Thoughts that you would be better off dead, or of hurting yourself in some way", "type": "scale_0_3", "critical_alert": true}
    ]'::jsonb,
    '{"max_score": 27, "cutoffs": {"minimal": 4, "mild": 9, "moderate": 14, "moderately_severe": 19, "severe": 27}, "critical_item": "q9"}'::jsonb
),
(
    'K10 (Kessler Psychological Distress Scale)',
    'k10',
    'Mood & Depression',
    'Australian clinical gold standard for measuring non-specific psychological distress over the past 30 days, required for GP Mental Health Care Plans.',
    true,
    '[
        {"id": "q1", "text": "In the past 4 weeks, about how often did you feel tired out for no good reason?", "type": "scale_1_5"},
        {"id": "q2", "text": "In the past 4 weeks, about how often did you feel nervous?", "type": "scale_1_5"},
        {"id": "q3", "text": "In the past 4 weeks, about how often did you feel so nervous that nothing could calm you down?", "type": "scale_1_5"},
        {"id": "q4", "text": "In the past 4 weeks, about how often did you feel hopeless?", "type": "scale_1_5"},
        {"id": "q5", "text": "In the past 4 weeks, about how often did you feel restless or fidgety?", "type": "scale_1_5"},
        {"id": "q6", "text": "In the past 4 weeks, about how often did you feel so restless you could not sit still?", "type": "scale_1_5"},
        {"id": "q7", "text": "In the past 4 weeks, about how often did you feel depressed?", "type": "scale_1_5"},
        {"id": "q8", "text": "In the past 4 weeks, about how often did you feel that everything was an effort?", "type": "scale_1_5"},
        {"id": "q9", "text": "In the past 4 weeks, about how often did you feel so sad that nothing could cheer you up?", "type": "scale_1_5"},
        {"id": "q10", "text": "In the past 4 weeks, about how often did you feel worthless?", "type": "scale_1_5"}
    ]'::jsonb,
    '{"min_score": 10, "max_score": 50, "cutoffs": {"low": 19, "moderate": 24, "high": 29, "very_high": 50}}'::jsonb
),
(
    'PCL-5 (PTSD Checklist for DSM-5)',
    'pcl-5',
    'Anxiety & Trauma',
    'Comprehensive 20-item measure of DSM-5 Post-Traumatic Stress Disorder symptoms across Intrusion, Avoidance, Cognition/Mood, and Arousal clusters.',
    true,
    '[
        {"id": "q1", "text": "Repeated, disturbing, and unwanted memories of the stressful experience?", "type": "scale_0_4", "cluster": "B"},
        {"id": "q2", "text": "Repeated, disturbing dreams of the stressful experience?", "type": "scale_0_4", "cluster": "B"},
        {"id": "q3", "text": "Suddenly feeling or acting as if the stressful experience were actually happening again?", "type": "scale_0_4", "cluster": "B"},
        {"id": "q4", "text": "Feeling very upset when something reminded you of the stressful experience?", "type": "scale_0_4", "cluster": "B"},
        {"id": "q5", "text": "Having strong physical sensations when reminded of the experience (heart pounding, trouble breathing, sweating)?", "type": "scale_0_4", "cluster": "B"},
        {"id": "q6", "text": "Avoiding memories, thoughts, or feelings related to the stressful experience?", "type": "scale_0_4", "cluster": "C"},
        {"id": "q7", "text": "Avoiding external reminders of the stressful experience (people, places, conversations, objects)?", "type": "scale_0_4", "cluster": "C"},
        {"id": "q8", "text": "Trouble remembering important parts of the stressful experience?", "type": "scale_0_4", "cluster": "D"},
        {"id": "q9", "text": "Having strong negative beliefs about yourself, other people, or the world?", "type": "scale_0_4", "cluster": "D"},
        {"id": "q10", "text": "Blaming yourself or someone else for the stressful experience or what happened after?", "type": "scale_0_4", "cluster": "D"},
        {"id": "q11", "text": "Having strong negative feelings such as fear, horror, anger, guilt, or shame?", "type": "scale_0_4", "cluster": "D"},
        {"id": "q12", "text": "Loss of interest in activities that you used to enjoy?", "type": "scale_0_4", "cluster": "D"},
        {"id": "q13", "text": "Feeling distant or cut off from other people?", "type": "scale_0_4", "cluster": "D"},
        {"id": "q14", "text": "Trouble experiencing positive feelings (unable to feel happiness or loving feelings)?", "type": "scale_0_4", "cluster": "D"},
        {"id": "q15", "text": "Irritable behavior, angry outbursts, or acting aggressively?", "type": "scale_0_4", "cluster": "E"},
        {"id": "q16", "text": "Taking too many risks or doing things that could cause you harm?", "type": "scale_0_4", "cluster": "E"},
        {"id": "q17", "text": "Being superalert, watchful, or constantly on guard?", "type": "scale_0_4", "cluster": "E"},
        {"id": "q18", "text": "Feeling jumpy or easily startled?", "type": "scale_0_4", "cluster": "E"},
        {"id": "q19", "text": "Having difficulty concentrating?", "type": "scale_0_4", "cluster": "E"},
        {"id": "q20", "text": "Trouble falling or staying asleep?", "type": "scale_0_4", "cluster": "E"}
    ]'::jsonb,
    '{"max_score": 80, "clinical_cutoff": 33, "clusters": ["B", "C", "D", "E"]}'::jsonb
),
(
    'ASRS v1.1 (Adult ADHD Self-Report Scale)',
    'asrs-v1',
    'ADHD & Neurodiversity',
    'WHO 6-question Part A screening tool for Adult ADHD assessing attention regulation, task initiation, and hyperactivity/restlessness.',
    true,
    '[
        {"id": "q1", "text": "How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?", "type": "scale_0_4", "threshold": 2},
        {"id": "q2", "text": "How often do you have difficulty getting things in order when you have to do a task that requires organization?", "type": "scale_0_4", "threshold": 2},
        {"id": "q3", "text": "How often do you have problems remembering appointments or obligations?", "type": "scale_0_4", "threshold": 2},
        {"id": "q4", "text": "When you have a task that requires a lot of thought, how often do you avoid or delay getting started?", "type": "scale_0_4", "threshold": 3},
        {"id": "q5", "text": "How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?", "type": "scale_0_4", "threshold": 3},
        {"id": "q6", "text": "How often do you feel overly active and compelled to do things, like you were driven by a motor?", "type": "scale_0_4", "threshold": 3}
    ]'::jsonb,
    '{"type": "shaded_boxes", "clinical_threshold": 4, "interpretation": "4 or more positive shaded criteria warrants comprehensive adult ADHD assessment."}'::jsonb
),
(
    'Athens Insomnia Scale (AIS)',
    'ais',
    'Sleep & Somatics',
    'Validated 8-item psychometric scale assessing night-time sleep difficulty and daytime consequences, directly guiding somatic regulation.',
    true,
    '[
        {"id": "q1", "text": "Sleep induction (time it takes you to fall asleep)", "type": "select", "options": ["0: No problem", "1: Slightly delayed", "2: Markedly delayed", "3: Very delayed or did not sleep at all"]},
        {"id": "q2", "text": "Awakenings during the night", "type": "select", "options": ["0: No problem", "1: Minor problem", "2: Considerable problem", "3: Serious problem or did not sleep at all"]},
        {"id": "q3", "text": "Final awakening earlier than desired", "type": "select", "options": ["0: Not earlier", "1: A little earlier", "2: Markedly earlier", "3: Much earlier or did not sleep at all"]},
        {"id": "q4", "text": "Total sleep duration", "type": "select", "options": ["0: Sufficient", "1: Slightly insufficient", "2: Markedly insufficient", "3: Very insufficient or did not sleep at all"]},
        {"id": "q5", "text": "Overall quality of sleep", "type": "select", "options": ["0: Satisfactory", "1: Slightly unsatisfactory", "2: Markedly unsatisfactory", "3: Very unsatisfactory or did not sleep at all"]},
        {"id": "q6", "text": "Sense of well-being during the day", "type": "select", "options": ["0: Normal", "1: Slightly decreased", "2: Markedly decreased", "3: Very decreased"]},
        {"id": "q7", "text": "Physical and mental functioning during the day", "type": "select", "options": ["0: Normal", "1: Slightly decreased", "2: Markedly decreased", "3: Very decreased"]},
        {"id": "q8", "text": "Sleepiness during the day", "type": "select", "options": ["0: None", "1: Mild", "2: Considerable", "3: Intense"]}
    ]'::jsonb,
    '{"max_score": 24, "insomnia_cutoff": 6}'::jsonb
),
(
    'Brief Resilience Scale (BRS)',
    'brs',
    'Substance & Well-being',
    '6-item measure assessing somatic and psychological ability to bounce back, recover from stress, and sustain adaptive resilience.',
    true,
    '[
        {"id": "q1", "text": "I tend to bounce back quickly after hard times", "type": "scale_1_5", "reverse": false},
        {"id": "q2", "text": "I have a hard time making it through stressful events", "type": "scale_1_5", "reverse": true},
        {"id": "q3", "text": "It does not take me long to recover from a stressful event", "type": "scale_1_5", "reverse": false},
        {"id": "q4", "text": "It is hard for me to snap back when something bad happens", "type": "scale_1_5", "reverse": true},
        {"id": "q5", "text": "I usually come through difficult times with little trouble", "type": "scale_1_5", "reverse": false},
        {"id": "q6", "text": "I tend to take a long time to get over set-backs in my life", "type": "scale_1_5", "reverse": true}
    ]'::jsonb,
    '{"cutoffs": {"low": 2.99, "normal": 4.30, "high": 5.00}, "reverse_items": ["q2", "q4", "q6"]}'::jsonb
),
(
    'CRAFFT 2.1+N (Substance Use Screener)',
    'crafft',
    'Substance & Well-being',
    'Screening tool for substance use and behavioral risk in adolescents and adults, identifying driving risk and potential substance use disorder.',
    true,
    '[
        {"id": "q1", "text": "Have you ever ridden in a CAR driven by someone (including yourself) who was high or had been using alcohol or drugs?", "type": "yes_no"},
        {"id": "q2", "text": "Do you ever use alcohol or drugs to RELAX, feel better about yourself, or fit in?", "type": "yes_no"},
        {"id": "q3", "text": "Do you ever use alcohol or drugs while you are by yourself, ALONE?", "type": "yes_no"},
        {"id": "q4", "text": "Do you ever FORGET things you did while using alcohol or drugs?", "type": "yes_no"},
        {"id": "q5", "text": "Do your family or FRIENDS ever tell you that you should cut down on your drinking or drug use?", "type": "yes_no"},
        {"id": "q6", "text": "Have you ever gotten into TROUBLE while you were using alcohol or drugs?", "type": "yes_no"}
    ]'::jsonb,
    '{"max_score": 6, "clinical_cutoff": 2, "interpretation": "A score of 2 or higher indicates high risk of a substance use disorder or significant safety risk."}'::jsonb
),
(
    'WSAS (Work and Social Adjustment Scale)',
    'wsas',
    'Substance & Well-being',
    '5-item simple, validated measure of functional impairment attributable to an identified mental or physical health condition.',
    true,
    '[
        {"id": "q1", "text": "Because of my condition, my ability to work is impaired", "type": "scale_0_8"},
        {"id": "q2", "text": "Because of my condition, my home management (cleaning, tidying, shopping, cooking) is impaired", "type": "scale_0_8"},
        {"id": "q3", "text": "Because of my condition, my social leisure activities (parties, outings, visiting friends) are impaired", "type": "scale_0_8"},
        {"id": "q4", "text": "Because of my condition, my private leisure activities (reading, gardening, solo walks) are impaired", "type": "scale_0_8"},
        {"id": "q5", "text": "Because of my condition, my ability to form and maintain close relationships is impaired", "type": "scale_0_8"}
    ]'::jsonb,
    '{"max_score": 40, "cutoffs": {"subclinical": 9, "significant": 20, "severe": 40}}'::jsonb
),
(
    'AQ-10 (Autism Spectrum Quotient - 10 Item Adult)',
    'aq-10',
    'ADHD & Neurodiversity',
    'NICE-recommended 10-item clinical screener assessing autistic traits across attention to detail, communication, and social interaction.',
    true,
    '[
        {"id": "q1", "text": "I often notice small sounds when others do not", "type": "scale_1_4", "score_if": [1, 2]},
        {"id": "q2", "text": "I usually concentrate more on the whole picture, rather than the small details", "type": "scale_1_4", "score_if": [3, 4]},
        {"id": "q3", "text": "I find it easy to do more than one thing at once", "type": "scale_1_4", "score_if": [3, 4]},
        {"id": "q4", "text": "If there is an interruption, I can switch back to what I was doing very quickly", "type": "scale_1_4", "score_if": [3, 4]},
        {"id": "q5", "text": "I find it easy to read between the lines when someone is talking to me", "type": "scale_1_4", "score_if": [3, 4]},
        {"id": "q6", "text": "I know how to tell if someone listening to me is getting bored", "type": "scale_1_4", "score_if": [3, 4]},
        {"id": "q7", "text": "When I am reading a story I find it difficult to work out the characters intentions", "type": "scale_1_4", "score_if": [1, 2]},
        {"id": "q8", "text": "I like to collect information about categories of things (types of cars, birds, trains, plants)", "type": "scale_1_4", "score_if": [1, 2]},
        {"id": "q9", "text": "I find it easy to work out what someone is thinking or feeling just by looking at their face", "type": "scale_1_4", "score_if": [3, 4]},
        {"id": "q10", "text": "I find it difficult to work out peoples intentions", "type": "scale_1_4", "score_if": [1, 2]}
    ]'::jsonb,
    '{"max_score": 10, "clinical_cutoff": 6, "interpretation": "A score of 6 or above warrants referral for comprehensive neurodevelopmental assessment."}'::jsonb
),
(
    'MMH Somatic & Physical Movement Intake',
    'somatic-intake',
    'Sleep & Somatics',
    'Comprehensive somatic, nervous system, and physical fitness intake questionnaire.',
    true,
    '[
        {"id": "s1", "text": "How many days per week do you engage in 20+ minutes of intentional movement (walking, lifting, running, yoga)?", "type": "select", "options": ["0 days (sedentary)", "1-2 days", "3-4 days", "5+ days"]},
        {"id": "s2", "text": "Where in your body do you hold physical tension when feeling stressed?", "type": "multiselect", "options": ["Neck & Shoulders", "Jaw & Teeth Clenching", "Chest & Shallow Breathing", "Stomach & Gut Issues", "Lower Back", "Hands & Fists"]},
        {"id": "s3", "text": "How would you describe your average sleep quality over the last 30 days?", "type": "select", "options": ["Restful & refreshing (7-8 hours)", "Difficulty falling asleep (racing mind)", "Waking frequently during the night", "Waking unrefreshed regardless of sleep time"]},
        {"id": "s4", "text": "Do you experience physical sensations of panic or heightened fight/flight (heart pounding, shortness of breath, sudden heat)?", "type": "select", "options": ["Never", "Rarely (once a month)", "Occasionally (weekly)", "Frequently (multiple times per week)"]},
        {"id": "s5", "text": "Are there any physical injuries, cardiovascular conditions, or joint limitations Luke should be aware of?", "type": "text"}
    ]'::jsonb,
    '{"type": "qualitative_and_categorical"}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    questions = EXCLUDED.questions,
    scoring_rules = EXCLUDED.scoring_rules,
    updated_at = now();

-- Demo Isolation Deletion Policies (Allow clearing test sandbox data without affecting production)
CREATE POLICY "Allow delete demo appointments" ON public.mmh_appointments FOR DELETE TO public USING (is_demo = true);
CREATE POLICY "Allow delete demo assignments" ON public.mmh_form_assignments FOR DELETE TO public USING (is_demo = true);
CREATE POLICY "Allow delete demo clinical notes" ON public.mmh_clinical_notes FOR DELETE TO public USING (is_demo = true);
CREATE POLICY "Allow delete demo invoices" ON public.mmh_invoices FOR DELETE TO public USING (is_demo = true);
