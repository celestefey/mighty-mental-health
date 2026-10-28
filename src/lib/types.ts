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
  client_name: string;
  client_email: string;
  client_phone: string;
  service_id: string;
  scheduled_at: string;
  duration_minutes: number;
  modality: 'video' | 'phone';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  telehealth_room_id: string;
  notes?: string;
  created_at: string;
  service?: MMHService;
}

export interface ScreenerQuestion {
  id: string;
  text: string;
  type: 'scale_0_3' | 'select' | 'multiselect' | 'text' | 'scale_1_10';
  scale?: string; // e.g. 'depression', 'anxiety', 'stress'
  options?: string[];
}

export interface MMHForm {
  id: string;
  title: string;
  slug: string;
  category: 'screener' | 'intake' | 'somatic' | 'custom';
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
  deadline: string;
  status: 'assigned' | 'completed' | 'overdue';
  answers?: Record<string, any>;
  score_summary?: Record<string, any>;
  clinical_severity?: string;
  completed_at?: string;
  created_at: string;
  form?: MMHForm;
}

export interface MMHClinicalNote {
  id: string;
  appointment_id?: string;
  client_name: string;
  client_email: string;
  note_type: 'SOAP' | 'DAP';
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  is_locked: boolean;
  locked_at?: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
}
