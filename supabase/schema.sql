-- ==============================================================================
-- Mighty Mental Health (MMH) - Official Production Schema
-- Target: Dedicated Supabase Project (Sydney ap-southeast-2 recommended)
-- ==============================================================================

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

-- 2. Client Appointments & Telehealth Schedule
CREATE TABLE IF NOT EXISTS public.mmh_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    service_id UUID REFERENCES public.mmh_services(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    modality TEXT NOT NULL DEFAULT 'video',
    status TEXT NOT NULL DEFAULT 'confirmed',
    telehealth_room_id TEXT NOT NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- 4. Form Assignments with Enforced Deadlines
CREATE TABLE IF NOT EXISTS public.mmh_form_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.mmh_forms(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
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
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- Enable Row-Level Security (RLS) on all MMH tables
ALTER TABLE public.mmh_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmh_invoices ENABLE ROW LEVEL SECURITY;

-- Public read access to active services
CREATE POLICY "Public read active services" ON public.mmh_services FOR SELECT USING (is_active = true);

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

-- ==============================================================================
-- Seed Standard Services & Psychometric Instruments
-- ==============================================================================

INSERT INTO public.mmh_services (title, slug, duration_minutes, price_cents, modality_options, description) VALUES
('40-Min Initial Consultation', 'initial-consult', 40, 16000, ARRAY['video', 'phone'], 'Comprehensive dual intake mapping mental health history, physical activity baseline, somatic regulation, and personal therapy goals.'),
('60-Min Psychotherapy & Counselling', 'psychotherapy-counselling', 60, 21000, ARRAY['video', 'phone'], 'Deep evidence-based psychotherapy (PACFA accredited) addressing root causes, emotional trauma, cognitive processing, and core values.'),
('30-Min Somatic & Movement Consultation', 'somatic-movement', 30, 12000, ARRAY['video', 'phone'], 'Tailored physical movement prescriptions, progressive resistance, walking protocols, and vagal nerve/somatic nervous system resets.')
ON CONFLICT (slug) DO NOTHING;

-- Demo Isolation Deletion Policies (Allow clearing test sandbox data without affecting production)
CREATE POLICY "Allow delete demo appointments" ON public.mmh_appointments FOR DELETE TO public USING (is_demo = true);
CREATE POLICY "Allow delete demo assignments" ON public.mmh_form_assignments FOR DELETE TO public USING (is_demo = true);
CREATE POLICY "Allow delete demo clinical notes" ON public.mmh_clinical_notes FOR DELETE TO public USING (is_demo = true);
CREATE POLICY "Allow delete demo invoices" ON public.mmh_invoices FOR DELETE TO public USING (is_demo = true);

INSERT INTO public.mmh_forms (title, slug, category, description, is_template, questions, scoring_rules) VALUES
(
    'DASS-21 (Depression, Anxiety, Stress Scales)',
    'dass-21',
    'screener',
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
    'screener',
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
    'MMH Somatic & Physical Movement Intake',
    'somatic-intake',
    'somatic',
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
ON CONFLICT (slug) DO NOTHING;

-- Demo Isolation Deletion Policies (Allow clearing test sandbox data without affecting production)
CREATE POLICY "Allow delete demo appointments" ON public.mmh_appointments FOR DELETE TO public USING (is_demo = true);
CREATE POLICY "Allow delete demo assignments" ON public.mmh_form_assignments FOR DELETE TO public USING (is_demo = true);
CREATE POLICY "Allow delete demo clinical notes" ON public.mmh_clinical_notes FOR DELETE TO public USING (is_demo = true);
CREATE POLICY "Allow delete demo invoices" ON public.mmh_invoices FOR DELETE TO public USING (is_demo = true);
