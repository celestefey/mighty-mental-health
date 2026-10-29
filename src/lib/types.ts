export type UserRole = 'client' | 'clinician' | 'admin';

export interface MMHService {
  id: string;
  title: string;
  slug: string;
  duration_minutes: number;
  price_cents: number;
  modality_options: ('video' | 'phone')[];
  description: string;
  is_active: boolean;
}

export interface MMHAppointment {
  id: string;
  clinician_id?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_id: string;
  scheduled_at: string;
  ends_at?: string;
  duration_minutes: number;
  modality: 'video' | 'phone';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  telehealth_room_id: string;
  notes?: string;
  is_demo?: boolean;
  created_at: string;
  service?: MMHService;
}

export interface ScreenerQuestion {
  id: string;
  text: string;
  type: 'scale_0_3' | 'scale_1_5' | 'scale_0_4' | 'scale_0_8' | 'scale_1_4' | 'yes_no' | 'select' | 'multiselect' | 'text' | 'scale_1_10' | string;
  scale?: string; // e.g. 'depression', 'anxiety', 'stress'
  options?: string[];
  threshold?: number;
  reverse?: boolean;
  cluster?: string;
  critical_alert?: boolean;
}

export interface MMHForm {
  id: string;
  title: string;
  slug: string;
  category: 'screener' | 'intake' | 'somatic' | 'custom' | 'Mood & Depression' | 'Anxiety & Trauma' | 'ADHD & Neurodiversity' | 'Sleep & Somatics' | 'Substance & Well-being' | string;
  description: string;
  questions: ScreenerQuestion[];
  scoring_rules?: Record<string, any>;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface MMHFormAssignment {
  id: string;
  form_id: string;
  client_name: string;
  client_email: string;
  token_hash?: string;
  expires_at?: string;
  used_at?: string;
  deadline: string;
  status: 'assigned' | 'completed' | 'overdue';
  answers?: Record<string, any>;
  score_summary?: Record<string, any>;
  clinical_severity?: string;
  completed_at?: string;
  is_demo?: boolean;
  created_at: string;
  form?: MMHForm;
}

export type ClinicalTemplateType = 
  | 'SOAP'
  | 'first-session'
  | 'risk-assessment'
  | 'aod'
  | 'gp-first-session'
  | 'gp-progress-update';

export interface MMHClinicalNoteAddendum {
  id: string;
  note_id: string;
  clinician_id?: string;
  addendum_text: string;
  reason_for_amendment: string;
  created_at: string;
}

export interface MMHClinicalNote {
  id: string;
  appointment_id?: string;
  client_name: string;
  client_email: string;
  note_type: 'SOAP' | 'DAP' | 'template';
  template_type?: ClinicalTemplateType;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  content_json?: Record<string, any>;
  gp_letter_text?: string;
  is_locked: boolean;
  locked_at?: string;
  addenda?: MMHClinicalNoteAddendum[];
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
}

export interface MMHClientIntake {
  id?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  gp_name?: string;
  gp_clinic?: string;
  gp_phone?: string;
  gp_address?: string;
  medications?: string;
  medical_history?: string;
  psychiatric_history?: string;
  somatic_movement_profile?: {
    movement_frequency?: string;
    tension_areas?: string[];
    sleep_quality?: string;
    panic_fight_flight_symptoms?: string;
    physical_injuries_limitations?: string;
  };
  presenting_concerns?: string;
  therapy_goals?: string;
  safety_risk_history?: string;
  is_demo?: boolean;
  created_at?: string;
}

export interface MMHInvoice {
  id: string;
  appointment_id?: string;
  client_name: string;
  client_email: string;
  amount_cents: number;
  gst_cents: number;
  status: 'paid' | 'pending' | 'refunded';
  invoice_number: string;
  is_demo?: boolean;
  created_at: string;
}
